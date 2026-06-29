import request from '@/utils/request'
//查询所有账号列表
export function account_list_api(data) {
  return request({
    url: 'account/list',
    method: 'post',
    data: data
  })
}


//查询所有账号操作日志列表
export function account_log_list_api(params) {
  return request({
    url: 'account_log/list',
    method: 'get',
    params: params
  })
}
// 重置2Fa
export function account_reset_2fa_api(data) {
  return request({
    url: 'account/resetotp',
    method: 'post',
    data: data
  })
}

// 当前登录账号自助改密（首次登录/口令到期强制改密 或 个人主动修改）
export function account_change_my_password_api(data) {
  return request({
    url: 'account/changemypwd',
    method: 'post',
    data: data
  })
}
