<template>
  <div>
    <t-alert theme="info" :message="$t('page.owasp.tuning.alert_message')" close />

    <!-- 概念说明区：帮助用户理解 Paranoia / Anomaly 等核心术语 -->
    <t-collapse :default-value="['concepts']" expandMutex expand-icon-placement="right" class="concept-panel">
      <t-collapse-panel :header="$t('page.owasp.tuning.concepts_title')" value="concepts">
        <div class="concept-block">
          <div class="concept-title">① Paranoia Level (PL) · {{ $t('page.owasp.tuning.concept_paranoia_label') }}</div>
          <div class="concept-body">
            <p>{{ $t('page.owasp.tuning.concept_paranoia_desc') }}</p>
            <ul>
              <li><b>PL 1</b> {{ $t('page.owasp.tuning.concept_paranoia_pl1') }}</li>
              <li><b>PL 2</b> {{ $t('page.owasp.tuning.concept_paranoia_pl2') }}</li>
              <li><b>PL 3</b> {{ $t('page.owasp.tuning.concept_paranoia_pl3') }}</li>
              <li><b>PL 4</b> {{ $t('page.owasp.tuning.concept_paranoia_pl4') }}</li>
            </ul>
            <p class="hint">{{ $t('page.owasp.tuning.concept_paranoia_split') }}</p>
          </div>
        </div>

        <div class="concept-block">
          <div class="concept-title">② Anomaly Score · {{ $t('page.owasp.tuning.concept_anomaly_label') }}</div>
          <div class="concept-body">
            <p>{{ $t('page.owasp.tuning.concept_anomaly_desc') }}</p>
            <ul>
              <li><t-tag theme="danger" variant="light">CRITICAL</t-tag> +5</li>
              <li><t-tag theme="warning" variant="light">ERROR</t-tag> +4</li>
              <li><t-tag theme="primary" variant="light">WARNING</t-tag> +3</li>
              <li><t-tag theme="default" variant="light">NOTICE</t-tag> +2</li>
            </ul>
            <p>{{ $t('page.owasp.tuning.concept_anomaly_threshold') }}</p>
          </div>
        </div>

        <div class="concept-block">
          <div class="concept-title">③ {{ $t('page.owasp.tuning.concept_engine_label') }}</div>
          <div class="concept-body">
            <ul>
              <li><b>On</b> {{ $t('page.owasp.tuning.concept_engine_on') }}</li>
              <li><b>DetectionOnly</b> {{ $t('page.owasp.tuning.concept_engine_detection') }}</li>
              <li><b>Off</b> {{ $t('page.owasp.tuning.concept_engine_off') }}</li>
            </ul>
          </div>
        </div>

        <div class="concept-block">
          <div class="concept-title">④ {{ $t('page.owasp.tuning.concept_early_label') }}</div>
          <div class="concept-body">
            <p>{{ $t('page.owasp.tuning.concept_early_desc') }}</p>
          </div>
        </div>
      </t-collapse-panel>
    </t-collapse>

    <t-form :data="form" :rules="rules" :labelWidth="220" @submit="onSubmit">
      <t-form-item name="rule_engine">
        <template #label>
          <span>{{ $t('page.owasp.tuning.rule_engine') }}</span>
          <t-tooltip :content="$t('page.owasp.tuning.concept_engine_tooltip')" placement="top-left">
            <t-icon name="help-circle" class="label-icon" />
          </t-tooltip>
        </template>
        <t-radio-group v-model="form.rule_engine">
          <t-radio value="On">{{ $t('page.owasp.tuning.engine_on') }}</t-radio>
          <t-radio value="DetectionOnly">{{ $t('page.owasp.tuning.engine_detection') }}</t-radio>
          <t-radio value="Off">{{ $t('page.owasp.tuning.engine_off') }}</t-radio>
        </t-radio-group>
      </t-form-item>
      <t-form-item name="blocking_paranoia">
        <template #label>
          <span>{{ $t('page.owasp.tuning.blocking_paranoia') }}</span>
          <t-tooltip :content="$t('page.owasp.tuning.concept_blocking_pl_tooltip')" placement="top-left">
            <t-icon name="help-circle" class="label-icon" />
          </t-tooltip>
        </template>
        <t-input-number v-model="form.blocking_paranoia" :min="1" :max="4" />
        <span class="tip">{{ $t('page.owasp.tuning.blocking_paranoia_tip') }}</span>
      </t-form-item>
      <t-form-item name="detection_paranoia">
        <template #label>
          <span>{{ $t('page.owasp.tuning.detection_paranoia') }}</span>
          <t-tooltip :content="$t('page.owasp.tuning.concept_detection_pl_tooltip')" placement="top-left">
            <t-icon name="help-circle" class="label-icon" />
          </t-tooltip>
        </template>
        <t-input-number v-model="form.detection_paranoia" :min="1" :max="4" />
        <span class="tip">{{ $t('page.owasp.tuning.detection_paranoia_tip') }}</span>
      </t-form-item>
      <t-form-item name="inbound_threshold">
        <template #label>
          <span>{{ $t('page.owasp.tuning.inbound_threshold') }}</span>
          <t-tooltip :content="$t('page.owasp.tuning.concept_inbound_threshold_tooltip')" placement="top-left">
            <t-icon name="help-circle" class="label-icon" />
          </t-tooltip>
        </template>
        <t-input-number v-model="form.inbound_threshold" :min="1" :max="100" />
        <span class="tip">{{ $t('page.owasp.tuning.inbound_threshold_tip') }}</span>
      </t-form-item>
      <t-form-item name="outbound_threshold">
        <template #label>
          <span>{{ $t('page.owasp.tuning.outbound_threshold') }}</span>
          <t-tooltip :content="$t('page.owasp.tuning.concept_outbound_threshold_tooltip')" placement="top-left">
            <t-icon name="help-circle" class="label-icon" />
          </t-tooltip>
        </template>
        <t-input-number v-model="form.outbound_threshold" :min="1" :max="100" />
        <span class="tip">{{ $t('page.owasp.tuning.outbound_threshold_tip') }}</span>
      </t-form-item>
      <t-form-item>
        <template #label>
          <span>{{ $t('page.owasp.tuning.early_blocking') }}</span>
          <t-tooltip :content="$t('page.owasp.tuning.concept_early_tooltip')" placement="top-left">
            <t-icon name="help-circle" class="label-icon" />
          </t-tooltip>
        </template>
        <t-switch v-model="earlyBool" @change="(v) => (form.early_blocking = v ? 1 : 0)" />
        <span class="tip">{{ $t('page.owasp.tuning.early_blocking_tip') }}</span>
      </t-form-item>
      <t-form-item>
        <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
        <t-button variant="outline" @click="getTuning">{{ $t('common.refresh') }}</t-button>
      </t-form-item>
    </t-form>

    <!-- CRS 事务变量参数区块 -->
    <t-divider />
    <div class="crs-vars-section">
      <div class="crs-vars-header">
        <span class="crs-vars-title">{{ $t('page.owasp.tuning.crs_vars_title') }}</span>
        <t-tooltip :content="$t('page.owasp.tuning.crs_vars_tip')" placement="top">
          <t-icon name="help-circle" class="label-icon" />
        </t-tooltip>
        <t-button size="small" variant="outline" style="margin-left:auto" @click="onAddVar">
          + {{ $t('page.owasp.tuning.crs_vars_add') }}
        </t-button>
      </div>

      <t-alert theme="info" style="margin:8px 0 12px">
        <template #message>
          <span>{{ $t('page.owasp.tuning.crs_vars_hint') }}</span>
          <span style="margin-left:8px;font-size:12px;color:var(--td-text-color-secondary)">
            💡 验证方法：在「沙盒测试」中构造一个请求（如 PATCH 方法），若相关规则不再触发，则变量已生效。
          </span>
        </template>
      </t-alert>

      <!-- 常用变量说明表 -->
      <t-collapse :default-value="[]" expand-icon-placement="right" style="margin-bottom:12px">
        <t-collapse-panel :header="$t('page.owasp.tuning.crs_vars_known_title')" value="known">
          <t-table
            :columns="knownVarColumns"
            :data="knownVars"
            rowKey="key"
            size="small"
            :pagination="false"
          >
            <template #action="{ row }">
              <t-button size="small" variant="outline" @click="onSetKnown(row)">
                {{ $t('page.owasp.tuning.crs_vars_configure') }}
              </t-button>
            </template>
          </t-table>
        </t-collapse-panel>
      </t-collapse>

      <!-- 已设置的自定义变量 -->
      <t-loading :loading="crsVarsLoading">
        <t-table
          :columns="crsVarColumns"
          :data="crsVarRows"
          rowKey="key"
          size="small"
          :pagination="false"
          :empty="$t('page.owasp.tuning.crs_vars_empty')"
        >
          <template #value="{ row }">
            <code style="word-break:break-all">{{ row.value }}</code>
          </template>
          <template #op="{ row }">
            <t-button size="small" variant="outline" @click="onEditVar(row)">{{ $t('common.edit') }}</t-button>
            <t-popconfirm :content="$t('page.owasp.tuning.crs_vars_delete_confirm')" @confirm="onDeleteVar(row.key)">
              <t-button size="small" variant="outline" theme="danger" style="margin-left:6px">{{ $t('common.delete') }}</t-button>
            </t-popconfirm>
          </template>
        </t-table>
      </t-loading>
    </div>

    <!-- 新增/编辑变量弹窗 -->
    <t-dialog
      :header="editVarDialog.isNew ? $t('page.owasp.tuning.crs_vars_add') : $t('page.owasp.tuning.crs_vars_edit')"
      :visible.sync="editVarDialog.visible"
      width="560px"
      :confirm-btn="{ content: $t('common.confirm'), loading: editVarDialog.saving }"
      :onConfirm="onSaveVar"
      :onClose="() => { editVarDialog.visible = false }"
    >
      <t-form :data="editVarDialog" label-align="right" :label-width="120">
        <t-form-item :label="$t('page.owasp.tuning.crs_var_key')">
          <t-input
            v-model="editVarDialog.key"
            :disabled="!editVarDialog.isNew"
            placeholder="allowed_methods"
            style="width:280px"
            prefix="tx."
          />
          <t-tooltip v-if="editVarDialog.knownDesc" :content="editVarDialog.knownDesc" placement="top">
            <t-icon name="help-circle" class="label-icon" />
          </t-tooltip>
        </t-form-item>
        <t-form-item :label="$t('page.owasp.tuning.crs_var_value')">
          <t-textarea
            v-model="editVarDialog.value"
            :placeholder="editVarDialog.placeholder || ''"
            :autosize="{ minRows: 2, maxRows: 6 }"
            style="width:320px"
          />
        </t-form-item>
        <t-form-item v-if="editVarDialog.knownDesc" :label="$t('page.owasp.tuning.crs_var_desc')">
          <span style="font-size:12px;color:var(--td-text-color-secondary)">{{ editVarDialog.knownDesc }}</span>
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { owaspTuningGetApi, owaspTuningSetApi, owaspCRSVarsGetApi, owaspCRSVarSetApi, owaspCRSVarDeleteApi } from '@/apis/owasp';

