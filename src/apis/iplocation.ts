import request from '@/utils/request'

// IP数据库管理 - 获取状态
export function getIPDBStatusApi() {
  return request({
    url: '/iplocation/status',
    method: 'get'
  })
}

// IP数据库管理 - 获取配置
export function getIPDBConfigApi() {
  return request({
    url: '/iplocation/config',
    method: 'get'
  })
}

// IP数据库管理 - 保存配置
export function saveIPDBConfigApi(data) {
  return request({
    url: '/iplocation/config/save',
    method: 'post',
    data: data
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

// IP数据库管理 - 检查可在线下载的数据库
// 只有 ip2region 系列（Apache-2.0）能由官方转发分发；GeoLite2 / IPDB 受各自授权限制需自备
export function checkIPDBUpgradeApi(opts?) {
  return request({
    url: '/iplocation/upgrade/check',
    method: 'get',
    ...(opts || {})
  })
}

// IP数据库管理 - 启动下载（异步，立刻返回；进度用 getIPDBUpgradeProgressApi 轮询）
export function applyIPDBUpgradeApi(data) {
  return request({
    url: '/iplocation/upgrade/apply',
    method: 'post',
    data: data
  })
}

// IP数据库管理 - 查询下载进度
export function getIPDBUpgradeProgressApi() {
  return request({
    url: '/iplocation/upgrade/progress',
    method: 'get'
  })
}

// IP数据库管理 - 取消正在进行的下载
export function cancelIPDBUpgradeApi() {
  return request({
    url: '/iplocation/upgrade/cancel',
    method: 'post'
  })
}
