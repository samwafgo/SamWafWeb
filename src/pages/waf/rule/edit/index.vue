<template>
  <div class="detail-base">
    <t-alert theme="info" :message="$t('page.rule.detail.recommend_message')" close>
      <template #operation>
        <span @click="handleJumpAttackLogOperation">{{ $t('page.rule.detail.jump_visit_log') }} </span>
        <span @click="handleJumpOnlineUrl"> {{ $t('page.rule.detail.jump_visit_log') }} </span>
      </template>
    </t-alert>
    <t-form :data="formData" @submit="onSubmit" :labelWidth="180">
      <!--Base Info Begin-->
      <t-card :title="$t('page.rule.detail.base_info')">
        <t-form-item :label="$t('page.rule.detail.rule_name')" name="rule_name">
          <t-input :placeholder="$t('common.placeholder')" v-model="formData.rule_base.rule_name" />
        </t-form-item>
        <t-form-item :label="$t('page.rule.detail.rule_domain_code')" name="rule_domain_code">
          <t-select v-model="formData.rule_base.rule_domain_code" clearable filterable :style="{ width: '480px' }">
            <t-option v-for="(item, index) in host_options" :value="item.value" :label="item.label" :key="index">
              {{ item.label }}
            </t-option>
          </t-select>
        </t-form-item>
        <t-form-item :label="$t('page.rule.detail.rule_salience')" name="salience">
          <t-input :placeholder="$t('common.placeholder')" v-model="formData.rule_base.salience" />
        </t-form-item>
        <t-form-item :label="$t('page.rule.detail.rule_manual')" name="is_manual_rule">
          <t-select :style="{ width: '480px' }" @change="changeManualRule" v-model="formData.is_manual_rule">
            <t-option v-for="(item, index) in rule_manual_option" :value="item.value" :label="item.label" :key="index">
              {{ item.label }}
            </t-option>
          </t-select>
        </t-form-item>
        <t-form-item :label="$t('page.rule.detail.rule_status')" name="rule_status">
          <t-select :style="{ width: '480px' }" v-model="formData.rule_status">
            <t-option v-for="(item, index) in rule_status_option" :value="item.value" :label="item.label" :key="index">
              {{ item.label }}
            </t-option>
          </t-select>
        </t-form-item>
      </t-card>
      <!--Base Info End-->

      <!--UI Rule -->
      <div v-if="formData.is_manual_rule == '0'">
        <!--命中动作 开始-->
        <t-card :title="$t('page.rule.detail.rule_action')">
          <t-form-item :label="$t('page.rule.detail.rule_action')" name="rule_action">
            <t-select :style="{ width: '480px' }" v-model="formData.rule_action" @change="onRuleActionChange">
              <t-option v-for="(item, index) in rule_action_option" :value="item.value" :label="item.label" :key="index">
                {{ item.label }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item v-if="formData.rule_action === 'allow'" :label="$t('page.rule.detail.rule_action_skips')" name="rule_action_skips">
            <t-select :style="{ width: '480px' }" multiple :min-collapsed-num="4"
              v-model="formData.rule_action_skips" @change="onRuleActionSkipsChange"
              :placeholder="$t('page.rule.detail.rule_action_skips_placeholder')">
              <t-option v-for="(item, index) in rule_skip_module_option" :value="item.value" :label="item.label" :key="index">
                {{ item.label }}
              </t-option>
            </t-select>
            <t-tooltip :content="$t('page.rule.detail.rule_action_skips_tip')">
              <help-circle-icon style="margin-left: 8px; color: #999;" />
            </t-tooltip>
          </t-form-item>
        </t-card>
        <!--命中动作 结束-->
        <!--规则编排 开始-->
        <t-card :title="$t('page.rule.detail.write_rule')">
          <t-button theme="primary" @click="ruleDynAdd('cond')">
            {{ $t('common.new') }}
          </t-button>
          <t-form-item :label="$t('page.rule.detail.relation')" name="relation_symbol"
            v-if="formData.rule_condition.relation_detail.length > 1">
            <t-select clearable :style="{ width: '480px' }" v-model="formData.rule_condition.relation_symbol" @change="onFormChange">
              <t-option v-for="(item, index) in relation_symbol_option" :value="item.value" :label="item.label"
                :key="index">
                {{ item.label }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-card :title="$t('page.rule.detail.condition')"
            v-for="(condition_item, condition_index) in formData.rule_condition.relation_detail">
            <t-row :gutter="{ xs: 8, sm: 12, md: 16, lg: 16, xl: 16, xxl: 16 }">
              <t-col :span="5">
                <div>
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
                </div>
              </t-col>
              <t-col :span="5">
                <div>
                  <t-form-item :label="$t('page.rule.detail.judgment')" name="attr_judge" :labelWidth="80">
                    <t-select clearable :style="{ width: '200px' }" v-model="condition_item.attr_judge" @change="onAttrJudgeChange(condition_item)">
                      <t-option v-for="(item, index) in attr_judge_option" :value="item.value" :label="item.label" :key="index">
                        {{ item.label }}
                      </t-option>
                    </t-select>
                  </t-form-item>
                </div>
              </t-col>
              <t-col :span="5">
                <div>
                  <t-form-item :label="$t('page.rule.detail.value')" name="att_val" :labelWidth="80">
                    <t-input :style="{ width: '200px' }" placeholder="请输入内容" v-model="condition_item.attr_val" @change="onFormChange" />
                  </t-form-item>
                </div>
              </t-col>
              <t-col :span="3" v-if="(condition_item.attr_judge || '').startsWith('system.')">
                <div>
                  <t-form-item :label="$t('page.rule.detail.function_judgment_result')" name="att_val2" :labelWidth="80">
                    <t-select clearable :style="{ width: '160px' }" v-model="condition_item.attr_val2" @change="onFormChange">
                      <t-option value="true" label="true">true</t-option>
                      <t-option value="false" label="false">false</t-option>
                    </t-select>
                  </t-form-item>
                </div>
              </t-col>
              <t-col :span="1" style="text-align:right;">
                <t-button theme="danger" @click="ruleDynDel('cond', condition_index)">{{ $t('common.delete')
                  }}</t-button>
              </t-col>
            </t-row>

          </t-card>
        </t-card>
        <!--规则编排 结束-->

        <!-- 规则脚本内容预览（仅 UI 模式显示） -->
        <t-card :title="$t('page.rule.detail.rule_script_content')">
          <pre class="rule-example-code">{{ rulePreviewContent || ruleDetail.rule_content }}</pre>
        </t-card>

      </div>
      <!--UI Rule End-->

      <!--Manual Rule-->
      <div v-if="formData.is_manual_rule == '1'">
        <t-card :title="$t('page.rule.detail.write_rule')">
          <t-row>
            <!-- 左侧代码编辑区域 -->
            <t-col flex="auto">
              <!-- AI 生成规则面板 -->
              <div class="ai-gen-panel">
                <div class="ai-gen-head">
                  <help-circle-icon class="ai-gen-icon" />
                  <span class="ai-gen-title">{{ $t('page.rule.detail.ai_gen_title') }}</span>
                  <t-link theme="primary" hover="color" size="small" @click="openAiPrompt">
                    {{ $t('page.rule.detail.ai_prompt_entry') }}
                  </t-link>
                  <t-link theme="default" hover="color" size="small" class="ai-gen-setting" @click="openGptConfig">
                    <setting-icon />
                    <span>{{ $t('page.rule.detail.gpt_config_entry') }}</span>
                  </t-link>
                </div>
                <div class="ai-gen-body">
                  <t-textarea v-model="aiGenIntent" :autosize="{ minRows: 2, maxRows: 4 }"
                    :placeholder="$t('page.rule.detail.ai_gen_placeholder')" />
                  <div class="ai-gen-ops">
                    <t-button theme="primary" :loading="aiGenLoading" @click="onAiGenRule">
                      {{ $t('page.rule.detail.ai_gen_btn') }}
                    </t-button>
                    <span class="ai-gen-hint">{{ $t('page.rule.detail.ai_gen_hint') }}</span>
                  </div>
                  <!-- 生成结果 -->
                  <div v-if="aiGenResult" class="ai-gen-result">
                    <div class="ai-gen-result-head">
                      <t-tag v-if="aiGenResult.valid" theme="success" variant="light" size="small">
                        {{ $t('page.rule.detail.ai_gen_valid') }}
                      </t-tag>
                      <t-tag v-else theme="warning" variant="light" size="small">
                        {{ $t('page.rule.detail.ai_gen_invalid') }}
                      </t-tag>
                      <t-tag v-if="aiGenResult.action" :theme="ruleActionTheme(aiGenResult.action)" variant="light" size="small">
                        {{ ruleActionLabel(aiGenResult.action) }}
                      </t-tag>
                      <span v-if="!aiGenResult.valid && aiGenResult.error" class="ai-gen-err">{{ aiGenResult.error }}</span>
                    </div>
                    <pre class="example-code">{{ aiGenResult.rule_content }}</pre>
                    <div class="ai-gen-result-ops">
                      <t-button size="small" theme="primary" @click="applyAiGenRule">{{ $t('page.rule.detail.example_apply') }}</t-button>
                      <t-button size="small" variant="outline" @click="copyExample(aiGenResult.rule_content)">{{ $t('page.rule.detail.example_copy') }}</t-button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rule-example-header">
                <code-icon />
                <span class="rule-example-title">{{ $t('page.rule.detail.manual_code_rule_edit') }}</span>
              </div>
              <writeRule :valuecontent="formData.rule_content" @edtinput="edtinput"></writeRule>

              <div class="rule-example-container">
                <!-- 顶部工具条：分类 + 视图切换 -->
                <div class="example-toolbar">
                  <t-radio-group v-model="exampleCategory" variant="default-filled" size="small">
                    <t-radio-button v-for="cat in ruleExampleCategories" :key="cat.value" :value="cat.value">
                      {{ cat.label }}
                    </t-radio-button>
                  </t-radio-group>
                  <t-radio-group v-model="exampleViewMode" variant="primary-filled" size="small" class="example-view-switch">
                    <t-radio-button v-for="mode in ruleExampleViewModes" :key="mode.value" :value="mode.value">
                      {{ mode.label }}
                    </t-radio-button>
                  </t-radio-group>
                </div>

                <div class="example-body">
                  <!-- 卡片模式 -->
                  <div v-if="exampleViewMode === 'card'" class="example-cards">
                    <div class="example-card" v-for="(ex, exIndex) in filteredExamples" :key="exIndex">
                      <div class="example-card-head">
                        <t-tag :theme="ruleActionTheme(ex.action)" variant="light" size="small">{{ ruleActionLabel(ex.action) }}</t-tag>
                        <span class="example-card-title">{{ ex.title }}</span>
                        <div class="example-card-ops">
                          <t-button size="small" variant="text" @click="copyExample(ex.code)">{{ $t('page.rule.detail.example_copy') }}</t-button>
                          <t-button v-if="!ex.multi" size="small" variant="text" theme="primary" @click="applyExample(ex)">{{ $t('page.rule.detail.example_apply') }}</t-button>
                        </div>
                      </div>
                      <div class="example-card-desc">{{ ex.desc }}</div>
                      <pre class="example-code">{{ ex.code }}</pre>
                    </div>
                  </div>

                  <!-- 表格模式 -->
                  <t-table v-else-if="exampleViewMode === 'table'" :data="filteredExamples" :columns="exampleTableColumns"
                    size="small" rowKey="title" stripe hover bordered>
                    <template #actionTag="{ row }">
                      <t-tag :theme="ruleActionTheme(row.action)" variant="light" size="small">{{ ruleActionLabel(row.action) }}</t-tag>
                    </template>
                    <template #ops="{ row }">
                      <t-button size="small" variant="text" @click="copyExample(row.code)">{{ $t('page.rule.detail.example_copy') }}</t-button>
                      <t-button v-if="!row.multi" size="small" variant="text" theme="primary" @click="applyExample(row)">{{ $t('page.rule.detail.example_apply') }}</t-button>
                    </template>
                  </t-table>

                  <!-- 详解模式 -->
                  <div v-else class="example-explain">
                    <div class="explain-item" v-for="(ex, exIndex) in filteredExamples" :key="exIndex">
                      <div class="explain-scene">
                        <t-tag :theme="ruleActionTheme(ex.action)" variant="light" size="small">{{ ruleActionLabel(ex.action) }}</t-tag>
                        <span class="explain-title">{{ ex.title }}</span>
                      </div>
                      <div class="explain-desc">{{ ex.desc }}</div>
                      <pre class="example-code">{{ ex.code }}</pre>
                      <div class="explain-effect" v-if="ex.effect">
                        <strong>{{ $t('page.rule.detail.example_effect') }}：</strong>{{ ex.effect }}
                      </div>
                      <div class="explain-ops">
                        <t-button size="small" variant="outline" @click="copyExample(ex.code)">{{ $t('page.rule.detail.example_copy') }}</t-button>
                        <t-button v-if="!ex.multi" size="small" theme="primary" @click="applyExample(ex)">{{ $t('page.rule.detail.example_apply') }}</t-button>
                        <span v-if="ex.multi" class="explain-multi-tip">{{ $t('page.rule.detail.example_multi_tip') }}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </t-col>

            <!-- 右侧系统变量参考区域 -->
            <t-col flex="450px">
              <div class="reference-container">
                <t-tabs default-value="variables" theme="card">
                  
                  <!-- 系统变量 -->
                  <t-tab-panel value="variables" :label="$t('page.rule.detail.system_variable')">
                    <t-table :data="attr_option" :columns="[
                      { colKey: 'label', title: $t('page.rule.detail.variable_name') },
                      { colKey: 'value', title: $t('page.rule.detail.variable_key') }
                    ]" size="small" :pagination="{ pageSize: 10 }" rowKey="value" stripe hover />
                  </t-tab-panel>

                  <!-- 判断符号 -->
                  <t-tab-panel value="judge" :label="$t('page.rule.detail.system_judge_symbol')">
                    <t-table :data="attr_judge_option" :columns="[
                      { colKey: 'label', title: $t('page.rule.detail.variable_name') },
                      { colKey: 'value', title: $t('page.rule.detail.variable_key') }
                    ]" size="small" :pagination="{ pageSize: 10 }" rowKey="value" stripe hover />
                  </t-tab-panel>

                  <!-- 关系符号 -->
                  <t-tab-panel value="relation" :label="$t('page.rule.detail.system_relation_symbol')">
                    <t-table :data="relation_symbol_option" :columns="[
                      { colKey: 'label', title: $t('page.rule.detail.variable_name') },
                      { colKey: 'value', title: $t('page.rule.detail.variable_key') }
                    ]" size="small" :pagination="{ pageSize: 10 }" rowKey="value" stripe hover />
                  </t-tab-panel>

                </t-tabs>
              </div>
            </t-col>
          </t-row>
        </t-card>
      </div>

      <t-form-item style="margin-left: 100px">
        <t-space size="10px">
          <!-- type = submit，表单中的提交按钮，原生行为 -->
          <t-button theme="primary" type="submit">{{ $t('common.submit') }}</t-button>
          <t-button theme="warning" type="button" @click="handleTestRule">{{ $t('page.rule.detail.test_rule') }}</t-button>
          <t-button theme="primary" type="button" @click="backPage">{{ $t('common.return') }}</t-button>
        </t-space>
      </t-form-item>
    </t-form>

    <!-- AI 提示词弹窗 -->
    <t-dialog
      :header="$t('page.rule.detail.ai_prompt_title')"
      :visible.sync="aiPromptDialogVisible"
      width="720px"
      :footer="false"
    >
      <div class="ai-prompt-tip">{{ $t('page.rule.detail.ai_prompt_tip') }}</div>
      <t-textarea v-model="aiPromptText" :autosize="{ minRows: 12, maxRows: 20 }" class="ai-prompt-textarea" />
      <div class="ai-prompt-ops">
        <t-button theme="primary" @click="copyAiPrompt">{{ $t('page.rule.detail.example_copy') }}</t-button>
        <t-button variant="outline" @click="aiPromptDialogVisible = false">{{ $t('common.close') }}</t-button>
      </div>
    </t-dialog>

    <!-- GPT 参数设置弹窗 -->
    <t-dialog
      :header="$t('page.rule.detail.gpt_config_title')"
      :visible.sync="gptConfigDialogVisible"
      width="760px"
      :footer="false"
    >
      <t-loading :loading="gptConfigLoading" size="small">
        <t-form :data="gptConfig" :label-width="110" @submit.prevent>
          <t-form-item :label="$t('page.rule.detail.gpt_url')" name="gpt_url">
            <t-input v-model="gptConfig.gpt_url" :placeholder="'https://api.deepseek.com'" />
          </t-form-item>
          <t-form-item :label="$t('page.rule.detail.gpt_model')" name="gpt_model">
            <t-input v-model="gptConfig.gpt_model" :placeholder="'deepseek-chat'" />
          </t-form-item>
          <t-form-item :label="$t('page.rule.detail.gpt_token')" name="gpt_token">
            <t-input
              v-model="gptConfig.gpt_token"
              type="password"
              :placeholder="gptConfig.has_token ? $t('page.rule.detail.gpt_token_set_placeholder') : $t('page.rule.detail.gpt_token_empty_placeholder')"
            />
          </t-form-item>
        </t-form>
        <div class="gpt-token-tip">{{ $t('page.rule.detail.gpt_token_tip') }}</div>

        <div class="gpt-preset-title">{{ $t('page.rule.detail.gpt_preset_title') }}</div>
        <div class="gpt-preset-list">
          <div class="gpt-preset-item" v-for="(p, pIndex) in gptProviders" :key="pIndex">
            <div class="gpt-preset-main">
              <span class="gpt-preset-name">{{ p.name }}</span>
              <span class="gpt-preset-desc">{{ gptPresetDesc(p) }}</span>
            </div>
            <div class="gpt-preset-url">{{ p.url }}</div>
            <div class="gpt-preset-models">
              <t-tag
                v-for="(m, mIndex) in p.models"
                :key="mIndex"
                size="small"
                variant="light"
                class="gpt-preset-model"
                @click="applyGptPreset(p, m)"
              >{{ m }}</t-tag>
            </div>
            <div class="gpt-preset-ops">
              <t-button size="small" variant="outline" @click="applyGptPreset(p)">{{ $t('page.rule.detail.gpt_preset_use') }}</t-button>
              <t-link theme="primary" hover="color" size="small" :href="p.home" target="_blank">{{ $t('page.rule.detail.gpt_preset_apply_key') }}</t-link>
            </div>
          </div>
        </div>

        <div class="ai-prompt-ops">
          <t-button theme="primary" :loading="gptConfigSaving" @click="saveGptConfig">{{ $t('common.submit') }}</t-button>
          <t-button variant="outline" @click="gptConfigDialogVisible = false">{{ $t('common.close') }}</t-button>
        </div>
      </t-loading>
    </t-dialog>

    <!-- 测试规则弹窗 -->
    <t-dialog
      :header="$t('page.rule.detail.test_rule_title')"
      :visible.sync="testDialogVisible"
      width="800px"
      :confirm-btn="$t('page.rule.detail.test_start')"
      :cancel-btn="$t('page.rule.detail.test_cancel')"
      @confirm="onConfirmTest"
      @cancel="onCancelTest"
    >
      <t-form :data="testFormData" :label-width="120">
        <t-form-item :label="$t('page.rule.detail.test_src_ip')" name="test_src_ip">
          <t-input v-model="testFormData.test_src_ip" :placeholder="$t('page.rule.detail.test_src_ip_placeholder')" />
        </t-form-item>
        <t-form-item :label="$t('page.rule.detail.test_host')" name="test_host">
          <t-input v-model="testFormData.test_host" :placeholder="$t('page.rule.detail.test_host_placeholder')" />
        </t-form-item>
        <t-form-item :label="$t('page.rule.detail.test_url')" name="test_url">
          <t-input v-model="testFormData.test_url" :placeholder="$t('page.rule.detail.test_url_placeholder')" />
        </t-form-item>
        <t-form-item :label="$t('page.rule.detail.test_method')" name="test_method">
          <t-select v-model="testFormData.test_method" :placeholder="$t('page.rule.detail.test_method_placeholder')">
            <t-option value="GET" label="GET">GET</t-option>
            <t-option value="POST" label="POST">POST</t-option>
            <t-option value="PUT" label="PUT">PUT</t-option>
            <t-option value="DELETE" label="DELETE">DELETE</t-option>
            <t-option value="HEAD" label="HEAD">HEAD</t-option>
            <t-option value="OPTIONS" label="OPTIONS">OPTIONS</t-option>
          </t-select>
        </t-form-item>
        <t-form-item :label="$t('page.rule.detail.test_user_agent')" name="test_user_agent">
          <t-input v-model="testFormData.test_user_agent" :placeholder="$t('page.rule.detail.test_user_agent_placeholder')" />
        </t-form-item>
        <t-form-item :label="$t('page.rule.detail.test_referer')" name="test_referer">
          <t-input v-model="testFormData.test_referer" :placeholder="$t('page.rule.detail.test_referer_placeholder')" />
        </t-form-item>
        <t-form-item :label="$t('page.rule.detail.test_header')" name="test_header">
          <t-textarea v-model="testFormData.test_header" :placeholder="$t('page.rule.detail.test_header_placeholder')" :autosize="{ minRows: 3, maxRows: 6 }" />
        </t-form-item>
        <t-form-item :label="$t('page.rule.detail.test_cookies')" name="test_cookies">
          <t-input v-model="testFormData.test_cookies" :placeholder="$t('page.rule.detail.test_cookies_placeholder')" />
        </t-form-item>
        <t-form-item :label="$t('page.rule.detail.test_body')" name="test_body">
          <t-textarea v-model="testFormData.test_body" :placeholder="$t('page.rule.detail.test_body_placeholder')" :autosize="{ minRows: 3, maxRows: 6 }" />
        </t-form-item>

        <!-- 测试结果显示 -->
        <t-form-item v-if="testResult !== null" :label="$t('page.rule.detail.test_result')">
          <t-alert v-if="testResult.is_match" theme="warning">
            <template #message>
              <div>{{ $t('page.rule.detail.test_matched') }}</div>
              <div v-if="testResult.effective_action" style="margin-top: 6px;">
                <strong>{{ $t('page.rule.detail.test_effective_action') }}:</strong>
                <t-tag :theme="ruleActionTheme(testResult.effective_action)" variant="light" style="margin-left: 6px;">
                  {{ ruleActionLabel(testResult.effective_action) }}
                </t-tag>
                <span v-if="testResult.effective_skip_modules && testResult.effective_skip_modules.length > 0" style="margin-left: 6px;">
                  {{ $t('page.rule.detail.rule_action_skips') }}: {{ testResult.effective_skip_modules.join(', ') }}
                </span>
              </div>
              <div v-if="testResult.matched_rule_details && testResult.matched_rule_details.length > 0" style="margin-top: 6px;">
                <strong>{{ $t('page.rule.detail.test_matched_rules') }}:</strong>
                <ul>
                  <li v-for="(rule, index) in testResult.matched_rule_details" :key="index">
                    {{ rule.rule_description }}
                    <t-tag :theme="ruleActionTheme(rule.action)" variant="light" size="small" style="margin-left: 6px;">
                      {{ ruleActionLabel(rule.action) }}
                    </t-tag>
                    <span v-if="rule.skip_modules && rule.skip_modules.length > 0" style="color: #999; margin-left: 6px;">
                      ({{ rule.skip_modules.join(', ') }})
                    </span>
                  </li>
                </ul>
              </div>
              <div v-else-if="testResult.matched_rules && testResult.matched_rules.length > 0">
                <strong>{{ $t('page.rule.detail.test_matched_rules') }}:</strong>
                <ul>
                  <li v-for="(rule, index) in testResult.matched_rules" :key="index">{{ rule }}</li>
                </ul>
              </div>
              <div v-if="testResult.parsed_country || testResult.parsed_province || testResult.parsed_city">
                <strong>{{ $t('page.rule.detail.test_parsed_location') }}:</strong>
                {{ testResult.parsed_country }} / {{ testResult.parsed_province }} / {{ testResult.parsed_city }}
              </div>
            </template>
          </t-alert>
          <t-alert v-else theme="success">
            <template #message>
              <div>{{ $t('page.rule.detail.test_not_matched') }}</div>
              <div v-if="testResult.parsed_country || testResult.parsed_province || testResult.parsed_city">
                <strong>{{ $t('page.rule.detail.test_parsed_location') }}:</strong>
                {{ testResult.parsed_country }} / {{ testResult.parsed_province }} / {{ testResult.parsed_city }}
              </div>
            </template>
          </t-alert>
        </t-form-item>
      </t-form>
    </t-dialog>

  </div>
