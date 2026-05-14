import request from '@/utils/request'
//列表
export function wafPathRuleListApi(params) {
  return request({
    url: '/wafhost/pathrule/list',
    method: 'post',
    data: params
  })
}
//删除
export function wafPathRuleDelApi(params) {
  return request({
    url: '/wafhost/pathrule/del',
    method: 'get',
    params: params
  })
}
//编辑
export function wafPathRuleEditApi(params) {
  return request({
    url: '/wafhost/pathrule/edit',
    method: 'post',
    data: params
  })
}
//添加
export function wafPathRuleAddApi(params) {
  return request({
    url: '/wafhost/pathrule/add',
    method: 'post',
    data: params
  })
}
//详细
export function wafPathRuleDetailApi(params) {
  return request({
    url: '/wafhost/pathrule/detail',
    method: 'get',
    params: params
  })
}
