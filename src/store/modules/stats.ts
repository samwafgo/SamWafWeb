export interface StatsDataItem {
  server: string;
  operatype: string;
  qps: number;
  log_qps: number;
  main_queue: number;
  log_queue: number;
  stats_queue: number;
  message_queue: number;
  cpu_percent: number;
  memory_percent: number;
  network_recv_rate: number;  // 网络接收速率(字节/秒)
  network_sent_rate: number;  // 网络发送速率(字节/秒)
  timestamp: number;
  system_monitor?: SystemMonitorData; // 系统监控信息
}

export interface SystemMonitorData {
  cpu: {
    model_name: string;
    cores: number;
    usage_percent: number;
    physical_cnt: number;
    logical_cnt: number;
  };
  memory: {
    total: string;
    available: string;
    used: string;
    usage_percent: number;
    jvm_used: string;
    jvm_percent: number;
  };
  disk: Array<{
    file_system: string;
    mount_point: string;
    total: string;
    available: string;
    used: string;
    usage_percent: number;
  }>;
}

export interface ResponseTimeItem {
  timestamp: number;
  responseTime: number; // 响应时间，单位毫秒
  status: 'success' | 'error'; // 请求状态
}

// 定义的state初始值
const state: { 
  currentStats: StatsDataItem | null;
  statsHistory: Array<StatsDataItem>;
  responseTimeHistory: Array<ResponseTimeItem>;
  currentSystemMonitor: SystemMonitorData | null; // 当前系统监控信息
} = {
  currentStats: null,
  statsHistory: [],
  responseTimeHistory: [],
  currentSystemMonitor: null,
};

const mutations = {
  setCurrentStats(state, data: StatsDataItem) {
    // eslint-disable-next-line no-param-reassign
    state.currentStats = data;
  },
  addStatsData(state, data: StatsDataItem) {
    // 添加到历史记录
    // eslint-disable-next-line no-param-reassign
    state.statsHistory.push(data);
    
    // 限制历史记录数量，最多保留1000条
    if (state.statsHistory.length > 1000) {
      // eslint-disable-next-line no-param-reassign
      state.statsHistory = state.statsHistory.slice(-1000);
    }
    
    // 更新当前统计数据
    // eslint-disable-next-line no-param-reassign
    state.currentStats = data;
    
    // 如果数据中包含系统监控信息，更新系统监控状态
    if (data.system_monitor) {
      // eslint-disable-next-line no-param-reassign
      state.currentSystemMonitor = data.system_monitor;
    }
  },
  setSystemMonitor(state, data: SystemMonitorData) {
    // 直接设置系统监控信息
    // eslint-disable-next-line no-param-reassign
    state.currentSystemMonitor = data;
  },
  addResponseTimeData(state, data: ResponseTimeItem) {
    // 添加响应时间数据
    // eslint-disable-next-line no-param-reassign
    state.responseTimeHistory.push(data);
    
    // 限制历史记录数量，最多保留500条
    if (state.responseTimeHistory.length > 500) {
      // eslint-disable-next-line no-param-reassign
      state.responseTimeHistory = state.responseTimeHistory.slice(-500);
    }
  },
  clearStatsHistory(state) {
    // eslint-disable-next-line no-param-reassign
    state.statsHistory = [];
    // eslint-disable-next-line no-param-reassign
    state.currentStats = null;
  },
  clearResponseTimeHistory(state) {
    // eslint-disable-next-line no-param-reassign
    state.responseTimeHistory = [];
  },
  clearSystemMonitor(state) {
    // eslint-disable-next-line no-param-reassign
    state.currentSystemMonitor = null;
  },
};

const getters = {
  getCurrentStats: (state) => state.currentStats,
  getStatsHistory: (state) => state.statsHistory,
  getLatestStats: (state) => state.statsHistory.length > 0 ? state.statsHistory[state.statsHistory.length - 1] : null,
  getResponseTimeHistory: (state) => state.responseTimeHistory,
  getLatestResponseTime: (state) => state.responseTimeHistory.length > 0 ? state.responseTimeHistory[state.responseTimeHistory.length - 1] : null,
  getAverageResponseTime: (state) => {
    if (state.responseTimeHistory.length === 0) return 0;
    const total = state.responseTimeHistory.reduce((sum, item) => sum + item.responseTime, 0);
    return Math.round(total / state.responseTimeHistory.length);
  },
  getCurrentSystemMonitor: (state) => state.currentSystemMonitor,
  getCpuUsage: (state) => state.currentSystemMonitor?.cpu?.usage_percent || 0,
  getMemoryUsage: (state) => state.currentSystemMonitor?.memory?.usage_percent || 0,
  getDiskList: (state) => state.currentSystemMonitor?.disk || [],
  getAverageDiskUsage: (state) => {
    const diskList = state.currentSystemMonitor?.disk || [];
    if (diskList.length === 0) return 0;
    const totalUsage = diskList.reduce((sum, disk) => sum + (disk.usage_percent || 0), 0);
    return Math.round(totalUsage / diskList.length);
  },
};

const actions = {};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};