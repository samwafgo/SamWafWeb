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
            <t-alert theme="info" :title="$t('page.ip_failure.rule_guide_title')" :close="false" class="rule-guide-alert">
              <template #message>
                <div class="rule-guide-content">
                  <div class="rule-important-notice">
                    <t-icon name="info-circle" class="notice-icon" />
                    <span>{{ $t('page.ip_failure.rule_guide_notice') }}</span>
                    <t-button theme="primary" size="small" @click="goToRulePage" class="goto-rule-btn">
                      {{ $t('page.ip_failure.goto_rule_page') }}
                      <t-icon name="arrow-right" />
                    </t-button>
                  </div>
                  <div class="rule-section">
                    <h4>{{ $t('page.ip_failure.rule_example') }}</h4>
                    <pre class="code-block">rule R80798f795d7947419ba6f593708b4013 "禁止5分钟内失败10次的IP访问" salience 10 {
  when
    MF.GetIPFailureCount(5) > 10
  then
    Retract("R80798f795d7947419ba6f593708b4013");
}</pre>
                  </div>
                  <div class="rule-section">
                    <h4>{{ $t('page.ip_failure.system_params') }}</h4>
                    <ul class="params-list">
                      <li><strong>ip_failure_ban_time_window</strong>: {{ $t('page.ip_failure.param_time_window_desc') }}</li>
                      <li><strong>ip_failure_ban_max_count</strong>: {{ $t('page.ip_failure.param_max_count_desc') }}</li>
                    </ul>
                  </div>
                </div>
              </template>
            </t-alert>
            
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
    goToRulePage() {
      this.$router.push({ name: 'WafRule' });
    },
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
.rule-guide-alert {
  margin-bottom: 24px;
}
.rule-guide-content {
  .rule-important-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: var(--td-warning-color-1);
    border: 1px solid var(--td-warning-color-3);
    border-radius: 6px;
    margin-bottom: 16px;
    
    .notice-icon {
      font-size: 18px;
      color: var(--td-warning-color);
      flex-shrink: 0;
    }
    
    span {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: var(--td-warning-color-9);
    }
    
    .goto-rule-btn {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
  
  .rule-section {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }
    
    .code-block {
      background: var(--td-bg-color-component);
      border: 1px solid var(--td-border-level-1-color);
      border-radius: 3px;
      padding: 12px;
      margin: 0;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.6;
      color: var(--td-text-color-primary);
      overflow-x: auto;
    }
    
    .params-list {
      margin: 0;
      padding-left: 20px;
      
      li {
        margin-bottom: 6px;
        font-size: 13px;
        color: var(--td-text-color-secondary);
        
        &:last-child {
          margin-bottom: 0;
        }
        
        strong {
          color: var(--td-brand-color);
          font-family: 'Courier New', Courier, monospace;
        }
      }
    }
  }
}
</style>
