import request from '@/utils/request'
//列表
export function wafPrivateGroupListApi(params) {
  return request({
    url: '/wafhost/privategroup/list',
    method: 'post',
    data: params
  })
}
export function wafPrivateGroupListByBelongCloudApi(params) {
  return request({
    url: '/wafhost/privategroup/listbybelongcloud',
    method: 'post',
    data: params
  })
}
//删除
export function wafPrivateGroupDelApi(params) {
  return request({
    url: '/wafhost/privategroup/del',
    method: 'get',
    params: params
  })
}
//编辑
export function wafPrivateGroupEditApi(params) {
  return request({
    url: '/wafhost/privategroup/edit',
    method: 'post',
    data: params
  })
}
//添加
export function wafPrivateGroupAddApi(params) {
  return request({
    url: '/wafhost/privategroup/add',
    method: 'post',
    data: params
  })
}
//详细
export function wafPrivateGroupDetailApi(params) {
  return request({
    url: '/wafhost/privategroup/detail',
    method: 'get',
    params: params
  })
}
