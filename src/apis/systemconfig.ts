import request from '@/utils/request'
//查询所有系统配置列表
export function system_config_list_api(data) {
  return request({
    url: 'systemconfig/list',
    method: 'post',
    data: data
  })
}
//通过ID获取系统配置
export function get_detail_by_id_api(params) {
  return request({
    url: 'systemconfig/detail',
    method: 'get',
    params: params
  })
}
//通过Item获取系统配置
export function get_detail_by_item_api(params) {
  return request({
    url: 'systemconfig/getdetailByItem',
    method: 'get',
    params: params
  })
}
//添加系统配置
export function add_system_config_api(data) {
  return request({
    url: 'systemconfig/add',
    method: 'post',
    data: data
  })
}
//编辑系统配置
export function edit_system_config_api(data) {
  return request({
    url: 'systemconfig/edit',
    method: 'post',
    data: data
  })
}
//删除系统配置
export function del_detail_api(params) {
  return request({
    url: 'systemconfig/del',
    method: 'get',
    params: params
  })
}