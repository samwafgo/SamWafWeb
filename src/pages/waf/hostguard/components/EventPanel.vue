<template>
  <div class="panel-container">
    <t-form layout="inline" :data="searchFormData" class="search-form">
      <t-form-item :label="$t('page.hostguard.col_source')">
        <t-select v-model="searchFormData.source" clearable :style="{ width: '120px' }">
          <t-option key="ssh" value="ssh" label="SSH" />
          <t-option key="rdp" value="rdp" label="RDP" />
        </t-select>
      </t-form-item>
      <t-form-item :label="$t('page.hostguard.col_ip')">
        <t-input v-model="searchFormData.ip" clearable :style="{ width: '160px' }" />
      </t-form-item>
      <t-form-item :label="$t('page.hostguard.col_user')">
        <t-input v-model="searchFormData.user_name" clearable :style="{ width: '140px' }" />
      </t-form-item>
      <t-form-item :label="$t('page.hostguard.col_action')">
        <t-select v-model="searchFormData.action" clearable :style="{ width: '140px' }">
          <t-option key="banned" value="banned" :label="$t('page.hostguard.action_banned')" />
          <t-option key="counted" value="counted" :label="$t('page.hostguard.action_counted')" />
          <t-option key="observe" value="observe" :label="$t('page.hostguard.action_observe')" />
          <t-option key="skipped" value="skipped" :label="$t('page.hostguard.action_skipped')" />
        </t-select>
      </t-form-item>
      <t-form-item>
        <t-button theme="primary" @click="onSearch">{{ $t('common.search') }}</t-button>
        <t-button variant="outline" @click="onReset" style="margin-left: 8px">{{ $t('common.reset') }}</t-button>
      </t-form-item>
    </t-form>

    <t-table
      :columns="columns"
      :data="data"
      :rowKey="rowKey"
      verticalAlign="top"
      :hover="true"
      :pagination="pagination"
      :loading="dataLoading"
      @page-change="rehandlePageChange"
    >
      <template #source="{ row }">
        <t-tag :theme="row.source === 'rdp' ? 'warning' : 'primary'" variant="light">
          {{ row.source === 'rdp' ? 'RDP' : 'SSH' }}
        </t-tag>
      </template>
      <template #fail_kind="{ row }">
        <span>{{ failKindText(row.fail_kind) }}</span>
      </template>
      <template #action="{ row }">
        <t-tag v-if="row.action === 'banned'" theme="danger" variant="light">
          {{ $t('page.hostguard.action_banned') }}
        </t-tag>
        <t-tag v-else-if="row.action === 'counted'" theme="warning" variant="light">
          {{ $t('page.hostguard.action_counted') }}
        </t-tag>
        <t-tag v-else-if="row.action === 'observe'" theme="primary" variant="light">
          {{ $t('page.hostguard.action_observe') }}
        </t-tag>
        <t-tag v-else theme="default" variant="light">{{ $t('page.hostguard.action_skipped') }}</t-tag>
      </template>
      <template #event_time="{ row }">
        <span>{{ fmtTime(row.event_time) }}</span>
      </template>
      <template #raw_line="{ row }">
        <t-tooltip :content="row.raw_line" placement="top" :showArrow="true">
          <span class="raw-line">{{ row.raw_line }}</span>
        </t-tooltip>
      </template>
      <template #op="{ row }">
        <a class="t-button-link" @click="handleBan(row)">{{ $t('page.hostguard.op_ban') }}</a>
        <a class="t-button-link" @click="handleWhitelist(row)" style="margin-left: 8px">
          {{ $t('page.hostguard.op_whitelist') }}
        </a>
        <a class="t-button-link" @click="handleFilterIP(row)" style="margin-left: 8px">
          {{ $t('page.hostguard.op_same_ip') }}
        </a>
      </template>
    </t-table>

    <ban-dialog :visible.sync="banVisible" :ip="banIP" @done="onBanDone" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { wafHostGuardEventListApi, wafHostGuardWhitelistAddApi } from '@/apis/hostguard';
