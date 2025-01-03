import request from '@/utils/request'
//列表
export function wafSslExpireListApi(params) {
  return request({
    url: '/wafhost/sslexpire/list',
    method: 'post',
    data: params
  })
}
//删除
export function wafSslExpireDelApi(params) {
  return request({
    url: '/wafhost/sslexpire/del',
    method: 'get',
    params: params
  })
}
//编辑
export function wafSslExpireEditApi(params) {
  return request({
    url: '/wafhost/sslexpire/edit',
    method: 'post',
    data: params
  })
}
//添加
export function wafSslExpireAddApi(params) {
  return request({
    url: '/wafhost/sslexpire/add',
    method: 'post',
    data: params
  })
}
//详细
export function wafSslExpireDetailApi(params) {
  return request({
    url: '/wafhost/sslexpire/detail',
    method: 'get',
    params: params
  })
}
//发起检测
export function wafSslExpireNowCheckApi(params) {
  return request({
    url: '/wafhost/sslexpire/nowcheck',
    method: 'get',
    params: params
  })
}
//同步已有域名
export function wafSslExpireSyncHostApi(params) {
  return request({
    url: '/wafhost/sslexpire/sync_host',
    method: 'get',
    params: params
  })
}
