<template>
  <div class="panel-container">
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
      <t-form-item :label="$t('page.hostguard.col_status')">
        <t-select v-model="searchFormData.status" :style="{ width: '140px' }">
          <t-option key="active" value="active" :label="$t('page.hostguard.status_active')" />
          <t-option key="expired" value="expired" :label="$t('page.hostguard.status_expired')" />
          <t-option key="released" value="released" :label="$t('page.hostguard.status_released')" />
          <t-option key="all" value="all" :label="$t('page.hostguard.status_all')" />
        </t-select>
      </t-form-item>
      <t-form-item>
        <t-button theme="primary" @click="onSearch">{{ $t('common.search') }}</t-button>
        <t-button variant="outline" @click="banVisible = true" style="margin-left: 8px">
          {{ $t('page.hostguard.op_manual_ban') }}
        </t-button>
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
      <template #ip="{ row }">
        <span>{{ row.ip }}</span>
        <t-tag v-if="row.is_subnet === 1" theme="danger" variant="light" size="small" style="margin-left: 4px">
          {{ $t('page.hostguard.tag_subnet') }}
        </t-tag>
      </template>
      <template #level="{ row }">
        <t-tag v-if="row.level > 0" theme="warning" variant="light">
          {{ $t('page.hostguard.level_n', { n: row.level }) }}
        </t-tag>
        <t-tag v-else theme="default" variant="light">{{ $t('page.hostguard.level_manual') }}</t-tag>
      </template>
      <template #ban_minutes="{ row }">
        <span>{{ fmtDuration(row.ban_minutes) }}</span>
      </template>
      <template #remain="{ row }">
        <span :class="row.expire_time === 0 ? 'remain-permanent' : ''">{{ fmtRemainText(row) }}</span>
      </template>
      <template #start_time="{ row }">
        <span>{{ fmtTime(row.start_time) }}</span>
      </template>
      <template #status="{ row }">
        <t-tag v-if="row.status === 'active'" theme="danger" variant="light">
          {{ $t('page.hostguard.status_active') }}
        </t-tag>
        <t-tag v-else-if="row.status === 'expired'" theme="default" variant="light">
          {{ $t('page.hostguard.status_expired') }}
        </t-tag>
        <t-tag v-else theme="success" variant="light">{{ $t('page.hostguard.status_released') }}</t-tag>
      </template>
      <template #op="{ row }">
        <template v-if="row.status === 'active'">
          <a class="t-button-link" @click="handleRelease(row)">{{ $t('page.hostguard.op_release') }}</a>
          <a
            v-if="row.expire_time > 0"
            class="t-button-link"
            @click="handlePermanent(row)"
            style="margin-left: 8px"
          >
            {{ $t('page.hostguard.op_permanent') }}
          </a>
          <a class="t-button-link" @click="handleWhitelist(row)" style="margin-left: 8px">
            {{ $t('page.hostguard.op_whitelist') }}
          </a>
        </template>
        <span v-else class="op-disabled">-</span>
      </template>
    </t-table>

    <ban-dialog :visible.sync="banVisible" ip="" @done="onBanDone" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  wafHostGuardBanListApi,
  wafHostGuardBanReleaseApi,
  wafHostGuardBanPermanentApi,
  wafHostGuardWhitelistAddApi,
} from '@/apis/hostguard';
import { fmtUnix, fmtBanMinutes, fmtRemain } from '../utils';
import BanDialog from './BanDialog.vue';

export default Vue.extend({
  name: 'HostGuardBanPanel',
  components: { BanDialog },
  data() {
    return {
      dataLoading: false,
      data: [],
      rowKey: 'id',
      pagination: { total: 0, current: 1, pageSize: 20 },
      searchFormData: { ip: '', source: '', status: 'active' },
      banVisible: false,
      // 剩余时间要走动，否则用户盯着看会以为页面卡住了
      tickTimer: null as any,
      tick: 0,
      columns: [
        { title: this.$t('page.hostguard.col_ip'), colKey: 'ip', width: 190, ellipsis: true },
        { title: this.$t('page.hostguard.col_source'), colKey: 'source', width: 80 },
        { title: this.$t('page.hostguard.col_level'), colKey: 'level', width: 100 },
        { title: this.$t('page.hostguard.col_duration'), colKey: 'ban_minutes', width: 90 },
        { title: this.$t('page.hostguard.col_remain'), colKey: 'remain', width: 110 },
        { title: this.$t('page.hostguard.col_start'), colKey: 'start_time', width: 170 },
        { title: this.$t('page.hostguard.col_status'), colKey: 'status', width: 90 },
        { title: this.$t('page.hostguard.col_location'), colKey: 'location', width: 160, ellipsis: true },
        { title: this.$t('page.hostguard.col_reason'), colKey: 'reason', width: 300, ellipsis: true },
        { title: this.$t('common.op'), colKey: 'op', width: 210, fixed: 'right' },
      ],
    };
  },
  mounted() {
    this.refresh();
    this.tickTimer = setInterval(() => {
      this.tick += 1;
    }, 1000);
  },
  beforeDestroy() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
    }
  },
  methods: {
    fmtTime(sec) {
      return fmtUnix(sec);
    },
    fmtDuration(minutes) {
      return fmtBanMinutes(minutes, this.$t('page.hostguard.permanent'));
    },
    fmtRemainText(row) {
      // 依赖 tick 让计算属性随秒刷新
      void this.tick;
      if (row.status !== 'active') {
        return '-';
      }
      return fmtRemain(row.expire_time, this.$t('page.hostguard.permanent'), this.$t('page.hostguard.expiring'));
    },
    refresh() {
      this.getList();
    },
    getList() {
      this.dataLoading = true;
      wafHostGuardBanListApi({
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
    onBanDone() {
      this.getList();
      this.$emit('changed');
    },
    handleRelease(row) {
      const dialogInstance = this.$dialog.confirm({
        header: this.$t('page.hostguard.confirm_release_title'),
        body: this.$t('page.hostguard.confirm_release_body', { ip: row.ip }),
        onConfirm: () =>
          wafHostGuardBanReleaseApi({ id: row.id })
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
    handlePermanent(row) {
      const dialogInstance = this.$dialog.confirm({
        header: this.$t('page.hostguard.confirm_permanent_title'),
        body: this.$t('page.hostguard.confirm_permanent_body', { ip: row.ip }),
        onConfirm: () =>
          wafHostGuardBanPermanentApi({ id: row.id })
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
    handleWhitelist(row) {
      const ip = row.ip;
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
.remain-permanent {
  color: #d54941;
  font-weight: 600;
}
.op-disabled {
  color: var(--td-text-color-placeholder);
}
</style>
