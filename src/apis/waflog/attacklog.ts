import request from '@/utils/request'
//查询攻击日志列表
export function attacklogList(params) {
  return request({
    url: '/waflog/attacklog/list',
    method: 'get',
    params: params
  })
}

//查询存档日志库列表
export function allsharedblist(params) {
  return request({
    url: 'waflog/attack/allsharedb',
    method: 'get',
    params: params
  })
}
//导出json数据
export function exportlog(data) {
  return request({
    url: 'waflog/attack/export',
    method: 'get',
  })
}
//下载已经生成好的数据
export function downloadlog() {
  return request({
    url: 'waflog/attack/download',
    method: 'get',
  })
}
//查看日志详情
export function geWebLogDetail(params) {
  return request({
    url: 'waflog/attack/detail',
    method: 'get',
    params: params
  })
}
// 复制脱敏后数据
export function getHeaderCopyDetail(params) {
  return request({
    url: 'waflog/attack/httpcopymask',
    method: 'get',
    params: params
  })
}
// 危险ip列表
export function attackIpListApi(data) {
  return request({
    url: 'waflog/attack/attackiplist',
    method: 'post',
    data: data
  })
}
//查询攻击iptag列表
export function allattacktaglist(params) {
  return request({
    url: 'waflog/attack/alliptag',
    method: 'get',
    params: params
  })
}
//删除tag（设置超长超时时间，因为删除大量日志需要较长时间）
export function deleteTagByNameApi(data) {
  return request({
    url: 'waflog/attack/deletetagbyname',
    method: 'post',
    data: data,
    timeout: 600000 // 10分钟超时，适用于大数据量删除
  })
}
