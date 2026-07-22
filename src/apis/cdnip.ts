import request from '@/utils/request'

// CDN 厂商回源段中心库
// 厂商列表(脱敏，含运行态)
export function wafCDNProviderListApi(params) {
  return request({ url: '/cdnip/provider/list', method: 'get', params })
}
// 单厂商详情(供 host 表单/管理端只读展示)
export function wafCDNProviderInfoApi(params) {
  return request({ url: '/cdnip/provider/info', method: 'get', params })
}
// 分页浏览某厂商回源段(只读)
export function wafCDNProviderRangesApi(data) {
  return request({ url: '/cdnip/provider/ranges', method: 'post', data })
}
// 开/关自动拉取(开启会立即触发一次)
export function wafCDNProviderAutoFetchApi(data) {
  return request({ url: '/cdnip/provider/autofetch', method: 'post', data })
}
// 保存认证型厂商凭证(不回显)
export function wafCDNProviderCredentialApi(data) {
  return request({ url: '/cdnip/provider/credential', method: 'post', data })
}
// 清空凭证
export function wafCDNProviderCredentialClearApi(data) {
  return request({ url: '/cdnip/provider/credential/clear', method: 'post', data })
}
// 立即拉取一次
export function wafCDNProviderRefreshApi(data) {
  return request({ url: '/cdnip/provider/refresh', method: 'post', data })
}
