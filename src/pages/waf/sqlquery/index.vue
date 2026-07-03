<template>
  <div>
    <t-card class="list-card-container">
      <t-tabs v-model="activeTab" @change="handleTabChange">

        <!-- ── 结构化查询 Tab ───────────────────────────────────────────────── -->
        <t-tab-panel :value="'query'" :label="$t('page.sql_query.tab_query')">
          <div style="padding-top: 16px;">
            <t-alert theme="info" :message="$t('page.sql_query.query_tip')" style="margin-bottom: 16px;" />

            <t-form :labelWidth="90">
              <t-row :gutter="16">
                <t-col :span="4">
                  <t-form-item :label="$t('page.sql_query.db_type')">
                    <t-select v-model="dbType" :style="{ width: '100%' }" @change="onDbTypeChange">
                      <t-option value="local"  :label="$t('page.sql_query.db_type_local')"></t-option>
                      <t-option value="log"    :label="$t('page.sql_query.db_type_log')"></t-option>
                      <t-option value="stats"  :label="$t('page.sql_query.db_type_stats')"></t-option>
                    </t-select>
                  </t-form-item>
                </t-col>
                <t-col :span="4">
                  <t-form-item :label="$t('page.sql_query.query_mode')">
                    <t-radio-group v-model="mode" variant="default-filled">
                      <t-radio-button value="list">{{ $t('page.sql_query.mode_list') }}</t-radio-button>
                      <t-radio-button value="count">{{ $t('page.sql_query.mode_count') }}</t-radio-button>
                    </t-radio-group>
                  </t-form-item>
                </t-col>
              </t-row>

              <t-row :gutter="16" style="margin-top: 8px;">
                <t-col :span="4">
                  <t-form-item :label="$t('page.sql_query.table_label')">
                    <t-select
                      v-model="selectedTable"
                      filterable
                      :loading="schemaLoading"
                      :placeholder="$t('page.sql_query.table_placeholder')"
                      :style="{ width: '100%' }"
                      @change="onTableChange"
                    >
                      <t-option v-for="t in queryableTables" :key="t.table_name" :value="t.table_name" :label="t.table_name"></t-option>
                    </t-select>
                  </t-form-item>
                </t-col>
                <t-col :span="8" v-if="mode === 'list'">
                  <t-form-item :label="$t('page.sql_query.columns_label')">
                    <t-select
                      v-model="selectedColumns"
                      multiple
                      filterable
                      :minCollapsedNum="4"
                      :disabled="!selectedTable"
                      :placeholder="$t('page.sql_query.columns_placeholder')"
                      :style="{ width: '100%' }"
                    >
                      <t-option v-for="c in currentTableColumns" :key="c.name" :value="c.name" :label="c.name + ' (' + c.type + ')'"></t-option>
                    </t-select>
                  </t-form-item>
                </t-col>
              </t-row>

              <!-- 条件构造器 -->
              <t-form-item :label="$t('page.sql_query.filters_label')">
                <div style="width: 100%;">
                  <div v-for="(f, i) in filters" :key="i" class="filter-row">
                    <t-select
                      v-model="f.column"
                      filterable
                      :disabled="!selectedTable"
                      :placeholder="$t('page.sql_query.filter_column')"
                      style="width: 220px;"
                    >
                      <t-option v-for="c in currentTableColumns" :key="c.name" :value="c.name" :label="c.name"></t-option>
                    </t-select>
                    <t-select v-model="f.op" style="width: 110px;">
                      <t-option v-for="op in opOptions" :key="op" :value="op" :label="op"></t-option>
                    </t-select>
                    <t-input
                      v-model="f.value"
                      :placeholder="f.op === 'in' ? $t('page.sql_query.filter_in_placeholder') : $t('page.sql_query.filter_value_placeholder')"
                      style="width: 260px;"
                    />
                    <t-button theme="danger" variant="text" @click="removeFilter(i)">✕</t-button>
                  </div>
                  <t-button theme="default" variant="dashed" :disabled="!selectedTable" @click="addFilter">
                    + {{ $t('page.sql_query.filter_add') }}
                  </t-button>
                </div>
              </t-form-item>

              <t-row :gutter="16" v-if="mode === 'list'">
                <t-col :span="4">
                  <t-form-item :label="$t('page.sql_query.top_label')">
                    <t-input-number v-model="top" :min="1" :max="1000" theme="normal" :style="{ width: '100%' }" />
                  </t-form-item>
                </t-col>
              </t-row>

              <t-row style="margin-top: 8px;">
                <t-col>
                  <t-button theme="primary" @click="executeQuery" :loading="queryLoading">
                    {{ $t('page.sql_query.execute_query') }}
                  </t-button>
                </t-col>
              </t-row>
            </t-form>

            <t-divider style="margin-top: 24px; margin-bottom: 24px;"></t-divider>

            <!-- 计数结果 -->
            <div v-if="queryResult.mode === 'count' && hasQueried && !queryLoading">
              <h3>{{ $t('page.sql_query.count_result') }}</h3>
              <p class="count-value">{{ $t('page.sql_query.count_value', { count: queryResult.total }) }}</p>
            </div>

            <!-- 列表结果 -->
            <div v-else-if="queryResult.columns.length > 0">
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
import { sql_query_execute_api, sql_query_table_info_api, sql_query_queryable_api } from '@/apis/sqlquery';
import { MessagePlugin } from 'tdesign-vue';