</template>
<script lang="ts">
import {
  prefix
} from '@/config/global';
import { CodeIcon, HelpCircleIcon, SettingIcon } from 'tdesign-icons-vue';

import {
  RULE, RULE_RELATION_DETAIL, RULE_DO_ASSIGNMENT, RULE_DO_METHOD, RULE_DO_METHOD_PARM
} from '@/service/service-rule';
import { copyObj } from '@/utils/usuallytool';
import writeRule from "@/components/write-rule/index.vue";
import {
  allhost
} from '@/apis/host';
import { wafRuleListApi, wafRuleDelApi, wafRuleEditApi, wafRuleAddApi, wafRuleDetailApi, wafRuleFormatApi, wafRuleTestApi, wafRuleAiGenApi, wafRuleAiPromptApi } from '@/apis/rules';
import { wafGptConfigGetApi, wafGptConfigSaveApi } from '@/apis/gpt';
import { GPT_PROVIDERS } from '@/utils/gptProviders';
import { v4 as uuidv4 } from 'uuid';

export default {
  name: 'WafRuleEdit',
  components: {
    writeRule,
    CodeIcon,
    HelpCircleIcon,
    SettingIcon,
  },
  data() {
    return {
      op_type: "add",
      op_rule_no: "",//规则识别号
      prefix,
      detail_data: {},
      rule_manual_option: [{
        label: this.$t('page.rule.detail.ui_rule_edit'),
        value: '0'
      }, {
        label: this.$t('page.rule.detail.manual_code_rule_edit'),
        value: '1'
      },],
      rule_status_option: [{
        label: this.$t('page.rule.rule_on'),
        value: 1
      }, {
        label: this.$t('page.rule.rule_off'),
        value: 0
      },],
      //命中动作
      rule_action_option: [{
        label: this.$t('page.rule.detail.rule_action_deny'),
        value: 'deny'
      }, {
        label: this.$t('page.rule.detail.rule_action_allow'),
        value: 'allow'
      }, {
        label: this.$t('page.rule.detail.rule_action_log'),
        value: 'log'
      },],
      //放行时可跳过的检测模块（与后端 utils.RuleSkipModules 保持一致）
      rule_skip_module_option: [
        { label: this.$t('page.rule.detail.skip_module_all'), value: 'ALL' },
        { label: this.$t('page.rule.detail.skip_module_bot'), value: 'BOT' },
        { label: this.$t('page.rule.detail.skip_module_sqli'), value: 'SQLI' },
        { label: this.$t('page.rule.detail.skip_module_xss'), value: 'XSS' },
        { label: this.$t('page.rule.detail.skip_module_scan'), value: 'SCAN' },
        { label: this.$t('page.rule.detail.skip_module_rce'), value: 'RCE' },
        { label: this.$t('page.rule.detail.skip_module_dir'), value: 'DIR' },
        { label: this.$t('page.rule.detail.skip_module_cc'), value: 'CC' },
        { label: this.$t('page.rule.detail.skip_module_ai'), value: 'AI' },
        { label: this.$t('page.rule.detail.skip_module_sensitive'), value: 'SENSITIVE' },
        { label: this.$t('page.rule.detail.skip_module_owasp'), value: 'OWASP' },
        { label: this.$t('page.rule.detail.skip_module_antileech'), value: 'ANTILEECH' },
        { label: this.$t('page.rule.detail.skip_module_csrf'), value: 'CSRF' },
        { label: this.$t('page.rule.detail.skip_module_upload'), value: 'UPLOAD' },
        { label: this.$t('page.rule.detail.skip_module_captcha'), value: 'CAPTCHA' },
      ],
      rules: {
        rule_name: [{ required: true, message: this.$t('common.placeholder') + this.$t('page.rule.detail.rule_name'), type: 'error' }],
      },
      fact_option: [{
        label: this.$t('page.rule.detail.mf_option_default'),
        value: 'MF'
      },],
      method_option: [{
        label: this.$t('page.rule.detail.method_option'),
        value: 'DoSomeThing'
      },],
      attr_option: [{
        label: this.$t('page.rule.detail.inner_option_host'),
        value: 'HOST'
      },
      {
        label: this.$t('page.rule.detail.inner_option_url'),
        value: 'URL'
      },
      {
        label: this.$t('page.rule.detail.inner_option_referrer'),
        value: 'REFERER'
      },
      {
        label: this.$t('page.rule.detail.inner_option_user_agent'),
        value: 'USER_AGENT'
      },
      {
        label: this.$t('page.rule.detail.inner_option_method'),
        value: 'METHOD'
      },
      {
        label: this.$t('page.rule.detail.inner_option_cookies'),
        value: 'COOKIES'
      },
      {
        label: this.$t('page.rule.detail.inner_option_body'),
        value: 'BODY'
      },
      {
        label: this.$t('page.rule.detail.inner_option_port'),
        value: 'PORT'
      },
      {
        label: this.$t('page.rule.detail.inner_option_src_ip'),
        value: 'SRC_IP'
      },
      {
        label: this.$t('page.rule.detail.inner_option_country'),
        value: 'COUNTRY'
      },
      {
        label: this.$t('page.rule.detail.inner_option_province'),
        value: 'PROVINCE'
      }, {
        label: this.$t('page.rule.detail.inner_option_city'),
        value: 'CITY'
      },       {
        label: this.$t('page.rule.detail.inner_option_getheadervalue'),
        value: 'GetHeaderValue("HeaderKeyName")'
      },
      {
        label: this.$t('page.rule.detail.inner_option_getipfailurecount'),
        value: 'GetIPFailureCount(5)'
      },
      {
        label: this.$t('page.rule.detail.inner_option_issafebot'),
        value: 'IsSafeBot()'
      }

      ],
      attr_type_option: [{
        label: this.$t('page.rule.detail.attr_type_text'),
        value: 'string'
      },
      {
        label: this.$t('page.rule.detail.attr_type_int'),
        value: 'int'
      },
      ],
      attr_judge_option: [
        {
          label: this.$t('page.rule.detail.judge_equal'),
          value: '=='
        },
        {
          label: this.$t('page.rule.detail.judge_not_equal'),
          value: '!='
        },
        {
          label: this.$t('page.rule.detail.judge_greater_than'),
          value: '>'
        },
        {
          label: this.$t('page.rule.detail.judge_less_than'),
          value: '<'
        },
        {
          label: this.$t('page.rule.detail.judge_greater_than_equal'),
          value: '>='
        },
        {
          label: this.$t('page.rule.detail.judge_less_than_equal'),
          value: '<='
        },
        {
          label: this.$t('page.rule.detail.judge_contain'),
          value: 'system.Contains'
        },
        {
          label: this.$t('page.rule.detail.judge_has_prefix'),
          value: 'system.HasPrefix'
        },
        {
          label: this.$t('page.rule.detail.judge_has_suffix'),
          value: 'system.HasSuffix'
        },
      ],
      relation_symbol_option: [{
        label: this.$t('page.rule.detail.judge_logic_and'),
        value: '&&'
      },
      {
        label: this.$t('page.rule.detail.judge_logic_or'),
        value: '||'
      },
      ],
      formData: {
        ...copyObj(RULE),
      },
      formCodemirrorContent: '',//代码传入值
      //主机列表
      host_options: [],
      //uuid标识
      ruleuuid: "",
      //来源日志的字符串
      fromLogContentStr: "",
      //来源的字段
      fromSourcePoint: "",
      //获取的detail的值
      ruleDetail: {},
      rulePreviewContent: "",//规则预览内容
      // 测试规则相关
      testDialogVisible: false,
      testFormData: {
        test_src_ip: '127.0.0.1',
        test_host: 'example.com:80',
        test_url: '/api/test',
        test_method: 'GET',
        test_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        test_referer: '',
        test_header: '',
        test_cookies: '',
        test_body: '',
      },
      testResult: null,
      // AI 提示词弹窗
      aiPromptDialogVisible: false,
      aiPromptText: '',
      // GPT 参数设置弹窗
      gptConfigDialogVisible: false,
      gptConfigLoading: false,
      gptConfigSaving: false,
      gptConfig: { gpt_url: '', gpt_model: '', gpt_token: '', has_token: false },
      gptProviders: GPT_PROVIDERS,
      // AI 生成规则
      aiGenIntent: '',
      aiGenLoading: false,
      aiGenResult: null,
      // 示例浏览器：分类 + 视图模式
      exampleCategory: 'action',
      exampleViewMode: 'card',
      ruleExampleCategories: [
        { value: 'action', label: this.$t('page.rule.detail.example_cat_action') },
        { value: 'scenario', label: this.$t('page.rule.detail.example_cat_scenario') },
        { value: 'combo', label: this.$t('page.rule.detail.example_cat_combo') },
        { value: 'function', label: this.$t('page.rule.detail.example_cat_function') },
      ],
      ruleExampleViewModes: [
        { value: 'card', label: this.$t('page.rule.detail.example_view_card') },
        { value: 'table', label: this.$t('page.rule.detail.example_view_table') },
        { value: 'explain', label: this.$t('page.rule.detail.example_view_explain') },
      ],
      exampleTableColumns: [
        { colKey: 'title', title: this.$t('page.rule.detail.example_col_scene'), width: 200 },
        { colKey: 'cond', title: this.$t('page.rule.detail.example_col_cond'), ellipsis: true },
        { colKey: 'actionTag', title: this.$t('page.rule.detail.example_col_action'), width: 90 },
        { colKey: 'ops', title: this.$t('page.rule.detail.example_col_ops'), width: 130 },
      ],
      ruleExamples: this.buildRuleExamples(),
    };
  },
  computed: {
    // 当前分类下的示例
    filteredExamples() {
      return this.ruleExamples.filter((e) => e.cat === this.exampleCategory);
    },
  },
  beforeRouteUpdate(to, from) {
    console.log('beforeRouteUpdate')
  },
  mounted() {
    let that = this

    this.loadHostList()
    console.log('----mounted----')
    console.log(RULE)
    this.$bus.$on('codeedit', (e) => {
      console.log('消息总线 来自子组件e', e)
      this.formCodemirrorContent = e
    })
    //console.log(this.$route.params.req_uuid);
    if (this.$route.query.code != undefined) {

      this.op_rule_no = this.$route.query.code
      this.getDetail(this.op_rule_no);
    }
    if (this.$route.query.type != undefined) {

      this.op_type = this.$route.query.type

      if (this.op_type == "add" && this.$route.query.sourcePoint != undefined) {
        this.formData.is_manual_rule = this.$route.query.is_manual_rule
        this.fromLogContentStr = this.$route.query.contentstr
        this.formData.rule_base.rule_domain_code = this.$route.query.host_code
        this.fromSourcePoint = this.$route.query.sourcePoint
        this.setRuleContentByMode()
      } else if (this.op_type == "add" && this.$route.query.sourcePoint == undefined) {
        this.fromSourcePoint = "url"
        this.setRuleContentByMode()
      }
    }
  },
  beforeCreate() {
    console.log('----beforeCreate----')
  },
  created() {
    console.log('----created----')
    this.ruleuuid = this.genUuidv4()
    console.log(this.ruleuuid)
  },
  beforeMount() {
    console.log('----beforeMount----')
  },
  beforeUpdate() {
    console.log('----beforeUpdate----')
  },
  updated() {
    console.log('----updated----')
  },
  watch: {
    '$route.query.type'(newVal, oldVal) {
      console.log('route.query.type changed', newVal, oldVal)
      this.op_type = newVal
    },
    '$route.query.code'(newVal, oldVal) {
      console.log('route.query.code changed', newVal, oldVal)
      this.op_rule_no = newVal
      this.getDetail(newVal)
    },
  },
  methods: {
    // 重置表单数据
    resetFormData() {
      console.log('重置表单数据')
      // 重新生成UUID
      this.ruleuuid = this.genUuidv4()

      console.log("重置表单数据 before", this.formData)
      // 重置表单数据为初始状态
      this.formData = {
        ...copyObj(RULE)
      }
      console.log("重置表单数据 after", this.formData)

      console.log("重置表单数据 rule", RULE)
      // 重置代码编辑器内容
      this.formCodemirrorContent = ''
      // 重置其他相关数据
      this.fromLogContentStr = ""
      this.fromSourcePoint = ""
      // 清空操作规则号
      this.op_rule_no = ""
    },
    backPage() {
      history.go(-1)
    },
    loadHostList() {
      let that = this;
      allhost().then((res) => {
        let resdata = res
        console.log(resdata)
        if (resdata.code === 0) {
          that.host_options = resdata.data;
        }
      })
        .catch((e: Error) => {
          console.log(e);
        })
    },
    getDetail(id) {
      let that = this
      wafRuleDetailApi(
        {
          CODE: id
        })
        .then((res) => {
          let resdata = res
          console.log("rule detail",resdata)
          if (resdata.code === 0) {

            //const { list = [] } = resdata.data;

            that.formData = JSON.parse(resdata.data.rule_content_json);
            that.formData.rule_status = resdata.data.rule_status
            //老规则没有动作字段，补默认值（拦截），保证界面正常显示且行为不变
            if (!that.formData.rule_action) {
              that.$set(that.formData, 'rule_action', 'deny')
            }
            if (!that.formData.rule_action_skips) {
              that.$set(that.formData, 'rule_action_skips', [])
            }
            that.ruleDetail = resdata.data

            console.log('返回的', that.formData)
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => { });
    },
    onSubmit({ result, firstError }): void {
      let that = this
      if (!firstError) {
        let postdata = {}
        let url = ''
        if (that.op_type == "add") {
          that.formData.rule_base.salience = parseInt(that.formData.rule_base.salience)
          that.formData.rule_content = that.formCodemirrorContent
          // 使用正则替换rule_content中的salience值
          that.formData.rule_content = that.formData.rule_content.replace(
            /salience\s+\d+/g,
            `salience ${that.formData.rule_base.salience}`
          )
          url = '/wafhost/rule/add'
          postdata = {
            rule_json: JSON.stringify(that.formData),
            is_manual_rule: parseInt(that.formData.is_manual_rule),
            rule_content: that.formCodemirrorContent,
            rule_code: that.ruleuuid,
            rule_status: that.formData.rule_status
          }
          console.log("rule add postdata",postdata);


          wafRuleAddApi(postdata)
            .then((res) => {
              let resdata = res
              console.log(resdata)
              if (resdata.code === 0) {
                that.$message.success(resdata.msg);
                that.resetFormData()
                this.$router.push(
                  {
                    path: '/waf-host/wafrule',
                  },
                );

              } else {
                that.$message.warning(resdata.msg);
              }
            })
            .catch((e: Error) => {
              console.log(e);
            })
        } else {
          url = '/wafhost/rule/edit'
          that.formData.rule_content = that.formCodemirrorContent
          that.formData.rule_base.salience = parseInt(that.formData.rule_base.salience)
          // 使用正则替换rule_content中的salience值
          that.formData.rule_content = that.formData.rule_content.replace(
            /salience\s+\d+/g,
            `salience ${that.formData.rule_base.salience}`
          )
          postdata = {
            code: that.op_rule_no,
            rule_json: JSON.stringify(that.formData),
            is_manual_rule: parseInt(that.formData.is_manual_rule),
            rule_content: that.formCodemirrorContent,
            rule_status: that.formData.rule_status
          }
          console.log("formCodemirrorContent", that.formCodemirrorContent)
          console.log('edit postdata', postdata)
          wafRuleEditApi(postdata)
            .then((res) => {
              let resdata = res
              console.log(resdata)
              if (resdata.code === 0) {
                that.$message.success(resdata.msg);
                that.resetFormData()
                this.$router.push(
                  {
                    path: '/waf-host/wafrule',
                  },
                );

              } else {
                that.$message.warning(resdata.msg);
              }
            })
            .catch((e: Error) => {
              console.log(e);
            })
        }
      } else {
        console.log('Errors: ', result);
        that.$message.warning(firstError);
      }
    },
    ruleDynAdd(add_type, parent_index) {
      console.log(add_type)
      console.log(parent_index)
      console.log(this.formData)
      switch (add_type) {
        case "cond":
          this.formData.rule_condition.relation_detail.push(copyObj(RULE_RELATION_DETAIL))
          break;
        case "assignment":
          this.formData.rule_do_assignment.push(copyObj(RULE_DO_ASSIGNMENT))
          break;
        case "method":
          console.log(RULE_DO_METHOD)
          this.formData.rule_do_method.push(copyObj(RULE_DO_METHOD))
          break;
        case "parms":
          console.log(RULE_DO_METHOD_PARM)
          console.log(this.formData.rule_do_method[parent_index])
          this.formData.rule_do_method[parent_index].parms.push(copyObj(RULE_DO_METHOD_PARM))
          break;
        default:
          break;
      }
    },
    ruleDynDel(del_type, index, parent_index) {
      console.log(del_type)
      console.log(index)
      console.log(this.formData)
      switch (del_type) {
        case "cond":
          this.formData.rule_condition.relation_detail.splice(index, 1)
          break;
        case "assignment":
          this.formData.rule_do_assignment.splice(index, 1)
          break;
        case "method":
          this.formData.rule_do_method.splice(index, 1)
          break;
        case "parms":
          this.formData.rule_do_method[parent_index].parms.splice(index, 1)
          break;
        default:
          break;
      }
    },
    edtinput(e) {
      console.log('来子组件', e)
    },
    getinfoClick(e) {
      console.log(e)

      console.log(this.$refs.changeSql)
    },
    //切换模式触发
    changeManualRule(e) {
      console.log("changeManualRule", e, this.formData.rule_content)

      /*if(this.formData.rule_content!=""){
        return
      }*/
      console.log("changeManualRule", e)

      //手工编排
      if (e == "1") {
        this.setRuleContentByMode()
      }else{
        // 触发规则预览
        this.onFormChange()
      }
    },
    setRuleContentByMode() {
      let that = this
      let rulename = this.ruleuuid.replace(/-/g, "")// 这个全局替换查找到的字符
      let ruleremark = this.formData.rule_base.rule_name
      let rule_salience = parseInt(this.formData.rule_base.salience)
      let bean = "USER_AGENT";
      switch (this.fromSourcePoint) {
        case "url": bean = "URL"; break
        case "header": bean = "HEADER"; break
        case "user_agent": bean = "USER_AGENT"; break
        case "cookies": bean = "COOKIES"; break
        case "body": bean = "BODY"; break
      }
      //fromLogContentStr 来自攻击日志，是攻击者可控的原文，拼进规则前必须转义，
      //否则攻击者构造一段带引号的内容就能改写规则动作（真正的防线在后端，这里是第一道）
      let safeContent = this.escapeGrlString(that.fromLogContentStr)
      let safeRemark = this.escapeGrlString(ruleremark)
      let rule_condition = "MF." + bean + ".Contains(\"" + safeContent + "\")==true"
      let rule_action = this.genRuleActionStmt()
      let str = `rule R${rulename} "${safeRemark}" salience ${rule_salience} {
            when
                ${rule_condition}
            then
                ${rule_action}
        } `;
      this.$nextTick(() => {
        that.$bus.$emit("showcodeedit", str)
      });
    },
    //把字符串转义成 GRL 双引号字面量内容，剔除换行/控制字符（与后端 model.EscapeGrlString 一致）
    escapeGrlString(s) {
      if (s == null) return ""
      let out = ""
      for (const ch of String(s)) {
        const code = ch.charCodeAt(0)
        if (ch === '\\') out += '\\\\'
        else if (ch === '"') out += '\\"'
        else if (ch === '\r' || ch === '\n' || ch === '\t') { /* 丢弃 */ }
        else if (code < 0x20 || code === 0x7f) { /* 丢弃控制字符 */ }
        else out += ch
      }
      return out
    },
    //根据界面选择生成 then 块里的动作语句
    genRuleActionStmt() {
      const action = this.formData.rule_action || 'deny'
      if (action === 'log') return 'RF.Log();'
      if (action === 'allow') {
        const skips = (this.formData.rule_action_skips || []).map(m => String(m).toUpperCase())
        if (skips.indexOf('ALL') >= 0) return 'RF.AllowAll();'
        if (skips.length === 0) return 'RF.Allow();'
        return 'RF.Allow(' + skips.map(m => '"' + m + '"').join(', ') + ');'
      }
      return 'RF.Deny();'
    },
    //动作变更后刷新预览
    onRuleActionChange() {
      if (this.formData.rule_action !== 'allow') {
        this.formData.rule_action_skips = []
      }
      this.onFormChange()
    },
    //跳过模块变更：选了"全部"就清掉其他选项
    onRuleActionSkipsChange(val) {
      if (Array.isArray(val) && val.length > 1 && val.indexOf('ALL') >= 0) {
        this.formData.rule_action_skips = ['ALL']
      }
      this.onFormChange()
    },
    //跳转界面
    handleJumpOnlineUrl() {
      window.open(this.samwafglobalconfig.getOnlineUrl() + "/guide/Rule.html#_1-脚本编辑");
    },
    //引导创建网站
    handleJumpAttackLogOperation() {
      this.$router.push(
        {
          path: '/waf/wafattacklog',
          query: {
            sourcePage: "AddRule",
          },
        },
      );
    },
    //end method
    onAttrChange(item) {
      // 依据选择的范围，自动调整值类型
      if ((item.attr || '').toUpperCase() === 'PORT') {
        item.attr_type = 'int'
      } else {
        item.attr_type = 'string'
      }
      // 触发规则预览
      this.onFormChange()
    },
    onFormChange() {
      // 编排模式下任意字段变更后，刷新预览
      this.fetchRulePreview()
    },
    buildPreviewPayload() {
      // 统一构造 RuleJson（与后端 RuleInfo JSON结构一致）
      const ruleJsonObj = {
        is_manual_rule: this.formData.is_manual_rule,
        rule_content: this.formData.rule_content,
        rule_action: this.formData.rule_action || 'deny',
        rule_action_skips: this.formData.rule_action_skips || [],
        rule_base: this.formData.rule_base,
        rule_condition: this.formData.rule_condition,
        rule_do_assignment: this.formData.rule_do_assignment,
        rule_do_method: this.formData.rule_do_method,
      }
      let ruleCode = "";
      console.log("buildPreviewPayload this.ruledetail",this.ruleDetail)
      //如果是编辑的情况下 需要把code也传进去
      if(this.ruleDetail && this.ruleDetail.rule_code){
          ruleCode = this.ruleDetail.rule_code
      }else{
          ruleCode = this.ruleuuid.replace(/-/g, "")// 这个全局替换查找到的字符
      }
      return {
        rule_code: ruleCode,
        rule_json: JSON.stringify(ruleJsonObj),
        is_manual_rule: Number(this.formData.is_manual_rule),
        rule_content: this.formData.rule_content || '',
      }
    },
    async fetchRulePreview() {
      try {
        const payload = this.buildPreviewPayload()
        console.log("fetchRulePreview",payload)
        const res = await wafRuleFormatApi(payload)
        const resdata = res
        if (resdata.code === 0) {
          this.rulePreviewContent = (resdata.data && resdata.data.rule_content) ? resdata.data.rule_content : ''
        } else {
          this.$message.warning(resdata.msg || '预览格式化失败')
        }
      } catch (e) {
        console.log(e)
        this.$message.error('预览请求异常')
      }
    },
     onAttrJudgeChange(item) {
      const isFunc = (item.attr_judge || '').startsWith('system.')
      if (!isFunc) {
        item.attr_val2 = ''
      } else {
        // 切换为函数时，默认置为 true（仅在为空或非 true/false 时）
        if (item.attr_val2 !== 'true' && item.attr_val2 !== 'false') {
          item.attr_val2 = 'true'
        }
      }
      if (typeof this.onFormChange === 'function') {
        this.onFormChange()
      }
    },
    genUuidv4(){ 
      let uuid = uuidv4()
      console.log("genUuidv4",uuid);
      return uuid
    },
    // 测试规则相关方法
    handleTestRule() {
      this.testResult = null;
      this.testDialogVisible = true;
    },
    async onConfirmTest() {
      const that = this;
      
      // 构建测试请求数据
      const testData = {
        rule_json: JSON.stringify(that.formData),
        rule_content: that.formCodemirrorContent,
        is_manual_rule: parseInt(that.formData.is_manual_rule),
        rule_code: that.ruleuuid,
        test_src_ip: that.testFormData.test_src_ip,
        test_host: that.testFormData.test_host,
        test_url: that.testFormData.test_url,
        test_method: that.testFormData.test_method,
        test_user_agent: that.testFormData.test_user_agent,
        test_referer: that.testFormData.test_referer,
        test_header: that.testFormData.test_header,
        test_cookies: that.testFormData.test_cookies,
        test_body: that.testFormData.test_body,
      };
      
      try {
        const res = await wafRuleTestApi(testData);
        const resdata = res;
        console.log('测试结果-完整响应', resdata);
        console.log('测试结果-data部分', resdata.data);
        
        if (resdata.code === 0) {
          // 使用 Vue.set 确保响应式,或者创建新对象
          that.testResult = {
            is_match: resdata.data.is_match,
            matched_rules: resdata.data.matched_rules || [],
            matched_rule_details: resdata.data.matched_rule_details || [],
            effective_action: resdata.data.effective_action || '',
            effective_skip_modules: resdata.data.effective_skip_modules || [],
            parsed_country: resdata.data.parsed_country || '',
            parsed_province: resdata.data.parsed_province || '',
            parsed_city: resdata.data.parsed_city || ''
          };
          console.log('设置后的testResult', that.testResult);
          console.log('parsed_country值:', that.testResult.parsed_country);
          console.log('parsed_province值:', that.testResult.parsed_province);
          console.log('parsed_city值:', that.testResult.parsed_city);
          that.$message.success('测试完成');
        } else {
          that.$message.warning(resdata.msg || '测试失败');
        }
      } catch (e) {
        console.log(e);
        that.$message.error('测试请求异常');
      }
    },
    onCancelTest() {
      this.testDialogVisible = false;
      this.testResult = null;
    },
    //动作标签配色：拦截红/放行绿/仅记录蓝
    ruleActionTheme(action) {
      switch (action) {
        case 'allow': return 'success'
        case 'log': return 'primary'
        default: return 'danger'
      }
    },
    ruleActionLabel(action) {
      switch (action) {
        case 'allow': return this.$t('page.rule.detail.rule_action_allow')
        case 'log': return this.$t('page.rule.detail.rule_action_log')
        default: return this.$t('page.rule.detail.rule_action_deny')
      }
    },
    // 打开 AI 提示词弹窗（提示词唯一来源在后端，按当前界面语言取用）
    async openAiPrompt() {
      const lang = (this.$i18n && this.$i18n.locale) || 'zh_CN'
      this.aiPromptDialogVisible = true
      try {
        const res = await wafRuleAiPromptApi({ lang })
        if (res.code === 0 && res.data) {
          this.aiPromptText = res.data
        } else {
          this.$message.warning(res.msg || this.$t('page.rule.detail.ai_gen_fail'))
        }
      } catch (e) {
        console.log(e)
        this.$message.error(this.$t('page.rule.detail.ai_gen_fail'))
      }
    },
    copyAiPrompt() {
      this.copyExample(this.aiPromptText)
    },
    // 预设服务商说明（按界面语言）
    gptPresetDesc(p) {
      const en = ((this.$i18n && this.$i18n.locale) || '').toLowerCase().indexOf('en') === 0
      return en ? p.en : p.zh
    },
    // 打开 GPT 参数设置弹窗并拉取当前配置（密钥不回传明文）
    async openGptConfig() {
      this.gptConfigDialogVisible = true
      this.gptConfigLoading = true
      this.gptConfig.gpt_token = ''
      try {
        const res = await wafGptConfigGetApi()
        if (res.code === 0 && res.data) {
          this.gptConfig.gpt_url = res.data.gpt_url || ''
          this.gptConfig.gpt_model = res.data.gpt_model || ''
          this.gptConfig.has_token = !!res.data.has_token
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.gptConfigLoading = false
      }
    },
    // 应用预设：填 url + 选定/默认模型
    applyGptPreset(p, model) {
      this.gptConfig.gpt_url = p.url
      this.gptConfig.gpt_model = model || (p.models && p.models[0]) || ''
    },
    // 保存 GPT 参数（token 留空表示保留原密钥）
    async saveGptConfig() {
      if (!this.gptConfig.gpt_url || !this.gptConfig.gpt_model) {
        this.$message.warning(this.$t('page.rule.detail.gpt_url_model_required'))
        return
      }
      this.gptConfigSaving = true
      try {
        const res = await wafGptConfigSaveApi({
          gpt_url: this.gptConfig.gpt_url.trim(),
          gpt_model: this.gptConfig.gpt_model.trim(),
          gpt_token: (this.gptConfig.gpt_token || '').trim(),
        })
        if (res.code === 0) {
          this.$message.success(this.$t('page.rule.detail.gpt_save_ok'))
          if ((this.gptConfig.gpt_token || '').trim()) {
            this.gptConfig.has_token = true
          }
          this.gptConfig.gpt_token = ''
          this.gptConfigDialogVisible = false
        } else {
          this.$message.warning(res.msg || this.$t('page.rule.detail.gpt_save_fail'))
        }
      } catch (e) {
        console.log(e)
        this.$message.error(this.$t('page.rule.detail.gpt_save_fail'))
      } finally {
        this.gptConfigSaving = false
      }
    },
    // 调用后台 AI 生成规则（后端已做校验/修复闭环）
    async onAiGenRule() {
      const intent = (this.aiGenIntent || '').trim()
      if (!intent) {
        this.$message.warning(this.$t('page.rule.detail.ai_gen_empty'))
        return
      }
      this.aiGenLoading = true
      this.aiGenResult = null
      try {
        const res = await wafRuleAiGenApi({
          intent,
          lang: (this.$i18n && this.$i18n.locale) || 'zh_CN',
          host_code: this.formData.rule_base.rule_domain_code || '',
        })
        if (res.code === 0 && res.data) {
          this.aiGenResult = res.data
        } else {
          this.$message.warning(res.msg || this.$t('page.rule.detail.ai_gen_fail'))
        }
      } catch (e) {
        console.log(e)
        this.$message.error(this.$t('page.rule.detail.ai_gen_fail'))
      } finally {
        this.aiGenLoading = false
      }
    },
    // 把 AI 生成的规则应用到编辑器（复用示例应用逻辑，自动替换规则名为当前唯一码）
    applyAiGenRule() {
      if (!this.aiGenResult || !this.aiGenResult.rule_content) return
      this.applyExample({ code: this.aiGenResult.rule_content, multi: false })
    },
    // 复制示例代码到剪贴板
    copyExample(code) {
      const ok = () => this.$message.success(this.$t('page.rule.detail.example_copied'))
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(code).then(ok).catch(() => this.fallbackCopy(code, ok))
      } else {
        this.fallbackCopy(code, ok)
      }
    },
    fallbackCopy(text, ok) {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        ok()
      } catch (e) {
        this.$message.error(this.$t('page.rule.detail.example_copy_fail'))
      }
      document.body.removeChild(ta)
    },
    // 把示例应用到手工代码编辑器（自动把规则名替换成当前规则的唯一码）
    applyExample(ex) {
      if (ex.multi) {
        this.$message.warning(this.$t('page.rule.detail.example_multi_tip'))
        return
      }
      const realname = this.ruleuuid.replace(/-/g, '')
      const applied = ex.code.replace(/rule\s+R[A-Za-z0-9]+/, 'rule R' + realname)
      this.formData.rule_content = applied
      this.formCodemirrorContent = applied
      this.$nextTick(() => {
        this.$bus.$emit('showcodeedit', applied)
      })
      this.$message.success(this.$t('page.rule.detail.example_applied'))
    },
    // 构造示例数据（四类：命中动作/实战场景/组合条件/函数大全）
    buildRuleExamples() {
      const mk = (o) => ({
        cat: o.cat,
        action: o.action || 'deny',
        title: o.title,
        desc: o.desc || '',
        cond: o.cond || '',
        effect: o.effect || '',
        multi: o.multi || false,
        code: o.code || `rule Rexample "${o.title}" salience ${o.salience || 10} {\n    when\n        ${o.cond}\n    then\n        ${o.then || 'RF.Deny();'}\n}`,
      })
      return [
        // ===== 命中动作 =====
        mk({ cat: 'action', action: 'deny', title: '拦截（默认动作，可不写）', desc: '命中规则即阻止请求并返回拦截页。不写任何动作时默认就是拦截。', cond: 'MF.URL.Contains("/wp-admin") == true', then: 'RF.Deny();', effect: '命中的请求被拦截并记入攻击日志' }),
        mk({ cat: 'action', action: 'allow', title: '放行（后续检测照常）', desc: '命中后不被自定义规则拦截，但 SQLI/XSS/CC 等后续检测仍会执行。', cond: 'RF.IPInCIDR(MF.SRC_IP, "192.168.0.0/16") == true && MF.URL.HasPrefix("/admin") == true', then: 'RF.Allow();', salience: 100, effect: '内网访问后台不被规则拦，但仍受其他防护保护' }),
        mk({ cat: 'action', action: 'allow', title: '放行并跳过指定检测（CC/AI）', desc: '放行的同时跳过 CC、AI 检测。需在系统配置把"规则编排模式"设为"规则优先"才能跳过 CC 等前置检测。', cond: 'RF.IPEquals(MF.SRC_IP, "10.0.0.5") == true', then: 'RF.Allow("CC", "AI");', salience: 100, effect: '监控探针不触发限流和AI检测' }),
        mk({ cat: 'action', action: 'allow', title: '完全放行（跳过后续所有检测）', desc: '白名单式直通后端，跳过后面全部检测环节。', cond: 'RF.IPInRanges(MF.SRC_IP, "203.0.113.10-203.0.113.20") == true', then: 'RF.AllowAll();', salience: 200, effect: '可信来源直达后端' }),
        mk({ cat: 'action', action: 'log', title: '仅记录（灰度观察）', desc: '命中只记日志不拦截，用于新规则上线前观察是否会误伤。', cond: 'MF.USER_AGENT.Contains("python-requests") == true', then: 'RF.Log();', effect: '命中写入日志但请求正常放行，确认无误后再改为拦截' }),

        // ===== 实战场景 =====
        mk({ cat: 'scenario', action: 'deny', title: '拦截海外访问', desc: '只允许中国大陆访客，其余国家/地区一律拦截。', cond: 'MF.COUNTRY != "中国"', then: 'RF.Deny();', effect: '非中国大陆来源被拦截' }),
        mk({ cat: 'scenario', action: 'deny', title: '拦截扫描器/攻击工具', desc: '通过 User-Agent 识别常见扫描器并拦截。', cond: 'RF.ContainsAnyIgnoreCase(MF.USER_AGENT, "sqlmap", "nikto", "nmap", "masscan", "acunetix") == true', then: 'RF.Deny();', effect: '常见扫描工具被挡在门外' }),
        mk({ cat: 'scenario', action: 'deny', title: '登录接口暴力破解防护', desc: '5分钟内登录失败超过10次的IP，访问登录接口时拦截。', cond: 'MF.URL.HasPrefix("/login") == true && MF.GetIPFailureCount(5) > 10', then: 'RF.Deny();', effect: '高频失败的IP被封，防撞库/爆破' }),
        mk({ cat: 'scenario', action: 'deny', title: '拦截危险文件访问', desc: '阻止访问 php/asp/jsp 等动态脚本文件（适合纯静态站）。', cond: 'RF.EndsWithAny(MF.URL, ".php", ".asp", ".jsp", ".aspx") == true', then: 'RF.Deny();', effect: '脚本文件访问被拒' }),
        mk({ cat: 'scenario', action: 'deny', title: '拦截WordPress后台探测', desc: '挡掉针对 WordPress 常见路径的探测。', cond: 'RF.ContainsAny(MF.URL, "/wp-admin", "/wp-login.php", "/xmlrpc.php") == true', then: 'RF.Deny();', effect: 'WordPress 常见攻击面被保护' }),
        mk({ cat: 'scenario', action: 'allow', title: '放行健康检查探针', desc: '放行监控探针对健康检查接口的访问，并跳过CC限流。', cond: 'RF.IPEquals(MF.SRC_IP, "10.0.0.5") == true && MF.URL.HasPrefix("/health") == true', then: 'RF.Allow("CC");', salience: 100, effect: '探针不被限流误封' }),
        mk({ cat: 'scenario', action: 'log', title: '灰度观察可疑UA', desc: '先用仅记录观察一段时间，确认不会误伤真实用户后再改为拦截。', cond: 'RF.ContainsAnyIgnoreCase(MF.USER_AGENT, "curl", "wget", "python") == true', then: 'RF.Log();', effect: '命中只记录，方便评估规则准确度' }),

        // ===== 组合条件 =====
        mk({ cat: 'combo', action: 'deny', title: '多条件 AND（&&）', desc: '同时满足多个条件才命中：海外访客 且 访问登录接口。', cond: 'MF.COUNTRY != "中国" && MF.URL.HasPrefix("/login") == true', then: 'RF.Deny();', effect: '仅海外访问登录接口时才拦截' }),
        mk({ cat: 'combo', action: 'deny', title: '多条件 OR（||）', desc: '满足任意一个条件即命中：多个内网段任一。', cond: 'RF.IPInCIDR(MF.SRC_IP, "10.0.0.0/8") == true || RF.IPInCIDR(MF.SRC_IP, "192.168.0.0/16") == true', then: 'RF.Deny();', effect: '任一内网段来源都会命中' }),
        mk({ cat: 'combo', action: 'deny', title: '复合条件（非安全Bot + 高频失败）', desc: '不是搜索引擎等安全Bot，且短时间大量失败，判定为恶意。', cond: 'RF.Not(MF.IsSafeBot()) == true && MF.GetIPFailureCount(1) > 30', then: 'RF.Deny();', effect: '排除正规爬虫后拦截高频失败来源' }),
        mk({ cat: 'combo', action: 'allow', title: 'salience 优先级（放行优先于拦截）', desc: '两条规则配合：办公室IP用高 salience 放行，海外访问用低 salience 拦截。命中多条时 salience 高者生效。需分两条规则分别创建。', multi: true, effect: '办公室IP即使来自海外也放行，其余海外访问被拦', code: `rule Roffice "办公室出口IP放行" salience 100 {\n    when\n        RF.IPInRanges(MF.SRC_IP, "203.0.113.10-203.0.113.20") == true\n    then\n        RF.Allow();\n}\n\nrule Roverseas "海外访问拦截" salience 10 {\n    when\n        MF.COUNTRY != "中国"\n    then\n        RF.Deny();\n}` }),

        // ===== 函数大全 =====
        mk({ cat: 'function', action: 'deny', title: 'IPInRange — IP区间判断', desc: '判断IP是否落在起止区间内。', cond: 'RF.IPInRange(MF.SRC_IP, "172.16.0.0", "172.20.255.254") == true', then: 'RF.Deny();' }),
        mk({ cat: 'function', action: 'deny', title: 'IPInRanges — 多区间/CIDR（类似SQL IN）', desc: '一次判断多个区间或CIDR，任一命中即真。', cond: 'RF.IPInRanges(MF.SRC_IP, "172.16.0.0-172.20.255.254", "10.0.0.0/8") == true', then: 'RF.Deny();' }),
        mk({ cat: 'function', action: 'deny', title: 'IPInCIDR — CIDR网段判断', desc: '判断IP是否在CIDR网段内。', cond: 'RF.IPInCIDR(MF.SRC_IP, "192.168.1.0/24") == true', then: 'RF.Deny();' }),
        mk({ cat: 'function', action: 'deny', title: 'IPEquals — IP精确相等', desc: '标准化比较两个IP是否相等（支持IPv4/IPv6）。', cond: 'RF.IPEquals(MF.SRC_IP, "1.2.3.4") == true', then: 'RF.Deny();' }),
        mk({ cat: 'function', action: 'deny', title: 'In / InIgnoreCase — 值在列表中', desc: '判断值是否等于列表中任意一个（IgnoreCase 忽略大小写）。', cond: 'RF.In(MF.METHOD, "PUT", "DELETE", "TRACE") == true', then: 'RF.Deny();' }),
        mk({ cat: 'function', action: 'deny', title: 'ContainsAny — 包含任意子串', desc: '字符串是否包含列表中任意一个子串。', cond: 'RF.ContainsAny(MF.URL, "../", "%2e%2e", "..;/") == true', then: 'RF.Deny();' }),
        mk({ cat: 'function', action: 'deny', title: 'ContainsAnyIgnoreCase — 包含任意（忽略大小写）', desc: '忽略大小写地判断是否包含任意子串。', cond: 'RF.ContainsAnyIgnoreCase(MF.USER_AGENT, "bot", "spider", "crawler") == true', then: 'RF.Deny();' }),
        mk({ cat: 'function', action: 'deny', title: 'ContainsAll — 同时包含全部', desc: '字符串是否同时包含列表中全部子串。', cond: 'RF.ContainsAll(MF.URL, "/admin", ".php") == true', then: 'RF.Deny();' }),
        mk({ cat: 'function', action: 'deny', title: 'StartsWithAny — 以任意前缀开头', desc: '字符串是否以列表中任意一个前缀开头。', cond: 'RF.StartsWithAny(MF.URL, "/admin", "/manage", "/api/internal") == true', then: 'RF.Deny();' }),
        mk({ cat: 'function', action: 'deny', title: 'EndsWithAny — 以任意后缀结尾', desc: '字符串是否以列表中任意一个后缀结尾。', cond: 'RF.EndsWithAny(MF.URL, ".php", ".asp", ".jsp") == true', then: 'RF.Deny();' }),
        mk({ cat: 'function', action: 'deny', title: 'IntInRange / IntIn — 数值判断', desc: 'IntInRange 判断整数是否在区间内；IntIn 判断是否等于列表中任意一个。', cond: 'RF.IntInRange(MF.PORT, 8000, 9000) == true', then: 'RF.Deny();' }),
        mk({ cat: 'function', action: 'deny', title: 'Not / IsEmpty / IsNotEmpty — 逻辑辅助', desc: 'Not 取反；IsEmpty / IsNotEmpty 判断字符串是否为空。', cond: 'RF.IsEmpty(MF.USER_AGENT) == true', then: 'RF.Deny();', effect: '例如拦截没有 User-Agent 的请求' }),
        mk({ cat: 'function', action: 'deny', title: 'LengthBetween — 长度区间', desc: '判断字符串长度是否在指定范围内。', cond: 'RF.LengthBetween(MF.URL, 512, 99999) == true', then: 'RF.Deny();', effect: '例如拦截超长URL' }),
        mk({ cat: 'function', action: 'deny', title: 'GetHeaderValue — 取请求头', desc: '取指定请求头的值再做判断。', cond: 'MF.GetHeaderValue("X-Forwarded-For").Contains("127.0.0.1") == true', then: 'RF.Deny();' }),
        mk({ cat: 'function', action: 'deny', title: 'GetIPFailureCount — 近N分钟失败次数', desc: '取该IP最近N分钟内的失败次数。', cond: 'MF.GetIPFailureCount(5) > 10', then: 'RF.Deny();' }),
        mk({ cat: 'function', action: 'allow', title: 'IsSafeBot — 是否安全爬虫', desc: '识别搜索引擎等正规爬虫，可放行避免误伤SEO。', cond: 'MF.IsSafeBot() == true', then: 'RF.Allow();', salience: 100, effect: '放行 Google/Bing 等正规爬虫' }),
      ]
    },
    //end method
  },
};
</script>
<style lang="less" scoped>
@import './index';

.rule-example-container {
  margin-top: 16px;
  border: 1px solid #e7e7e7;
  border-radius: 6px;
  overflow: hidden;
}

.rule-example-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e7e7e7;

  .t-icon {
    margin-right: 8px;
    color: #0052d9;
  }
}

