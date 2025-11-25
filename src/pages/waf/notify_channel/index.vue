<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAdd">{{ $t('page.notify_channel.button_add') }}</t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="80" layout="inline" colon :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.notify_channel.label_name')" name="name">
              <t-input v-model="searchformData.name" class="search-input" clearable></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.label_type')" name="type">
              <t-select v-model="searchformData.type" clearable :style="{ width: '150px' }">
                <t-option value="dingtalk" :label="$t('page.notify_channel.type_dingtalk')">
                  {{ $t('page.notify_channel.type_dingtalk') }}
                </t-option>
                <t-option value="feishu" :label="$t('page.notify_channel.type_feishu')">
                  {{ $t('page.notify_channel.type_feishu') }}
                </t-option>
              </t-select>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" @click="getList">{{ $t('common.search') }}</t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <t-alert theme="info" :message="$t('page.notify_channel.alert_message')" close>
      </t-alert>
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="pagination" :loading="dataLoading" @page-change="rehandlePageChange" @change="rehandleChange"
          :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">
          <template #type="{ row }">
            <t-tag v-if="row.type === 'dingtalk'" theme="primary">{{ $t('page.notify_channel.type_dingtalk') }}</t-tag>
            <t-tag v-else-if="row.type === 'feishu'" theme="success">{{ $t('page.notify_channel.type_feishu') }}</t-tag>
            <t-tag v-else theme="default">{{ row.type }}</t-tag>
          </template>
          <template #status="{ row }">
            <t-switch v-model="row.status" :customValue="[1, 0]" @change="handleStatusChange(row)"></t-switch>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleTest(slotProps)">{{ $t('page.notify_channel.button_test') }}</a>
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
          <t-form-item :label="$t('page.notify_channel.label_name')" name="name">
            <t-input :style="{ width: '480px' }" v-model="formData.name" :placeholder="$t('page.notify_channel.name_placeholder')"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.notify_channel.label_type')" name="type">
            <t-select v-model="formData.type" :style="{ width: '480px' }">
              <t-option value="dingtalk" :label="$t('page.notify_channel.type_dingtalk')"></t-option>
              <t-option value="feishu" :label="$t('page.notify_channel.type_feishu')"></t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.notify_channel.label_webhook_url')" name="webhook_url">
            <t-input :style="{ width: '480px' }" v-model="formData.webhook_url" :placeholder="$t('page.notify_channel.webhook_placeholder')"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.notify_channel.label_secret')" name="secret">
            <t-input :style="{ width: '480px' }" v-model="formData.secret" type="password" :placeholder="$t('page.notify_channel.secret_placeholder')"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.notify_channel.label_status')" name="status">
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
          <t-form-item :label="$t('page.notify_channel.label_name')" name="name">
            <t-input :style="{ width: '480px' }" v-model="formEditData.name"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.notify_channel.label_type')" name="type">
            <t-select v-model="formEditData.type" :style="{ width: '480px' }">
              <t-option value="dingtalk" :label="$t('page.notify_channel.type_dingtalk')"></t-option>
              <t-option value="feishu" :label="$t('page.notify_channel.type_feishu')"></t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.notify_channel.label_webhook_url')" name="webhook_url">
            <t-input :style="{ width: '480px' }" v-model="formEditData.webhook_url"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.notify_channel.label_secret')" name="secret">
            <t-input :style="{ width: '480px' }" v-model="formEditData.secret" type="password"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.notify_channel.label_status')" name="status">
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
  getNotifyChannelList,
  addNotifyChannel,
  editNotifyChannel,
  deleteNotifyChannel,
  testNotifyChannel,
} from '@/apis/notify_channel';

const INITIAL_DATA = {
  name: '',
  type: 'dingtalk',
  webhook_url: '',
  secret: '',
  access_token: '',
  config_json: '',
  status: 1,
  remarks: '',
};

