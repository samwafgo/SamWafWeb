<template>
  <t-form ref="form" :data="formData" :rules="rules" label-align="right" :label-width="140" @submit="onSubmit">
    <!-- 保存/上传错误：持续显示在表单内，关闭弹窗或重新提交才清除 -->
    <t-alert v-if="formError" theme="error" class="form-error-alert" :close-btn="false">{{ formError }}</t-alert>

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
      <div class="dir-preview">
        <div v-if="previewState === 'loading'" class="dir-preview-line dir-preview-muted">
          {{ $t('page.application.dir_preview_loading') }}
        </div>
        <template v-else-if="previewState === 'ok' && preview">
          <div class="dir-preview-line">
            <span class="dir-preview-label">{{ $t('page.application.dir_preview_actual') }}</span>
            <code class="dir-preview-code">{{ preview.resolved_dir }}</code>
          </div>
          <div v-if="!(formData.app_dir && formData.app_dir.trim())" class="dir-preview-line dir-preview-muted">
            {{ $t('page.application.dir_preview_default', { dir: preview.default_dir }) }}
          </div>
          <div v-if="preview.allowed_dirs && preview.allowed_dirs.length" class="dir-preview-line">
            <span class="dir-preview-label">{{ $t('page.application.dir_preview_allowed') }}</span>
            <code v-for="(d, i) in preview.allowed_dirs" :key="i" class="dir-preview-code">{{ d }}</code>
          </div>
          <div v-if="preview.path_base" class="dir-preview-line dir-preview-muted">
            {{ $t('page.application.dir_preview_base', { base: preview.path_base }) }}
          </div>
          <div v-if="!preview.valid" class="dir-preview-line dir-preview-error">
            {{ $t('page.application.dir_preview_invalid', { error: preview.error }) }}
          </div>
          <div class="dir-preview-line dir-preview-muted">{{ $t('page.application.dir_preview_no_move') }}</div>
        </template>
        <div v-else-if="previewState === 'unsupported'" class="dir-preview-line dir-preview-warn">
          {{ $t('page.application.dir_preview_unsupported') }}
        </div>
        <div v-else-if="previewState === 'error'" class="dir-preview-line dir-preview-error">
          {{ $t('page.application.dir_preview_error', { msg: previewErrorMsg }) }}
        </div>
      </div>
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

    <!-- 初始文件上传（仅新建时；记录已创建后可用于重试上传） -->
    <template v-if="!isEdit">
      <t-divider>{{ $t('page.application.section_upload_init') }}</t-divider>
      <t-form-item :label="$t('page.application.upload_file')">
        <t-upload :key="uploadResetKey" :action="''" :auto-upload="false" accept="*" :multiple="false" @change="onFileChange">
          <t-button variant="outline">{{ $t('page.application.select_file') }}</t-button>
        </t-upload>
        <div v-if="uploadFile" style="margin-top:6px;color:#666;font-size:12px">
          {{ uploadFile.name }} ({{ formatSize(uploadFile.size) }})
        </div>
        <div v-if="uploadState === 'failed'" class="upload-retry-tip">{{ $t('page.application.upload_retry_tip') }}</div>
        <t-progress
          v-if="uploadProgress != null"
          theme="line"
          :percentage="uploadProgress"
          :style="{ maxWidth: '300px', marginTop: '6px' }"
        />
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
import { wafAppAddApi, wafAppEditApi, wafAppListApi, wafAppDirPreviewApi, buildUploadConfig } from '@/apis/application';
import { createDirPreviewController, planSubmit } from './appFlow';

