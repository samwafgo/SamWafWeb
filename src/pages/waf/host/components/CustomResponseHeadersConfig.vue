<template>
  <div class="custom-response-headers-config">
    <!-- 总开关 -->
    <t-form-item :label="$t('page.host.custom_response_headers.is_enable')">
      <t-tooltip
        class="placement top center"
        :content="$t('page.host.custom_response_headers.is_enable_tips')"
        placement="top"
        :overlay-style="{ width: '300px' }"
        show-arrow
      >
        <t-radio-group v-model="localConfig.is_enable_custom_headers" @change="updateParent">
          <t-radio value="0">{{ $t('common.off') }}</t-radio>
          <t-radio value="1">{{ $t('common.on') }}</t-radio>
        </t-radio-group>
      </t-tooltip>
    </t-form-item>

    <template v-if="localConfig.is_enable_custom_headers == '1'">
      <!-- 使用说明 -->
      <t-alert
        theme="info"
        :message="$t('page.host.custom_response_headers.usage_guide')"
        style="margin-bottom: 16px;"
      />

      <!-- 快速添加预设规则 -->
      <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <span style="font-size: 13px; color: var(--td-text-color-secondary);">
          {{ $t('page.host.custom_response_headers.quick_add') }}:
        </span>
        <t-space>
          <t-button size="small" variant="outline" @click="addPresetRule('global_security')">
            {{ $t('page.host.custom_response_headers.preset_global_security') }}
          </t-button>
          <t-button size="small" variant="outline" @click="addPresetRule('media')">
            {{ $t('page.host.custom_response_headers.preset_media') }}
          </t-button>
          <t-button size="small" variant="outline" @click="addPresetRule('api')">
            {{ $t('page.host.custom_response_headers.preset_api') }}
          </t-button>
        </t-space>
      </div>

      <!-- 规则列表标题 -->
      <div class="section-title">{{ $t('page.host.custom_response_headers.rule_list') }}</div>

      <!-- 空状态 -->
      <div v-if="!localConfig.rules || localConfig.rules.length === 0" class="empty-hint">
        <t-icon name="info-circle" style="margin-right: 8px;" />
        {{ $t('page.host.custom_response_headers.no_rules') }}
      </div>

      <!-- 规则卡片列表 -->
      <div v-else class="rules-container">
        <div
          v-for="(rule, ruleIndex) in localConfig.rules"
          :key="ruleIndex"
          class="rule-card"
        >
          <!-- 规则卡片头部 -->
          <div class="rule-card-header">
            <div class="rule-header-left">
              <t-tag
                :theme="rule.match_type === 'global' || !rule.match_type ? 'primary' : 'default'"
                variant="light"
                size="small"
                style="margin-right: 8px;"
              >
                {{ getMatchTypeLabel(rule.match_type) }}
              </t-tag>
              <span class="rule-name-display">{{ rule.rule_name || $t('page.host.custom_response_headers.rule_name_placeholder') }}</span>
            </div>
            <t-button
              theme="danger"
              size="small"
              variant="outline"
              @click="removeRule(ruleIndex)"
            >
              <t-icon name="delete" style="margin-right: 4px;" />
              {{ $t('page.host.custom_response_headers.delete_rule') }}
            </t-button>
          </div>

          <!-- 规则基础配置 -->
          <div class="rule-card-body">
            <div class="rule-fields-row">
              <!-- 规则名称 -->
              <div class="rule-field">
                <label class="field-label">{{ $t('page.host.custom_response_headers.rule_name') }}</label>
                <t-input
                  v-model="rule.rule_name"
                  @change="updateParent"
                  :placeholder="$t('page.host.custom_response_headers.rule_name_placeholder')"
                  style="width: 180px;"
                />
              </div>

              <!-- 匹配类型 -->
              <div class="rule-field">
                <label class="field-label">{{ $t('page.host.custom_response_headers.match_type') }}</label>
                <t-select
                  v-model="rule.match_type"
                  @change="onMatchTypeChange(ruleIndex)"
                  style="width: 160px;"
                >
                  <t-option value="global" :label="$t('page.host.custom_response_headers.match_type_global')" />
                  <t-option value="prefix" :label="$t('page.host.custom_response_headers.match_type_prefix')" />
                  <t-option value="suffix" :label="$t('page.host.custom_response_headers.match_type_suffix')" />
                  <t-option value="exact" :label="$t('page.host.custom_response_headers.match_type_exact')" />
                  <t-option value="regex" :label="$t('page.host.custom_response_headers.match_type_regex')" />
                </t-select>
              </div>

              <!-- 匹配值（global 不显示） -->
              <div v-if="rule.match_type && rule.match_type !== 'global'" class="rule-field rule-field-grow">
                <label class="field-label">{{ $t('page.host.custom_response_headers.match_value') }}</label>
                <t-input
                  v-model="rule.match_value"
                  @change="updateParent"
                  :placeholder="getMatchValuePlaceholder(rule.match_type)"
                  style="width: 260px;"
                />
              </div>

              <!-- 合并模式（非 global 才有意义，global 本身就是基础） -->
              <div v-if="rule.match_type && rule.match_type !== 'global'" class="rule-field">
                <label class="field-label">{{ $t('page.host.custom_response_headers.merge_mode') }}</label>
                <t-select
                  v-model="rule.merge_mode"
                  @change="updateParent"
                  style="width: 220px;"
                >
                  <t-option value="merge" :label="$t('page.host.custom_response_headers.merge_mode_merge')" />
                  <t-option value="override" :label="$t('page.host.custom_response_headers.merge_mode_override')" />
                </t-select>
              </div>
            </div>

            <!-- 响应头列表 -->
            <div class="headers-section">
              <div class="headers-section-title">{{ $t('page.host.custom_response_headers.rule_headers_list') }}</div>

              <div v-if="!rule.headers || rule.headers.length === 0" class="empty-hint-small">
                <t-icon name="info-circle" style="margin-right: 6px;" />
                {{ $t('page.host.custom_response_headers.no_rule_headers') }}
              </div>

              <div v-else class="headers-container">
                <div
                  v-for="(header, headerIndex) in rule.headers"
                  :key="headerIndex"
                  class="header-item"
                >
                  <div class="header-item-row">
                    <div class="header-field">
                      <label class="field-label">{{ $t('page.host.custom_response_headers.header_name') }}</label>
                      <t-input
                        v-model="header.header_name"
                        @change="updateParent"
                        :placeholder="$t('page.host.custom_response_headers.header_name_placeholder')"
                        style="width: 220px;"
                      />
                    </div>

                    <div class="header-field header-value-field">
                      <label class="field-label">{{ $t('page.host.custom_response_headers.header_value') }}</label>
                      <t-input
                        v-model="header.header_value"
                        @change="updateParent"
                        :placeholder="$t('page.host.custom_response_headers.header_value_placeholder')"
                        style="min-width: 260px;"
                      >
                        <template #suffix>
                          <t-dropdown
                            :options="variableOptions"
                            @click="(data) => insertVariable(ruleIndex, headerIndex, data.value)"
                          >
                            <t-button size="small" variant="text" style="padding: 0 4px;">
                              <t-icon name="add-circle" style="margin-right: 4px;" />
                              {{ $t('page.host.custom_response_headers.insert_variable') }}
                            </t-button>
                          </t-dropdown>
                        </template>
                      </t-input>
                    </div>

                    <t-button
                      theme="danger"
                      size="small"
                      variant="outline"
                      @click="removeHeader(ruleIndex, headerIndex)"
                      class="delete-btn"
                    >
                      <t-icon name="delete" style="margin-right: 4px;" />
                      {{ $t('common.delete') }}
                    </t-button>
                  </div>
                </div>
              </div>

              <!-- 添加响应头按钮 -->
              <div class="add-header-btn-container">
                <t-button theme="default" variant="dashed" size="small" @click="addHeader(ruleIndex)">
                  <t-icon name="add" style="margin-right: 4px;" />
                  {{ $t('page.host.custom_response_headers.add_header') }}
                </t-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加规则按钮 -->
      <div class="add-rule-btn-container">
        <t-button theme="primary" variant="outline" size="small" @click="addRule">
          <t-icon name="add" style="margin-right: 4px;" />
          {{ $t('page.host.custom_response_headers.add_rule') }}
        </t-button>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