export default Vue.extend({
  name: 'NotifyChannel',
  data() {
    return {
      data: [],
      dataLoading: false,
      value: 'first',
      columns: [
        { colKey: 'row-select', type: 'multiple', width: 50, fixed: 'left' },
        { title: this.$t('page.notify_channel.label_name'), colKey: 'name', width: 150 },
        { title: this.$t('page.notify_channel.label_type'), colKey: 'type', width: 120 },
        { title: this.$t('page.notify_channel.label_webhook_url'), colKey: 'webhook_url', ellipsis: true },
        { title: this.$t('page.notify_channel.label_status'), colKey: 'status', width: 100 },
        { title: this.$t('common.remarks'), colKey: 'remarks', ellipsis: true, width: 200 },
        { title: this.$t('common.create_time'), colKey: 'create_time', width: 180 },
        {
          align: 'left',
          fixed: 'right',
          width: 200,
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
        name: '',
        type: '',
      },
      formData: { ...INITIAL_DATA },
      formEditData: { ...INITIAL_DATA },
      rules: {
        name: [{ required: true, message: this.$t('common.required'), type: 'error' }],
        type: [{ required: true, message: this.$t('common.required'), type: 'error' }],
        webhook_url: [{ required: true, message: this.$t('common.required'), type: 'error' }],
      },
      addFormVisible: false,
      editFormVisible: false,
      confirmVisible: false,
      confirmBody: '',
      offsetTop: 0,
    };
  },
  computed: {},
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
        const res = await getNotifyChannelList(this.searchformData);
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
      this.confirmBody = this.$t('page.notify_channel.delete_confirm');
      this.confirmVisible = true;
    },
    async handleTest(e: any) {
      try {
        const res = await testNotifyChannel({ id: e.row.id });
        if (res.code === 0) {
          MessagePlugin.success(this.$t('page.notify_channel.test_success'));
        } else {
          MessagePlugin.error(this.$t('page.notify_channel.test_failed') + ': ' + res.msg);
        }
      } catch (error) {
        MessagePlugin.error(this.$t('page.notify_channel.test_failed'));
      }
    },
    async handleStatusChange(row: any) {
      try {
        const res = await editNotifyChannel(row);
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
          const res = await addNotifyChannel(this.formData);
          if (res.code === 0) {
            MessagePlugin.success(this.$t('page.notify_channel.add_success'));
            this.addFormVisible = false;
            this.getList();
          } else {
            MessagePlugin.error(res.msg || this.$t('page.notify_channel.add_failed'));
          }
        } catch (error) {
          MessagePlugin.error(this.$t('page.notify_channel.add_failed'));
        }
      } else {
        MessagePlugin.warning(firstError);
      }
    },
    async onSubmitEdit({ validateResult, firstError }: any) {
      if (validateResult === true) {
        try {
          const res = await editNotifyChannel(this.formEditData);
          if (res.code === 0) {
            MessagePlugin.success(this.$t('page.notify_channel.edit_success'));
            this.editFormVisible = false;
            this.getList();
          } else {
            MessagePlugin.error(res.msg || this.$t('page.notify_channel.edit_failed'));
          }
        } catch (error) {
          MessagePlugin.error(this.$t('page.notify_channel.edit_failed'));
        }
      } else {
        MessagePlugin.warning(firstError);
      }
    },
    async onConfirmDelete() {
      try {
        const res = await deleteNotifyChannel({ id: this.formEditData.id });
        if (res.code === 0) {
          MessagePlugin.success(this.$t('page.notify_channel.delete_success'));
          this.confirmVisible = false;
          this.getList();
        } else {
          MessagePlugin.error(res.msg || this.$t('page.notify_channel.delete_failed'));
        }
      } catch (error) {
        MessagePlugin.error(this.$t('page.notify_channel.delete_failed'));
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

.search-input {
  width: 200px;
}

.left-operation-container {
  .t-button {
    margin-right: 8px;
  }
}
</style>




