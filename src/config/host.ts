declare global {
  interface Window {
    __SAMWAF_SECURITY_PATH__?: string;
  }
}

/**
 * 获取安全路径前缀：
 * 1. 优先读 window.__SAMWAF_SECURITY_PATH__（后端 release 模式注入到 index.html）
 * 2. 其次读 localStorage（开发模式或跨 session 持久化，由 vpconfig 页面保存时写入）
 */
const securityPath: string = (() => {
  if (typeof window === 'undefined') return '';
  if (window.__SAMWAF_SECURITY_PATH__) return window.__SAMWAF_SECURITY_PATH__;
  try {
    return localStorage.getItem('__samwaf_security_path__') || '';
  } catch {
    return '';
  }
})();

export default {
  development: {
    // 开发环境接口请求（支持安全路径前缀）
    API: `http://127.0.0.1:26666${securityPath}/api/v1`,
    // 开发环境 cdn 路径
    CDN: '',
  },
  test: {
    // 测试环境接口地址
    API: 'https://service-exndqyuk-1257786608.gz.apigw.tencentcs.com',
    // 测试环境 cdn 路径
    CDN: '',
  },
  release: {
    // 正式环境接口地址（支持安全路径前缀）
    API: securityPath + '/api/v1',
    // 正式环境 cdn 路径
    CDN: '',
  },
};
