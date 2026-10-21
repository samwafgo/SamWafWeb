<template>
  <t-card class="list-card-container ip-ban-page">
    <div class="page-topbar">
      <span class="topbar-title">{{ $t('menu.host.ip_ban') }}</span>
      <ip-lookup ref="ipLookup" />
    </div>
    <t-tabs v-model="activeTab">
      <t-tab-panel value="ban_list" :label="$t('page.ip_ban.ban_list')" />
      <t-tab-panel value="config" :label="$t('page.ip_ban.config')" />
    </t-tabs>

    <div v-if="activeTab === 'ban_list'" class="ip-ban-content">
      <div class="source-bar">
        <span>{{ $t('page.ip_ban.source') }}</span>
        <t-radio-group v-model="source" variant="default-filled">
          <t-radio-button value="rule">{{ $t('page.ip_ban.rule') }}</t-radio-button>
          <t-radio-button value="failure">{{ $t('page.ip_ban.failure') }}</t-radio-button>
          <t-radio-button value="cc">{{ $t('page.ip_ban.cc') }}</t-radio-button>
        </t-radio-group>
      </div>
      <template v-if="source === 'cc'">
        <t-alert theme="info" :message="$t('page.ip_ban.cc_list_notice')" :close="false" class="cc-notice" />
      </template>
      <component :is="listComponent" :key="source" v-bind="listComponentProps" embedded @ip-lookup="openIpLookup" />
    </div>

    <div v-else class="ip-ban-content">
      <section class="config-section">
        <h3>{{ $t('page.ip_ban.rule') }}</h3>
        <rule-ban panel="config" embedded />
      </section>
      <section class="config-section">
        <h3>{{ $t('page.ip_ban.failure') }}</h3>
        <ip-failure panel="config" embedded />
      </section>
      <section class="config-section">
        <h3>{{ $t('page.ip_ban.cc') }}</h3>
        <p class="config-description">{{ $t('page.ip_ban.cc_config_desc') }}</p>
        <t-button variant="outline" @click="$router.push({ name: 'WafAntiCCList' })">
          {{ $t('page.ip_ban.cc_config_link') }}
        </t-button>
      </section>
    </div>
  </t-card>
</template>

<script lang="ts">
import Vue from 'vue';
import RuleBan from '@/pages/waf/rule_ban/index.vue';
import IpFailure from '@/pages/waf/ip_failure/index.vue';
import CcBanList from '@/pages/waf/anticc/component/baniplist/index.vue';

export default Vue.extend({
  name: 'IPBan',
  components: { RuleBan, IpFailure, CcBanList },
  computed: {
    activeTab: {
      get(): string {
        return this.$route.query.tab === 'config' ? 'config' : 'ban_list';
      },
      set(value: string) {
        this.updateQuery('tab', value);
      },
    },
    source: {
      get(): string {
        const source = this.$route.query.source;
        return source === 'failure' || source === 'cc' ? source : 'rule';
      },
      set(value: string) {
        this.updateQuery('source', value);
      },
    },
    listComponent(): string {
      return { rule: 'RuleBan', failure: 'IpFailure', cc: 'CcBanList' }[this.source];
    },
    listComponentProps(): Record<string, string> {
      return this.source === 'cc' ? {} : { panel: 'ban_list' };
    },
  },
  methods: {
    openIpLookup(ip: string) {
      const lookup = this.$refs.ipLookup as any;
      if (lookup && lookup.open) lookup.open(ip);
    },
    updateQuery(key: string, value: string) {
      if (this.$route.query[key] === value) return;
      this.$router.replace({ query: { ...this.$route.query, [key]: value }, hash: this.$route.hash }).catch(() => { /* 同一位置替换 */ });
    },
  },
});
</script>

<style lang="less" scoped>
.page-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;

  .topbar-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }
}
.ip-ban-content {
  padding-top: 24px;
}
.source-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
.cc-notice {
  margin-bottom: 16px;
}
.config-section {
  padding-bottom: 24px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--td-border-level-1-color);
  &:last-child {
    padding-bottom: 0;
    margin-bottom: 0;
    border-bottom: 0;
  }
  h3 {
    margin: 0 0 16px;
    font-size: 16px;
    font-weight: 600;
  }
}
.config-description {
  color: var(--td-text-color-secondary);
  line-height: 1.7;
}
</style>
