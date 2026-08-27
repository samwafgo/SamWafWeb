<template>
  <div class="diagnostic-container">
    <t-alert theme="info" :message="$t('page.diagnostic.alert_message')" style="margin-bottom: 16px;" />
    <t-tabs v-model="activeTab" @change="handleTabChange">
      <!-- 整机监控：复用现有系统监控组件 -->
      <t-tab-panel value="machine" :label="$t('page.diagnostic.tab_machine')">
        <system-monitor v-if="machineLoaded" />
      </t-tab-panel>

      <!-- SamWaf 进程 -->
      <t-tab-panel value="process" :label="$t('page.diagnostic.tab_process')">
        <div style="padding-top: 16px;">
          <t-space style="margin-bottom: 12px;">
            <t-button theme="primary" :loading="snapshotLoading" @click="fetchSnapshot">
              {{ $t('page.diagnostic.refresh') }}
            </t-button>
            <span v-if="snapshot.sampled_at" class="sample-time">
              {{ $t('page.diagnostic.sampled_at') }}: {{ formatTime(snapshot.sampled_at) }}
            </span>
          </t-space>
          <div class="card-row">
            <t-card :title="$t('page.diagnostic.process_card')" :bordered="false" class="diag-card">
              <div class="kv"><span class="k">PID</span><span class="v">{{ snapshot.process.pid }}</span></div>
              <div class="kv"><span class="k">{{ $t('page.diagnostic.uptime') }}</span><span class="v">{{ formatDuration(snapshot.process.uptime_seconds) }}</span></div>
              <div class="kv"><span class="k">{{ $t('page.diagnostic.proc_cpu') }}</span><span class="v">{{ snapshot.process.cpu_percent }}%</span></div>
              <div class="kv"><span class="k">{{ $t('page.diagnostic.rss') }}</span><span class="v">{{ formatBytes(snapshot.process.rss_bytes) }}</span></div>
              <div class="kv"><span class="k">{{ $t('page.diagnostic.vms') }}</span><span class="v">{{ formatBytes(snapshot.process.vms_bytes) }}</span></div>
              <div class="kv"><span class="k">{{ $t('page.diagnostic.threads') }}</span><span class="v">{{ snapshot.process.num_threads }}</span></div>
              <div class="kv"><span class="k">{{ $t('page.diagnostic.fds') }}</span><span class="v">{{ snapshot.process.num_fds >= 0 ? snapshot.process.num_fds : $t('page.diagnostic.not_supported') }}</span></div>
              <div class="kv"><span class="k">{{ $t('page.diagnostic.cgo_mem') }}</span><span class="v">{{ cgoMemory }}</span></div>
            </t-card>
            <t-card :title="$t('page.diagnostic.runtime_card')" :bordered="false" class="diag-card">
              <div class="kv"><span class="k">Goroutines</span><span class="v">{{ snapshot.runtime.goroutines }}</span></div>
              <div class="kv"><span class="k">GOMAXPROCS / CPU</span><span class="v">{{ snapshot.runtime.gomaxprocs }} / {{ snapshot.runtime.num_cpu }}</span></div>
              <div class="kv"><span class="k">{{ $t('page.diagnostic.heap_alloc') }}</span><span class="v">{{ formatBytes(snapshot.runtime.heap_alloc) }}</span></div>
              <div class="kv"><span class="k">{{ $t('page.diagnostic.heap_inuse') }}</span><span class="v">{{ formatBytes(snapshot.runtime.heap_inuse) }}</span></div>
              <div class="kv"><span class="k">{{ $t('page.diagnostic.heap_idle') }}</span><span class="v">{{ formatBytes(snapshot.runtime.heap_idle) }}</span></div>
              <div class="kv"><span class="k">{{ $t('page.diagnostic.stack_inuse') }}</span><span class="v">{{ formatBytes(snapshot.runtime.stack_inuse) }}</span></div>
              <div class="kv"><span class="k">{{ $t('page.diagnostic.go_sys') }}</span><span class="v">{{ formatBytes(snapshot.runtime.sys) }}</span></div>
              <div class="kv"><span class="k">{{ $t('page.diagnostic.gc_count') }}</span><span class="v">{{ snapshot.runtime.num_gc }}</span></div>
              <div class="kv"><span class="k">{{ $t('page.diagnostic.gc_pause') }}</span><span class="v">{{ snapshot.runtime.pause_total_ms }} ms</span></div>
              <div class="kv"><span class="k">{{ $t('page.diagnostic.last_gc') }}</span><span class="v">{{ snapshot.runtime.last_gc_unix ? formatTime(snapshot.runtime.last_gc_unix) : '-' }}</span></div>
              <div class="kv"><span class="k">Go</span><span class="v">{{ snapshot.runtime.go_version }}</span></div>
            </t-card>
            <t-card :title="$t('page.diagnostic.db_card')" :bordered="false" class="diag-card">
              <div v-for="db in snapshot.databases" :key="db.name" class="kv">
                <span class="k">{{ db.name }}</span><span class="v">{{ db.file_size_mb }} MB</span>
              </div>
              <div v-if="!snapshot.databases || snapshot.databases.length === 0" class="empty-hint">-</div>
            </t-card>
          </div>
        </div>
      </t-tab-panel>

      <!-- 内部组件 -->
      <t-tab-panel value="components" :label="$t('page.diagnostic.tab_components')">
        <div style="padding-top: 16px;">
          <t-space style="margin-bottom: 12px;">
            <t-button theme="primary" :loading="snapshotLoading" @click="fetchSnapshot">
              {{ $t('page.diagnostic.refresh') }}
            </t-button>
          </t-space>
          <t-alert theme="warning" v-if="hasQueueBacklog" :message="$t('page.diagnostic.queue_backlog_warn')" style="margin-bottom: 12px;" />
          <div class="card-row">
            <t-card
              v-for="comp in snapshot.components"
              :key="comp.name"
              :title="componentTitle(comp.name)"
              :bordered="false"
              class="diag-card"
            >
              <div v-for="(val, key) in comp.items" :key="key" class="kv">
                <span class="k mono">{{ key }}</span>
                <span class="v" :class="valueClass(comp.name, key, val)">{{ val }}</span>
              </div>
            </t-card>
          </div>
        </div>
      </t-tab-panel>

      <!-- 趋势 -->
      <t-tab-panel value="trend" :label="$t('page.diagnostic.tab_trend')">
        <div style="padding-top: 16px;">
          <t-space style="margin-bottom: 12px;">
            <t-button theme="primary" :loading="trendLoading" @click="fetchTrend">
              {{ $t('page.diagnostic.refresh') }}
            </t-button>
            <span class="sample-time">{{ $t('page.diagnostic.trend_hint') }}</span>
          </t-space>
          <t-card :bordered="false">
            <div ref="trendChart" style="width: 100%; height: 400px;"></div>
          </t-card>
        </div>
      </t-tab-panel>

      <!-- 诊断包 -->
      <t-tab-panel value="package" :label="$t('page.diagnostic.tab_package')">
        <div style="padding-top: 16px;">
          <t-card :title="$t('page.diagnostic.cpu_profile_card')" :bordered="false" style="margin-bottom: 16px;">
            <p class="desc">{{ $t('page.diagnostic.cpu_profile_desc') }}</p>
            <div v-if="cpuStatus.running" style="margin: 12px 0;">
              <t-progress :percentage="cpuProgress" :label="true" />
              <p class="desc">{{ $t('page.diagnostic.cpu_profile_running') }}</p>
            </div>
            <div v-else-if="cpuStatus.has_result" class="kv" style="margin: 8px 0;">
              <span class="k">{{ $t('page.diagnostic.cpu_profile_done') }}</span>
              <span class="v">{{ formatTime(cpuStatus.finished_unix) }} ({{ formatBytes(cpuStatus.result_size) }})</span>
            </div>
            <t-popconfirm
              :content="$t('page.diagnostic.cpu_profile_confirm')"
              @confirm="startCpuProfile"
            >
              <t-button theme="warning" :disabled="cpuStatus.running || cpuStatus.cooldown_sec > 0" :loading="cpuStarting">
                {{ cpuButtonLabel }}
              </t-button>
            </t-popconfirm>
          </t-card>

          <t-card :title="$t('page.diagnostic.package_card')" :bordered="false">
            <p class="desc">{{ $t('page.diagnostic.package_desc') }}</p>
            <p class="desc">{{ $t('page.diagnostic.package_privacy') }}</p>
            <t-button theme="primary" :loading="packageDownloading" @click="downloadPackage" style="margin-top: 8px;">
              {{ $t('page.diagnostic.download_package') }}
            </t-button>
          </t-card>
        </div>
      </t-tab-panel>
    </t-tabs>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import * as echarts from 'echarts/core';
