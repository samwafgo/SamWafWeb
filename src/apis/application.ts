import request from '@/utils/request'

export function wafAppListApi(params) {
  return request({ url: '/application/app/list', method: 'post', data: params })
}
export function wafAppAddApi(params) {
  return request({ url: '/application/app/add', method: 'post', data: params })
}
export function wafAppEditApi(params) {
  return request({ url: '/application/app/edit', method: 'post', data: params })
}
export function wafAppDetailApi(params) {
  return request({ url: '/application/app/detail', method: 'get', params })
}
export function wafAppDelApi(params) {
  return request({ url: '/application/app/del', method: 'get', params })
}
export function wafAppStartApi(params) {
  return request({ url: '/application/app/start', method: 'get', params })
}
export function wafAppStopApi(params) {
  return request({ url: '/application/app/stop', method: 'get', params })
}
export function wafAppRestartApi(params) {
  return request({ url: '/application/app/restart', method: 'get', params })
}
export function wafAppStatusApi(params) {
  return request({ url: '/application/app/status', method: 'get', params })
}
export function wafAppLogsApi(params) {
  return request({ url: '/application/app/logs', method: 'get', params })
}
export function wafAppClearLogsApi(params) {
  return request({ url: '/application/app/clearlogs', method: 'post', data: params })
}
export function wafAppBackupsApi(params) {
  return request({ url: '/application/app/backups', method: 'get', params })
}
export function wafAppRollbackApi(params) {
  return request({ url: '/application/app/rollback', method: 'get', params })
}
export function wafAppNetStatsApi(params) {
  return request({ url: '/application/app/network', method: 'get', params })
}
