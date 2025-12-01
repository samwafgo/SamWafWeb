import request from '@/utils/request'

// 查看防火墙IP封禁列表
export function wafFirewallIPBlockListApi(params) {
  return request({
    url: '/firewall/ipblock/list',
    method: 'post',
    data: params
  })
}

// 添加防火墙IP封禁
export function wafFirewallIPBlockAddApi(params) {
  return request({
    url: '/firewall/ipblock/add',
    method: 'post',
    data: params
  })
}

// 获取防火墙IP封禁详情
export function wafFirewallIPBlockDetailApi(params) {
  return request({
    url: '/firewall/ipblock/detail',
    method: 'get',
    params: params
  })
}

// 编辑防火墙IP封禁
export function wafFirewallIPBlockEditApi(params) {
  return request({
    url: '/firewall/ipblock/edit',
    method: 'post',
    data: params
  })
}

// 删除防火墙IP封禁
export function wafFirewallIPBlockDelApi(params) {
  return request({
    url: '/firewall/ipblock/del',
    method: 'get',
    params: params
  })
}

// 批量添加防火墙IP封禁
export function wafFirewallIPBlockBatchAddApi(params) {
  return request({
    url: '/firewall/ipblock/batch/add',
    method: 'post',
    data: params
  })
}

// 批量删除防火墙IP封禁
export function wafFirewallIPBlockBatchDelApi(params) {
  return request({
    url: '/firewall/ipblock/batch/del',
    method: 'post',
    data: params
  })
}

// 启用防火墙IP封禁
export function wafFirewallIPBlockEnableApi(params) {
  return request({
    url: '/firewall/ipblock/enable',
    method: 'post',
    data: params
  })
}

// 禁用防火墙IP封禁
export function wafFirewallIPBlockDisableApi(params) {
  return request({
    url: '/firewall/ipblock/disable',
    method: 'post',
    data: params
  })
}

// 同步防火墙规则
export function wafFirewallIPBlockSyncApi(params) {
  return request({
    url: '/firewall/ipblock/sync',
    method: 'post',
    data: params
  })
}

// 清理过期规则
export function wafFirewallIPBlockClearExpiredApi(params) {
  return request({
    url: '/firewall/ipblock/clear/expired',
    method: 'post',
    data: params
  })
}

// 获取统计信息
export function wafFirewallIPBlockStatisticsApi(params) {
  return request({
    url: '/firewall/ipblock/statistics',
    method: 'get',
    params: params
  })
}
