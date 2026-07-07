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
          this.ws = websocket.useWebSocket(
              url,	// url
              localStorage.getItem("access_token"),
              this.wsOnOpen, // 链接回调
              this.wsOnMessage,	// 连接成功后处理接口返回信息
              this.wsOnClose, // 关闭回调
              this.wsOnError, // 消息通知错误回调
              [], // 发送后台的心跳包参数
              30000, // 心跳间隔：30秒（可按需调整）
              false // 关闭工具内部重连，统一由 App.vue 控制
          );
        }

      },
      wsOnOpen() {
        console.log('开始连接')
      },
      wsOnError(e) {
        console.log(e,'消息通知错误回调，重新连接')
        // 不再主动关闭，避免额外触发 onclose
        this.ws = null;
        this.initWebSocket();
      },
      wsOnMessage(e) {
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
          }
          this.$store.commit('notification/addMsgData', wsData.msg_data);
        }else if(wsData.msg_code==="-999"){
          // 保存当前访问的URL
          saveCurrentUrl();
          clearLocalStorageExceptPreserved();
          console.log("鉴权失败");
        }
      },
      wsOnClose() {
        console.log('关闭')
        // 意外关闭之后重新连接
        if(!this.disConnectTimer) {
          //this.ws.close();
          this.ws = null;
          this.disConnectTimer = setTimeout(() => {
            this.initWebSocket()
            this.disConnectTimer = null
          }, 10000)
        }
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
