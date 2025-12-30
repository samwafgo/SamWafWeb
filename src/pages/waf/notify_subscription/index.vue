<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAdd">{{ $t('page.notify_subscription.button_add') }}</t-button>
          <t-button theme="default" @click="handleBatchAdd">{{ $t('page.notify_subscription.button_batch_add') }}</t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="80" layout="inline" colon :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.notify_subscription.label_message_type')" name="message_type">
              <t-select v-model="searchformData.message_type" clearable :style="{ width: '150px' }">
                <t-option value="rule_trigger" :label="$t('page.notify_subscription.message_type_rule_trigger')"></t-option>
                <t-option value="operation_notice" :label="$t('page.notify_subscription.message_type_operation_notice')"></t-option>
                <t-option value="user_login" :label="$t('page.notify_subscription.message_type_user_login')"></t-option>
                <t-option value="attack_info" :label="$t('page.notify_subscription.message_type_attack_info')"></t-option>
                <t-option value="weekly_report" :label="$t('page.notify_subscription.message_type_weekly_report')"></t-option>
                <t-option value="ssl_expire" :label="$t('page.notify_subscription.message_type_ssl_expire')"></t-option>
                <t-option value="system_error" :label="$t('page.notify_subscription.message_type_system_error')"></t-option>
                <t-option value="ip_ban" :label="$t('page.notify_subscription.message_type_ip_ban')"></t-option>
              </t-select>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" @click="getList">{{ $t('common.search') }}</t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <t-alert theme="info" :message="$t('page.notify_subscription.alert_message')" close></t-alert>
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="pagination" :loading="dataLoading" @page-change="rehandlePageChange" @change="rehandleChange"
          :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">
          <template #channel_id="{ row }">
            <span>{{ getChannelName(row.channel_id) }}</span>
          </template>
          <template #message_type="{ row }">
            <t-tag theme="primary">{{ getMessageTypeName(row.message_type) }}</t-tag>
          </template>
          <template #status="{ row }">
            <t-switch v-model="row.status" :customValue="[1, 0]" @change="handleStatusChange(row)"></t-switch>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
    </t-card>

    <!-- 添加对话框 -->
    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="120">
          <t-form-item :label="$t('page.notify_subscription.label_channel')" name="channel_id">
            <t-select v-model="formData.channel_id" :style="{ width: '480px' }" :placeholder="$t('page.notify_subscription.channel_placeholder')">
              <t-option v-for="channel in channelList" :key="channel.id" :value="channel.id" :label="channel.name">
                {{ channel.name }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.notify_subscription.label_message_type')" name="message_type">
            <t-select v-model="formData.message_type" :style="{ width: '480px' }" :placeholder="$t('page.notify_subscription.message_type_placeholder')">
              <t-option value="rule_trigger" :label="$t('page.notify_subscription.message_type_rule_trigger')"></t-option>
              <t-option value="operation_notice" :label="$t('page.notify_subscription.message_type_operation_notice')"></t-option>
              <t-option value="user_login" :label="$t('page.notify_subscription.message_type_user_login')"></t-option>
              <t-option value="attack_info" :label="$t('page.notify_subscription.message_type_attack_info')"></t-option>
              <t-option value="weekly_report" :label="$t('page.notify_subscription.message_type_weekly_report')"></t-option>
              <t-option value="ssl_expire" :label="$t('page.notify_subscription.message_type_ssl_expire')"></t-option>
              <t-option value="system_error" :label="$t('page.notify_subscription.message_type_system_error')"></t-option>
              <t-option value="ip_ban" :label="$t('page.notify_subscription.message_type_ip_ban')"></t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.notify_subscription.label_filter_json')" name="filter_json">
            <t-textarea :style="{ width: '480px' }" v-model="formData.filter_json" :rows="3" :placeholder="$t('page.notify_subscription.filter_json_placeholder')"></t-textarea>
          </t-form-item>
          <t-form-item :label="$t('common.status')" name="status">
            <t-radio-group v-model="formData.status">
              <t-radio :value="1">{{ $t('common.on') }}</t-radio>
              <t-radio :value="0">{{ $t('common.off') }}</t-radio>
            </t-radio-group>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formData.remarks" :rows="3"></t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 编辑对话框 -->
    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="formEdit" :rules="rules" @submit="onSubmitEdit" :labelWidth="120">
          <t-form-item :label="$t('page.notify_subscription.label_channel')" name="channel_id">
            <t-select v-model="formEditData.channel_id" :style="{ width: '480px' }">
              <t-option v-for="channel in channelList" :key="channel.id" :value="channel.id" :label="channel.name">
                {{ channel.name }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.notify_subscription.label_message_type')" name="message_type">
            <t-select v-model="formEditData.message_type" :style="{ width: '480px' }">
              <t-option value="rule_trigger" :label="$t('page.notify_subscription.message_type_rule_trigger')"></t-option>
              <t-option value="operation_notice" :label="$t('page.notify_subscription.message_type_operation_notice')"></t-option>
              <t-option value="user_login" :label="$t('page.notify_subscription.message_type_user_login')"></t-option>
              <t-option value="attack_info" :label="$t('page.notify_subscription.message_type_attack_info')"></t-option>
              <t-option value="weekly_report" :label="$t('page.notify_subscription.message_type_weekly_report')"></t-option>
              <t-option value="ssl_expire" :label="$t('page.notify_subscription.message_type_ssl_expire')"></t-option>
              <t-option value="system_error" :label="$t('page.notify_subscription.message_type_system_error')"></t-option>
              <t-option value="ip_ban" :label="$t('page.notify_subscription.message_type_ip_ban')"></t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.notify_subscription.label_filter_json')" name="filter_json">
            <t-textarea :style="{ width: '480px' }" v-model="formEditData.filter_json" :rows="3"></t-textarea>
          </t-form-item>
          <t-form-item :label="$t('common.status')" name="status">
            <t-radio-group v-model="formEditData.status">
              <t-radio :value="1">{{ $t('common.on') }}</t-radio>
              <t-radio :value="0">{{ $t('common.off') }}</t-radio>
            </t-radio-group>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formEditData.remarks" :rows="3"></t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseEditBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 批量添加对话框 -->
    <t-dialog :header="$t('page.notify_subscription.button_batch_add')" :visible.sync="batchAddFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="batchFormData" ref="batchForm" :rules="batchRules" @submit="onBatchSubmit" :labelWidth="120">
          <t-form-item :label="$t('page.notify_subscription.label_channel')" name="channel_id">
            <t-select v-model="batchFormData.channel_id" :style="{ width: '480px' }" :placeholder="$t('page.notify_subscription.channel_placeholder')">
              <t-option v-for="channel in channelList" :key="channel.id" :value="channel.id" :label="channel.name">
                {{ channel.name }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.notify_subscription.label_message_type')" name="message_types">
            <t-select v-model="batchFormData.message_types" :style="{ width: '480px' }" multiple :placeholder="$t('page.notify_subscription.message_types_placeholder')">
              <t-option value="rule_trigger" :label="$t('page.notify_subscription.message_type_rule_trigger')"></t-option>
              <t-option value="operation_notice" :label="$t('page.notify_subscription.message_type_operation_notice')"></t-option>
              <t-option value="user_login" :label="$t('page.notify_subscription.message_type_user_login')"></t-option>
              <t-option value="attack_info" :label="$t('page.notify_subscription.message_type_attack_info')"></t-option>
              <t-option value="weekly_report" :label="$t('page.notify_subscription.message_type_weekly_report')"></t-option>
              <t-option value="ssl_expire" :label="$t('page.notify_subscription.message_type_ssl_expire')"></t-option>
              <t-option value="system_error" :label="$t('page.notify_subscription.message_type_system_error')"></t-option>
              <t-option value="ip_ban" :label="$t('page.notify_subscription.message_type_ip_ban')"></t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.notify_subscription.label_filter_json')" name="filter_json">
            <t-textarea :style="{ width: '480px' }" v-model="batchFormData.filter_json" :rows="3" :placeholder="$t('page.notify_subscription.filter_json_placeholder')"></t-textarea>
          </t-form-item>
          <t-form-item :label="$t('common.status')" name="status">
            <t-radio-group v-model="batchFormData.status">
              <t-radio :value="1">{{ $t('common.on') }}</t-radio>
              <t-radio :value="0">{{ $t('common.off') }}</t-radio>
            </t-radio-group>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="batchFormData.remarks" :rows="3"></t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseBatchBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
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
import {
  getNotifySubscriptionList,
  addNotifySubscription,
  editNotifySubscription,
  deleteNotifySubscription,
} from '@/apis/notify_subscription';
import { getNotifyChannelList } from '@/apis/notify_channel';

const INITIAL_DATA = {
  channel_id: '',
  message_type: '',
  filter_json: '',
  status: 1,
  remarks: '',
};

const BATCH_INITIAL_DATA = {
  channel_id: '',
  message_types: [],
  filter_json: '',
  status: 1,
  remarks: '',
};

export default Vue.extend({
  name: 'NotifySubscription',
  data() {
    return {
      data: [],
      dataLoading: false,
      channelList: [],
      columns: [
        { colKey: 'row-select', type: 'multiple', width: 50, fixed: 'left' },
        { title: this.$t('page.notify_subscription.label_channel'), colKey: 'channel_id', width: 150 },
        { title: this.$t('page.notify_subscription.label_message_type'), colKey: 'message_type', width: 150 },
        { title: this.$t('common.status'), colKey: 'status', width: 100 },
        { title: this.$t('common.remarks'), colKey: 'remarks', ellipsis: true, width: 200 },
        { title: this.$t('common.create_time'), colKey: 'create_time', width: 180 },
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
        pageSize: 20,
        total: 0,
        current: 1,
      },
      searchformData: {
        pageIndex: 1,
        pageSize: 20,
        message_type: '',
      },
      formData: { ...INITIAL_DATA },
      formEditData: { ...INITIAL_DATA },
      batchFormData: { ...BATCH_INITIAL_DATA },
      rules: {
        channel_id: [{ required: true, message: this.$t('common.required'), type: 'error' }],
        message_type: [{ required: true, message: this.$t('common.required'), type: 'error' }],
      },
      batchRules: {
        channel_id: [{ required: true, message: this.$t('common.required'), type: 'error' }],
        message_types: [{ required: true, message: this.$t('common.required'), type: 'error' }],
      },
      addFormVisible: false,
      editFormVisible: false,
      batchAddFormVisible: false,
      confirmVisible: false,
      confirmBody: '',
      offsetTop: 0,
    };
  },
  mounted() {
    this.loadChannelList();
    this.getList();
  },
  methods: {
    getContainer() {
      return document.querySelector('.tdesign-starter-main');
    },
    async loadChannelList() {
      try {
        const res = await getNotifyChannelList({ pageIndex: 1, pageSize: 100, status: 1 });
        if (res.code === 0) {
          this.channelList = res.data.list || [];
        }
      } catch (e) {
        console.error(e);
      }
    },
    async getList() {
      this.dataLoading = true;
      try {
        const res = await getNotifySubscriptionList(this.searchformData);
        if (res.code === 0) {
          this.data = res.data.list || [];
          this.pagination.total = res.data.total;
          this.pagination.current = this.searchformData.pageIndex;
          this.pagination.pageSize = this.searchformData.pageSize;
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.dataLoading = false;
      }
    },
    getChannelName(channelId: string) {
      const channel = this.channelList.find((c: any) => c.id === channelId);
      return channel ? channel.name : channelId;
    },
    getMessageTypeName(type: string) {
      const typeMap: any = {
        rule_trigger: this.$t('page.notify_subscription.message_type_rule_trigger'),
        operation_notice: this.$t('page.notify_subscription.message_type_operation_notice'),
        user_login: this.$t('page.notify_subscription.message_type_user_login'),
        attack_info: this.$t('page.notify_subscription.message_type_attack_info'),
        weekly_report: this.$t('page.notify_subscription.message_type_weekly_report'),
        ssl_expire: this.$t('page.notify_subscription.message_type_ssl_expire'),
        system_error: this.$t('page.notify_subscription.message_type_system_error'),
        ip_ban: this.$t('page.notify_subscription.message_type_ip_ban'),
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
    handleAdd() {
      this.formData = { ...INITIAL_DATA };
      this.addFormVisible = true;
    },
    handleBatchAdd() {
      this.batchFormData = { ...BATCH_INITIAL_DATA };
      this.batchAddFormVisible = true;
    },
    handleClickEdit(e: any) {
      this.formEditData = { ...e.row };
      this.editFormVisible = true;
    },
    handleClickDelete(e: any) {
      this.formEditData = { ...e.row };
      this.confirmBody = this.$t('page.notify_subscription.delete_confirm');
      this.confirmVisible = true;
    },
    async handleStatusChange(row: any) {
      try {
        const res = await editNotifySubscription(row);
        if (res.code === 0) {
          MessagePlugin.success(this.$t('common.tips.save_success'));
        } else {
          row.status = row.status === 1 ? 0 : 1;
          MessagePlugin.error(this.$t('common.tips.save_failed'));
        }
      } catch (error) {
        row.status = row.status === 1 ? 0 : 1;
        MessagePlugin.error(this.$t('common.tips.save_failed'));
      }
    },
    // 检查订阅是否已存在
    checkSubscriptionExists(channelId: string, messageType: string) {
      return this.data.some((item: any) => 
        item.channel_id === channelId && item.message_type === messageType
      );
    },
    async onSubmit({ validateResult, firstError }: any) {
      if (validateResult === true) {
        // 检查重复订阅
        if (this.checkSubscriptionExists(this.formData.channel_id, this.formData.message_type)) {
          MessagePlugin.warning(this.$t('page.notify_subscription.already_subscribed'));
          return;
        }
        
        try {
          const res = await addNotifySubscription(this.formData);
          if (res.code === 0) {
            MessagePlugin.success(this.$t('page.notify_subscription.add_success'));
            this.addFormVisible = false;
            this.getList();
          } else {
            MessagePlugin.error(res.msg || this.$t('page.notify_subscription.add_failed'));
          }
        } catch (error) {
          MessagePlugin.error(this.$t('page.notify_subscription.add_failed'));
        }
      } else {
        MessagePlugin.warning(firstError);
      }
    },
    async onBatchSubmit({ validateResult, firstError }: any) {
      if (validateResult === true) {
        if (!this.batchFormData.message_types || this.batchFormData.message_types.length === 0) {
          MessagePlugin.warning(this.$t('page.notify_subscription.select_message_types'));
          return;
        }

        // 过滤掉已存在的订阅
        const newMessageTypes = this.batchFormData.message_types.filter((type: string) => 
          !this.checkSubscriptionExists(this.batchFormData.channel_id, type)
        );

        if (newMessageTypes.length === 0) {
          MessagePlugin.warning(this.$t('page.notify_subscription.already_subscribed'));
          return;
        }

        // 提示有重复的
        if (newMessageTypes.length < this.batchFormData.message_types.length) {
          const skippedCount = this.batchFormData.message_types.length - newMessageTypes.length;
          MessagePlugin.info(`已跳过 ${skippedCount} 个已存在的订阅`);
        }

        try {
          let successCount = 0;
          let failCount = 0;

          // 批量添加
          for (const messageType of newMessageTypes) {
            const data = {
              channel_id: this.batchFormData.channel_id,
              message_type: messageType,
              filter_json: this.batchFormData.filter_json,
              status: this.batchFormData.status,
              remarks: this.batchFormData.remarks,
            };

            try {
              const res = await addNotifySubscription(data);
              if (res.code === 0) {
                successCount++;
              } else {
                failCount++;
              }
            } catch {
              failCount++;
            }
          }

          if (failCount === 0) {
            MessagePlugin.success(this.$t('page.notify_subscription.batch_add_success', { count: successCount }));
          } else {
            MessagePlugin.warning(this.$t('page.notify_subscription.batch_add_partial_success', { success: successCount, failed: failCount }));
          }

          this.batchAddFormVisible = false;
          this.getList();
        } catch (error) {
          MessagePlugin.error(this.$t('page.notify_subscription.add_failed'));
        }
      } else {
        MessagePlugin.warning(firstError);
      }
    },
    async onSubmitEdit({ validateResult, firstError }: any) {
      if (validateResult === true) {
        try {
          const res = await editNotifySubscription(this.formEditData);
          if (res.code === 0) {
            MessagePlugin.success(this.$t('page.notify_subscription.edit_success'));
            this.editFormVisible = false;
            this.getList();
          } else {
            MessagePlugin.error(res.msg || this.$t('page.notify_subscription.edit_failed'));
          }
        } catch (error) {
          MessagePlugin.error(this.$t('page.notify_subscription.edit_failed'));
        }
      } else {
        MessagePlugin.warning(firstError);
      }
    },
    async onConfirmDelete() {
      try {
        const res = await deleteNotifySubscription({ id: this.formEditData.id });
        if (res.code === 0) {
          MessagePlugin.success(this.$t('page.notify_subscription.delete_success'));
          this.confirmVisible = false;
          this.getList();
        } else {
          MessagePlugin.error(res.msg || this.$t('page.notify_subscription.delete_failed'));
        }
      } catch (error) {
        MessagePlugin.error(this.$t('page.notify_subscription.delete_failed'));
      }
    },
    onCancel() {
      this.confirmVisible = false;
    },
    onClickCloseBtn() {
      this.addFormVisible = false;
    },
    onClickCloseBatchBtn() {
      this.batchAddFormVisible = false;
    },
    onClickCloseEditBtn() {
      this.editFormVisible = false;
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

.left-operation-container {
  .t-button {
    margin-right: 8px;
  }
}
</style>



