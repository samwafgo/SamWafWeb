<template>
  <div class="custom-headers-config">
    <t-form-item :label="$t('page.host.custom_headers.is_enable')">
      <t-tooltip class="placement top center" :content="$t('page.host.custom_headers.is_enable_tips')" placement="top"
                 :overlay-style="{ width: '300px' }" show-arrow>
        <t-radio-group v-model="localConfig.is_enable_custom_headers" @change="updateParent">
          <t-radio value="0">{{ $t('common.off') }}</t-radio>
          <t-radio value="1">{{ $t('common.on') }}</t-radio>
        </t-radio-group>
      </t-tooltip>
    </t-form-item>

    <!-- 使用说明 -->
    <t-alert v-if="localConfig.is_enable_custom_headers == '1'" theme="info" :message="$t('page.host.custom_headers.usage_guide')" style="margin-bottom: 16px;">
      <template #operation>
        <span @click="showVariableHelp = !showVariableHelp" style="cursor: pointer;">
          {{ showVariableHelp ? $t('page.host.custom_headers.hide_help') : $t('page.host.custom_headers.show_help') }}
        </span>
      </template>
    </t-alert>

    <!-- 变量帮助面板 -->
    <t-collapse v-if="localConfig.is_enable_custom_headers == '1' && showVariableHelp" style="margin-bottom: 16px;">
      <t-collapse-panel :header="$t('page.host.custom_headers.variable_help_title')">
        <div class="variable-help">
          <div class="variable-section">
            <h4>{{ $t('page.host.custom_headers.builtin_variables') }}</h4>
            <ul>
              <li><code>${'${client_ip}'}</code> - {{ $t('page.host.custom_headers.var_client_ip') }}</li>
              <li><code>${'${remote_addr}'}</code> - {{ $t('page.host.custom_headers.var_remote_addr') }}</li>
              <li><code>${'${host}'}</code> - {{ $t('page.host.custom_headers.var_host') }}</li>
              <li><code>${'${scheme}'}</code> - {{ $t('page.host.custom_headers.var_scheme') }}</li>
              <li><code>${'${request_uri}'}</code> - {{ $t('page.host.custom_headers.var_request_uri') }}</li>
              <li><code>${'${request_method}'}</code> - {{ $t('page.host.custom_headers.var_request_method') }}</li>
              <li><code>${'${header:HeaderName}'}</code> - {{ $t('page.host.custom_headers.var_header') }}</li>
            </ul>
          </div>
          
          <div class="variable-section">
            <h4>{{ $t('page.host.custom_headers.usage_examples') }}</h4>
            <ul>
              <li>{{ $t('page.host.custom_headers.example_1') }}</li>
              <li>{{ $t('page.host.custom_headers.example_2') }}</li>
              <li>{{ $t('page.host.custom_headers.example_3') }}</li>
              <li>{{ $t('page.host.custom_headers.example_4') }}</li>
            </ul>
          </div>

          <div class="quick-add-section">
            <h4>{{ $t('page.host.custom_headers.quick_add') }}</h4>
            <t-space>
              <t-button size="small" variant="outline" @click="addPresetHeader('client_ip')">
                {{ $t('page.host.custom_headers.preset_client_ip') }}
              </t-button>
              <t-button size="small" variant="outline" @click="addPresetHeader('forwarded_for')">
                {{ $t('page.host.custom_headers.preset_forwarded_for') }}
              </t-button>
              <t-button size="small" variant="outline" @click="addPresetHeader('real_ip')">
                {{ $t('page.host.custom_headers.preset_real_ip') }}
              </t-button>
              <t-button size="small" variant="outline" @click="addPresetHeader('custom')">
                {{ $t('page.host.custom_headers.preset_custom') }}
              </t-button>
            </t-space>
          </div>
        </div>
      </t-collapse-panel>
    </t-collapse>

    <!-- 头信息列表 -->
    <div v-if="localConfig.is_enable_custom_headers == '1'" class="headers-list">
      <div class="headers-section">
        <div class="section-title">
          {{ $t('page.host.custom_headers.headers_list') }}
        </div>
        
        <!-- 空状态提示 -->
        <div v-if="!localConfig.headers || localConfig.headers.length === 0" class="empty-hint">
          <t-icon name="info-circle" style="margin-right: 8px;" />
          {{ $t('page.host.custom_headers.no_headers') }}
        </div>
        
        <!-- 头信息列表 -->
        <div v-else class="headers-container">
          <div v-for="(header, index) in localConfig.headers" :key="index" class="header-item">
            <div class="header-item-row">
              <div class="header-field-group">
                <div class="header-field">
                  <label class="field-label">{{ $t('page.host.custom_headers.header_name') }}</label>
                  <t-input 
                    v-model="header.header_name" 
                    @change="updateParent"
                    :placeholder="$t('page.host.custom_headers.header_name_placeholder')"
                    style="width: 220px;">
                  </t-input>
                </div>
                
                <div class="header-field header-value-field">
                  <label class="field-label">{{ $t('page.host.custom_headers.header_value') }}</label>
                  <t-input 
                    v-model="header.header_value" 
                    @change="updateParent"
                    :placeholder="$t('page.host.custom_headers.header_value_placeholder')"
                    style="width: 320px;">
                    <template #suffix>
                      <t-dropdown :options="variableOptions" @click="(data) => insertVariable(index, data.value)">
                        <t-button size="small" variant="text" style="padding: 0 4px;">
                          <t-icon name="add-circle" style="margin-right: 4px;" />
                          {{ $t('page.host.custom_headers.insert_variable') }}
                        </t-button>
                      </t-dropdown>
                    </template>
                  </t-input>
                </div>
              </div>
              
              <t-button 
                theme="danger" 
                size="small" 
                variant="outline"
                @click="removeHeader(index)"
                class="delete-btn">
                <t-icon name="delete" style="margin-right: 4px;" />
                {{ $t('common.delete') }}
              </t-button>
            </div>
          </div>
        </div>
        
        <!-- 添加按钮 -->
        <div class="add-button-container">
          <t-button 
            theme="primary" 
            variant="outline"
            size="small"
            @click="addHeader">
            <t-icon name="add" style="margin-right: 4px;" />
            {{ $t('page.host.custom_headers.add_header') }}
          </t-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'CustomHeadersConfig',
  props: {
    customHeadersConfig: {
      type: Object,
      required: true
    }
  },
    data() {
      const config = JSON.parse(JSON.stringify(this.customHeadersConfig));
      console.log("CustomHeadersConfig 初始化配置:", config);
      // 确保is_enable_custom_headers是字符串类型
      if (typeof config.is_enable_custom_headers !== 'string') {
        config.is_enable_custom_headers = String(config.is_enable_custom_headers || 0);
      }
      // 确保headers字段存在且是数组
      if (!config.headers || !Array.isArray(config.headers)) {
        config.headers = [];
      }
      return {
        localConfig: config,
        showVariableHelp: false,
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
      ]
    };
  },
    watch: {
      customHeadersConfig: {
        handler(newVal) {
          console.log("CustomHeadersConfig watch 接收到新值:", newVal);
          const config = JSON.parse(JSON.stringify(newVal));
          // 确保is_enable_custom_headers是字符串类型
          if (typeof config.is_enable_custom_headers !== 'string') {
            config.is_enable_custom_headers = String(config.is_enable_custom_headers || 0);
          }
          // 确保headers字段存在且是数组
          if (!config.headers || !Array.isArray(config.headers)) {
            config.headers = [];
          }
          this.localConfig = config;
          console.log("CustomHeadersConfig localConfig 更新为:", this.localConfig);
        },
        deep: true,
        immediate: true
      }
    },
    methods: {
      updateParent() {
        console.log("CustomHeadersConfig 更新父组件:", this.localConfig);
        this.$emit('update', JSON.parse(JSON.stringify(this.localConfig)));
      },
      
      addHeader() {
        // 确保headers数组存在
        if (!this.localConfig.headers) {
          this.$set(this.localConfig, 'headers', []);
        }
        this.localConfig.headers.push({
          header_name: '',
          header_value: ''
        });
        this.updateParent();
      },
    
    removeHeader(index) {
      this.localConfig.headers.splice(index, 1);
      this.updateParent();
    },
    
    insertVariable(headerIndex, variable) {
      const header = this.localConfig.headers[headerIndex];
      if (header) {
        // 在光标位置插入变量，如果没有光标位置就追加到末尾
        header.header_value = (header.header_value || '') + variable;
        this.updateParent();
      }
    },
    
      addPresetHeader(type) {
        // 确保headers数组存在
        if (!this.localConfig.headers) {
          this.$set(this.localConfig, 'headers', []);
        }
        
        let headerName = '';
        let headerValue = '';
        
        switch(type) {
          case 'client_ip':
            headerName = 'X-Real-IP';
            headerValue = '${client_ip}';
            break;
          case 'forwarded_for':
            headerName = 'X-Forwarded-For';
            headerValue = '${header:X-Forwarded-For}';
            break;
          case 'real_ip':
            headerName = 'X-Client-IP';
            headerValue = '${client_ip}';
            break;
          case 'custom':
            headerName = 'X-Custom-Header';
            headerValue = 'custom-value';
            break;
        }
        
        this.localConfig.headers.push({
          header_name: headerName,
          header_value: headerValue
        });
        this.updateParent();
        this.$message.success(this.$t('page.host.custom_headers.add_success'));
      }
  }
};
</script>

