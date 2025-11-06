<template>
  <div class="rule-builder">
    <t-card :title="$t('page.rule.detail.write_rule')">
      <t-button theme="primary" @click="ruleDynAdd('cond')">
        {{ $t('common.new') }}
      </t-button>
      <t-form-item :label="$t('page.rule.detail.relation')" name="relation_symbol"
                   v-if="localFormData.rule_condition.relation_detail.length > 1">
        <t-select clearable :style="{ width: '480px' }"
                  v-model="localFormData.rule_condition.relation_symbol"
                  @change="onFormChange">
          <t-option v-for="(item, index) in relation_symbol_option" :value="item.value" :label="item.label" :key="index">
            {{ item.label }}
          </t-option>
        </t-select>
      </t-form-item>

      <t-card :title="$t('page.rule.detail.condition')"
              v-for="(condition_item, condition_index) in localFormData.rule_condition.relation_detail" :key="condition_index">
        <t-row :gutter="{ xs: 8, sm: 12, md: 16, lg: 16, xl: 16, xxl: 16 }">
          <t-col :span="5">
            <t-form-item :label="$t('page.rule.detail.scope')" name="attr" :labelWidth="80">
              <t-select clearable :style="{ width: '200px' }" v-model="condition_item.attr"
                        @change="onAttrChange(condition_item)">
                <t-option
                  v-for="(item, index) in attr_option.filter(option => !option.value.toLowerCase().startsWith('get'))"
                  :value="item.value" :label="item.label" :key="index">
                  {{ item.label }}
                </t-option>
              </t-select>
            </t-form-item>
          </t-col>

          <t-col :span="5">
            <t-form-item :label="$t('page.rule.detail.judgment')" name="attr_judge" :labelWidth="80">
              <t-select clearable :style="{ width: '200px' }" v-model="condition_item.attr_judge" @change="onAttrJudgeChange(condition_item)">
                <t-option v-for="(item, index) in attr_judge_option" :value="item.value" :label="item.label" :key="index">
                  {{ item.label }}
                </t-option>
              </t-select>
            </t-form-item>
          </t-col>

          <t-col :span="5">
            <t-form-item :label="$t('page.rule.detail.value')" name="att_val" :labelWidth="80">
              <t-input :style="{ width: '200px' }" :placeholder="$t('common.placeholder')"
                       v-model="condition_item.attr_val" @change="onFormChange" />
            </t-form-item>
          </t-col>

          <t-col :span="3" v-if="(condition_item.attr_judge || '').startsWith('system.')">
            <t-form-item :label="$t('page.rule.detail.function_judgment_result')" name="att_val2" :labelWidth="80">
              <t-select clearable :style="{ width: '160px' }" v-model="condition_item.attr_val2" @change="onFormChange">
                <t-option value="true" label="true">true</t-option>
                <t-option value="false" label="false">false</t-option>
              </t-select>
            </t-form-item>
          </t-col>

          <t-col :span="1" style="text-align:right;">
            <t-button theme="danger" @click="ruleDynDel('cond', condition_index)">{{ $t('common.delete') }}</t-button>
          </t-col>
        </t-row>
      </t-card>
    </t-card>

    <t-card :title="$t('page.rule.detail.rule_script_content')">
      <pre class="rule-example-code">{{ rulePreviewContent }}</pre>
    </t-card>

    <t-space style="margin-top: 12px;">
      <t-button theme="primary" @click="confirm">{{ $t('common.confirm') }}</t-button>
      <t-button theme="default" @click="$emit('cancel')">{{ $t('common.cancel') }}</t-button>
    </t-space>
  </div>
</template>

<script lang="ts">
import { v4 as uuidv4 } from 'uuid';
import { RULE, RULE_RELATION_DETAIL } from '@/service/service-rule';
import { copyObj } from '@/utils/usuallytool';
import { wafRuleFormatApi } from '@/apis/rules';

