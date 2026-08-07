<template>
  <div class="panel-container">
    <t-alert theme="info" :close="false" class="tip-alert">
      <template #message>{{ $t('page.hostguard.offender_tip') }}</template>
    </t-alert>

    <t-form layout="inline" :data="searchFormData" class="search-form">
      <t-form-item :label="$t('page.hostguard.col_ip')">
        <t-input v-model="searchFormData.ip" clearable :style="{ width: '160px' }" />
      </t-form-item>
      <t-form-item :label="$t('page.hostguard.col_source')">
        <t-select v-model="searchFormData.source" clearable :style="{ width: '120px' }">
          <t-option key="ssh" value="ssh" label="SSH" />
          <t-option key="rdp" value="rdp" label="RDP" />
        </t-select>
      </t-form-item>
      <t-form-item>
        <t-button theme="primary" @click="onSearch">{{ $t('common.search') }}</t-button>
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
      <template #ban_count="{ row }">
        <span class="ban-count">{{ row.ban_count }}</span>
      </template>
      <template #current_level="{ row }">
        <t-tag v-if="row.current_level > 0" :theme="row.current_level >= 4 ? 'danger' : 'warning'" variant="light">
          {{ $t('page.hostguard.level_n', { n: row.current_level }) }}
        </t-tag>
        <span v-else>-</span>
      </template>
      <template #first_ban_time="{ row }">
        <span>{{ fmtTime(row.first_ban_time) }}</span>
      </template>
      <template #last_ban_time="{ row }">
        <span>{{ fmtTime(row.last_ban_time) }}</span>
      </template>
      <template #op="{ row }">
        <a class="t-button-link" @click="handleReset(row)">{{ $t('page.hostguard.op_reset_level') }}</a>
        <a class="t-button-link" @click="handlePermanentBan(row)" style="margin-left: 8px">
          {{ $t('page.hostguard.op_ban_permanent') }}
        </a>
        <a class="t-button-link" @click="handleWhitelist(row)" style="margin-left: 8px">
          {{ $t('page.hostguard.op_whitelist') }}
        </a>
        <a class="t-button-link" @click="handleDelete(row)" style="margin-left: 8px">{{ $t('common.delete') }}</a>
      </template>
    </t-table>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  wafHostGuardOffenderListApi,
  wafHostGuardOffenderResetApi,
  wafHostGuardOffenderDelApi,
  wafHostGuardBanManualApi,
  wafHostGuardWhitelistAddApi,
} from '@/apis/hostguard';
import { fmtUnix } from '../utils';

export default Vue.extend({
  name: 'HostGuardOffenderPanel',
  data() {
    return {
      dataLoading: false,
      data: [],
      rowKey: 'id',
      pagination: { total: 0, current: 1, pageSize: 20 },
      searchFormData: { ip: '', source: '' },
      columns: [
        { title: this.$t('page.hostguard.col_ip'), colKey: 'ip', width: 160, ellipsis: true },
        { title: this.$t('page.hostguard.col_source'), colKey: 'source', width: 80 },
        { title: this.$t('page.hostguard.col_ban_count'), colKey: 'ban_count', width: 110 },
        { title: this.$t('page.hostguard.col_level'), colKey: 'current_level', width: 110 },
        { title: this.$t('page.hostguard.col_total_fail'), colKey: 'total_fail_count', width: 110 },
        { title: this.$t('page.hostguard.col_first_ban'), colKey: 'first_ban_time', width: 170 },
        { title: this.$t('page.hostguard.col_last_ban'), colKey: 'last_ban_time', width: 170 },
        { title: this.$t('page.hostguard.col_location'), colKey: 'location', width: 160, ellipsis: true },
        { title: this.$t('page.hostguard.col_last_reason'), colKey: 'last_reason', width: 280, ellipsis: true },
        { title: this.$t('common.op'), colKey: 'op', width: 280, fixed: 'right' },
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
    refresh() {
      this.getList();
    },
    getList() {
      this.dataLoading = true;
      wafHostGuardOffenderListApi({
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
    rehandlePageChange(curr) {
      this.pagination.current = curr.current;
      if (this.pagination.pageSize !== curr.pageSize) {
        this.pagination.current = 1;
        this.pagination.pageSize = curr.pageSize;
      }
      this.getList();
    },
    confirmThen(header, body, action) {
      const dialogInstance = this.$dialog.confirm({
        header,
        body,
        onConfirm: () =>
          action()
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
    handleReset(row) {
      this.confirmThen(
        this.$t('page.hostguard.confirm_reset_title'),
        this.$t('page.hostguard.confirm_reset_body', { ip: row.ip }),
        () => wafHostGuardOffenderResetApi({ id: row.id }),
      );
    },
    handleDelete(row) {
      this.confirmThen(
        this.$t('common.confirm_delete'),
        this.$t('common.data_delete_warning'),
        () => wafHostGuardOffenderDelApi({ id: row.id }),
      );
    },
    handlePermanentBan(row) {
      this.confirmThen(
        this.$t('page.hostguard.confirm_permanent_title'),
        this.$t('page.hostguard.confirm_permanent_body', { ip: row.ip }),
        () =>
          wafHostGuardBanManualApi({
            ip: row.ip,
            source: row.source,
            ban_minutes: 0,
            reason: this.$t('page.hostguard.reason_manual_permanent'),
          }),
      );
    },
    handleWhitelist(row) {
      this.confirmThen(
        this.$t('page.hostguard.confirm_whitelist_title'),
        this.$t('page.hostguard.confirm_whitelist_body', { ip: row.ip }),
        () => wafHostGuardWhitelistAddApi({ ip: row.ip }),
      );
    },
  },
});
</script>

<style lang="less" scoped>
.panel-container {
  padding: 8px 0;
}
.tip-alert,
.search-form {
  margin-bottom: 16px;
}
.ban-count {
  font-weight: 600;
  color: #d54941;
}
</style>
