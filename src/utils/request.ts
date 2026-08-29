import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import proxy from '../config/host';
import router from '../router/index';
import store from '@/store';
import { AesDecrypt, AesEncrypt, isObject } from './usuallytool'
import { ensureSecSession, currentKeyId, secEncrypt, secDecrypt, isSecPayload, resetSecSession } from './seccrypto'
import { clearLocalStorageExceptPreserved,saveCurrentUrl } from '@/constants';
import { getRequestTimeout, DEFAULT_REQUEST_TIMEOUT } from '@/config/requestTimeout';
import { NotifyPlugin, DialogPlugin, MessagePlugin } from 'tdesign-vue';
import { pushLocalNotice, resetLocalNoticeOnLogout } from './localnotice';

// 扩展 axios 配置：请求失败要不要弹提示由这两个标记（连同请求方法）决定，
// 见 SamWafTechDoc/开发规则规范/2026-08-28-前端全局提示与铃铛消息.md
declare module 'axios' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface AxiosRequestConfig {
    /** 强制当作后台请求：失败只进小铃铛，不弹通知 */
    background?: boolean;
    /** 强制当作前台请求：失败照常弹通知（GET 默认不弹时用它覆盖） */
    foreground?: boolean;
  }
}

// 连接失败(网络/跨域)提示：每次页面加载最多提示一次，避免刷屏
let netErrNotified = false;

// 页面自动发起的请求（轮询、进页面就跑的检查）失败时不弹通知，只进小铃铛：
// 无外网环境下这类请求会持续失败，弹出来就是一条条把右侧堆满。
// 用户亲手点出来的请求仍然弹，但改为 10 秒自动消失，并按同一窗口节流，
// 保证屏幕上最多只有一条。原先是 duration:0(永不消失) + 3 秒节流，
// 拦不住 5 秒一次的轮询。
const TIMEOUT_NOTIFY_DURATION = 10000;
// 「无法连接后端」信息量更大（带解决办法入口），给长一点，但同样会自己消失
const NETERR_NOTIFY_DURATION = 15000;
// 连续超时的计数窗口：超过这个间隔没再超时就重新从 1 数起
const TIMEOUT_COUNT_WINDOW = 60000;
let lastTimeoutNotifyAt = 0;
let lastTimeoutAt = 0;
let timeoutCount = 0;

// 判断一个失败要不要弹出来打扰用户。
//
// 全站有几百个请求，靠逐个打 background 标记必然漏（页面 mounted 里的列表加载最典型），
// 所以改成按语义给默认值：
//   GET / HEAD  —— 读取展示类，失败了页面自己会是空状态，弹卡片只会糊屏 → 只进铃铛
//   POST 等写操作 —— 用户提交了东西，必须让他知道没成功 → 弹
// 需要反过来的地方用 background / foreground 显式覆盖。
function isBackgroundRequest(cfg: any): boolean {
  if (!cfg) return true;
  if (cfg.background === true) return true;
  if (cfg.foreground === true) return false;
  const method = String(cfg.method || 'get').toLowerCase();
  return method === 'get' || method === 'head';
}

// 弹出"解决办法"详情对话框（内容较长，用对话框保证完整可读，不被通知截断）
function showNetErrDetail(origin: string) {
  let dialog: any;
  dialog = DialogPlugin.alert({
    header: '无法连接后端（可能跨域 CORS 被拦截）',
    body: `请确认后端服务已启动。若前端跨域访问被拦截(CORS)，请把当前来源 ${origin} 填入后端 conf/config.yml 的 security.cors_allow_origins 字段（多个用英文逗号分隔）后重启后端；或登录后在「系统配置」页的「CORS 跨域白名单」卡片填写。`,
    confirmBtn: '知道了',
    onConfirm: () => dialog.hide(),
  });
}

// 超时后“重试”：重新发起同一请求（请求拦截器会刷新 X-Request-Time/X-Request-Id，不会触发防重放）。
// 仅重发这一条请求，不刷新整页，避免丢失表单等状态。
function retryTimedOutRequest(config: any) {
  if (!config) return;
  instance
    .request(config)
    .then(() => MessagePlugin.success('重试成功'))
    .catch(() => { /* 再次失败会由拦截器再次提示，无需重复处理 */ });
}

