<template>
  <div class="overview-container">
    <!-- 状态卡片行 -->
    <t-row :gutter="16" class="stat-row">
      <t-col :span="2">
        <t-card size="small">
          <div class="stat-card">
            <div class="stat-label">{{ $t('page.hostguard.stat_running') }}</div>
            <div class="stat-value" :class="status.running ? 'stat-active' : 'stat-inactive'">
              {{ status.running ? $t('page.hostguard.running_yes') : $t('page.hostguard.running_no') }}
            </div>
            <div class="stat-hint">{{ modeText }}</div>
          </div>
        </t-card>
      </t-col>
      <t-col :span="2">
        <t-card size="small">
          <div class="stat-card">
            <div class="stat-label">{{ $t('page.hostguard.stat_active_bans') }}</div>
            <div class="stat-value stat-warn">{{ stat.active_bans || 0 }}</div>
            <div class="stat-hint">
              {{ $t('page.hostguard.stat_permanent_bans') }}: {{ stat.permanent_bans || 0 }}
            </div>
          </div>
        </t-card>
      </t-col>
      <t-col :span="2">
        <t-card size="small">
          <div class="stat-card">
            <div class="stat-label">{{ $t('page.hostguard.stat_events_24h') }}</div>
            <div class="stat-value">{{ stat.events_24h || 0 }}</div>
            <div class="stat-hint">{{ $t('page.hostguard.stat_total_parsed') }}: {{ status.total_parsed || 0 }}</div>
          </div>
        </t-card>
      </t-col>
      <t-col :span="2">
        <t-card size="small" class="stat-card-clickable" @click.native="$emit('go-tab', 'offender')">
          <div class="stat-card">
            <div class="stat-label">
              {{ $t('page.hostguard.stat_offenders') }} <t-icon name="chevron-right" />
            </div>
            <div class="stat-value stat-sub">{{ stat.offender_count || 0 }}</div>
            <div class="stat-hint">{{ $t('page.hostguard.stat_total_bans') }}: {{ stat.total_bans || 0 }}</div>
          </div>
        </t-card>
      </t-col>
      <t-col :span="2">
        <t-card size="small">
          <div class="stat-card">
            <div class="stat-label">{{ $t('page.hostguard.stat_dropped') }}</div>
            <div class="stat-value" :class="status.dropped > 0 ? 'stat-expired' : ''">{{ status.dropped || 0 }}</div>
            <div class="stat-hint">{{ $t('page.hostguard.stat_dropped_hint') }}</div>
          </div>
        </t-card>
      </t-col>
      <t-col :span="2">
        <t-card size="small">
          <div class="stat-card">
            <div class="stat-label">{{ $t('page.hostguard.stat_last_event') }}</div>
            <div class="stat-value stat-small">{{ lastEventText }}</div>
            <div class="stat-hint">{{ $t('page.hostguard.stat_exec_mode') }}: {{ status.exec_mode || '-' }}</div>
          </div>
        </t-card>
      </t-col>
    </t-row>

    <!-- 事件源与端口 -->
    <t-card size="small" class="source-card">
      <div class="source-line">
        <span class="source-label">{{ $t('page.hostguard.source_title') }}</span>
        <t-tag v-for="(s, idx) in status.sources || []" :key="idx" theme="primary" variant="light" class="source-tag">
          {{ s }}
        </t-tag>
        <span v-if="!(status.sources || []).length" class="source-empty">{{ $t('page.hostguard.source_none') }}</span>
      </div>
      <div class="source-line">
        <span class="source-label">{{ $t('page.hostguard.detected_ports') }}</span>
        <t-tag theme="success" variant="light" class="source-tag">SSH: {{ (status.ssh_ports || []).join(', ') || '-' }}</t-tag>
        <t-tag theme="success" variant="light" class="source-tag">RDP: {{ (status.rdp_ports || []).join(', ') || '-' }}</t-tag>
        <span class="source-hint">{{ $t('page.hostguard.detected_ports_hint') }}</span>
      </div>
    </t-card>

    <t-row :gutter="16">
      <t-col :span="8">
        <t-card :title="$t('page.hostguard.chart_trend')" :bordered="false" class="chart-card">
          <div ref="trendChart" style="height: 300px"></div>
        </t-card>
      </t-col>
      <t-col :span="4">
        <t-card :title="$t('page.hostguard.chart_source')" :bordered="false" class="chart-card">
          <div ref="sourceChart" style="height: 300px"></div>
        </t-card>
      </t-col>
    </t-row>

    <t-card :title="$t('page.hostguard.top_sources')" :bordered="false" class="top-card">
      <t-table
        :columns="topColumns"
        :data="stat.top_sources || []"
        rowKey="name"
        :loading="loading"
        size="small"
        :hover="true"
      >
        <template #level="{ row }">
          <t-tag v-if="row.level > 0" theme="warning" variant="light">{{ $t('page.hostguard.level_n', { n: row.level }) }}</t-tag>
          <span v-else>-</span>
        </template>
      </t-table>
    </t-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as echarts from 'echarts/core';