export default Vue.extend({
  name: 'SqlQuery',
  data() {
    return {
      activeTab: 'query',

      // ── 结构化查询 ────────────────────────────────────────────────────────
      dbType: 'local',
      mode: 'list',                       // list | count
      queryableTables: [] as any[],       // [{ table_name, columns:[{name,type}] }]
      schemaLoading: false,
      selectedTable: '',
      selectedColumns: [] as string[],
      filters: [] as any[],               // [{ column, op, value }]
      top: 100,
      opOptions: ['=', '!=', '>', '>=', '<', '<=', 'like', 'in'],

      queryLoading: false,
      hasQueried: false,
      queryResult: { mode: 'list', columns: [], data: [], total: 0 } as any,
      queryColumns: [] as any[],
      pagination: { total: 0, current: 1, pageSize: 50 },
      allData: [] as any[],

      // ── 数据库结构 ────────────────────────────────────────────────────────
      structDbType: 'local',
      structLoading: false,
      tableInfoList: [] as any[],
      // 默认按行数倒序
      structSort: { sortBy: 'row_count', descending: true } as any,

      // 详情弹窗
      detailVisible: false,
      detailTable: null as any,

      // 结构表格列定义（在 data 里声明避免 this 上下文问题）
      structTableCols: [] as any[],
      columnInfoCols: [] as any[],
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
    // 当前所选表的可见列
    currentTableColumns(): any[] {
      const t = (this.queryableTables as any[]).find((x) => x.table_name === this.selectedTable);
      return t ? (t.columns || []) : [];
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
    this.loadQueryableSchema();
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
          cell: (h, { row }) => h('span', Number(row.row_count).toLocaleString()),
        },
        {
          colKey: 'col_count',
          title: this.$t('page.sql_query.structure_col_count'),
          width: 100,
          sorter: true,
        },
        {
          colKey: 'idx_count',
          title: this.$t('page.sql_query.structure_idx_count'),
          width: 100,
          sorter: true,
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

    // ── 结构化查询 ────────────────────────────────────────────────────────────
    async loadQueryableSchema() {
      this.schemaLoading = true;
      try {
        const res = await sql_query_queryable_api({ db_type: this.dbType });
        if (res.code === 0) {
          this.queryableTables = res.data.tables || [];
          // 当前所选表已不在可查列表则清空
          if (this.selectedTable && !(this.queryableTables as any[]).find((t) => t.table_name === this.selectedTable)) {
            this.selectedTable = '';
            this.selectedColumns = [];
            this.filters = [];
          }
        } else {
          MessagePlugin.error(res.msg || this.$t('page.sql_query.structure_load_failed'));
        }
      } catch {
        MessagePlugin.error(this.$t('page.sql_query.structure_load_failed'));
      } finally {
        this.schemaLoading = false;
      }
    },

    onDbTypeChange() {
      this.selectedTable = '';
      this.selectedColumns = [];
      this.filters = [];
      this.loadQueryableSchema();
    },

    onTableChange() {
      // 换表后列/条件失效，清空重来
      this.selectedColumns = [];
      this.filters = [];
    },

    addFilter() {
      (this.filters as any[]).push({ column: '', op: '=', value: '' });
    },

    removeFilter(i) {
      (this.filters as any[]).splice(i, 1);
    },

    // 组装结构化条件：跳过未选列；in 运算符按英文逗号拆成数组
    buildFilters() {
      return (this.filters as any[])
        .filter((f) => f.column)
        .map((f) => {
          if (f.op === 'in') {
            const arr = String(f.value == null ? '' : f.value)
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s !== '');
            return { column: f.column, op: f.op, value: arr };
          }
          return { column: f.column, op: f.op, value: f.value };
        });
    },

    async executeQuery() {
      if (!this.selectedTable) {
        MessagePlugin.warning(this.$t('page.sql_query.select_table_first'));
        return;
      }
      this.queryLoading = true;
      this.hasQueried   = true;
      try {
        const payload: any = {
          db_type: this.dbType,
          table: this.selectedTable,
          mode: this.mode,
          filters: this.buildFilters(),
        };
        if (this.mode === 'list') {
          payload.columns = this.selectedColumns;
          payload.top = this.top;
        }
        const res = await sql_query_execute_api(payload);
        if (res.code === 0) {
          const result = res.data;
          if (result.mode === 'count') {
            this.queryResult = { mode: 'count', columns: [], data: [], total: result.total || 0 };
            this.queryColumns = [];
          } else {
            const rows = (result.data || []).map((r, i) => ({ ...r, __idx: i }));
            this.allData = rows;
            this.queryResult = { mode: 'list', columns: result.columns || [], data: rows, total: result.total || 0 };
            this.pagination = { ...this.pagination, total: result.total || 0, current: 1 };
            this.buildQueryColumns(result.columns || []);
          }
          MessagePlugin.success(this.$t('page.sql_query.query_success'));
        } else {
          MessagePlugin.error(res.msg || this.$t('page.sql_query.query_failed'));
          this.queryResult = { mode: this.mode, columns: [], data: [], total: 0 };
        }
      } catch (error) {
        MessagePlugin.error(this.$t('page.sql_query.query_failed'));
        this.queryResult = { mode: this.mode, columns: [], data: [], total: 0 };
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

    // 结构页「查询Top100」：同步库类型 → 载入可查结构 → 结构化 list 查询该表前 100 行
    async queryTop100(row) {
      this.dbType = this.structDbType;
      await this.loadQueryableSchema();
      this.mode           = 'list';
      this.selectedTable  = row.table_name;
      this.selectedColumns = [];
      this.filters        = [];
      this.top            = 100;
      this.activeTab      = 'query';
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

.filter-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.count-value {
  margin: 12px 0 8px;
  font-size: 26px;
  line-height: 1.6;
  font-weight: 600;
  color: var(--td-brand-color, #0052d9);
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
</style>
