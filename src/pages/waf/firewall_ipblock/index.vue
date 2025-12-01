<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAdd"> {{ $t('page.firewall_ipblock.button_add_ip') }} </t-button>
          <t-button @click="handleBatchAdd"> {{ $t('page.firewall_ipblock.button_batch_add') }} </t-button>
          <t-button 
            theme="danger" 
            variant="outline" 
            @click="handleBatchDelete"
            :disabled="selectedRowKeys.length === 0">
            {{ $t('page.firewall_ipblock.button_batch_delete') }}
          </t-button>
          <t-button 
            theme="success"
            variant="outline" 
            @click="handleSync">
            {{ $t('page.firewall_ipblock.button_sync') }}
          </t-button>
          <t-button 
            theme="warning"
            variant="outline" 
            @click="handleClearExpired">
            {{ $t('page.firewall_ipblock.button_clear_expired') }}
          </t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="searchForm" :data="searchformData" :label-width="80" layout="inline" colon :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.firewall_ipblock.label_website')" name="host_code">
              <t-select v-model="searchformData.host_code" clearable :style="{ width: '150px' }">
                <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                  {{ item }}
                </t-option>
              </t-select>
            </t-form-item>
            <t-form-item :label="'IP'" name="ip">
              <t-input v-model="searchformData.ip" class="search-input" clearable>
              </t-input>
            </t-form-item>
            <t-form-item :label="$t('page.firewall_ipblock.label_status')" name="status">
              <t-select v-model="searchformData.status" clearable :style="{ width: '120px' }">
                <t-option value="active" :label="$t('page.firewall_ipblock.status_active')"></t-option>
                <t-option value="inactive" :label="$t('page.firewall_ipblock.status_inactive')"></t-option>
                <t-option value="pending" :label="$t('page.firewall_ipblock.status_pending')"></t-option>
              </t-select>
            </t-form-item>
            <t-form-item :label="$t('page.firewall_ipblock.label_block_type')" name="block_type">
              <t-select v-model="searchformData.block_type" clearable :style="{ width: '120px' }">
                <t-option value="manual" :label="$t('page.firewall_ipblock.block_type_manual')"></t-option>
                <t-option value="auto" :label="$t('page.firewall_ipblock.block_type_auto')"></t-option>
                <t-option value="temp" :label="$t('page.firewall_ipblock.block_type_temp')"></t-option>
              </t-select>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>

      <!-- 统计信息卡片 -->
      <t-row :gutter="16" style="margin-bottom: 16px;">
        <t-col :span="3">
          <t-card size="small">
            <div class="stat-card">
              <div class="stat-label">{{ $t('page.firewall_ipblock.stat_total') }}</div>
              <div class="stat-value">{{ statistics.total }}</div>
            </div>
          </t-card>
        </t-col>
        <t-col :span="3">
          <t-card size="small">
            <div class="stat-card">
              <div class="stat-label">{{ $t('page.firewall_ipblock.stat_active') }}</div>
              <div class="stat-value stat-active">{{ statistics.active }}</div>
            </div>
          </t-card>
        </t-col>
        <t-col :span="3">
          <t-card size="small">
            <div class="stat-card">
              <div class="stat-label">{{ $t('page.firewall_ipblock.stat_inactive') }}</div>
              <div class="stat-value stat-inactive">{{ statistics.inactive }}</div>
            </div>
          </t-card>
        </t-col>
        <t-col :span="3">
          <t-card size="small">
            <div class="stat-card">
              <div class="stat-label">{{ $t('page.firewall_ipblock.stat_expired') }}</div>
              <div class="stat-value stat-expired">{{ statistics.expired }}</div>
            </div>
          </t-card>
        </t-col>
      </t-row>

      <t-alert theme="info" :message="$t('page.firewall_ipblock.alert_message')" close>
        <template #operation>
          <span @click="handleJumpOnlineUrl">{{ $t('common.online_document') }}</span>
        </template>
      </t-alert>
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
          @page-change="rehandlePageChange" @change="rehandleChange" @select-change="rehandleSelectChange"
          :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">

          <template #host_code="{ row }">
            <span> {{host_dic[row.host_code]}}</span>
          </template>

          <template #status="{ row }">
            <t-tag v-if="row.status === 'active'" theme="success" variant="light">
              {{ $t('page.firewall_ipblock.status_active') }}
            </t-tag>
            <t-tag v-else-if="row.status === 'inactive'" theme="default" variant="light">
              {{ $t('page.firewall_ipblock.status_inactive') }}
            </t-tag>
            <t-tag v-else-if="row.status === 'pending'" theme="warning" variant="light">
              {{ $t('page.firewall_ipblock.status_pending') }}
            </t-tag>
          </template>

          <template #block_type="{ row }">
            <t-tag v-if="row.block_type === 'manual'" theme="primary" variant="light">
              {{ $t('page.firewall_ipblock.block_type_manual') }}
            </t-tag>
            <t-tag v-else-if="row.block_type === 'auto'" theme="danger" variant="light">
              {{ $t('page.firewall_ipblock.block_type_auto') }}
            </t-tag>
            <t-tag v-else-if="row.block_type === 'temp'" theme="warning" variant="light">
              {{ $t('page.firewall_ipblock.block_type_temp') }}
            </t-tag>
          </template>

          <template #expire_time="{ row }">
            <span v-if="row.expire_time === 0">{{ $t('page.firewall_ipblock.permanent') }}</span>
            <span v-else>{{ formatExpireTime(row.expire_time) }}</span>
          </template>

          <template #op="slotProps">
            <a class="t-button-link" v-if="slotProps.row.status === 'inactive'" @click="handleClickEnable(slotProps)">
              {{ $t('page.firewall_ipblock.enable') }}
            </a>
            <a class="t-button-link" v-if="slotProps.row.status === 'active'" @click="handleClickDisable(slotProps)">
              {{ $t('page.firewall_ipblock.disable') }}
            </a>
            <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
    </t-card>

    <!-- 添加对话框 -->
    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="addForm" :rules="rules" @submit="onSubmit" :labelWidth="120">
          <t-form-item :label="$t('page.firewall_ipblock.label_website')" name="host_code">
            <t-select v-model="formData.host_code" clearable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.firewall_ipblock.label_ip')" name="ip">
            <t-input :style="{ width: '480px' }" v-model="formData.ip" 
              :placeholder="$t('page.firewall_ipblock.ip_placeholder')">
            </t-input>
          </t-form-item>
          <t-form-item :label="$t('page.firewall_ipblock.label_reason')" name="reason">
            <t-input :style="{ width: '480px' }" v-model="formData.reason">
            </t-input>
          </t-form-item>
          <t-form-item :label="$t('page.firewall_ipblock.label_block_type')" name="block_type">
            <t-select v-model="formData.block_type" :style="{ width: '480px' }">
              <t-option value="manual" :label="$t('page.firewall_ipblock.block_type_manual')"></t-option>
              <t-option value="auto" :label="$t('page.firewall_ipblock.block_type_auto')"></t-option>
              <t-option value="temp" :label="$t('page.firewall_ipblock.block_type_temp')"></t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.firewall_ipblock.label_expire_time')" name="expire_time">
            <t-date-picker 
              v-model="formData.expire_time_date"
              enable-time-picker
              clearable
              :style="{ width: '480px' }"
              :placeholder="$t('page.firewall_ipblock.expire_time_placeholder')"
            />
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formData.remarks" name="remarks">
            </t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 批量添加对话框 -->
    <t-dialog :header="$t('page.firewall_ipblock.batch_add_title')" :visible.sync="batchAddFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="batchAddFormData" ref="batchAddForm" :rules="batchAddRules" @submit="onSubmitBatchAdd" :labelWidth="120">
          <t-form-item :label="$t('page.firewall_ipblock.label_website')" name="host_code">
            <t-select v-model="batchAddFormData.host_code" clearable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.firewall_ipblock.label_ips')" name="ips">
            <t-textarea 
              :style="{ width: '480px', height: '200px' }" 
              v-model="batchAddFormData.ips_text"
              :placeholder="$t('page.firewall_ipblock.ips_placeholder')">
            </t-textarea>
          </t-form-item>
          <t-form-item :label="$t('page.firewall_ipblock.label_reason')" name="reason">
            <t-input :style="{ width: '480px' }" v-model="batchAddFormData.reason">
            </t-input>
          </t-form-item>
          <t-form-item :label="$t('page.firewall_ipblock.label_block_type')" name="block_type">
            <t-select v-model="batchAddFormData.block_type" :style="{ width: '480px' }">
              <t-option value="manual" :label="$t('page.firewall_ipblock.block_type_manual')"></t-option>
              <t-option value="auto" :label="$t('page.firewall_ipblock.block_type_auto')"></t-option>
              <t-option value="temp" :label="$t('page.firewall_ipblock.block_type_temp')"></t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="batchAddFormData.remarks">
            </t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseBatchAddBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 编辑对话框 -->
    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="editForm" :rules="rules" @submit="onSubmitEdit" :labelWidth="120">
          <t-form-item :label="$t('page.firewall_ipblock.label_website')" name="host_code">
            <t-select v-model="formEditData.host_code" clearable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.firewall_ipblock.label_ip')" name="ip">
            <t-input :style="{ width: '480px' }" v-model="formEditData.ip">
            </t-input>
          </t-form-item>
          <t-form-item :label="$t('page.firewall_ipblock.label_reason')" name="reason">
            <t-input :style="{ width: '480px' }" v-model="formEditData.reason">
            </t-input>
          </t-form-item>
          <t-form-item :label="$t('page.firewall_ipblock.label_block_type')" name="block_type">
            <t-select v-model="formEditData.block_type" :style="{ width: '480px' }">
              <t-option value="manual" :label="$t('page.firewall_ipblock.block_type_manual')"></t-option>
              <t-option value="auto" :label="$t('page.firewall_ipblock.block_type_auto')"></t-option>
              <t-option value="temp" :label="$t('page.firewall_ipblock.block_type_temp')"></t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.firewall_ipblock.label_expire_time')" name="expire_time">
            <t-date-picker 
              v-model="formEditData.expire_time_date"
              enable-time-picker
              clearable
              :style="{ width: '480px' }"
              :placeholder="$t('page.firewall_ipblock.expire_time_placeholder')"
            />
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formEditData.remarks" name="remarks">
            </t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseEditBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 删除确认对话框 -->
    <t-dialog :header="$t('common.confirm_delete')" :body="confirmBody" :visible.sync="confirmVisible" @confirm="onConfirmDelete"
      :onCancel="onCancel">
    </t-dialog>

    <!-- 批量删除确认对话框 -->
    <t-dialog 
      :header="$t('page.firewall_ipblock.confirm_batch_delete')" 
      :body="$t('common.data_delete_warning')" 
      :visible.sync="batchDeleteConfirmVisible" 
      @confirm="onConfirmBatchDelete"
      :onCancel="onCancelBatchDelete">
    </t-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SearchIcon } from 'tdesign-icons-vue';
