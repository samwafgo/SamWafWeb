import request from '@/utils/request'
//Sensitive Manage
export function wafSensitiveListApi(params) {
  return request({
    url: '/wafhost/sensitive/list',
    method: 'post',
    data: params
  })
}
//Delete Sensitive
export function wafSensitiveDelApi(params) {
  return request({
    url: '/wafhost/sensitive/del',
    method: 'get',
    params: params
  })
}
//Edit Sensitive
export function wafSensitiveEditApi(params) {
  return request({
    url: '/wafhost/sensitive/edit',
    method: 'post',
    data: params
  })
}
//Add Sensitive
export function wafSensitiveAddApi(params) {
  return request({
    url: '/wafhost/sensitive/add',
    method: 'post',
    data: params
  })
}
//Detail Sensitive
export function wafSensitiveDetailApi(params) {
  return request({
    url: '/wafhost/sensitive/detail',
    method: 'get',
    params: params
  })
}
//批量删除敏感词
export function wafSensitiveBatchDelApi(params) {
  return request({
    url: '/wafhost/sensitive/batch/del',
    method: 'post',
    data: params
  })
}
//清空所有敏感词
export function wafSensitiveDelAllApi(params) {
  return request({
    url: '/wafhost/sensitive/delall',
    method: 'post',
    data: params
  })
}
