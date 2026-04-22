import request from '@/utils/request'

// 规则列表
export function owaspRulesListApi(params) {
  return request({
    url: '/owasp/rules',
    method: 'get',
    params,
  })
}

// 规则详情
export function owaspRuleDetailApi(params) {
  return request({
    url: '/owasp/rule_detail',
    method: 'get',
    params,
  })
}

// 启用 / 禁用
export function owaspRuleToggleApi(data) {
  return request({
    url: '/owasp/rule_toggle',
    method: 'post',
    data,
  })
}

// 改写
export function owaspRuleOverrideApi(data) {
  return request({
    url: '/owasp/rule_override',
    method: 'post',
    data,
  })
}

// 还原
export function owaspRuleResetApi(data) {
  return request({
    url: '/owasp/rule_reset',
    method: 'post',
    data,
  })
}

// tuning
export function owaspTuningGetApi() {
  return request({
    url: '/owasp/tuning',
    method: 'get',
  })
}

export function owaspTuningSetApi(data) {
  return request({
    url: '/owasp/tuning',
    method: 'post',
    data,
  })
}

// 热重载
export function owaspReloadApi() {
  return request({
    url: '/owasp/reload',
    method: 'post',
  })
}

// 文件列表
export function owaspFilesListApi() {
  return request({
    url: '/owasp/files',
    method: 'get',
  })
}

export function owaspFileContentApi(params) {
  return request({
    url: '/owasp/file_content',
    method: 'get',
    params,
  })
}

// 升级
export function owaspUpdateCheckApi() {
  return request({
    url: '/owasp/update/check',
    method: 'get',
  })
}

export function owaspUpdateApplyApi() {
  return request({
    url: '/owasp/update/apply',
    method: 'post',
  })
}

// 沙盒测试
export function owaspDryRunApi(data) {
  return request({
    url: '/owasp/test/dry_run',
    method: 'post',
    data,
  })
}

// 使用文档
export function owaspUsageDocApi() {
  return request({
    url: '/owasp/usage/doc',
    method: 'get',
  })
}

// 变更审计日志
export function owaspAuditLogApi() {
  return request({
    url: '/owasp/audit_log',
    method: 'get',
  })
}

// CRS 事务变量管理
export function owaspCRSVarsGetApi() {
  return request({ url: '/owasp/crs_vars', method: 'get' })
}
export function owaspCRSVarSetApi(data: { key: string; value: string }) {
  return request({ url: '/owasp/crs_var', method: 'post', data })
}
export function owaspCRSVarDeleteApi(key: string) {
  return request({ url: '/owasp/crs_var', method: 'delete', params: { key } })
}

// 规则命中统计
export function owaspHitStatsApi(params?: { limit?: number; mode?: string }) {
  return request({ url: '/owasp/hit_stats', method: 'get', params })
}
export function owaspHitStatsResetApi() {
  return request({ url: '/owasp/hit_stats/reset', method: 'post' })
}
