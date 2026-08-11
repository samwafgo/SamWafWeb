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

// ---- 威胁情报误报排除名单 ----
// 订阅源是全量快照、每周期整份覆盖，手工从防火墙删掉的条目下次同步就回来；
// 系统层又是内核丢包、WAF 白名单救不了。排除名单是每次落地都会重新应用的本地声明。
export function wafThreatIPExcludeListApi(params) {
  return request({ url: '/threatip/exclude/list', method: 'post', data: params })
}
export function wafThreatIPExcludeAddApi(params) {
  return request({ url: '/threatip/exclude/add', method: 'post', data: params })
}
export function wafThreatIPExcludeEditApi(params) {
  return request({ url: '/threatip/exclude/edit', method: 'post', data: params })
}
export function wafThreatIPExcludeDelApi(params) {
  return request({ url: '/threatip/exclude/del', method: 'get', params: params })
}
// 试算：不落库，只回报"会从几个渠道剔掉多少条"，供保存前给用户提示
export function wafThreatIPExcludePreviewApi(params) {
  return request({ url: '/threatip/exclude/preview', method: 'post', data: params })
}
export function wafThreatIPExcludeAuditApi(params) {
  return request({ url: '/threatip/exclude/audit', method: 'post', data: params })
}
// 当前生效的**内置**排除规则(回环/本机网卡/内网段/管理端白名单等，不落库、不可删)。
// 单独一个接口是因为它们不在 threat_ip_exclude 表里，只看名单会出现
// "已排除6条却一条也看不到"。
export function wafThreatIPExcludeBuiltinApi() {
  return request({ url: '/threatip/exclude/builtin', method: 'get' })
}
