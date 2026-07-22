import request from '@/utils/request'

// 威胁情报 IP 订阅渠道
export function wafThreatIPListApi(params) {
  return request({ url: '/threatip/channel/list', method: 'post', data: params })
}
export function wafThreatIPAddApi(params) {
  return request({ url: '/threatip/channel/add', method: 'post', data: params })
}
export function wafThreatIPDetailApi(params) {
  return request({ url: '/threatip/channel/detail', method: 'get', params: params })
}
export function wafThreatIPEditApi(params) {
  return request({ url: '/threatip/channel/edit', method: 'post', data: params })
}
export function wafThreatIPDelApi(params) {
  return request({ url: '/threatip/channel/del', method: 'get', params: params })
}
export function wafThreatIPSyncApi(params) {
  return request({ url: '/threatip/channel/sync', method: 'post', data: params })
}

// 订阅落地汇总(方案三"订阅来源"Tab)。params.land = system | waf
export function wafThreatIPLandedSummaryApi(params) {
  return request({ url: '/threatip/landed/summary', method: 'get', params: params })
}
// 某渠道落地 IP 分页浏览(只读)。params: { code, keyword, pageIndex, pageSize }
export function wafThreatIPLandedIPsApi(params) {
  return request({ url: '/threatip/landed/ips', method: 'post', data: params })
}
