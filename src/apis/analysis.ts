import request from '@/utils/request'
//【数据分析】查询周期区间国家级别攻击和正常信息
export function wafanalysisdaycountryrange(params) {
  return request({
    url: 'analysis/wafanalysisdaycountryrange',
    method: 'get',
    params: params
  })
}

/**
 *  查询爬虫情况
 * @param params
 */
export function wafAnalysisSpider(params) {
  return request({
    url: 'analysis/spider',
    method: 'get',
    params: params
  })
}
