<template>
  <router-view :class="[mode]" />
</template>

<script>
import Vue from 'vue';
import config from '@/config/style';
import websocket from "@/utils/websocket.js";
import { DialogPlugin } from 'tdesign-vue';
import  {AesDecrypt} from './utils/usuallytool'
import { clearLocalStorageExceptPreserved } from '@/constants';
const env = import.meta.env.MODE || 'development';

export default Vue.extend({
  computed: {
    mode() {
      return this.$store.getters['setting/mode'];
    },
  },
  data() {
    return {
      ws: null, // ws
      disConnectTimer: null, // 断连计时
      mydialog: null,

    }
  },
  mounted() {
    this.$store.dispatch('setting/changeTheme', { ...config });
  },
  created() {
    this.initWebSocket();
  },
  methods:{
      initWebSocket() {
        console.log("log",window.location.host)
        if(!this.ws) {
        	// url
          let url = env=="development"? "ws://127.0.0.1:26666/samwaf/ws" : "ws://"+window.location.host+"/samwaf/ws"
          this.ws = websocket.useWebSocket(
            url,	// url
            localStorage.getItem("access_token"),
            this.wsOnOpen, // 链接回调
            this.wsOnMessage,	// 连接成功后处理接口返回信息
            this.wsOnClose, // 关闭回调
            this.wsOnError, // 消息通知错误回调
            [], // 发送后台的心跳包参数
            null, // 给后台传送心跳包的间隔时间
            true, // 是否断掉立即重连
          );
        }

      },
      wsOnOpen() {
        console.log('开始连接')
      },
      wsOnError(e) {
        console.log(e,'消息通知错误回调，重新连接')
        this.ws.close();
        this.ws = null;
        this.initWebSocket();
      },
      wsOnMessage(e) {
        let wsData = JSON.parse(e.data)
        if(wsData.msg_code=="200"){
          console.log('接口返回信息',wsData)

          let msgDataEnstr =wsData.msg_data

          console.log('msgDataEnstr',msgDataEnstr)
          let tmpSrcContent = AesDecrypt(msgDataEnstr)
          console.log('tmpSrcContent',tmpSrcContent)
          let msgData = JSON.parse(tmpSrcContent)
          console.log('msgData',msgData)
          wsData.msg_data = msgData
          if(wsData.msg_cmd_type=="RELOAD_PAGE"){
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
          }else if(wsData.msg_cmd_type=="DOWNLOAD_LOG"){
            let token  =localStorage.getItem("access_token")? localStorage.getItem("access_token"):""
            //下载连接
            let downloadUrl = env=="development"? "http://127.0.0.1:26666/samwaf/waflog/attack/download" : "http://"+window.location.host+"/samwaf/waflog/attack/download"
            downloadUrl = downloadUrl +"?X-Token="+token
            console.log(downloadUrl)
            window.open(downloadUrl)
          }
          this.$store.commit('notification/addMsgData', wsData.msg_data);
        }else if(wsData.msg_code=="-999"){
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
var ws = new WebSocket("ws://127.0.0.1:26666/samwaf/ws",[localStorage.getItem("access_token")]);
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
