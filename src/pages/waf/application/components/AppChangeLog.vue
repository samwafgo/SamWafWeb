<template>
  <div>
    <t-table
      :data="list"
      :columns="columns"
      row-key="id"
      size="small"
      :loading="loading"
      :pagination="pagination"
      @page-change="handlePageChange"
    >
      <template #changes="{ row }">
        <template v-if="parseChanges(row.changes).length > 0">
          <div v-for="(c, i) in parseChanges(row.changes)" :key="i" style="font-size:12px;line-height:1.6">
            <span style="color:#666">{{ c.label }}：</span>
            <span v-if="c.old" style="text-decoration:line-through;color:#999;margin-right:4px">{{ truncate(c.old) }}</span>
            <span style="color:#0052d9">{{ truncate(c.new || c.old) }}</span>
          </div>
        </template>
        <span v-else style="color:#999">—</span>
      </template>
    </t-table>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { wafAppChangeLogsApi } from '@/apis/application';

export default Vue.extend({
  name: 'AppChangeLog',
  props: { appCode: { type: String, default: '' } },
  data() {
    return {
      loading: false,
      list: [] as any[],
      pagination: { total: 0, pageSize: 10, current: 1 },
      columns: [
        { colKey: 'create_time', title: '时间',    width: 160,
          cell: (h: any, { row }: any) => (row.create_time || '').toString().slice(0, 19) },
        { colKey: 'op_type',    title: '操作',    width: 70 },
        { colKey: 'operator',   title: '操作者',  width: 100 },
        { colKey: 'operator_ip',title: 'IP',      width: 130 },
        { colKey: 'changes',    title: '变更内容', cell: 'changes' },
      ],
    };
  },
  watch: {
    appCode(v) { if (v) this.loadList(); },
  },
  mounted() {
    if (this.appCode) this.loadList();
  },
  methods: {
    loadList() {
      this.loading = true;
      wafAppChangeLogsApi({
        code: this.appCode,
        pageIndex: this.pagination.current,
        pageSize: this.pagination.pageSize,
      }).then(res => {
        if (res && res.code === 0) {
          this.list = res.data.list || [];
          this.pagination.total = res.data.total || 0;
        }
      }).finally(() => { this.loading = false; });
    },
    handlePageChange(curr: any) {
      this.pagination.current = curr.current;
      this.pagination.pageSize = curr.pageSize;
      this.loadList();
    },
    parseChanges(str: string): any[] {
      try { return JSON.parse(str) || []; } catch { return []; }
    },
    truncate(s: string, len = 40): string {
      if (!s) return '';
      return s.length > len ? s.slice(0, len) + '…' : s;
    },
  },
});
</script>
