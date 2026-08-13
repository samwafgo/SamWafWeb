<template>
  <div>
    <router-view :class="[mode]" />
    <!-- 前端运行异常 → 应急恢复对话框 -->
    <t-dialog
      :visible.sync="showEmergencyDialog"
      header="检测到前端运行异常"
      confirm-btn="进入紧急模式"
      cancel-btn="忽略"
      @confirm="enterEmergencyMode"
      @cancel="showEmergencyDialog = false"
    >
      <p>检测到前端运行异常，可能影响正常操作。</p>
      <t-alert theme="warning" :message="emergencyError" style="margin:12px 0" />
      <p>[适用于升级异常场景]是否进入紧急恢复模式？该模式可在不依赖前端的情况下执行版本回退。</p>
    </t-dialog>
  </div>
</template>

<script>
import Vue from 'vue';
import config from '@/config/style';
import websocket from "@/utils/websocket.js";
import { DialogPlugin } from 'tdesign-vue';
import  {AesDecrypt} from './utils/usuallytool'
import { v4 as uuidv4 } from 'uuid'
import { clearLocalStorageExceptPreserved, saveCurrentUrl } from '@/constants';
const env = import.meta.env.MODE || 'development';

// WebSocket 断线重连的指数退避参数。
// 后端会主动踢掉写超时(5s)/读超时(90s)的死连接，掉线后固定等 10s 再连的话，
// 这段空窗期内的即时通知(IP封禁、操作结果等)是收不到的——服务端不补发。
// 所以改成 1s 起、每次翻倍、封顶 10s：偶发断开几乎无感，后端真挂了也不会疯狂重试。
const WS_RECONNECT_BASE_DELAY = 1000;
const WS_RECONNECT_MAX_DELAY = 10000;
// 连接活过这个时长才算「连上过」，重连间隔才复位。
// 否则鉴权失败(-999)这类「一连上就被踢」的场景会退化成 1s 一次的死循环。
const WS_STABLE_THRESHOLD = 30000;

