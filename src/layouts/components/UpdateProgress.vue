<template>
  <div>
    <t-dialog
      width="680px"
      :visible.sync="visible"
      :header="dialogTitle"
      :close-on-overlay-click="false"
      :confirm-btn="null"
      :cancel-btn="null"
      @close="onDialogClose"
    >
      <!-- 进度头 -->
      <div class="upg-head">
        <span class="upg-pct">{{ percent }}%</span>
        <span class="upg-ver">{{ snap.from_version }} → {{ snap.to_version }}</span>
        <t-tag v-if="snap.channel === 'github'" theme="danger" variant="light" size="small">beta</t-tag>
        <span class="upg-elapsed">{{ $t('topNav.update.progress.elapsed', { t: elapsedText }) }}</span>
      </div>

      <t-progress
        :percentage="percent"
        :theme="'line'"
        :status="progressStatus"
        :label="false"
      />

      <div class="upg-meta">
        <span>{{ currentText }}</span>
        <span class="upg-meta-r">{{ rateText }}</span>
      </div>

      <!-- 阶段清单 -->
      <ul class="upg-steps">
        <li v-for="s in snap.stages" :key="s.key" :class="stageCls(s)">
          <span class="ic"></span>
          <span class="nm">{{ $t('topNav.update.progress.stage.' + s.key) }}</span>
          <span class="dt">{{ s.detail }}</span>
          <span class="tm">{{ costText(s) }}</span>
        </li>
      </ul>

      <!-- 失败 -->
      <t-alert v-if="phase === 'failed'" theme="error" style="margin-top:14px">
        <template #message>
          <div>{{ failMessage }}</div>
          <div style="margin-top:4px">{{ failSafeTip }}</div>
        </template>
      </t-alert>

      <!-- 取消 -->
      <t-alert v-if="phase === 'canceled'" theme="warning" style="margin-top:14px">
        <template #message>
          {{ $t('topNav.update.progress.canceled_msg', { v: snap.from_version }) }}
        </template>
      </t-alert>

      <!-- 重启超时 -->
      <t-alert v-if="phase === 'timeout'" theme="warning" style="margin-top:14px">
        <template #message>
          <div>{{ $t('topNav.update.progress.timeout_tips', { n: restartTimeout, v: snap.from_version }) }}</div>
        </template>
      </t-alert>

      <!-- 成功 -->
      <t-alert v-if="phase === 'success'" theme="success" style="margin-top:14px">
        <template #message>
          {{ $t('topNav.update.progress.success_msg', { v: snap.to_version }) }}
        </template>
      </t-alert>

      <!-- 底部操作 -->
      <div class="upg-foot">
        <span class="upg-foot-hint">{{ footHint }}</span>
        <template v-if="phase === 'progress' || phase === 'restart'">
          <t-button size="small" variant="outline" @click="minimize">
            {{ $t('topNav.update.progress.background_run') }}
          </t-button>
          <t-button size="small" variant="outline" :disabled="!canCancel" @click="handleCancel">
            {{ $t('topNav.update.progress.cancel') }}
          </t-button>
        </template>
        <template v-else-if="phase === 'success'">
          <t-button size="small" theme="primary" @click="reloadPage">
            {{ $t('topNav.update.progress.refresh') }}
          </t-button>
          <t-button size="small" variant="outline" @click="close">
            {{ $t('topNav.update.progress.later') }}
          </t-button>
        </template>
        <template v-else-if="phase === 'timeout'">
          <t-button size="small" variant="outline" @click="keepWaiting">
            {{ $t('topNav.update.progress.keep_waiting') }}
          </t-button>
          <t-button size="small" variant="outline" @click="$emit('open-rollback')">
            {{ $t('topNav.update.progress.rollback_entry') }}
          </t-button>
          <t-button size="small" variant="outline" @click="close">
            {{ $t('topNav.update.progress.close') }}
          </t-button>
        </template>
        <template v-else>
          <t-button size="small" theme="primary" @click="handleRetry">
            {{ $t('topNav.update.progress.retry') }}
          </t-button>
          <t-button size="small" variant="outline" @click="copyError">
            {{ $t('topNav.update.progress.copy_error') }}
          </t-button>
          <t-button size="small" variant="outline" @click="close">
            {{ $t('topNav.update.progress.close') }}
          </t-button>
        </template>
      </div>
    </t-dialog>

    <!-- 后台运行时的悬浮球：升级不中断，点击还原 -->
    <div v-if="minimized" class="upg-pill" @click="restore">
      <span class="ring" :style="ringStyle"><i>{{ percent }}%</i></span>
      <span class="txt">
        {{ $t('topNav.update.progress.pill_title', { v: snap.to_version }) }}
        <em>{{ pillStage }}</em>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { GetUpdateProgressApi, CancelUpdateApi, SysVersionApi } from '@/apis/sysinfo';

