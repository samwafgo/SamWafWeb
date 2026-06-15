import request from '@/utils/request'

// AI 检测状态 + 当前模型信息
export function aiStatusApi() {
  return request({
    url: '/ai/status',
    method: 'get',
  })
}

// 上传 .swai 模型包（FormData，字段名 file）
export function aiUploadModelApi(data) {
  return request({
    url: '/ai/model/upload',
    method: 'post',
    data,
  })
}

// 从磁盘重新加载当前模型
export function aiReloadModelApi() {
  return request({
    url: '/ai/model/reload',
    method: 'post',
  })
}

// 卸载当前模型
export function aiUnloadModelApi() {
  return request({
    url: '/ai/model/unload',
    method: 'post',
  })
}

// 导出脱敏训练数据
export function aiExportTrainDataApi(data) {
  return request({
    url: '/ai/export',
    method: 'post',
    data,
  })
}

// AI检测看板聚合数据
export function aiDashboardApi(data) {
  return request({
    url: '/ai/dashboard',
    method: 'post',
    data,
  })
}

// 标记某条日志的训练标签修正（normal/attack/ignore）
export function aiMarkLabelApi(data) {
  return request({
    url: '/ai/label/mark',
    method: 'post',
    data,
  })
}

// 取消某条日志的标记
export function aiUnmarkLabelApi(data) {
  return request({
    url: '/ai/label/unmark',
    method: 'post',
    data,
  })
}

// 按 req_uuid 批量查询标记状态
export function aiLabelByUuidsApi(data) {
  return request({
    url: '/ai/label/by_uuids',
    method: 'post',
    data,
  })
}

// 标注工作台：AI命中列表（分页 + 标记状态过滤）
export function aiLabelListApi(data) {
  return request({
    url: '/ai/label/list',
    method: 'post',
    data,
  })
}

// 标注工作台：批量标记（normal/attack/ignore）
export function aiBatchMarkApi(data) {
  return request({
    url: '/ai/label/batch_mark',
    method: 'post',
    data,
  })
}

// 标注工作台：批量取消标记
export function aiBatchUnmarkApi(data) {
  return request({
    url: '/ai/label/batch_unmark',
    method: 'post',
    data,
  })
}
