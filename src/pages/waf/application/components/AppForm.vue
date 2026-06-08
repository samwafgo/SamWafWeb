<template>
  <t-form ref="form" :data="formData" :rules="rules" label-align="right" :label-width="140" @submit="onSubmit">
    <!-- 基本配置 -->
    <t-divider>{{ $t('page.application.section_basic') }}</t-divider>
    <t-form-item :label="$t('page.application.name')" name="name">
      <t-input v-model="formData.name" :placeholder="$t('page.application.name_placeholder')" />
    </t-form-item>
    <t-form-item :label="$t('page.application.start_cmd')" name="start_cmd">
      <t-input v-model="formData.start_cmd" :placeholder="$t('page.application.start_cmd_placeholder')" />
    </t-form-item>
    <t-form-item :label="$t('page.application.app_dir')" name="app_dir">
      <t-input v-model="formData.app_dir" :placeholder="$t('page.application.app_dir_placeholder')" />
      <div class="dir-hint">{{ $t('page.application.app_dir_actual') }}{{ effectiveDir }}</div>
    </t-form-item>
    <t-form-item :label="$t('page.application.env')" name="env">
      <t-textarea v-model="formData.env" :placeholder="$t('page.application.env_placeholder')" :rows="2" />
    </t-form-item>
    <t-form-item :label="$t('page.application.start_status')" name="start_status">
      <t-radio-group v-model="formData.start_status">
        <t-radio :value="1">{{ $t('common.on') }}</t-radio>
        <t-radio :value="0">{{ $t('common.off') }}</t-radio>
      </t-radio-group>
    </t-form-item>
    <t-form-item :label="$t('page.application.auto_start')" name="auto_start">
      <t-radio-group v-model="formData.auto_start">
        <t-radio :value="1">{{ $t('common.yes') }}</t-radio>
        <t-radio :value="0">{{ $t('common.no') }}</t-radio>
      </t-radio-group>
    </t-form-item>

    <!-- 停止配置 -->
    <t-divider>{{ $t('page.application.section_stop') }}</t-divider>
    <t-form-item :label="$t('page.application.stop_mode')" name="stop_mode">
      <t-radio-group v-model="formData.stop_mode">
        <t-radio value="signal">{{ $t('page.application.stop_mode_signal') }}</t-radio>
        <t-radio value="cmd">{{ $t('page.application.stop_mode_cmd') }}</t-radio>
      </t-radio-group>
    </t-form-item>
    <t-form-item v-if="formData.stop_mode === 'cmd'" :label="$t('page.application.stop_cmd')" name="stop_cmd">
      <t-input v-model="formData.stop_cmd" :placeholder="$t('page.application.stop_cmd_placeholder')" />
    </t-form-item>
    <t-form-item :label="$t('page.application.stop_timeout')" name="stop_timeout">
      <t-input-number v-model="formData.stop_timeout" :min="1" :max="300" />
      <span style="margin-left:8px">{{ $t('common.seconds') }}</span>
    </t-form-item>

    <!-- 重启策略 -->
    <t-divider>{{ $t('page.application.section_restart') }}</t-divider>
    <t-form-item :label="$t('page.application.restart_policy')" name="restart_policy">
      <t-radio-group v-model="formData.restart_policy">
        <t-radio value="no">{{ $t('page.application.restart_no') }}</t-radio>
        <t-radio value="on-failure">{{ $t('page.application.restart_on_failure') }}</t-radio>
        <t-radio value="always">{{ $t('page.application.restart_always') }}</t-radio>
      </t-radio-group>
    </t-form-item>
    <t-form-item v-if="formData.restart_policy !== 'no'" :label="$t('page.application.restart_delay')" name="restart_delay">
      <t-input-number v-model="formData.restart_delay" :min="0" :max="3600" />
      <span style="margin-left:8px">{{ $t('common.seconds') }}</span>
    </t-form-item>
    <t-form-item v-if="formData.restart_policy !== 'no'" :label="$t('page.application.max_restart_count')" name="max_restart_count">
      <t-input-number v-model="formData.max_restart_count" :min="0" />
      <span style="margin-left:8px">{{ $t('page.application.max_restart_count_tip') }}</span>
    </t-form-item>

    <!-- 日志配置 -->
    <t-divider>{{ $t('page.application.section_log') }}</t-divider>
    <t-form-item :label="$t('page.application.log_max_lines')" name="log_max_lines">
      <t-input-number v-model="formData.log_max_lines" :min="100" :max="10000" />
    </t-form-item>

    <t-form-item :label="$t('common.remarks')" name="remarks">
      <t-input v-model="formData.remarks" />
    </t-form-item>

    <!-- 初始文件上传（仅新建时） -->
    <template v-if="!isEdit">
      <t-divider>{{ $t('page.application.section_upload_init') }}</t-divider>
      <t-form-item :label="$t('page.application.upload_file')">
        <t-upload :action="''" :auto-upload="false" accept="*" :multiple="false" @change="onFileChange">
          <t-button variant="outline">{{ $t('page.application.select_file') }}</t-button>
        </t-upload>
        <div v-if="uploadFile" style="margin-top:6px;color:#666;font-size:12px">
          {{ uploadFile.name }} ({{ formatSize(uploadFile.size) }})
        </div>
      </t-form-item>
      <t-form-item :label="$t('page.application.hash_sha256')">
        <t-input v-model="uploadHash" :placeholder="hashComputing ? $t('page.application.hash_computing') : $t('page.application.hash_placeholder')" :disabled="hashComputing" clearable />
      </t-form-item>
    </template>

    <t-form-item>
      <t-button theme="primary" type="submit" :loading="submitting">{{ $t('common.submit') }}</t-button>
      <t-button theme="default" @click="$emit('close')" style="margin-left:8px">{{ $t('common.cancel') }}</t-button>
    </t-form-item>
  </t-form>
