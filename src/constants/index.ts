
// localStorage 保留字段配置
export const LOCALSTORAGE_PRESERVE_KEYS = [
  'lang',                    // 语言设置
  'lastUpdatePopupTime',     // 最后更新弹窗时间 
  'attack_table_display_columns',                // 攻击日志列表的保存 
  'lastVisitedUrl',          // 上次访问的URL（新增）
];

// localStorage 清理工具函数
export const clearLocalStorageExceptPreserved = () => {
  Object.keys(localStorage).forEach(key => {
    if (!LOCALSTORAGE_PRESERVE_KEYS.includes(key)) {
      localStorage.removeItem(key);
    }
  });
};
// URL安全验证函数
export const isValidRedirectUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    // 如果是相对路径，直接允许
    if (url.startsWith('/')) {
      return true;
    }
    
    // 如果是完整URL，检查是否是当前域名
    const urlObj = new URL(url);
    const currentOrigin = window.location.origin;
    
    return urlObj.origin === currentOrigin;
  } catch (error) {
    // URL格式错误，不允许跳转
    return false;
  }
};

// 保存当前访问URL
export const saveCurrentUrl = () => {
  // 对于hash模式的Vue Router，只保存hash部分
  const currentUrl = window.location.hash ? window.location.hash.substring(1) : window.location.pathname;
  // 排除登录页面
  if (!currentUrl.includes('/login')) {
    localStorage.setItem('lastVisitedUrl', currentUrl);
  }
};

// 获取安全的重定向URL
export const getSafeRedirectUrl = (): string => {
  const savedUrl = localStorage.getItem('lastVisitedUrl');
  
  if (savedUrl && isValidRedirectUrl(savedUrl)) {
    // 清除保存的URL，避免重复跳转
    localStorage.removeItem('lastVisitedUrl');
    return savedUrl;
  }
  
  // 默认跳转到dashboard首页，而不是根路径
  return '/dashboard/base';
};

interface IOption {
  value: number | string;
  label: string;
}
// 规则状态枚举
export const RULE_STATUS = {
  STOPPING: 0,
  RUNNING: 1,
};
// 防护状态枚举
export const GUARD_STATUS = {
  UN_GUARDDING: 0,
  GUARDDING: 1,
};
// SSL证书状态枚举
export const SSL_STATUS = {
  NOT_SSL: 0,
  SSL: 1,
};

// 启动状态枚举
export const START_STATUS = {
  START: 0,
  NOT_START: 1,
};
// 合同状态枚举
export const CONTRACT_STATUS = {
  FAIL: 0,
  AUDIT_PENDING: 1,
  EXEC_PENDING: 2,
  EXECUTING: 3,
  FINISH: 4,
};

export const CONTRACT_STATUS_OPTIONS: Array<IOption> = [
  { value: CONTRACT_STATUS.FAIL, label: '审核失败' },
  { value: CONTRACT_STATUS.AUDIT_PENDING, label: '待审核' },
  { value: CONTRACT_STATUS.EXEC_PENDING, label: '待履行' },
  { value: CONTRACT_STATUS.EXECUTING, label: '审核成功' },
  { value: CONTRACT_STATUS.FINISH, label: '已完成' },
];

// 合同类型枚举
export const CONTRACT_TYPES = {
  MAIN: 0,
  SUB: 1,
  SUPPLEMENT: 2,
};

export const CONTRACT_TYPE_OPTIONS: Array<IOption> = [
  { value: CONTRACT_TYPES.MAIN, label: '主合同' },
  { value: CONTRACT_TYPES.SUB, label: '子合同' },
  { value: CONTRACT_TYPES.SUPPLEMENT, label: '补充合同' },
];

// 合同收付类型枚举
export const CONTRACT_PAYMENT_TYPES = {
  PAYMENT: 0,
  RECIPT: 1,
};

// 通知的优先级对应的TAG类型
export const NOTIFICATION_TYPES = {
  low: 'primary',
  middle: 'warning',
  high: 'danger',
};

// 攻击类型TAG类型
export const ATTACK_TYPES = {
  CC: 0,
  CMD: 1,
  WEBUPLOAD: 2,
};
