import request from '@/utils/request'
//在线会话列表
export function wafHttpAuthSessionListApi(params) {
  return request({
    url: '/wafhost/httpauthsession/list',
    method: 'post',
    data: params
  })
}
//踢下线单条
export function wafHttpAuthSessionKickApi(params) {
  return request({
    url: '/wafhost/httpauthsession/kick',
    method: 'get',
    params: params
  })
}
//踢下线某用户在本站点的全部会话
export function wafHttpAuthSessionKickByUserApi(params) {
  return request({
    url: '/wafhost/httpauthsession/kickbyuser',
    method: 'post',
    data: params
  })
}
//清空本站点全部会话
export function wafHttpAuthSessionKickAllApi(params) {
  return request({
    url: '/wafhost/httpauthsession/kickall',
    method: 'post',
    data: params
  })
}
