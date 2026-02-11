<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between" style="margin-bottom: 20px;">
        <div class="left-operation-container">
          <h3>{{ $t('page.iplocation.title') }}</h3>
        </div>
      </t-row>

      <!-- 数据库配置与状态 -->
      <t-row :gutter="16" style="margin-bottom: 20px;">
        <!-- IPv4 配置 -->
        <t-col :span="12">
          <t-card :title="$t('page.iplocation.ipv4_config')" :bordered="true">
            <t-form :label-width="120">
              <t-form-item :label="$t('page.iplocation.source')">
                <t-select v-model="configForm.ipv4_source" style="width: 100%;">
                  <t-option value="ip2region" label="ip2region"></t-option>
                  <t-option value="geolite2" label="GeoLite2"></t-option>
                </t-select>
              </t-form-item>
              <t-form-item :label="$t('page.iplocation.format')" v-if="configForm.ipv4_source === 'ip2region'">
                <t-select v-model="configForm.ipv4_format" style="width: 100%;">
                  <t-option value="legacy" :label="$t('page.iplocation.format_legacy')"></t-option>
                  <t-option value="opensource" :label="$t('page.iplocation.format_opensource')"></t-option>
                  <t-option value="full" :label="$t('page.iplocation.format_full')"></t-option>
                  <t-option value="standard" :label="$t('page.iplocation.format_standard')"></t-option>
                  <t-option value="compact" :label="$t('page.iplocation.format_compact')"></t-option>
                </t-select>
              </t-form-item>
              <t-divider></t-divider>
              <div style="padding: 10px 0; background: #f5f5f5; border-radius: 4px; padding: 10px; margin-bottom: 10px;">
                <p style="margin: 5px 0;"><strong>{{ $t('page.iplocation.current_status') }}:</strong></p>
                <p style="margin: 5px 0;">{{ $t('page.iplocation.source') }}: {{ status.ipv4_source || '-' }}</p>
                <p style="margin: 5px 0;">{{ $t('page.iplocation.format') }}: {{ status.ipv4_format || '-' }}</p>
                <p style="margin: 5px 0;">{{ $t('page.iplocation.file_size') }}: {{ formatFileSize(status.ipv4_file_size) }}</p>
                <p style="margin: 5px 0;">{{ $t('page.iplocation.file_create_time') }}: {{ status.ipv4_create_time || '-' }}</p>
                <p style="margin: 5px 0;">{{ $t('page.iplocation.load_time') }}: {{ status.ipv4_load_time || '-' }}</p>
              </div>
            </t-form>
          </t-card>
        </t-col>

        <!-- IPv6 配置 -->
        <t-col :span="12">
          <t-card :title="$t('page.iplocation.ipv6_config')" :bordered="true">
            <t-form :label-width="120">
              <t-form-item :label="$t('page.iplocation.source')">
                <t-select v-model="configForm.ipv6_source" style="width: 100%;">
                  <t-option value="ip2region" label="ip2region"></t-option>
                  <t-option value="geolite2" label="GeoLite2"></t-option>
                </t-select>
              </t-form-item>
              <t-form-item :label="$t('page.iplocation.format')" v-if="configForm.ipv6_source === 'ip2region'">
                <t-select v-model="configForm.ipv6_format" style="width: 100%;">
                  <t-option value="legacy" :label="$t('page.iplocation.format_legacy')"></t-option>
                  <t-option value="opensource" :label="$t('page.iplocation.format_opensource')"></t-option>
                  <t-option value="full" :label="$t('page.iplocation.format_full')"></t-option>
                  <t-option value="standard" :label="$t('page.iplocation.format_standard')"></t-option>
                  <t-option value="compact" :label="$t('page.iplocation.format_compact')"></t-option>
                </t-select>
              </t-form-item>
              <t-divider></t-divider>
              <div style="padding: 10px 0; background: #f5f5f5; border-radius: 4px; padding: 10px; margin-bottom: 10px;">
                <p style="margin: 5px 0;"><strong>{{ $t('page.iplocation.current_status') }}:</strong></p>
                <p style="margin: 5px 0;">{{ $t('page.iplocation.source') }}: {{ status.ipv6_source || '-' }}</p>
                <p style="margin: 5px 0;">{{ $t('page.iplocation.format') }}: {{ status.ipv6_format || '-' }}</p>
                <p style="margin: 5px 0;">{{ $t('page.iplocation.file_size') }}: {{ formatFileSize(status.ipv6_file_size) }}</p>
                <p style="margin: 5px 0;">{{ $t('page.iplocation.file_create_time') }}: {{ status.ipv6_create_time || '-' }}</p>
                <p style="margin: 5px 0;">{{ $t('page.iplocation.load_time') }}: {{ status.ipv6_load_time || '-' }}</p>
              </div>
            </t-form>
          </t-card>
        </t-col>
      </t-row>

      <!-- 保存配置按钮 -->
      <t-row style="margin-bottom: 20px;">
        <t-col :span="24">
          <t-button theme="primary" @click="handleSaveConfig" style="width: 200px;">
            {{ $t('page.iplocation.save_config') }}
          </t-button>
        </t-col>
      </t-row>

      <!-- ip2region 版本说明 -->
      <t-card :title="$t('page.iplocation.format_description_title')" style="margin-bottom: 20px;">
        <t-alert theme="info" :message="$t('page.iplocation.format_description_info')" style="margin-bottom: 15px;"></t-alert>
        <t-table :data="formatDescriptions" :columns="formatColumns" :bordered="true" :hover="true" size="small" rowKey="id">
        </t-table>
      </t-card>

      <!-- 文件上传区 -->
      <t-card :title="$t('page.iplocation.upload_title')" style="margin-bottom: 20px;">
        <t-form :label-width="120">
          <t-form-item :label="$t('page.iplocation.upload_ipv4')">
            <t-upload
              :action="uploadUrl"
              :headers="uploadHeaders"
              :data="{ type: 'ipv4' }"
              :before-upload="beforeUpload"
              @success="handleUploadSuccess"
              @fail="handleUploadFail"
              :tips="$t('page.iplocation.upload_tips')"
              theme="file-input"
              accept=".xdb,.mmdb"
            >
            </t-upload>
          </t-form-item>
          <t-form-item :label="$t('page.iplocation.upload_ipv6')">
            <t-upload
              :action="uploadUrl"
              :headers="uploadHeaders"
              :data="{ type: 'ipv6' }"
              :before-upload="beforeUpload"
              @success="handleUploadSuccess"
              @fail="handleUploadFail"
              :tips="$t('page.iplocation.upload_tips')"
              theme="file-input"
              accept=".xdb,.mmdb"
            >
            </t-upload>
          </t-form-item>
          <t-form-item>
            <t-button theme="primary" @click="handleReload">{{ $t('page.iplocation.reload_button') }}</t-button>
          </t-form-item>
        </t-form>
      </t-card>

      <!-- IP 测试区 -->
      <t-card :title="$t('page.iplocation.test_title')">
        <t-form :label-width="120">
          <t-form-item :label="$t('page.iplocation.test_ip')">
            <t-input v-model="testIP" :placeholder="$t('page.iplocation.test_ip_placeholder')" style="width: 300px;"></t-input>
            <t-button theme="primary" @click="handleTest" style="margin-left: 10px;">{{ $t('page.iplocation.test_button') }}</t-button>
          </t-form-item>
          <t-form-item :label="$t('page.iplocation.test_result')" v-if="testResult">
            <div>
              <p><strong>{{ $t('page.iplocation.country') }}:</strong> {{ testResult.country || '-' }}</p>
              <p><strong>{{ $t('page.iplocation.province') }}:</strong> {{ testResult.province || '-' }}</p>
              <p><strong>{{ $t('page.iplocation.city') }}:</strong> {{ testResult.city || '-' }}</p>
              <p><strong>{{ $t('page.iplocation.isp') }}:</strong> {{ testResult.isp || '-' }}</p>
              <p><strong>{{ $t('page.iplocation.region') }}:</strong> {{ testResult.region || '-' }}</p>
              <p><strong>{{ $t('page.iplocation.district') }}:</strong> {{ testResult.district || '-' }}</p>
            </div>
          </t-form-item>
        </t-form>
      </t-card>
    </t-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { MessagePlugin } from 'tdesign-vue';
