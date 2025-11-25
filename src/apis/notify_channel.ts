import request from '@/utils/request'

//列表
export function getNotifyChannelList(params) {
  return request({
    url: '/notify/channel/list',
    method: 'post',
    data: params
  })
}

//添加
export function addNotifyChannel(params) {
  return request({
    url: '/notify/channel/add',
    method: 'post',
    data: params
  })
}

//编辑
export function editNotifyChannel(params) {
  return request({
    url: '/notify/channel/edit',
    method: 'post',
    data: params
  })
}

//删除
export function deleteNotifyChannel(params) {
  return request({
    url: '/notify/channel/del',
    method: 'get',
    params: params
  })
}

//详情
export function getNotifyChannelDetail(params) {
  return request({
    url: '/notify/channel/detail',
    method: 'get',
    params: params
  })
}

//测试连接
export function testNotifyChannel(params) {
  return request({
    url: '/notify/channel/test',
    method: 'post',
    data: params
  })
}


