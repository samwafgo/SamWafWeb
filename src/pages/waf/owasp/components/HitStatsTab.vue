<template>
  <div>
    <!-- 工具栏 -->
    <div class="stats-toolbar">
      <div class="stats-toolbar-left">
        <t-alert theme="info" :message="$t('page.owasp.hit_stats.alert')" style="flex:1" />
      </div>
      <div class="stats-toolbar-right">
        <span class="rule-count-hint">{{ $t('page.owasp.hit_stats.rule_count', { n: ruleCount }) }}</span>
        <t-select v-model="sortMode" style="width:140px;margin-left:12px" @change="loadData">
          <t-option value="all" :label="$t('page.owasp.hit_stats.sort_all')" />
          <t-option value="blocked" :label="$t('page.owasp.hit_stats.sort_blocked')" />
          <t-option value="detected" :label="$t('page.owasp.hit_stats.sort_detected')" />
        </t-select>
        <t-input-number
          v-model="limit"
          :min="10"
          :max="500"
          style="width:100px;margin-left:8px"
          @blur="loadData"
          @enter="loadData"
        />
        <t-button variant="outline" style="margin-left:8px" @click="loadData">
          {{ $t('common.refresh') }}
        </t-button>
        <t-popconfirm
          :content="$t('page.owasp.hit_stats.reset_confirm')"
          @confirm="onReset"
        >
          <t-button theme="danger" variant="outline" style="margin-left:8px">
            {{ $t('page.owasp.hit_stats.reset') }}
          </t-button>
        </t-popconfirm>
      </div>
    </div>

    <!-- 合计卡片 -->
    <div class="summary-cards">
      <t-card class="summary-card" size="small" :bordered="true">
        <div class="summary-label">{{ $t('page.owasp.hit_stats.total_blocked') }}</div>
        <div class="summary-value danger">{{ totalBlocked }}</div>
      </t-card>
      <t-card class="summary-card" size="small" :bordered="true">
        <div class="summary-label">{{ $t('page.owasp.hit_stats.total_detected') }}</div>
        <div class="summary-value warning">{{ totalDetected }}</div>
      </t-card>
      <t-card class="summary-card" size="small" :bordered="true">
        <div class="summary-label">{{ $t('page.owasp.hit_stats.top_rule') }}</div>
        <div class="summary-value primary">{{ topRuleId || '-' }}</div>
      </t-card>
    </div>

    <!-- 命中规则表 -->
    <t-table
      :columns="columns"
      :data="list"
      rowKey="rule_id"
      :loading="loading"
      :empty="$t('page.owasp.hit_stats.empty')"
      verticalAlign="middle"
      hover
      stripe
    >
      <template #rank="{ rowIndex }">
        <span :class="['rank-badge', rankClass(rowIndex + 1)]">{{ rowIndex + 1 }}</span>
      </template>

      <template #rule_id="{ row }">
        <a class="rule-id-link" @click="$emit('go-rule', row.rule_id)">{{ row.rule_id }}</a>
      </template>

      <template #severity="{ row }">
        <t-tag v-if="row.severity" :theme="severityTheme(row.severity)" variant="light" size="small">
          {{ row.severity }}
        </t-tag>
        <span v-else style="color:var(--td-text-color-placeholder)">-</span>
      </template>

      <template #total_hits="{ row }">
        <div class="hits-cell">
          <span class="hits-num">{{ row.total_hits }}</span>
          <t-progress
            :percentage="maxHits > 0 ? Math.round(row.total_hits / maxHits * 100) : 0"
            :color="progressColor(row)"
            size="small"
            :label="false"
            style="width:80px;display:inline-block;margin-left:8px;vertical-align:middle"
          />
        </div>
      </template>

      <template #blocked_hits="{ row }">
        <span :class="row.blocked_hits > 0 ? 'hits-danger' : 'hits-zero'">
          {{ row.blocked_hits }}
        </span>
      </template>

      <template #detected_hits="{ row }">
        <span :class="row.detected_hits > 0 ? 'hits-warning' : 'hits-zero'">
          {{ row.detected_hits }}
        </span>
      </template>

      <template #op="{ row }">
        <a class="t-button-link" @click="$emit('go-rule', row.rule_id)">
          {{ $t('page.owasp.hit_stats.op_view') }}
        </a>
      </template>
    </t-table>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { owaspHitStatsApi, owaspHitStatsResetApi } from '@/apis/owasp';
import { MessagePlugin } from 'tdesign-vue';

