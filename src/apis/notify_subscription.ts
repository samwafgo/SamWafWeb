import request from '@/utils/request'

//列表
export function getNotifySubscriptionList(params) {
  return request({
    url: '/notify/subscription/list',
    method: 'post',
    data: params
  })
}

//添加
export function addNotifySubscription(params) {
  return request({
    url: '/notify/subscription/add',
    method: 'post',
    data: params
  })
}

//编辑
export function editNotifySubscription(params) {
  return request({
    url: '/notify/subscription/edit',
    method: 'post',
    data: params
  })
}

//删除
export function deleteNotifySubscription(params) {
  return request({
    url: '/notify/subscription/del',
    method: 'get',
    params: params
  })
}

//详情
export function getNotifySubscriptionDetail(params) {
  return request({
    url: '/notify/subscription/detail',
    method: 'get',
    params: params
  })
}


