<template>
  <t-dialog
    :visible="visible"
    :header="$t('page.ccrule.th_title')"
    :width="900"
    :footer="false"
    destroyOnClose
    @close="$emit('update:visible', false)"
  >
    <div v-if="loading" class="th-loading">{{ $t('page.ccrule.th_loading') }}</div>

    <!-- 算不出来：说清楚为什么，不给一个看起来很准的错数 -->
    <div v-else-if="data && !data.supported" class="th-blocked">
      <div class="th-reason">{{ data.reason }}</div>
      <div v-if="data.reference" class="th-ref">{{ data.reference }}</div>
      <div class="th-actions">
        <t-button variant="outline" @click="$emit('update:visible', false)">{{ $t('common.close') }}</t-button>
      </div>
    </div>

    <div v-else-if="data" class="th-body">
      <div class="th-meta">{{ metaText }}</div>
      <div class="th-summary" v-html="summaryHtml"></div>
      <div v-if="data.scope_note" class="th-note">{{ data.scope_note }}</div>
      <div v-if="data.sampled" class="th-note">{{ $t('page.ccrule.th_sampled', { days: data.days }) }}</div>

      <div class="th-stats">
        <div><div class="k">{{ $t('page.ccrule.th_p50') }}</div><div class="v">{{ data.p50 }}</div></div>
        <div><div class="k">P95</div><div class="v">{{ data.p95 }}</div></div>
        <div><div class="k">P99</div><div class="v">{{ data.p99 }}</div></div>
        <div><div class="k">{{ $t('page.ccrule.th_max') }}</div><div class="v">{{ data.max }}</div></div>
        <div><div class="k">{{ $t('page.ccrule.th_total_req') }}</div><div class="v">{{ data.total_req }}</div></div>
      </div>

      <div v-if="data.top && data.top.length" ref="wrap" class="th-chart-wrap">
        <div class="th-chart">
          <div
            v-for="(b, i) in data.top"
            :key="i"
            class="th-bar"
            :class="{ hit: b.peak > threshold }"
            :style="{ height: barHeight(b.peak) }"
            :title="b.dim_value + ' · ' + $t('page.ccrule.th_bar_tip', { peak: b.peak, total: b.total })"
          ></div>
        </div>
        <div
          class="th-line"
          :style="{ top: lineTop }"
          :data-v="threshold"
          @mousedown="startDrag"
        ></div>
        <div class="th-axis">
          <span>{{ $t('page.ccrule.th_axis_left') }}</span>
          <span>TOP {{ data.top.length }}</span>
        </div>
      </div>

      <div class="th-impact" v-html="impactHtml"></div>

      <div class="th-tiers">
        <div
          v-for="t in tiers"
          :key="t.key"
          class="th-tier"
          :class="{ on: threshold === t.value }"
          @click="threshold = t.value"
        >
          <div class="n">{{ t.name }}</div>
          <div class="v">{{ t.value }}</div>
          <div class="d">{{ t.desc }}</div>
        </div>
      </div>

      <div class="th-warn">{{ $t('page.ccrule.th_force_observe') }}</div>

      <div class="th-actions">
        <t-button variant="outline" @click="$emit('update:visible', false)">{{ $t('common.close') }}</t-button>
        <t-button theme="primary" style="margin-left: 10px" @click="apply">
          {{ $t('page.ccrule.th_apply', { n: threshold }) }}
        </t-button>
      </div>
    </div>
  </t-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { wafAntiCCRuleThresholdRecommendApi } from '@/apis/anticcrule';

const CHART_H = 180;
const BAR_MAX = 170;

