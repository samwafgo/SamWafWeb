import request from '@/utils/request'

// 远程连接看板：谁正连着本机

// 连接列表（含汇总）
export function wafHostConnListApi(params) {
  return request({
    url: '/hostconn/list',
    method: 'post',
    data: params,
  })
}

// 只取汇总卡片
export function wafHostConnSummaryApi(params) {
  return request({
    url: '/hostconn/summary',
    method: 'get',
    params: params,
  })
}

// 强制刷新快照（丢弃缓存立即重新采集）
export function wafHostConnRefreshApi(params) {
  return request({
    url: '/hostconn/refresh',
    method: 'get',
    params: params,
  })
}

// 一键封禁某个连接来源IP
export function wafHostConnBlockApi(params) {
  return request({
    url: '/hostconn/block',
    method: 'post',
    data: params,
  })
}
