import request from '@/utils/request'
//初始化
export function wafOtpInitApi(params) {
  return request({
    url: '/wafhost/otp/init',
    method: 'get',
    params: params
  })
}

// 绑定OTP
export function wafOtpBindApi(params) {
  return request({
    url: '/wafhost/otp/bind',
    method: 'post',
    data: params
  })
}

//解绑OTP
export function wafOtpUnBindApi(params) {
  return request({
    url: '/wafhost/otp/unbind',
    method: 'post',
    data: params
  })
}
