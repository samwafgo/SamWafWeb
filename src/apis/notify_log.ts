import request from '@/utils/request'

//列表
export function getNotifyLogList(params) {
  return request({
    url: '/notify/log/list',
    method: 'post',
    data: params
  })
}

//删除
export function deleteNotifyLog(params) {
  return request({
    url: '/notify/log/del',
    method: 'get',
    params: params
  })
}

//详情
export function getNotifyLogDetail(params) {
  return request({
    url: '/notify/log/detail',
    method: 'get',
    params: params
  })
}


