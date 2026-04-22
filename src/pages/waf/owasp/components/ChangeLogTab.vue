<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <t-alert
        theme="info"
        :message="$t('page.owasp.changelog.hint')"
        style="flex:1;margin-right:12px"
      />
      <t-button variant="outline" @click="loadData">{{ $t('page.owasp.changelog.refresh') }}</t-button>
    </div>

    <t-table
      :columns="columns"
      :data="entries"
      rowKey="uid"
      :loading="loading"
      :empty="$t('page.owasp.changelog.empty')"
      :pagination="pagination"
      verticalAlign="top"
      hover
      @page-change="onPageChange"
    >
      <template #action="{ row }">
        <t-tag :theme="actionTheme(row.action)" variant="light" size="small">
          {{ actionLabel(row.action) }}
        </t-tag>
      </template>
      <template #rule_id="{ row }">
        <span v-if="row.rule_id">
          <a class="rule-link" @click="goToRule(row.rule_id)">{{ row.rule_id }}</a>
        </span>
        <span v-else style="color:var(--td-text-color-placeholder)">-</span>
      </template>
      <template #source_file="{ row }">
        <t-tooltip v-if="row.source_file" :content="row.source_file" placement="top">
          <span class="file-cell">{{ shortFile(row.source_file) }}</span>
        </t-tooltip>
        <span v-else style="color:var(--td-text-color-placeholder)">-</span>
      </template>
    </t-table>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { owaspAuditLogApi } from '@/apis/owasp';

export default Vue.extend({
  name: 'OwaspChangeLogTab',
  data() {
    return {
      loading: false,
      allEntries: [] as any[],
      entries: [] as any[],
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
        showJumper: true,
        pageSizeOptions: [20, 50, 100],
      },
      columns: [
        {
          title: this.$t('page.owasp.changelog.col_time'),
          colKey: 'time',
          width: 180,
          cell: (_: any, { row }: any) => this.formatTime(row.time),
        },
        {
          title: this.$t('page.owasp.changelog.col_action'),
          colKey: 'action',
          width: 100,
        },
        {
          title: this.$t('page.owasp.changelog.col_rule_id'),
          colKey: 'rule_id',
          width: 110,
        },
        {
          title: this.$t('page.owasp.changelog.col_source_file'),
          colKey: 'source_file',
          ellipsis: true,
        },
        {
          title: this.$t('page.owasp.changelog.col_note'),
          colKey: 'note',
          ellipsis: true,
        },
      ],
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    loadData() {
      this.loading = true;
      owaspAuditLogApi()
        .then((res: any) => {
          if (res.code === 0 && res.data) {
            const list = (res.data.entries || []).map((e: any, i: number) => ({ ...e, uid: i }));
            this.allEntries = list;
            this.pagination.total = list.length;
            this.pagination.current = 1;
            this.updatePage();
          } else {
            this.$message.warning(res.msg || '加载失败');
          }
        })
        .catch(() => { this.$message.error('请求失败'); })
        .finally(() => { this.loading = false; });
    },
    updatePage() {
      const { current, pageSize } = this.pagination;
      const start = (current - 1) * pageSize;
      this.entries = this.allEntries.slice(start, start + pageSize);
    },
    onPageChange(pageInfo: any) {
      this.pagination.current = pageInfo.current;
      this.pagination.pageSize = pageInfo.pageSize;
      this.updatePage();
    },
    actionLabel(action: string): string {
      const map: Record<string, string> = {
        disabled: this.$t('page.owasp.changelog.action_disabled'),
        enabled:  this.$t('page.owasp.changelog.action_enabled'),
        modified: this.$t('page.owasp.changelog.action_modified'),
        reset:    this.$t('page.owasp.changelog.action_reset'),
        tuning:   this.$t('page.owasp.changelog.action_tuning'),
      };
      return map[action] || action;
    },
    actionTheme(action: string): string {
      if (action === 'disabled') return 'danger';
      if (action === 'enabled') return 'success';
      if (action === 'modified') return 'warning';
      if (action === 'reset') return 'default';
      if (action === 'tuning') return 'primary';
      return 'default';
    },
    formatTime(t: string): string {
      if (!t) return '-';
      try {
        return new Date(t).toLocaleString('zh-CN', { hour12: false });
      } catch {
        return t;
      }
    },
    shortFile(f: string): string {
      if (!f) return '-';
      const parts = f.replace(/\\/g, '/').split('/');
      return parts[parts.length - 1] || f;
    },
    goToRule(ruleId: number) {
      this.$emit('go-rule', ruleId);
    },
  },
});
</script>

<style lang="less" scoped>
.rule-link {
  color: var(--td-brand-color);
  cursor: pointer;
  text-decoration: none;
  &:hover { text-decoration: underline; }
}
.file-cell {
  font-family: monospace;
  font-size: 12px;
  cursor: help;
}
</style>
