<template>
  <div>
    <t-card class="list-card-container">
      <!-- 标题 -->
      <t-row justify="space-between" style="margin-bottom: 16px;">
        <div class="left-operation-container">
          <h3>{{ $t('page.iplocation.title') }}</h3>
        </div>
      </t-row>

      <!-- IP 查询测试（固定在顶部） -->
      <div class="test-section">
        <t-form layout="inline" :label-width="120">
          <t-form-item :label="$t('page.iplocation.test_ip')">
            <t-input v-model="testIP" :placeholder="$t('page.iplocation.test_ip_placeholder')" style="width: 280px;"></t-input>
            <t-popup trigger="hover" placement="right" :overlay-inner-style="{ padding: '10px 14px' }">
              <help-circle-icon style="margin-left: 8px; cursor: pointer; color: var(--td-text-color-secondary); font-size: 16px; vertical-align: middle;" />
              <template #content>
                <div style="font-size: 12px;">
                  <div style="color: var(--td-text-color-secondary); margin-bottom: 6px;">点击下方 IP 自动填入</div>
                  <div style="margin-bottom: 4px;">
                    <span style="color: var(--td-text-color-secondary); margin-right: 6px;">Google IPv4:</span>
                    <t-link theme="primary" @click="testIP = '8.8.8.8'">8.8.8.8</t-link>
                  </div>
                  <div>
                    <span style="color: var(--td-text-color-secondary); margin-right: 6px;">Google IPv6:</span>
                    <t-link theme="primary" @click="testIP = '2001:4860:4860::8888'">2001:4860:4860::8888</t-link>
                  </div>
                </div>
              </template>
            </t-popup>
          </t-form-item>
          <t-form-item>
            <t-button theme="primary" @click="handleTest">{{ $t('page.iplocation.test_button') }}</t-button>
          </t-form-item>
        </t-form>
        <div v-if="testResult" class="test-result-box">
          <div class="result-meta-row">
            <t-tag theme="primary" variant="light" size="small">{{ testResult.ip_type || '-' }}</t-tag>
            <t-tag theme="success" variant="light" size="small">数据源：{{ testResult.used_source || '-' }}</t-tag>
            <t-tag v-if="testResult.used_source === 'ip2region' && testResult.used_format" theme="default" variant="light" size="small">格式：{{ testResult.used_format }}</t-tag>
          </div>
          <span class="result-item"><strong>{{ $t('page.iplocation.country') }}：</strong>{{ testResult.country || '-' }}</span>
          <span class="result-item"><strong>{{ $t('page.iplocation.province') }}：</strong>{{ testResult.province || '-' }}</span>
          <span class="result-item"><strong>{{ $t('page.iplocation.city') }}：</strong>{{ testResult.city || '-' }}</span>
          <span class="result-item"><strong>{{ $t('page.iplocation.isp') }}：</strong>{{ testResult.isp || '-' }}</span>
          <span class="result-item"><strong>{{ $t('page.iplocation.region') }}：</strong>{{ testResult.region || '-' }}</span>
          <span class="result-item"><strong>{{ $t('page.iplocation.district') }}：</strong>{{ testResult.district || '-' }}</span>
        </div>
      </div>

      <t-divider style="margin: 12px 0 0 0;"></t-divider>

      <!-- Tab 主体：仅配置与上传 -->
      <t-tabs v-model="activeTab">

        <!-- Tab 1：配置与状态 -->
        <t-tab-panel value="config" :label="$t('page.iplocation.tab_config')">
          <div class="tab-content">
            <div class="config-row" style="margin-bottom: 20px;">
              <!-- IPv4 -->
              <div class="config-col">
                <t-card :title="$t('page.iplocation.ipv4_config')" :bordered="true">
                  <t-form :label-width="120">
                    <t-form-item :label="$t('page.iplocation.source')">
                      <div>
                        <t-select v-model="configForm.ipv4_source" style="width: 100%;">
                          <t-option value="ip2region" label="ip2region"></t-option>
                          <t-option value="ipdb" label="IPDB"></t-option>
                        </t-select>
                        <div style="margin-top: 6px;">
                          <t-tag v-if="fileExistsForV4(configForm.ipv4_source)" theme="success" size="small" variant="light">✓ {{ $t('page.iplocation.file_ready') }}</t-tag>
                          <t-tag v-else-if="builtinExistsForV4(configForm.ipv4_source)" theme="primary" size="small" variant="light">✓ {{ $t('page.iplocation.builtin_ready') }}</t-tag>
                          <t-tag v-else theme="warning" size="small" variant="light">⚠ {{ $t('page.iplocation.file_missing') }}</t-tag>
                        </div>
                      </div>
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
                    <div class="iplocation-status-box">
                      <p><strong>{{ $t('page.iplocation.current_status') }}:</strong></p>
                      <p>
                        {{ $t('page.iplocation.source') }}: {{ status.ipv4_source || '-' }}
                        <t-tag v-if="status.ipv4_builtin" theme="primary" size="small" variant="light" style="margin-left: 6px;">{{ $t('page.iplocation.builtin_tag') }}</t-tag>
                      </p>
                      <p v-if="status.ipv4_source === 'ip2region'">{{ $t('page.iplocation.format') }}: {{ status.ipv4_format || '-' }}</p>
                      <p>{{ $t('page.iplocation.file_size') }}: {{ formatFileSize(status.ipv4_file_size) }}</p>
                      <p v-if="!status.ipv4_builtin">{{ $t('page.iplocation.file_create_time') }}: {{ status.ipv4_create_time || '-' }}</p>
                      <p>{{ $t('page.iplocation.load_time') }}: {{ status.ipv4_load_time || '-' }}</p>
                    </div>
                  </t-form>
                </t-card>
              </div>

              <!-- IPv6 -->
              <div class="config-col">
                <t-card :title="$t('page.iplocation.ipv6_config')" :bordered="true">
                  <t-form :label-width="120">
                    <t-form-item :label="$t('page.iplocation.source')">
                      <div>
                        <t-select v-model="configForm.ipv6_source" style="width: 100%;">
                          <t-option value="ip2region" label="ip2region"></t-option>
                          <t-option value="geolite2" label="GeoLite2"></t-option>
                          <t-option value="ipdb" label="IPDB"></t-option>
                        </t-select>
                        <div style="margin-top: 6px;">
                          <t-tag v-if="fileExistsForV6(configForm.ipv6_source)" theme="success" size="small" variant="light">✓ {{ $t('page.iplocation.file_ready') }}</t-tag>
                          <t-tag v-else-if="builtinExistsForV6(configForm.ipv6_source)" theme="primary" size="small" variant="light">✓ {{ $t('page.iplocation.builtin_ready') }}</t-tag>
                          <t-tag v-else theme="warning" size="small" variant="light">⚠ {{ $t('page.iplocation.file_missing') }}</t-tag>
                        </div>
                      </div>
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
                    <div class="iplocation-status-box">
                      <p><strong>{{ $t('page.iplocation.current_status') }}:</strong></p>
                      <p>
                        {{ $t('page.iplocation.source') }}: {{ status.ipv6_source || '-' }}
                        <t-tag v-if="status.ipv6_builtin" theme="primary" size="small" variant="light" style="margin-left: 6px;">{{ $t('page.iplocation.builtin_tag') }}</t-tag>
                      </p>
                      <p v-if="status.ipv6_source === 'ip2region'">{{ $t('page.iplocation.format') }}: {{ status.ipv6_format || '-' }}</p>
                      <p>{{ $t('page.iplocation.file_size') }}: {{ formatFileSize(status.ipv6_file_size) }}</p>
                      <p v-if="!status.ipv6_builtin">{{ $t('page.iplocation.file_create_time') }}: {{ status.ipv6_create_time || '-' }}</p>
                      <p>{{ $t('page.iplocation.load_time') }}: {{ status.ipv6_load_time || '-' }}</p>
                    </div>
                  </t-form>
                </t-card>
              </div>
            </div>

            <t-button theme="primary" variant="outline" @click="handleSaveConfig" style="width: 200px;">
              {{ $t('page.iplocation.save_config') }}
            </t-button>
          </div>
        </t-tab-panel>

        <!-- Tab 2：上传数据库 -->
        <t-tab-panel value="upload" :label="$t('page.iplocation.tab_upload')">
          <div class="tab-content">
            <t-form :label-width="140">
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
                ></t-upload>
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
                ></t-upload>
              </t-form-item>
              <t-form-item :label="$t('page.iplocation.upload_ipdb')">
                <t-upload
                  :action="uploadUrl"
                  :headers="uploadHeaders"
                  :data="{ type: 'ipdb' }"
                  :before-upload="beforeUploadIpdb"
                  @success="handleUploadSuccess"
                  @fail="handleUploadFail"
                  :tips="$t('page.iplocation.upload_tips_ipdb')"
                  theme="file-input"
                  accept=".ipdb"
                ></t-upload>
              </t-form-item>
              <t-form-item>
                <t-button theme="primary" variant="outline" @click="handleReload">{{ $t('page.iplocation.reload_button') }}</t-button>
              </t-form-item>
            </t-form>

            <t-divider></t-divider>

            <!-- ip2region 版本说明 -->
            <p style="font-weight: 600; margin-bottom: 10px;">{{ $t('page.iplocation.format_description_title') }}</p>
            <t-alert theme="info" :message="$t('page.iplocation.format_description_info')" style="margin-bottom: 12px;"></t-alert>
            <t-table :data="formatDescriptions" :columns="formatColumns" :bordered="true" :hover="true" size="small" rowKey="id">
            </t-table>
          </div>
        </t-tab-panel>

      </t-tabs>

      <!-- 贡献提示（置底） -->
      <t-divider style="margin: 8px 0;"></t-divider>
      <t-alert theme="info">
        <template #message>
          <span>{{ $t('page.iplocation.contribute_desc') }}&nbsp;&nbsp;</span>
          <span style="font-weight: 600;">{{ $t('page.iplocation.contribute_email_label') }}：</span>
          <t-link href="mailto:samwafgo@gmail.com" theme="primary">samwafgo@gmail.com</t-link>
          <span style="color: var(--td-text-color-secondary); font-size: 12px; margin-left: 8px;">（{{ $t('page.iplocation.contribute_note') }}）</span>
        </template>
      </t-alert>

    </t-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { MessagePlugin, DialogPlugin } from 'tdesign-vue';
