// eventSource.js
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { v4 as uuidv4 } from 'uuid';
import {ensureSecSession, currentKeyId, encryptOutgoing, decryptIncoming} from './seccrypto'
import proxy from "@/config/host";
const env = import.meta.env.MODE || 'development';
export async function fetchChatStream({    history, q, scene, ctrl, onSuccess, onError,onComplete }) {
  console.log('fetchChatStream history',  history)
  const API_HOST = env === 'mock' ? '/' : proxy[env].API
  // 这条流不走 axios，会话密钥得自己确保就绪；握手失败则回落 legacy 通道
  await ensureSecSession()
  const keyId = currentKeyId()


  const requestData = {
    history: history.filter((item) => item.role && item.content).slice(-3).map((item) => {
      return [item.role, item.content];
    }),
    // 场景：决定后端用哪套系统提示词（日志安全分析 / 规则解读 / 通用问答）
    scene: scene || 'general',
  };
  let encryptedData = JSON.stringify(requestData);
  encryptedData = encryptOutgoing(encryptedData);

  // url
  fetchEventSource(API_HOST+"/gpt/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // 后端 SecApi 靠 accept 判断要不要解密请求体，必须显式声明
      Accept: "text/event-stream",
      "X-Token": localStorage.getItem("access_token")? localStorage.getItem("access_token"):"",
      // 这条请求不走 axios，防重放头得自己加，否则被 ReplayProtect 直接拦掉
      "X-Request-Time": Math.floor(Date.now() / 1000).toString(),
      "X-Request-Id": uuidv4(),
      // 声明会话密钥，后端据此加密流里的每一条 content
      ...(keyId ? { "X-Sec-Ver": "2", "X-Key-Id": keyId } : {}),
    },
    body: encryptedData,
    signal: ctrl.signal,
    openWhenHidden: true,
    async onopen(e) {
      const contentType = e.headers.get("content-type") || "";
      if (e.ok && contentType.includes("text/event-stream")) {
        // Connection established
        return;
      }
      // 非 SSE 响应基本都是被中间件拦下来了（未登录/防重放/IP白名单等），
      // 把后端的 msg 原样带出来，不要吞成一句"请稍后重试"
      let message = `出错了(${e.status})，请稍后重试`;
      try {
        const body = await e.json();
        if (body && (body.msg || body.message)) {
          message = body.msg || body.message;
        }
      } catch (err) {
        console.log('parse error response fail', err);
      }
      onError(message);
      // 抛出去让 fetchEventSource 终止，避免把错误响应当成流继续读
      const handled = new Error(message);
      handled.__samwafHandled = true;
      throw handled;
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
          res.content = decryptIncoming(res.content);
        }
        // [DONE] 是结束标记，不要当成正文塞进气泡
        if (res.content === '[DONE]') {
          return;
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
      // onopen 里抛出的错误会走到这里，此时已经提示过了，别再刷一遍
      if (err && err.__samwafHandled) {
        throw err;
      }
      onError("出错了,请稍后刷新重试");
      // 抛出去终止重试，否则 fetchEventSource 会不停重连
      throw err;
    },
  }).catch((err) => {
    // 上面抛出的错误只用来终止流，提示已经给过了，这里兜住避免 unhandledrejection
    console.log('fetchChatStream aborted', err);
  });
}
