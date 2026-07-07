import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import proxy from '../config/host';
import router from '../router/index';
import store from '@/store';
import { AesDecrypt, AesEncrypt, isObject, isInList } from './usuallytool'
import { clearLocalStorageExceptPreserved,saveCurrentUrl } from '@/constants';
import { NotifyPlugin, DialogPlugin, MessagePlugin } from 'tdesign-vue';

// 连接失败(网络/跨域)提示：每次页面加载最多提示一次，避免刷屏
let netErrNotified = false;
// 请求超时提示的节流时间戳：并发超时时 3 秒内只提示一次，避免刷屏
let lastTimeoutNotifyAt = 0;

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

const noVisitClientList = ["/center/list", "logout", "public/login"];
const CODE = {
  LOGIN_TIMEOUT: 1000,
  REQUEST_SUCCESS: 0,
  REQUEST_FOBID: 1001,
  AUTH_FAILURE: -999,
  NEED_BIND_2FA: -3,
  NEED_CHANGE_PWD: -4
};

const instance = axios.create({
  baseURL: API_HOST,
  timeout: 5000,
  withCredentials: true,
  transformRequest: [
    function (data, headers) {
      // 这里没有对 Form-Data 格式的报文处理
      if (isObject(data)) {
        // 一、请求参数加密
        //if (process.env.VUE_APP_RUNTIME === 'prod') {
        data = JSON.stringify(data)
        //headers["keyCipher"] = rsaEncrypt(aesKey) // 传输 aes key 密文
        data = AesEncrypt(data) // 加密请求参数
        // }
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
  (config: any) => {

    let token: string = localStorage.getItem("access_token") ? localStorage.getItem("access_token") : "" //此处换成自己获取回来的token，通常存在在cookie或者store里面
    if (token) {
      // 让每个请求携带token-- ['X-Token']为自定义key 请根据实际情况自行修改
      config.headers['X-Token'] = token
      //config.headers.Authorization =  + token
    }
    //如果有远控机器
    let remoteBean = localStorage.getItem("current_server") ? localStorage.getItem("current_server") : "" //此处换成自己获取回来的token，通常存在在cookie或者store里面

    if (remoteBean && !isInList(config.url, noVisitClientList)) {
      console.log(config)
      remoteBean = JSON.parse(localStorage.getItem("current_server"))
      // 让每个请求携带token-- ['X-Token']为自定义key 请根据实际情况自行修改
      config.headers['Remote-Waf-User-Id'] = remoteBean.client_tenant_id + "@" + remoteBean.client_user_code
      //config.headers.Authorization =  + token
    }
    /*if(config.headers['Content-Type'] !=undefined && config.headers['Content-Type']=="application/json" ){
      data = JSON.stringify(config.data)

      config.data = AesEncrypt(data) // 加密请求参数
    }
    console.log("request",config)*/
    config.headers['X-Request-Time'] = Math.floor(Date.now() / 1000).toString()
    config.headers['X-Request-Id'] = uuidv4()
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
        console.log("解密前", data)
        let tmpSrcContent = AesDecrypt(data.data)
        data.data = JSON.parse(tmpSrcContent)
        console.log("解密后", data)

        //console.log("再加密后",AesEncrypt(tmpSrcContent))
        return data;
      } else {
        //如果有远控机器
        let remoteBean = localStorage.getItem("current_server") ? localStorage.getItem("current_server") : "" //此处换成自己获取回来的token，通常存在在cookie或者store里面

        if (!remoteBean && data.code === CODE.AUTH_FAILURE) {
          // 保存当前访问的URL
          saveCurrentUrl();
          clearLocalStorageExceptPreserved();

          console.log("鉴权失败")
          router.replace({ path: '/login' })
        } else if (!remoteBean && data.code === CODE.NEED_BIND_2FA) {

          console.log("需要2Fa强制绑定")
          router.replace({ path: '/account/OTP' })
        }
        else if (!remoteBean && data.code === CODE.NEED_CHANGE_PWD) {
          // 服务端强制改密门：令牌未改密即访问其他接口时触发，引导回登录重新进入强制改密流程
          saveCurrentUrl();
          clearLocalStorageExceptPreserved();
          console.log("需要强制修改初始/重置密码")
          router.replace({ path: '/login' })
        }
        else if (remoteBean && data.code === CODE.AUTH_FAILURE) {
          remoteBean = JSON.parse(localStorage.getItem("current_server"))
          data.code = -1
          data.msg = remoteBean.client_server_name + " 远端鉴权失败"
          console.log("远端鉴权失败")
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
        const seconds = Math.round((((err.config && err.config.timeout) || 5000)) / 1000);
        const now = Date.now();
        if (now - lastTimeoutNotifyAt > 3000) {
          lastTimeoutNotifyAt = now;
          const cfg = err.config;
          NotifyPlugin.warning({
            title: '请求超时',
            content: `请求已超过 ${seconds} 秒未响应，后端可能繁忙或网络较慢，请重试。`,
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
            duration: 0,
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
            duration: 0,
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