<style lang="less" scoped>
.custom-headers-config {
  .variable-help {
    padding: 16px;
    background: var(--td-bg-color-container);
    border-radius: 6px;
    
    .variable-section {
      margin-bottom: 16px;
      
      h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--td-text-color-primary);
      }
      
      ul {
        margin: 0;
        padding-left: 20px;
        
        li {
          margin-bottom: 6px;
          font-size: 13px;
          line-height: 1.6;
          color: var(--td-text-color-secondary);
          
          code {
            padding: 2px 6px;
            background: var(--td-bg-color-component);
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: var(--td-brand-color);
          }
        }
      }
    }
    
    .quick-add-section {
      h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--td-text-color-primary);
      }
    }
  }
  
  .headers-list {
    margin-top: 16px;
    
    .headers-section {
      width: 100%;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--td-text-color-primary);
      margin-bottom: 12px;
      padding-left: 4px;
      border-left: 3px solid var(--td-brand-color);
      padding-left: 8px;
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
    }
    
    .headers-container {
      margin-bottom: 12px;
    }
    
    .header-item {
      margin-bottom: 12px;
      padding: 16px;
      background: var(--td-bg-color-container);
      border-radius: 6px;
      border: 1px solid var(--td-border-level-1-color);
      transition: all 0.2s ease;
      
      &:hover {
        border-color: var(--td-brand-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .header-item-row {
        display: flex;
        align-items: flex-end;
        gap: 12px;
        
        .header-field-group {
          flex: 1;
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }
        
        .header-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          
          .field-label {
            font-size: 12px;
            color: var(--td-text-color-secondary);
            font-weight: 500;
            line-height: 1.5;
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
    
    .add-button-container {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed var(--td-border-level-2-color);
    }
  }
}
</style>

