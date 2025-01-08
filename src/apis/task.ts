import request from '@/utils/request'
//列表
export function wafTaskListApi(params) {
  return request({
    url: '/wafhost/task/list',
    method: 'post',
    data: params
  })
}
//删除
export function wafTaskDelApi(params) {
  return request({
    url: '/wafhost/task/del',
    method: 'get',
    params: params
  })
}
//编辑
export function wafTaskEditApi(params) {
  return request({
    url: '/wafhost/task/edit',
    method: 'post',
    data: params
  })
}
//添加
export function wafTaskAddApi(params) {
  return request({
    url: '/wafhost/task/add',
    method: 'post',
    data: params
  })
}
//详细
export function wafTaskDetailApi(params) {
  return request({
    url: '/wafhost/task/detail',
    method: 'get',
    params: params
  })
}
//手工执行
export function wafTaskManualExecApi(params) {
  return request({
    url: '/wafhost/task/manual_exec',
    method: 'get',
    params: params
  })
}
