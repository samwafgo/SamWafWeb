<template>
  <div>
    <!-- 基础配置 -->
    <t-card class="list-card-container">
      <template #header>
        <t-row justify="space-between">
          <div class="card-header-title">
            <t-space>
              <div>{{ $t('page.logfilewrite.title') }}</div>
              <t-tooltip :content="$t('page.logfilewrite.description')">
                <t-icon name="help-circle" />
              </t-tooltip>
            </t-space>
          </div>
          <t-space>
            <t-button theme="default" @click="handleRefresh">{{ $t('common.refresh') }}</t-button>
            <t-button theme="primary" @click="handleSave">{{ $t('common.save') }}</t-button>
          </t-space>
        </t-row>
      </template>

      <t-alert theme="info" :message="$t('page.logfilewrite.alert_info')" style="margin-bottom: 16px;" />

      <t-loading :loading="dataLoading">
        <t-form ref="form" :data="formData" :label-width="160">
          <t-form-item :label="$t('page.logfilewrite.enable')" name="enable">
            <t-switch v-model="formData.enable" />
          </t-form-item>

          <t-form-item :label="$t('page.logfilewrite.file_path')" name="file_path">
            <t-input v-model="formData.file_path" :placeholder="$t('page.logfilewrite.file_path_placeholder')" />
          </t-form-item>

          <t-form-item :label="$t('page.logfilewrite.format')" name="format">
            <t-select v-model="formData.format" @change="handleFormatChange">
              <t-option value="nginx" label="Nginx Combined" />
              <t-option value="apache" label="Apache Combined" />
              <t-option value="custom" :label="$t('page.logfilewrite.format_custom')" />
            </t-select>
          </t-form-item>

          <!-- 自定义模板区域 -->
          <template v-if="formData.format === 'custom'">
            <t-form-item :label="$t('page.logfilewrite.custom_template')" name="custom_tpl">
              <t-textarea
                v-model="formData.custom_tpl"
                :placeholder="$t('page.logfilewrite.custom_template_placeholder')"
                :autosize="{ minRows: 3, maxRows: 6 }"
              />
            </t-form-item>
          </template>

          <!-- 模板变量参考 -->
          <t-form-item :label="$t('page.logfilewrite.available_variables')">
            <t-collapse>
              <t-collapse-panel :header="$t('page.logfilewrite.click_to_view_variables')">
                <t-table
                  :columns="variableColumns"
                  :data="templateVariables"
                  :rowKey="'name'"
                  :hover="true"
                  size="small"
                  :pagination="false"
                >
                  <template #name="{ row }">
                    <t-tag theme="primary" variant="light" style="cursor: pointer" @click="copyVariable(row.name)">
                      {{ row.name }}
                    </t-tag>
                  </template>
                </t-table>
              </t-collapse-panel>
            </t-collapse>
          </t-form-item>

          <!-- 输出预览 -->
          <t-form-item :label="$t('page.logfilewrite.output_preview')">
            <div class="preview-box">
              {{ computedPreview }}
            </div>
          </t-form-item>
        </t-form>
      </t-loading>
    </t-card>

    <!-- 日志轮转配置 -->
    <t-card class="list-card-container">
      <template #header>
        <div class="card-header-title">{{ $t('page.logfilewrite.rotation_title') }}</div>
      </template>

      <t-loading :loading="dataLoading">
        <t-form :data="formData" :label-width="160">
          <t-row :gutter="[24, 0]">
            <t-col :span="6">
              <t-form-item :label="$t('page.logfilewrite.max_size')" name="max_size">
                <t-input-number v-model="formData.max_size" :min="1" :max="10240" theme="normal" suffix="MB" />
              </t-form-item>
            </t-col>
            <t-col :span="6">
              <t-form-item :label="$t('page.logfilewrite.max_backups')" name="max_backups">
                <t-input-number v-model="formData.max_backups" :min="1" :max="100" theme="normal" :suffix="$t('page.logfilewrite.unit_files')" />
              </t-form-item>
            </t-col>
          </t-row>
          <t-row :gutter="[24, 0]">
            <t-col :span="6">
              <t-form-item :label="$t('page.logfilewrite.max_days')" name="max_days">
                <t-input-number v-model="formData.max_days" :min="1" :max="365" theme="normal" :suffix="$t('page.logfilewrite.unit_days')" />
              </t-form-item>
            </t-col>
            <t-col :span="6">
              <t-form-item :label="$t('page.logfilewrite.compress')" name="compress">
                <t-switch v-model="formData.compress" />
              </t-form-item>
            </t-col>
          </t-row>
        </t-form>
      </t-loading>
    </t-card>

    <!-- 日志预览 -->
    <t-card class="list-card-container">
      <template #header>
        <t-row justify="space-between">
          <div class="card-header-title">
            {{ $t('page.logfilewrite.preview_title') }}
            <span v-if="currentFileInfo" class="file-info-text">
              ({{ currentFileInfo.name }} - {{ formatFileSize(currentFileInfo.size) }})
            </span>
          </div>
          <t-space>
            <t-button theme="default" size="small" @click="fetchPreview">{{ $t('common.refresh') }}</t-button>
            <t-popconfirm :content="$t('page.logfilewrite.confirm_clear')" @confirm="handleClearLog">
              <t-button theme="danger" variant="outline" size="small">{{ $t('page.logfilewrite.clear_log') }}</t-button>
            </t-popconfirm>
          </t-space>
        </t-row>
      </template>

      <t-loading :loading="previewLoading">
        <div class="log-preview-box" v-if="logPreviewLines.length > 0">
          <div v-for="(line, index) in logPreviewLines" :key="index" class="log-line">{{ line }}</div>
        </div>
        <t-empty v-else :description="$t('page.logfilewrite.no_log_data')" />
      </t-loading>
    </t-card>

    <!-- 历史文件列表 -->
    <t-card class="list-card-container">
      <template #header>
        <t-row justify="space-between">
          <div class="card-header-title">{{ $t('page.logfilewrite.backup_title') }}</div>
          <t-button theme="default" size="small" @click="fetchBackupFiles">{{ $t('common.refresh') }}</t-button>
        </t-row>
      </template>

      <t-loading :loading="backupLoading">
        <t-table
          :columns="backupColumns"
          :data="backupFiles"
          :rowKey="'name'"
          :hover="true"
          :pagination="false"
          v-if="backupFiles.length > 0"
        >
          <template #size="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </t-table>
        <t-empty v-else :description="$t('page.logfilewrite.no_backup_files')" />
      </t-loading>
    </t-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { prefix } from '@/config/global';
