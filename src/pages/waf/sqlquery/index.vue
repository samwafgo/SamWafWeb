<template>
  <div>
    <t-card class="list-card-container">
      <t-tabs v-model="activeTab" @change="handleTabChange">

        <!-- ── SQL 查询 Tab ─────────────────────────────────────────────────── -->
        <t-tab-panel :value="'query'" :label="$t('page.sql_query.tab_query')">
          <div style="padding-top: 16px;">
            <t-form :labelWidth="120">
              <t-row :gutter="16">
                <t-col :span="6">
                  <t-form-item :label="$t('page.sql_query.db_type')">
                    <t-select v-model="dbType" :style="{ width: '100%' }">
                      <t-option value="local"  :label="$t('page.sql_query.db_type_local')"></t-option>
                      <t-option value="log"    :label="$t('page.sql_query.db_type_log')"></t-option>
                      <t-option value="stats"  :label="$t('page.sql_query.db_type_stats')"></t-option>
                    </t-select>
                  </t-form-item>
                </t-col>
              </t-row>

              <t-row :gutter="16" style="margin-top: 16px;">
                <!-- 与「选择数据库」同一列宽 span=6，控件右边缘对齐 -->
                <t-col :span="6">
                  <t-form-item :label="$t('page.sql_query.sql_input')">
                    <t-textarea
                      v-model="sqlQuery"
                      :placeholder="$t('page.sql_query.sql_placeholder')"
                      :autosize="{ minRows: 5, maxRows: 10 }"
                      :style="{ width: '100%' }"
                    />
                  </t-form-item>
                </t-col>
              </t-row>

              <t-row style="margin-top: 16px;">
                <t-col>
                  <t-button theme="primary" @click="executeQuery" :loading="queryLoading">
                    {{ $t('page.sql_query.execute_query') }}
                  </t-button>
                </t-col>
              </t-row>
            </t-form>

            <t-divider style="margin-top: 24px; margin-bottom: 24px;"></t-divider>

            <div v-if="queryResult.columns.length > 0">
              <h3>{{ $t('page.sql_query.query_result') }}</h3>
              <p style="margin-bottom: 16px; color: #666;">
                {{ $t('page.sql_query.total_records', { count: queryResult.total }) }}
              </p>
              <t-table
                :columns="queryColumns"
                :data="queryResult.data"
                rowKey="__idx"
                :verticalAlign="'top'"
                :hover="true"
                :pagination="pagination"
                :loading="queryLoading"
                @page-change="rehandlePageChange"
                :maxHeight="600"
                :headerAffixedTop="true"
                :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }"
              />
            </div>
            <div v-else-if="!queryLoading && hasQueried" style="text-align: center; padding: 40px;">
              <t-empty :description="$t('page.sql_query.no_result')" />
            </div>
          </div>
        </t-tab-panel>

        <!-- ── 数据库结构 Tab ───────────────────────────────────────────────── -->
        <t-tab-panel :value="'structure'" :label="$t('page.sql_query.tab_structure')">
          <div style="padding-top: 16px;">
            <!-- 工具栏 -->
            <t-row :gutter="12" style="margin-bottom: 16px;">
              <t-col :span="6">
                <t-select v-model="structDbType" :style="{ width: '100%' }" @change="loadTableInfo">
                  <t-option value="local"  :label="$t('page.sql_query.db_type_local')"></t-option>
                  <t-option value="log"    :label="$t('page.sql_query.db_type_log')"></t-option>
                  <t-option value="stats"  :label="$t('page.sql_query.db_type_stats')"></t-option>
                </t-select>
              </t-col>
              <t-col :span="3">
                <t-button theme="default" @click="loadTableInfo" :loading="structLoading">
                  {{ $t('page.sql_query.structure_refresh') }}
                </t-button>
              </t-col>
            </t-row>

            <!-- 汇总统计 -->
            <t-row v-if="tableInfoList.length > 0" :gutter="16" style="margin-bottom: 16px;">
              <t-col :span="6">
                <t-card class="stat-card" :bordered="true">
                  <div class="stat-item">
                    <span class="stat-label">{{ $t('page.sql_query.structure_total_tables') }}</span>
                    <span class="stat-value">{{ tableInfoList.length }}</span>
                  </div>
                </t-card>
              </t-col>
              <t-col :span="6">
                <t-card class="stat-card" :bordered="true">
                  <div class="stat-item">
                    <span class="stat-label">{{ $t('page.sql_query.structure_total_rows') }}</span>
                    <span class="stat-value">{{ totalRows.toLocaleString() }}</span>
                  </div>
                </t-card>
              </t-col>
            </t-row>

            <!-- 表格列表（默认按行数倒序） -->
            <t-table
              :data="sortedTableInfoList"
              :columns="structTableCols"
              rowKey="table_name"
              :sort="structSort"
              @sort-change="handleStructSortChange"
              :loading="structLoading"
              :hover="true"
              :bordered="true"
              size="medium"
              :empty="$t('page.sql_query.structure_no_tables')"
            />
          </div>
        </t-tab-panel>

      </t-tabs>
    </t-card>

    <!-- 详情弹窗 -->
    <t-dialog
      :visible.sync="detailVisible"
      :header="detailTable ? detailTable.table_name : ''"
      :footer="false"
      width="860px"
      :closeOnOverlayClick="true"
    >
      <div v-if="detailTable" class="detail-content">
        <!-- 基本信息 -->
        <t-space style="margin-bottom: 16px;">
          <t-tag theme="primary" variant="light">
            {{ $t('page.sql_query.structure_row_count') }}: {{ detailTable.row_count.toLocaleString() }}
          </t-tag>
          <t-tag theme="default" variant="light">
            {{ $t('page.sql_query.structure_col_count') }}: {{ (detailTable.columns || []).length }}
          </t-tag>
          <t-tag theme="default" variant="light">
            {{ $t('page.sql_query.structure_idx_count') }}: {{ (detailTable.indexes || []).length }}
          </t-tag>
        </t-space>

        <!-- 字段信息 -->
        <h4 class="detail-subtitle">{{ $t('page.sql_query.structure_columns') }}</h4>
        <t-table
          :data="detailTable.columns || []"
          :columns="columnInfoCols"
          rowKey="cid"
          size="small"
          :bordered="true"
          :hover="true"
          style="margin-bottom: 20px;"
        />

        <!-- 索引信息 -->
        <template v-if="detailTable.indexes && detailTable.indexes.length > 0">
          <h4 class="detail-subtitle">{{ $t('page.sql_query.structure_indexes') }}</h4>
          <t-table
            :data="flattenIndexes(detailTable.indexes)"
            :columns="indexInfoCols"
            rowKey="_key"
            size="small"
            :bordered="true"
            :hover="true"
          />
        </template>
        <t-empty v-else :description="$t('page.sql_query.structure_no_indexes')" style="padding: 12px 0;" />
      </div>
    </t-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { sql_query_execute_api, sql_query_table_info_api } from '@/apis/sqlquery';