.rule-example-title {
  font-weight: 500;
  color: #333;
}

.rule-example-code {
  margin: 0;
  padding: 12px;
  background-color: #fafafa;
  font-family: Consolas, Monaco, 'Andale Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre;
  overflow-x: auto;
}

/* 左右两侧容器高度一致 */
.rule-example-container,
.reference-container {
  min-height: 500px;
  max-height: 760px;
  display: flex;
  flex-direction: column;

  :deep(.t-tabs__content) {
    overflow-y: auto;
    max-height: 600px;
  }
}

/* 示例浏览器：工具条 */
.example-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #e7e7e7;
  background-color: #fafafa;
}

.example-view-switch {
  margin-left: auto;
}

/* 示例浏览器：内容区（可滚动，底部留白避免最后一行被裁切） */
.example-body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 12px 12px 24px;
  min-height: 0;
}

/* 卡片模式 */
.example-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.example-card {
  border: 1px solid #e7e7e7;
  border-radius: 6px;
  overflow: hidden;
}

.example-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #eee;
}

.example-card-title {
  font-weight: 500;
  color: #333;
  flex: 1 1 auto;
  min-width: 0;
}

.example-card-ops {
  flex: 0 0 auto;
}

.example-card-desc {
  padding: 8px 10px 0;
  color: #666;
  font-size: 12px;
  line-height: 1.6;
}

