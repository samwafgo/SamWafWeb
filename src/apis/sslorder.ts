import request from '@/utils/request'

// SSL 订单列表
export function sslOrderListApi(params) {
  return request({
    url: '/wafhost/sslorder/list',
    method: 'post',
    data: params
  })
}

// SSL 订单 - 删除
export function sslOrderDelApi(params) {
  return request({
    url: '/wafhost/sslorder/del',
    method: 'get',
    params: params
  })
}

// SSL 订单 - 编辑
export function sslOrderEditApi(params) {
  return request({
    url: '/wafhost/sslorder/edit',
    method: 'post',
    data: params
  })
}

// SSL 订单 - 添加
export function sslOrderAddApi(params) {
  return request({
    url: '/wafhost/sslorder/add',
    method: 'post',
    data: params
  })
}

// SSL 订单 - 获取详情
export function sslOrderDetailApi(params) {
  return request({
    url: '/wafhost/sslorder/detail',
    method: 'get',
    params: params
  })
}
