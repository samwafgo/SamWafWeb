<template>
  <div>
    <t-alert
      v-if="summary.downgrade"
      theme="error"
      class="downgrade-alert"
      :message="summary.downgrade_msg"
      :close="true"
      @close="handleDowngradeAck"
    />

    <t-card class="list-card-container">
      <t-alert theme="info" class="range-alert">
        <template #message>
          <span v-if="summary.from_version">
            {{ $t('page.upgrade_notice.range_tip', { from: summary.from_version, to: summary.to_version }) }}
          </span>
          <span v-else>
            {{ $t('page.upgrade_notice.range_tip_unknown', { current: summary.current_version }) }}
          </span>
        </template>
      </t-alert>

      <t-tabs v-model="status" @change="onSearch">
        <t-tab-panel value="pending" :label="`${$t('page.upgrade_notice.tab_pending')} (${summary.pending_count})`" />
        <t-tab-panel value="done" :label="$t('page.upgrade_notice.tab_done')" />
        <t-tab-panel value="all" :label="`${$t('page.upgrade_notice.tab_all')} (${summary.total_count})`" />
      </t-tabs>

      <div class="filter-bar">
        <t-select v-model="kind" class="filter-select" @change="onSearch">
          <t-option value="" :label="$t('page.upgrade_notice.filter_kind_all')" />
          <t-option value="notice" :label="$t('page.upgrade_notice.kind_notice')" />
          <t-option value="action" :label="$t('page.upgrade_notice.kind_action')" />
          <t-option value="check" :label="$t('page.upgrade_notice.kind_check')" />
        </t-select>
        <t-select v-model="version" class="filter-select" @change="onSearch">
          <t-option value="" :label="$t('page.upgrade_notice.filter_version_all')" />
          <t-option v-for="v in versionOptions" :key="v" :value="v" :label="v" />
        </t-select>
        <t-button theme="default" @click="loadAll">{{ $t('common.refresh') }}</t-button>
      </div>

      <div class="table-container">
        <t-table
          :columns="columns"
          :data="data"
          rowKey="notice_id"
          verticalAlign="top"
          :hover="true"
          :pagination="pagination"
          :loading="dataLoading"
          :expandedRow="expandedRow"
          :expandedRowKeys="expandedRowKeys"
          :expandOnRowClick="true"
          @expand-change="onExpandChange"
          @page-change="rehandlePageChange"
        >
          <template #title="slotProps">
            <span class="notice-title" :class="{ 'notice-title--done': slotProps.row.status !== 'pending' }">
              {{ slotProps.row.title }}
            </span>
            <t-tag v-if="slotProps.row.level === 'high'" theme="danger" variant="light" size="small" class="level-tag">
              {{ $t('page.upgrade_notice.level_high') }}
            </t-tag>
          </template>

          <template #kind="slotProps">
            <t-tag :theme="kindTheme(slotProps.row.kind)" variant="light">{{ kindLabel(slotProps.row.kind) }}</t-tag>
          </template>

          <template #status="slotProps">
            <t-tag v-if="slotProps.row.status === 'pending'" theme="warning" variant="light">
              {{ $t('page.upgrade_notice.status_pending') }}
            </t-tag>
            <t-tag v-else-if="slotProps.row.status === 'done'" theme="success" variant="light">
              {{ $t('page.upgrade_notice.status_done') }}
            </t-tag>
            <t-tag v-else theme="default" variant="light">{{ $t('page.upgrade_notice.status_ignored') }}</t-tag>
          </template>

          <template #op="slotProps">
            <template v-if="slotProps.row.status === 'pending'">
              <t-button v-if="slotProps.row.page" size="small" variant="outline" @click.stop="goSetting(slotProps.row)">
                {{ $t('page.upgrade_notice.op_goto') }}
              </t-button>
              <t-link theme="primary" class="op-link" @click.stop="setStatus(slotProps.row, 'ack')">
                {{ $t('page.upgrade_notice.op_ack') }}
              </t-link>
              <t-link theme="default" class="op-link" @click.stop="setStatus(slotProps.row, 'ignore')">
                {{ $t('page.upgrade_notice.op_ignore') }}
              </t-link>
            </template>
            <template v-else>
              <span class="applied-info">{{ slotProps.row.applied_time }} {{ slotProps.row.applied_user }}</span>
              <t-link theme="primary" class="op-link" @click.stop="setStatus(slotProps.row, 'restore')">
                {{ $t('page.upgrade_notice.op_restore') }}
              </t-link>
            </template>
          </template>
        </t-table>
      </div>
    </t-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'UpgradeNotice',
  data() {
    return {
      dataLoading: false,
      data: [],
      status: 'pending',
      kind: '',
      version: '',
      versionOptions: [],
      expandedRowKeys: [],
      summary: {
        current_version: '',
        from_version: '',
        to_version: '',
        pending_count: 0,
        total_count: 0,
        high_pending_count: 0,
        downgrade: false,
        downgrade_msg: '',
      },
      columns: [
        { title: this.$t('page.upgrade_notice.col_title'), colKey: 'title', align: 'left', minWidth: 320, ellipsis: false },
        { title: this.$t('page.upgrade_notice.col_kind'), colKey: 'kind', width: 110 },
        { title: this.$t('page.upgrade_notice.col_version'), colKey: 'version', width: 110 },
        { title: this.$t('page.upgrade_notice.col_status'), colKey: 'status', width: 100 },
        { title: this.$t('page.upgrade_notice.col_op'), colKey: 'op', width: 250 },
      ],
      pagination: {
        total: 0,
        current: 1,
        pageSize: 10,
      },
    };
  },
  mounted() {
    this.loadAll();
  },
  methods: {
    lang() {
      return localStorage.getItem('lang') || 'zh_CN';
    },
    loadAll() {
      this.loadSummary();
      this.getList();
    },
    loadSummary() {
      this.$request
        .get('/upgradenotice/summary', { params: { lang: this.lang() } })
        .then((res) => {
          if (res.code === 0) {
            this.summary = res.data;
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
    },
    // 确认降级告警：同一个"历史最高版本"此后不再提示，最高版本再变高会重新出现
    handleDowngradeAck() {
      this.summary.downgrade = false;
      this.$request.post('/upgradenotice/downgradeack', {}).catch((e: Error) => {
        console.log(e);
      });
    },
    getList() {
      this.dataLoading = true;
      this.$request
        .post('/upgradenotice/list', {
          pageSize: this.pagination.pageSize,
          pageIndex: this.pagination.current,
          status: this.status === 'all' ? '' : this.status,
          kind: this.kind,
          version: this.version,
          lang: this.lang(),
        })
        .then((res) => {
          if (res.code === 0) {
            this.data = res.data.list ?? [];
            this.pagination = { ...this.pagination, total: res.data.total };
            this.collectVersions();
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
          this.dataLoading = false;
        });
    },
    // 版本下拉只从当前结果里收集，不额外开接口；已选中的版本始终保留在选项里
    collectVersions() {
      const set = new Set(this.versionOptions);
      this.data.forEach((row) => set.add(row.version));
      if (this.version) set.add(this.version);
      this.versionOptions = Array.from(set).sort().reverse();
    },
    onSearch() {
      this.pagination.current = 1;
      this.expandedRowKeys = [];
      this.getList();
    },
    onExpandChange(value) {
      this.expandedRowKeys = value;
    },
    expandedRow(h, { row }) {
      const t = (key) => this.$t(`page.upgrade_notice.${key}`);
      const blocks = [
        h('div', { class: 'detail-block' }, [
          h('div', { class: 'detail-head' }, t('detail_what')),
          h('div', { class: 'detail-text' }, row.detail),
        ]),
      ];
      if (row.effect_on || row.effect_off) {
        blocks.push(
          h('div', { class: 'detail-block' }, [
            h('div', { class: 'detail-head' }, t('detail_effect')),
            h('div', { class: 'detail-diff' }, [
              h('div', { class: 'diff-col diff-col--on' }, [
                h('b', t('detail_effect_on')),
                h('span', row.effect_on || '-'),
              ]),
              h('div', { class: 'diff-col diff-col--off' }, [
                h('b', t('detail_effect_off')),
                h('span', row.effect_off || '-'),
              ]),
            ]),
          ]),
        );
      }
      if (row.revert) {
        blocks.push(
          h('div', { class: 'detail-block' }, [
            h('div', { class: 'detail-head' }, t('detail_revert')),
            h('div', { class: 'detail-revert' }, row.revert),
          ]),
        );
      }
      const links = [];
      if (row.page) {
        links.push(
          h('a', { class: 'detail-link', on: { click: () => this.goSetting(row) } }, `${t('op_goto')} (${row.page})`),
        );
      }
      if (row.doc) {
        links.push(
          h('a', { class: 'detail-link', on: { click: () => window.open(row.doc, '_blank') } }, t('op_doc')),
        );
      }
      links.push(h('span', { class: 'detail-meta' }, `${row.notice_id} · ${row.version}`));
      blocks.push(h('div', { class: 'detail-links' }, links));
      return h('div', { class: 'notice-detail' }, blocks);
    },
    kindLabel(kind) {
      return this.$t(`page.upgrade_notice.kind_${kind}`);
    },
    kindTheme(kind) {
      if (kind === 'action') return 'primary';
      if (kind === 'check') return 'warning';
      return 'default';
    },
    goSetting(row) {
      if (!row.page || !row.page.startsWith('/')) return;
      this.$router.push(row.page);
    },
    setStatus(row, action) {
      this.$request
        .post(`/upgradenotice/${action}`, { notice_id: row.notice_id })
        .then((res) => {
          if (res.code === 0) {
            this.$message.success(res.msg);
            this.loadAll();
          } else {
            this.$message.error(res.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
    },
    rehandlePageChange(curr) {
      this.pagination.current = curr.current;
      if (this.pagination.pageSize !== curr.pageSize) {
        this.pagination.current = 1;
        this.pagination.pageSize = curr.pageSize;
      }
      this.getList();
    },
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables';

.downgrade-alert {
  margin-bottom: @spacer;
}

.range-alert {
  margin-bottom: @spacer;
}

.filter-bar {
  display: flex;
  gap: @spacer;
  flex-wrap: wrap;
  align-items: center;
  margin: @spacer 0;
}

.filter-select {
  width: 160px;
}

.notice-title {
  font-weight: 500;
}

.notice-title--done {
  color: var(--td-text-color-placeholder);
  text-decoration: line-through;
}

.level-tag {
  margin-left: 6px;
}

.op-link {
  margin-left: 10px;
}

.applied-info {
  color: var(--td-text-color-placeholder);
  font-size: 12px;
}
</style>

<style lang="less">
// 展开行内容由 render 函数生成，不能用 scoped
.notice-detail {
  padding: 4px 8px 12px 8px;
}

.notice-detail .detail-block {
  margin-bottom: 12px;
}

.notice-detail .detail-head {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  margin-bottom: 4px;
}

.notice-detail .detail-text {
  line-height: 1.7;
}

.notice-detail .detail-diff {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.notice-detail .diff-col {
  flex: 1;
  min-width: 260px;
  padding: 10px 12px;
  border-radius: 3px;
  line-height: 1.7;
}

.notice-detail .diff-col b {
  display: block;
  margin-bottom: 2px;
}

.notice-detail .diff-col--on {
  background: var(--td-success-color-1);
  border-left: 3px solid var(--td-success-color);
}

.notice-detail .diff-col--on b {
  color: var(--td-success-color);
}

.notice-detail .diff-col--off {
  background: var(--td-bg-color-secondarycontainer);
  border-left: 3px solid var(--td-component-border);
}

.notice-detail .detail-revert {
  background: var(--td-warning-color-1);
  border-left: 3px solid var(--td-warning-color);
  border-radius: 3px;
  padding: 10px 12px;
  line-height: 1.7;
}

.notice-detail .detail-links {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.notice-detail .detail-link {
  color: var(--td-brand-color);
  cursor: pointer;
}

.notice-detail .detail-meta {
  color: var(--td-text-color-placeholder);
  font-size: 12px;
}
</style>