// Vue 2 写法：去掉 defineComponent，使用 export default
export default {
  name: 'RuleBuilder',
  props: {
    hostCode: { type: String, default: '' },
    defaultSalience: { type: Number, default: 10 },
    ruleNamePrefix: { type: String, default: 'SamWafRule' },
  },
  emits: ['confirm', 'update:modelValue', 'change', 'cancel'],
  data() {
    return {
      localFormData: {
        ...copyObj(RULE),
      },
      rulePreviewContent: '',
      attr_option: [
        { label: this.$t('page.rule.detail.inner_option_host'), value: 'HOST' },
        { label: this.$t('page.rule.detail.inner_option_url'), value: 'URL' },
        { label: this.$t('page.rule.detail.inner_option_referrer'), value: 'REFERER' },
        { label: this.$t('page.rule.detail.inner_option_user_agent'), value: 'USER_AGENT' },
        { label: this.$t('page.rule.detail.inner_option_method'), value: 'METHOD' },
        { label: this.$t('page.rule.detail.inner_option_cookies'), value: 'COOKIES' },
        { label: this.$t('page.rule.detail.inner_option_body'), value: 'BODY' },
        { label: this.$t('page.rule.detail.inner_option_port'), value: 'PORT' },
        { label: this.$t('page.rule.detail.inner_option_src_ip'), value: 'SRC_IP' },
        { label: this.$t('page.rule.detail.inner_option_country'), value: 'COUNTRY' },
        { label: this.$t('page.rule.detail.inner_option_province'), value: 'PROVINCE' },
        { label: this.$t('page.rule.detail.inner_option_city'), value: 'CITY' },
        { label: this.$t('page.rule.detail.inner_option_getheadervalue'), value: 'GetHeaderValue("HeaderKeyName")' },
      ],
      attr_judge_option: [
        { label: this.$t('page.rule.detail.judge_equal'), value: '==' },
        { label: this.$t('page.rule.detail.judge_not_equal'), value: '!=' },
        { label: this.$t('page.rule.detail.judge_greater_than'), value: '>' },
        { label: this.$t('page.rule.detail.judge_less_than'), value: '<' },
        { label: this.$t('page.rule.detail.judge_greater_than_equal'), value: '>=' },
        { label: this.$t('page.rule.detail.judge_less_than_equal'), value: '<=' },
        { label: this.$t('page.rule.detail.judge_contain'), value: 'system.Contains' },
        { label: this.$t('page.rule.detail.judge_has_prefix'), value: 'system.HasPrefix' },
        { label: this.$t('page.rule.detail.judge_has_suffix'), value: 'system.HasSuffix' },
      ],
      relation_symbol_option: [
        { label: this.$t('page.rule.detail.judge_logic_and'), value: '&&' },
        { label: this.$t('page.rule.detail.judge_logic_or'), value: '||' },
      ],
    };
  },
  mounted() {
    this.localFormData.is_manual_rule = '0';
    this.localFormData.rule_base.rule_domain_code = this.hostCode || this.localFormData.rule_base.rule_domain_code;
    this.localFormData.rule_base.salience = this.defaultSalience;
    this.localFormData.rule_base.rule_name = this.ruleNamePrefix;

    if (this.localFormData.rule_condition.relation_detail.length === 0) {
      this.ruleDynAdd('cond');
    }
    this.fetchRulePreview();
  },
  methods: {
    ruleDynAdd(type: string) {
      const item = { ...copyObj(RULE_RELATION_DETAIL) };
      item.fact_name = 'MF';
      item.attr_type = 'string';
      this.localFormData.rule_condition.relation_detail.push(item);
      this.onFormChange();
    },
    ruleDynDel(type: string, index: number) {
      this.localFormData.rule_condition.relation_detail.splice(index, 1);
      this.onFormChange();
    },
    onAttrChange(condition_item: any) {
      condition_item.attr_val = '';
      condition_item.attr_val2 = '';
      condition_item.attr_type = 'string';
      this.onFormChange();
    },
    onAttrJudgeChange(condition_item: any) {
      const isFunc = (condition_item.attr_judge || '').startsWith('system.');
      if (isFunc) {
        if (condition_item.attr_val2 !== 'true' && condition_item.attr_val2 !== 'false') {
          condition_item.attr_val2 = 'true';
        }
      } else {
        condition_item.attr_val2 = '';
      }
      this.onFormChange();
    },
    onFormChange() {
      this.$emit('update:modelValue', this.localFormData);
      this.$emit('change', { ruleJson: this.localFormData, preview: this.rulePreviewContent });
      this.fetchRulePreview();
    },
    buildPreviewPayload() {
      return {
        rule_code: uuidv4(),
        rule_json: JSON.stringify(this.localFormData),
        is_manual_rule: 0,
        rule_content: '',
        form_source: 'builder',
      };
    },
    fetchRulePreview() {
      const payload = this.buildPreviewPayload();
      wafRuleFormatApi(payload)
        .then((res: any) => {
          if (res.code === 0) {
            console.log(res.data.rule_content);
            this.rulePreviewContent = res.data.rule_content;
          }
        })
        .catch(() => {});
    },
    confirm() {
      this.$emit('confirm', this.rulePreviewContent);
    },
  },
};
</script>

<style scoped>
.rule-example-code {
  background: #f7f8fa;
  padding: 12px;
  border-radius: 6px;
  font-family: monospace;
  white-space: pre-wrap;
}
</style>