export default Vue.extend({
  name: 'OwaspHitStatsTab',
  emits: ['go-rule'],
  data() {
    return {
      loading: false,
      list: [] as any[],
      ruleCount: 0,
      sortMode: 'all',
      limit: 50,
      columns: [
        { colKey: 'rank', title: '#', width: 52, fixed: 'left' },
        { colKey: 'rule_id', title: 'Rule ID', width: 100 },
        { colKey: 'severity', title: this.$t('page.owasp.hit_stats.col_severity'), width: 110 },
        { colKey: 'message', title: this.$t('page.owasp.hit_stats.col_message'), ellipsis: true, minWidth: 180 },
        { colKey: 'total_hits', title: this.$t('page.owasp.hit_stats.col_total'), width: 200 },
        { colKey: 'blocked_hits', title: this.$t('page.owasp.hit_stats.col_blocked'), width: 110 },
        { colKey: 'detected_hits', title: this.$t('page.owasp.hit_stats.col_detected'), width: 110 },
        { colKey: 'last_seen_at', title: this.$t('page.owasp.hit_stats.col_last_seen'), width: 170 },
        { colKey: 'op', title: this.$t('common.operation'), width: 80, fixed: 'right' },
      ],
    };
  },
  computed: {
    maxHits(): number {
      if (!this.list.length) return 0;
      return (this.list[0] as any).total_hits || 0;
    },
    totalBlocked(): number {
      return (this.list as any[]).reduce((s, r) => s + (r.blocked_hits || 0), 0);
    },
    totalDetected(): number {
      return (this.list as any[]).reduce((s, r) => s + (r.detected_hits || 0), 0);
    },
    topRuleId(): number | null {
      return this.list.length ? (this.list[0] as any).rule_id : null;
    },
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const res: any = await owaspHitStatsApi({ limit: this.limit, mode: this.sortMode });
        if (res.code === 0 && res.data) {
          this.list = res.data.list || [];
          this.ruleCount = res.data.rule_count || 0;
        }
      } finally {
        this.loading = false;
      }
    },
    async onReset() {
      try {
        await owaspHitStatsResetApi();
        MessagePlugin.success(this.$t('page.owasp.hit_stats.reset_ok') as string);
        this.list = [];
        this.ruleCount = 0;
      } catch {
        MessagePlugin.error(this.$t('common.failed') as string);
      }
    },
    severityTheme(sev: string) {
      const m: Record<string, string> = {
        CRITICAL: 'danger', ERROR: 'warning', WARNING: 'primary', NOTICE: 'default',
      };
      return m[sev?.toUpperCase()] || 'default';
    },
    progressColor(row: any) {
      if (row.blocked_hits > 0) return '#e34d59';
      if (row.detected_hits > 0) return '#ed7b2f';
      return '#0052d9';
    },
    rankClass(rank: number) {
      if (rank === 1) return 'rank-1';
      if (rank === 2) return 'rank-2';
      if (rank === 3) return 'rank-3';
      return '';
    },
  },
});
</script>

<style lang="less" scoped>
.stats-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;

  &-left { flex: 1; min-width: 0; }
  &-right {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
}

.rule-count-hint {
  color: var(--td-text-color-secondary);
  font-size: 13px;
  white-space: nowrap;
}

.summary-cards {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.summary-card {
  flex: 1;
  text-align: center;
  .summary-label {
    font-size: 12px;
    color: var(--td-text-color-secondary);
    margin-bottom: 4px;
  }
  .summary-value {
    font-size: 24px;
    font-weight: 600;
    &.danger  { color: var(--td-error-color); }
    &.warning { color: var(--td-warning-color); }
    &.primary { color: var(--td-brand-color); }
  }
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  background: var(--td-bg-color-component);
  color: var(--td-text-color-secondary);
  &.rank-1 { background: #f5a623; color: #fff; }
  &.rank-2 { background: #9b9b9b; color: #fff; }
  &.rank-3 { background: #c57537; color: #fff; }
}

.rule-id-link {
  color: var(--td-brand-color);
  cursor: pointer;
  font-weight: 600;
  &:hover { text-decoration: underline; }
}

.hits-cell {
  display: flex;
  align-items: center;
  .hits-num { font-weight: 600; min-width: 40px; }
}

.hits-danger { color: var(--td-error-color); font-weight: 600; }
.hits-warning { color: var(--td-warning-color); font-weight: 600; }
.hits-zero { color: var(--td-text-color-placeholder); }
</style>
