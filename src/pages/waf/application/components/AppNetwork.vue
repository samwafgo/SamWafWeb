<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <span style="font-size:12px;color:#999">
        <span v-if="result && result.cached_at">{{ $t('page.application.net_cached_at') }}{{ result.cached_at }}</span>
        <span v-if="result && result.pids && result.pids.length > 1" style="margin-left:12px">
          PIDs: {{ result.pids.join(', ') }}
        </span>
      </span>
      <t-button size="small" :loading="loading" @click="load">{{ $t('common.refresh') }}</t-button>
    </div>

    <t-divider>{{ $t('page.application.net_ports') }}</t-divider>
    <t-table :data="ports" :columns="portColumns" row-key="local_addr" size="small"
      :empty="$t('page.application.net_no_ports')">
    </t-table>

    <t-divider>
      {{ $t('page.application.net_connections') }}
      <span v-if="connSummaryAll.length > 0" style="font-size:12px;font-weight:normal;color:#999;margin-left:8px">
        {{ connSummaryAll.length }} IP
      </span>
    </t-divider>
    <t-alert v-if="result && result.connections && result.connections.length >= 1000"
      theme="warning" :message="$t('page.application.net_conn_limit')" style="margin-bottom:8px" />
    <t-table
      :data="connPageData"
      :columns="connColumns"
      row-key="remote_ip"
      size="small"
      :pagination="connPagination"
      @page-change="onConnPageChange"
      :empty="$t('page.application.net_no_connections')"
    >
    </t-table>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { wafAppNetStatsApi } from '@/apis/application';

function parsePort(addr: string): number {
  if (!addr) return 0;
  const lastColon = addr.lastIndexOf(':');
  if (lastColon < 0) return 0;
  return parseInt(addr.slice(lastColon + 1), 10) || 0;
}

export default Vue.extend({
  name: 'AppNetwork',
  props: { appCode: { type: String, default: '' } },
  data() {
    return {
      loading: false,
      result: null as any,
      connCurrentPage: 1,
      connPageSize: 20,
      portColumns: [
        { colKey: 'protocol', title: this.$t('page.application.net_protocol'), width: 80 },
        { colKey: 'local_addr', title: this.$t('page.application.net_local_addr'), ellipsis: true },
        { colKey: 'port', title: this.$t('page.application.net_port'), width: 80 },
        { colKey: 'pid', title: 'PID', width: 80 },
      ],
      connColumns: [
        { colKey: 'remote_ip', title: this.$t('page.application.net_remote_ip'), ellipsis: true },
        { colKey: 'count', title: this.$t('page.application.net_conn_count'), width: 100 },
        { colKey: 'local_ports', title: this.$t('page.application.net_local_ports'), ellipsis: true },
      ],
    };
  },
  computed: {
    ports(): any[] {
      return (this.result && this.result.ports) ? this.result.ports : [];
    },
    connSummaryAll(): any[] {
      const rawConns: any[] = (this.result && this.result.connections) ? this.result.connections : [];
      const map: Record<string, { remote_ip: string; count: number; portSet: Set<number> }> = {};
      for (const c of rawConns) {
        const ip = c.remote_ip || c.remote_addr || '';
        if (!ip) continue;
        if (!map[ip]) {
          map[ip] = { remote_ip: ip, count: 0, portSet: new Set() };
        }
        map[ip].count++;
        const port = parsePort(c.local_addr);
        if (port) map[ip].portSet.add(port);
      }
      return Object.values(map)
        .map((v) => ({
          remote_ip: v.remote_ip,
          count: v.count,
          local_ports: Array.from(v.portSet).join(', '),
        }))
        .sort((a, b) => b.count - a.count);
    },
    connPageData(): any[] {
      const start = (this.connCurrentPage - 1) * this.connPageSize;
      return this.connSummaryAll.slice(start, start + this.connPageSize);
    },
    connPagination(): object {
      return {
        current: this.connCurrentPage,
        pageSize: this.connPageSize,
        total: this.connSummaryAll.length,
      };
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    load() {
      if (!this.appCode) return;
      this.loading = true;
      this.connCurrentPage = 1;
      wafAppNetStatsApi({ code: this.appCode })
        .then((res) => {
          if (res && res.code === 0) {
            this.result = res.data;
          }
        })
        .finally(() => {
          this.loading = false;
        });
    },
    onConnPageChange(curr: any) {
      this.connCurrentPage = curr.current;
      this.connPageSize = curr.pageSize;
    },
  },
});
</script>

<style scoped>
</style>
