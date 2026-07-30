import request from '@/utils/request'
//获取当前登录账号的界面偏好
export function get_ui_preference_api(params) {
  return request({
    url: 'uipreference/get',
    method: 'get',
    params: params
  })
}
//保存当前登录账号的界面偏好
export function save_ui_preference_api(data) {
  return request({
    url: 'uipreference/save',
    method: 'post',
    data: data
  })
}
