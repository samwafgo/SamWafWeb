import request from '@/utils/request';

// 获取规则封禁配置
export function wafRuleBanGetConfigApi() {
    return request({
        url: 'wafhost/ruleban/config',
        method: 'get',
    });
}

// 设置规则封禁配置
export function wafRuleBanSetConfigApi(params: any) {
    return request({
        url: 'wafhost/ruleban/config',
        method: 'post',
        data: params,
    });
}

// 获取被封禁的IP列表
export function wafRuleBanGetBanListApi(params: any) {
    return request({
        url: 'wafhost/ruleban/baniplist',
        method: 'get',
        params: params,
    });
}

// 移除被封禁的IP
export function wafRuleBanRemoveBanIpApi(params: any) {
    return request({
        url: 'wafhost/ruleban/removebanip',
        method: 'post',
        data: params,
    });
}
