// eventSource.js
import { fetchEventSource } from "@microsoft/fetch-event-source";
import {AesDecrypt, AesEncrypt} from './usuallytool'
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
      if (typeof msg.data !== 'string' || msg.data.trim() === '') {
        console.log('Received invalid or empty data:', msg.data);
        const fallback = { content: "远程服务器返回了非JSON数据", role: "assistant" };
        return onSuccess(fallback);
      }

      try {
        const res = JSON.parse(msg.data);
        if(typeof res.content == 'string'){
          res.content = AesDecrypt(res.content);
        }
        onSuccess(res);
      } catch (error) {
        console.log('JSON 解析失败:', error, '原始数据:', msg.data);
        const fallback = { content: "远程服务器返回了非JSON数据", role: "assistant" };
        onSuccess(fallback);
      }
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
