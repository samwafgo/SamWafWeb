<template>
  <div>
    <t-form :data="formData" label-align="right" :label-width="120">
      <t-form-item :label="$t('page.application.upload_file')">
        <t-upload
          :action="''"
          :auto-upload="false"
          accept="*"
          :multiple="false"
          @change="onFileChange"
        >
          <t-button variant="outline">{{ $t('page.application.select_file') }}</t-button>
        </t-upload>
        <div v-if="selectedFile" style="margin-top:6px;color:#666;font-size:12px">
          {{ selectedFile.name }} ({{ formatSize(selectedFile.size) }})
        </div>
      </t-form-item>
      <t-form-item :label="$t('page.application.hash_sha256')">
        <t-input v-model="formData.hash"
          :placeholder="hashComputing ? $t('page.application.hash_computing') : $t('page.application.hash_placeholder')"
          :disabled="hashComputing"
          clearable />
      </t-form-item>
      <t-form-item :label="$t('page.application.upgrade_action')">
        <t-radio-group v-model="upgradeMode">
          <t-radio value="upload">{{ $t('page.application.upload_only') }}</t-radio>
          <t-radio value="upgrade">{{ $t('page.application.upload_and_upgrade') }}</t-radio>
        </t-radio-group>
      </t-form-item>
    </t-form>

    <!-- 备份列表 -->
    <t-divider>{{ $t('page.application.backups') }}</t-divider>
    <t-table :data="backups" :columns="backupColumns" row-key="filename" size="small"
      :empty="$t('page.application.no_backups')">
      <template #op="slotProps">
        <a class="t-button-link" @click="doRollback(slotProps.row.filename)">
          {{ $t('page.application.rollback') }}
        </a>
      </template>
    </t-table>

    <div style="text-align:right;margin-top:16px">
      <t-button theme="primary" :loading="uploading" @click="doUpload" :disabled="!selectedFile || hashComputing">
        {{ uploadBtnLabel }}
      </t-button>
      <t-button theme="default" @click="$emit('close')" style="margin-left:8px">{{ $t('common.cancel') }}</t-button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import CryptoJS from 'crypto-js';
import request from '@/utils/request';
import { wafAppBackupsApi, wafAppStatusApi } from '@/apis/application';