import { getIPDBStatusApi, uploadIPDBFileApi, reloadIPDBApi, testIPLookupApi } from '@/apis/iplocation';
import { get_detail_by_item_api, edit_system_config_by_item_api } from '@/apis/systemconfig';
import { getBaseUrl } from '@/utils/usuallytool';

export default Vue.extend({
  name: 'IPLocation',
  data() {
    return {
      status: {
        ipv4_source: '',
        ipv4_format: '',
        ipv4_file_size: 0,
        ipv4_load_time: '',
        ipv4_create_time: '',
        ipv6_source: '',
        ipv6_format: '',
        ipv6_file_size: 0,
        ipv6_load_time: '',
        ipv6_create_time: '',
      },
      configForm: {
        ipv4_source: 'ip2region',
        ipv4_format: 'legacy',
        ipv6_source: 'geolite2',
        ipv6_format: 'legacy',
      },
      uploadUrl: '',
      uploadHeaders: {},
      testIP: '',
      testResult: null,
      formatColumns: [
        {
          colKey: 'version',
          title: this.$t('page.iplocation.format_version'),
          width: 150,
        },
        {
          colKey: 'fields',
          title: this.$t('page.iplocation.format_fields'),
          width: 400,
        },
        {
          colKey: 'description',
          title: this.$t('page.iplocation.format_desc'),
        },
      ],
      formatDescriptions: [
        {
          id: 'legacy',
          version: this.$t('page.iplocation.format_legacy'),
          fields: this.$t('page.iplocation.format_legacy_fields'),
          description: this.$t('page.iplocation.format_legacy_desc'),
        },
        {
          id: 'opensource',
          version: this.$t('page.iplocation.format_opensource'),
          fields: this.$t('page.iplocation.format_opensource_fields'),
          description: this.$t('page.iplocation.format_opensource_desc'),
        },
        {
          id: 'full',
          version: this.$t('page.iplocation.format_full'),
          fields: this.$t('page.iplocation.format_full_fields'),
          description: this.$t('page.iplocation.format_full_desc'),
        },
        {
          id: 'standard',
          version: this.$t('page.iplocation.format_standard'),
          fields: this.$t('page.iplocation.format_standard_fields'),
          description: this.$t('page.iplocation.format_standard_desc'),
        },
        {
          id: 'compact',
          version: this.$t('page.iplocation.format_compact'),
          fields: this.$t('page.iplocation.format_compact_fields'),
          description: this.$t('page.iplocation.format_compact_desc'),
        },
      ],
    };
  },
  mounted() {
    this.loadStatus();
    this.loadConfig();
    const baseUrl = getBaseUrl();
    this.uploadUrl = baseUrl + '/iplocation/upload';
    const token = localStorage.getItem('access_token');
    this.uploadHeaders = {
      'X-Token': token || '',
    };
  },
  methods: {
    async loadStatus() {
      try {
        const res = await getIPDBStatusApi();
        if (res.code === 0) {
          this.status = res.data;
        } else {
          MessagePlugin.error(res.msg || this.$t('page.iplocation.load_status_failed'));
        }
      } catch (error) {
        MessagePlugin.error(this.$t('page.iplocation.load_status_failed'));
      }
    },
    async loadConfig() {
      try {
        // 加载 IPv4 数据源配置
        const v4SourceRes = await get_detail_by_item_api({ item: 'ip_v4_source' });
        if (v4SourceRes.code === 0 && v4SourceRes.data) {
          this.configForm.ipv4_source = v4SourceRes.data.value || 'ip2region';
        }

        // 加载 IPv4 格式配置
        const v4FormatRes = await get_detail_by_item_api({ item: 'ip_v4_format' });
        if (v4FormatRes.code === 0 && v4FormatRes.data) {
          this.configForm.ipv4_format = v4FormatRes.data.value || 'legacy';
        }

        // 加载 IPv6 数据源配置
        const v6SourceRes = await get_detail_by_item_api({ item: 'ip_v6_source' });
        if (v6SourceRes.code === 0 && v6SourceRes.data) {
          this.configForm.ipv6_source = v6SourceRes.data.value || 'geolite2';
        }

        // 加载 IPv6 格式配置
        const v6FormatRes = await get_detail_by_item_api({ item: 'ip_v6_format' });
        if (v6FormatRes.code === 0 && v6FormatRes.data) {
          this.configForm.ipv6_format = v6FormatRes.data.value || 'legacy';
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    },
    async handleSaveConfig() {
      try {
        // 保存 IPv4 数据源
        await edit_system_config_by_item_api({
          item: 'ip_v4_source',
          value: this.configForm.ipv4_source
        });

        // 保存 IPv4 格式
        await edit_system_config_by_item_api({
          item: 'ip_v4_format',
          value: this.configForm.ipv4_format
        });

        // 保存 IPv6 数据源
        await edit_system_config_by_item_api({
          item: 'ip_v6_source',
          value: this.configForm.ipv6_source
        });

        // 保存 IPv6 格式
        await edit_system_config_by_item_api({
          item: 'ip_v6_format',
          value: this.configForm.ipv6_format
        });

        MessagePlugin.success(this.$t('page.iplocation.save_config_success'));
        
        // 重新加载状态
        setTimeout(() => {
          this.loadStatus();
        }, 500);
      } catch (error) {
        MessagePlugin.error(this.$t('page.iplocation.save_config_failed'));
      }
    },
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '-';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
    beforeUpload(file) {
      const isValid = file.name.endsWith('.xdb') || file.name.endsWith('.mmdb');
      if (!isValid) {
        MessagePlugin.error(this.$t('page.iplocation.invalid_file_type'));
      }
      return isValid;
    },
    handleUploadSuccess(response) {
      if (response.response.code === 0) {
        MessagePlugin.success(this.$t('page.iplocation.upload_success'));
        this.loadStatus();
      } else {
        MessagePlugin.error(response.response.msg || this.$t('page.iplocation.upload_failed'));
      }
    },
    handleUploadFail() {
      MessagePlugin.error(this.$t('page.iplocation.upload_failed'));
    },
    async handleReload() {
      try {
        const res = await reloadIPDBApi();
        if (res.code === 0) {
          MessagePlugin.success(this.$t('page.iplocation.reload_success'));
          this.loadStatus();
        } else {
          MessagePlugin.error(res.msg || this.$t('page.iplocation.reload_failed'));
        }
      } catch (error) {
        MessagePlugin.error(this.$t('page.iplocation.reload_failed'));
      }
    },
    async handleTest() {
      if (!this.testIP) {
        MessagePlugin.warning(this.$t('page.iplocation.test_ip_required'));
        return;
      }
      try {
        const res = await testIPLookupApi({ ip: this.testIP });
        if (res.code === 0) {
          this.testResult = res.data;
          MessagePlugin.success(this.$t('page.iplocation.test_success'));
        } else {
          MessagePlugin.error(res.msg || this.$t('page.iplocation.test_failed'));
        }
      } catch (error) {
        MessagePlugin.error(this.$t('page.iplocation.test_failed'));
      }
    },
  },
});
</script>

<style scoped lang="less">
.list-card-container {
  padding: 20px;
}
</style>
