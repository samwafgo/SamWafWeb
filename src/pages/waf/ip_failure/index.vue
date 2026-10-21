<template>
  <div>
    <component :is="embedded ? 'div' : 't-card'" :class="{ 'list-card-container': !embedded }">
      <t-tabs v-if="!embedded && panel === 'all'" v-model="activeTab">
        <t-tab-panel value="ban_list" :label="$t('page.ip_failure.ban_list')" />
        <t-tab-panel value="config" :label="$t('page.ip_failure.config')" />
      </t-tabs>
      <div v-if="selectedPanel === 'ban_list'" class="table-container">
            <t-alert theme="info" :message="$t('page.ip_ban.failure_list_notice')" :close="false" class="list-notice" />
            <div class="operation-container">
              <t-button theme="primary" @click="getList"> {{ $t('common.refresh') }} </t-button>
            </div>
            <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
              :pagination="pagination" :loading="dataLoading" @page-change="rehandlePageChange">
              <template #ip="{ row }">
                <t-tooltip :content="$t('common.ip_lookup.click_tip')">
                  <a class="ipl-link" @click="openIpLookup(row.ip)">{{ row.ip }}</a>
                </t-tooltip>
              </template>
              <template #op="slotProps">
                <a class="t-button-link" @click="handleClickDetail(slotProps)">{{ $t('common.details') }}</a>
                <a class="t-button-link" @click="handleClickUnban(slotProps)" style="margin-left: 8px;">{{ $t('page.ip_ban.failure_clear') }}</a>
              </template>
            </t-table>
          </div>

          <div v-if="selectedPanel === 'config'" class="config-container">
            <p class="cfg-desc">{{ $t('page.ip_ban.failure_guide') }}</p>
            <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="100">
              <t-form-item :label="$t('page.ip_ban.failure_enabled')" name="enabled">
                <t-switch v-model="formData.enabled" :customValue="[1, 0]"></t-switch>
              </t-form-item>
              <t-form-item :label="$t('page.ip_failure.status_codes')" name="status_codes">
                <t-input v-model="formData.status_codes" :placeholder="$t('page.ip_failure.status_codes_placeholder')" :style="{ width: '480px' }"></t-input>
                <div class="desc">{{ $t('page.ip_failure.status_codes_desc') }}</div>
              </t-form-item>
              <t-form-item :label="$t('page.ip_ban.failure_retention')" name="lock_time">
                <t-input-number v-model="formData.lock_time" :min="1" :style="{ width: '480px' }"></t-input-number>
                <span class="unit">{{ $t('common.unit_minute') }}</span>
                <div class="desc">{{ $t('page.ip_ban.failure_retention_desc') }}</div>
              </t-form-item>
              <div class="example">
                <div class="example-head">
                  <span class="example-title">{{ $t('page.ip_failure.rule_example') }}</span>
                  <div class="example-ops">
                    <t-button variant="outline" size="small" @click="copyExample">{{ $t('common.copy') }}</t-button>
                    <t-button variant="outline" size="small" @click="goToRulePage">{{ $t('page.ip_failure.goto_rule_page') }}</t-button>
                  </div>
                </div>
                <pre class="example-code">{{ exampleCode }}</pre>
                <div class="example-foot">{{ $t('page.ip_ban.failure_example_desc') }}</div>
              </div>
              <t-form-item class="cfg-foot">
                <t-button theme="primary" type="submit">{{ $t('common.save') }}</t-button>
              </t-form-item>
            </t-form>
      </div>
    </component>

    <t-dialog
      :header="$t('page.attack_log.attack_ip_visit_detail_list_header')"
      :visible.sync="visitDetailVisible"
      width="100%"
      :confirmOnEnter="true"
      :onConfirm="resetChildState"
      :onClose="resetChildState"
    >
      <web-log-list v-if="visitDetailVisible" ref="childLog" :attack_ip="trans_to_parent_ip"></web-log-list>
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
  props: {
    panel: {
      type: String,
      default: 'all',
      validator: (value: string) => ['all', 'ban_list', 'config'].includes(value),
    },
    embedded: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      activeTab: 'ban_list',
      exampleCode: 'rule R80798f795d7947419ba6f593708b4013 "5分钟内失败超过10次，封禁10分钟" salience 10 {\n  when\n    MF.GetIPFailureCount(5) > 10\n  then\n    RF.Ban(10);\n}',
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
        { title: this.$t('page.ip_failure.ip'), colKey: 'ip', cell: 'ip', width: 150 },
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
  computed: {
    selectedPanel(): string {
      return this.panel === 'all' ? this.activeTab : this.panel;
    },
  },
  watch: {
    selectedPanel: {
      immediate: true,
      handler(value: string) {
        if (value === 'ban_list') this.getList();
        if (value === 'config') this.getConfig();
      },
    },
  },
  methods: {
    // 点 IP 开查询交给页面级按钮统一处理
    openIpLookup(ip) {
      if (!ip) return;
      this.$emit('ip-lookup', ip);
    },
    copyExample() {
      const done = () => this.$message.success(this.$t('page.ip_failure.copy_success'));
      const fail = () => this.$message.warning(this.$t('page.ip_failure.copy_failed'));
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(this.exampleCode).then(done).catch(fail);
      } else {
        fail();
      }
    },
    goToRulePage() {
      this.$router.push({ name: 'WafRule' });
    },
    getConfig() {
      wafIPFailureGetConfigApi().then(res => {
        if (res && res.code === 0 && res.data) {
          this.formData = res.data;
        } else {
          this.$message.warning((res && res.msg) || this.$t('common.tips.api_error'));
        }
      }).catch(() => {
        this.$message.error(this.$t('common.tips.api_error'));
      });
    },
    onSubmit({ result, firstError }) {
      if (!firstError) {
        wafIPFailureSetConfigApi(this.formData).then(res => {
          if (res && res.code === 0) {
            this.$message.success(res.msg);
            this.getConfig();
          } else {
            this.$message.warning((res && res.msg) || this.$t('common.tips.save_failed'));
          }
        }).catch(() => {
          this.$message.error(this.$t('common.tips.save_failed'));
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
        if (res && res.code === 0 && res.data) {
          this.data = (Array.isArray(res.data.list) ? res.data.list : []).filter(Boolean);
          this.pagination.total = res.data.total || 0;
        } else {
          this.$message.warning((res && res.msg) || this.$t('common.tips.api_error'));
        }
      }).catch(() => {
        this.$message.error(this.$t('common.tips.api_error'));
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
        header: this.$t('page.ip_ban.failure_clear'),
        body: this.$t('page.ip_ban.failure_clear_confirm', { ip: row.row.ip }),
        onConfirm: () => {
          return wafIPFailureRemoveBanIpApi({ ip: row.row.ip }).then(res => {
            if (res && res.code === 0) {
              this.$message.success(res.msg);
              this.getList();
              dialogInstance.destroy();
            } else {
              this.$message.warning((res && res.msg) || this.$t('page.ip_ban.remove_failed'));
            }
          }).catch(() => {
            this.$message.error(this.$t('page.ip_ban.remove_failed'));
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
.cfg-desc {
  color: var(--td-text-color-secondary);
  font-size: 13px;
  margin: 0 0 20px;
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
.list-notice {
  margin-bottom: 16px;
}
.example {
  margin-top: 4px;
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 6px;
  overflow: hidden;

  .example-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    background: var(--td-bg-color-component);
    border-bottom: 1px solid var(--td-border-level-1-color);

    .example-title {
      font-size: 13px;
      font-weight: 600;
    }

    .example-ops {
      display: flex;
      gap: 8px;
    }
  }

  .example-code {
    padding: 14px 16px;
    margin: 0;
    font-family: Consolas, "Courier New", monospace;
    font-size: 12px;
    line-height: 1.7;
    color: var(--td-text-color-primary);
    background: #fff;
    overflow-x: auto;
  }

  .example-foot {
    padding: 8px 16px 12px;
    color: var(--td-text-color-placeholder);
    font-size: 12px;
  }
}
.cfg-foot {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed var(--td-border-level-1-color);
  text-align: right;

  ::v-deep .t-form__controls {
    margin-left: 0 !important;
  }
}

.ipl-link {
  color: var(--td-brand-color);
  cursor: pointer;
}

.ipl-link:hover {
  color: var(--td-brand-color-hover);
  text-decoration: underline;
}
</style>