const PROGRESS_POLL_MS = 1000; // 升级中拉进度
const VERSION_POLL_MS = 2000; // 重启后探测服务是否就绪

function emptySnap() {
  return {
    state: 'idle',
    stage: '',
    percent: 0,
    downloaded: 0,
    total: 0,
    speed: 0,
    from_version: '',
    to_version: '',
    channel: '',
    started_at: 0,
    error: '',
    error_stage: '',
    stages: [],
  };
}

export default Vue.extend({
  name: 'UpdateProgress',
  data() {
    return {
      visible: false,
      minimized: false,
      // progress: 升级中 | restart: 等待重启就绪 | success | failed | canceled | timeout
      phase: 'progress',
      snap: emptySnap(),
      restartTimeout: 90, // 由后端 config.yml 的 update_restart_timeout 下发，前端不写死
      restartWaited: 0,
      restartProbes: 0,
      elapsed: 0,
      pollTimer: null,
      tickTimer: null,
    };
  },
  computed: {
    percent(): number {
      if (this.phase === 'success') return 100;
      return this.snap.percent || 0;
    },
    dialogTitle(): string {
      const map = {
        progress: 'title_running',
        restart: 'title_restarting',
        success: 'title_success',
        failed: 'title_failed',
        canceled: 'title_canceled',
        timeout: 'title_restarting',
      };
      return this.$t(`topNav.update.progress.${map[this.phase] || 'title_running'}`) as string;
    },
    progressStatus(): string {
      if (this.phase === 'success') return 'success';
      if (this.phase === 'failed' || this.phase === 'timeout') return 'error';
      if (this.phase === 'canceled') return 'warning';
      return 'active';
    },
    canCancel(): boolean {
      // 只有下载阶段可取消：进入替换后中断反而危险
      return this.phase === 'progress' && this.snap.state === 'running' && this.snap.stage === 'download';
    },
    currentText(): string {
      if (this.phase === 'restart') {
        return this.$t('topNav.update.progress.restarting_probe', { n: this.restartProbes }) as string;
      }
      if (this.phase === 'success') {
        return this.$t('topNav.update.progress.success_short', { v: this.snap.to_version }) as string;
      }
      if (!this.snap.stage) return '';
      const name = this.$t(`topNav.update.progress.stage.${this.snap.stage}`) as string;
      if (this.phase === 'failed') {
        return `${name} · ${this.$t('topNav.update.progress.interrupted')}`;
      }
      if (this.snap.stage === 'download' && this.snap.total > 0) {
        const pct = Math.round((this.snap.downloaded / this.snap.total) * 100);
        return `${name} · ${pct}%`;
      }
      return name;
    },
    rateText(): string {
      if (this.phase === 'restart') {
        return this.$t('topNav.update.progress.waited', { n: this.restartWaited }) as string;
      }
      if (this.snap.stage !== 'download' || !this.snap.downloaded) return '';
      const parts = [this.snap.total > 0
        ? `${this.mb(this.snap.downloaded)} / ${this.mb(this.snap.total)}`
        : this.mb(this.snap.downloaded)];
      if (this.snap.speed > 0) {
        parts.push(`${this.mb(this.snap.speed)}/s`);
        if (this.snap.total > 0) {
          const left = Math.max(0, Math.ceil((this.snap.total - this.snap.downloaded) / this.snap.speed));
          parts.push(this.$t('topNav.update.progress.eta', { n: left }) as string);
        }
      }
      return parts.join(' · ');
    },
    elapsedText(): string {
      const s = this.elapsed;
      const m = Math.floor(s / 60);
      return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    },
    footHint(): string {
      if (this.phase === 'restart') return this.$t('topNav.update.progress.restart_hint') as string;
      if (this.phase === 'progress') return this.$t('topNav.update.progress.foot_hint') as string;
      return '';
    },
    failMessage(): string {
      const stage = this.snap.error_stage || this.snap.stage;
      const tip = this.$t(`topNav.update.progress.fail.${stage}`) as string;
      const desc = tip && tip.indexOf('topNav.') === -1 ? tip : (this.$t('topNav.update.progress.fail.generic') as string);
      return this.snap.error ? `${desc}（${this.snap.error}）` : desc;
    },
    failSafeTip(): string {
      // 只有替换阶段失败才涉及"程序文件动过没有"，其余阶段一律未改动
      if (this.snap.error_stage === 'replace') {
        return this.$t('topNav.update.progress.fail_replace_tip') as string;
      }
      return this.$t('topNav.update.progress.fail_safe', { v: this.snap.from_version }) as string;
    },
    pillStage(): string {
      if (this.phase === 'restart') return this.$t('topNav.update.progress.title_restarting') as string;
      if (this.phase === 'success') return this.$t('topNav.update.progress.title_success') as string;
      if (this.phase === 'failed') return this.$t('topNav.update.progress.title_failed') as string;
      return this.snap.stage ? (this.$t(`topNav.update.progress.stage.${this.snap.stage}`) as string) : '';
    },
    ringStyle(): Record<string, string> {
      const deg = this.percent * 3.6;
      return { background: `conic-gradient(var(--td-brand-color, #0052D9) ${deg}deg, #EBEDF0 0deg)` };
    },
  },
  beforeDestroy() {
    this.stopTimers();
  },
  methods: {
    mb(n: number): string {
      return `${(n / 1048576).toFixed(1)} MB`;
    },
    costText(s: any): string {
      if (!s.cost_ms) return '';
      return `${(s.cost_ms / 1000).toFixed(1)}s`;
    },
    stageCls(s: any): string {
      return `st-${s.state}`;
    },
    // 用户点了「确认更新」之后由 Header 调用
    start() {
      this.snap = emptySnap();
      this.phase = 'progress';
      this.elapsed = 0;
      this.restartWaited = 0;
      this.restartProbes = 0;
      this.minimized = false;
      this.visible = true;
      this.startPolling();
    },
    // 刷新页面 / 切换标签后恢复现场：升级中就直接以悬浮球续显
    resume() {
      GetUpdateProgressApi().then((res: any) => {
        if (res.code !== 0 || !res.data) return;
        const st = res.data.state;
        if (st !== 'running' && st !== 'restarting') return;
        this.applySnap(res.data);
        this.phase = st === 'restarting' ? 'restart' : 'progress';
        this.minimized = true;
        this.visible = false;
        if (this.phase === 'restart') this.startVersionPolling();
        else this.startPolling();
      }).catch(() => {});
    },
    startTick() {
      if (this.tickTimer) return;
      this.tickTimer = setInterval(() => {
        if (this.phase === 'progress' || this.phase === 'restart') {
          this.elapsed += 1;
          if (this.phase === 'restart') this.restartWaited += 1;
        }
      }, 1000);
    },
    startPolling() {
      this.stopPoll();
      this.startTick();
      this.fetchProgress();
      this.pollTimer = setInterval(() => this.fetchProgress(), PROGRESS_POLL_MS);
    },
    fetchProgress() {
      GetUpdateProgressApi().then((res: any) => {
        if (res.code !== 0 || !res.data) return;
        this.applySnap(res.data);
        switch (res.data.state) {
          case 'restarting':
            // 二进制已替换，接下来服务会重启：进度接口马上就会不可用，转去探测版本号
            this.phase = 'restart';
            this.startVersionPolling();
            break;
          case 'failed':
            this.phase = 'failed';
            this.onSettled();
            break;
          case 'canceled':
            this.phase = 'canceled';
            this.onSettled();
            break;
          default:
            break;
        }
      }).catch(() => {
        // 升级中接口不通，多半是已经开始重启了；转为探测版本号，别把用户晾在原地
        if (this.phase === 'progress' && this.snap.state === 'running') {
          this.phase = 'restart';
          this.startVersionPolling();
        }
      });
    },
    applySnap(data: any) {
      this.snap = data;
      if (data.restart_timeout > 0) this.restartTimeout = data.restart_timeout;
      if (data.started_at > 0) {
        const diff = Math.floor(Date.now() / 1000) - data.started_at;
        if (diff >= 0) this.elapsed = diff;
      }
    },
    startVersionPolling() {
      this.stopPoll();
      this.startTick();
      this.pollTimer = setInterval(() => this.probeVersion(), VERSION_POLL_MS);
    },
    probeVersion() {
      if (this.restartWaited >= this.restartTimeout) {
        this.phase = 'timeout';
        this.onSettled();
        return;
      }
      this.restartProbes += 1;
      SysVersionApi(undefined).then((res: any) => {
        if (res.code !== 0 || !res.data) return;
        // 判据是版本号确实变成了目标版本：旧进程还没退干净时接口也可能是通的
        const target = this.snap.to_version;
        const now = res.data.version;
        if (target && now && now === target) {
          this.phase = 'success';
          this.onSettled();
        }
      }).catch(() => {
        // 重启窗口内请求失败是预期内的，继续等
      });
    },
    onSettled() {
      this.stopTimers();
      // 终态时如果还收在悬浮球里，弹回来让用户看到结果
      if (this.minimized) {
        this.minimized = false;
        this.visible = true;
      }
    },
    stopPoll() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    },
    stopTimers() {
      this.stopPoll();
      if (this.tickTimer) {
        clearInterval(this.tickTimer);
        this.tickTimer = null;
      }
    },
    minimize() {
      this.minimized = true;
      this.visible = false;
    },
    restore() {
      this.minimized = false;
      this.visible = true;
    },
    onDialogClose() {
      // 升级还在跑时关闭弹窗 = 后台运行，绝不中断升级
      if (this.phase === 'progress' || this.phase === 'restart') {
        this.minimized = true;
      } else {
        this.stopTimers();
      }
    },
    close() {
      this.visible = false;
      this.minimized = false;
      this.stopTimers();
    },
    keepWaiting() {
      this.restartWaited = 0;
      this.phase = 'restart';
      this.startVersionPolling();
    },
    handleCancel() {
      CancelUpdateApi().then((res: any) => {
        if (res.code === 0) {
          this.$message.success(res.msg);
        } else {
          this.$message.warning(res.msg);
        }
      }).catch(() => {});
    },
    handleRetry() {
      this.close();
      this.$emit('retry');
    },
    copyError() {
      const text = [
        `stage: ${this.snap.error_stage || this.snap.stage}`,
        `error: ${this.snap.error}`,
        `version: ${this.snap.from_version} -> ${this.snap.to_version}`,
        `channel: ${this.snap.channel}`,
      ].join('\n');
      const done = () => this.$message.success(this.$t('topNav.update.progress.copied'));
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => {});
        return;
      }
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      done();
    },
    reloadPage() {
      window.location.reload();
    },
  },
});
</script>

