<template>
  <div>
    <t-row justify="space-between" style="margin-bottom:12px">
      <t-button size="small" @click="loadLogs">{{ $t('common.refresh') }}</t-button>
      <t-button size="small" theme="danger" @click="clearLogs">{{ $t('page.application.clear_logs') }}</t-button>
    </t-row>
    <div ref="logBox" class="log-box">
      <div v-if="logs.length === 0" class="log-empty">{{ $t('page.application.no_logs') }}</div>
      <div v-for="(line, idx) in logs" :key="idx" class="log-line">{{ line }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { wafAppLogsApi, wafAppClearLogsApi } from '@/apis/application';

export default Vue.extend({
  name: 'AppLogs',
  props: {
    appCode: { type: String, default: '' },
  },
  data() {
    return { logs: [] as string[] };
  },
  mounted() {
    this.loadLogs();
  },
  methods: {
    loadLogs() {
      if (!this.appCode) return;
      wafAppLogsApi({ code: this.appCode }).then(res => {
        if (res && res.code === 0) {
          this.logs = res.data.logs || [];
          this.$nextTick(() => {
            const box = this.$refs.logBox as HTMLElement;
            if (box) box.scrollTop = box.scrollHeight;
          });
        }
      });
    },
    clearLogs() {
      wafAppClearLogsApi({ code: this.appCode }).then(res => {
        if (res && res.code === 0) {
          this.logs = [];
          this.$message.success(this.$t('page.application.logs_cleared'));
        }
      });
    },
  },
});
</script>

<style scoped>
.log-box {
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  height: 400px;
  overflow-y: auto;
  padding: 12px;
  border-radius: 4px;
}
.log-line { line-height: 1.6; white-space: pre-wrap; word-break: break-all; }
.log-empty { color: #888; text-align: center; margin-top: 180px; }
</style>
