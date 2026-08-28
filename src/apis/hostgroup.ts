import request from '@/utils/request'

// 分页查询网站分组
export function hostGroupList(data) {
  return request({
    url: 'wafhost/hostgroup/list',
    method: 'post',
    data: data
  })
}

// 全部网站分组（不分页），带各组网站数与「未分组」「全部」计数
export function allHostGroup(params) {
  return request({
    url: 'wafhost/hostgroup/all',
    method: 'get',
    params: params
  })
}

// 新增网站分组
export function addHostGroup(data) {
  return request({
    url: 'wafhost/hostgroup/add',
    method: 'post',
    data: data
  })
}

// 编辑网站分组（只能改名称/颜色/备注）
export function editHostGroup(data) {
  return request({
    url: 'wafhost/hostgroup/edit',
    method: 'post',
    data: data
  })
}

// 删除网站分组（组内网站不删，回落到未分组）
export function delHostGroup(params) {
  return request({
    url: 'wafhost/hostgroup/del',
    method: 'get',
    params: params
  })
}

// 分组排序（提交完整的 id 顺序）
export function sortHostGroup(data) {
  return request({
    url: 'wafhost/hostgroup/sort',
    method: 'post',
    data: data
  })
}

// 批量移动网站到分组（group_code 为空表示移出分组）
export function assignHostGroup(data) {
  return request({
    url: 'wafhost/hostgroup/assign',
    method: 'post',
    data: data
  })
}
