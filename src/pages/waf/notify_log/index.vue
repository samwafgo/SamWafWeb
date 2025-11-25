<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="80" layout="inline" colon :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.notify_log.label_message_type')" name="message_type">
              <t-select v-model="searchformData.message_type" clearable :style="{ width: '150px' }">
                <t-option value="rule_trigger" :label="$t('page.notify_log.message_type_rule_trigger')"></t-option>
                <t-option value="operation_notice" :label="$t('page.notify_log.message_type_operation_notice')"></t-option>
                <t-option value="user_login" :label="$t('page.notify_log.message_type_user_login')"></t-option>
                <t-option value="attack_info" :label="$t('page.notify_log.message_type_attack_info')"></t-option>
                <t-option value="weekly_report" :label="$t('page.notify_log.message_type_weekly_report')"></t-option>
                <t-option value="ssl_expire" :label="$t('page.notify_log.message_type_ssl_expire')"></t-option>
                <t-option value="system_error" :label="$t('page.notify_log.message_type_system_error')"></t-option>
                <t-option value="ip_ban" :label="$t('page.notify_log.message_type_ip_ban')"></t-option>
              </t-select>
            </t-form-item>
            <t-form-item :label="$t('page.notify_log.label_send_status')" name="status">
              <t-select v-model="searchformData.status" clearable :style="{ width: '120px' }">
                <t-option :value="1" :label="$t('page.notify_log.status_success')"></t-option>
                <t-option :value="0" :label="$t('page.notify_log.status_failed')"></t-option>
              </t-select>
            </t-form-item>
            <t-form-item :label="$t('page.notify_log.label_start_time')" name="start_time">
              <t-date-picker v-model="searchformData.start_time" enable-time-picker format="YYYY-MM-DD HH:mm:ss" :style="{ width: '200px' }"></t-date-picker>
            </t-form-item>
            <t-form-item :label="$t('page.notify_log.label_end_time')" name="end_time">
              <t-date-picker v-model="searchformData.end_time" enable-time-picker format="YYYY-MM-DD HH:mm:ss" :style="{ width: '200px' }"></t-date-picker>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" @click="getList">{{ $t('common.search') }}</t-button>
              <t-button variant="base" theme="default" @click="handleReset" :style="{ marginLeft: '8px' }">{{ $t('common.reset') }}</t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <t-alert theme="info" :message="$t('page.notify_log.alert_message')" close></t-alert>
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="pagination" :loading="dataLoading" @page-change="rehandlePageChange" @change="rehandleChange"
          :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">
          <template #channel_type="{ row }">
            <t-tag v-if="row.channel_type === 'dingtalk'" theme="primary">{{ $t('page.notify_channel.type_dingtalk') }}</t-tag>
            <t-tag v-else-if="row.channel_type === 'feishu'" theme="success">{{ $t('page.notify_channel.type_feishu') }}</t-tag>
            <t-tag v-else theme="default">{{ row.channel_type }}</t-tag>
          </template>
          <template #message_type="{ row }">
            <t-tag theme="primary">{{ getMessageTypeName(row.message_type) }}</t-tag>
          </template>
          <template #status="{ row }">
            <t-tag v-if="row.status === 1" theme="success">{{ $t('page.notify_log.status_success') }}</t-tag>
            <t-tag v-else theme="danger">{{ $t('page.notify_log.status_failed') }}</t-tag>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleViewDetail(slotProps)">{{ $t('page.notify_log.view_detail') }}</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
    </t-card>

    <!-- 日志详情对话框 -->
    <t-dialog :header="$t('page.notify_log.log_detail')" :visible.sync="detailVisible" :width="800" :footer="false">
      <div slot="body">
        <t-form :labelWidth="150" :style="{ marginTop: '16px' }">
          <t-form-item :label="$t('page.notify_log.label_channel_name')">
            <span>{{ detailData.channel_name }}</span>
          </t-form-item>
          <t-form-item :label="$t('page.notify_log.label_channel_type')">
            <t-tag v-if="detailData.channel_type === 'dingtalk'" theme="primary">{{ $t('page.notify_channel.type_dingtalk') }}</t-tag>
            <t-tag v-else-if="detailData.channel_type === 'feishu'" theme="success">{{ $t('page.notify_channel.type_feishu') }}</t-tag>
            <t-tag v-else theme="default">{{ detailData.channel_type }}</t-tag>
          </t-form-item>
          <t-form-item :label="$t('page.notify_log.label_message_type')">
            <t-tag theme="primary">{{ getMessageTypeName(detailData.message_type) }}</t-tag>
          </t-form-item>
          <t-form-item :label="$t('page.notify_log.label_message_title')">
            <span>{{ detailData.message_title }}</span>
          </t-form-item>
          <t-form-item :label="$t('page.notify_log.label_message_content')">
            <t-textarea :value="detailData.message_content" :autosize="{ minRows: 4, maxRows: 10 }" readonly></t-textarea>
          </t-form-item>
          <t-form-item :label="$t('page.notify_log.label_send_status')">
            <t-tag v-if="detailData.status === 1" theme="success">{{ $t('page.notify_log.status_success') }}</t-tag>
            <t-tag v-else theme="danger">{{ $t('page.notify_log.status_failed') }}</t-tag>
          </t-form-item>
          <t-form-item :label="$t('page.notify_log.label_error_msg')" v-if="detailData.status === 0 && detailData.error_msg">
            <t-textarea :value="detailData.error_msg" :autosize="{ minRows: 2, maxRows: 5 }" readonly></t-textarea>
          </t-form-item>
          <t-form-item :label="$t('page.notify_log.label_send_time')">
            <span>{{ detailData.send_time }}</span>
          </t-form-item>
          <t-form-item style="float: right; margin-top: 16px;">
            <t-button variant="outline" @click="detailVisible = false">{{ $t('common.close') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 删除确认对话框 -->
    <t-dialog :header="$t('common.confirm_delete')" :body="confirmBody" :visible.sync="confirmVisible" @confirm="onConfirmDelete" :onCancel="onCancel">
    </t-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { MessagePlugin } from 'tdesign-vue';
import { getNotifyLogList, deleteNotifyLog } from '@/apis/notify_log';

export default Vue.extend({
  name: 'NotifyLog',
  data() {
    return {
      data: [],
      dataLoading: false,
      columns: [
        { colKey: 'row-select', type: 'multiple', width: 50, fixed: 'left' },
        { title: this.$t('page.notify_log.label_channel_name'), colKey: 'channel_name', width: 150 },
        { title: this.$t('page.notify_log.label_channel_type'), colKey: 'channel_type', width: 120 },
        { title: this.$t('page.notify_log.label_message_type'), colKey: 'message_type', width: 150 },
        { title: this.$t('page.notify_log.label_message_title'), colKey: 'message_title', ellipsis: true, width: 200 },
        { title: this.$t('page.notify_log.label_send_status'), colKey: 'status', width: 100 },
        { title: this.$t('page.notify_log.label_send_time'), colKey: 'send_time', width: 180 },
        {
          align: 'left',
          fixed: 'right',
          width: 150,
          colKey: 'op',
          title: this.$t('common.op'),
        },
      ],
      rowKey: 'id',
      verticalAlign: 'top',
      hover: true,
      pagination: {
        defaultPageSize: 20,
        total: 0,
        defaultCurrent: 1,
      },
      searchformData: {
        pageIndex: 1,
        pageSize: 20,
        message_type: '',
        status: undefined,
        start_time: '',
        end_time: '',
      },
      detailVisible: false,
      detailData: {} as any,
      confirmVisible: false,
      confirmBody: '',
      deleteId: '',
      offsetTop: 0,
    };
  },
  mounted() {
    this.getList();
  },
  methods: {
    getContainer() {
      return document.querySelector('.tdesign-starter-main');
    },
    async getList() {
      this.dataLoading = true;
      try {
        const res = await getNotifyLogList(this.searchformData);
        if (res.code === 0) {
          this.data = res.data.list || [];
          this.pagination.total = res.data.total;
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.dataLoading = false;
      }
    },
    handleReset() {
      this.searchformData = {
        pageIndex: 1,
        pageSize: 20,
        message_type: '',
        status: undefined,
        start_time: '',
        end_time: '',
      };
      this.getList();
    },
    getMessageTypeName(type: string) {
      const typeMap: any = {
        rule_trigger: this.$t('page.notify_log.message_type_rule_trigger'),
        operation_notice: this.$t('page.notify_log.message_type_operation_notice'),
        user_login: this.$t('page.notify_log.message_type_user_login'),
        attack_info: this.$t('page.notify_log.message_type_attack_info'),
        weekly_report: this.$t('page.notify_log.message_type_weekly_report'),
        ssl_expire: this.$t('page.notify_log.message_type_ssl_expire'),
        system_error: this.$t('page.notify_log.message_type_system_error'),
        ip_ban: this.$t('page.notify_log.message_type_ip_ban'),
      };
      return typeMap[type] || type;
    },
    rehandlePageChange(pageInfo: any) {
      this.searchformData.pageIndex = pageInfo.current;
      this.searchformData.pageSize = pageInfo.pageSize;
      this.getList();
    },
    rehandleChange(changeParams: any, triggerAndData: any) {
      console.log('统一Change', changeParams, triggerAndData);
    },
    handleViewDetail(e: any) {
      this.detailData = { ...e.row };
      this.detailVisible = true;
    },
    handleClickDelete(e: any) {
      this.deleteId = e.row.id;
      this.confirmBody = this.$t('page.notify_log.delete_confirm');
      this.confirmVisible = true;
    },
    async onConfirmDelete() {
      try {
        const res = await deleteNotifyLog({ id: this.deleteId });
        if (res.code === 0) {
          MessagePlugin.success(this.$t('page.notify_log.delete_success'));
          this.confirmVisible = false;
          this.getList();
        } else {
          MessagePlugin.error(res.msg || this.$t('page.notify_log.delete_failed'));
        }
      } catch (error) {
        MessagePlugin.error(this.$t('page.notify_log.delete_failed'));
      }
    },
    onCancel() {
      this.confirmVisible = false;
    },
  },
});
</script>

<style lang="less" scoped>
.list-card-container {
  padding: 16px;
}

.table-container {
  margin-top: 16px;
}
</style>



