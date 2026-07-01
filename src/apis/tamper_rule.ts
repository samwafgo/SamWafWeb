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
//批量/整站重新学习（ids 为空=整站全部）
export function wafTamperRuleRelearnBatchApi(params) {
  return request({
    url: '/wafhost/tamperrule/relearnbatch',
    method: 'post',
    data: params
  })
}
//从页面提取受保护URL候选（只抓本站后端）
export function wafTamperRuleExtractApi(params) {
  return request({
    url: '/wafhost/tamperrule/extract',
    method: 'post',
    data: params
  })
}
//批量添加受保护URL
export function wafTamperRuleAddBatchApi(params) {
  return request({
    url: '/wafhost/tamperrule/addbatch',
    method: 'post',
    data: params
  })
}
//批量删除受保护URL
export function wafTamperRuleDelBatchApi(params) {
  return request({
    url: '/wafhost/tamperrule/delbatch',
    method: 'post',
    data: params
  })
}
