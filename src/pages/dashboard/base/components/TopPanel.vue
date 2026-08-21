<template>
  <div class="top-panel">
    <t-row :gutter="[16, 16]">
      <t-col :xs="6" :xl="3" v-for="(item, index) in panelList" :key="item.title">
        <div
          class="stat-card"
          :class="{ 'stat-card--primary': index === 0 }"
          role="button"
          tabindex="0"
          @click="jumpLog(index)"
          @keyup.enter="jumpLog(index)"
        >
          <div class="stat-card__head">
            <span class="stat-card__chip" :class="`stat-card__chip--${item.theme}`">
              <component :is="item.icon" class="stat-card__chip-icon" />
            </span>
            <!-- QPS 卡片右上角放实时趋势图，其余卡片放"较昨日同期"环比 -->
            <span v-if="item.spark" class="stat-card__spark" :title="qpsSparkTitle">
              <svg class="stat-card__spark-svg" viewBox="0 0 96 32" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="qpsSparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop class="stat-card__spark-stop--top" offset="0%" />
                    <stop class="stat-card__spark-stop--bottom" offset="100%" />
                  </linearGradient>
                </defs>
                <path class="stat-card__spark-area" :d="qpsAreaPath" />
                <polyline class="stat-card__spark-line" :points="qpsLinePoints" />
              </svg>
            </span>
            <span v-else class="stat-card__trend" :title="compareTip(item)">
              <span class="stat-card__trend-label">{{ $t('dashboard.counter.compare_same_period') }}</span>
              <trend
                v-if="hasTrendArrow(item)"
                :type="item.compare.Trend"
                :describe="percentText(item.compare)"
                :is-reverse-color="index === 0"
                :is-neutral-color="!!item.neutralTrend"
              />
              <span v-else class="stat-card__trend-flat">{{ flatText(item) }}</span>
            </span>
          </div>
          <div class="stat-card__body">
            <span class="stat-card__number">{{ formatNumber(item.displayNumber) }}</span>
          </div>
          <div class="stat-card__foot">
            <span class="stat-card__title">{{ item.title }}</span>
            <chevron-right-icon class="stat-card__arrow" />
          </div>
        </div>
      </t-col>
    </t-row>
  </div>
</template>
<script lang="ts">
import {
  ShieldErrorIcon,
  ViewListIcon,
  RadarIcon,
  ThunderIcon,
  ChevronRightIcon,
} from 'tdesign-icons-vue';
import { mapState } from 'vuex';

import Trend from '@/components/trend/index.vue';
import { wafstatsumdayapi, wafstatqpstrendapi } from '@/apis/stats';

