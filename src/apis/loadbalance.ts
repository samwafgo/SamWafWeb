import request from '@/utils/request'
//查看负载列表
export function wafLoadBalanceListApi(params) {
  return request({
    url: '/wafhost/loadbalance/list',
    method: 'post',
    data: params
  })
}
//删除负载
export function wafLoadBalanceDelApi(params) {
  return request({
    url: '/wafhost/loadbalance/del',
    method: 'get',
    params: params
  })
}
//编辑负载
export function wafLoadBalanceEditApi(params) {
  return request({
    url: '/wafhost/loadbalance/edit',
    method: 'post',
    data: params
  })
}
//添加负载
export function wafLoadBalanceAddApi(params) {
  return request({
    url: '/wafhost/loadbalance/add',
    method: 'post',
    data: params
  })
}
//详细负载
export function wafLoadBalanceDetailApi(params) {
  return request({
    url: '/wafhost/loadbalance/detail',
    method: 'get',
    params: params
  })
}