import { prefix } from '@/config/global';
import { allhost } from '@/apis/host';
import {
  wafFirewallIPBlockListApi,
  wafFirewallIPBlockAddApi,
  wafFirewallIPBlockDetailApi,
  wafFirewallIPBlockEditApi,
  wafFirewallIPBlockDelApi,
  wafFirewallIPBlockBatchAddApi,
  wafFirewallIPBlockBatchDelApi,
  wafFirewallIPBlockEnableApi,
  wafFirewallIPBlockDisableApi,
  wafFirewallIPBlockSyncApi,
  wafFirewallIPBlockClearExpiredApi,
  wafFirewallIPBlockStatisticsApi
} from '@/apis/firewall_ipblock';

const INITIAL_DATA = {
  host_code: '',
  ip: '',
  reason: '',
  block_type: 'manual',
  expire_time: 0,
  expire_time_date: null,
  remarks: '',
};

const BATCH_ADD_INITIAL_DATA = {
  host_code: '',
  ips_text: '',
  reason: '',
  block_type: 'manual',
  remarks: '',
};

export default Vue.extend({
  name: 'FirewallIPBlockList',
  components: {
    SearchIcon,
  },
  data() {
    return {
      addFormVisible: false,
      batchAddFormVisible: false,
      editFormVisible: false,
      confirmVisible: false,
      batchDeleteConfirmVisible: false,
      formData: { ...INITIAL_DATA },
      batchAddFormData: { ...BATCH_ADD_INITIAL_DATA },
      formEditData: { ...INITIAL_DATA },
      rules: {
        host_code: [{
          required: true,
          message: this.$t('common.placeholder') + this.$t('page.firewall_ipblock.label_website'),
          type: 'error'
        }],
        ip: [{
          required: true,
          message: this.$t('common.placeholder') + this.$t('page.firewall_ipblock.label_ip'),
          type: 'error'
        }],
        block_type: [{
          required: true,
          message: this.$t('common.placeholder') + this.$t('page.firewall_ipblock.label_block_type'),
          type: 'error'
        }],
      },
      batchAddRules: {
        host_code: [{
          required: true,
          message: this.$t('common.placeholder') + this.$t('page.firewall_ipblock.label_website'),
          type: 'error'
        }],
        ips_text: [{
          required: true,
          message: this.$t('common.placeholder') + this.$t('page.firewall_ipblock.label_ips'),
          type: 'error'
        }],
      },
      prefix,
      dataLoading: false,
      data: [],
      detail_data: [],
      selectedRowKeys: [],
      statistics: {
        total: 0,
        active: 0,
        inactive: 0,
        expired: 0
      },
      columns: [
        { colKey: 'row-select', type: 'multiple', width: 64, fixed: 'left' },
        {
          title: this.$t('page.firewall_ipblock.label_website'),
          align: 'left',
          width: 200,
          ellipsis: true,
          colKey: 'host_code',
        },
        {
          title: this.$t('page.firewall_ipblock.label_ip'),
          width: 150,
          ellipsis: true,
          colKey: 'ip',
        },
        {
          title: this.$t('page.firewall_ipblock.label_reason'),
          width: 150,
          ellipsis: true,
          colKey: 'reason',
        },
        {
          title: this.$t('page.firewall_ipblock.label_block_type'),
          width: 120,
          ellipsis: true,
          colKey: 'block_type',
        },
        {
          title: this.$t('page.firewall_ipblock.label_status'),
          width: 120,
          ellipsis: true,
          colKey: 'status',
        },
        {
          title: this.$t('page.firewall_ipblock.label_expire_time'),
          width: 180,
          ellipsis: true,
          colKey: 'expire_time',
        },
        {
          title: this.$t('common.remarks'),
          width: 150,
          ellipsis: true,
          colKey: 'remarks',
        },
        {
          title: this.$t('common.create_time'),
          width: 180,
          ellipsis: true,
          colKey: 'create_time',
        },
        {
          align: 'left',
          width: 250,
          colKey: 'op',
          title: this.$t('common.op'),
        },
      ],
      rowKey: 'id',
      tableLayout: 'auto',
      verticalAlign: 'top',
      hover: true,
      rowClassName: (rowKey: string) => `${rowKey}-class`,
      pagination: {
        total: 0,
        current: 1,
        pageSize: 10
      },
      searchformData: {
        ip: "",
        host_code: "",
        status: "",
        block_type: ""
      },
      deleteIdx: -1,
      host_dic: {}
    };
  },
  computed: {
    confirmBody() {
      if (this.deleteIdx > -1) {
        return this.$t('common.data_delete_warning');
      }
      return '';
    },
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    },
  },
  mounted() {
    this.loadHostList().then(() => {
      this.getList("");
      this.getStatistics();
    });
  },
  methods: {
    loadHostList() {
      return new Promise((resolve, reject) => {
        allhost()
          .then((res) => {
            let resdata = res;
            if (resdata.code === 0) {
              let host_options = resdata.data;
              for (let i = 0; i < host_options.length; i++) {
                this.host_dic[host_options[i].value] = host_options[i].label;
              }
            }
            resolve();
          })
          .catch((e: Error) => {
            console.log(e);
            reject(e);
          });
      });
    },
    getList(keyword) {
      let that = this;
      wafFirewallIPBlockListApi({
        pageSize: that.pagination.pageSize,
        pageIndex: that.pagination.current,
        ...that.searchformData
      })
        .then((res) => {
          let resdata = res;
          if (resdata.code === 0) {
            this.data = resdata.data.list ?? [];
            this.pagination = {
              ...this.pagination,
              total: resdata.data.total,
            };
            this.loadHostList();
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
          this.dataLoading = false;
        });
      this.dataLoading = true;
    },
    getStatistics() {
      wafFirewallIPBlockStatisticsApi({})
        .then((res) => {
          let resdata = res;
          if (resdata.code === 0) {
            this.statistics = resdata.data;
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
    },
    getContainer() {
      return document.querySelector('.tdesign-starter-layout');
    },
    rehandlePageChange(curr, pageInfo) {
      this.pagination.current = curr.current;
      if (this.pagination.pageSize != curr.pageSize) {
        this.pagination.current = 1;
        this.pagination.pageSize = curr.pageSize;
      }
      this.getList("");
    },
    rehandleSelectChange(selectedRowKeys: number[]) {
      this.selectedRowKeys = selectedRowKeys;
    },
    rehandleChange(changeParams, triggerAndData) {
      console.log('统一Change', changeParams, triggerAndData);
    },
    handleAdd() {
      this.addFormVisible = true;
      this.formData = { ...INITIAL_DATA };
    },
    handleBatchAdd() {
      this.batchAddFormVisible = true;
      this.batchAddFormData = { ...BATCH_ADD_INITIAL_DATA };
    },
    onSubmit({ result, firstError }): void {
      let that = this;
      if (!firstError) {
        let postdata = { ...that.formData };
        
        // 处理过期时间
        if (that.formData.expire_time_date) {
          postdata.expire_time = Math.floor(new Date(that.formData.expire_time_date).getTime() / 1000);
        } else {
          postdata.expire_time = 0;
        }
        delete postdata.expire_time_date;

        wafFirewallIPBlockAddApi({ ...postdata })
          .then((res) => {
            let resdata = res;
            if (resdata.code === 0) {
              that.$message.success(resdata.msg);
              that.addFormVisible = false;
              that.pagination.current = 1;
              that.getList("");
              that.getStatistics();
            } else {
              that.$message.warning(resdata.msg);
            }
          })
          .catch((e: Error) => {
            console.log(e);
          });
      } else {
        that.$message.warning(firstError);
      }
    },
    onSubmitBatchAdd({ result, firstError }): void {
      let that = this;
      if (!firstError) {
        // 解析IP列表（换行分隔）
        const ips = that.batchAddFormData.ips_text
          .split('\n')
          .map(ip => ip.trim())
          .filter(ip => ip.length > 0);

        if (ips.length === 0) {
          that.$message.warning(this.$t('page.firewall_ipblock.ips_empty_warning'));
          return;
        }

        let postdata = {
          host_code: that.batchAddFormData.host_code,
          ips: ips,
          reason: that.batchAddFormData.reason,
          block_type: that.batchAddFormData.block_type,
          remarks: that.batchAddFormData.remarks,
        };

        wafFirewallIPBlockBatchAddApi({ ...postdata })
          .then((res) => {
            let resdata = res;
            if (resdata.code === 0) {
              that.$message.success(resdata.msg);
              that.batchAddFormVisible = false;
              that.pagination.current = 1;
              that.getList("");
              that.getStatistics();
            } else {
              that.$message.warning(resdata.msg);
            }
          })
          .catch((e: Error) => {
            console.log(e);
          });
      } else {
        that.$message.warning(firstError);
      }
    },
    onSubmitEdit({ result, firstError }): void {
      let that = this;
      if (!firstError) {
        let postdata = { ...that.formEditData };
        
        // 处理过期时间
        if (that.formEditData.expire_time_date) {
          postdata.expire_time = Math.floor(new Date(that.formEditData.expire_time_date).getTime() / 1000);
        } else {
          postdata.expire_time = 0;
        }
        delete postdata.expire_time_date;

        wafFirewallIPBlockEditApi({ ...postdata })
          .then((res) => {
            let resdata = res;
            if (resdata.code === 0) {
              that.$message.success(resdata.msg);
              that.editFormVisible = false;
              that.getList("");
              that.getStatistics();
            } else {
              that.$message.warning(resdata.msg);
            }
          })
          .catch((e: Error) => {
            console.log(e);
          });
      } else {
        that.$message.warning(firstError);
      }
    },
    handleClickEdit(e) {
      const { id } = e.row;
      this.editFormVisible = true;
      this.getDetail(id);
    },
    handleClickDelete(row) {
      this.deleteIdx = row.rowIndex;
      this.confirmVisible = true;
    },
    handleClickEnable(e) {
      const { id } = e.row;
      let that = this;
      wafFirewallIPBlockEnableApi({ id: id })
        .then((res) => {
          let resdata = res;
          if (resdata.code === 0) {
            that.$message.success(resdata.msg);
            that.getList("");
            that.getStatistics();
          } else {
            that.$message.warning(resdata.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
    },
    handleClickDisable(e) {
      const { id } = e.row;
      let that = this;
      wafFirewallIPBlockDisableApi({ id: id })
        .then((res) => {
          let resdata = res;
          if (resdata.code === 0) {
            that.$message.success(resdata.msg);
            that.getList("");
            that.getStatistics();
          } else {
            that.$message.warning(resdata.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
    },
    onConfirmDelete() {
      this.confirmVisible = false;
      let { id } = this.data[this.deleteIdx];
      let that = this;
      wafFirewallIPBlockDelApi({ id: id })
        .then((res) => {
          let resdata = res;
          if (resdata.code === 0) {
            that.getList("");
            that.getStatistics();
            that.$message.success(resdata.msg);
          } else {
            that.$message.warning(resdata.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
      this.resetIdx();
    },
    onCancel() {
      this.resetIdx();
    },
    resetIdx() {
      this.deleteIdx = -1;
    },
    handleBatchDelete() {
      if (this.selectedRowKeys.length === 0) {
        this.$message.warning(this.$t('page.firewall_ipblock.no_data_selected'));
        return;
      }
      this.batchDeleteConfirmVisible = true;
    },
    onConfirmBatchDelete() {
      this.batchDeleteConfirmVisible = false;
      let that = this;

      wafFirewallIPBlockBatchDelApi({ ids: this.selectedRowKeys })
        .then((res) => {
          let resdata = res;
          if (resdata.code === 0) {
            that.getList("");
            that.getStatistics();
            that.$message.success(that.$t('page.firewall_ipblock.batch_delete_success'));
            that.selectedRowKeys = [];
          } else {
            that.$message.warning(resdata.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
    },
    onCancelBatchDelete() {
      this.batchDeleteConfirmVisible = false;
    },
    handleSync() {
      let that = this;
      wafFirewallIPBlockSyncApi({ host_code: this.searchformData.host_code })
        .then((res) => {
          let resdata = res;
          if (resdata.code === 0) {
            that.$message.success(resdata.msg);
            that.getList("");
            that.getStatistics();
          } else {
            that.$message.warning(resdata.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
    },
    handleClearExpired() {
      let that = this;
      wafFirewallIPBlockClearExpiredApi({})
        .then((res) => {
          let resdata = res;
          if (resdata.code === 0) {
            that.$message.success(resdata.msg);
            that.getList("");
            that.getStatistics();
          } else {
            that.$message.warning(resdata.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
    },
    onClickCloseBtn(): void {
      this.addFormVisible = false;
      this.formData = { ...INITIAL_DATA };
    },
    onClickCloseBatchAddBtn(): void {
      this.batchAddFormVisible = false;
      this.batchAddFormData = { ...BATCH_ADD_INITIAL_DATA };
    },
    onClickCloseEditBtn(): void {
      this.editFormVisible = false;
      this.formEditData = { ...INITIAL_DATA };
    },
    getDetail(id) {
      let that = this;
      wafFirewallIPBlockDetailApi({ id: id })
        .then((res) => {
          let resdata = res;
          if (resdata.code === 0) {
            that.detail_data = resdata.data;
            // 处理过期时间显示（直接使用Date对象，保持本地时区）
            let expireTimeDate = null;
            if (resdata.data.expire_time > 0) {
              expireTimeDate = new Date(resdata.data.expire_time * 1000);
            }
            
            // 组装表单数据，添加时间选择器需要的字段
            that.formEditData = {
              ...resdata.data,
              expire_time_date: expireTimeDate
            };
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
    },
    formatExpireTime(timestamp) {
      if (timestamp === 0) {
        return this.$t('page.firewall_ipblock.permanent');
      }
      const date = new Date(timestamp * 1000);
      const now = new Date();
      if (date < now) {
        return this.$t('page.firewall_ipblock.expired');
      }
      return date.toLocaleString();
    },
    handleJumpOnlineUrl() {
      window.open(this.samwafglobalconfig.getOnlineUrl() + "/guide/FirewallIPBlock.html");
    },
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables';

.left-operation-container {
  padding: 0 0 6px 0;
  margin-bottom: 16px;
}

.search-input {
  width: 360px;
}

.t-button + .t-button {
  margin-left: @spacer;
}

.stat-card {
  text-align: center;
  padding: 8px 0;

  .stat-label {
    font-size: 12px;
    color: var(--td-text-color-secondary);
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: var(--td-text-color-primary);

    &.stat-active {
      color: #52c41a;
    }

    &.stat-inactive {
      color: #8c8c8c;
    }

    &.stat-expired {
      color: #faad14;
    }
  }
}
</style>
