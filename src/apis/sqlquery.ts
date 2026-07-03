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

// 获取可查询表及其可见列（不含敏感表/敏感列），供结构化查询向导下拉使用
export function sql_query_queryable_api(params) {
  return request({
    url: 'sql_query/queryable',
    method: 'get',
    params: params
  })
}

