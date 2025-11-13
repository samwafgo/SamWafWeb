import request from '@/utils/request'
//更新Vp配置文件的ip白名单
export function updateIpWhitelistApi(data) {
  return request({
    url: 'vipconfig/updateIpWhitelist',
    method: 'post',
    data: data
  })
}
//更新Vp配置文件的ip白名单 
export function getIpWhitelistApi(params) {
  return request({
    url: 'vipconfig/getIpWhitelist',
    method: 'get',
    params: params
  })
}
//更新SSL启用状态
export function updateSslEnableApi(data) {
  return request({
    url: 'vipconfig/updateSslEnable',
    method: 'post',
    data: data
  })
}
//获取SSL状态
export function getSslStatusApi(params) {
  return request({
    url: 'vipconfig/getSslStatus',
    method: 'get',
    params: params
  })
}
//上传SSL证书
export function uploadSslCertApi(data) {
  return request({
    url: 'vipconfig/uploadSslCert',
    method: 'post',
    data: data
  })
}
//重启管理端
export function restartManagerApi(data) {
  return request({
    url: 'vipconfig/restartManager',
    method: 'post',
    data: data
  })
}
