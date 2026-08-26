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
//获取管理端可信代理网段
export function getManageTrustedProxiesApi(params) {
  return request({
    url: 'vipconfig/getManageTrustedProxies',
    method: 'get',
    params: params
  })
}
//更新管理端可信代理网段
export function updateManageTrustedProxiesApi(data) {
  return request({
    url: 'vipconfig/updateManageTrustedProxies',
    method: 'post',
    data: data
  })
}
//CDN厂商快捷填充：获取某厂商官方回源段CIDR
export function getCdnProviderRangesApi(params) {
  return request({
    url: 'vipconfig/cdnProviderRanges',
    method: 'get',
    params: params
  })
}
//获取管理端引用的CDN厂商
export function getManageCDNProviderApi(params) {
  return request({
    url: 'vipconfig/getManageCDNProvider',
    method: 'get',
    params: params
  })
}
//更新管理端引用的CDN厂商
export function updateManageCDNProviderApi(data) {
  return request({
    url: 'vipconfig/updateManageCDNProvider',
    method: 'post',
    data: data
  })
}
//获取CORS跨域来源白名单
export function getCorsAllowOriginsApi(params) {
  return request({
    url: 'vipconfig/getCorsAllowOrigins',
    method: 'get',
    params: params
  })
}
//更新CORS跨域来源白名单
export function updateCorsAllowOriginsApi(data) {
  return request({
    url: 'vipconfig/updateCorsAllowOrigins',
    method: 'post',
    data: data
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
//获取管理端本地证书状态（本地CA是否存在、当前证书是否本地签发、SAN 与到期时间）
export function getLocalCertStatusApi(params) {
  return request({
    url: 'vipconfig/localCertStatus',
    method: 'get',
    params: params
  })
}
//生成/重新签发管理端本地证书（同一批访问地址重签即为续期，CA 不变、已导入的信任不受影响）
export function generateLocalCertApi(data) {
  return request({
    url: 'vipconfig/generateLocalCert',
    method: 'post',
    data: data
  })
}

//重建本地CA（作废旧根证书，破坏性操作：所有导入过旧根证书的电脑都要重新导入）
export function rotateLocalCaApi(data) {
  return request({
    url: 'vipconfig/rotateLocalCa',
    method: 'post',
    data: data
  })
}
//清除本地CA与本地证书（需先关闭SSL或改用其它来源）
export function clearLocalCertApi(data) {
  return request({
    url: 'vipconfig/clearLocalCert',
    method: 'post',
    data: data
  })
}
