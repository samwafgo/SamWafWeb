import store from '@/store';

// 前端本地产生的提示（请求超时、连不上后端等）统一投递到顶部小铃铛的「系统」页签。
// 后台请求失败时不再弹右上角通知——无外网环境下轮询会持续失败，
// 常驻通知会一条条把右侧堆满。

// 跳登录页之后的抑制窗口：被踢回登录页时，上一个会话里几个并发请求会陆续
// 返回「令牌过期」，这些回声没有任何信息量，直接丢弃。
let suppressUntil = 0;
const SUPPRESS_MS = 3000;

// 被踢回登录页的原因。抑制窗口会把那一串「令牌过期」回声全部丢掉，
// 但用户必须知道自己「为什么」突然被弹回登录页 —— 否则就是一次莫名其妙的跳转。
// 存 sessionStorage 而不是模块变量：跳登录若伴随整页刷新，模块状态会丢。
const LOGOUT_REASON_KEY = 'waf_logout_reason';

export function pushLocalNotice(text: string, kind = 'net') {
  if (Date.now() < suppressUntil) return;
  try {
    (store as any).commit('notification/addLocalMsg', { text, kind });
  } catch (e) {
    /* 铃铛不可用不应影响主流程 */
  }
}

// 鉴权失败跳登录时调用：清掉已经投递的本地提示，并在短窗口内丢弃后到的同类。
// reason 会留给登录页显示一次（'auth' = 登录状态失效）。
export function resetLocalNoticeOnLogout(reason?: string) {
  suppressUntil = Date.now() + SUPPRESS_MS;
  if (reason) {
    try {
      sessionStorage.setItem(LOGOUT_REASON_KEY, reason);
    } catch (e) {
      /* ignore */
    }
  }
  try {
    (store as any).commit('notification/dropLocalMsg');
  } catch (e) {
    /* ignore */
  }
}

// 取一次即清空：登录页读走之后不该在下次进登录页时又冒出来
export function takeLogoutReason(): string {
  try {
    const v = sessionStorage.getItem(LOGOUT_REASON_KEY) || '';
    if (v) sessionStorage.removeItem(LOGOUT_REASON_KEY);
    return v;
  } catch (e) {
    return '';
  }
}

export function isNoticeSuppressed(): boolean {
  return Date.now() < suppressUntil;
}
