import request from '@/utils/request'

// 主机远程登录爆破防护（保护 SamWaf 所在机器自身的 SSH/RDP）

// 运行状态与环境能力（unavailable 非空即为降级原因）
export function wafHostGuardStatusApi(params) {
  return request({
    url: '/hostguard/status',
    method: 'get',
    params: params,
  })
}

// 概览统计（统计卡 + 24小时趋势 + Top攻击源 + 来源分布）
export function wafHostGuardStatisticsApi(params) {
  return request({
    url: '/hostguard/statistics',
    method: 'get',
    params: params,
  })
}

// 登录失败事件列表
export function wafHostGuardEventListApi(params) {
  return request({
    url: '/hostguard/event/list',
    method: 'post',
    data: params,
  })
}

// 封禁列表
export function wafHostGuardBanListApi(params) {
  return request({
    url: '/hostguard/ban/list',
    method: 'post',
    data: params,
  })
}

// 提前解封
export function wafHostGuardBanReleaseApi(params) {
  return request({
    url: '/hostguard/ban/release',
    method: 'post',
    data: params,
  })
}

// 提升为永久封禁
export function wafHostGuardBanPermanentApi(params) {
  return request({
    url: '/hostguard/ban/permanent',
    method: 'post',
    data: params,
  })
}

// 手工封禁一个IP
export function wafHostGuardBanManualApi(params) {
  return request({
    url: '/hostguard/ban/manual',
    method: 'post',
    data: params,
  })
}

// 攻击者档案列表（累犯记忆，阶梯递进的依据）
export function wafHostGuardOffenderListApi(params) {
  return request({
    url: '/hostguard/offender/list',
    method: 'post',
    data: params,
  })
}

// 重置某IP的封禁阶梯（下次从第1级重新开始）
export function wafHostGuardOffenderResetApi(params) {
  return request({
    url: '/hostguard/offender/reset',
    method: 'post',
    data: params,
  })
}

// 删除攻击者档案
export function wafHostGuardOffenderDelApi(params) {
  return request({
    url: '/hostguard/offender/del',
    method: 'post',
    data: params,
  })
}

// 封禁阶梯配置
export function wafHostGuardLadderListApi(params) {
  return request({
    url: '/hostguard/ladder/list',
    method: 'get',
    params: params,
  })
}

// 保存封禁阶梯（整表替换，一次提交全部级别）
export function wafHostGuardLadderSaveApi(params) {
  return request({
    url: '/hostguard/ladder/save',
    method: 'post',
    data: params,
  })
}

// 白名单自测：某IP会不会被豁免、命中哪一层
export function wafHostGuardWhitelistTestApi(params) {
  return request({
    url: '/hostguard/whitelist/test',
    method: 'post',
    data: params,
  })
}

// 把IP加入白名单（并立即解除其当前封禁）
export function wafHostGuardWhitelistAddApi(params) {
  return request({
    url: '/hostguard/whitelist/add',
    method: 'post',
    data: params,
  })
}