import { PieChart, LineChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { wafHostGuardStatisticsApi } from '@/apis/hostguard';
import { fmtUnix } from '../utils';

echarts.use([PieChart, LineChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

export default Vue.extend({
  name: 'HostGuardOverviewPanel',
  data() {
    return {
      loading: false,
      stat: {} as any,
      status: {} as any,
      charts: { trend: null, source: null } as any,
      topColumns: [
        { title: this.$t('page.hostguard.col_ip'), colKey: 'name', width: 160, ellipsis: true },
        { title: this.$t('page.hostguard.col_location'), colKey: 'location', width: 180, ellipsis: true },
        { title: this.$t('page.hostguard.col_ban_count'), colKey: 'count', width: 100 },
        { title: this.$t('page.hostguard.col_level'), colKey: 'level', width: 100 },
      ],
    };
  },
  computed: {
    modeText(): string {
      return this.status.mode === 'block'
        ? this.$t('page.hostguard.mode_block')
        : this.$t('page.hostguard.mode_observe');
    },
    lastEventText(): string {
      return fmtUnix(this.status.last_event_at);
    },
  },
  mounted() {
    this.refresh();
    window.addEventListener('resize', this.resizeCharts);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeCharts);
    Object.values(this.charts).forEach((c: any) => c && c.dispose());
  },
  methods: {
    refresh() {
      this.loading = true;
      wafHostGuardStatisticsApi({})
        .then((res) => {
          if (res.code === 0 && res.data) {
            this.stat = res.data;
            this.status = res.data.status || {};
            this.$nextTick(this.renderCharts);
          }
        })
        .catch(() => {})
        .finally(() => {
          this.loading = false;
        });
    },
    initChart(refName, key) {
      const dom = this.$refs[refName];
      if (!dom) return null;
      if (!this.charts[key]) {
        this.charts[key] = echarts.init(dom);
      }
      return this.charts[key];
    },
    renderCharts() {
      this.renderTrend();
      this.renderSource();
      // tab 里的图表首次渲染时容器宽度可能还是 0，补一次 resize
      this.$nextTick(this.resizeCharts);
    },
    renderTrend() {
      const c = this.initChart('trendChart', 'trend');
      if (!c) return;
      const trend = this.stat.hourly_trend || [];
      c.setOption(
        {
          tooltip: { trigger: 'axis' },
          grid: { left: '6%', right: '4%', bottom: '12%', top: '10%' },
          xAxis: {
            type: 'category',
            // 只显示小时，完整时间在 tooltip 里
            data: trend.map((x) => String(x.hour || '').slice(11, 16)),
            axisLabel: { interval: 2 },
          },
          yAxis: { type: 'value', minInterval: 1 },
          series: [
            {
              name: this.$t('page.hostguard.chart_trend'),
              type: 'line',
              smooth: true,
              areaStyle: { opacity: 0.15 },
              data: trend.map((x) => x.count || 0),
              itemStyle: { color: '#e37318' },
            },
          ],
        },
        true,
      );
    },
    renderSource() {
      const c = this.initChart('sourceChart', 'source');
      if (!c) return;
      const items = this.stat.source_breakout || [];
      c.setOption(
        {
          tooltip: { trigger: 'item' },
          legend: { bottom: 0 },
          series: [
            {
              type: 'pie',
              radius: ['40%', '65%'],
              center: ['50%', '45%'],
              data: items.map((x) => ({
                name: x.name === 'rdp' ? 'RDP' : 'SSH',
                value: x.count || 0,
              })),
            },
          ],
        },
        true,
      );
    },
    resizeCharts() {
      Object.values(this.charts).forEach((c: any) => c && c.resize());
    },
  },
});
</script>

<style lang="less" scoped>
.overview-container {
  padding: 8px 0;
}
.stat-row {
  margin-bottom: 16px;
}
.stat-card {
  .stat-label {
    font-size: 13px;
    color: var(--td-text-color-secondary);
    margin-bottom: 6px;
  }
  .stat-value {
    font-size: 22px;
    font-weight: 600;
    color: var(--td-text-color-primary);
    &.stat-active {
      color: #52c41a;
    }
    &.stat-inactive {
      color: #8c8c8c;
    }
    &.stat-warn {
      color: #d54941;
    }
    &.stat-expired {
      color: #faad14;
    }
    &.stat-sub {
      color: #1677ff;
    }
    &.stat-small {
      font-size: 14px;
      font-weight: 500;
    }
  }
  .stat-hint {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
    margin-top: 4px;
  }
}
.stat-card-clickable {
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
  &:hover {
    border-color: #1677ff;
    box-shadow: 0 2px 8px rgba(22, 119, 255, 0.2);
  }
}
.source-card {
  margin-bottom: 16px;
}
.source-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  &:last-child {
    margin-bottom: 0;
  }
}
.source-label {
  font-size: 13px;
  color: var(--td-text-color-secondary);
  min-width: 90px;
}
.source-empty {
  font-size: 13px;
  color: var(--td-text-color-placeholder);
}
.source-hint {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}
.chart-card,
.top-card {
  margin-bottom: 16px;
}
</style>
