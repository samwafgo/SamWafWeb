import request from '@/utils/request'

// --- 操作密码 session 管理（5 分钟滑动窗口） ---
const OP_PWD_KEY    = 'app_op_password'
const OP_PWD_TS_KEY = 'app_op_password_ts'
const OP_PWD_TTL    = 5 * 60 * 1000  // 5 minutes

export function getAppOpPassword(): string {
  const pwd = sessionStorage.getItem(OP_PWD_KEY)
  if (!pwd) return ''
  const ts = parseInt(sessionStorage.getItem(OP_PWD_TS_KEY) || '0', 10)
  if (Date.now() - ts > OP_PWD_TTL) {
    clearAppOpPassword()
    return ''
  }
  // 滑动窗口：读取即刷新时间戳
  sessionStorage.setItem(OP_PWD_TS_KEY, Date.now().toString())
  return pwd
}
export function saveAppOpPassword(pwd: string) {
  sessionStorage.setItem(OP_PWD_KEY, pwd)
  sessionStorage.setItem(OP_PWD_TS_KEY, Date.now().toString())
}
export function clearAppOpPassword() {
  sessionStorage.removeItem(OP_PWD_KEY)
  sessionStorage.removeItem(OP_PWD_TS_KEY)
}

// 高危请求：自动附加 X-App-Op-Password（从 sessionStorage 取）
function dangerousReq(config: any) {
  const pwd = getAppOpPassword()
  if (pwd) {
    config.headers = { ...(config.headers || {}), 'X-App-Op-Password': pwd }
  }
  return request(config)
}

// --- 普通 API ---
export function wafAppListApi(params: any) {
  return request({ url: '/application/app/list', method: 'post', data: params })
}
export function wafAppDetailApi(params: any) {
  return request({ url: '/application/app/detail', method: 'get', params })
}
export function wafAppStatusApi(params: any) {
  return request({ url: '/application/app/status', method: 'get', params })
}
export function wafAppLogsApi(params: any) {
  return request({ url: '/application/app/logs', method: 'get', params })
}
export function wafAppClearLogsApi(params: any) {
  return request({ url: '/application/app/clearlogs', method: 'post', data: params })
}
export function wafAppBackupsApi(params: any) {
  return request({ url: '/application/app/backups', method: 'get', params })
}
export function wafAppNetStatsApi(params: any) {
  return request({ url: '/application/app/network', method: 'get', params })
}
export function wafAppChangeLogsApi(params: any) {
  return request({ url: '/application/app/changelogs', method: 'post', data: params })
}

// 验证操作密码是否正确（先验证再保存，避免错误密码存入 session）
export function wafAppVerifyPwdApi(pwd: string) {
  return request({ url: '/application/app/verifypwd', method: 'get', headers: { 'X-App-Op-Password': pwd } })
}

// --- 高危 API（需操作密码头）---
export function wafAppAddApi(params: any) {
  return dangerousReq({ url: '/application/app/add', method: 'post', data: params })
}
export function wafAppEditApi(params: any) {
  return dangerousReq({ url: '/application/app/edit', method: 'post', data: params })
}
export function wafAppDelApi(params: any) {
  return dangerousReq({ url: '/application/app/del', method: 'get', params })
}
export function wafAppStartApi(params: any) {
  return dangerousReq({ url: '/application/app/start', method: 'get', params })
}
export function wafAppStopApi(params: any) {
  return request({ url: '/application/app/stop', method: 'get', params }) // stop 不在高危组
}
export function wafAppRestartApi(params: any) {
  return dangerousReq({ url: '/application/app/restart', method: 'get', params })
}
// 返回带 op password header 的 request 配置，供 AppUpgrade 直接 request()
// opPwd 优先使用显式传入值，fallback 到 sessionStorage
export function buildUploadConfig(url: string, data: any, timeout: number, opPwd?: string): any {
  const pwd = opPwd || getAppOpPassword()
  const headers: any = pwd ? { 'X-App-Op-Password': pwd } : {}
  return { url, method: 'post', data, timeout, headers }
}
export function buildRollbackConfig(params: any, opPwd?: string): any {
  const pwd = opPwd || getAppOpPassword()
  const headers: any = pwd ? { 'X-App-Op-Password': pwd } : {}
  return { url: '/application/app/rollback', method: 'get', params, timeout: 60000, headers }
}
