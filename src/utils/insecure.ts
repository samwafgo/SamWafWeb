/** 顶部 HTTP 提示条"本次会话已收起"的标记（sessionStorage） */
export const INSECURE_BANNER_DISMISS_KEY = '__samwaf_insecure_dismissed__';

/**
 * 是否为回环地址。
 *
 * 判定依据是 W3C Secure Contexts 规范：`localhost`、`127.0.0.0/8`、`::1` 属
 * potentially trustworthy origin，与 HTTPS 同等对待——Chrome/Firefox/Safari 据此
 * 在这些来源上放行仅安全上下文的 API，地址栏也不标"不安全"。所以这里跟随浏览器的
 * 既有判定豁免顶部提示条，不是本方案的妥协。
 *
 * 按 hostname 判，不去猜"是不是本机"。已知副作用：经 SSH 端口转发访问远程管理端时
 * 浏览器看到的也是 localhost 因而被豁免——该场景流量在 SSH 隧道内，豁免恰好正确；
 * 浏览器规范同样无法区分明文转发，业界一致接受这个取舍。
 */
export function isLoopbackHost(hostname: string): boolean {
  if (!hostname) return false;
  // IPv6 字面量在 location.hostname 里不带方括号，但手写时可能带上
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host === '::1' || host === '0:0:0:0:0:0:0:1') return true;
  // 127.0.0.0/8 整段
  return /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

/** 当前是否处于"管理端以明文 HTTP 访问"的状态（回环不算） */
export function isInsecureAccess(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.protocol === 'https:') return false;
  return !isLoopbackHost(window.location.hostname);
}
