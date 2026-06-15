<template>
  <div>
    <t-alert theme="warning" :message="$t('page.ai.test_warning')" style="margin-bottom: 12px" />
    <t-tabs v-model="activeTab" class="ai-tabs">
    <t-tab-panel value="dashboard" :label="$t('page.ai.dashboard.tab')">
      <ai-dashboard v-if="activeTab === 'dashboard'" style="margin-top:12px" />
    </t-tab-panel>
    <t-tab-panel value="workbench" :label="$t('page.ai.workbench.tab')">
      <ai-label-workbench v-if="activeTab === 'workbench'" style="margin-top:12px" />
    </t-tab-panel>
    <t-tab-panel value="model" :label="$t('page.ai.model_tab')">
      <div style="margin-top:12px">
    <t-card :title="$t('page.ai.status_title')" :bordered="false" style="margin-bottom:16px">
      <t-space direction="vertical" size="small" style="width:100%">
        <t-alert v-if="status.global_enable !== 1" theme="warning" :message="$t('page.ai.global_off_tip')" />
        <t-alert v-else-if="!status.model_loaded" theme="warning" :message="$t('page.ai.no_model_tip')" />
        <t-alert v-else theme="success" :message="$t('page.ai.ready_tip')" />

        <t-descriptions :column="2" bordered>
          <t-descriptions-item :label="$t('page.ai.global_enable')">
            {{ status.global_enable === 1 ? $t('common.on') : $t('common.off') }}
          </t-descriptions-item>
          <t-descriptions-item :label="$t('page.ai.mode')">{{ status.mode }}</t-descriptions-item>
          <t-descriptions-item :label="$t('page.ai.model_loaded')">
            <t-tag v-if="status.model_loaded" theme="success">{{ $t('common.on') }}</t-tag>
            <t-tag v-else theme="default">{{ $t('common.off') }}</t-tag>
          </t-descriptions-item>
          <t-descriptions-item :label="$t('page.ai.engine_feature_version')">{{ status.feature_version }}</t-descriptions-item>
          <template v-if="status.manifest">
            <t-descriptions-item :label="$t('page.ai.model_version')">{{ status.manifest.model_version }}</t-descriptions-item>
            <t-descriptions-item :label="$t('page.ai.model_type')">{{ status.manifest.model_type }}</t-descriptions-item>
            <t-descriptions-item :label="$t('page.ai.model_feature_version')">{{ status.manifest.feature_version }}</t-descriptions-item>
            <t-descriptions-item :label="$t('page.ai.thresholds')">
              {{ $t('page.ai.block') }} {{ status.manifest.block_threshold }} / {{ $t('page.ai.observe') }} {{ status.manifest.observe_threshold }}
            </t-descriptions-item>
            <t-descriptions-item :label="$t('page.ai.created_at')" :span="2">{{ status.manifest.created_at }}</t-descriptions-item>
          </template>
        </t-descriptions>

        <t-space>
          <t-button theme="default" @click="loadStatus">{{ $t('page.ai.refresh') }}</t-button>
          <t-button theme="default" :disabled="!status.model_loaded" @click="reloadModel">{{ $t('page.ai.reload') }}</t-button>
          <t-popconfirm :content="$t('page.ai.unload_confirm')" @confirm="unloadModel">
            <t-button theme="danger" variant="outline" :disabled="!status.model_loaded">{{ $t('page.ai.unload') }}</t-button>
          </t-popconfirm>
        </t-space>
      </t-space>
    </t-card>

    <t-card :title="$t('page.ai.upload_title')" :bordered="false" style="margin-bottom:16px">
      <t-space direction="vertical" style="width:100%">
        <div>{{ $t('page.ai.upload_hint') }}</div>
        <t-space align="center">
          <input ref="fileInput" type="file" accept=".swai" @change="onFileChange" />
          <t-button theme="primary" :loading="uploading" :disabled="!selectedFile" @click="uploadModel">
            {{ $t('page.ai.upload_btn') }}
          </t-button>
        </t-space>
      </t-space>
    </t-card>

    <t-card :title="$t('page.ai.export_title')" :bordered="false">
      <t-space direction="vertical" style="width:100%">
        <div>{{ $t('page.ai.export_hint') }}</div>
        <t-space align="center">
          <span>{{ $t('page.ai.export_days') }}</span>
          <t-input-number v-model="exportForm.days" :min="0" :max="3650" style="width:120px" />
          <span>{{ $t('page.ai.export_max') }}</span>
          <t-input-number v-model="exportForm.max_count" :min="0" :max="1000000" :step="10000" style="width:160px" />
          <t-button theme="primary" :loading="exporting" @click="exportData">{{ $t('page.ai.export_btn') }}</t-button>
        </t-space>
        <t-alert v-if="exportStarted" theme="info" :message="$t('page.ai.export_started_tip')" />
      </t-space>
    </t-card>
      </div>
    </t-tab-panel>
    </t-tabs>
  </div>
