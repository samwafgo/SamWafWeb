import request from '@/utils/request'

// ===== API Key 管理 =====

// 查询 Key 列表
export function oplatform_key_list_api(data) {
  return request({
    url: 'oplatform/key/list',
    method: 'post',
    data: data
  })
}

// 获取 Key 详情
export function oplatform_key_detail_api(params) {
  return request({
    url: 'oplatform/key/detail',
    method: 'get',
    params: params
  })
}

// 新增 Key
export function oplatform_key_add_api(data) {
  return request({
    url: 'oplatform/key/add',
    method: 'post',
    data: data
  })
}

// 编辑 Key
export function oplatform_key_edit_api(data) {
  return request({
    url: 'oplatform/key/edit',
    method: 'post',
    data: data
  })
}

// 删除 Key
export function oplatform_key_del_api(params) {
  return request({
    url: 'oplatform/key/del',
    method: 'get',
    params: params
  })
}

// 重置 Key Secret
export function oplatform_key_reset_secret_api(data) {
  return request({
    url: 'oplatform/key/resetSecret',
    method: 'post',
    data: data
  })
}

// ===== 调用日志 =====

// 查询调用日志列表
export function oplatform_log_list_api(data) {
  return request({
    url: 'oplatform/log/list',
    method: 'post',
    data: data
  })
}

// 获取调用日志详情
export function oplatform_log_detail_api(params) {
  return request({
    url: 'oplatform/log/detail',
    method: 'get',
    params: params
  })
}

// 删除调用日志
export function oplatform_log_del_api(params) {
  return request({
    url: 'oplatform/log/del',
    method: 'get',
    params: params
  })
}

