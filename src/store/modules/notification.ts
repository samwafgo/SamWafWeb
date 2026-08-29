import Vue from 'vue';

export interface msgDataItem {
  message_id: string;
  message_data: string;
  message_type: string;
  message_unread_status: boolean;
  message_datetime: string;
  // 以下字段用于铃铛内的分类与合并，后端推来的消息由 store 补齐
  message_count?: number;   // 同一条重复出现的次数
  message_local?: boolean;  // 前端本地产生（连接异常等），非后端推送
  message_kind?: string;    // 本地消息的细分：net=连接 ops=运维
}

// 铃铛按「用户心智」分两类，不按技术来源分：
//   guard  外面来的攻击与安全事件
//   system 软件自己的事（连接状态、运维消息）
// 防护类是可枚举的固定集合，运维类才会不断增加，所以未登记的类型一律归 system。
// 新增防护类消息时记得往这里登记，否则会被埋进「系统」页签。
export const GUARD_MESSAGE_TYPES = [
  '命中保护规则',
  '攻击告警',
  'IP封禁通知',
  '主机防爆破封禁',
  '登录来源变化',
  '用户登录',
  '统一访问认证',
];

export const CATEGORY_GUARD = 'guard';
export const CATEGORY_SYSTEM = 'system';

export function categoryOf(item: msgDataItem): string {
  return GUARD_MESSAGE_TYPES.indexOf(item && item.message_type) !== -1 ? CATEGORY_GUARD : CATEGORY_SYSTEM;
}

// 本地消息的 message_type，同时也是铃铛里显示的副标题
export const LOCAL_TYPE_NET = '连接异常';

// 定义的state初始值
const state: { msgData: Array<msgDataItem> } = {
  msgData: [  ],
};

// 本地消息在铃铛里的保留上限，超出丢弃最老的
const LOCAL_MSG_LIMIT = 20;

function nowText(): string {
  const d = new Date();
  const p = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(
    d.getSeconds(),
  )}`;
}

// 只在「未读」范围内合并：已读的是历史记录，不该被后来的消息改写。
function findMergeable(list: Array<msgDataItem>, type: string, data: string): msgDataItem | undefined {
  return list.find(
    (m) => m.message_unread_status && m.message_type === type && m.message_data === data,
  );
}

const mutations = {
  setMsgData(state, data) {
    // eslint-disable-next-line no-param-reassign
    state.msgData= data;
  },
  // 后端 WebSocket 推来的消息。同类型 + 同内容的未读消息合并计数 ——
  // 同一个 IP 命中同一条规则会在一两秒内连推好几条，逐条堆进去铃铛就没法看了。
  addMsgData(state, data) {
    const exist = findMergeable(state.msgData, data.message_type, data.message_data);
    if (exist) {
      exist.message_count = (exist.message_count || 1) + 1;
      exist.message_datetime = data.message_datetime || exist.message_datetime;
      return;
    }
    state.msgData.push({ ...data, message_count: 1 });
  },
  // addLocalMsg 前端本地产生的消息（请求超时、连不上后端等）也收进小铃铛，
  // 落在「系统」页签。同内容只累加次数，避免把右上角的刷屏搬进铃铛。
  addLocalMsg(state, data: { kind?: string; type?: string; text: string }) {
    const type = data.type || LOCAL_TYPE_NET;
    const exist = findMergeable(state.msgData, type, data.text);
    if (exist) {
      exist.message_count = (exist.message_count || 1) + 1;
      exist.message_datetime = nowText();
      return;
    }
    state.msgData.push({
      message_id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      message_data: data.text,
      message_type: type,
      message_unread_status: true,
      message_datetime: nowText(),
      message_count: 1,
      message_local: true,
      message_kind: data.kind || 'net',
    });
    const locals = state.msgData.filter((m) => m.message_local);
    if (locals.length > LOCAL_MSG_LIMIT) {
      const drop = locals.slice(0, locals.length - LOCAL_MSG_LIMIT).map((m) => m.message_id);
      Vue.set(
        state,
        'msgData',
        state.msgData.filter((m) => drop.indexOf(m.message_id) === -1),
      );
    }
  },
  // 清空某一个页签：防护告警是安全记录、系统消息是状态回声，
  // 一个按钮把两类一起抹掉，用户不敢点。
  markCategoryRead(state, category: string) {
    state.msgData.forEach((m) => {
      if (categoryOf(m) === category) {
        // eslint-disable-next-line no-param-reassign
        m.message_unread_status = false;
      }
    });
    // 本地消息读完即弃，没有回看价值，留着只会把列表撑长
    Vue.set(
      state,
      'msgData',
      state.msgData.filter((m) => !(m.message_local && !m.message_unread_status)),
    );
  },
  // 跳登录页时清掉本地提示：那些「令牌过期」是上一个会话里并发请求的回声，
  // 人都已经被踢回登录页了，再展示一遍没有任何信息量。
  dropLocalMsg(state) {
    Vue.set(state, 'msgData', state.msgData.filter((m) => !m.message_local));
  },
};

const getters = {
  unreadMsg: (state) => state.msgData.filter((item) => item.message_unread_status),
  readMsg: (state) => state.msgData.filter((item) => !item.message_unread_status),
  guardMsg: (state) =>
    state.msgData.filter((item) => item.message_unread_status && categoryOf(item) === CATEGORY_GUARD),
  systemMsg: (state) =>
    state.msgData.filter((item) => item.message_unread_status && categoryOf(item) === CATEGORY_SYSTEM),
  // 连接类未读的累计次数：铃铛是否变色、默认落哪个页签都看它
  netUnreadCount: (state) =>
    state.msgData
      .filter((item) => item.message_unread_status && item.message_local && item.message_kind === 'net')
      .reduce((sum, item) => sum + (item.message_count || 1), 0),
};

const actions = {};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
