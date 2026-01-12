import request from '@/utils/request'
//列表
export function wafTamperProtectionLogListApi(params) {
  return request({
    url: '/wafhost/tamperprotectionlog/list',
    method: 'post',
    data: params
  })
}
//删除
export function wafTamperProtectionLogDelApi(params) {
  return request({
    url: '/wafhost/tamperprotectionlog/del',
    method: 'get',
    params: params
  })
}
//编辑
export function wafTamperProtectionLogEditApi(params) {
  return request({
    url: '/wafhost/tamperprotectionlog/edit',
    method: 'post',
    data: params
  })
}
//添加
export function wafTamperProtectionLogAddApi(params) {
  return request({
    url: '/wafhost/tamperprotectionlog/add',
    method: 'post',
    data: params
  })
}
//详细
export function wafTamperProtectionLogDetailApi(params) {
  return request({
    url: '/wafhost/tamperprotectionlog/detail',
    method: 'get',
    params: params
  })
}
