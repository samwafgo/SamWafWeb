import request from '@/utils/request'
//列表
export function wafPrivateInfoListApi(params) {
  return request({
    url: '/wafhost/privateinfo/list',
    method: 'post',
    data: params
  })
}
//删除
export function wafPrivateInfoDelApi(params) {
  return request({
    url: '/wafhost/privateinfo/del',
    method: 'get',
    params: params
  })
}
//编辑
export function wafPrivateInfoEditApi(params) {
  return request({
    url: '/wafhost/privateinfo/edit',
    method: 'post',
    data: params
  })
}
//添加
export function wafPrivateInfoAddApi(params) {
  return request({
    url: '/wafhost/privateinfo/add',
    method: 'post',
    data: params
  })
}
//详细
export function wafPrivateInfoDetailApi(params) {
  return request({
    url: '/wafhost/privateinfo/detail',
    method: 'get',
    params: params
  })
}
