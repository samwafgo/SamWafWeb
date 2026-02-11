<template>
  <div class="custom-headers-config">
    <t-form-item :label="$t('page.host.custom_response_headers.is_enable')">
      <t-tooltip class="placement top center" :content="$t('page.host.custom_response_headers.is_enable_tips')" placement="top"
                 :overlay-style="{ width: '300px' }" show-arrow>
        <t-radio-group v-model="localConfig.is_enable_custom_headers" @change="updateParent">
          <t-radio value="0">{{ $t('common.off') }}</t-radio>
          <t-radio value="1">{{ $t('common.on') }}</t-radio>
        </t-radio-group>
      </t-tooltip>
    </t-form-item>

    <!-- 使用说明 -->
    <t-alert v-if="localConfig.is_enable_custom_headers == '1'" theme="info" :message="$t('page.host.custom_response_headers.usage_guide')" style="margin-bottom: 16px;">
    </t-alert>

    <!-- 快速添加 -->
    <div v-if="localConfig.is_enable_custom_headers == '1'" style="margin-bottom: 16px;">
      <span style="font-size: 13px; color: var(--td-text-color-secondary); margin-right: 8px;">{{ $t('page.host.custom_response_headers.quick_add') }}:</span>
      <t-space>
        <t-button size="small" variant="outline" @click="addPresetHeader('security')">
          {{ $t('page.host.custom_response_headers.preset_security') }}
        </t-button>
        <t-button size="small" variant="outline" @click="addPresetHeader('csp')">
          {{ $t('page.host.custom_response_headers.preset_csp') }}
        </t-button>
        <t-button size="small" variant="outline" @click="addPresetHeader('hsts')">
          {{ $t('page.host.custom_response_headers.preset_hsts') }}
        </t-button>
        <t-button size="small" variant="outline" @click="addPresetHeader('custom')">
          {{ $t('page.host.custom_response_headers.preset_custom') }}
        </t-button>
      </t-space>
    </div>

    <!-- 头信息列表 -->
    <div v-if="localConfig.is_enable_custom_headers == '1'" class="headers-list">
      <div class="headers-section">
        <div class="section-title">
          {{ $t('page.host.custom_response_headers.headers_list') }}
        </div>
        
        <!-- 空状态提示 -->
        <div v-if="!localConfig.headers || localConfig.headers.length === 0" class="empty-hint">
          <t-icon name="info-circle" style="margin-right: 8px;" />
          {{ $t('page.host.custom_response_headers.no_headers') }}
        </div>
        
        <!-- 头信息列表 -->
        <div v-else class="headers-container">
          <div v-for="(header, index) in localConfig.headers" :key="index" class="header-item">
            <div class="header-item-row">
              <div class="header-field-group">
                <div class="header-field">
                  <label class="field-label">{{ $t('page.host.custom_response_headers.header_name') }}</label>
                  <t-input 
                    v-model="header.header_name" 
                    @change="updateParent"
                    :placeholder="$t('page.host.custom_response_headers.header_name_placeholder')"
                    style="width: 220px;">
                  </t-input>
                </div>
                
                <div class="header-field header-value-field">
                  <label class="field-label">{{ $t('page.host.custom_response_headers.header_value') }}</label>
                  <t-input 
                    v-model="header.header_value" 
                    @change="updateParent"
                    :placeholder="$t('page.host.custom_response_headers.header_value_placeholder')"
                    style="width: 320px;">
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
            {{ $t('page.host.custom_response_headers.add_header') }}
          </t-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'CustomResponseHeadersConfig',
  props: {
    customResponseHeadersConfig: {
      type: Object,
      required: true
    }
  },
    data() {
      const config = JSON.parse(JSON.stringify(this.customResponseHeadersConfig));
      if (typeof config.is_enable_custom_headers !== 'string') {
        config.is_enable_custom_headers = String(config.is_enable_custom_headers || 0);
      }
      if (!config.headers || !Array.isArray(config.headers)) {
        config.headers = [];
      }
      return {
        localConfig: config,
    };
  },
    watch: {
      customResponseHeadersConfig: {
        handler(newVal) {
          const config = JSON.parse(JSON.stringify(newVal));
          if (typeof config.is_enable_custom_headers !== 'string') {
            config.is_enable_custom_headers = String(config.is_enable_custom_headers || 0);
          }
          if (!config.headers || !Array.isArray(config.headers)) {
            config.headers = [];
          }
          this.localConfig = config;
        },
        deep: true,
        immediate: true
      }
    },
    methods: {
      updateParent() {
        this.$emit('update', JSON.parse(JSON.stringify(this.localConfig)));
      },
      
      addHeader() {
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
    
      addPresetHeader(type) {
        if (!this.localConfig.headers) {
          this.$set(this.localConfig, 'headers', []);
        }
        
        let headerName = '';
        let headerValue = '';
        
        switch(type) {
          case 'security':
            headerName = 'X-Frame-Options';
            headerValue = 'SAMEORIGIN';
            break;
          case 'csp':
            headerName = 'Content-Security-Policy';
            headerValue = "default-src 'self'";
            break;
          case 'hsts':
            headerName = 'Strict-Transport-Security';
            headerValue = 'max-age=31536000; includeSubDomains';
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
        this.$message.success(this.$t('page.host.custom_response_headers.add_success'));
      }
  }
};
</script>

<style lang="less" scoped>
.custom-headers-config {
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
