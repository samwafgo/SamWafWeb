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
            <span class="stat-card__trend">
              <span class="stat-card__trend-label">{{ $t('dashboard.counter.compare') }}</span>
              <trend type="up" describe="0%" :is-reverse-color="index === 0" />
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
import { wafstatsumdayapi } from '@/apis/stats';

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
    };
  },
  computed: {
    ...mapState('setting', ['brandTheme', 'mode']),
  },
  created() {
    this.getWafStat();
  },
  beforeDestroy() {
    this.animFrames.forEach((id: number) => cancelAnimationFrame(id));
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
              },
              {
                title: this.$t('dashboard.counter.all_visit_count'),
                number: d.VisitCountOfToday,
                theme: 'primary',
                icon: 'ViewListIcon',
              },
              {
                title: this.$t('dashboard.counter.not_normal_visit_count'),
                number: d.IllegalIpCountOfToday,
                theme: 'warning',
                icon: 'RadarIcon',
              },
              {
                title: this.$t('dashboard.counter.qps'),
                number: d.CurrentQps,
                theme: 'success',
                icon: 'ThunderIcon',
              },
            ];
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

  &:hover,
  &:focus-visible {
    transform: translateY(-4px);
    border-color: var(--td-brand-color-3);
    box-shadow: 0 12px 28px -8px rgba(0, 0, 0, 0.16);
    outline: none;
  }

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

  &:hover .stat-card__chip {
    transform: scale(1.06);
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

  &:hover .stat-card__arrow {
    transform: translateX(2px);
    color: var(--td-brand-color);
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
