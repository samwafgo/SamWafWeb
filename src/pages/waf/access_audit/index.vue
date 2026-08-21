<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container"></div>
        <div class="right-operation-container">
          <t-form ref="searchForm" :data="searchformData" :label-width="70" layout="inline" colon
            :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.access.audit.label_category')" name="category">
              <t-select v-model="searchformData.category" :style="{ width: '140px' }" clearable
                :placeholder="$t('common.select_placeholder')">
                <t-option v-for="c in categoryOptions" :key="c" :value="c" :label="categoryLabel(c)"></t-option>
              </t-select>
            </t-form-item>
            <t-form-item :label="$t('page.access.audit.label_event')" name="event">
              <t-select v-model="searchformData.event" :style="{ width: '160px' }" clearable
                :placeholder="$t('common.select_placeholder')">
                <t-option v-for="e in eventOptions" :key="e" :value="e" :label="eventLabel(e)"></t-option>
              </t-select>
            </t-form-item>
            <t-form-item :label="$t('page.access.audit.label_account')" name="account_name">
              <t-input v-model="searchformData.account_name" class="search-input" clearable></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.access.audit.label_ip')" name="client_ip">
              <t-input v-model="searchformData.client_ip" class="search-input" clearable></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.access.audit.label_host')" name="host">
              <t-input v-model="searchformData.host" class="search-input" clearable></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList()">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <help-block :summary="$t('page.access.audit.alert_message')" doc="guide/AccessAudit" />
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="pagination" :loading="dataLoading" @page-change="rehandlePageChange"
          :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">
          <template #category="{ row }">
            <t-tag :theme="row.category === 'config' ? 'warning' : 'default'" variant="light">{{ categoryLabel(row.category) }}</t-tag>
          </template>
          <template #event="{ row }">
            <t-tag :theme="eventTheme(row.event)" variant="light">{{ eventLabel(row.event) }}</t-tag>
          </template>
          <template #result="{ row }">
            <t-tag v-if="row.result === 1" theme="success" variant="light">{{ $t('page.access.audit.result_ok') }}</t-tag>
            <t-tag v-else theme="danger" variant="light">{{ $t('page.access.audit.result_fail') }}</t-tag>
          </template>
          <template #location="{ row }">
            <span>{{ [row.country, row.city].filter(Boolean).join(' ') || '-' }}</span>
          </template>
        </t-table>
      </div>
    </t-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { prefix } from '@/config/global';
import { wafAccessAuditListApi } from '@/apis/access';

// 与后端 model/security_audit_log.go 的 AccessEvent*/AuditEventConfig* 常量一一对应
const EVENTS = [
  'login_ok', 'login_fail', 'otp_fail', 'locked', 'logout', 'kick',
  'ticket_issue', 'ticket_consume', 'ticket_replay', 'bad_return_to',
  'denied', 'bypass_ip', 'bypass_token',
  'config_ssl_export_write',
];

// 审计分类，与后端 AuditCategory* 常量对应
const CATEGORIES = ['access', 'config'];

// 安全告警级事件用 danger 高亮：票据重放与回跳地址异常在正常流程里不该出现，
// 一旦出现就意味着有人在主动构造请求。
const DANGER_EVENTS = ['ticket_replay', 'bad_return_to', 'locked'];
const WARNING_EVENTS = ['login_fail', 'otp_fail', 'denied'];

export default Vue.extend({
  name: 'WafAccessAudit',
  data() {
    return {
      prefix,
      dataLoading: false,
      data: [],
      eventOptions: EVENTS,
      categoryOptions: CATEGORIES,
      columns: [
        { title: this.$t('page.access.audit.label_category'), width: 100, colKey: 'category' },
        { title: this.$t('page.access.audit.label_event'), align: 'left', width: 140, colKey: 'event' },
        { title: this.$t('page.access.audit.col_result'), width: 90, colKey: 'result' },
        { title: this.$t('page.access.audit.label_account'), width: 130, ellipsis: true, colKey: 'account_name' },
        { title: this.$t('page.access.audit.label_host'), width: 180, ellipsis: true, colKey: 'host' },
        { title: this.$t('page.access.audit.col_url'), width: 220, ellipsis: true, colKey: 'url' },
        { title: this.$t('page.access.audit.label_ip'), width: 140, ellipsis: true, colKey: 'client_ip' },
        { title: this.$t('page.access.audit.col_location'), width: 140, ellipsis: true, colKey: 'location' },
        { title: this.$t('page.access.audit.col_message'), width: 220, ellipsis: true, colKey: 'message' },
        { title: this.$t('common.create_time'), width: 170, ellipsis: true, colKey: 'create_time' },
      ],
      rowKey: 'id',
      verticalAlign: 'top',
      hover: true,
      pagination: { total: 0, current: 1, pageSize: 10 },
      searchformData: { category: '', event: '', account_name: '', client_ip: '', host: '' },
    };
  },
  computed: {
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    },
  },
  mounted() {
    this.getList();
  },
  methods: {
    getContainer() {
      return document.querySelector('.tdesign-starter-layout');
    },
    eventLabel(e) {
      if (!e) return '-';
      const key = `page.access.audit.event_${e}`;
      const label = this.$t(key);
      // 后端新增事件类型而前端还没补翻译时，直接显示原始事件名而不是键名
      return label === key ? e : label;
    },
    categoryLabel(c) {
      if (!c) return '-';
      const key = `page.access.audit.category_${c}`;
      const label = this.$t(key);
      return label === key ? c : label;
    },
    eventTheme(e) {
      if (DANGER_EVENTS.includes(e)) return 'danger';
      if (WARNING_EVENTS.includes(e)) return 'warning';
      return 'primary';
    },
    getList() {
      const that = this;
      this.dataLoading = true;
      wafAccessAuditListApi({
        pageSize: this.pagination.pageSize,
        pageIndex: this.pagination.current,
        ...this.searchformData,
      }).then((res) => {
        if (res.code === 0) {
          that.data = res.data.list ?? [];
          that.pagination = { ...that.pagination, total: res.data.total };
        } else {
          that.$message.warning(res.msg);
        }
      }).catch((e) => console.log(e)).finally(() => {
        that.dataLoading = false;
      });
    },
    rehandlePageChange(curr) {
      this.pagination.current = curr.current;
      this.pagination.pageSize = curr.pageSize;
      this.getList();
    },
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables';

.list-card-container {
  padding: @spacer-2 @spacer-3;

  :deep(.t-card__body) {
    padding: 0;
  }
}

.left-operation-container {
  padding: 0 0 @spacer-2 0;
  margin-bottom: @spacer;
}

.search-input {
  width: 140px;
}
</style>
