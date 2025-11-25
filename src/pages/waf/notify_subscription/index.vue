<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAdd">{{ $t('page.notify_subscription.button_add') }}</t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="80" layout="inline" colon :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.notify_subscription.label_message_type')" name="message_type">
              <t-select v-model="searchformData.message_type" clearable :style="{ width: '150px' }">
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
        defaultPageSize: 20,
        total: 0,
        defaultCurrent: 1,
      },
      searchformData: {
        pageIndex: 1,
        pageSize: 20,
        message_type: '',
      },
      formData: { ...INITIAL_DATA },
      formEditData: { ...INITIAL_DATA },
      rules: {
        channel_id: [{ required: true, message: this.$t('common.required'), type: 'error' }],
        message_type: [{ required: true, message: this.$t('common.required'), type: 'error' }],
      },
      addFormVisible: false,
      editFormVisible: false,
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
    async onSubmit({ validateResult, firstError }: any) {
      if (validateResult === true) {
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