// 内置常用 CRS 事务变量说明（key 不含 tx. 前缀）
const KNOWN_CRS_VARS = [
  { key: 'allowed_methods', default: 'GET HEAD POST OPTIONS', desc: '允许的 HTTP 方法（空格分隔）', rules: '911100' },
  { key: 'allowed_request_content_type', default: 'application/x-www-form-urlencoded|multipart/form-data|text/xml|application/xml|application/json', desc: '允许的请求 Content-Type（竖线分隔）', rules: '920420' },
  { key: 'allowed_http_versions', default: 'HTTP/1.0 HTTP/1.1 HTTP/2 HTTP/2.0', desc: '允许的 HTTP 协议版本', rules: '920430' },
  { key: 'max_num_args', default: '255', desc: '请求参数最大数量', rules: '920380' },
  { key: 'arg_name_length', default: '100', desc: '单个参数名最大长度（字节）', rules: '920370' },
  { key: 'arg_length', default: '400', desc: '单个参数值最大长度（字节）', rules: '920370' },
  { key: 'total_arg_length', default: '64000', desc: '全部参数总长度上限（字节）', rules: '920370' },
  { key: 'max_file_size', default: '1048576', desc: '单文件上传最大字节数（1 MB）', rules: '920200' },
  { key: 'max_combined_file_sizes', default: '1048576', desc: '所有文件上传总字节数（1 MB）', rules: '920210' },
];

