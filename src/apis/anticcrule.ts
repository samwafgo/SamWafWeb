import request from '@/utils/request'

//CC规则列表
export function wafAntiCCRuleListApi(params) {
  return request({
    url: '/wafhost/anticcrule/list',
    method: 'post',
    data: params
  })
}
//CC规则详情
export function wafAntiCCRuleDetailApi(params) {
  return request({
    url: '/wafhost/anticcrule/detail',
    method: 'get',
    params: params
  })
}
//新增CC规则
export function wafAntiCCRuleAddApi(params) {
  return request({
    url: '/wafhost/anticcrule/add',
    method: 'post',
    data: params
  })
}
//编辑CC规则
export function wafAntiCCRuleEditApi(params) {
  return request({
    url: '/wafhost/anticcrule/edit',
    method: 'post',
    data: params
  })
}
//删除CC规则
export function wafAntiCCRuleDelApi(params) {
  return request({
    url: '/wafhost/anticcrule/del',
    method: 'get',
    params: params
  })
}
//启用/停用CC规则
export function wafAntiCCRuleToggleApi(params) {
  return request({
    url: '/wafhost/anticcrule/toggle',
    method: 'post',
    data: params
  })
}
//调整CC规则优先级
export function wafAntiCCRuleSortApi(params) {
  return request({
    url: '/wafhost/anticcrule/sort',
    method: 'post',
    data: params
  })
}
//各站点的人机验证要点（全局CC规则用：配置在各站点上，没有单一站点可跳）
export function wafAntiCCRuleCaptchaOverviewApi(params) {
  return request({
    url: '/wafhost/anticcrule/captchaoverview',
    method: 'get',
    params: params
  })
}
//按历史流量推荐阈值
export function wafAntiCCRuleThresholdRecommendApi(params) {
  return request({
    url: '/wafhost/anticcrule/threshold/recommend',
    method: 'post',
    data: params
  })
}
//规则命中看板（进程内统计，重启归零）
export function wafAntiCCRuleHitsApi(params) {
  return request({
    url: '/wafhost/anticcrule/hits',
    method: 'get',
    params: params
  })
}
//紧急模式开关（对标 Under Attack Mode）
export function wafAntiCCRuleSetEmergencyApi(params) {
  return request({
    url: '/wafhost/anticcrule/emergency',
    method: 'post',
    data: params
  })
}
//紧急模式状态；不传站点时返回所有开着的站点
export function wafAntiCCRuleEmergencyStatusApi(params) {
  return request({
    url: '/wafhost/anticcrule/emergency/status',
    method: 'get',
    params: params
  })
}
