import request from '@/utils/request'
//登录
// background: 登录页自己在表单上方有内联提示条，右上角再弹一张「无法连接后端」就重复了
export function loginapi(params) {
  return request({
    url: 'public/login',
    method: 'post',
    data: params,
    background: true
  })
}

//注销
export function logoutapi(params) {
  return request({
    url: 'logout',
    method: 'post',
    data: params
  })
}