export default {
  name: 'TopPanel',
  components: {
    Trend,
    ShieldErrorIcon,
    ViewListIcon,
    RadarIcon,
    ThunderIcon,
    ChevronRightIcon,
  },
  data() {
    return {
      panelList: [],
      animFrames: [] as number[],
      compareHours: 0,
      qpsPoints: [] as number[],
      qpsMax: 0,
      qpsTimer: 0,
    };
  },
  computed: {
    ...mapState('setting', ['brandTheme', 'mode']),
    // 采样点不足两个时补成一条水平线，避免图上什么都画不出来
    sparkValues() {
      return this.qpsPoints.length >= 2 ? this.qpsPoints : [0, 0];
    },
    sparkCoords() {
      const values = this.sparkValues;
      const w = 96;
      const h = 32;
      const pad = 3;
      const max = Math.max(...values, 1);
      const step = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
      return values.map((v, i) => ({
        x: pad + i * step,
        y: h - pad - (Math.max(Number(v) || 0, 0) / max) * (h - pad * 2),
      }));
    },
    qpsLinePoints() {
      return this.sparkCoords.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    },
    qpsAreaPath() {
      const coords = this.sparkCoords;
      if (!coords.length) return '';
      const bottom = 29; // 32 - pad
      const head = coords
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
        .join(' ');
      return `${head} L${coords[coords.length - 1].x.toFixed(2)},${bottom} L${coords[0].x.toFixed(2)},${bottom} Z`;
    },
    qpsSparkTitle() {
      const trend = this.$t('dashboard.counter.qps_trend', { seconds: this.qpsPoints.length });
      const peak = this.$t('dashboard.counter.qps_trend_peak', { max: this.qpsMax });
      return `${trend} · ${peak}`;
    },
  },
  created() {
    this.getWafStat();
  },
  mounted() {
    this.loadQpsTrend();
    this.qpsTimer = window.setInterval(this.loadQpsTrend, 5000);
  },
  beforeDestroy() {
    this.animFrames.forEach((id: number) => cancelAnimationFrame(id));
    if (this.qpsTimer) clearInterval(this.qpsTimer);
  },
  methods: {
    jumpLog(index) {
      // 三张卡片都必须带上显式 query：空 query 与"从菜单点进去"无法区分，
      // 会导致访问日志页沿用上次缓存的筛选条件（issue #893 问题2）
      const queryMap: Record<number, { action: string; src_ip: string }> = {
        0: { action: '阻止', src_ip: '' }, // 今日攻击数量
        1: { action: '', src_ip: '' }, // 今天总访问量
        2: { action: '禁止', src_ip: '' }, // 今天异常IP（个）
      };
      const query = queryMap[index];
      if (!query) return;
      this.$router
        .push({
          path: '/waf/wafvisitlog',
          query,
        })
        .catch((err) => {
          if (!err || err.name !== 'NavigationDuplicated') console.warn(err);
        });
    },
    getWafStat() {
      wafstatsumdayapi()
        .then((res) => {
          if (res.code === 0) {
            const d = res.data;
            const panels = [
              {
                title: this.$t('dashboard.counter.today_of_attack_count'),
                number: d.AttackCountOfToday,
                theme: 'danger',
                icon: 'ShieldErrorIcon',
                compare: d.AttackCompare,
              },
              {
                title: this.$t('dashboard.counter.all_visit_count'),
                number: d.VisitCountOfToday,
                theme: 'primary',
                icon: 'ViewListIcon',
                compare: d.VisitCompare,
                neutralTrend: true, // 访问量涨跌无好坏之分，不用红绿
              },
              {
                title: this.$t('dashboard.counter.not_normal_visit_count'),
                number: d.IllegalIpCountOfToday,
                theme: 'warning',
                icon: 'RadarIcon',
                compare: d.IllegalIpCompare,
              },
              {
                title: this.$t('dashboard.counter.qps'),
                number: d.CurrentQps,
                theme: 'success',
                icon: 'ThunderIcon',
                spark: true,
              },
            ];
            this.compareHours = d.CompareHours || 0;
            this.panelList = panels.map((p) => ({ ...p, displayNumber: 0 }));
            this.$nextTick(() => this.animateAll());
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => undefined);
    },
    animateAll() {
      this.panelList.forEach((item, index) => this.animateNumber(item, index * 90));
    },
    animateNumber(item, delay) {
      const end = Number(item.number) || 0;
      const duration = 900;
      let startTime: number | null = null;
      const tick = (now: number) => {
        if (startTime === null) startTime = now;
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - (1 - progress) ** 3;
        item.displayNumber = Math.round(end * eased);
        if (progress < 1) {
          this.animFrames.push(requestAnimationFrame(tick));
        } else {
          item.displayNumber = end;
        }
      };
      setTimeout(() => {
        this.animFrames.push(requestAnimationFrame(tick));
      }, delay);
    },
    hasTrendArrow(item) {
      return !!(item.compare && item.compare.HasCompare && item.compare.Trend !== 'flat');
    },
    percentText(compare) {
      return `${Math.abs(Number(compare.Percent) || 0)}%`;
    },
    flatText(item) {
      return item.compare && item.compare.HasCompare ? '0%' : '\u2014';
    },
    compareTip(item) {
      if (!item.compare || !item.compare.HasCompare) {
        return this.$t('dashboard.counter.compare_none_tip');
      }
      return this.$t('dashboard.counter.compare_tip', {
        hour: String(this.compareHours).padStart(2, '0'),
        current: item.compare.Current,
        previous: item.compare.Previous,
      });
    },
    loadQpsTrend() {
      if (typeof document !== 'undefined' && document.hidden) return;
      wafstatqpstrendapi({ limit: 60 })
        .then((res) => {
          if (res.code !== 0 || !res.data) return;
          this.qpsPoints = (res.data.Points || []).map((p) => Number(p.V) || 0);
          this.qpsMax = Number(res.data.Max) || 0;
          const card = this.panelList.find((p) => p.spark);
          if (card) {
            card.number = Number(res.data.Current) || 0;
            card.displayNumber = card.number;
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
    },
    formatNumber(val) {
      if (val === null || val === undefined || Number.isNaN(Number(val))) return '0';
      return Number(val).toLocaleString('en-US');
    },
  },
};
</script>

<style lang="less" scoped>
@import '@/style/variables.less';

.top-panel {
  /deep/ .t-row {
    row-gap: 16px;
  }
}

.stat-card {
  position: relative;
  height: 168px;
  padding: 20px 20px 14px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  border-radius: var(--td-radius-large);
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-stroke);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  cursor: pointer;
  transition:
    transform 0.24s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.24s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.24s cubic-bezier(0.4, 0, 0.2, 1);

  // 卡片角落装饰光斑
  &::after {
    content: '';
    position: absolute;
    right: -48px;
    bottom: -48px;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--td-brand-color-1) 0%, transparent 72%);
    opacity: 0;
    transition: opacity 0.24s;
    pointer-events: none;
  }

  &:hover::after {
    opacity: 1;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    transition: transform 0.24s cubic-bezier(0.4, 0, 0.2, 1);

    &--danger {
      background: var(--td-error-color-1);
      color: var(--td-error-color);
    }

    &--primary {
      background: var(--td-brand-color-1);
      color: var(--td-brand-color);
    }

    &--warning {
      background: var(--td-warning-color-1);
      color: var(--td-warning-color);
    }

    &--success {
      background: var(--td-success-color-1);
      color: var(--td-success-color);
    }

    .stat-card__chip-icon {
      font-size: 22px;
    }
  }

  &__trend {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  &__trend-label {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
  }

  &__trend-flat {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
    font-variant-numeric: tabular-nums;
  }

  &__spark {
    display: inline-flex;
    align-items: center;
  }

  &__spark-svg {
    width: 96px;
    height: 32px;
  }

  &__spark-stop--top {
    stop-color: var(--td-success-color);
    stop-opacity: 0.32;
  }

  &__spark-stop--bottom {
    stop-color: var(--td-success-color);
    stop-opacity: 0;
  }

  &__spark-area {
    fill: url(#qpsSparkFill);
  }

  &__spark-line {
    fill: none;
    stroke: var(--td-success-color);
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &__number {
    display: inline-block;
    font-size: 30px;
    line-height: 1;
    font-weight: 600;
    font-family: var(--td-font-family-medium);
    color: var(--td-text-color-primary);
    font-variant-numeric: tabular-nums;
  }

  &__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    font-size: 14px;
    color: var(--td-text-color-secondary);
  }

  &__arrow {
    color: var(--td-text-color-placeholder);
    transition:
      transform 0.24s cubic-bezier(0.4, 0, 0.2, 1),
      color 0.24s cubic-bezier(0.4, 0, 0.2, 1);
  }

  // 首个指标卡片使用品牌色渐变背景
  &--primary {
    background: linear-gradient(135deg, var(--td-brand-color) 0%, var(--td-brand-color-7) 100%);
    border: none;
    box-shadow: 0 8px 20px -8px var(--td-brand-color-4);

    &::after {
      background: radial-gradient(circle, rgba(255, 255, 255, 0.35) 0%, transparent 72%);
    }

    .stat-card__trend-label,
    .stat-card__trend-flat,
    .stat-card__number,
    .stat-card__title {
      color: var(--td-text-color-anti);
    }

    .stat-card__arrow {
      color: rgba(255, 255, 255, 0.75);
    }

    .stat-card__chip {
      background: rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #fff;
    }
  }
}
</style>
