// eventSource.js
import { fetchEventSource } from "@microsoft/fetch-event-source";
import  {AesEncrypt} from './usuallytool'
import proxy from "@/config/host";
const env = import.meta.env.MODE || 'development';
export function fetchChatStream({    history, q, ctrl, onSuccess, onError,onComplete }) {
  console.log('fetchChatStream history',  history)
  const API_HOST = env === 'mock' ? '/' : proxy[env].API


  const requestData = {
    history: history.filter((item) => item.role && item.content).slice(-3).map((item) => {
      return [item.role, item.content];
    }),
  };
  let encryptedData = JSON.stringify(requestData);
  encryptedData = AesEncrypt(encryptedData);

  // url
  fetchEventSource(API_HOST+"/gpt/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: [],
      "X-Token": localStorage.getItem("access_token")? localStorage.getItem("access_token"):"",
    },
    body: encryptedData,
    signal: ctrl.signal,
    onopen(e) {
      if (e.ok && e.headers.get("content-type") === "text/event-stream") {
        // Connection established
      } else if (e.headers.get("content-type") === "application/json") {
        return e
          .json()
          .then(() => {
            onError("出错了,请稍后刷新重试1");
          })
          .catch(() => {
            onError("出错了,请稍后刷新重试2");
          });
      }
    },
    onmessage(msg) {
      console.log('onmessage', msg)
      //if(msg.data != ""){
        console.log('onmessage data =""', msg)
        const res = JSON.parse(msg.data);
        onSuccess(res);
      //}else{
      //  const res = JSON.parse("{\"content\":\"远程服务器未返回信息，请检查配置\",\"role\":\"assistant\"}");
      //  console.log('onmessage data!="" ', res)
      //  onSuccess(res);
      //}
    },
    onclose() {
      onComplete("连接已关闭，请稍后重试");
      //ctrl.abort();
    },
    onerror(err) {
      onError("出错了,请稍后刷新重试3");
      //ctrl?.abort();
    },
  });
}
