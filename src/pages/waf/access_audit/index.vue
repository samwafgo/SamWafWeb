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
              <t-select v-model="searchformData.event" :style="{ width: '210px' }" clearable
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
            <t-form-item :label="$t('page.access.audit.label_object_type')" name="object_type">
              <t-select v-model="searchformData.object_type" class="search-input" clearable>
                <t-option value="tunnel" :label="$t('page.access.audit.object_tunnel')" />
              </t-select>
            </t-form-item>
            <t-form-item v-if="searchformData.object_type === 'tunnel'" :label="$t('page.access.audit.label_tunnel_id')" name="object_id">
              <t-input v-model="searchformData.object_id" class="search-input" :maxlength="64" clearable />
            </t-form-item>
            <t-form-item v-else :label="$t('page.access.audit.label_host')" name="host">
              <t-input v-model="searchformData.host" class="search-input" clearable></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="search">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <help-block :summary="$t('page.access.audit.alert_message') + ' ' + $t('page.access.audit.app_audit_note')" doc="guide/AccessAudit" />
      <t-alert v-if="listError" theme="warning" :message="listError" />
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="pagination" :loading="dataLoading" @page-change="rehandlePageChange"
          :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">
          <template #category="{ row }">
            <t-tag :theme="categoryTheme(row.category)" variant="light">{{ categoryLabel(row.category) }}</t-tag>
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
          <template #account_name="{ row }">
            {{ actorLabel(row) }}
          </template>
          <template #object="{ row }">
            <span v-if="row.object_type === 'tunnel'">{{ $t('page.access.audit.object_tunnel') }} · {{ row.object_id }}</span>
            <span v-else-if="row.object_type === 'host'">{{ $t('page.access.audit.object_host') }} · {{ row.host || row.object_id }}</span>
            <span v-else-if="row.object_type === 'path_rule'">{{ $t('page.access.audit.object_path_rule') }} · {{ row.host || row.object_id }}</span>
            <span v-else>—</span>
          </template>
          <template #detail="{ row }">
            <t-button v-if="row.object_type === 'tunnel' && row.detail" variant="text" theme="primary" size="small"
              @click="selectedDetail = row">{{ $t('page.access.audit.view_changes') }}</t-button>
          </template>
        </t-table>
      </div>
    </t-card>
    <t-dialog :visible="!!selectedDetail" :header="$t('page.access.audit.view_changes')"
      width="min(820px, calc(100vw - 32px))" :footer="false" @close="selectedDetail = null">
      <div v-if="selectedDetail" class="audit-details">
        <strong>{{ eventLabel(selectedDetail.event) }}</strong>
        <div>{{ $t('page.access.audit.label_tunnel_id') }}: {{ selectedDetail.object_id }}</div>
        <div>{{ selectedDetail.create_time }} · {{ actorLabel(selectedDetail) }}</div>
        <div v-if="selectedDetail.detail.reason">
          {{ $t('page.access.audit.change_reason') }}: {{ reasonLabel(selectedDetail.detail.reason) }}
        </div>
        <t-alert v-if="selectedDetail.detail.truncated" theme="warning" :message="$t('page.access.audit.detail_truncated')" />
        <div class="audit-comparison">
          <div v-for="side in ['before', 'after']" :key="side">
            <strong>{{ $t(`page.access.audit.change_${side}`) }}</strong>
            <pre>{{ formatChange(selectedDetail.detail[side]) }}</pre>
          </div>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { prefix } from '@/config/global';
import { wafAccessAuditListApi } from '@/apis/access';

const TUNNEL_EVENTS = ['config_tunnel_region', 'config_tunnel_ddns', 'config_tunnel_ddns_addresses', 'config_tunnel_ddns_resolution'];
// 角色权限拒绝、静态目录变更与启动巡检
const STATIC_ROOT_EVENTS = ['config_role_denied', 'config_static_root_change', 'config_static_root_review'];

// 与后端 model/security_audit_log.go 的审计事件常量对应
const EVENTS = [
  'login_ok', 'login_fail', 'otp_fail', 'locked', 'logout', 'kick',
  'ticket_issue', 'ticket_consume', 'ticket_replay', 'bad_return_to',
  'denied', 'bypass_ip', 'bypass_token',
  'config_ssl_export_write', ...TUNNEL_EVENTS,
  ...STATIC_ROOT_EVENTS,
  // 网站密码访问（站点级密码那道门），与统一访问认证是两套独立功能，前缀也分开
  'httpauth_login_ok', 'httpauth_login_fail', 'httpauth_locked',
  'httpauth_kick', 'httpauth_expired', 'httpauth_denied',
  'app_add', 'app_edit', 'app_del', 'app_start', 'app_stop', 'app_restart',
  'app_upload', 'app_upgrade', 'app_rollback', 'app_clear_logs', 'app_op_denied',
];

// 审计分类，与后端 AuditCategory* 常量对应
const CATEGORIES = ['access', 'httpauth', 'config', 'app'];

// 安全告警级事件用 danger 高亮：票据重放与回跳地址异常在正常流程里不该出现，
// 一旦出现就意味着有人在主动构造请求。
const DANGER_EVENTS = ['ticket_replay', 'bad_return_to', 'locked', 'httpauth_locked'];
const WARNING_EVENTS = ['login_fail', 'otp_fail', 'denied', 'httpauth_login_fail', 'httpauth_denied', 'app_op_denied',
  'config_role_denied', 'config_static_root_review'];

function initialFilters() {
  return { category: '', event: '', account_name: '', client_ip: '', host: '', object_type: '', object_id: '' };
}

