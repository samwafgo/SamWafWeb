<template>
  <div class="site-trend">
    <t-tooltip v-if="hasData" :content="tip" placement="top">
      <svg class="st-svg" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
        <polyline class="st-line st-line--atk" :points="atkPoints" />
        <polyline class="st-line st-line--pv" :points="pvPoints" />
      </svg>
    </t-tooltip>
    <span v-else class="st-empty">—</span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { wafstatsitedetailapi } from '@/apis/stats';

// 会话级缓存：同一站点短时间内只请求一次，翻页 / 重渲染不重复打后端。
// 必须带过期时间：24h 趋势随时间滚动，会话内永久缓存会和其他「今日」数据对不上。
const TREND_CACHE_TTL = 5 * 60 * 1000;
const trendCache: Record<string, { at: number; data: any[] }> = {};

export default Vue.extend({
  name: 'SiteTrend',
  props: {
    hostCode: { type: String, default: '' },
  },
  data() {
    return {
      series: [] as any[],
    };
  },
  computed: {
    hasData(): boolean {
      return this.series.length > 1;
    },
    maxVal(): number {
      let m = 1;
      this.series.forEach((p) => { m = Math.max(m, p.total, p.attack); });
      return m;
    },
    pvPoints(): string { return this.buildPoints('total'); },
    atkPoints(): string { return this.buildPoints('attack'); },
    tip(): string {
      if (!this.hasData) return '';
      return `24h · PV ${this.series.reduce((a, b) => a + b.total, 0)} · 拦截 ${this.series.reduce((a, b) => a + b.attack, 0)}`;
    },
  },
  watch: {
    hostCode() { this.load(); },
  },
  mounted() { this.load(); },
  methods: {
    load() {
      const code = this.hostCode;
      this.series = [];
      if (!code) return;
      const hit = trendCache[code];
      if (hit && Date.now() - hit.at < TREND_CACHE_TTL) {
        this.series = hit.data;
        return;
      }
      wafstatsitedetailapi({ host_code: code, time_range: '24h' })
        .then((res) => {
          if (res && res.code === 0 && res.data) {
            const pts = (res.data.hour_trend || []).map((p) => ({
              total: Number(p.total_count) || 0,
              attack: Number(p.attack_count) || 0,
            }));
            trendCache[code] = { at: Date.now(), data: pts };
            this.series = pts;
          }
        })
        .catch((e: Error) => { console.log(e); });
    },
    buildPoints(key: string): string {
      const n = this.series.length;
      if (n < 2) return '';
      const max = this.maxVal;
      const h = 24;
      const pad = 2;
      return this.series
        .map((p, i) => {
          const x = (i / (n - 1)) * 100;
          const y = h - pad - ((p[key] || 0) / max) * (h - pad * 2);
          return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');
    },
  },
});
</script>

<style lang="less" scoped>
.site-trend {
  width: 100%;
  height: 26px;
}

.st-svg {
  display: block;
  width: 100%;
  height: 26px;
}

.st-line {
  fill: none;
  stroke-linejoin: round;
  stroke-linecap: round;
  /* viewBox 被横向拉伸，保持描边不跟着变形 */
  vector-effect: non-scaling-stroke;
}

.st-line--pv {
  stroke: var(--td-brand-color);
  stroke-width: 1.4;
}

.st-line--atk {
  stroke: var(--td-error-color);
  stroke-width: 1.2;
  opacity: 0.85;
}

.st-empty {
  display: inline-block;
  color: var(--td-text-color-placeholder);
  font-size: 11px;
  line-height: 26px;
}
</style>