// 应急恢复入口：原 App.vue 的「检测到前端运行异常 → 进入紧急模式」合并到此，仅在后端配置了应急入口时可用。
function getEmergencyPath(): string {
  try {
    return (store as any)?.state?.sysparams?.emergencyPath || '';
  } catch (e) {
    return '';
  }
}
function showEmergencyRecovery() {
  const path = getEmergencyPath();
  if (!path) {
    MessagePlugin.warning('当前未启用应急入口，无法进入应急模式');
    return;
  }
  let dialog: any;
  dialog = DialogPlugin.confirm({
    header: '应急恢复模式',
    body: '[适用于升级异常场景] 若升级后前端/后端异常，可进入应急恢复模式，在不依赖前端的情况下执行版本回退。是否进入？',
    confirmBtn: '进入紧急模式',
    cancelBtn: '取消',
    onConfirm: () => {
      window.location.href = path + '?back=' + encodeURIComponent(window.location.href);
      dialog.hide();
    },
    onCancel: () => dialog.hide(),
  });
}

const env = import.meta.env.MODE || 'development';

const API_HOST = env === 'mock' ? '/' : proxy[env].API; // 如果是mock模式 就不配置host 会走本地Mock拦截

const CODE = {
  LOGIN_TIMEOUT: 1000,
  REQUEST_SUCCESS: 0,
  REQUEST_FOBID: 1001,
  AUTH_FAILURE: -999,
  NEED_BIND_2FA: -3,
  NEED_CHANGE_PWD: -4,
  NEED_REHANDSHAKE: -5
};

const instance = axios.create({
  baseURL: API_HOST,
  // 不在此写死超时：改到请求拦截器里按 localStorage 动态取（getRequestTimeout），
  // 这样"系统配置页-前端请求超时"改完立即生效，无需刷新；单条请求也可自带更长超时（如 AI 生成）。
  timeout: 0,
  withCredentials: true,
  transformRequest: [
    function (data, headers) {
      // 这里没有对 Form-Data 格式的报文处理
      if (isObject(data)) {
        // 一、请求参数加密：有会话密钥走 v2(swt2)，否则回落 legacy。
        // 握手已在请求拦截器里完成，这里是同步的（tweetnacl 无异步接口）。
        data = JSON.stringify(data)
        const sec = secEncrypt(data)
        data = sec !== null ? sec : AesEncrypt(data)
        return data
      }
      return data
    }
  ],
});

// eslint-disable-next-line
// @ts-ignore
// axios的retry ts类型有问题
instance.interceptors.retry = 3;


