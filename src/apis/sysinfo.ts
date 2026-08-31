import request from '@/utils/request'

//查询版本信息
export function SysVersionApi(params) {
  return request({
    url: 'sysinfo/version',
    method: 'get',
    params: params
  })
}

//查询系统运行环境信息（操作系统/内核/容器/运行时长等）
export function SysRuntimeInfoApi() {
  return request({
    url: 'sysinfo/runtimeinfo',
    method: 'get'
  })
}

//查询是否需要升级版本信息
// opts 可传 { background: true }：页面自动发起的检查，超时只进小铃铛不弹通知
export function CheckVersionApi(params?, opts?) {
  return request({
    url: 'sysinfo/checkversion',
    method: 'get',
    params: params,
    ...(opts || {})
  })
}

//升级
export function DoUpdateApi(params) {
  return request({
    url: 'sysinfo/update',
    method: 'get',
    params: params
  })
}
export function GetAnnouncementApi(params?, opts?) {
  return request({
    url: 'sysinfo/announcement',
    method: 'get',
    params: params,
    ...(opts || {})
  })
}

// 获取登录后的系统参数（含应急路径等）
export function GetSystemParamsApi() {
  return request({ url: 'sysinfo/systemparams', method: 'get' })
}

// 获取可回退的备份版本列表
export function GetRollbackListApi() {
  return request({ url: 'sysinfo/rollbacklist', method: 'get' })
}

// 触发版本回退
export function DoRollbackApi(params: { version: string }) {
  return request({ url: 'sysinfo/rollback', method: 'get', params })
}

// 查询升级进度（升级中会被高频轮询，且重启期间必然请求失败，一律走 background 不弹全局错误）
export function GetUpdateProgressApi() {
  return request({ url: 'sysinfo/updateprogress', method: 'get', background: true })
}

// 取消升级（仅下载阶段可取消）
export function CancelUpdateApi() {
  return request({ url: 'sysinfo/cancelupdate', method: 'get' })
}
