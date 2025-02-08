import request from '@/utils/request'
//列表
export function wafBlockingPageListApi(params) {
  return request({
    url: '/wafhost/blockingpage/list',
    method: 'post',
    data: params
  })
}
//删除
export function wafBlockingPageDelApi(params) {
  return request({
    url: '/wafhost/blockingpage/del',
    method: 'get',
    params: params
  })
}
//编辑
export function wafBlockingPageEditApi(params) {
  return request({
    url: '/wafhost/blockingpage/edit',
    method: 'post',
    data: params
  })
}
//添加
export function wafBlockingPageAddApi(params) {
  return request({
    url: '/wafhost/blockingpage/add',
    method: 'post',
    data: params
  })
}
//详细
export function wafBlockingPageDetailApi(params) {
  return request({
    url: '/wafhost/blockingpage/detail',
    method: 'get',
    params: params
  })
}
