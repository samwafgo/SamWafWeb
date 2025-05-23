import request from '@/utils/request'
//更新Vp配置文件的ip白名单
export function updateIpWhitelistApi(data) {
  return request({
    url: 'vipconfig/updateIpWhitelist',
    method: 'post',
    data: data
  })
}
//更新Vp配置文件的ip白名单 
export function getIpWhitelistApi(params) {
  return request({
    url: 'vipconfig/getIpWhitelist',
    method: 'get',
    params: params
  })
}