export default Vue.extend({
  name: 'WafAccessAudit',
  data() {
    return {
      prefix,
      dataLoading: false,
      data: [],
      requestSerial: 0,
      listError: '',
      selectedDetail: null,
      categoryOptions: CATEGORIES,
      columns: [
        { title: this.$t('page.access.audit.label_category'), width: 100, colKey: 'category' },
        { title: this.$t('page.access.audit.label_event'), align: 'left', width: 190, colKey: 'event' },
        { title: this.$t('page.access.audit.col_result'), width: 90, colKey: 'result' },
        { title: this.$t('page.access.audit.label_account'), width: 130, ellipsis: true, colKey: 'account_name' },
        { title: this.$t('page.access.audit.label_host'), width: 180, ellipsis: true, colKey: 'host' },
        { title: this.$t('page.access.audit.label_object_type'), width: 200, ellipsis: true, colKey: 'object' },
        { title: this.$t('page.access.audit.col_url'), width: 220, ellipsis: true, colKey: 'url' },
        { title: this.$t('page.access.audit.label_ip'), width: 140, ellipsis: true, colKey: 'client_ip' },
        { title: this.$t('page.access.audit.col_location'), width: 140, ellipsis: true, colKey: 'location' },
        { title: this.$t('page.access.audit.col_message'), width: 220, ellipsis: true, colKey: 'message' },
        { title: this.$t('common.create_time'), width: 170, ellipsis: true, colKey: 'create_time' },
        { title: this.$t('common.op'), width: 145, colKey: 'detail' },
      ],
      rowKey: 'id',
      verticalAlign: 'top',
      hover: true,
      pagination: { total: 0, current: 1, pageSize: 10 },
      searchformData: initialFilters(),
      appliedFilters: initialFilters(),
    };
  },
  computed: {
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    },
    eventOptions() {
      return this.searchformData.object_type === 'tunnel' ? TUNNEL_EVENTS : EVENTS;
    },
  },
  watch: {
    $route: {
      immediate: true,
      handler(route) {
        if (route.name !== 'WafAccessAudit') return;
        const { object_type, object_id, category, event } = route.query;
        const filters = initialFilters();
        if (object_type === 'tunnel') {
          filters.object_type = 'tunnel';
          filters.object_id = typeof object_id === 'string' ? object_id.trim().slice(0, 64) : '';
          filters.category = 'config';
        } else if (typeof category === 'string' && CATEGORIES.includes(category)) {
          filters.category = category;
        }
        const events = filters.object_type === 'tunnel' ? TUNNEL_EVENTS : EVENTS;
        if (typeof event === 'string' && events.includes(event)) filters.event = event;
        this.searchformData = filters;
        this.selectedDetail = null;
        this.search();
      },
    },
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
    // 审计分类标签配色
    categoryTheme(c) {
      if (c === 'config') return 'warning';
      if (c === 'httpauth') return 'primary';
      return 'default';
    },
    eventTheme(e) {
      if (DANGER_EVENTS.includes(e)) return 'danger';
      if (WARNING_EVENTS.includes(e)) return 'warning';
      return 'primary';
    },
    actorLabel(row) {
      if (row.account_name === 'system' && (TUNNEL_EVENTS.slice(2).includes(row.event) || row.event === 'config_static_root_review')) {
        return this.$t('page.access.audit.system_actor');
      }
      return row.account_name || '—';
    },
    reasonLabel(reason) {
      const key = `page.access.audit.reason_${reason}`;
      return this.$te(key) ? this.$t(key) : reason;
    },
    formatChange(change) {
      return change == null ? '—' : JSON.stringify(change, null, 2);
    },
    search() {
      const { object_type, object_id, event, host, ...other } = this.searchformData;
      this.appliedFilters = {
        ...other,
        event: this.eventOptions.includes(event) ? event : '',
        host: object_type === 'tunnel' ? '' : host,
        ...(object_type === 'tunnel' ? { object_type, object_id: (object_id || '').trim() } : {}),
      };
      this.pagination.current = 1;
      this.getList();
    },
    async getList() {
      const serial = ++this.requestSerial;
      this.dataLoading = true;
      this.listError = '';
      this.data = [];
      try {
        const res = await wafAccessAuditListApi({
          pageSize: this.pagination.pageSize,
          pageIndex: this.pagination.current,
          ...this.appliedFilters,
        });
        if (serial !== this.requestSerial) return;
        if (res && res.code === 0) {
          const rows = res.data.list ?? [];
          const { object_type, object_id } = this.appliedFilters;
          if (object_type === 'tunnel' && rows.some((row) => row.object_type !== 'tunnel' || (object_id && row.object_id !== object_id))) {
            this.pagination.total = 0;
            this.listError = this.$t('page.access.audit.scope_unsupported');
            return;
          }
          this.data = rows;
          this.pagination = { ...this.pagination, total: res.data.total };
        } else {
          this.pagination.total = 0;
          this.listError = res && res.code === -403
            ? this.$t('page.access.audit.forbidden')
            : (res && res.msg) || this.$t('page.access.audit.load_failed');
        }
      } catch {
        if (serial !== this.requestSerial) return;
        this.pagination.total = 0;
        this.listError = this.$t('page.access.audit.load_failed');
      } finally {
        if (serial === this.requestSerial) this.dataLoading = false;
      }
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

.audit-comparison {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 12px;
}

.audit-details {
  display: grid;
  gap: 8px;
  max-height: 70vh;
  overflow: auto;
  overflow-wrap: anywhere;

  pre {
    padding: 8px;
    white-space: pre-wrap;
    background: var(--td-bg-color-secondarycontainer);
  }
}
</style>