export default Vue.extend({
  name: 'CcThresholdRecommend',
  props: {
    visible: { type: Boolean, default: false },
    // 与规则表单同一份口径：圈样本必须和这条规则运行时的口径一致
    params: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      loading: false,
      data: null,
      threshold: 0,
      dragging: false,
    };
  },
  computed: {
    maxPeak() {
      if (!this.data || !this.data.top || !this.data.top.length) return 1;
      return Math.max(1, this.data.top[0].peak);
    },
    lineTop() {
      const h = Math.round((this.threshold / this.maxPeak) * BAR_MAX);
      return `${16 + CHART_H - Math.min(BAR_MAX, Math.max(0, h))}px`;
    },
    tiers() {
      if (!this.data) return [];
      return [
        { key: 'loose', value: this.data.loose, name: this.$t('page.ccrule.th_loose'), desc: this.$t('page.ccrule.th_loose_desc') },
        { key: 'balanced', value: this.data.balanced, name: this.$t('page.ccrule.th_balanced'), desc: this.$t('page.ccrule.th_balanced_desc') },
        { key: 'strict', value: this.data.strict, name: this.$t('page.ccrule.th_strict'), desc: this.$t('page.ccrule.th_strict_desc') },
      ];
    },
    metaText() {
      if (!this.data) return '';
      return this.$t('page.ccrule.th_meta', { days: this.data.days, window: this.data.window_sec });
    },
    summaryHtml() {
      if (!this.data) return '';
      return this.$t('page.ccrule.th_summary', {
        window: this.data.window_sec,
        p99: `<b>${this.data.p99}</b>`,
        th: `<b>${this.threshold}</b>`,
      });
    },
    // 影响面只按返回的 TOP N 统计，措辞里写明「TOP N 里」，不把它说成全站精确值
    impactHtml() {
      if (!this.data || !this.data.top) return '';
      let hitDim = 0;
      let hitReq = 0;
      this.data.top.forEach((b) => {
        if (b.peak > this.threshold) {
          hitDim += 1;
          hitReq += b.total;
        }
      });
      return this.$t('page.ccrule.th_impact', {
        th: `<b>${this.threshold}</b>`,
        window: this.data.window_sec,
        n: this.data.top.length,
        dim: `<b>${hitDim}</b>`,
        req: `<b>${hitReq}</b>`,
      });
    },
  },
  watch: {
    visible(val) {
      if (val) this.load();
    },
  },
  methods: {
    load() {
      this.loading = true;
      this.data = null;
      wafAntiCCRuleThresholdRecommendApi(this.params).then((res) => {
        this.loading = false;
        if (res.code !== 0 || !res.data) {
          this.data = { supported: false, reason: (res && res.msg) || this.$t('page.ccrule.th_failed') };
          return;
        }
        this.data = res.data;
        this.threshold = res.data.balanced || 1;
      }).catch(() => {
        this.loading = false;
        this.data = { supported: false, reason: this.$t('page.ccrule.th_failed') };
      });
    },
    barHeight(peak) {
      return `${Math.max(2, Math.round((peak / this.maxPeak) * BAR_MAX))}px`;
    },
    startDrag(e) {
      this.dragging = true;
      e.preventDefault();
      window.addEventListener('mousemove', this.onDrag);
      window.addEventListener('mouseup', this.stopDrag);
    },
    onDrag(e) {
      if (!this.dragging || !this.$refs.wrap) return;
      const r = this.$refs.wrap.getBoundingClientRect();
      const y = e.clientY - r.top;
      const v = Math.round(((16 + CHART_H - y) / BAR_MAX) * this.maxPeak);
      this.threshold = Math.max(1, Math.min(this.maxPeak, v));
    },
    stopDrag() {
      this.dragging = false;
      window.removeEventListener('mousemove', this.onDrag);
      window.removeEventListener('mouseup', this.stopDrag);
    },
    apply() {
      this.$emit('apply', this.threshold);
      this.$emit('update:visible', false);
    },
  },
  beforeDestroy() {
    this.stopDrag();
  },
});
</script>

<style lang="less" scoped>
.th-loading {
  padding: 60px 0;
  text-align: center;
  color: var(--td-text-color-placeholder);
}

.th-blocked {
  padding: 10px 0;

  .th-reason {
    padding: 12px 14px;
    border-radius: var(--td-radius-default);
    background: var(--td-warning-color-1);
    color: var(--td-text-color-primary);
    line-height: 1.9;
  }

  .th-ref {
    margin-top: 12px;
    padding: 12px 14px;
    border-left: 3px solid var(--td-brand-color);
    background: var(--td-brand-color-1);
    line-height: 1.9;
  }
}

.th-meta {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  margin-bottom: 8px;
}

.th-summary {
  font-size: 14px;
  line-height: 1.9;
  margin-bottom: 12px;
}

.th-note {
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: var(--td-radius-default);
  background: var(--td-warning-color-1);
  color: var(--td-warning-color-7);
  font-size: 12px;
  line-height: 1.8;
}

.th-stats {
  display: flex;
  border: 1px solid var(--td-component-stroke);
  border-radius: var(--td-radius-default);
  margin-bottom: 16px;
  overflow: hidden;

  div {
    flex: 1;
    padding: 10px 12px;
    border-right: 1px solid var(--td-component-stroke);
  }

  div:last-child {
    border-right: 0;
  }

  .k {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
  }

  .v {
    font-size: 18px;
    font-weight: 600;
    margin-top: 2px;
  }
}

.th-chart-wrap {
  position: relative;
  border: 1px solid var(--td-component-stroke);
  border-radius: var(--td-radius-default);
  padding: 16px 16px 30px;
}

.th-chart {
  position: relative;
  height: 180px;
  display: flex;
  align-items: flex-end;
  gap: 3px;
}

.th-bar {
  flex: 1;
  background: var(--td-brand-color-2);
  border-radius: 2px 2px 0 0;
}

.th-bar.hit {
  background: var(--td-error-color-3);
}

.th-line {
  position: absolute;
  left: 16px;
  right: 16px;
  height: 0;
  border-top: 2px dashed var(--td-error-color);
  cursor: ns-resize;
  z-index: 5;
}

.th-line::after {
  content: attr(data-v);
  position: absolute;
  right: 0;
  top: -20px;
  background: var(--td-error-color);
  color: #fff;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 2px;
}

.th-axis {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 10px;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  display: flex;
  justify-content: space-between;
}

.th-impact {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: var(--td-radius-default);
  background: var(--td-warning-color-1);
  font-size: 13px;
  line-height: 1.8;
}

.th-tiers {
  display: flex;
  gap: 10px;
  margin: 16px 0 0;
}

.th-tier {
  flex: 1;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-default);
  padding: 12px;
  cursor: pointer;
  text-align: center;

  .n {
    font-size: 13px;
    color: var(--td-text-color-secondary);
  }

  .v {
    font-size: 22px;
    font-weight: 600;
    margin: 4px 0 2px;
  }

  .d {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
    line-height: 1.6;
  }
}

.th-tier.on {
  border-color: var(--td-brand-color);
  background: var(--td-brand-color-1);
}

.th-warn {
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: var(--td-radius-default);
  background: var(--td-warning-color-1);
  color: var(--td-text-color-primary);
  font-size: 13px;
  line-height: 1.8;
}

.th-actions {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}
</style>
