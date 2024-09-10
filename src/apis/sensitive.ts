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
