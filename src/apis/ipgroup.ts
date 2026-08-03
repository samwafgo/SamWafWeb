import request from '@/utils/request'

// ============ IP组 ============

//查看IP组列表
export function wafIPGroupListApi(params) {
  return request({
    url: '/wafhost/ipgroup/list',
    method: 'post',
    data: params
  })
}
//IP组下拉选项(不分页，供黑/白名单表单引用)
export function wafIPGroupOptionsApi() {
  return request({
    url: '/wafhost/ipgroup/options',
    method: 'get'
  })
}
//详细IP组
export function wafIPGroupDetailApi(params) {
  return request({
    url: '/wafhost/ipgroup/detail',
    method: 'get',
    params: params
  })
}
//添加IP组
export function wafIPGroupAddApi(params) {
  return request({
    url: '/wafhost/ipgroup/add',
    method: 'post',
    data: params
  })
}
//编辑IP组(只能改名称与备注)
export function wafIPGroupEditApi(params) {
  return request({
    url: '/wafhost/ipgroup/edit',
    method: 'post',
    data: params
  })
}
//查询IP组的引用情况(删除前确认用)
export function wafIPGroupRefsApi(params) {
  return request({
    url: '/wafhost/ipgroup/refs',
    method: 'get',
    params: params
  })
}
//删除IP组(force=1 时级联删除引用它的黑/白名单条目)
export function wafIPGroupDelApi(params) {
  return request({
    url: '/wafhost/ipgroup/del',
    method: 'get',
    params: params
  })
}
//校验IP写法(单IP/CIDR/通配符/区间)
export function wafIPGroupValidateApi(params) {
  return request({
    url: '/wafhost/ipgroup/validate',
    method: 'post',
    data: params
  })
}

// ============ IP组内条目 ============

//查看组内IP列表
export function wafIPGroupItemListApi(params) {
  return request({
    url: '/wafhost/ipgroupitem/list',
    method: 'post',
    data: params
  })
}
//详细组内IP
export function wafIPGroupItemDetailApi(params) {
  return request({
    url: '/wafhost/ipgroupitem/detail',
    method: 'get',
    params: params
  })
}
//添加组内IP
export function wafIPGroupItemAddApi(params) {
  return request({
    url: '/wafhost/ipgroupitem/add',
    method: 'post',
    data: params
  })
}
//批量添加组内IP(多行文本)
export function wafIPGroupItemBatchAddApi(params) {
  return request({
    url: '/wafhost/ipgroupitem/batch/add',
    method: 'post',
    data: params
  })
}
//编辑组内IP
export function wafIPGroupItemEditApi(params) {
  return request({
    url: '/wafhost/ipgroupitem/edit',
    method: 'post',
    data: params
  })
}
//删除组内IP
export function wafIPGroupItemDelApi(params) {
  return request({
    url: '/wafhost/ipgroupitem/del',
    method: 'get',
    params: params
  })
}
//批量删除组内IP
export function wafIPGroupItemBatchDelApi(params) {
  return request({
    url: '/wafhost/ipgroupitem/batch/del',
    method: 'post',
    data: params
  })
}
//清空组内IP
export function wafIPGroupItemDelAllApi(params) {
  return request({
    url: '/wafhost/ipgroupitem/delall',
    method: 'post',
    data: params
  })
}
