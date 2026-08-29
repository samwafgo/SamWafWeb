import Vue from 'vue';
import { MessagePlugin } from 'tdesign-vue';
import { isNoticeSuppressed } from './localnotice';

// 全站有几十处 `this.$message.error(res.msg)`，逐个改不现实，在这里统一包一层：
//
//  1. 被踢回登录页之后的短窗口内，丢弃 error/warning ——
//     上一个会话里几个并发请求会陆续返回「令牌过期」，人已经在登录页了，
//     再把这些回声一条条弹出来只会糊住半个屏幕（issue IKBP1Q 的截图 1）。
//  2. 同一句文案在去重窗口内只显示一条，避免并发请求把同一个错误弹 N 遍。
//
// success 不拦：它多半是用户自己操作的即时反馈，弹重了也不至于刷屏，
// 而且「登录成功」这类必须让用户看见。

const DEDUP_WINDOW = 3000;
const lastShown = new Map<string, number>();

function textOf(params: any): string {
  if (typeof params === 'string') return params;
  if (params && typeof params.content === 'string') return params.content;
  return '';
}

function shouldDrop(theme: string, params: any): boolean {
  if (isNoticeSuppressed()) return true;
  const text = textOf(params);
  if (!text) return false;
  const key = `${theme}|${text}`;
  const now = Date.now();
  const prev = lastShown.get(key) || 0;
  if (now - prev < DEDUP_WINDOW) return true;
  lastShown.set(key, now);
  // 顺手清掉过期条目，避免长时间运行后 Map 越积越大
  if (lastShown.size > 50) {
    lastShown.forEach((t, k) => {
      if (now - t > DEDUP_WINDOW) lastShown.delete(k);
    });
  }
  return false;
}

// 返回一个「什么都不做」的替身，保持调用方 .then() 之类的写法不炸
function noopInstance(): any {
  return Promise.resolve({ close: () => undefined });
}

export function setupMessageGuard() {
  // 只包 error / warning：success 是用户自己操作的即时反馈（连点两次保存也该各回一次），
  // loading 要返回可 close 的实例，包了会把调用方的关闭逻辑打断。
  const themes = ['error', 'warning'];
  const plugin: any = MessagePlugin;
  themes.forEach((theme) => {
    const origin = plugin[theme];
    if (typeof origin !== 'function') return;
    plugin[theme] = function guarded(params: any, duration?: number) {
      if (shouldDrop(theme, params)) return noopInstance();
      return origin.call(plugin, params, duration);
    };
  });
  // TDesign 注册的 $message 与 MessagePlugin 通常是同一个对象；
  // 万一不是（不同版本实现有差异），这里再兜一次。
  if ((Vue.prototype as any).$message !== plugin) {
    (Vue.prototype as any).$message = plugin;
  }
}