import SystemMonitor from '@/pages/waf/monitor/index.vue';
import {
  getDiagSnapshotApi,
  getDiagTrendApi,
  startCpuProfileApi,
  getCpuProfileStatusApi,
  downloadDiagPackageApi,
} from '@/apis/monitor';

echarts.use([GridComponent, TooltipComponent, LegendComponent, LineChart, CanvasRenderer]);

const emptySnapshot = () => ({
  version: '',
  version_tag: '',
  os: '',
  arch: '',
  process: { pid: 0, cpu_percent: 0, rss_bytes: 0, vms_bytes: 0, num_threads: 0, num_fds: -1, uptime_seconds: 0 },
  runtime: {
    goroutines: 0, gomaxprocs: 0, num_cpu: 0, heap_alloc: 0, heap_inuse: 0, heap_idle: 0,
    stack_inuse: 0, sys: 0, num_gc: 0, pause_total_ms: 0, last_gc_unix: 0, go_version: '',
  },
  components: [],
  databases: [],
  sampled_at: 0,
});

export default Vue.extend({
  name: 'RunDiagnostic',
  components: { SystemMonitor },
  data() {
    return {
      activeTab: 'machine',
      machineLoaded: true,
      snapshot: emptySnapshot(),
      snapshotLoading: false,
      trendLoading: false,
      trendChart: null,
      cpuStatus: { running: false, has_result: false, result_size: 0, finished_unix: 0, elapsed_second: 0, duration_sec: 30, cooldown_sec: 0, last_error: '' },
      cpuStarting: false,
      cpuPollTimer: null,
      cpuPollFailCount: 0,
      packageDownloading: false,
    };
  },
  computed: {
    // RSS 与 Go 申请内存的差值 ≈ CGO/C 侧（主要是 SQLite）占用
    cgoMemory() {
      const rss = this.snapshot.process.rss_bytes || 0;
      const goSys = this.snapshot.runtime.sys || 0;
      if (rss <= 0 || goSys <= 0 || rss <= goSys) return '-';
      return this.formatBytes(rss - goSys);
    },
    hasQueueBacklog() {
      const queueComp = (this.snapshot.components || []).find((c) => c.name === 'db_queue');
      if (!queueComp) return false;
      return Object.values(queueComp.items || {}).some((v: any) => v > 5000);
    },
    cpuProgress() {
      const total = this.cpuStatus.duration_sec || 30;
      return Math.min(100, Math.round(((this.cpuStatus.elapsed_second || 0) / total) * 100));
    },
    cpuButtonLabel() {
      if (this.cpuStatus.running) return this.$t('page.diagnostic.cpu_profile_running_btn');
      if (this.cpuStatus.cooldown_sec > 0) {
        return `${this.$t('page.diagnostic.cpu_profile_cooldown')} (${this.cpuStatus.cooldown_sec}s)`;
      }
      return this.$t('page.diagnostic.start_cpu_profile');
    },
  },
  mounted() {
    this.fetchSnapshot();
    this.fetchCpuStatus();
  },
  beforeDestroy() {
    this.stopCpuPolling();
    if (this.trendChart) {
      this.trendChart.dispose();
      this.trendChart = null;
    }
  },
  methods: {
    handleTabChange(value) {
      if (value === 'process' || value === 'components') {
        if (!this.snapshotLoading) this.fetchSnapshot();
      } else if (value === 'trend') {
        this.fetchTrend();
      } else if (value === 'package') {
        this.fetchCpuStatus();
      }
    },
    fetchSnapshot() {
      this.snapshotLoading = true;
      getDiagSnapshotApi()
        .then((res: any) => {
          if (res.code === 0) {
            this.snapshot = { ...emptySnapshot(), ...res.data };
          } else {
            this.$message.error(res.msg || this.$t('page.diagnostic.load_failed'));
          }
        })
        .catch(() => this.$message.error(this.$t('page.diagnostic.load_failed')))
        .finally(() => { this.snapshotLoading = false; });
    },
    fetchTrend() {
      this.trendLoading = true;
      getDiagTrendApi()
        .then((res: any) => {
          if (res.code === 0) {
            this.renderTrend(res.data);
          } else {
            this.$message.error(res.msg || this.$t('page.diagnostic.load_failed'));
          }
        })
        .catch(() => this.$message.error(this.$t('page.diagnostic.load_failed')))
        .finally(() => { this.trendLoading = false; });
    },
    renderTrend(trend) {
      this.$nextTick(() => {
        const el = this.$refs.trendChart;
        if (!el) return;
        if (!this.trendChart) {
          this.trendChart = echarts.init(el);
        }
        const points = (trend && trend.points) || [];
        const times = points.map((p) => this.formatTime(p.ts, true));
        this.trendChart.setOption({
          tooltip: { trigger: 'axis' },
          legend: {
            data: [
              this.$t('page.diagnostic.series_cpu'),
              this.$t('page.diagnostic.series_rss'),
              this.$t('page.diagnostic.series_goroutines'),
              this.$t('page.diagnostic.series_queue_log'),
            ],
          },
          grid: { left: 50, right: 60, top: 40, bottom: 30 },
          xAxis: { type: 'category', data: times },
          yAxis: [
            { type: 'value', name: 'CPU %', max: 100 },
            { type: 'value', name: '' },
          ],
          series: [
            { name: this.$t('page.diagnostic.series_cpu'), type: 'line', yAxisIndex: 0, showSymbol: false, data: points.map((p) => p.cpu_percent) },
            { name: this.$t('page.diagnostic.series_rss'), type: 'line', yAxisIndex: 1, showSymbol: false, data: points.map((p) => Math.round((p.rss_bytes || 0) / 1048576)) },
            { name: this.$t('page.diagnostic.series_goroutines'), type: 'line', yAxisIndex: 1, showSymbol: false, data: points.map((p) => p.goroutines) },
            { name: this.$t('page.diagnostic.series_queue_log'), type: 'line', yAxisIndex: 1, showSymbol: false, data: points.map((p) => p.queue_log) },
          ],
        });
        this.trendChart.resize();
      });
    },
    startCpuProfile() {
      this.cpuStarting = true;
      startCpuProfileApi()
        .then((res: any) => {
          if (res.code === 0) {
            this.$message.success(res.msg || 'OK');
            this.fetchCpuStatus();
          } else {
            this.$message.error(res.msg || this.$t('page.diagnostic.load_failed'));
          }
        })
        .catch(() => this.$message.error(this.$t('page.diagnostic.load_failed')))
        .finally(() => { this.cpuStarting = false; });
    },
    fetchCpuStatus() {
      getCpuProfileStatusApi()
        .then((res: any) => {
          if (res.code === 0) {
            this.cpuPollFailCount = 0;
            this.cpuStatus = res.data;
            if (res.data.running) {
              this.startCpuPolling();
            } else {
              this.stopCpuPolling();
            }
          }
        })
        .catch(() => {
          // 连续失败（网络断/已登出）就停掉轮询，避免定时器空转
          this.cpuPollFailCount += 1;
          if (this.cpuPollFailCount >= 5) {
            this.stopCpuPolling();
          }
        });
    },
    startCpuPolling() {
      if (this.cpuPollTimer) return;
      this.cpuPollTimer = setInterval(() => this.fetchCpuStatus(), 3000);
    },
    stopCpuPolling() {
      if (this.cpuPollTimer) {
        clearInterval(this.cpuPollTimer);
        this.cpuPollTimer = null;
      }
    },
    downloadPackage() {
      this.packageDownloading = true;
      downloadDiagPackageApi()
        .then(async (blob: any) => {
          if (!(blob instanceof Blob)) {
            this.$message.error(this.$t('page.diagnostic.load_failed'));
            return;
          }
          // 后端拒绝（鉴权失效/频控等）时返回的是 JSON 信封而非 zip，
          // blob 响应不会走全局拦截器的错误处理，这里必须自行识别
          if (blob.type && blob.type.indexOf('application/json') !== -1) {
            try {
              const body = JSON.parse(await blob.text());
              if (body.code === -999) {
                this.$router.replace({ path: '/login' });
                return;
              }
              this.$message.error(body.msg || this.$t('page.diagnostic.load_failed'));
            } catch (e) {
              this.$message.error(this.$t('page.diagnostic.load_failed'));
            }
            return;
          }
          const now = new Date();
          const pad = (n) => String(n).padStart(2, '0');
          const fileName = `samwaf_diag_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.zip`;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          this.$message.success(this.$t('page.diagnostic.download_ok'));
        })
        .catch(() => this.$message.error(this.$t('page.diagnostic.load_failed')))
        .finally(() => { this.packageDownloading = false; });
    },
    componentTitle(name) {
      const key = `page.diagnostic.comp_${name}`;
      const label = this.$t(key);
      return label === key ? name : label;
    },
    valueClass(compName, key, val) {
      if (compName === 'db_queue') {
        if (val > 5000) return 'val-danger';
        if (val > 500) return 'val-warn';
      }
      return '';
    },
    formatBytes(bytes) {
      if (!bytes || bytes <= 0) return '0 B';
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let idx = 0;
      let value = bytes;
      while (value >= 1024 && idx < units.length - 1) {
        value /= 1024;
        idx += 1;
      }
      return `${value.toFixed(1)} ${units[idx]}`;
    },
    formatDuration(seconds) {
      if (!seconds || seconds <= 0) return '-';
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      if (d > 0) return `${d}d ${h}h ${m}m`;
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m ${seconds % 60}s`;
    },
    formatTime(ts, short = false) {
      if (!ts) return '-';
      const date = new Date(ts * 1000);
      const pad = (n) => String(n).padStart(2, '0');
      const hm = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      if (short) return hm;
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${hm}`;
    },
  },
});
</script>

<style scoped>
.diagnostic-container {
  padding: 16px;
}

.card-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: stretch;
}

.diag-card {
  flex: 1;
  min-width: 300px;
}

.kv {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.k {
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.v {
  color: var(--td-text-color-secondary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.mono {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 400;
}

.val-warn {
  color: #ed7b2f;
  font-weight: 600;
}

.val-danger {
  color: #e34d59;
  font-weight: 600;
}

.sample-time {
  color: var(--td-text-color-placeholder);
  font-size: 12px;
  line-height: 32px;
}

.desc {
  color: var(--td-text-color-secondary);
  margin: 4px 0;
}

.empty-hint {
  color: var(--td-text-color-placeholder);
}
</style>