export default Vue.extend({
  name: 'AppUpgrade',
  props: { appCode: { type: String, default: '' } },
  data() {
    return {
      formData: { hash: '' },
      selectedFile: null as File | null,
      upgradeMode: 'upgrade',
      uploading: false,
      uploadPhase: '' as '' | 'stopping' | 'uploading',
      hashComputing: false,
      backups: [],
      backupColumns: [
        { colKey: 'filename', title: this.$t('page.application.backup_filename'), ellipsis: true },
        { colKey: 'size',     title: this.$t('page.application.backup_size'), width: 100,
          cell: (h, { row }) => this.formatSize(row.size) },
        { colKey: 'created_at', title: this.$t('page.application.backup_time'), width: 180,
          cell: (h, { row }) => row.created_at || '-' },
        { colKey: 'op', title: this.$t('common.op'), width: 80, cell: 'op' },
      ],
    };
  },
  computed: {
    uploadBtnLabel(): string {
      if (this.uploading) {
        if (this.uploadPhase === 'stopping') return this.$t('page.application.stopping') as string;
        return this.$t('page.application.upgrading') as string;
      }
      return this.upgradeMode === 'upgrade'
        ? this.$t('page.application.upload_and_upgrade') as string
        : this.$t('page.application.upload_only') as string;
    },
  },
  mounted() {
    this.loadBackups();
  },
  methods: {
    onFileChange(files) {
      if (files && files.length > 0) {
        this.selectedFile = files[0].raw || files[0];
        this.computeHash(this.selectedFile);
      } else {
        this.selectedFile = null;
        this.formData.hash = '';
      }
    },
    computeHash(file: File) {
      this.hashComputing = true;
      this.formData.hash = '';
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wordArray = CryptoJS.lib.WordArray.create(e.target!.result as ArrayBuffer);
          this.formData.hash = CryptoJS.SHA256(wordArray).toString();
        } catch (_) {
          this.formData.hash = '';
        } finally {
          this.hashComputing = false;
        }
      };
      reader.onerror = () => { this.formData.hash = ''; this.hashComputing = false; };
      reader.readAsArrayBuffer(file);
    },
    formatSize(bytes: number): string {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    // 根据文件大小动态计算超时：假设最慢 100 KB/s，再加 90s 处理余量
    calcTimeout(fileSize: number): number {
      return Math.max(300000, Math.ceil(fileSize / 102400) * 1000 + 90000);
    },
    // 停止应用并轮询直到确认已停止（最多等 60s）
    stopAndWait(): Promise<void> {
      return new Promise((resolve, reject) => {
        request({ url: '/application/app/stop', method: 'get', params: { code: this.appCode }, timeout: 15000 })
          .then(() => {
            const deadline = Date.now() + 60000;
            const poll = () => {
              if (Date.now() >= deadline) {
                reject(new Error(this.$t('page.application.stop_wait_timeout') as string));
                return;
              }
              wafAppStatusApi({ code: this.appCode }).then(res => {
                if (res && res.code === 0 && res.data.run_status === 0) {
                  resolve();
                } else {
                  setTimeout(poll, 1000);
                }
              }).catch(() => setTimeout(poll, 1000));
            };
            setTimeout(poll, 800);
          })
          .catch(reject);
      });
    },
    async doUpload() {
      if (!this.selectedFile) return;
      this.uploading = true;
      try {
        if (this.upgradeMode === 'upgrade') {
          // 步骤 1：先停止，确认进程退出后再发送文件
          this.uploadPhase = 'stopping';
          await this.stopAndWait();
        }

        // 步骤 2：上传（此时后端 StopApp 因进程已退出会即时返回，超时仅受网速影响）
        this.uploadPhase = 'uploading';
        const fd = new FormData();
        fd.append('code', this.appCode);
        fd.append('hash', this.formData.hash);
        fd.append('file', this.selectedFile);
        const url = this.upgradeMode === 'upgrade'
          ? '/application/app/upgrade'
          : '/application/app/upload';
        const timeout = this.calcTimeout(this.selectedFile.size);

        const res = await request({ url, method: 'post', data: fd, timeout });
        if (res && res.code === 0) {
          this.$message.success(this.$t('common.success'));
          this.loadBackups();
          this.$emit('done');
        } else {
          this.$message.error(res ? res.msg : this.$t('common.failed'));
        }
      } catch (err: any) {
        this.$message.error(err.message || this.$t('common.failed'));
      } finally {
        this.uploading = false;
        this.uploadPhase = '';
      }
    },
    loadBackups() {
      wafAppBackupsApi({ code: this.appCode }).then(res => {
        if (res && res.code === 0) {
          console.log("wafAppBackupsApi",res.data)
          this.backups = res.data.list || [];
        }
      });
    },
    doRollback(filename: string) {
      this.uploading = true;
      this.uploadPhase = 'stopping';
      this.stopAndWait()
        .then(() => {
          this.uploadPhase = 'uploading';
          return request({ url: '/application/app/rollback', method: 'get',
            params: { code: this.appCode, filename }, timeout: 60000 });
        })
        .then(res => {
          if (res && res.code === 0) {
            this.$message.success(this.$t('page.application.rollback_success'));
            this.$emit('done');
          } else {
            this.$message.error(res ? res.msg : this.$t('common.failed'));
          }
        })
        .catch(err => { this.$message.error(err.message || this.$t('common.failed')); })
        .finally(() => { this.uploading = false; this.uploadPhase = ''; });
    },
  },
});
</script>

<style scoped>
.t-button-link { color: var(--td-brand-color); cursor: pointer; }
</style>
