export interface StatsDataItem {
  server: string;
  operatype: string;
  qps: number;
  log_qps: number;
  main_queue: number;
  log_queue: number;
  stats_queue: number;
  message_queue: number;
  timestamp: number;
}

// 定义的state初始值
const state: { 
  currentStats: StatsDataItem | null;
  statsHistory: Array<StatsDataItem>;
} = {
  currentStats: null,
  statsHistory: [],
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
  clearStatsHistory(state) {
    // eslint-disable-next-line no-param-reassign
    state.statsHistory = [];
    // eslint-disable-next-line no-param-reassign
    state.currentStats = null;
  },
};

const getters = {
  getCurrentStats: (state) => state.currentStats,
  getStatsHistory: (state) => state.statsHistory,
  getLatestStats: (state) => state.statsHistory.length > 0 ? state.statsHistory[state.statsHistory.length - 1] : null,
};

const actions = {};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};