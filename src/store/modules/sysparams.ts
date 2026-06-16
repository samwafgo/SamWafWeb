import { GetSystemParamsApi } from '@/apis/sysinfo';

const state = {
  emergencyPath: '',
  // 当前运行环境：数据库(sqlite|mysql) / 缓存(memory|redis)，用于顶部展示
  database: { driver: '' },
  cache: { type: '' },
  // 后续其他认证后参数在此追加
};

const mutations = {
  setParams(state: any, data: any) {
    state.emergencyPath = data?.emergency_path || '';
    state.database = data?.database || { driver: '' };
    state.cache = data?.cache || { type: '' };
  },
};

const actions = {
  async fetchParams({ commit }: any) {
    try {
      const res: any = await GetSystemParamsApi();
      if (res.code === 0) commit('setParams', res.data);
    } catch {
      // 静默失败，不影响主流程
    }
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
