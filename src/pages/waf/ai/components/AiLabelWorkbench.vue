<template>
  <div>
    <t-alert theme="info" :message="$t('page.ai.workbench.intro')" style="margin-bottom: 12px" />

    <!-- 过滤条件 -->
    <t-space style="margin-bottom: 12px" align="center" break-line>
      <span>{{ $t('page.ai.workbench.host') }}:</span>
      <t-select v-model="filter.host_code" :placeholder="$t('page.ai.workbench.host_all')" clearable style="width: 180px">
        <t-option v-for="h in hostOptions" :key="h.value" :value="h.value" :label="h.label" />
      </t-select>
      <span>{{ $t('common.date') }}:</span>
      <t-date-range-picker v-model="range" clearable />
      <span>{{ $t('page.ai.workbench.mark_status') }}:</span>
      <t-select v-model="filter.mark_status" style="width: 130px">
        <t-option value="" :label="$t('page.ai.workbench.status_all')" />
        <t-option value="unmarked" :label="$t('page.ai.workbench.status_unmarked')" />
        <t-option value="marked" :label="$t('page.ai.workbench.status_marked')" />
        <t-option value="normal" :label="$t('page.ai.workbench.status_normal')" />
        <t-option value="attack" :label="$t('page.ai.workbench.status_attack')" />
        <t-option value="ignore" :label="$t('page.ai.workbench.status_ignore')" />
      </t-select>
      <span>{{ $t('page.ai.workbench.min_score') }}:</span>
      <t-input-number v-model="filter.min_score" :min="0" :max="1" :step="0.1" :decimal-places="2" style="width: 120px" />
      <t-button theme="primary" :loading="loading" @click="search">{{ $t('page.ai.workbench.query') }}</t-button>
      <t-button theme="default" @click="reset">{{ $t('page.ai.workbench.reset') }}</t-button>
    </t-space>

    <!-- 批量操作栏 -->
    <t-space style="margin-bottom: 12px" align="center" break-line>
      <span>{{ $t('page.ai.workbench.selected', { n: selectedRowKeys.length }) }}</span>
      <t-button theme="success" variant="outline" :disabled="!selectedRowKeys.length" @click="batchMark('normal')">
        {{ $t('page.ai.workbench.batch_normal') }}
      </t-button>
      <t-button theme="danger" variant="outline" :disabled="!selectedRowKeys.length" @click="openBatchAttack">
        {{ $t('page.ai.workbench.batch_attack') }}
      </t-button>
      <t-button theme="warning" variant="outline" :disabled="!selectedRowKeys.length" @click="batchMark('ignore')">
        {{ $t('page.ai.workbench.batch_ignore') }}
      </t-button>
      <t-button theme="default" :disabled="!selectedRowKeys.length" @click="batchUnmark">
        {{ $t('page.ai.workbench.batch_unmark') }}
      </t-button>
    </t-space>

    <t-table
      row-key="req_uuid"
      :data="rows"
      :columns="columns"
      :loading="loading"
      :selected-row-keys="selectedRowKeys"
      :pagination="pagination"
      :reserve-selected-row-on-paginate="true"
      hover
      size="small"
      @select-change="onSelectChange"
      @page-change="onPageChange"
    >
      <template #ai_score="{ row }">
        <t-tag :theme="scoreTheme(row.ai_score)" variant="light">{{ row.ai_score.toFixed(3) }}</t-tag>
      </template>
      <template #category="{ row }">
        {{ catFromRule(row.rule) }}
      </template>
      <template #log_only_mode="{ row }">
        <t-tag v-if="row.log_only_mode === 1" theme="warning" variant="light">{{ $t('page.ai.workbench.mode_observe') }}</t-tag>
        <t-tag v-else theme="danger" variant="light">{{ $t('page.ai.workbench.mode_block') }}</t-tag>
      </template>
      <!-- 安全：URL 为攻击者可控内容，用 {{ }} 文本插值；t-tooltip 的 content 传字符串按文本渲染。严禁改 v-html。 -->
      <template #url="{ row }">
        <t-tooltip :content="row.url" :show-arrow="false">
          <span class="ellipsis-url">{{ row.url }}</span>
        </t-tooltip>
      </template>
      <template #mark="{ row }">
        <t-tag v-if="row.mark === 'normal'" theme="success" variant="light">{{ $t('page.visit_log.ai_mark_normal') }}</t-tag>
        <t-tag v-else-if="row.mark === 'attack'" theme="danger" variant="light">{{ markAttackText(row) }}</t-tag>
        <t-tag v-else-if="row.mark === 'ignore'" theme="default" variant="light">{{ $t('page.visit_log.ai_mark_ignore') }}</t-tag>
        <span v-else class="muted">{{ $t('page.ai.workbench.unmarked') }}</span>
      </template>
      <template #op="{ row }">
        <t-link theme="primary" hover="color" @click="openDetail(row)">{{ $t('page.ai.workbench.view') }}</t-link>
      </template>
    </t-table>

    <!-- 批量确认攻击：选类别 -->
    <t-dialog
      :visible.sync="batchAttackVisible"
      :header="$t('page.ai.workbench.confirm_attack_title')"
      width="460px"
      @confirm="confirmBatchAttack"
    >
      <t-space direction="vertical" style="width: 100%">
        <t-alert theme="info" :message="$t('page.ai.workbench.confirm_attack_tip')" />
        <div>
          <span style="margin-right: 8px">{{ $t('page.ai.workbench.attack_category') }}:</span>
          <t-select v-model="batchAttackType" :options="aiCatSelectOptions" style="width: 240px" />
        </div>
      </t-space>
    </t-dialog>

    <!-- 详情抽屉 + 单条标注 -->
    <t-drawer
      :visible.sync="detailVisible"
      :header="$t('page.ai.workbench.detail_title')"
      size="560px"
      :footer="false"
      @close="onDetailClose"
    >
      <template v-if="detailRow">
        <t-descriptions :column="1" bordered size="small">
          <t-descriptions-item :label="$t('page.ai.workbench.col_time')">{{ detailRow.create_time }}</t-descriptions-item>
          <t-descriptions-item :label="$t('page.ai.workbench.col_ip')">{{ detailRow.src_ip }}</t-descriptions-item>
          <t-descriptions-item :label="$t('page.ai.workbench.col_score')">{{ detailRow.ai_score.toFixed(3) }}</t-descriptions-item>
          <t-descriptions-item :label="$t('page.ai.workbench.col_category')">{{ catFromRule(detailRow.rule) }}</t-descriptions-item>
          <t-descriptions-item :label="$t('page.ai.workbench.col_method')">{{ detailRow.method }}</t-descriptions-item>
          <t-descriptions-item :label="$t('page.ai.workbench.col_url')">
            <div class="break-all">{{ detailRow.url }}</div>
          </t-descriptions-item>
        </t-descriptions>

        <!-- 安全红线：以下展示的是攻击者可控的原始请求内容(query/body/UA)。
             必须用 {{ }} 文本插值（Vue 自动 HTML 转义，按纯文本渲染，payload 不会执行）。
             严禁改成 v-html / innerHTML / domProps.innerHTML，否则将造成存储型 XSS。 -->
        <div class="detail-block">
          <div class="detail-label">{{ $t('page.ai.workbench.detail_query') }}</div>
          <pre class="detail-pre">{{ detailRow.raw_query || $t('page.ai.workbench.detail_empty') }}</pre>
        </div>
        <div class="detail-block">
          <div class="detail-label">{{ $t('page.ai.workbench.detail_body') }}</div>
          <pre class="detail-pre">{{ detailRow.body || $t('page.ai.workbench.detail_empty') }}</pre>
        </div>
        <div class="detail-block">
          <div class="detail-label">{{ $t('page.ai.workbench.detail_ua') }}</div>
          <pre class="detail-pre">{{ detailRow.user_agent || $t('page.ai.workbench.detail_empty') }}</pre>
        </div>

        <t-divider />
        <div class="detail-block">
          <div class="detail-label">{{ $t('page.ai.workbench.mark_as') }}</div>
          <t-space align="center" break-line>
            <t-button theme="success" variant="outline" @click="markOne('normal')">
              1 · {{ $t('page.visit_log.ai_mark_normal') }}
            </t-button>
            <t-button theme="danger" variant="outline" @click="markOne('attack')">
              2 · {{ $t('page.visit_log.ai_mark_attack') }}
            </t-button>
            <t-button theme="warning" variant="outline" @click="markOne('ignore')">
              3 · {{ $t('page.visit_log.ai_mark_ignore') }}
            </t-button>
            <t-button v-if="detailRow.mark" theme="default" @click="unmarkOne">
              {{ $t('page.visit_log.ai_mark_unmark') }}
            </t-button>
          </t-space>
          <div style="margin-top: 8px">
            <span style="margin-right: 8px">{{ $t('page.ai.workbench.attack_category') }}:</span>
            <t-select v-model="detailAttackType" :options="aiCatSelectOptions" style="width: 220px" />
          </div>
          <t-alert theme="info" :message="$t('page.ai.workbench.kbd_hint')" style="margin-top: 10px" />
        </div>
      </template>
    </t-drawer>
  </div>
