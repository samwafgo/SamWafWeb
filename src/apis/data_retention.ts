import request from '@/utils/request'

// 列表
export function wafDataRetentionListApi(params) {
  return request({
    url: '/wafhost/dataretention/list',
    method: 'post',
    data: params
  })
}

// 详情
export function wafDataRetentionDetailApi(params) {
  return request({
    url: '/wafhost/dataretention/detail',
    method: 'get',
    params: params
  })
}

// 编辑
export function wafDataRetentionEditApi(params) {
  return request({
    url: '/wafhost/dataretention/edit',
    method: 'post',
    data: params
  })
}
