<template>
  <div>
    <t-card class="list-card-container">
      <t-tabs v-model="activeTab">
        <t-tab-panel value="ban_list" :label="$t('page.ip_failure.ban_list')">
          <div class="table-container">
            <div class="operation-container">
              <t-button theme="primary" @click="getList"> {{ $t('common.refresh') }} </t-button>
            </div>
            <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
              :pagination="pagination" :loading="dataLoading" @page-change="rehandlePageChange">
              <template #op="slotProps">
                <a class="t-button-link" @click="handleClickDetail(slotProps)">{{ $t('common.details') }}</a>
                <a class="t-button-link" @click="handleClickUnban(slotProps)" style="margin-left: 8px;">{{ $t('page.ip_failure.unban') }}</a>
              </template>
            </t-table>
          </div>
        </t-tab-panel>
        
        <t-tab-panel value="config" :label="$t('page.ip_failure.config')">
          <div class="config-container">
            <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="180">
              <t-form-item :label="$t('page.ip_failure.enabled')" name="enabled">
                <t-switch v-model="formData.enabled" :customValue="[1, 0]"></t-switch>
              </t-form-item>
              <t-form-item :label="$t('page.ip_failure.status_codes')" name="status_codes">
                <t-input v-model="formData.status_codes" :placeholder="$t('page.ip_failure.status_codes_placeholder')" :style="{ width: '480px' }"></t-input>
                <div class="desc">{{ $t('page.ip_failure.status_codes_desc') }}</div>
              </t-form-item>
              <t-form-item :label="$t('page.ip_failure.lock_time')" name="lock_time">
                <t-input-number v-model="formData.lock_time" :min="1" :style="{ width: '480px' }"></t-input-number>
                <span class="unit">{{ $t('common.unit_minute') }}</span>
                <div class="desc">{{ $t('page.ip_failure.lock_time_desc') }}</div>
              </t-form-item>
              <t-form-item>
                <t-button theme="primary" type="submit">{{ $t('common.save') }}</t-button>
              </t-form-item>
            </t-form>
          </div>
        </t-tab-panel>
      </t-tabs>
    </t-card>

    <t-dialog
      :header="$t('page.attack_log.attack_ip_visit_detail_list_header')"
      :visible.sync="visitDetailVisible"
      width="100%"
      :confirmOnEnter="true"
      :onConfirm="resetChildState"
      :onClose="resetChildState"
    >
      <web-log-list ref="childLog" :attack_ip="trans_to_parent_ip"></web-log-list>
    </t-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  wafIPFailureGetConfigApi,
  wafIPFailureSetConfigApi,
  wafIPFailureGetBanListApi,
  wafIPFailureRemoveBanIpApi
} from '@/apis/ip_failure';
import WebLogList from '@/pages/waf/attack/index.vue';

export default Vue.extend({
  name: 'IPFailure',
  components: {
    WebLogList
  },
  data() {
    return {
      activeTab: 'ban_list',
      formData: {
        enabled: 0,
        status_codes: '',
        lock_time: 10,
      },
      rules: {
        status_codes: [{ required: true, message: this.$t('common.required'), type: 'error' }],
        lock_time: [{ required: true, message: this.$t('common.required'), type: 'error' }],
      },
      dataLoading: false,
      data: [],
      pagination: {
        total: 0,
        current: 1,
        pageSize: 10
      },
      columns: [
        { title: this.$t('page.ip_failure.ip'), colKey: 'ip', width: 150 },
        { title: this.$t('page.ip_failure.fail_count'), colKey: 'fail_count', width: 100 },
        { title: this.$t('page.ip_failure.trigger_minutes'), colKey: 'trigger_minutes', width: 120 },
        { title: this.$t('page.ip_failure.trigger_count'), colKey: 'trigger_count', width: 120 },
        { title: this.$t('page.ip_failure.first_time'), colKey: 'first_time', width: 180 },
        { title: this.$t('page.ip_failure.last_time'), colKey: 'last_time', width: 180 },
        { title: this.$t('page.ip_failure.remain_time'), colKey: 'remain_time', width: 120 },
        { title: this.$t('page.ip_failure.region'), colKey: 'region', width: 150 },
        { title: this.$t('common.op'), colKey: 'op', width: 100, fixed: 'right' },
      ],
      rowKey: 'ip',
      verticalAlign: 'top',
      hover: true,
      visitDetailVisible: false, // 访问详情弹窗
      trans_to_parent_ip: '', // 传递给子组件的IP
    };
  },
  mounted() {
    this.getConfig();
    this.getList();
  },
  methods: {
    getConfig() {
      wafIPFailureGetConfigApi().then(res => {
        if (res.code === 0) {
          this.formData = res.data;
        }
      });
    },
    onSubmit({ result, firstError }) {
      if (!firstError) {
        wafIPFailureSetConfigApi(this.formData).then(res => {
          if (res.code === 0) {
            this.$message.success(res.msg);
            this.getConfig();
          } else {
            this.$message.warning(res.msg);
          }
        });
      } else {
        this.$message.warning(firstError);
      }
    },
    getList() {
      this.dataLoading = true;
      wafIPFailureGetBanListApi({
        pageIndex: this.pagination.current,
        pageSize: this.pagination.pageSize,
      }).then(res => {
        if (res.code === 0) {
          this.data = res.data.list || [];
          this.pagination.total = res.data.total;
        }
      }).finally(() => {
        this.dataLoading = false;
      });
    },
    rehandlePageChange(curr) {
      this.pagination.current = curr.current;
      this.pagination.pageSize = curr.pageSize;
      this.getList();
    },
    handleClickDetail(e) {
      const { ip } = e.row;
      this.visitDetailVisible = true;
      this.trans_to_parent_ip = ip;
    },
    resetChildState() {
      this.visitDetailVisible = false;
      const childLog = this.$refs.childLog as any;
      if (childLog && childLog.resetState) {
        childLog.resetState();
      }
    },
    handleClickUnban(row) {
      let dialogInstance  = this.$dialog.confirm({
        header: this.$t('common.confirm_unban'),
        body: this.$t('common.confirm_unban_content', { ip: row.row.ip }),
        onConfirm: () => {
          return wafIPFailureRemoveBanIpApi({ ip: row.row.ip }).then(res => {
            if (res.code === 0) {
              this.$message.success(res.msg);
              this.getList();
              dialogInstance.destroy();
            } else {
              this.$message.warning(res.msg);
            }
          }).catch(err => {
            this.$message.error(err.message || '解封失败');
            dialogInstance.destroy();
          });
        },
      });
    },
  },
});
</script>

<style lang="less" scoped>
.config-container {
  padding: 20px;
}
.desc {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  margin-top: 4px;
}
.unit {
  margin-left: 8px;
}
.operation-container {
  margin-bottom: 16px;
}
</style>
