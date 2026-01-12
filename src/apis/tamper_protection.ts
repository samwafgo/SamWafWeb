import request from '@/utils/request'
//列表
export function wafTamperProtectionListApi(params) {
  return request({
    url: '/wafhost/tamperprotection/list',
    method: 'post',
    data: params
  })
}
//删除
export function wafTamperProtectionDelApi(params) {
  return request({
    url: '/wafhost/tamperprotection/del',
    method: 'get',
    params: params
  })
}
//编辑
export function wafTamperProtectionEditApi(params) {
  return request({
    url: '/wafhost/tamperprotection/edit',
    method: 'post',
    data: params
  })
}
//添加
export function wafTamperProtectionAddApi(params) {
  return request({
    url: '/wafhost/tamperprotection/add',
    method: 'post',
    data: params
  })
}
//详细
export function wafTamperProtectionDetailApi(params) {
  return request({
    url: '/wafhost/tamperprotection/detail',
    method: 'get',
    params: params
  })
}
//基线扫描
export function wafTamperProtectionBaselineScanApi(params) {
  return request({
    url: '/wafhost/tamperprotection/baseline_scan',
    method: 'post',
    data: params
  })
}