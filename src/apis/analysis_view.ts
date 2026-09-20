import request from '@/utils/request'

// 来源与路径分析（M5/G3）。三个只读接口，都是 GET。
// 走专用接口而不是数据查询页：后者的敏感列判定会把 actor_key 静默隐掉。

// 行为视角：谁在打
export function analysisActorList(params) {
  return request({
    url: '/analysis/actor/list',
    method: 'get',
    params,
  })
}

// 目标视角：打哪里
export function analysisPathList(params) {
  return request({
    url: '/analysis/path/list',
    method: 'get',
    params,
  })
}

// 抽屉下钻：kind=actor 看它摸过什么，kind=path 看谁在打它
export function analysisDetail(params) {
  return request({
    url: '/analysis/detail',
    method: 'get',
    params,
  })
}