import { fmtUnix } from '../utils';
import BanDialog from './BanDialog.vue';

export default Vue.extend({
  name: 'HostGuardEventPanel',
  components: { BanDialog },
  data() {
    return {
      dataLoading: false,
      data: [],
      rowKey: 'id',
      pagination: { total: 0, current: 1, pageSize: 20 },
      searchFormData: { source: '', ip: '', user_name: '', action: '' },
      banVisible: false,
      banIP: '',
      columns: [
        { title: this.$t('page.hostguard.col_time'), colKey: 'event_time', width: 170 },
        { title: this.$t('page.hostguard.col_source'), colKey: 'source', width: 80 },
        { title: this.$t('page.hostguard.col_ip'), colKey: 'ip', width: 150, ellipsis: true },
        { title: this.$t('page.hostguard.col_location'), colKey: 'location', width: 160, ellipsis: true },
        { title: this.$t('page.hostguard.col_user'), colKey: 'user_name', width: 120, ellipsis: true },
        { title: this.$t('page.hostguard.col_fail_kind'), colKey: 'fail_kind', width: 150 },
        { title: this.$t('page.hostguard.col_action'), colKey: 'action', width: 100 },
        { title: this.$t('page.hostguard.col_hit_count'), colKey: 'hit_count', width: 90 },
        { title: this.$t('page.hostguard.col_src_port'), colKey: 'port', width: 90 },
        { title: this.$t('page.hostguard.col_raw'), colKey: 'raw_line', width: 260, ellipsis: true },
        { title: this.$t('common.op'), colKey: 'op', width: 200, fixed: 'right' },
      ],
    };
  },
  mounted() {
    this.refresh();
  },
  methods: {
    fmtTime(sec) {
      return fmtUnix(sec);
    },
    failKindText(kind) {
      const key = `page.hostguard.fail_kind.${kind}`;
      return this.$te(key) ? this.$t(key) : kind;
    },
    refresh() {
      this.getList();
    },
    getList() {
      this.dataLoading = true;
      wafHostGuardEventListApi({
        pageIndex: this.pagination.current,
        pageSize: this.pagination.pageSize,
        ...this.searchFormData,
      })
        .then((res) => {
          if (res.code === 0) {
            this.data = res.data.list || [];
            this.pagination = { ...this.pagination, total: res.data.total };
          }
        })
        .catch(() => {})
        .finally(() => {
          this.dataLoading = false;
        });
    },
    onSearch() {
      this.pagination.current = 1;
      this.getList();
    },
    onReset() {
      this.searchFormData = { source: '', ip: '', user_name: '', action: '' };
      this.onSearch();
    },
    rehandlePageChange(curr) {
      this.pagination.current = curr.current;
      if (this.pagination.pageSize !== curr.pageSize) {
        this.pagination.current = 1;
        this.pagination.pageSize = curr.pageSize;
      }
      this.getList();
    },
    handleFilterIP(row) {
      this.searchFormData.ip = row.row.ip;
      this.onSearch();
    },
    handleBan(row) {
      this.banIP = row.row.ip;
      this.banVisible = true;
    },
    onBanDone() {
      this.getList();
      this.$emit('changed');
    },
    handleWhitelist(row) {
      const ip = row.row.ip;
      const dialogInstance = this.$dialog.confirm({
        header: this.$t('page.hostguard.confirm_whitelist_title'),
        body: this.$t('page.hostguard.confirm_whitelist_body', { ip }),
        onConfirm: () =>
          wafHostGuardWhitelistAddApi({ ip })
            .then((res) => {
              if (res.code === 0) {
                this.$message.success(res.msg);
                this.getList();
                this.$emit('changed');
              } else {
                this.$message.warning(res.msg);
              }
              dialogInstance.destroy();
            })
            .catch(() => {
              dialogInstance.destroy();
            }),
      });
    },
  },
});
</script>

<style lang="less" scoped>
.panel-container {
  padding: 8px 0;
}
.search-form {
  margin-bottom: 16px;
}
.raw-line {
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}
</style>
