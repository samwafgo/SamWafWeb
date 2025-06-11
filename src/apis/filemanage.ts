import request from '@/utils/request'

// 文件管理 - 获取文件列表
export function fileManageListApi(params) {
  return request({
    url: '/file/data_files',
    method: 'get',
    params: params
  })
}

// 文件管理 - 删除文件
export function fileManageDelApi(params) {
  return request({
    url: '/file/delete_by_id',
    method: 'get',
    params: params
  })
}