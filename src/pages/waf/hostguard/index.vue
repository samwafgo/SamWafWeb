<template>
  <div>
    <!-- 环境降级提示：采集不了 / 防火墙不可用时必须让用户一眼看到，
         否则功能"开着但不生效"，用户毫无察觉 -->
    <t-alert v-if="status.unavailable" theme="error" :close="false" class="top-alert">
      <template #message>
        <div class="alert-line">
          <strong>{{ $t('page.hostguard.alert_unavailable') }}</strong>{{ status.unavailable }}
        </div>
      </template>
    </t-alert>
    <t-alert
      v-else-if="status.capability && !status.capability.FirewallReady"
      theme="warning"
      :close="false"
      class="top-alert"
    >
      <template #message>
        <div class="alert-line">
          <strong>{{ $t('page.hostguard.alert_no_firewall') }}</strong>{{ status.capability.FirewallReason }}
        </div>
      </template>
    </t-alert>
    <t-alert
      v-else-if="status.running && status.mode !== 'block'"
      theme="info"
      :close="false"
      class="top-alert"
    >
      <template #message>
        <div class="alert-line">{{ $t('page.hostguard.alert_observe') }}</div>
      </template>
    </t-alert>

    <t-card class="list-card-container">
      <t-tabs v-model="activeTab" @change="onTabChange">
        <t-tab-panel value="overview" :label="$t('page.hostguard.tab_overview')">
          <overview-panel ref="overviewPanel" @go-tab="switchTab" />
        </t-tab-panel>

        <t-tab-panel value="event" :label="$t('page.hostguard.tab_event')">
          <event-panel ref="eventPanel" @changed="reloadStatus" />
        </t-tab-panel>

        <t-tab-panel value="ban" :label="$t('page.hostguard.tab_ban')">
          <ban-panel ref="banPanel" @changed="reloadStatus" />
        </t-tab-panel>

        <t-tab-panel value="offender" :label="$t('page.hostguard.tab_offender')">
          <offender-panel ref="offenderPanel" @changed="reloadStatus" />
        </t-tab-panel>

        <t-tab-panel value="conn" :label="$t('page.hostguard.tab_conn')">
          <conn-panel ref="connPanel" />
        </t-tab-panel>

        <t-tab-panel value="setting" :label="$t('page.hostguard.tab_setting')">
          <setting-panel ref="settingPanel" :status="status" @changed="reloadStatus" />
        </t-tab-panel>
      </t-tabs>
    </t-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { wafHostGuardStatusApi } from '@/apis/hostguard';
import OverviewPanel from './components/OverviewPanel.vue';
import EventPanel from './components/EventPanel.vue';
import BanPanel from './components/BanPanel.vue';
import OffenderPanel from './components/OffenderPanel.vue';
import ConnPanel from './components/ConnPanel.vue';
import SettingPanel from './components/SettingPanel.vue';

export default Vue.extend({
  name: 'HostGuard',
  components: {
    OverviewPanel,
    EventPanel,
    BanPanel,
    OffenderPanel,
    ConnPanel,
    SettingPanel,
  },
  data() {
    return {
      activeTab: 'overview',
      status: {
        running: false,
        mode: 'observe',
        unavailable: '',
        capability: null,
      },
    };
  },
  mounted() {
    this.reloadStatus();
    // 后端封禁时会通过 WebSocket 广播，页面据此即时刷新，
    // 用户不用盯着点刷新按钮
    this.$bus.$on('hostguard-ban', this.onRemoteBan);
  },
  beforeDestroy() {
    this.$bus.$off('hostguard-ban', this.onRemoteBan);
  },
  methods: {
    onRemoteBan() {
      this.reloadStatus();
      this.onTabChange(this.activeTab);
    },
    reloadStatus() {
      wafHostGuardStatusApi({})
        .then((res) => {
          if (res.code === 0 && res.data) {
            this.status = res.data;
          }
        })
        .catch(() => {});
    },
    switchTab(tab) {
      this.activeTab = tab;
      this.onTabChange(tab);
    },
    // 切到某个 tab 时才刷新它的数据：连接看板采集有开销，
    // 用户没看的时候不该在后台白跑
    onTabChange(val) {
      this.$nextTick(() => {
        const refMap = {
          overview: 'overviewPanel',
          event: 'eventPanel',
          ban: 'banPanel',
          offender: 'offenderPanel',
          conn: 'connPanel',
          setting: 'settingPanel',
        };
        const panel = this.$refs[refMap[val]] as any;
        if (panel && panel.refresh) {
          panel.refresh();
        }
      });
      this.reloadStatus();
    },
  },
});
</script>

<style lang="less" scoped>
.top-alert {
  margin-bottom: 16px;
}
.alert-line {
  font-size: 14px;
  line-height: 1.7;
  word-break: break-all;
}
</style>
