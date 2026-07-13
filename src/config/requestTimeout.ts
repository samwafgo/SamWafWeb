// 前端请求超时（浏览器本地设置，存 localStorage，与后端无关）。
// 统一在这里管理，request.ts 与"系统配置页-前端请求超时"卡片都读写这里，避免各处散落魔法数字。

export const REQUEST_TIMEOUT_KEY = 'waf_request_timeout_ms';
export const DEFAULT_REQUEST_TIMEOUT = 20000; // 默认 20 秒（原为 5 秒，偏短）
export const MIN_REQUEST_TIMEOUT = 3000;       // 最小 3 秒
export const MAX_REQUEST_TIMEOUT = 300000;     // 最大 300 秒

// AI 生成等长耗时任务单独使用的超时：后端最多 3 次×60 秒的校验修复闭环，普通默认值会误杀。
export const AI_GEN_TIMEOUT = 190000;

// 读取当前生效的请求超时（毫秒）。非法或越界值回退默认。
export function getRequestTimeout(): number {
  try {
    const v = parseInt(localStorage.getItem(REQUEST_TIMEOUT_KEY) || '', 10);
    if (!isNaN(v) && v >= MIN_REQUEST_TIMEOUT && v <= MAX_REQUEST_TIMEOUT) {
      return v;
    }
  } catch (e) {
    /* ignore */
  }
  return DEFAULT_REQUEST_TIMEOUT;
}

// 保存请求超时（毫秒），会做上下限钳制。
export function setRequestTimeout(ms: number): number {
  let v = Math.round(Number(ms) || DEFAULT_REQUEST_TIMEOUT);
  if (v < MIN_REQUEST_TIMEOUT) v = MIN_REQUEST_TIMEOUT;
  if (v > MAX_REQUEST_TIMEOUT) v = MAX_REQUEST_TIMEOUT;
  try {
    localStorage.setItem(REQUEST_TIMEOUT_KEY, String(v));
  } catch (e) {
    /* ignore */
  }
  return v;
}