export default Vue.extend({
  name: 'AppForm',
  props: {
    value:      { type: Object,  default: () => ({}) },
    isEdit:     { type: Boolean, default: false },
    opPassword: { type: String,  default: '' },
  },
  data() {
    return {
      formData: { ...this.value },
      formError: '',
      recordCreated: false,
      recordId: '',
      uploadFile: null as File | null,
      uploadHash: '',
      hashComputing: false,
      uploadState: '' as '' | 'success' | 'failed',
      uploadProgress: null as number | null,
      uploadResetKey: 0,
      submitting: false,
      preview: null as any,
      previewState: 'idle' as 'idle' | 'loading' | 'ok' | 'unsupported' | 'error',
      previewErrorMsg: '',
      previewCtl: null as any,
      rules: {
        name: [{ required: true, message: this.$t('page.application.name_required') }],
        start_cmd: [{ required: true, message: this.$t('page.application.start_cmd_required') }],
      },
    };
  },
  watch: {
    value(v) { this.onValueChange(v); },
    'formData.app_dir': function onAppDirChange() { this.schedulePreview(); },
  },
  created() {
    this.previewCtl = createDirPreviewController({
      request: (body) => wafAppDirPreviewApi(body),
      isNotFound: (err) => !!(err && err.response && err.response.status === 404),
      onUpdate: (st) => {
        if (st.state === 'ok') {
          this.preview = st.data;
          this.previewState = 'ok';
          this.previewErrorMsg = '';
        } else if (st.state === 'unsupported') {
          this.preview = null;
          this.previewState = 'unsupported';
        } else {
          this.preview = null;
          this.previewState = 'error';
          this.previewErrorMsg = st.message || this.$t('common.failed');
        }
      },
    });
    this.schedulePreview();
  },
  beforeDestroy() {
    if (this.previewCtl) this.previewCtl.dispose();
  },
  methods: {
    onValueChange(v: any) {
      this.formData = { ...v };
      this.formError = '';
      this.recordCreated = false;
      this.recordId = '';
      this.uploadState = '';
      this.uploadFile = null;
      this.uploadHash = '';
      this.uploadProgress = null;
      this.uploadResetKey += 1;
      if (this.previewCtl) this.schedulePreview();
    },
    schedulePreview() {
      if (!this.previewCtl) return;
      this.previewState = 'loading';
      this.previewCtl.schedule({
        code: (this.formData as any).code || '',
        app_dir: (this.formData.app_dir || '').trim(),
      });
    },

    onFileChange(files) {
      this.uploadState = '';
      this.uploadProgress = null;
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

    // 上传失败也要让调用方拿到结果（true=成功），由调用方决定关窗或留窗
    doUploadFile(code: string): Promise<boolean> {
      return new Promise((resolve) => {
        const fd = new FormData();
        fd.append('code', code);
        fd.append('hash', this.uploadHash);
        fd.append('file', this.uploadFile as File);
        const timeout = Math.max(300000, Math.ceil((this.uploadFile as File).size / 102400) * 1000 + 90000);
        this.uploadProgress = 0;
        request(buildUploadConfig('/application/app/upload', fd, timeout, this.opPassword, (p) => { this.uploadProgress = p; }))
          .then(res => {
            if (res && res.code === 0) {
              this.uploadState = 'success';
              this.uploadProgress = null;
              this.$message.success(this.$t('page.application.upload_init_uploaded'));
              resolve(true);
            } else {
              this.uploadState = 'failed';
              this.uploadProgress = null;
              const msg = res ? res.msg : '';
              this.formError = this.$t('page.application.upload_failed_keep_record', { reason: msg ? `：${msg}` : '' });
              resolve(false);
            }
          })
          .catch(() => {
            this.uploadState = 'failed';
            this.uploadProgress = null;
            this.formError = this.$t('page.application.upload_failed_keep_record', { reason: '' });
            resolve(false);
          });
      });
    },

    // 新增成功后反查记录 ID：优先用 add 响应里的 data.id（新后端），否则按 code 翻列表查（现契约 add 不返回 data）
    resolveRecordId(): Promise<string> {
      if (this.recordId) return Promise.resolve(this.recordId);
      const { code } = this.formData as any;
      if (!code) return Promise.resolve('');
      const pageSize = 100;
      let pageIndex = 1;
      const tryPage: () => Promise<string> = () =>
        wafAppListApi({ pageIndex, pageSize }).then(res => {
          if (!(res && res.code === 0 && res.data)) return '';
          const list = res.data.list || [];
          const hit = list.find((it: any) => it.code === code);
          if (hit && hit.id) { this.recordId = hit.id; return hit.id; }
          if (list.length < pageSize || pageIndex >= 20) return '';
          pageIndex += 1;
          return tryPage();
        }).catch(() => '');
      return tryPage();
    },

    finishSuccess() {
      this.submitting = false;
      this.formError = '';
      this.$message.success(this.$t('common.tips.save_success'));
      this.$emit('submit');
    },

    onSubmit({ validateResult }) {
      if (validateResult !== true) return;
      this.submitting = true;
      this.formError = '';
      const plan = planSubmit({
        isEdit: this.isEdit,
        recordCreated: this.recordCreated,
        hasUploadFile: !!this.uploadFile,
        uploadState: this.uploadState,
      });
      if (plan === 'add') {
        this.submitAdd();
      } else {
        this.submitExisting(plan === 'edit_then_upload');
      }
    },

    submitAdd() {
      wafAppAddApi(this.formData).then(res => {
        if (!(res && res.code === 0)) {
          this.submitting = false;
          this.formError = (res && res.msg) || this.$t('common.failed');
          return;
        }
        // 记录已创建：此后提交只更新既有记录，绝不重复 Add
        this.recordCreated = true;
        const d: any = res && res.data;
        if (d && typeof d === 'object' && d.id) {
          this.recordId = d.id;
          (this.formData as any).id = d.id;
        }
        if (this.uploadFile) {
          this.doUploadFile((this.formData as any).code).then(ok => {
            this.submitting = false;
            if (ok) this.finishSuccess();
          });
        } else {
          this.resolveRecordId().finally(() => { this.finishSuccess(); });
        }
      }).catch(() => {
        this.submitting = false;
        this.formError = this.$t('common.failed');
      });
    },

    submitExisting(withUploadRetry: boolean) {
      this.resolveRecordId().then(id => {
        const canUploadOnly = withUploadRetry && this.uploadFile && (this.formData as any).code;
        if (!id) {
          // 拿不到记录 ID 时不能盲目新增；若只是要重试上传（仅需 code）仍可继续
          if (canUploadOnly) {
            this.doUploadFile((this.formData as any).code).then(ok => {
              this.submitting = false;
              if (ok) this.finishSuccess();
            });
          } else {
            this.submitting = false;
            this.formError = this.$t('page.application.record_id_missing');
          }
          return;
        }
        (this.formData as any).id = id;
        wafAppEditApi(this.formData).then(res => {
          if (!(res && res.code === 0)) {
            this.submitting = false;
            this.formError = (res && res.msg) || this.$t('common.failed');
            return;
          }
          if (withUploadRetry && this.uploadFile) {
            this.doUploadFile((this.formData as any).code).then(ok => {
              this.submitting = false;
              if (ok) this.finishSuccess();
            });
          } else {
            this.finishSuccess();
          }
        }).catch(() => {
          this.submitting = false;
          this.formError = this.$t('common.failed');
        });
      });
    },
  },
});
</script>

<style scoped>
.form-error-alert {
  margin-bottom: 12px;
}
.dir-preview {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.8;
  word-break: break-all;
}
.dir-preview-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
}
.dir-preview-label {
  color: #999;
  flex-shrink: 0;
}
.dir-preview-muted {
  color: #999;
}
.dir-preview-warn {
  color: #e37318;
}
.dir-preview-error {
  color: #d54941;
}
.dir-preview-code {
  background: var(--td-bg-color-secondarycontainer, #f3f3f3);
  border-radius: 3px;
  padding: 0 4px;
  font-size: 12px;
}
.upload-retry-tip {
  margin-top: 6px;
  color: #e37318;
  font-size: 12px;
}
</style>
