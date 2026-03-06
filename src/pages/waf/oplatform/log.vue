<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container"></div>
        <div class="right-operation-container">
          <t-form ref="searchForm" :data="searchformData" layout="inline" colon :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.oplatform.key_name')" name="key_name">
              <t-input v-model="searchformData.key_name" style="width:160px" clearable />
            </t-form-item>
            <t-form-item :label="$t('page.oplatform.log_path')" name="request_path">
              <t-input v-model="searchformData.request_path" style="width:200px" clearable />
            </t-form-item>
            <t-form-item :label="$t('page.oplatform.log_ip')" name="client_ip">
              <t-input v-model="searchformData.client_ip" style="width:140px" clearable />
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>

      <div class="table-container">
        <t-table
          :columns="columns"
          :data="data"
          rowKey="id"
          :hover="true"
          :pagination="pagination"
          :loading="dataLoading"
          @page-change="rehandlePageChange"
        >
          <template #status_code="slotProps">
            <t-tag :theme="slotProps.row.status_code === 200 ? 'success' : 'warning'">
              {{ slotProps.row.status_code }}
            </t-tag>
          </template>
          <template #duration="slotProps">
            {{ slotProps.row.duration }} ms
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleDetail(slotProps)">{{ $t('common.details') }}</a>
            <a class="t-button-link" style="color: #e34d59" @click="handleDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
    </t-card>

    <!-- 删除确认对话框 -->
    <t-dialog
      :header="$t('common.delete')"
      :visible.sync="confirmVisible"
      :width="400"
      @confirm="onConfirmDelete"
      @cancel="confirmVisible = false"
    >
      <div slot="body">{{ $t('page.oplatform.delete_confirm') }}</div>
    </t-dialog>

    <!-- 日志详情对话框 -->
    <t-dialog
      :header="$t('page.oplatform.log_detail')"
      :visible.sync="detailDialogVisible"
      :width="800"
      :cancel-btn="null"
      @confirm="detailDialogVisible = false"
    >
      <div slot="body">
        <t-form :labelWidth="120">
          <t-form-item :label="$t('page.oplatform.key_name')">
            <span>{{ detailData.key_name }}</span>
          </t-form-item>
          <t-form-item :label="$t('page.oplatform.log_path')">
            <span>{{ detailData.request_method }} {{ detailData.request_path }}</span>
          </t-form-item>
          <t-form-item :label="$t('page.oplatform.log_ip')">
            <span>{{ detailData.client_ip }}</span>
          </t-form-item>
          <t-form-item :label="$t('page.oplatform.log_status')">
            <span>{{ detailData.status_code }}</span>
          </t-form-item>
          <t-form-item :label="$t('page.oplatform.log_duration')">
            <span>{{ detailData.duration }} ms</span>
          </t-form-item>
          <t-form-item :label="$t('page.oplatform.log_time')">
            <span>{{ detailData.time_str }}</span>
          </t-form-item>
          <t-form-item :label="$t('page.oplatform.log_request_body')">
            <t-textarea :value="detailData.request_body" readonly :style="{ width: '580px' }" :autosize="{ minRows: 3, maxRows: 8 }" />
          </t-form-item>
          <t-form-item :label="$t('page.oplatform.log_response_body')">
            <t-textarea :value="detailData.response_body" readonly :style="{ width: '580px' }" :autosize="{ minRows: 3, maxRows: 8 }" />
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>
  </div>
</template>

<script>
import { oplatform_log_list_api, oplatform_log_detail_api, oplatform_log_del_api } from '@/apis/oplatform'
import { MessagePlugin } from 'tdesign-vue'

export default {
  name: 'OPlatformLog',
  data() {
    return {
      dataLoading: false,
      data: [],
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0
      },
      searchformData: {
        key_name: '',
        request_path: '',
        client_ip: ''
      },
      columns: [
        { colKey: 'key_name', title: this.$t('page.oplatform.key_name'), width: 130 },
        { colKey: 'request_method', title: this.$t('page.oplatform.log_method'), width: 80 },
        { colKey: 'request_path', title: this.$t('page.oplatform.log_path'), width: 220, ellipsis: true },
        { colKey: 'client_ip', title: this.$t('page.oplatform.log_ip'), width: 130 },
        { colKey: 'status_code', title: this.$t('page.oplatform.log_status'), width: 90 },
        { colKey: 'duration', title: this.$t('page.oplatform.log_duration'), width: 100 },
        { colKey: 'time_str', title: this.$t('page.oplatform.log_time'), width: 160 },
        { colKey: 'op', title: this.$t('common.operation'), width: 130, fixed: 'right' }
      ],
      detailDialogVisible: false,
      detailData: {},
      confirmVisible: false,
      confirmDeleteId: ''
    }
  },
  mounted() {
    this.getList()
  },
  methods: {
    getList() {
      this.dataLoading = true
      oplatform_log_list_api({
        pageIndex: this.pagination.current,
        pageSize: this.pagination.pageSize,
        key_name: this.searchformData.key_name,
        request_path: this.searchformData.request_path,
        client_ip: this.searchformData.client_ip
      }).then((res) => {
        this.dataLoading = false
        if (res && res.code === 0) {
          this.data = res.data.list || []
          this.pagination.total = res.data.total
        }
      }).catch(() => { this.dataLoading = false })
    },
    handleDetail(slotProps) {
      oplatform_log_detail_api({ id: slotProps.row.id }).then((res) => {
        if (res && res.code === 0) {
          this.detailData = res.data
          this.detailDialogVisible = true
        }
      })
    },
    handleDelete(slotProps) {
      this.confirmDeleteId = slotProps.row.id
      this.confirmVisible = true
    },
    onConfirmDelete() {
      this.confirmVisible = false
      oplatform_log_del_api({ id: this.confirmDeleteId }).then((res) => {
        if (res && res.code === 0) {
          MessagePlugin.success(this.$t('page.oplatform.delete_success'))
          this.getList()
        }
      })
    },
    rehandlePageChange(pagination) {
      this.pagination.current = pagination.current
      this.pagination.pageSize = pagination.pageSize
      this.getList()
    }
  }
}
</script>

<style scoped>
.list-card-container {
  padding: 16px;
}
.left-operation-container {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.right-operation-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
</style>
