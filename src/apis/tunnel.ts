import request from '@/utils/request'
//列表
export function wafTunnelListApi(params) {
  return request({
    url: '/tunnel/tunnel/list',
    method: 'post',
    data: params
  })
}
//删除
export function wafTunnelDelApi(params) {
  return request({
    url: '/tunnel/tunnel/del',
    method: 'get',
    params: params
  })
}
//编辑
export function wafTunnelEditApi(params) {
  return request({
    url: '/tunnel/tunnel/edit',
    method: 'post',
    data: params
  })
}
//添加
export function wafTunnelAddApi(params) {
  return request({
    url: '/tunnel/tunnel/add',
    method: 'post',
    data: params
  })
}
//详细
export function wafTunnelDetailApi(params) {
  return request({
    url: '/tunnel/tunnel/detail',
    method: 'get',
    params: params
  })
}
//连接信息
export function wafTunnelConnectionApi(params) {
  return request({
    url: '/tunnel/tunnel/connections',
    method: 'get',
    params: params
  })
}

const protectionPath = '/tunnel/tunnel/protection';

export function wafTunnelProtectionDetailApi(params) {
  return request({ url: `${protectionPath}/detail`, method: 'get', params });
}

export function wafTunnelProtectionRegionApi(data) {
  return request({ url: `${protectionPath}/region`, method: 'post', data });
}

export function wafTunnelProtectionDDNSApi(data) {
  return request({ url: `${protectionPath}/ddns`, method: 'post', data });
}

export function wafTunnelProtectionRefreshApi(data) {
  return request({ url: `${protectionPath}/refresh`, method: 'post', data });
}