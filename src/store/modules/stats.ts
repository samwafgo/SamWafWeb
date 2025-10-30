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
  timestamp: number;
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
} = {
  currentStats: null,
  statsHistory: [],
  responseTimeHistory: [],
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
};

const actions = {};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};