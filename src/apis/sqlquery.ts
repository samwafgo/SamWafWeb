import request from '@/utils/request'

// 执行 SQL 查询
export function sql_query_execute_api(data) {
  return request({
    url: 'sql_query/execute',
    method: 'post',
    data: data
  })
}