import { get_detail_by_item_api, edit_system_config_by_item_api } from '@/apis/systemconfig';
import { getLogPreviewApi, getCurrentFileInfoApi, getBackupFilesApi, clearLogFileApi, getTemplateVariablesApi } from '@/apis/logfilewrite';
import { MessagePlugin } from 'tdesign-vue';

// nginx combined 默认模板
const NGINX_TEMPLATE = '${src_ip} - - [${create_time}] "${method} ${url} HTTP/1.1" ${status_code} ${content_length} "${referer}" "${user_agent}"';

export default Vue.extend({
  name: 'LogFileWrite',
  data() {
    return {
      prefix,
      dataLoading: false,
      previewLoading: false,
      backupLoading: false,
      formData: {
        enable: false,
        file_path: 'logs/access.log',
        format: 'nginx',
        custom_tpl: '',
        max_size: 100,
        max_backups: 10,
        max_days: 30,
        compress: false,
      },
      templateVariables: [],
      logPreviewLines: [],
      currentFileInfo: null,
      backupFiles: [],
      variableColumns: [
        { colKey: 'name', title: this.$t('page.logfilewrite.var_name'), width: 200 },
        { colKey: 'desc', title: this.$t('page.logfilewrite.var_desc'), width: 150 },
        { colKey: 'example', title: this.$t('page.logfilewrite.var_example'), width: 250 },
      ],
      backupColumns: [
        { colKey: 'name', title: this.$t('page.logfilewrite.col_filename'), ellipsis: true },
        { colKey: 'size', title: this.$t('page.logfilewrite.col_size'), width: 120 },
        { colKey: 'mod_time', title: this.$t('page.logfilewrite.col_time'), width: 200 },
      ],
    };
  },
  computed: {
    computedPreview() {
      let tpl = '';
      if (this.formData.format === 'custom') {
        tpl = this.formData.custom_tpl || NGINX_TEMPLATE;
      } else {
        tpl = NGINX_TEMPLATE;
      }
      // 用示例值替换模板变量
      const sampleData = {
        '${src_ip}': '192.168.1.100',
        '${src_port}': '52341',
        '${host}': 'www.example.com',
        '${url}': '/api/user?id=1',
        '${raw_query}': 'id=1',
        '${method}': 'GET',
        '${scheme}': 'https',
        '${referer}': 'https://example.com/',
        '${user_agent}': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        '${status_code}': '200',
        '${content_length}': '2048',
        '${create_time}': '2026-02-09 10:00:00',
        '${time_spent}': '125',
        '${country}': '中国',
        '${province}': '广东省',
        '${city}': '深圳市',
        '${action}': '放行',
        '${rule}': '',
        '${risk_level}': '0',
        '${cookies}': 'session=abc123',
        '${req_uuid}': 'a1b2c3d4-e5f6-7890',
        '${is_bot}': '0',
        '${guest_identification}': '',
      };
      let result = tpl;
      for (const [key, value] of Object.entries(sampleData)) {
        result = result.split(key).join(value);
      }
      return result;
    },
  },
  mounted() {
    this.fetchData();
    this.fetchTemplateVariables();
    this.fetchPreview();
    this.fetchBackupFiles();
  },
  methods: {
    fetchData() {
      this.dataLoading = true;
      const configItems = [
        'log_file_write_enable',
        'log_file_write_path',
        'log_file_write_format',
        'log_file_write_custom_tpl',
        'log_file_write_max_size',
        'log_file_write_max_backups',
        'log_file_write_max_days',
        'log_file_write_compress',
      ];

      const promises = configItems.map(item =>
        get_detail_by_item_api({ item }).catch(() => null)
      );

      Promise.all(promises)
        .then((results) => {
          results.forEach((res, index) => {
            if (res && res.code === 0 && res.data && res.data.value !== undefined) {
              const item = configItems[index];
              const val = res.data.value;
              switch (item) {
                case 'log_file_write_enable':
                  this.formData.enable = val === '1';
                  break;
                case 'log_file_write_path':
                  this.formData.file_path = val || 'logs/access.log';
                  break;
                case 'log_file_write_format':
                  this.formData.format = val || 'nginx';
                  break;
                case 'log_file_write_custom_tpl':
                  this.formData.custom_tpl = val || '';
                  break;
                case 'log_file_write_max_size':
                  this.formData.max_size = parseInt(val) || 100;
                  break;
                case 'log_file_write_max_backups':
                  this.formData.max_backups = parseInt(val) || 10;
                  break;
                case 'log_file_write_max_days':
                  this.formData.max_days = parseInt(val) || 30;
                  break;
                case 'log_file_write_compress':
                  this.formData.compress = val === '1';
                  break;
              }
            }
          });
        })
        .catch((error) => {
          console.error('加载配置失败:', error);
        })
        .finally(() => {
          this.dataLoading = false;
        });
    },
    handleRefresh() {
      this.fetchData();
      this.fetchPreview();
      this.fetchBackupFiles();
    },
    handleFormatChange() {
      // 格式变化时可以重置自定义模板
    },
    async handleSave() {
      this.dataLoading = true;
      try {
        const configItems = [
          { item: 'log_file_write_enable', value: this.formData.enable ? '1' : '0' },
          { item: 'log_file_write_path', value: this.formData.file_path },
          { item: 'log_file_write_format', value: this.formData.format },
          { item: 'log_file_write_custom_tpl', value: this.formData.custom_tpl },
          { item: 'log_file_write_max_size', value: String(this.formData.max_size) },
          { item: 'log_file_write_max_backups', value: String(this.formData.max_backups) },
          { item: 'log_file_write_max_days', value: String(this.formData.max_days) },
          { item: 'log_file_write_compress', value: this.formData.compress ? '1' : '0' },
        ];

        for (const config of configItems) {
          const res = await edit_system_config_by_item_api(config);
          if (res.code !== 0) {
            MessagePlugin.error(res.msg || this.$t('common.tips.save_failed'));
            return;
          }
        }
        MessagePlugin.success(this.$t('common.tips.save_success'));
      } catch (error) {
        console.error('保存配置失败:', error);
        MessagePlugin.error(this.$t('common.tips.save_failed'));
      } finally {
        this.dataLoading = false;
      }
    },
    fetchTemplateVariables() {
      getTemplateVariablesApi()
        .then((res) => {
          if (res.code === 0 && res.data) {
            this.templateVariables = res.data;
          }
        })
        .catch(() => {});
    },
    fetchPreview() {
      this.previewLoading = true;
      Promise.all([
        getLogPreviewApi({ lines: 100 }),
        getCurrentFileInfoApi(),
      ])
        .then(([previewRes, fileInfoRes]) => {
          if (previewRes.code === 0 && previewRes.data) {
            this.logPreviewLines = previewRes.data;
          }
          if (fileInfoRes.code === 0 && fileInfoRes.data) {
            this.currentFileInfo = fileInfoRes.data;
          }
        })
        .catch(() => {})
        .finally(() => {
          this.previewLoading = false;
        });
    },
    fetchBackupFiles() {
      this.backupLoading = true;
      getBackupFilesApi()
        .then((res) => {
          if (res.code === 0 && res.data) {
            this.backupFiles = res.data;
          }
        })
        .catch(() => {})
        .finally(() => {
          this.backupLoading = false;
        });
    },
    handleClearLog() {
      clearLogFileApi()
        .then((res) => {
          if (res.code === 0) {
            MessagePlugin.success(this.$t('page.logfilewrite.clear_success'));
            this.fetchPreview();
          } else {
            MessagePlugin.error(res.msg || this.$t('page.logfilewrite.clear_failed'));
          }
        })
        .catch(() => {
          MessagePlugin.error(this.$t('page.logfilewrite.clear_failed'));
        });
    },
    copyVariable(variable) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(variable).then(() => {
          MessagePlugin.success(this.$t('page.logfilewrite.copy_success') + ': ' + variable);
        });
      } else {
        // fallback
        const input = document.createElement('input');
        input.value = variable;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        MessagePlugin.success(this.$t('page.logfilewrite.copy_success') + ': ' + variable);
      }
    },
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 B';
      const units = ['B', 'KB', 'MB', 'GB'];
      let i = 0;
      let size = bytes;
      while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
      }
      return size.toFixed(1) + ' ' + units[i];
    },
  },
});
</script>

<style lang="less" scoped>
.list-card-container {
  padding: 16px;
  margin-bottom: 16px;
}

.card-header-title {
  font-size: 16px;
  font-weight: 500;
}

.file-info-text {
  font-size: 12px;
  font-weight: normal;
  color: rgba(0, 0, 0, 0.4);
  margin-left: 8px;
}

.preview-box {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #606266;
  word-break: break-all;
  width: 100%;
}

.log-preview-box {
  background: #1e1e1e;
  border-radius: 4px;
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-line {
  color: #d4d4d4;
  line-height: 20px;
  white-space: pre-wrap;
  word-break: break-all;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
}
</style>
