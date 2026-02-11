import request from '@/utils/request'

// IP数据库管理 - 获取状态
export function getIPDBStatusApi() {
  return request({
    url: '/iplocation/status',
    method: 'get'
  })
}

// IP数据库管理 - 上传文件
export function uploadIPDBFileApi(data) {
  return request({
    url: '/iplocation/upload',
    method: 'post',
    data: data
  })
}

// IP数据库管理 - 重新加载
export function reloadIPDBApi() {
  return request({
    url: '/iplocation/reload',
    method: 'post'
  })
}

// IP数据库管理 - 测试IP查询
export function testIPLookupApi(data) {
  return request({
    url: '/iplocation/test',
    method: 'post',
    data: data
  })
}
