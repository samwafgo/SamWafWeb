import { GetSystemParamsApi } from '@/apis/sysinfo';

const state = {
  emergencyPath: '',
  // 后续其他认证后参数在此追加
};

const mutations = {
  setParams(state: any, data: any) {
    state.emergencyPath = data?.emergency_path || '';
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
