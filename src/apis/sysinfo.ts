import request from '@/utils/request'

//查询版本信息
export function SysVersionApi(params) {
  return request({
    url: 'sysinfo/version',
    method: 'get',
    params: params
  })
}

//查询是否需要升级版本信息
export function CheckVersionApi(params) {
  return request({
    url: 'sysinfo/checkversion',
    method: 'get',
    params: params
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
export function GetAnnouncementApi(params) {
  return request({
    url: 'sysinfo/announcement',
    method: 'get',
    params: params
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
