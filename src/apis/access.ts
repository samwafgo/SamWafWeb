import request from '@/utils/request'

// ============ 统一访问认证(Access 模式) ============
// 对标 Cloudflare Access：开启后访问任何被 WAF 代理的站点都要先经过统一认证。
// 分四块：访问账号、全局配置、在线会话、审计日志。

// ---------- 访问账号 ----------

//访问账号列表
export function wafAccessAccountListApi(params) {
  return request({
    url: '/wafhost/accessaccount/list',
    method: 'post',
    data: params
  })
}
//访问账号详情
export function wafAccessAccountDetailApi(params) {
  return request({
    url: '/wafhost/accessaccount/detail',
    method: 'get',
    params: params
  })
}
//新增访问账号
export function wafAccessAccountAddApi(params) {
  return request({
    url: '/wafhost/accessaccount/add',
    method: 'post',
    data: params
  })
}
//编辑访问账号(登录名不可改，改密走 resetpwd)
export function wafAccessAccountEditApi(params) {
  return request({
    url: '/wafhost/accessaccount/edit',
    method: 'post',
    data: params
  })
}
//重置密码(会同时踢掉该账号所有在线会话)
export function wafAccessAccountResetPwdApi(params) {
  return request({
    url: '/wafhost/accessaccount/resetpwd',
    method: 'post',
    data: params
  })
}
//删除访问账号
export function wafAccessAccountDelApi(params) {
  return request({
    url: '/wafhost/accessaccount/del',
    method: 'get',
    params: params
  })
}
//生成二次验证密钥与二维码(不落库，需 bind 确认)
export function wafAccessAccountOtpInitApi(params) {
  return request({
    url: '/wafhost/accessaccount/otp/init',
    method: 'get',
    params: params
  })
}
//绑定二次验证
export function wafAccessAccountOtpBindApi(params) {
  return request({
    url: '/wafhost/accessaccount/otp/bind',
    method: 'post',
    data: params
  })
}
//解绑二次验证
export function wafAccessAccountOtpUnbindApi(params) {
  return request({
    url: '/wafhost/accessaccount/otp/unbind',
    method: 'post',
    data: params
  })
}

// ---------- 全局配置 ----------

//获取统一访问认证配置(密钥类字段不回显)
export function wafAccessConfigDetailApi() {
  return request({
    url: '/wafhost/accessconfig/detail',
    method: 'get'
  })
}
//认证中心域名候选(由已配置且已启动的站点推导，排除全局网站与泛域名)
export function wafAccessConfigHostOptionsApi() {
  return request({
    url: '/wafhost/accessconfig/hostoptions',
    method: 'get'
  })
}
//保存统一访问认证配置(保存后立即全站生效)
export function wafAccessConfigSaveApi(params) {
  return request({
    url: '/wafhost/accessconfig/save',
    method: 'post',
    data: params
  })
}
//轮换签名密钥(在途跳转失效，已登录会话不受影响)
export function wafAccessConfigRegenerateSecretApi() {
  return request({
    url: '/wafhost/accessconfig/regenerate_secret',
    method: 'post'
  })
}

// ---------- 在线会话 ----------

//会话列表
export function wafAccessSessionListApi(params) {
  return request({
    url: '/wafhost/accesssession/list',
    method: 'post',
    data: params
  })
}
//踢下线单个会话
export function wafAccessSessionKickApi(params) {
  return request({
    url: '/wafhost/accesssession/kick',
    method: 'get',
    params: params
  })
}
//按账号批量踢下线
export function wafAccessSessionKickByAccountApi(params) {
  return request({
    url: '/wafhost/accesssession/kickbyaccount',
    method: 'post',
    data: params
  })
}
//踢下线全部会话(应急)
export function wafAccessSessionKickAllApi() {
  return request({
    url: '/wafhost/accesssession/kickall',
    method: 'get'
  })
}

// ---------- 审计日志 ----------

//访问认证审计日志
export function wafAccessAuditListApi(params) {
  return request({
    url: '/wafhost/accessaudit/list',
    method: 'post',
    data: params
  })
}
