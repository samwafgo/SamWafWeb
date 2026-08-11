<template>
  <div>
    <t-alert theme="info" :message="$t('page.threatip.landed_tip')" close style="margin-bottom: 12px;" />
    <t-table
      :columns="columns"
      :data="data"
      rowKey="code"
      verticalAlign="top"
      :hover="true"
      :loading="loading">
      <template #land_target="{ row }">
        <span>{{ landTargetLabel(row.land_target) }}</span>
      </template>
      <template #enable="{ row }">
        <t-tag v-if="row.enable === 1" theme="success" variant="light">{{ $t('page.threatip.enabled') }}</t-tag>
        <t-tag v-else theme="default" variant="light">{{ $t('page.threatip.disabled') }}</t-tag>
      </template>
      <template #count="{ row }">
        <t-tag :theme="row.enable === 1 ? 'primary' : 'default'" variant="light">{{ row.count }}</t-tag>
        <span v-if="row.enable !== 1 && row.snapshot_count > 0" class="snapshot-hint">
          {{ $t('page.threatip.snapshot_hint', { count: row.snapshot_count }) }}
        </span>
      </template>
      <template #last_sync_at="{ row }">
        <span>{{ formatTs(row.last_sync_at) }}</span>
      </template>
      <template #op="{ row }">
        <a class="t-button-link" @click="handleViewIPs(row)">{{ $t('page.threatip.view_ips') }}</a>
      </template>
    </t-table>

    <!-- 某渠道落地 IP 只读浏览 -->
    <t-dialog :header="ipDialogTitle" :visible.sync="ipDialogVisible" :width="640" :footer="false">
      <div slot="body">
        <t-form :data="ipSearch" layout="inline" colon :style="{ marginBottom: '8px' }">
          <t-form-item :label="'IP'" name="keyword">
            <t-input v-model="ipSearch.keyword" clearable :style="{ width: '260px' }"
              :placeholder="$t('page.threatip.view_ips_search_tip')" @enter="reloadIPs" />
          </t-form-item>
          <t-form-item>
            <t-button theme="primary" @click="reloadIPs">{{ $t('common.search') }}</t-button>
          </t-form-item>
        </t-form>
        <t-table
          :columns="ipColumns"
          :data="ipData"
          rowKey="ip"
          verticalAlign="top"
          :hover="true"
          :pagination="ipPagination"
          :loading="ipLoading"
          @page-change="onIPPageChange">
          <template #ip="{ row }">
            <t-tooltip :content="$t('common.ip_lookup.click_tip')">
              <a class="ipl-link" @click="openIpLookup(row.ip)">{{ row.ip }}</a>
            </t-tooltip>
          </template>
        </t-table>
        <!-- 列表里是网段，点了按其中一个代表IP查，弹窗会说明查的是哪个 -->
        <ip-lookup ref="ipLookup" hide-trigger />
      </div>
    </t-dialog>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import { wafThreatIPLandedSummaryApi, wafThreatIPLandedIPsApi } from '@/apis/threatip';

  export default Vue.extend({
    name: 'ThreatSubSourcePanel',
    props: {
      // system | waf : 只展示落地到该层的渠道
      land: { type: String, default: '' },
    },
    data() {
      return {
        loading: false,
        data: [],
        landOptions: [
          { value: 'waf', label: this.$t('page.threatip.land_waf') },
          { value: 'system', label: this.$t('page.threatip.land_system') },
          { value: 'both', label: this.$t('page.threatip.land_both') },
        ],
        columns: [
          { title: this.$t('page.threatip.label_name'), align: 'left', width: 160, ellipsis: true, colKey: 'name' },
          { title: this.$t('page.threatip.label_code'), width: 120, ellipsis: true, colKey: 'code' },
          { title: this.$t('page.threatip.label_land'), width: 100, colKey: 'land_target' },
          { title: this.$t('page.threatip.label_enable'), width: 90, colKey: 'enable' },
          { title: this.$t('page.threatip.landed_count'), width: 190, colKey: 'count' },
          { title: this.$t('page.threatip.last_status'), align: 'left', ellipsis: true, colKey: 'last_status' },
          { title: this.$t('page.threatip.last_sync_at'), width: 170, colKey: 'last_sync_at' },
          { align: 'left', width: 100, colKey: 'op', title: this.$t('common.op') },
        ],
        // IP 浏览弹窗
        ipDialogVisible: false,
        ipDialogTitle: '',
        ipChannelCode: '',
        ipSearch: { keyword: '' },
        ipLoading: false,
        ipData: [],
        ipPagination: { total: 0, current: 1, pageSize: 10 },
        ipColumns: [
          { title: 'IP / CIDR', align: 'left', colKey: 'ip', cell: 'ip' },
        ],
      };
    },
    mounted() {
      this.loadSummary();
    },
    methods: {
    // 列表里点某条网段/IP，直接开归属查询；网段会由后端取代表IP并说明
    openIpLookup(ip) {
      if (!ip) return;
      this.$refs.ipLookup && this.$refs.ipLookup.open(ip);
    },
      landTargetLabel(v) {
        const found = this.landOptions.find((o) => o.value === v);
        return found ? found.label : v;
      },
      formatTs(ts) {
        if (!ts) return '-';
        const d = new Date(ts * 1000);
        return d.toLocaleString();
      },
      loadSummary() {
        this.loading = true;
        wafThreatIPLandedSummaryApi({ land: this.land })
          .then((res) => {
            if (res.code === 0) {
              this.data = res.data ?? [];
            }
          })
          .catch((e: Error) => { console.log(e); })
          .finally(() => { this.loading = false; });
      },
      handleViewIPs(row) {
        this.ipChannelCode = row.code;
        this.ipDialogTitle = row.name + ' (' + row.code + ')';
        this.ipSearch.keyword = '';
        this.ipPagination.current = 1;
        this.ipDialogVisible = true;
        this.loadIPs();
      },
      reloadIPs() {
        this.ipPagination.current = 1;
        this.loadIPs();
      },
      loadIPs() {
        this.ipLoading = true;
        wafThreatIPLandedIPsApi({
          code: this.ipChannelCode,
          keyword: this.ipSearch.keyword,
          pageIndex: this.ipPagination.current,
          pageSize: this.ipPagination.pageSize,
        })
          .then((res) => {
            if (res.code === 0) {
              const list = res.data.list ?? [];
              this.ipData = list.map((ip) => ({ ip }));
              this.ipPagination = { ...this.ipPagination, total: res.data.total };
            }
          })
          .catch((e: Error) => { console.log(e); })
          .finally(() => { this.ipLoading = false; });
      },
      onIPPageChange(curr) {
        this.ipPagination.current = curr.current;
        if (this.ipPagination.pageSize != curr.pageSize) {
          this.ipPagination.current = 1;
          this.ipPagination.pageSize = curr.pageSize;
        }
        this.loadIPs();
      },
      // 供父页切换到本 Tab 时主动刷新
      refresh() {
        this.loadSummary();
      },
    },
  });
</script>

<style lang="less" scoped>
  .snapshot-hint {
    margin-left: 6px;
    font-size: 12px;
    color: var(--td-text-color-placeholder);
  }

.ipl-link {
  color: var(--td-brand-color);
  cursor: pointer;
}

.ipl-link:hover {
  color: var(--td-brand-color-hover);
  text-decoration: underline;
}
</style>