instance.interceptors.request.use(
  async (config: any) => {
    // 先确保本标签页有可用的会话密钥；握手失败(旧后端没有该接口等)就回落 legacy 通道。
    // 放在拦截器里 await，后面的 transformRequest 才能同步拿到密钥。
    await ensureSecSession()
    const keyId = currentKeyId()
    if (keyId) {
      config.headers['X-Sec-Ver'] = '2'
      config.headers['X-Key-Id'] = keyId
    }
    // 留一份未加密的报文：会话密钥失效需要重发时，得用新密钥重新加密，
    // 而 config.data 此刻之后就会被 transformRequest 换成密文字符串。
    if (config.__rawData === undefined) config.__rawData = config.data

    let token: string = localStorage.getItem("access_token") ? localStorage.getItem("access_token") : "" //此处换成自己获取回来的token，通常存在在cookie或者store里面
    if (token) {
      // 让每个请求携带token-- ['X-Token']为自定义key 请根据实际情况自行修改
      config.headers['X-Token'] = token
      //config.headers.Authorization =  + token
    }
    /*if(config.headers['Content-Type'] !=undefined && config.headers['Content-Type']=="application/json" ){
      data = JSON.stringify(config.data)

      config.data = AesEncrypt(data) // 加密请求参数
    }
    console.log("request",config)*/
    config.headers['X-Request-Time'] = Math.floor(Date.now() / 1000).toString()
    config.headers['X-Request-Id'] = uuidv4()
    // 未显式指定超时的请求，按当前 localStorage 配置动态套用（0/未设都视为未指定）；
    // 单条请求自带的超时（如 AI 生成的长超时）保持不变。
    if (!config.timeout) {
      config.timeout = getRequestTimeout()
    }
    return config
  },
  error => {
    // Do something with request error
    console.log("出错啦", error) // for debug
    Promise.reject(error)
  }
)
instance.interceptors.response.use(
  (response) => {
    if (response.status === 200) {
      const { data } = response;
      if (data.code === CODE.REQUEST_SUCCESS) {
        // v2 报文优先；服务端会话失效时会回落 legacy，这里同样兜底解一次
        let tmpSrcContent = secDecrypt(data.data)
        if (tmpSrcContent === null) {
          if (isSecPayload(data.data)) {
            // 是 v2 报文但本地解不开(keyid 对不上)：丢掉密钥下次重新握手
            resetSecSession()
            return data;
          }
          tmpSrcContent = AesDecrypt(data.data)
        }
        data.data = JSON.parse(tmpSrcContent)
        return data;
      } else {
        if (data.code === CODE.NEED_REHANDSHAKE) {
          // 服务端没有本次会话密钥(多为重启或过期)：重新握手后重发这一条请求。
          // 只重试一次——握手完还是 -5 说明是服务端侧的问题，再重发只会转圈。
          const cfg: any = response.config || {}
          if (!cfg.__secRetried) {
            cfg.__secRetried = true
            cfg.data = cfg.__rawData
            resetSecSession()
            return ensureSecSession().then(() => instance.request(cfg))
          }
          console.log("会话密钥重新握手后仍不可用")
        }
        if (data.code === CODE.AUTH_FAILURE) {
          // 保存当前访问的URL
          saveCurrentUrl();
          clearLocalStorageExceptPreserved();
          // 并发请求会一起返回「令牌过期」，人已经被踢回登录页，这些回声没有信息量：
          // 清掉已投递的本地提示，并在短窗口内丢弃后到的同类（见 messageguard）。
          // 但「为什么被踢出来」要留一条，由登录页在表单上方显示一次。
          resetLocalNoticeOnLogout('auth');

          console.log("鉴权失败")
          router.replace({ path: '/login' })
        } else if (data.code === CODE.NEED_BIND_2FA) {

          console.log("需要2Fa强制绑定")
          router.replace({ path: '/account/OTP' })
        }
        else if (data.code === CODE.NEED_CHANGE_PWD) {
          // 服务端强制改密门：令牌未改密即访问其他接口时触发，引导回登录重新进入强制改密流程
          saveCurrentUrl();
          clearLocalStorageExceptPreserved();
          resetLocalNoticeOnLogout();
          console.log("需要强制修改初始/重置密码")
          router.replace({ path: '/login' })
        }
      }
      return data;
    }
  },
  (err) => {
    // 超时：后端“可达但响应过慢”（或网络慢），并非连不上/跨域。axios 超时表现为 code=ECONNABORTED 且无 response，
    // 若不单独处理会落入下面的「无法连接后端(CORS)」分支造成误导。这里单独提示（含超时秒数）并提供“重试”。
    const isTimeout =
      err.code === 'ECONNABORTED' ||
      (typeof err.message === 'string' && err.message.indexOf('timeout') !== -1);
    if (isTimeout) {
      try {
        const seconds = Math.round((((err.config && err.config.timeout) || DEFAULT_REQUEST_TIMEOUT)) / 1000);
        const cfg = err.config;
        // 无论前台后台都在铃铛里留一条，用户手滑关掉通知后仍能回看
        pushLocalNotice(`请求超时：${(cfg && cfg.url) || ''}（${seconds} 秒未响应）`);
        // 后台请求到此为止，不弹通知
        if (isBackgroundRequest(cfg)) {
          return Promise.reject(err);
        }
        const now = Date.now();
        timeoutCount = now - lastTimeoutAt > TIMEOUT_COUNT_WINDOW ? 1 : timeoutCount + 1;
        lastTimeoutAt = now;
        // 上一条通知还在屏幕上就不再弹，避免连点/并发请求堆成一列
        if (now - lastTimeoutNotifyAt < TIMEOUT_NOTIFY_DURATION) {
          return Promise.reject(err);
        }
        lastTimeoutNotifyAt = now;
        const repeatTip = timeoutCount > 1 ? `（近期第 ${timeoutCount} 次）` : '';
        {
          NotifyPlugin.warning({
            title: '请求超时',
            content: `请求已超过 ${seconds} 秒未响应，后端可能繁忙或网络较慢，请重试。${repeatTip}`,
            footer: (h: any) => {
              const hasEmergency = !!getEmergencyPath();
              return h(
                'div',
                { style: 'display:flex;gap:8px;justify-content:flex-end' },
                [
                  h(
                    't-button',
                    {
                      props: { theme: 'primary', variant: 'base', size: 'small' },
                      on: { click: () => retryTimedOutRequest(cfg) },
                    },
                    '重试',
                  ),
                  hasEmergency
                    ? h(
                        't-button',
                        {
                          props: { theme: 'default', variant: 'outline', size: 'small' },
                          on: { click: () => showEmergencyRecovery() },
                        },
                        '应急恢复',
                      )
                    : null,
                ],
              );
            },
            duration: TIMEOUT_NOTIFY_DURATION,
            closeBtn: true,
          });
        }
      } catch (e) { /* ignore */ }
      return Promise.reject(err);
    }
    // 网络失败/跨域被拦截：axios 对 CORS/网络错误可能给出 err.response.status===0（而非无 response），
    // 故用 ERR_NETWORK / 无 response / status 0 三者兜底判定，避免 !err.response 漏判导致提示不弹。
    // 注意：超时已在上方 return，不会走到这里，因此这里不会把“慢响应”误报成“连不上”。
    if (err.code === 'ERR_NETWORK' || !err.response || err.response.status === 0) {
      try {
        pushLocalNotice(`无法连接后端：${(err.config && err.config.url) || ''}`);
        if (isBackgroundRequest(err.config)) {
          return Promise.reject(err);
        }
        if (!netErrNotified) {
          netErrNotified = true;
          const origin = window.location.origin || '';
          NotifyPlugin.error({
            title: '无法连接后端',
            content: '可能后端未启动，或前端跨域(CORS)被拦截。',
            footer: (h: any) =>
              h(
                't-button',
                {
                  props: { theme: 'primary', variant: 'base', size: 'small' },
                  on: { click: () => showNetErrDetail(origin) },
                },
                '查看解决办法',
              ),
            duration: NETERR_NOTIFY_DURATION,
            closeBtn: true,
          });
        }
      } catch (e) { /* ignore */ }
    }
    // 处理403错误，直接显示禁止访问页面
    if (err.response && err.response.status === 403) {
      const accessDeniedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Access denied</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f5f5f5;
              color: #333;
              text-align: center;
              padding: 50px;
              margin: 0;
            }
            .container {
              background-color: #fff;
              border-radius: 5px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              padding: 40px;
              max-width: 600px;
              margin: 0 auto;
            }
            h1 {
              color: #e74c3c;
              margin-bottom: 20px;
            }
            p {
              font-size: 18px;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .icon {
              font-size: 80px;
              color: #e74c3c;
              margin-bottom: 20px;
            }
            .back-btn {
              display: inline-block;
              padding: 10px 24px;
              background-color: #e74c3c;
              color: #fff;
              border-radius: 4px;
              text-decoration: none;
              font-size: 16px;
              cursor: pointer;
              border: none;
            }
            .back-btn:hover {
              background-color: #c0392b;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">⛔</div>
            <h1>Access denied</h1>
            <button class="back-btn" onclick="history.back(); window.addEventListener('popstate', function(){ window.location.reload(); }, {once: true});">Go Back</button>
          </div>
        </body>
        </html>
      `;

      // 创建一个新的HTML文档并替换当前页面内容
      document.open();
      document.write(accessDeniedHtml);
      document.close();

      // 阻止错误继续传播
      return new Promise(() => { });
    }
    const { config } = err;

    if (!config || !config.retry) return Promise.reject(err);

    config.retryCount = config.retryCount || 0;

    if (config.retryCount >= config.retry) {
      return Promise.reject(err);
    }

    config.retryCount += 1;

    const backoff = new Promise((resolve) => {
      setTimeout(() => {
        resolve({});
      }, config.retryDelay || 1);
    });

    return backoff.then(() => instance(config));
  },
);

export default instance;
