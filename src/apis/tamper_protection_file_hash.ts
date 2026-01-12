import request from '@/utils/request'
//列表
export function wafTamperProtectionFileHashListApi(params) {
  return request({
    url: '/wafhost/tamperprotectionfilehash/list',
    method: 'post',
    data: params
  })
}
//删除
export function wafTamperProtectionFileHashDelApi(params) {
  return request({
    url: '/wafhost/tamperprotectionfilehash/del',
    method: 'get',
    params: params
  })
}
//编辑
export function wafTamperProtectionFileHashEditApi(params) {
  return request({
    url: '/wafhost/tamperprotectionfilehash/edit',
    method: 'post',
    data: params
  })
}
//添加
export function wafTamperProtectionFileHashAddApi(params) {
  return request({
    url: '/wafhost/tamperprotectionfilehash/add',
    method: 'post',
    data: params
  })
}
//详细
export function wafTamperProtectionFileHashDetailApi(params) {
  return request({
    url: '/wafhost/tamperprotectionfilehash/detail',
    method: 'get',
    params: params
  })
}
