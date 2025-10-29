/* WebSocket封装
 * @param url: WebSocket接口地址与携带参数必填
 * @param token: WebSocket接口凭证与携带参数必填
 * @param onOpenFunc: WebSocket的onopen回调函数，如果不需要可传null
 * @param onMessageFunc: WebSocket的onmessage回调函数，如果不需要可传null
 * @param onCloseFunc: WebSocket的onclose回调函数，如果不需要可传null
 * @param onErrorFunc: WebSocket的onerror回调函数，如果不需要可传null
 * @param heartMessage: 发送后台的心跳包参数,必填 (给服务端的心跳包就是定期给服务端发送消息)
 * @param timer: 给后台传送心跳包的间隔时间，不传时使用默认值3000毫秒
 * @param isReconnect: 是否断掉立即重连，不传true时不重连
 */
function useWebSocket(
  url,
  token,
  onOpenFunc,
  onMessageFunc,
  onCloseFunc,
  onErrorFunc,
  heartMessage,
  timer,
  isReconnect
) {
  let isConnected = false; // 设定已链接webSocket标记
  let ws = null;
  let heartbeatTimer = null;

  // 创建并链接webSocket
  let connect = () => {
    if (!isConnected) {
      ws = new WebSocket(url, [token]);
      isConnected = true;
    }
  };

  // 向后台发送心跳消息（简单 ping）
  let startHeartbeat = () => {
    clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      if (ws && ws.readyState === 1) {
        try { ws.send('ping'); } catch (_) {}
      }
    }, !timer ? 30000 : timer); // 默认 30s
  };

  let stopHeartbeat = () => {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  };

  // 初始化事件回调函数
  let initEventHandle = () => {
    ws.addEventListener('open', (e) => {
      console.log('onopen', e);
      // 给后台发心跳请求，在onmessage中取得消息则说明链接正常
      startHeartbeat();
      if (!onOpenFunc) {
        return false;
      } else {
        onOpenFunc(e, ws);
      }
    });
    ws.addEventListener('message', (e) => {
      // console.log('onmessage', e)
      // 接收到任何后台消息都说明当前连接是正常的
      if (!e) {
        console.log('get nothing from service');
        return false;
      } 
      // 如果传入了函数，执行onMessageFunc
      if (!onMessageFunc) {
        return false;
      } else {
        onMessageFunc(e);
      }
    });
    ws.addEventListener('close', (e) => {
      console.log('onclose', e);
      isConnected = false; // 复位连接标志
      stopHeartbeat();     // 停止心跳
      if (!onCloseFunc) {
        return false;
      } else {
        onCloseFunc(e);
      }
    });
    ws.addEventListener('error', (e) => {
      console.log('onerror', e);
      isConnected = false; // 复位连接标志
      stopHeartbeat();     // 停止心跳
      if (!onErrorFunc) {
        return false;
      } else {
        onErrorFunc(e);
      }
      if (isReconnect) {
        connect();
        initEventHandle(); // 新连接需要重新绑定事件
      }
    });
  };

  // 初始化webSocket
  connect();
  initEventHandle();
  return ws;
}

export default {
  useWebSocket,
};