import { MessagePlugin } from 'tdesign-vue';

export default Vue.extend({
  name: 'SqlQuery',
  data() {
    return {
      activeTab: 'query',

      // ── SQL 查询 ──────────────────────────────────────────────────────────
      dbType: 'local',
      sqlQuery: '',
      queryLoading: false,
      hasQueried: false,
      queryResult: { columns: [], data: [], total: 0 },
      queryColumns: [],
      pagination: { total: 0, current: 1, pageSize: 50 },
      allData: [],

      // ── 数据库结构 ────────────────────────────────────────────────────────
      structDbType: 'local',
      structLoading: false,
      tableInfoList: [],
      // 默认按行数倒序
      structSort: { sortBy: 'row_count', descending: true } as any,

      // 详情弹窗
      detailVisible: false,
      detailTable: null as any,

      // 结构表格列定义（在 data 里声明避免 this 上下文问题）
      structTableCols: [] as any[],

      // 字段信息列
      columnInfoCols: [] as any[],

      // 索引信息列
      indexInfoCols: [] as any[],
    };
  },
  computed: {
    offsetTop(): number {
      return (this.$store.state as any).setting.isUseTabsRouter ? 48 : 0;
    },
    totalRows(): number {
      return (this.tableInfoList as any[]).reduce((s, t) => s + (t.row_count || 0), 0);
    },
    // 手动排序（col_count / idx_count 已作为真实字段预计算好）
    sortedTableInfoList(): any[] {
      const list: any[] = [...(this.tableInfoList as any[])];
      const { sortBy, descending } = (this.structSort as any);
      if (!sortBy) return list;
      return list.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return descending ? bVal - aVal : aVal - bVal;
        }
        const cmp = String(aVal || '').localeCompare(String(bVal || ''));
        return descending ? -cmp : cmp;
      });
    },
  },
  created() {
    this.initCols();
  },
  mounted() {
    this.loadTableInfo();
  },
  methods: {
    initCols() {
      const self = this as any;

      this.structTableCols = [
        {
          colKey: 'table_name',
          title: this.$t('page.sql_query.structure_table_name'),
          ellipsis: true,
          sorter: true,
        },
        {
          colKey: 'row_count',
          title: this.$t('page.sql_query.structure_row_count'),
          width: 140,
          sorter: true,
          // 千位分隔符显示
          cell: (h, { row }) => h('span', Number(row.row_count).toLocaleString()),
        },
        {
          colKey: 'col_count',
          title: this.$t('page.sql_query.structure_col_count'),
          width: 100,
          sorter: true,
          // col_count 已在 loadTableInfo 预计算为真实字段
        },
        {
          colKey: 'idx_count',
          title: this.$t('page.sql_query.structure_idx_count'),
          width: 100,
          sorter: true,
          // idx_count 已在 loadTableInfo 预计算为真实字段
        },
        {
          colKey: 'action',
          title: this.$t('page.sql_query.structure_action'),
          width: 160,
          cell: (h, { row }) => h('t-space', { props: { size: 'small' } }, [
            h(
              't-button',
              {
                props: { theme: 'primary', variant: 'text', size: 'small' },
                on: { click: () => self.queryTop100(row) },
              },
              this.$t('page.sql_query.structure_query_top100'),
            ),
            h(
              't-button',
              {
                props: { theme: 'default', variant: 'text', size: 'small' },
                on: { click: () => self.showDetail(row) },
              },
              this.$t('page.sql_query.structure_detail'),
            ),
          ]),
        },
      ];

      this.columnInfoCols = [
        { colKey: 'cid',        title: this.$t('page.sql_query.structure_col_cid'),     width: 60 },
        { colKey: 'name',       title: this.$t('page.sql_query.structure_col_name'),    width: 180 },
        { colKey: 'type',       title: this.$t('page.sql_query.structure_col_type'),    width: 140 },
        {
          colKey: 'not_null',
          title: this.$t('page.sql_query.structure_col_not_null'),
          width: 80,
          cell: (h, { row }) => row.not_null
            ? h('t-tag', { props: { theme: 'warning', variant: 'light', size: 'small' } }, this.$t('page.sql_query.structure_yes'))
            : h('span', { style: { color: '#bbb' } }, '-'),
        },
        {
          colKey: 'default_val',
          title: this.$t('page.sql_query.structure_col_default'),
          width: 140,
          cell: (h, { row }) => row.default_val
            ? h('span', row.default_val)
            : h('span', { style: { color: '#bbb' } }, 'NULL'),
        },
        {
          colKey: 'primary_key',
          title: this.$t('page.sql_query.structure_col_pk'),
          width: 80,
          cell: (h, { row }) => row.primary_key
            ? h('t-tag', { props: { theme: 'success', variant: 'light', size: 'small' } }, 'PK')
            : h('span', { style: { color: '#bbb' } }, '-'),
        },
      ];

      this.indexInfoCols = [
        { colKey: 'name',    title: this.$t('page.sql_query.structure_idx_name'),    ellipsis: true },
        {
          colKey: 'unique',
          title: this.$t('page.sql_query.structure_idx_unique'),
          width: 80,
          cell: (h, { row }) => row.unique
            ? h('t-tag', { props: { theme: 'success', variant: 'light', size: 'small' } }, this.$t('page.sql_query.structure_yes'))
            : h('span', { style: { color: '#bbb' } }, '-'),
        },
        { colKey: 'origin',  title: this.$t('page.sql_query.structure_idx_origin'),  width: 80 },
        { colKey: 'columns', title: this.$t('page.sql_query.structure_idx_columns') },
      ];
    },

    getContainer() {
      return document.querySelector('.tdesign-starter-layout');
    },

    handleTabChange(val) {
      if (val === 'structure' && (this.tableInfoList as any[]).length === 0) {
        this.loadTableInfo();
      }
    },

    // ── SQL 查询 ──────────────────────────────────────────────────────────────
    async executeQuery() {
      if (!this.sqlQuery.trim()) {
        MessagePlugin.warning('请输入SQL查询语句');
        return;
      }
      this.queryLoading = true;
      this.hasQueried   = true;
      try {
        const res = await sql_query_execute_api({ db_type: this.dbType, sql: this.sqlQuery, limit: 1000 });
        if (res.code === 0) {
          const result     = res.data;
          const rows       = (result.data || []).map((r, i) => ({ ...r, __idx: i }));
          this.allData     = rows;
          this.queryResult = { columns: result.columns || [], data: rows, total: result.total || 0 };
          this.pagination  = { ...this.pagination, total: result.total || 0, current: 1 };
          this.buildQueryColumns(result.columns || []);
          MessagePlugin.success(this.$t('page.sql_query.query_success'));
        } else {
          MessagePlugin.error(res.msg || this.$t('page.sql_query.query_failed'));
          this.queryResult = { columns: [], data: [], total: 0 };
        }
      } catch (error) {
        MessagePlugin.error(this.$t('page.sql_query.query_failed'));
        this.queryResult = { columns: [], data: [], total: 0 };
      } finally {
        this.queryLoading = false;
      }
    },

    buildQueryColumns(columnNames) {
      this.queryColumns = columnNames.map(col => ({
        title: col, colKey: col, ellipsis: true, width: 200,
        cell: (h, { row }) => {
          const v = row[col];
          return v === null || v === undefined
            ? h('span', { style: { color: '#ccc' } }, 'NULL')
            : h('span', String(v));
        },
      }));
    },

    rehandlePageChange(pageInfo) {
      this.pagination.current = pageInfo.current;
      if (this.pagination.pageSize !== pageInfo.pageSize) {
        this.pagination.current  = 1;
        this.pagination.pageSize = pageInfo.pageSize;
      }
      const start = (this.pagination.current - 1) * this.pagination.pageSize;
      this.queryResult.data = (this.allData as any[]).slice(start, start + this.pagination.pageSize);
    },

    // ── 数据库结构 ────────────────────────────────────────────────────────────
    async loadTableInfo() {
      this.structLoading = true;
      try {
        const res = await sql_query_table_info_api({ db_type: this.structDbType });
        if (res.code === 0) {
          // 把虚拟字段预计算为真实字段，让 TDesign 排序能正确识别
          this.tableInfoList = (res.data.tables || []).map((t: any) => ({
            ...t,
            col_count: (t.columns || []).length,
            idx_count: (t.indexes || []).length,
          }));
        } else {
          MessagePlugin.error(res.msg || this.$t('page.sql_query.structure_load_failed'));
        }
      } catch {
        MessagePlugin.error(this.$t('page.sql_query.structure_load_failed'));
      } finally {
        this.structLoading = false;
      }
    },

    handleStructSortChange(sortInfo) {
      if (sortInfo) {
        this.structSort = { sortBy: sortInfo.sortBy, descending: sortInfo.descending };
      }
    },

    showDetail(row) {
      this.detailTable   = row;
      this.detailVisible = true;
    },

    async queryTop100(row) {
      // 同步 db 类型到查询 Tab，填入 SQL，切换到查询 Tab 后执行
      this.dbType   = this.structDbType;
      this.sqlQuery = `SELECT * FROM "${row.table_name}" LIMIT 100`;
      this.activeTab = 'query';
      // 等待 DOM 更新后再执行，避免 Tab 切换动画干扰
      await this.$nextTick();
      this.executeQuery();
    },

    formatSize(bytes) {
      if (!bytes || bytes === 0) return '-';
      const k     = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i     = Math.floor(Math.log(bytes) / Math.log(k));
      return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    },

    flattenIndexes(indexes) {
      return (indexes || []).map((idx, i) => ({
        _key:    i,
        name:    idx.name,
        unique:  idx.unique,
        origin:  idx.origin || '-',
        columns: (idx.columns || []).map(c => c.name).filter(Boolean).join(', ') || '-',
      }));
    },
  },
});
</script>

<style lang="less" scoped>
.list-card-container {
  padding: 24px;
}

.stat-card {
  :deep(.t-card__body) {
    padding: 12px 16px;
  }
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .stat-label {
    font-size: 12px;
    color: var(--td-text-color-secondary, #888);
  }

  .stat-value {
    font-size: 22px;
    font-weight: 600;
    color: var(--td-text-color-primary, #333);
  }
}

.detail-content {
  .detail-subtitle {
    margin: 0 0 10px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--td-text-color-primary, #333);
    padding-left: 8px;
    border-left: 3px solid var(--td-brand-color, #0052d9);
  }
}

::v-deep .t-textarea__inner {
  font-family: 'Courier New', monospace;
}
</style>