<style lang="less">
.upg-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;

  .upg-pct { font-size: 22px; font-weight: 600; }
  .upg-ver { font-size: 14px; }
  .upg-elapsed { margin-left: auto; font-size: 12px; color: rgba(0, 0, 0, .4); }
}

.upg-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: rgba(0, 0, 0, .6);
  margin-top: 7px;
  flex-wrap: wrap;

  .upg-meta-r { color: rgba(0, 0, 0, .4); }
}

.upg-steps {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;

  li {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding: 5px 0;
    font-size: 13px;
    color: rgba(0, 0, 0, .4);

    .ic {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      flex: none;
      border: 1px solid #dcdcdc;
      margin-top: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #fff;
      background: #fff;
    }

    .nm { flex: none; min-width: 132px; }
    .dt { flex: 1; min-width: 0; font-size: 12px; word-break: break-all; }
    .tm { flex: none; font-size: 12px; }

    &.st-done { color: rgba(0, 0, 0, .6); }
    &.st-done .ic { background: #2ba471; border-color: #2ba471; }
    &.st-done .ic::after { content: "✓"; }

    &.st-skipped .ic { background: #c5c5c5; border-color: #c5c5c5; }
    &.st-skipped .ic::after { content: "–"; }

    &.st-warn { color: #e37318; }
    &.st-warn .ic { background: #e37318; border-color: #e37318; }
    &.st-warn .ic::after { content: "!"; }

    &.st-running { color: rgba(0, 0, 0, .9); font-weight: 500; }
    &.st-running .ic {
      border-color: var(--td-brand-color, #0052D9);
      border-top-color: transparent;
      animation: upg-spin .7s linear infinite;
    }

    &.st-failed { color: #d54941; }
    &.st-failed .ic { background: #d54941; border-color: #d54941; }
    &.st-failed .ic::after { content: "!"; }
  }
}

@keyframes upg-spin { to { transform: rotate(360deg); } }

.upg-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e7e7e7;

  .upg-foot-hint {
    margin-right: auto;
    font-size: 12px;
    color: rgba(0, 0, 0, .4);
    line-height: 1.6;
  }
}

.upg-pill {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 3000;
  background: #fff;
  border: 1px solid #e7e7e7;
  box-shadow: 0 6px 20px rgba(0, 0, 0, .14);
  border-radius: 24px;
  padding: 8px 16px 8px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 13px;

  .ring {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    flex: none;

    i {
      display: block;
      width: 20px;
      height: 20px;
      background: #fff;
      border-radius: 50%;
      margin: 3px;
      font-style: normal;
      font-size: 9px;
      line-height: 20px;
      text-align: center;
      color: rgba(0, 0, 0, .6);
    }
  }

  .txt em {
    display: block;
    font-style: normal;
    font-size: 11px;
    color: rgba(0, 0, 0, .4);
  }
}
</style>