.example-code {
  margin: 8px 10px 10px;
  padding: 10px;
  background-color: #fafafa;
  border-radius: 4px;
  font-family: Consolas, Monaco, 'Andale Mono', monospace;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre;
  overflow-x: auto;
}

/* 详解模式 */
.example-explain {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.explain-item {
  border-left: 3px solid var(--td-brand-color, #0052d9);
  padding-left: 12px;
}

.explain-scene {
  display: flex;
  align-items: center;
  gap: 8px;
}

.explain-title {
  font-weight: 600;
  color: #333;
}

.explain-desc {
  margin-top: 6px;
  color: #666;
  font-size: 12px;
  line-height: 1.6;
}

.explain-effect {
  margin: 6px 0 8px;
  color: #555;
  font-size: 12px;
}

.explain-ops {
  display: flex;
  align-items: center;
  gap: 8px;
}

.explain-multi-tip {
  color: #e37318;
  font-size: 12px;
}

.ai-prompt-tip {
  margin-bottom: 8px;
  color: #666;
  font-size: 13px;
  line-height: 1.6;
}

.ai-prompt-textarea :deep(textarea) {
  font-family: Consolas, Monaco, 'Andale Mono', monospace;
  font-size: 12px;
  line-height: 1.55;
}

.ai-prompt-ops {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* GPT 参数设置 */
.ai-gen-setting {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.gpt-token-tip {
  color: var(--td-text-color-placeholder, #999);
  font-size: 12px;
  margin: 4px 0 12px 110px;
}
.gpt-preset-title {
  font-weight: 500;
  margin: 8px 0;
}
.gpt-preset-list {
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid var(--td-component-border, #e7e7e7);
  border-radius: 6px;
}
.gpt-preset-item {
  padding: 8px 12px;
  border-bottom: 1px solid var(--td-component-border, #eee);
}
.gpt-preset-item:last-child {
  border-bottom: none;
}
.gpt-preset-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.gpt-preset-name {
  font-weight: 500;
}
.gpt-preset-desc {
  color: var(--td-text-color-secondary, #888);
  font-size: 12px;
}
.gpt-preset-url {
  color: var(--td-text-color-secondary, #666);
  font-size: 12px;
  margin: 2px 0;
  word-break: break-all;
}
.gpt-preset-models {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0;
}
.gpt-preset-model {
  cursor: pointer;
}
.gpt-preset-ops {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 编辑器内 AI 生成规则面板 */
.ai-gen-panel {
  border: 1px solid var(--td-brand-color-3, #b5c7ff);
  border-radius: 6px;
  margin-bottom: 12px;
  overflow: hidden;
}
.ai-gen-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--td-brand-color-1, #f2f3ff);
  border-bottom: 1px solid var(--td-brand-color-2, #d9e1ff);
}
.ai-gen-icon {
  color: var(--td-brand-color, #0052d9);
}
.ai-gen-title {
  font-weight: 500;
  color: #333;
  flex: 1 1 auto;
}
.ai-gen-body {
  padding: 12px;
}
.ai-gen-ops {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}
.ai-gen-hint {
  color: #999;
  font-size: 12px;
}
.ai-gen-result {
  margin-top: 12px;
  border-top: 1px dashed #e7e7e7;
  padding-top: 10px;
}
.ai-gen-result-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ai-gen-err {
  color: #e37318;
  font-size: 12px;
}
.ai-gen-result-ops {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
:root[theme-mode='dark'] {
  .ai-gen-title {
    color: var(--td-text-color-primary);
  }
  .ai-gen-head {
    background-color: var(--td-bg-color-component);
    border-bottom-color: var(--td-component-border);
  }
  .ai-gen-panel {
    border-color: var(--td-component-border);
  }
}

/* 暗黑模式下「手工代码编排」区域背景与文字随主题变化 */
:root[theme-mode='dark'] {
  .rule-example-header {
    background-color: var(--td-bg-color-component);
    border-bottom-color: var(--td-component-border);

    .t-icon {
      color: var(--td-brand-color-5);
    }
  }

  .rule-example-title {
    color: var(--td-text-color-primary);
  }

  .rule-example-container {
    border-color: var(--td-component-border);
  }

  .rule-example-code {
    background-color: var(--td-bg-color-container);
    color: var(--td-text-color-primary);
  }

  .example-toolbar {
    background-color: var(--td-bg-color-component);
    border-bottom-color: var(--td-component-border);
  }

  .example-card,
  .example-card-head {
    border-color: var(--td-component-border);
  }

  .example-card-head {
    background-color: var(--td-bg-color-component);
  }

  .example-card-title,
  .explain-title {
    color: var(--td-text-color-primary);
  }

  .example-card-desc,
  .explain-desc,
  .explain-effect {
    color: var(--td-text-color-secondary);
  }

  .example-code {
    background-color: var(--td-bg-color-container);
    color: var(--td-text-color-primary);
  }
}
</style>
