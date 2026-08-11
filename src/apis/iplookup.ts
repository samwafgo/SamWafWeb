import request from '@/utils/request'

// IP 归属查询：一次问遍黑白名单/IP组/威胁情报/失败封禁/CC封禁/系统防火墙/CDN回源段
export function wafIPLookupApi(params) {
  return request({ url: '/wafhost/ip/lookup', method: 'get', params: params })
}
