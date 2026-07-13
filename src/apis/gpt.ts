import request from '@/utils/request'
// 获取 GPT 参数（gpt_url/gpt_model/是否已配置密钥；密钥不回传明文）
export function wafGptConfigGetApi(params?) {
  return request({
    url: 'gpt/config',
    method: 'get',
    params: params
  })
}
// 保存 GPT 参数（gpt_token 留空表示保留原密钥）
export function wafGptConfigSaveApi(data) {
  return request({
    url: 'gpt/config/save',
    method: 'post',
    data: data
  })
}
