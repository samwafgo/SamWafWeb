import request from '@/utils/request'
//列表
export function wafTamperRuleListApi(params) {
  return request({
    url: '/wafhost/tamperrule/list',
    method: 'post',
    data: params
  })
}
//删除
export function wafTamperRuleDelApi(params) {
  return request({
    url: '/wafhost/tamperrule/del',
    method: 'get',
    params: params
  })
}
//编辑
export function wafTamperRuleEditApi(params) {
  return request({
    url: '/wafhost/tamperrule/edit',
    method: 'post',
    data: params
  })
}
//添加
export function wafTamperRuleAddApi(params) {
  return request({
    url: '/wafhost/tamperrule/add',
    method: 'post',
    data: params
  })
}
//详细
export function wafTamperRuleDetailApi(params) {
  return request({
    url: '/wafhost/tamperrule/detail',
    method: 'get',
    params: params
  })
}
//重新学习基线
export function wafTamperRuleRelearnApi(params) {
  return request({
    url: '/wafhost/tamperrule/relearn',
    method: 'get',
    params: params
  })
}
//查看基线正文（按需拉取；文本回 content，图片回 content_base64）
export function wafTamperRuleBaselineApi(params) {
  return request({
    url: '/wafhost/tamperrule/baseline',
    method: 'get',
    params: params
  })
}
