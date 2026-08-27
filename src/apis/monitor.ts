import request from '@/utils/request'

// 获取系统监控信息
export function getSystemMonitorApi(params) {
  return request({
    url: '/monitor/system_info',
    method: 'get',
    params: params
  })
}

// ==== 运行诊断（进程视角资源占用排查）====

// 实时快照：进程/Go runtime/内部组件/数据库体量
export function getDiagSnapshotApi() {
  return request({
    url: '/diagnostic/snapshot',
    method: 'get'
  })
}

// 趋势数据（10s采样，最近1小时）
export function getDiagTrendApi() {
  return request({
    url: '/diagnostic/trend',
    method: 'get'
  })
}

// 发起CPU采样（异步任务，约30秒后完成）
export function startCpuProfileApi() {
  return request({
    url: '/diagnostic/cpuprofile/start',
    method: 'post'
  })
}

// 查询CPU采样任务状态（轮询用）
export function getCpuProfileStatusApi() {
  return request({
    url: '/diagnostic/cpuprofile/status',
    method: 'get'
  })
}

// 下载诊断包（zip，流式生成秒级返回）
export function downloadDiagPackageApi() {
  return request({
    url: '/diagnostic/package',
    method: 'get',
    responseType: 'blob',
    timeout: 60000
  })
}