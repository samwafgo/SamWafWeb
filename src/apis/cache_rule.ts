import request from '@/utils/request'
//列表
export function wafCacheRuleListApi(params) {
  return request({
    url: '/wafhost/cacherule/list',
    method: 'post',
    data: params
  })
}
//删除
export function wafCacheRuleDelApi(params) {
  return request({
    url: '/wafhost/cacherule/del',
    method: 'get',
    params: params
  })
}
//编辑
export function wafCacheRuleEditApi(params) {
  return request({
    url: '/wafhost/cacherule/edit',
    method: 'post',
    data: params
  })
}
//添加
export function wafCacheRuleAddApi(params) {
  return request({
    url: '/wafhost/cacherule/add',
    method: 'post',
    data: params
  })
}
//详细
export function wafCacheRuleDetailApi(params) {
  return request({
    url: '/wafhost/cacherule/detail',
    method: 'get',
    params: params
  })
}
