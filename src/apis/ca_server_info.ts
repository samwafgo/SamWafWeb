import request from '@/utils/request'
//列表
export function wafCaServerInfoListApi(params) {
  return request({
    url: '/wafhost/caserverinfo/list',
    method: 'post',
    data: params
  })
}
//删除
export function wafCaServerInfoDelApi(params) {
  return request({
    url: '/wafhost/caserverinfo/del',
    method: 'get',
    params: params
  })
}
//编辑
export function wafCaServerInfoEditApi(params) {
  return request({
    url: '/wafhost/caserverinfo/edit',
    method: 'post',
    data: params
  })
}
//添加
export function wafCaServerInfoAddApi(params) {
  return request({
    url: '/wafhost/caserverinfo/add',
    method: 'post',
    data: params
  })
}
//详细
export function wafCaServerInfoDetailApi(params) {
  return request({
    url: '/wafhost/caserverinfo/detail',
    method: 'get',
    params: params
  })
}
