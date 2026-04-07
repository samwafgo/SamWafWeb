import request from '@/utils/request'

// 执行 SQL 查询
export function sql_query_execute_api(data) {
  return request({
    url: 'sql_query/execute',
    method: 'post',
    data: data
  })
}

// 获取数据库表结构信息（表列表、字段、索引、行数、数据大小）
export function sql_query_table_info_api(params) {
  return request({
    url: 'sql_query/table_info',
    method: 'get',
    params: params
  })
}