export default {
  name: 'CustomResponseHeadersConfig',
  props: {
    customResponseHeadersConfig: {
      type: Object,
      required: true,
    },
  },
  data() {
    const config = this.normalizeConfig(JSON.parse(JSON.stringify(this.customResponseHeadersConfig)));
    return {
      localConfig: config,
      variableOptions: [
        { content: '${client_ip}', value: '${client_ip}' },
        { content: '${remote_addr}', value: '${remote_addr}' },
        { content: '${host}', value: '${host}' },
        { content: '${scheme}', value: '${scheme}' },
        { content: '${request_uri}', value: '${request_uri}' },
        { content: '${request_method}', value: '${request_method}' },
        { content: '${header:X-Forwarded-For}', value: '${header:X-Forwarded-For}' },
        { content: '${header:User-Agent}', value: '${header:User-Agent}' },
        { content: '${header:Referer}', value: '${header:Referer}' },
      ],
    };
  },
  watch: {
    customResponseHeadersConfig: {
      handler(newVal) {
        const normalized = this.normalizeConfig(JSON.parse(JSON.stringify(newVal)));
        this.localConfig = normalized;
        // 若规范化后的数据与原始 prop 不同（例如旧格式 headers 被转为 rules），
        // 主动通知父组件，确保父组件 customResponseHeadersConfigData 也更新到 rules 格式，
        // 避免保存时父组件仍持有旧格式导致 rules 丢失。
        const hasOldHeaders = Array.isArray(newVal.headers) && newVal.headers.length > 0;
        const lacksRules = !Array.isArray(newVal.rules) || newVal.rules.length === 0;
        if (hasOldHeaders && lacksRules) {
          this.$nextTick(() => {
            this.updateParent();
          });
        }
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    /** 规范化配置结构，兼容旧格式（扁平 headers 列表）和新格式（rules 数组） */
    normalizeConfig(config: any) {
      if (typeof config.is_enable_custom_headers !== 'string') {
        config.is_enable_custom_headers = String(config.is_enable_custom_headers || 0);
      }
      // 向后兼容：若旧版有 headers 但没有 rules，转换为一条 global 规则
      if ((!config.rules || config.rules.length === 0) && config.headers && config.headers.length > 0) {
        config.rules = [
          {
            rule_name: '全局默认',
            match_type: 'global',
            match_value: '',
            merge_mode: 'merge',
            headers: config.headers,
          },
        ];
        delete config.headers;
      }
      if (!Array.isArray(config.rules)) {
        config.rules = [];
      }
      // 确保每条规则字段完整
      config.rules.forEach((rule: any) => {
        if (!rule.match_type) rule.match_type = 'global';
        if (!rule.merge_mode) rule.merge_mode = 'merge';
        if (!Array.isArray(rule.headers)) rule.headers = [];
      });
      return config;
    },

    updateParent() {
      this.$emit('update', JSON.parse(JSON.stringify(this.localConfig)));
    },

    getMatchTypeLabel(matchType: string) {
      const map: Record<string, string> = {
        global: this.$t('page.host.custom_response_headers.match_type_global') as string,
        prefix: this.$t('page.host.custom_response_headers.match_type_prefix') as string,
        suffix: this.$t('page.host.custom_response_headers.match_type_suffix') as string,
        exact: this.$t('page.host.custom_response_headers.match_type_exact') as string,
        regex: this.$t('page.host.custom_response_headers.match_type_regex') as string,
      };
      return map[matchType] || map['global'];
    },

    getMatchValuePlaceholder(matchType: string) {
      const map: Record<string, string> = {
        prefix: this.$t('page.host.custom_response_headers.match_value_placeholder_prefix') as string,
        suffix: this.$t('page.host.custom_response_headers.match_value_placeholder_suffix') as string,
        exact: this.$t('page.host.custom_response_headers.match_value_placeholder_exact') as string,
        regex: this.$t('page.host.custom_response_headers.match_value_placeholder_regex') as string,
      };
      return map[matchType] || (this.$t('page.host.custom_response_headers.match_value_placeholder_default') as string);
    },

    onMatchTypeChange(ruleIndex: number) {
      // 切换到 global 时清空 match_value，切换到其他类型时设默认 merge_mode
      const rule = this.localConfig.rules[ruleIndex];
      if (rule.match_type === 'global') {
        rule.match_value = '';
      }
      if (!rule.merge_mode) {
        rule.merge_mode = 'merge';
      }
      this.updateParent();
    },

    addRule() {
      if (!this.localConfig.rules) {
        this.$set(this.localConfig, 'rules', []);
      }
      this.localConfig.rules.push({
        rule_name: '',
        match_type: 'global',
        match_value: '',
        merge_mode: 'merge',
        headers: [],
      });
      this.updateParent();
    },

    removeRule(ruleIndex: number) {
      this.localConfig.rules.splice(ruleIndex, 1);
      this.updateParent();
    },

    addHeader(ruleIndex: number) {
      const rule = this.localConfig.rules[ruleIndex];
      if (!rule.headers) {
        this.$set(rule, 'headers', []);
      }
      rule.headers.push({ header_name: '', header_value: '' });
      this.updateParent();
    },

    removeHeader(ruleIndex: number, headerIndex: number) {
      this.localConfig.rules[ruleIndex].headers.splice(headerIndex, 1);
      this.updateParent();
    },

    insertVariable(ruleIndex: number, headerIndex: number, variable: string) {
      const header = this.localConfig.rules[ruleIndex].headers[headerIndex];
      if (header) {
        header.header_value = (header.header_value || '') + variable;
        this.updateParent();
      }
    },

    /** 快速添加预设规则 */
    addPresetRule(type: string) {
      if (!this.localConfig.rules) {
        this.$set(this.localConfig, 'rules', []);
      }
      let newRule: any = null;
      switch (type) {
        case 'global_security':
          newRule = {
            rule_name: '全局安全头',
            match_type: 'global',
            match_value: '',
            merge_mode: 'merge',
            headers: [
              { header_name: 'X-Frame-Options', header_value: 'SAMEORIGIN' },
              { header_name: 'X-Content-Type-Options', header_value: 'nosniff' },
              { header_name: 'X-XSS-Protection', header_value: '1; mode=block' },
            ],
          };
          break;
        case 'media':
          newRule = {
            rule_name: '媒体文件预览',
            match_type: 'suffix',
            match_value: '.mp4;.mp3;.flv;.mov;.webm;.ogg;.wav;.m4a',
            merge_mode: 'merge',
            headers: [
              { header_name: 'Content-Disposition', header_value: 'inline' },
              { header_name: 'Accept-Ranges', header_value: 'bytes' },
            ],
          };
          break;
        case 'api':
          newRule = {
            rule_name: 'API路径头',
            match_type: 'prefix',
            match_value: '/api/',
            merge_mode: 'merge',
            headers: [
              { header_name: 'X-API-Version', header_value: 'v1' },
              { header_name: 'Cache-Control', header_value: 'no-cache, no-store' },
            ],
          };
          break;
        default:
          newRule = {
            rule_name: '',
            match_type: 'global',
            match_value: '',
            merge_mode: 'merge',
            headers: [],
          };
      }
      this.localConfig.rules.push(newRule);
      this.updateParent();
      this.$message.success(this.$t('page.host.custom_response_headers.add_rule_success') as string);
    },
  },
};
</script>

<style lang="less" scoped>
.custom-response-headers-config {
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--td-text-color-primary);
    margin-bottom: 12px;
    padding-left: 8px;
    border-left: 3px solid var(--td-brand-color);
  }

  .empty-hint {
    padding: 24px;
    text-align: center;
    color: var(--td-text-color-placeholder);
    background: var(--td-bg-color-container);
    border-radius: 6px;
    border: 1px dashed var(--td-border-level-2-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    margin-bottom: 12px;
  }

  .rules-container {
    margin-bottom: 12px;
  }

  .rule-card {
    margin-bottom: 16px;
    border: 1px solid var(--td-border-level-1-color);
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--td-brand-color);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  .rule-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: var(--td-bg-color-container-hover);
    border-bottom: 1px solid var(--td-border-level-1-color);

    .rule-header-left {
      display: flex;
      align-items: center;
    }

    .rule-name-display {
      font-size: 13px;
      font-weight: 500;
      color: var(--td-text-color-primary);
    }
  }

  .rule-card-body {
    padding: 16px;
    background: var(--td-bg-color-container);
  }

  .rule-fields-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
    margin-bottom: 16px;
  }

  .rule-field {
    display: flex;
    flex-direction: column;
    gap: 6px;

    &.rule-field-grow {
      flex: 1;
    }

    .field-label {
      font-size: 12px;
      color: var(--td-text-color-secondary);
      font-weight: 500;
      line-height: 1.5;
    }
  }

  .headers-section {
    border-top: 1px dashed var(--td-border-level-2-color);
    padding-top: 12px;

    .headers-section-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--td-text-color-secondary);
      margin-bottom: 10px;
    }
  }

  .empty-hint-small {
    padding: 12px 16px;
    color: var(--td-text-color-placeholder);
    background: var(--td-bg-color-page);
    border-radius: 4px;
    border: 1px dashed var(--td-border-level-2-color);
    display: flex;
    align-items: center;
    font-size: 13px;
    margin-bottom: 10px;
  }

  .headers-container {
    margin-bottom: 8px;
  }

  .header-item {
    margin-bottom: 8px;
    padding: 10px 12px;
    background: var(--td-bg-color-page);
    border-radius: 4px;
    border: 1px solid var(--td-border-level-1-color);

    &:last-child {
      margin-bottom: 0;
    }

    .header-item-row {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      flex-wrap: wrap;

      .header-field {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .field-label {
          font-size: 12px;
          color: var(--td-text-color-secondary);
          font-weight: 500;
        }
      }

      .header-value-field {
        flex: 1;
      }

      .delete-btn {
        flex-shrink: 0;
        height: 32px;
      }
    }
  }

  .add-header-btn-container {
    margin-top: 8px;
  }

  .add-rule-btn-container {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--td-border-level-2-color);
  }
}
</style>