</template>

<script>
import { MessagePlugin } from 'tdesign-vue';
import { aiStatusApi, aiUploadModelApi, aiReloadModelApi, aiUnloadModelApi, aiExportTrainDataApi } from '@/apis/ai';
import AiDashboard from './components/AiDashboard.vue';
import AiLabelWorkbench from './components/AiLabelWorkbench.vue';

export default {
  name: 'AIModelManage',
  components: { AiDashboard, AiLabelWorkbench },
  data() {
    return {
      activeTab: 'dashboard',
      status: { global_enable: 0, mode: 'observe', model_loaded: false, feature_version: '', manifest: null },
      selectedFile: null,
      uploading: false,
      exporting: false,
      exportForm: { days: 0, max_count: 200000 },
      exportStarted: false,
    };
  },
  mounted() {
    this.loadStatus();
  },
  methods: {
    async loadStatus() {
      try {
        const res = await aiStatusApi();
        if (res.code === 0) {
          this.status = res.data;
        } else {
          MessagePlugin.error(res.msg || this.$t('page.ai.load_failed'));
        }
      } catch (e) {
        MessagePlugin.error(this.$t('page.ai.load_failed'));
      }
    },
    onFileChange(e) {
      const files = e.target.files;
      this.selectedFile = files && files.length > 0 ? files[0] : null;
    },
    async uploadModel() {
      if (!this.selectedFile) return;
      if (!this.selectedFile.name.toLowerCase().endsWith('.swai')) {
        MessagePlugin.error(this.$t('page.ai.invalid_file'));
        return;
      }
      const form = new FormData();
      form.append('file', this.selectedFile);
      this.uploading = true;
      try {
        const res = await aiUploadModelApi(form);
        if (res.code === 0) {
          MessagePlugin.success(this.$t('page.ai.upload_success'));
          this.selectedFile = null;
          if (this.$refs.fileInput) this.$refs.fileInput.value = '';
          this.loadStatus();
        } else {
          MessagePlugin.error(res.msg || this.$t('page.ai.upload_failed'));
        }
      } catch (e) {
        MessagePlugin.error(this.$t('page.ai.upload_failed'));
      } finally {
        this.uploading = false;
      }
    },
    async reloadModel() {
      try {
        const res = await aiReloadModelApi();
        if (res.code === 0) {
          MessagePlugin.success(this.$t('page.ai.reload_success'));
          this.loadStatus();
        } else {
          MessagePlugin.error(res.msg || this.$t('page.ai.reload_failed'));
        }
      } catch (e) {
        MessagePlugin.error(this.$t('page.ai.reload_failed'));
      }
    },
    async unloadModel() {
      try {
        const res = await aiUnloadModelApi();
        if (res.code === 0) {
          MessagePlugin.success(this.$t('page.ai.unload_success'));
          this.loadStatus();
        } else {
          MessagePlugin.error(res.msg || this.$t('page.ai.unload_failed'));
        }
      } catch (e) {
        MessagePlugin.error(this.$t('page.ai.unload_failed'));
      }
    },
    async exportData() {
      this.exporting = true;
      this.exportStarted = false;
      try {
        const res = await aiExportTrainDataApi({ days: this.exportForm.days, max_count: this.exportForm.max_count });
        if (res.code === 0) {
          // 导出是异步任务：后端立即返回"已开始"，完成后在通知中心提示
          this.exportStarted = true;
          MessagePlugin.success(res.msg || this.$t('page.ai.export_started'));
        } else {
          MessagePlugin.error(res.msg || this.$t('page.ai.export_failed'));
        }
      } catch (e) {
        MessagePlugin.error(this.$t('page.ai.export_failed'));
      } finally {
        this.exporting = false;
      }
    },
  },
};
</script>
