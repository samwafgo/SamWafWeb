import request from '@/utils/request';

// 获取IP失败封禁配置
export function wafIPFailureGetConfigApi() {
    return request({
        url: 'wafhost/ipfailure/config',
        method: 'get',
    });
}

// 设置IP失败封禁配置
export function wafIPFailureSetConfigApi(params: any) {
    return request({
        url: 'wafhost/ipfailure/config',
        method: 'post',
        data: params,
    });
}

// 获取被封禁的IP列表
export function wafIPFailureGetBanListApi(params: any) {
    return request({
        url: 'wafhost/ipfailure/baniplist',
        method: 'get',
        params: params,
    });
}

// 移除被封禁的IP
export function wafIPFailureRemoveBanIpApi(params: any) {
    return request({
        url: 'wafhost/ipfailure/removebanip',
        method: 'post',
        data: params,
    });
}
