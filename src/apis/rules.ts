import request from '@/utils/request'
//查看规则列表
export function wafRuleListApi(params) {
  return request({
    url: '/wafhost/rule/list',
    method: 'post',
    data: params
  })
}
//删除规则
export function wafRuleDelApi(params) {
  return request({
    url: '/wafhost/rule/del',
    method: 'get',
    params: params
  })
}
//编辑规则
export function wafRuleEditApi(params) {
  return request({
    url: '/wafhost/rule/edit',
    method: 'post',
    data: params
  })
}
//添加规则
export function wafRuleAddApi(params) {
  return request({
    url: '/wafhost/rule/add',
    method: 'post',
    data: params
  })
}
//详细规则
export function wafRuleDetailApi(params) {
  return request({
    url: '/wafhost/rule/detail',
    method: 'get',
    params: params
  })
}
//批量删除规则
export function wafRuleBatchDelApi(params) {
  return request({
    url: '/wafhost/rule/batchdel',
    method: 'post',
    data: params
  })
}
//清空所有规则
export function wafRuleDelAllApi(params) {
  return request({
    url: '/wafhost/rule/delall',
    method: 'post',
    data: params
  })
}
// 规则格式预览
export function wafRuleFormatApi(params) {
  return request({
    url: '/wafhost/rule/format',
    method: 'post',
    data: params
  })
}
//更改规则状态
export function changeRuleStatus(params) {
  return request({
    url: '/wafhost/rule/rulestatus',
    method: 'get',
    params: params
  })
}