export default Vue.extend({
  name: 'OwaspTuningTab',
  data() {
    return {
      form: {
        rule_engine: 'On',
        blocking_paranoia: 1,
        detection_paranoia: 2,
        inbound_threshold: 7,
        outbound_threshold: 4,
        early_blocking: 0,
      },
      earlyBool: false,
      rules: {},
      // CRS 变量
      crsVarsLoading: false,
      crsVars: {} as Record<string, string>,
      editVarDialog: {
        visible: false,
        isNew: true,
        saving: false,
        key: '',
        value: '',
        placeholder: '',
        knownDesc: '',
      },
      knownVarColumns: [
        { title: '变量（tx.）', colKey: 'key', width: 260 },
        { title: '默认值', colKey: 'default', ellipsis: true },
        { title: '作用', colKey: 'desc', ellipsis: true },
        { title: '关联规则', colKey: 'rules', width: 100 },
        { title: '操作', colKey: 'action', width: 90 },
      ],
      crsVarColumns: [
        { title: '变量（tx.）', colKey: 'key', width: 260 },
        { title: '当前值', colKey: 'value', ellipsis: true },
        { title: '操作', colKey: 'op', width: 150, fixed: 'right' },
      ],
      knownVars: KNOWN_CRS_VARS,
    };
  },
  computed: {
    crsVarRows(): any[] {
      return Object.entries(this.crsVars).map(([key, value]) => ({ key, value }));
    },
  },
  mounted() {
    this.getTuning();
    this.getCRSVars();
  },
  methods: {
    getTuning() {
      owaspTuningGetApi().then((res) => {
        if (res.code === 0 && res.data) {
          const d = res.data as any;
          this.form = {
            rule_engine: d.rule_engine || 'On',
            blocking_paranoia: d.blocking_paranoia_level || 1,
            detection_paranoia: d.detection_paranoia_level || 2,
            inbound_threshold: d.inbound_anomaly_score_threshold || 7,
            outbound_threshold: d.outbound_anomaly_score_threshold || 4,
            early_blocking: d.early_blocking || 0,
          };
          this.earlyBool = this.form.early_blocking === 1;
        }
      });
    },
    onSubmit() {
      const payload = {
        rule_engine: this.form.rule_engine,
        blocking_paranoia_level: this.form.blocking_paranoia,
        detection_paranoia_level: this.form.detection_paranoia,
        inbound_anomaly_score_threshold: this.form.inbound_threshold,
        outbound_anomaly_score_threshold: this.form.outbound_threshold,
        early_blocking: this.form.early_blocking,
      };
      owaspTuningSetApi(payload).then((res) => {
        if (res.code === 0) {
          this.$message.success(res.msg);
          this.getTuning();
        } else {
          this.$message.warning(res.msg);
        }
      });
    },
    getCRSVars() {
      this.crsVarsLoading = true;
      owaspCRSVarsGetApi()
        .then((res: any) => {
          if (res.code === 0 && res.data) {
            this.crsVars = res.data.vars || {};
          }
        })
        .finally(() => { this.crsVarsLoading = false; });
    },
    onAddVar() {
      this.editVarDialog = { visible: true, isNew: true, saving: false, key: '', value: '', placeholder: '', knownDesc: '' };
    },
    onSetKnown(row: any) {
      const existing = this.crsVars[row.key] || '';
      this.editVarDialog = {
        visible: true,
        isNew: !existing,
        saving: false,
        key: row.key,
        value: existing || row.default,
        placeholder: row.default,
        knownDesc: `${row.desc}（默认：${row.default}，关联规则：${row.rules}）`,
      };
    },
    onEditVar(row: any) {
      const known = KNOWN_CRS_VARS.find((k) => k.key === row.key);
      this.editVarDialog = {
        visible: true,
        isNew: false,
        saving: false,
        key: row.key,
        value: row.value,
        placeholder: known ? known.default : '',
        knownDesc: known ? `${known.desc}（默认：${known.default}）` : '',
      };
    },
    onSaveVar() {
      const key = (this.editVarDialog.key || '').trim().replace(/^tx\./, '');
      const value = this.editVarDialog.value;
      if (!key) {
        this.$message.warning('变量名不能为空');
        return;
      }
      this.editVarDialog.saving = true;
      owaspCRSVarSetApi({ key, value })
        .then((res: any) => {
          if (res.code === 0) {
            this.$message.success(res.msg || '已设置并热重载');
            this.editVarDialog.visible = false;
            this.getCRSVars();
          } else {
            this.$message.error(res.msg || '设置失败');
          }
        })
        .catch(() => { this.$message.error('请求失败'); })
        .finally(() => { this.editVarDialog.saving = false; });
    },
    onDeleteVar(key: string) {
      owaspCRSVarDeleteApi(key)
        .then((res: any) => {
          if (res.code === 0) {
            this.$message.success('已删除并热重载');
            this.getCRSVars();
          } else {
            this.$message.error(res.msg || '删除失败');
          }
        })
        .catch(() => { this.$message.error('请求失败'); });
    },
  },
});
</script>

<style lang="less" scoped>
.tip {
  margin-left: 12px;
  color: var(--td-text-color-secondary);
  font-size: 12px;
}
.label-icon {
  margin-left: 4px;
  color: var(--td-text-color-placeholder);
  cursor: help;
  vertical-align: -2px;
}
.concept-panel {
  margin: 8px 0 16px;
}
.concept-block {
  padding: 6px 0 10px;
  border-bottom: 1px dashed var(--td-component-border);
}
.concept-block:last-child {
  border-bottom: none;
}
.concept-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--td-text-color-primary);
}
.concept-body {
  color: var(--td-text-color-secondary);
  font-size: 13px;
}
.concept-body p {
  margin: 4px 0;
}
.concept-body ul {
  margin: 4px 0 4px 18px;
  padding: 0;
}
.concept-body li {
  margin: 2px 0;
}
.concept-body .hint {
  color: var(--td-warning-color);
}
.crs-vars-section {
  margin-top: 4px;
}
.crs-vars-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}
.crs-vars-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}
</style>