</template>

<script>
import { MessagePlugin } from 'tdesign-vue';
import { allhost } from '@/apis/host';
import { aiLabelListApi, aiBatchMarkApi, aiBatchUnmarkApi } from '@/apis/ai';

export default {
  name: 'AiLabelWorkbench',
  data() {
    return {
      loading: false,
      range: [],
      hostOptions: [],
      filter: { host_code: '', mark_status: '', min_score: 0 },
      rows: [],
      selectedRowKeys: [],
      pagination: { current: 1, pageSize: 20, total: 0, showJumper: true },
      // 批量确认攻击
      batchAttackVisible: false,
      batchAttackType: '',
      // 详情抽屉
      detailVisible: false,
      detailRow: null,
      detailAttackType: '',
    };
  },
  computed: {
    columns() {
      return [
        { colKey: 'row-select', type: 'multiple', width: 46 },
        { colKey: 'create_time', title: this.$t('page.ai.workbench.col_time'), width: 160, ellipsis: true },
        { colKey: 'src_ip', title: this.$t('page.ai.workbench.col_ip'), width: 130, ellipsis: true },
        { colKey: 'method', title: this.$t('page.ai.workbench.col_method'), width: 80 },
        { colKey: 'url', title: this.$t('page.ai.workbench.col_url'), minWidth: 220 },
        { colKey: 'ai_score', title: this.$t('page.ai.workbench.col_score'), width: 90 },
        { colKey: 'category', title: this.$t('page.ai.workbench.col_category'), width: 110, ellipsis: true },
        { colKey: 'log_only_mode', title: this.$t('page.ai.workbench.col_mode'), width: 80 },
        { colKey: 'mark', title: this.$t('page.ai.workbench.col_mark'), width: 120 },
        { colKey: 'op', title: this.$t('page.ai.workbench.col_op'), width: 80, fixed: 'right' },
      ];
    },
    aiCatSelectOptions() {
      return [
        { label: this.$t('page.visit_log.ai_cat_auto'), value: '' },
        { label: this.$t('page.visit_log.ai_cat_sqli'), value: 'sqli' },
        { label: this.$t('page.visit_log.ai_cat_xss'), value: 'xss' },
        { label: this.$t('page.visit_log.ai_cat_rce'), value: 'rce' },
        { label: this.$t('page.visit_log.ai_cat_traversal'), value: 'traversal' },
        { label: this.$t('page.visit_log.ai_cat_inject'), value: 'inject' },
        { label: this.$t('page.visit_log.ai_cat_scan'), value: 'scan' },
        { label: this.$t('page.visit_log.ai_cat_other'), value: 'other' },
      ];
    },
    aiCatLabels() {
      return {
        sqli: this.$t('page.visit_log.ai_cat_sqli'),
        xss: this.$t('page.visit_log.ai_cat_xss'),
        rce: this.$t('page.visit_log.ai_cat_rce'),
        traversal: this.$t('page.visit_log.ai_cat_traversal'),
        inject: this.$t('page.visit_log.ai_cat_inject'),
        scan: this.$t('page.visit_log.ai_cat_scan'),
        owasp: 'OWASP',
        other: this.$t('page.visit_log.ai_cat_other'),
      };
    },
  },
  mounted() {
    this.loadHosts();
    this.loadData();
    window.addEventListener('keydown', this.onKeydown);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeydown);
  },
  methods: {
    fmtDate(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    },
    toDayInt(s) {
      return parseInt(String(s).replace(/-/g, ''), 10) || 0;
    },
    catFromRule(rule) {
      if (!rule) return '-';
      return rule.replace(/^AI检测[:：]/, '') || '-';
    },
    scoreTheme(score) {
      if (score >= 0.9) return 'danger';
      if (score >= 0.7) return 'warning';
      return 'primary';
    },
    markAttackText(row) {
      const base = this.$t('page.visit_log.ai_mark_attack');
      const cat = row.attack_type ? this.aiCatLabels[row.attack_type] || row.attack_type : '';
      return cat ? `${base}:${cat}` : base;
    },
    async loadHosts() {
      try {
        const res = await allhost();
        if (res.code === 0 && Array.isArray(res.data)) {
          this.hostOptions = res.data;
        }
      } catch (e) {
        // 站点加载失败不阻断标注
      }
    },
    buildQuery() {
      const s = this.range && this.range.length === 2 ? this.range[0] : '';
      const e = this.range && this.range.length === 2 ? this.range[1] : '';
      return {
        host_code: this.filter.host_code || '',
        start_day: this.toDayInt(s),
        end_day: this.toDayInt(e),
        mark_status: this.filter.mark_status || '',
        min_score: this.filter.min_score || 0,
        page_index: this.pagination.current,
        page_size: this.pagination.pageSize,
      };
    },
    async loadData() {
      this.loading = true;
      try {
        const res = await aiLabelListApi(this.buildQuery());
        if (res.code === 0) {
          this.rows = (res.data && res.data.rows) || [];
          this.pagination.total = (res.data && res.data.total) || 0;
        } else {
          MessagePlugin.error(res.msg || this.$t('page.ai.workbench.load_failed'));
        }
      } catch (e) {
        MessagePlugin.error(this.$t('page.ai.workbench.load_failed'));
      } finally {
        this.loading = false;
      }
    },
    search() {
      this.pagination.current = 1;
      this.loadData();
    },
    reset() {
      this.filter = { host_code: '', mark_status: '', min_score: 0 };
      this.range = [];
      this.pagination.current = 1;
      this.loadData();
    },
    onSelectChange(value) {
      this.selectedRowKeys = value;
    },
    onPageChange(pageInfo) {
      this.pagination.current = pageInfo.current;
      this.pagination.pageSize = pageInfo.pageSize;
      this.loadData();
    },
    async batchMark(mark, attackType = '') {
      if (!this.selectedRowKeys.length) {
        MessagePlugin.warning(this.$t('page.ai.workbench.select_first'));
        return;
      }
      try {
        const res = await aiBatchMarkApi({
          req_uuids: this.selectedRowKeys,
          mark,
          attack_type: attackType,
        });
        if (res.code === 0) {
          MessagePlugin.success(res.msg || this.$t('page.ai.workbench.batch_success'));
          this.selectedRowKeys = [];
          this.loadData();
        } else {
          MessagePlugin.error(res.msg || this.$t('page.ai.workbench.batch_failed'));
        }
      } catch (e) {
        MessagePlugin.error(this.$t('page.ai.workbench.batch_failed'));
      }
    },
    openBatchAttack() {
      if (!this.selectedRowKeys.length) {
        MessagePlugin.warning(this.$t('page.ai.workbench.select_first'));
        return;
      }
      this.batchAttackType = '';
      this.batchAttackVisible = true;
    },
    confirmBatchAttack() {
      this.batchAttackVisible = false;
      this.batchMark('attack', this.batchAttackType);
    },
    async batchUnmark() {
      if (!this.selectedRowKeys.length) {
        MessagePlugin.warning(this.$t('page.ai.workbench.select_first'));
        return;
      }
      try {
        const res = await aiBatchUnmarkApi({ req_uuids: this.selectedRowKeys });
        if (res.code === 0) {
          MessagePlugin.success(res.msg || this.$t('page.ai.workbench.unmark_success'));
          this.selectedRowKeys = [];
          this.loadData();
        } else {
          MessagePlugin.error(res.msg || this.$t('page.ai.workbench.unmark_failed'));
        }
      } catch (e) {
        MessagePlugin.error(this.$t('page.ai.workbench.unmark_failed'));
      }
    },
    openDetail(row) {
      this.detailRow = row;
      this.detailAttackType = row.attack_type || '';
      this.detailVisible = true;
    },
    onDetailClose() {
      this.detailRow = null;
    },
    async markOne(mark) {
      if (!this.detailRow) return;
      try {
        const res = await aiBatchMarkApi({
          req_uuids: [this.detailRow.req_uuid],
          mark,
          attack_type: mark === 'attack' ? this.detailAttackType : '',
        });
        if (res.code === 0) {
          MessagePlugin.success(this.$t('page.visit_log.ai_mark_success'));
          this.detailVisible = false;
          this.loadData();
        } else {
          MessagePlugin.error(res.msg || this.$t('page.ai.workbench.batch_failed'));
        }
      } catch (e) {
        MessagePlugin.error(this.$t('page.ai.workbench.batch_failed'));
      }
    },
    async unmarkOne() {
      if (!this.detailRow) return;
      try {
        const res = await aiBatchUnmarkApi({ req_uuids: [this.detailRow.req_uuid] });
        if (res.code === 0) {
          MessagePlugin.success(this.$t('page.visit_log.ai_mark_unmarked'));
          this.detailVisible = false;
          this.loadData();
        } else {
          MessagePlugin.error(res.msg || this.$t('page.ai.workbench.unmark_failed'));
        }
      } catch (e) {
        MessagePlugin.error(this.$t('page.ai.workbench.unmark_failed'));
      }
    },
    onKeydown(e) {
      if (!this.detailVisible || !this.detailRow) return;
      // 避免在输入框/下拉里误触发
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '1') {
        this.markOne('normal');
      } else if (e.key === '2') {
        this.markOne('attack');
      } else if (e.key === '3') {
        this.markOne('ignore');
      }
    },
  },
};
</script>

<style scoped>
.ellipsis-url {
  display: inline-block;
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
.muted {
  color: var(--td-text-color-placeholder, #bbb);
}
.detail-block {
  margin-top: 12px;
}
.detail-label {
  font-weight: 600;
  margin-bottom: 4px;
}
.detail-pre {
  background: var(--td-bg-color-secondarycontainer, #f5f5f5);
  padding: 8px;
  border-radius: 4px;
  max-height: 160px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  font-size: 12px;
}
.break-all {
  word-break: break-all;
}
</style>
