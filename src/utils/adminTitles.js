import Vue from 'vue';
import request from '@/utils/request';

export const adminTitles = Vue.observable({ admin_title: '' });

export function applyAdminTitles(value) {
  adminTitles.admin_title = typeof value?.admin_title === 'string' ? value.admin_title : '';
}

export async function loadAdminTitles() {
  const bootstrap = document.getElementById('samwaf-ui-config');
  if (bootstrap) {
    try {
      applyAdminTitles(JSON.parse(bootstrap.textContent));
      return;
    } catch (_) { /* 无法读取启动配置时改走接口 */ }
  }
  let timer;
  try {
    // 同时限制握手和请求的总等待时间。
    const deadline = new Promise((resolve) => { timer = setTimeout(() => resolve(null), 2500); });
    const res = await Promise.race([
      request({ url: 'public/uiconfig', method: 'get', timeout: 2500 }),
      deadline,
    ]);
    if (res?.code === 0) applyAdminTitles(res.data);
  } catch (_) { /* 保留默认标题，继续加载页面 */ }
  finally { clearTimeout(timer); }
}
