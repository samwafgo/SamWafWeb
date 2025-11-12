<template>
  <div>
    <t-card class="list-card-container">
      <t-form :labelWidth="120">
        <t-row :gutter="16">
          <t-col :span="6">
            <t-form-item :label="$t('page.sql_query.db_type')">
              <t-select v-model="dbType" :style="{ width: '100%' }">
                <t-option value="local" :label="$t('page.sql_query.db_type_local')"></t-option>
                <t-option value="log" :label="$t('page.sql_query.db_type_log')"></t-option>
                <t-option value="stats" :label="$t('page.sql_query.db_type_stats')"></t-option>
              </t-select>
            </t-form-item>
          </t-col>
        </t-row>

        <t-row :gutter="16" style="margin-top: 16px;">
          <t-col :span="24">
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
        <div class="table-container">
          <t-table 
            :columns="columns" 
            :data="queryResult.data" 
            :rowKey="'index'"
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
      </div>
      <div v-else-if="!queryLoading && hasQueried" style="text-align: center; padding: 40px;">
        <t-empty :description="$t('page.sql_query.no_result')" />
      </div>
    </t-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { sql_query_execute_api } from '@/apis/sqlquery';
import { MessagePlugin } from 'tdesign-vue';

export default Vue.extend({
  name: 'SqlQuery',
  data() {
    return {
      dbType: 'local',
      sqlQuery: '',
      queryLoading: false,
      hasQueried: false,
      queryResult: {
        columns: [],
        data: [],
        total: 0
      },
      columns: [],
      pagination: {
        total: 0,
        current: 1,
        pageSize: 50
      },
      allData: []  // 存储所有查询结果
    };
  },
  computed: {
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    },
  },
  methods: {
    getContainer() {
      return document.querySelector('.tdesign-starter-layout');
    },
    async executeQuery() {
      if (!this.sqlQuery.trim()) {
        MessagePlugin.warning('请输入SQL查询语句');
        return;
      }

      this.queryLoading = true;
      this.hasQueried = true;

      try {
        let postData = {
          db_type: this.dbType,
          sql: this.sqlQuery,
          limit: 1000
        }; 
        console.log("sqlquery postData:",postData);
        const res = await sql_query_execute_api(postData);
        if (res.code === 0) {
          const result = res.data;
          this.queryResult = {
            columns: result.columns || [],
            data: result.data || [],
            total: result.total || 0
          };

          // 保存所有数据用于分页
          this.allData = result.data || [];

          // 设置分页
          this.pagination = {
            ...this.pagination,
            total: result.total || 0,
            current: 1
          };

          // 构建列配置
          this.buildColumns(result.columns || []);

          MessagePlugin.success(this.$t('page.sql_query.query_success'));
        } else {
          MessagePlugin.error(res.msg || this.$t('page.sql_query.query_failed'));
          this.queryResult = {
            columns: [],
            data: [],
            total: 0
          };
        }
      } catch (error) {
        console.error('Query error:', error);
        MessagePlugin.error(this.$t('page.sql_query.query_failed'));
        this.queryResult = {
          columns: [],
          data: [],
          total: 0
        };
      } finally {
        this.queryLoading = false;
      }
    },
    buildColumns(columnNames) {
      this.columns = columnNames.map(col => ({
        title: col,
        colKey: col,
        ellipsis: true,
        width: 200,
        cell: (h, { row }) => {
          const value = row[col];
          if (value === null || value === undefined) {
            return h('span', { style: { color: '#ccc' } }, 'NULL');
          }
          return h('span', String(value));
        }
      }));
    },
    rehandlePageChange(pageInfo) {
      this.pagination.current = pageInfo.current;
      if (this.pagination.pageSize !== pageInfo.pageSize) {
        this.pagination.current = 1;
        this.pagination.pageSize = pageInfo.pageSize;
      }
      
      // 前端分页
      const start = (this.pagination.current - 1) * this.pagination.pageSize;
      const end = start + this.pagination.pageSize;
      this.queryResult.data = this.allData.slice(start, end);
    }
  },
});
</script>

<style lang="less" scoped>
.list-card-container {
  padding: 24px;
}

.table-container {
  margin-top: 16px;
}

::v-deep .t-textarea__inner {
  font-family: 'Courier New', monospace;
}
</style>

