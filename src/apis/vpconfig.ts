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
//获取安全路径入口配置
export function getSecurityEntryApi(params) {
  return request({
    url: 'vipconfig/getSecurityEntry',
    method: 'get',
    params: params
  })
}
//更新安全路径入口配置
export function updateSecurityEntryApi(data) {
  return request({
    url: 'vipconfig/updateSecurityEntry',
    method: 'post',
    data: data
  })
}
//获取通知标题前缀
export function getNoticeTitleApi(params) {
  return request({
    url: 'vipconfig/getNoticeTitle',
    method: 'get',
    params: params
  })
}
//更新通知标题前缀
export function updateNoticeTitleApi(data) {
  return request({
    url: 'vipconfig/updateNoticeTitle',
    method: 'post',
    data: data
  })
}
//获取管理端仅允许HTTPS开关
export function getSslForceHttpsApi(params) {
  return request({
    url: 'vipconfig/getSslForceHttps',
    method: 'get',
    params: params
  })
}
//更新管理端仅允许HTTPS开关
export function updateSslForceHttpsApi(data) {
  return request({
    url: 'vipconfig/updateSslForceHttps',
    method: 'post',
    data: data
  })
}
//获取管理端证书绑定的证书夹
export function getSslBindCertApi(params) {
  return request({
    url: 'vipconfig/getSslBindCert',
    method: 'get',
    params: params
  })
}
//绑定/解绑管理端证书到证书夹（ssl_config_id 传空表示解绑）
export function updateSslBindCertApi(data) {
  return request({
    url: 'vipconfig/updateSslBindCert',
    method: 'post',
    data: data
  })
}
//获取域名白名单
export function getDomainWhitelistApi(params) {
  return request({
    url: 'vipconfig/getDomainWhitelist',
    method: 'get',
    params: params
  })
}
//更新域名白名单
export function updateDomainWhitelistApi(data) {
  return request({
    url: 'vipconfig/updateDomainWhitelist',
    method: 'post',
    data: data
  })
}