</template>

<script lang="ts">
import Vue from 'vue';
import CryptoJS from 'crypto-js';
import request from '@/utils/request';
import { wafAppAddApi, wafAppEditApi } from '@/apis/application';

export default Vue.extend({
  name: 'AppForm',
  props: {
    value: { type: Object, default: () => ({}) },
    isEdit: { type: Boolean, default: false },
  },
  data() {
    return {
      formData: { ...this.value },
      uploadFile: null as File | null,
      uploadHash: '',
      hashComputing: false,
      submitting: false,
      rules: {
        name: [{ required: true, message: this.$t('page.application.name_required') }],
        start_cmd: [{ required: true, message: this.$t('page.application.start_cmd_required') }],
      },
    };
  },
  computed: {
    effectiveDir(): string {
      const dir = (this.formData as any).app_dir;
      if (dir && dir.trim()) return dir.trim();
      const code = (this.formData as any).code || '';
      return `./data/applications/${code}/`;
    },
  },
  watch: {
    value(v) { this.formData = { ...v }; },
  },
  methods: {
    onFileChange(files) {
      if (files && files.length > 0) {
        this.uploadFile = files[0].raw || files[0];
        this.computeHash(this.uploadFile);
      } else {
        this.uploadFile = null;
        this.uploadHash = '';
      }
    },
    computeHash(file: File) {
      this.hashComputing = true;
      this.uploadHash = '';
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wordArray = CryptoJS.lib.WordArray.create(e.target!.result as ArrayBuffer);
          this.uploadHash = CryptoJS.SHA256(wordArray).toString();
        } catch (_) {
          this.uploadHash = '';
        } finally {
          this.hashComputing = false;
        }
      };
      reader.onerror = () => { this.uploadHash = ''; this.hashComputing = false; };
      reader.readAsArrayBuffer(file);
    },
    formatSize(bytes: number): string {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    doUploadFile(code: string, done: () => void) {
      const fd = new FormData();
      fd.append('code', code);
      fd.append('hash', this.uploadHash);
      fd.append('file', this.uploadFile as File);
      request({ url: '/application/app/upload', method: 'post', data: fd })
        .then(res => {
          if (res && res.code === 0) {
            this.$message.success(this.$t('page.application.upload_init_uploaded'));
          } else {
            this.$message.warning(res ? res.msg : this.$t('common.failed'));
          }
        })
        .catch(() => { this.$message.warning(this.$t('common.failed')); })
        .finally(done);
    },
    onSubmit({ validateResult }) {
      if (validateResult !== true) return;
      this.submitting = true;
      const api = this.isEdit ? wafAppEditApi : wafAppAddApi;
      api(this.formData).then(res => {
        if (res && res.code === 0) {
          if (!this.isEdit && this.uploadFile) {
            this.doUploadFile((this.formData as any).code, () => {
              this.submitting = false;
              this.$message.success(this.$t('common.tips.save_success'));
              this.$emit('submit');
            });
          } else {
            this.submitting = false;
            this.$message.success(this.$t('common.tips.save_success'));
            this.$emit('submit');
          }
        } else {
          this.submitting = false;
          this.$message.error(res ? res.msg : this.$t('common.failed'));
        }
      }).catch(() => {
        this.submitting = false;
        this.$message.error(this.$t('common.failed'));
      });
    },
  },
});
</script>

<style scoped>
.dir-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
  word-break: break-all;
}
</style>