export default Vue.extend({
  computed: {
    mode() {
      return this.$store.getters['setting/mode'];
    },
  },
  data() {
    return {
      ws: null,
      disConnectTimer: null,
      reconnectDelay: WS_RECONNECT_BASE_DELAY,
      wsOpenedAt: 0,
      wsGeneration: 0,
      mydialog: null,
      showEmergencyDialog: false,
      emergencyDialogShown: false,
      emergencyError: '',
    }
  },
  mounted() {
    this.$store.dispatch('setting/changeTheme', { ...config });
    if (localStorage.getItem('access_token')) {
      this.$store.dispatch('sysparams/fetchParams');
    }
    this.setupGlobalErrorHandler();
  },
  created() {
    console.log("App Created")
    this.initWebSocket();
  },
  methods:{
      setupGlobalErrorHandler() {
        const IGNORE_PATTERNS = [
          /network\s*error/i,
          /failed\s*to\s*fetch/i,
          /request\s*(aborted|cancelled|canceled|timed?\s*out)/i,
          // 请求超时（axios: "timeout of 5000ms exceeded"）：属后端慢/连接问题，已由 utils/request.ts 的
          // 「请求超时」通知统一处理（含重试与应急恢复入口），此处不再弹「前端运行异常」对话框，避免重复。
          /timeout\s+of\s+\d+\s*ms/i,
          /the\s*user\s*aborted/i,
          /ResizeObserver\s*loop/i,
          /NavigationDuplicated/i,
          /Avoided\s*redundant\s*navigation/i,
        ];

        const isCritical = (msg, src) => {
          const msgStr = String(msg || '').trim();
          if (!msgStr || /^Script\s*error\.?$/i.test(msgStr)) return false;
          if (src && /^(chrome|moz|safari)-extension:/.test(src)) return false;
          if (IGNORE_PATTERNS.some(p => p.test(msgStr))) return false;
          return true;
        };

        const handle = (msg, src) => {
          if (!isCritical(msg, src)) return;
          if (this.emergencyDialogShown) return;
          if (!localStorage.getItem('access_token')) return;
          const path = this.$store.state.sysparams?.emergencyPath;
          if (!path) return;
          this.emergencyDialogShown = true;
          this.emergencyError = String(msg);
          this.showEmergencyDialog = true;
        };

        window.onerror = (msg, src, line, col, err) => handle(err?.message || msg, src);
        window.addEventListener('unhandledrejection', (e) => {
          if (!(e.reason instanceof Error)) return;
          handle(e.reason.message, null);
        });
      },
      enterEmergencyMode() {
        const path = this.$store.state.sysparams?.emergencyPath;
        if (path) window.location.href = path + '?back=' + encodeURIComponent(window.location.href);
        this.showEmergencyDialog = false;
      },
      initWebSocket() {
        console.log("log",window.location.host)
        if(!this.ws) {
        	// url
          const isHttps = window.location.protocol === 'https:';
          // 安全路径：优先读注入变量，其次读 localStorage（支持开发模式）
          const secPath = window.__SAMWAF_SECURITY_PATH__ || (() => { try { return localStorage.getItem('__samwaf_security_path__') || ''; } catch { return ''; } })();
          let url = env=="development"
              ? `ws://127.0.0.1:26666${secPath}/api/v1/ws`
              : `${isHttps ? 'wss' : 'ws'}://${window.location.host}${secPath}/api/v1/ws`;
          // 代次：本次连接的身份标记。旧连接的事件迟到时靠它识别并丢弃，
          // 否则「已废弃连接的 close 事件」会把 this.ws（此时已指向新的活连接）置空并再排一次重连，
          // 于是又漏出一条连接——线上就是这样一路裂变出十几条并存连接，
          // 一条广播被同一个页面收 N 次，通知就重复 N 条。
          const gen = ++this.wsGeneration;
          this.ws = websocket.useWebSocket(
              url,	// url
              localStorage.getItem("access_token"),
              () => this.wsOnOpen(gen), // 链接回调
              (e) => this.wsOnMessage(e, gen),	// 连接成功后处理接口返回信息
              () => this.wsOnClose(gen), // 关闭回调
              (e) => this.wsOnError(e, gen), // 消息通知错误回调
              [], // 发送后台的心跳包参数
              30000, // 心跳间隔：30秒（可按需调整）
              false // 关闭工具内部重连，统一由 App.vue 控制
          );
        }

      },
      // 是否为当前连接发来的事件；过期连接的一律忽略
      isCurrentWs(gen) {
        return gen === this.wsGeneration;
      },
      wsOnOpen(gen) {
        if (!this.isCurrentWs(gen)) return;
        console.log('开始连接')
        this.wsOpenedAt = Date.now();
      },
      // 统一的重连入口：onerror 与 onclose 都走这里。
      // 一次断开通常会先后触发 error 和 close 两个事件，靠 disConnectTimer 去重，
      // 避免像以前那样 error 里立刻重连、close 里又排一次，连出两条连接。
      scheduleReconnect(gen) {
        if (!this.isCurrentWs(gen)) return; // 旧连接的迟到事件，不能影响当前连接
        if (this.disConnectTimer) return;

        // 连接稳定活过一段时间再断，视为偶发掉线，退避间隔复位
        if (this.wsOpenedAt && Date.now() - this.wsOpenedAt >= WS_STABLE_THRESHOLD) {
          this.reconnectDelay = WS_RECONNECT_BASE_DELAY;
        }
        this.wsOpenedAt = 0;
        // 显式关掉被丢弃的连接：不关的话它在服务端一直活着、继续收广播，
        // 页面里它的监听器也还在，就会把同一条通知重复推进 store。
        // 它迟到的 close 事件会被上面的代次校验挡掉，不会再触发一次重连。
        try { if (this.ws) this.ws.close(); } catch (_) { /* ignore */ }
        this.ws = null;

        const delay = this.reconnectDelay;
        console.log(`WebSocket 已断开，${delay}ms 后重连`);
        this.disConnectTimer = setTimeout(() => {
          this.disConnectTimer = null;
          this.initWebSocket();
        }, delay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, WS_RECONNECT_MAX_DELAY);
      },
      wsOnError(e, gen) {
        console.log(e,'消息通知错误回调，重新连接')
        this.scheduleReconnect(gen);
      },
      wsOnMessage(e, gen) {
        // 僵尸连接（已被丢弃但服务端还在推）的消息一律丢掉，否则同一条通知会重复入库
        if (!this.isCurrentWs(gen)) return;
        if(e.data=="pong"){
          console.log('收到心跳包回复')
          return
        }
        let wsData = JSON.parse(e.data)
        if(wsData.msg_code=="200"){
          //console.log('接口返回信息',wsData)

          let msgDataEnstr =wsData.msg_data

          //console.log('msgDataEnstr',msgDataEnstr)
          let tmpSrcContent = AesDecrypt(msgDataEnstr)
         // console.log('tmpSrcContent',tmpSrcContent)
          let msgData = JSON.parse(tmpSrcContent)
          //console.log('msgData',msgData)
          wsData.msg_data = msgData
          if(wsData.msg_cmd_type==="RELOAD_PAGE"){
            if(this.mydialog){
              this.mydialog.hide()
              this.mydialog =null
            }
            this.mydialog = this.$dialog({
                    header: wsData.msg_data.message_type,
                    body: wsData.msg_data.message_data,
                    className: 't-dialog-new-class1 t-dialog-new-class2',
                    style: 'color: rgba(0, 0, 0, 0.6)',
                    confirmBtn:'确认并刷新',
                    onConfirm: ({ e }) => {
                      window.location.reload()
                      this.mydialog.hide();
                    },
                  });
              return
          }else if(wsData.msg_cmd_type==="DOWNLOAD_LOG"){
            let token  =localStorage.getItem("access_token")? localStorage.getItem("access_token"):""
            //下载连接
            const dlSecPath = window.__SAMWAF_SECURITY_PATH__ || (() => { try { return localStorage.getItem('__samwaf_security_path__') || ''; } catch { return ''; } })();
            let downloadUrl = env=="development"
              ? `http://127.0.0.1:26666${dlSecPath}/api/v1/waflog/attack/download`
              : `${window.location.protocol}//${window.location.host}${dlSecPath}/api/v1/waflog/attack/download`
            downloadUrl = downloadUrl +"?X-Token="+token
              +"&X-Request-Time="+Math.floor(Date.now() / 1000).toString()
              +"&X-Request-Id="+uuidv4()
            console.log(downloadUrl)
            window.open(downloadUrl)
          }else if(wsData.msg_cmd_type==="SystemStats"){
             //console.log("相关统计信息赋值",wsData.msg_data.message_attach)
             // 将统计信息传递给stats store
             if (wsData.msg_data.message_attach) {
               this.$store.commit('stats/addStatsData', wsData.msg_data.message_attach);
             }
             return
          }else if(wsData.msg_cmd_type==="HostGuard"){
             // 主机防爆破封禁：只广播事件，由「远程防爆破」页面自行决定要不要刷新。
             // 不在这里弹通知——IP封禁本来就已经走 Info 通道发过一次了，
             // 再弹一次用户会看到两条一样的消息。
             this.$bus.$emit('hostguard-ban', wsData.msg_data.message_attach);
             return
          }
          this.$store.commit('notification/addMsgData', wsData.msg_data);
        }else if(wsData.msg_code==="-999"){
          // 保存当前访问的URL
          saveCurrentUrl();
          clearLocalStorageExceptPreserved();
          console.log("鉴权失败");
        }
      },
      wsOnClose(gen) {
        console.log('关闭')
        // 意外关闭之后重新连接（间隔按指数退避，见 scheduleReconnect）
        this.scheduleReconnect(gen);
      }
  }

});

/*
var ws = new WebSocket("ws://127.0.0.1:26666/api/v1/ws",[localStorage.getItem("access_token")]);
//连接打开时触发
ws.onopen = function(evt) {
    console.log("Connection open ...");
    ws.send("ping");
};
//接收到消息时触发
ws.onmessage = function(evt) {
    console.log("Received Message: " + evt.data);
};
//连接关闭时触发
ws.onclose = function(evt) {
    console.log("Connection closed.");
}; */


</script>
<style>
.tdesign-starter-side-nav-logo-tdesign-logo{
  padding: 0 0px;
}
</style>
