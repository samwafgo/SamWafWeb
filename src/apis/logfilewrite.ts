import request from '@/utils/request'

// 获取日志文件预览
export function getLogPreviewApi(params) {
  return request({
    url: 'logfilewrite/preview',
    method: 'get',
    params: params
  })
}

// 获取当前日志文件信息
export function getCurrentFileInfoApi(params?) {
  return request({
    url: 'logfilewrite/currentfile',
    method: 'get',
    params: params
  })
}

// 获取备份文件列表
export function getBackupFilesApi(params?) {
  return request({
    url: 'logfilewrite/backupfiles',
    method: 'get',
    params: params
  })
}

// 清空日志文件
export function clearLogFileApi(data?) {
  return request({
    url: 'logfilewrite/clear',
    method: 'post',
    data: data
  })
}

// 获取模板变量列表
export function getTemplateVariablesApi(params?) {
  return request({
    url: 'logfilewrite/variables',
    method: 'get',
    params: params
  })
}