import { HelpCircleIcon } from 'tdesign-icons-vue';
import { getIPDBStatusApi, getIPDBConfigApi, saveIPDBConfigApi, reloadIPDBApi, testIPLookupApi } from '@/apis/iplocation';
import { getBaseUrl } from '@/utils/usuallytool';
import { v4 as uuidv4 } from 'uuid';

export default Vue.extend({
  name: 'IPLocation',
  components: { HelpCircleIcon },
  data() {
    return {
      activeTab: 'config',
      status: {
        ipv4_source: '',
        ipv4_format: '',
        ipv4_file_size: 0,
        ipv4_load_time: '',
        ipv4_create_time: '',
        ipv4_builtin: false,
        ipv6_source: '',
        ipv6_format: '',
        ipv6_file_size: 0,
        ipv6_load_time: '',
        ipv6_create_time: '',
        ipv6_builtin: false,
        // 磁盘上是否有用户上传的文件
        file_exists: {
          ip2region_v4: false,
          ip2region_v6: false,
          geolite2: false,
          ipdb: false,
        },
        // 是否有内置数据兜底（随程序发布，无需上传）
        builtin_exists: {
          ip2region_v4: false,
          ip2region_v6: false,
          geolite2: false,
          ipdb: false,
        },
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
        { colKey: 'version', title: this.$t('page.iplocation.format_version'), width: 150 },
        { colKey: 'fields', title: this.$t('page.iplocation.format_fields'), width: 400 },
        { colKey: 'description', title: this.$t('page.iplocation.format_desc') },
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
    this.uploadHeaders = { 'X-Token': token || '' };
  },
  methods: {
    async loadStatus() {
      try {
        const res = await getIPDBStatusApi();
        console.log("loadStatus",res)
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
        const res = await getIPDBConfigApi();
        if (res.code === 0 && res.data) {
          this.configForm.ipv4_source = res.data.ipv4_source;
          this.configForm.ipv4_format = res.data.ipv4_format;
          this.configForm.ipv6_source = res.data.ipv6_source;
          this.configForm.ipv6_format = res.data.ipv6_format;
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    },
    // 该来源对应的文件是否已上传到磁盘
    fileExistsForV4(source) {
      const fe = this.status.file_exists;
      if (!fe) return true;
      if (source === 'ip2region') return fe.ip2region_v4;
      if (source === 'ipdb') return fe.ipdb;
      return true;
    },
    fileExistsForV6(source) {
      const fe = this.status.file_exists;
      if (!fe) return true;
      if (source === 'ip2region') return fe.ip2region_v6;
      if (source === 'geolite2') return fe.geolite2;
      if (source === 'ipdb') return fe.ipdb;
      return true;
    },
    // 未上传文件时，该来源是否有内置数据兜底（全新安装即属此情况）
    builtinExistsForV4(source) {
      const be = this.status.builtin_exists;
      if (!be) return false;
      if (source === 'ip2region') return be.ip2region_v4;
      if (source === 'ipdb') return be.ipdb;
      return false;
    },
    builtinExistsForV6(source) {
      const be = this.status.builtin_exists;
      if (!be) return false;
      if (source === 'ip2region') return be.ip2region_v6;
      if (source === 'geolite2') return be.geolite2;
      if (source === 'ipdb') return be.ipdb;
      return false;
    },
    // 数据可用 = 已上传文件 或 有内置数据
    sourceReadyForV4(source) {
      return this.fileExistsForV4(source) || this.builtinExistsForV4(source);
    },
    sourceReadyForV6(source) {
      return this.fileExistsForV6(source) || this.builtinExistsForV6(source);
    },
    async doSaveConfig() {
      try {
        const res = await saveIPDBConfigApi({
          ipv4_source: this.configForm.ipv4_source,
          ipv4_format: this.configForm.ipv4_format,
          ipv6_source: this.configForm.ipv6_source,
          ipv6_format: this.configForm.ipv6_format,
        });
        if (res.code === 0) {
          MessagePlugin.success(this.$t('page.iplocation.save_config_success'));
          this.loadStatus();
        } else {
          MessagePlugin.error(res.msg || this.$t('page.iplocation.save_config_failed'));
        }
      } catch (error) {
        MessagePlugin.error(this.$t('page.iplocation.save_config_failed'));
      }
    },
    handleSaveConfig() {
      const v4Ok = this.sourceReadyForV4(this.configForm.ipv4_source);
      const v6Ok = this.sourceReadyForV6(this.configForm.ipv6_source);
      if (!v4Ok || !v6Ok) {
        const missing = [];
        if (!v4Ok) missing.push('IPv4');
        if (!v6Ok) missing.push('IPv6');
        const dialog = DialogPlugin.confirm({
          header: '数据库文件不存在',
          body: `${missing.join('、')} 所选来源的数据库文件尚未上传，保存后将无法正常查询。是否仍要保存？`,
          confirmBtn: '仍要保存',
          cancelBtn: '取消',
          onConfirm: () => { dialog.destroy(); this.doSaveConfig(); },
          onClose: () => { dialog.destroy(); },
        });
        return;
      }
      this.doSaveConfig();
    },
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '-';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
    beforeUpload(file) {
      this.uploadHeaders['X-Request-Time'] = Math.floor(Date.now() / 1000).toString();
      this.uploadHeaders['X-Request-Id'] = uuidv4();
      const isValid = file.name.endsWith('.xdb') || file.name.endsWith('.mmdb');
      if (!isValid) MessagePlugin.error(this.$t('page.iplocation.invalid_file_type'));
      return isValid;
    },
    beforeUploadIpdb(file) {
      this.uploadHeaders['X-Request-Time'] = Math.floor(Date.now() / 1000).toString();
      this.uploadHeaders['X-Request-Id'] = uuidv4();
      const isValid = file.name.endsWith('.ipdb');
      if (!isValid) MessagePlugin.error(this.$t('page.iplocation.invalid_file_type'));
      return isValid;
    },
    handleUploadSuccess(response) {
      if (response.response.code === 0) {
        MessagePlugin.success(this.$t('page.iplocation.upload_success'));
        this.loadStatus();
        this.loadConfig();
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

.test-section {
  padding: 12px 0;
}

.test-result-box {
  margin-top: 10px;
  padding: 10px 14px;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
}

.result-meta-row {
  width: 100%;
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--td-component-border, #e7e7e7);
}

.result-item {
  font-size: 13px;
  white-space: nowrap;
}

.tab-content {
  padding: 20px 0;
}

.config-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.config-col {
  flex: 1;
  min-width: 0;
}

.iplocation-status-box {
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  background: #f5f5f5;

  p {
    margin: 5px 0;
  }
}
</style>

<style lang="less">
:root[theme-mode='dark'] .iplocation-status-box,
:root[theme-mode='dark'] .test-result-box {
  background: var(--td-bg-color-component);
  color: var(--td-text-color-primary);
  border: 1px solid var(--td-component-border);
}
</style>
