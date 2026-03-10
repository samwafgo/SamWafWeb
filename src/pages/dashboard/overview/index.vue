<template>
  <div class="site-overview">
    <!-- 日期选择器 -->
    <t-card :bordered="false" class="filter-card">
      <t-row align="middle" :gutter="16">
        <t-col flex="none">
          <span class="filter-label">{{ $t('page.overview.date_range') }}</span>
        </t-col>
        <t-col flex="none">
          <t-date-range-picker
            v-model="dateRange"
            mode="date"
            :presets="datePresets"
            format="YYYY-MM-DD"
            value-format="YYYYMMDD"
            @change="onDateRangeChange"
          />
        </t-col>
      </t-row>
    </t-card>

    <!-- 顶部汇总卡片 -->
    <t-row :gutter="[16, 16]" class="summary-cards">
      <t-col :xs="12" :sm="6" :xl="4" v-for="card in summaryCards" :key="card.key">
        <t-card :bordered="false" :class="['summary-card', card.colorClass]">
          <div class="card-content">
            <div class="card-info">
              <div class="card-title">{{ card.title }}</div>
              <div class="card-value">{{ card.value }}</div>
            </div>
            <div class="card-icon">
              <component :is="card.icon" size="32px" />
            </div>
          </div>
        </t-card>
      </t-col>
    </t-row>

    <!-- 站点实时安全明细表格 -->
    <t-card
      :bordered="false"
      class="site-table-card"
      :title="$t('page.overview.site_detail_title')"
    >
      <template #actions>
        <span class="table-hint">{{ $t('page.overview.click_row_hint') }}</span>
      </template>
      <t-table
        :data="siteList"
        :columns="columns"
        row-key="host_code"
        hover
        :loading="loading"
        @row-click="onRowClick"
        stripe
      >
        <template #host="{ row }">
          <div>
            <div class="site-name" :title="row.host_remark || row.host">{{ row.host_remark || row.host }}</div>
            <div class="site-code" :title="row.host">{{ row.host }}</div>
          </div>
        </template>
        <template #traffic_in_mb="{ row }">
          {{ formatTraffic(row.traffic_in_mb) }}
        </template>
        <template #traffic_out_mb="{ row }">
          {{ formatTraffic(row.traffic_out_mb) }}
        </template>
        <template #attack_count="{ row }">
          <span class="attack-num">{{ row.attack_count.toLocaleString() }}</span>
        </template>
      </t-table>
    </t-card>

    <!-- 站点详情弹窗 -->
    <t-dialog
      :visible.sync="detailVisible"
      :header="detailHost"
      width="900px"
      :footer="false"
      placement="center"
      @close="onDetailClose"
    >
      <div class="detail-content">
        <!-- 时间范围切换 -->
        <div class="detail-header">
          <t-radio-group v-model="timeRange" variant="default-filled" @change="loadDetail">
            <t-radio-button value="24h">{{ $t('page.overview.range_24h') }}</t-radio-button>
            <t-radio-button value="7d">{{ $t('page.overview.range_7d') }}</t-radio-button>
            <t-radio-button value="30d">{{ $t('page.overview.range_30d') }}</t-radio-button>
          </t-radio-group>
        </div>
        <t-row :gutter="16">
          <!-- 折线图 -->
          <t-col :span="9">
            <t-loading :loading="detailLoading" style="width:100%">
              <div ref="detailChartContainer" class="detail-chart"></div>
            </t-loading>
          </t-col>
          <!-- 右侧统计指标 -->
          <t-col :span="3">
            <div class="detail-metrics">
              <div class="metric-item">
                <div class="metric-label">{{ $t('page.overview.avg_response') }}</div>
                <div class="metric-value">{{ detailAvgTime }}<span class="unit">ms</span></div>
              </div>
              <div class="metric-item">
                <div class="metric-label">{{ $t('page.overview.normal_rate') }}</div>
                <div class="metric-value metric-green">{{ detailNormalRate }}<span class="unit">%</span></div>
              </div>
            </div>
          </t-col>
        </t-row>
      </div>
    </t-dialog>
  </div>
</template>

<script lang="ts">
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import {
  UsergroupAddIcon,
  UserIcon,
  RootListIcon,
  HourglassIcon,
  CloudUploadIcon,
  ShieldErrorIcon, 
} from 'tdesign-icons-vue';
import dayjs from 'dayjs';
import { wafstatsiteoverviewapi, wafstatsitedetailapi } from '@/apis/stats';

echarts.use([LineChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

export default {
  name: 'SiteOverview',
  components: {
    UsergroupAddIcon,
    UserIcon,
    RootListIcon,
    HourglassIcon,
    CloudUploadIcon,
    ShieldErrorIcon,
  },
  data() {
    const today = dayjs().format('YYYYMMDD');
    const sevenDaysAgo = dayjs().subtract(6, 'day').format('YYYYMMDD');
    return {
      loading: false,
      dateRange: [sevenDaysAgo, today],
      datePresets: {
        [this.$t('page.overview.preset_today')]: [dayjs().format('YYYYMMDD'), dayjs().format('YYYYMMDD')],
        [this.$t('page.overview.preset_last_7_days')]: [dayjs().subtract(6, 'day').format('YYYYMMDD'), dayjs().format('YYYYMMDD')],
        [this.$t('page.overview.preset_last_30_days')]: [dayjs().subtract(29, 'day').format('YYYYMMDD'), dayjs().format('YYYYMMDD')],
      },
      // 汇总卡片
      summaryCards: [
        { key: 'total_ip',     title: this.$t('page.overview.total_ip'),     value: '0', icon: 'UsergroupAddIcon', colorClass: 'card-blue' },
        { key: 'total_uv',     title: this.$t('page.overview.total_uv'),     value: '0', icon: 'UserIcon',         colorClass: 'card-cyan' },
        { key: 'total_pv',     title: this.$t('page.overview.total_pv'),     value: '0', icon: 'RootListIcon',     colorClass: 'card-purple' },
        { key: 'total_attack', title: this.$t('page.overview.total_attack'), value: '0', icon: 'ShieldErrorIcon',  colorClass: 'card-red' },
        { key: 'total_in',     title: this.$t('page.overview.traffic_in'),   value: '0', icon: 'CloudUploadIcon',  colorClass: 'card-orange' },
        { key: 'total_out',    title: this.$t('page.overview.traffic_out'),  value: '0', icon: 'HourglassIcon',        colorClass: 'card-green' },
      ],
      siteList: [],
      columns: [
        { colKey: 'host',           title: this.$t('page.overview.col_site'),     width: 280 },
        { colKey: 'ip_count',       title: this.$t('page.overview.col_ip'),       align: 'right' },
        { colKey: 'uv_count',       title: 'UV',                                  align: 'right' },
        { colKey: 'total_count',    title: 'PV',                                  align: 'right' },
        { colKey: 'traffic_in_mb',  title: this.$t('page.overview.col_traffic_in'),  align: 'right' },
        { colKey: 'traffic_out_mb', title: this.$t('page.overview.col_traffic_out'), align: 'right' },
        { colKey: 'attack_count',   title: this.$t('page.overview.col_attack'),   align: 'right' },
      ],
      // 详情弹窗
      detailVisible: false,
      detailLoading: false,
      detailHost: '',
      detailHostCode: '',
      timeRange: '24h',
      detailAvgTime: '0',
      detailNormalRate: '0',
      detailChart: null,
      detailChartContainer: null,
      isChartInitialed: false,
    };
  },
  watch: {
    detailVisible(val) {
      if (val) {
        this.$nextTick(() => {
          // 对齐 MiddleChart.vue：通过 ref 缓存容器引用
          if (!this.detailChartContainer) {
            this.detailChartContainer = this.$refs.detailChartContainer;
          }
          this.loadDetail();
        });
      } else {
        // 关闭时重置初始化标记，下次打开重新走首次初始化流程
        this.isChartInitialed = false;
      }
    },
  },
  mounted() {
    this.loadOverview();
  },
  beforeDestroy() {
    if (this.detailChart) {
      this.detailChart.dispose();
      this.detailChart = null;
    }
    this.detailChartContainer = null;
  },
  methods: {
    onDateRangeChange(val) {
      if (val && val.length === 2) {
        this.loadOverview();
      }
    },
    loadOverview() {
      this.loading = true;
      const params = {
        start_day: this.dateRange[0],
        end_day: this.dateRange[1],
      };
      wafstatsiteoverviewapi(params)
        .then((res) => {
          if (res.code === 0) {
            const d = res.data;
            // 更新汇总卡片
            this.summaryCards[0].value = (d.total_ip || 0).toLocaleString();
            this.summaryCards[1].value = (d.total_uv || 0).toLocaleString();
            this.summaryCards[2].value = (d.total_pv || 0).toLocaleString();
            this.summaryCards[3].value = (d.total_attack || 0).toLocaleString();
            this.summaryCards[4].value = this.formatTraffic(d.total_in_mb || 0);
            this.summaryCards[5].value = this.formatTraffic(d.total_out_mb || 0);
            this.siteList = d.site_list || [];
          }
        })
        .catch((e) => console.error(e))
        .finally(() => { this.loading = false; });
    },
    onRowClick({ row }) {
      this.detailHostCode = row.host_code;
      this.detailHost = row.host_remark || row.host;
      this.timeRange = '24h';
      this.detailVisible = true;
      // watch(detailVisible) 在 $nextTick 后触发 loadDetail
    },
    loadDetail() {
      if (!this.detailHostCode) return;
      this.detailLoading = true;
      wafstatsitedetailapi({ host_code: this.detailHostCode, time_range: this.timeRange })
        .then((res) => {
          if (res.code === 0) {
            const d = res.data;
            this.detailAvgTime = (d.avg_time_ms || 0).toFixed(1);
            this.detailNormalRate = (d.normal_rate_percent || 0).toFixed(1);
            this.$nextTick(() => {
              this.renderDetailChart(d);
            });
          }
        })
        .catch((e) => console.error(e))
        .finally(() => { this.detailLoading = false; });
    },
    renderDetailChart(data, retries = 0) {
      if (!this.detailVisible || retries > 50) return;

      // 对齐 MiddleChart.vue：用缓存的 ref 引用，init 与 setOption 分离
      if (!this.detailChartContainer) {
        this.detailChartContainer = this.$refs.detailChartContainer;
      }
      if (!this.detailChartContainer) return;

      if (this.detailChartContainer.clientWidth === 0) {
        setTimeout(() => {
          this.renderDetailChart(data, retries + 1);
        }, 100);
        return;
      }

      const isHourMode = this.timeRange === '24h';
      const trend = isHourMode ? (data.hour_trend || []) : (data.day_trend || []);

      let xAxisData; let pvData; let attackData; let uvData;
      if (isHourMode) {
        xAxisData = trend.map((p) => dayjs.unix(p.hour_time).format('HH:mm'));
        pvData    = trend.map((p) => p.total_count);
        attackData = trend.map((p) => p.attack_count);
        uvData    = [];
      } else {
        xAxisData  = trend.map((p) => { const s = String(p.day); return `${s.slice(4, 6)}-${s.slice(6, 8)}`; });
        pvData     = trend.map((p) => p.total_count);
        attackData = trend.map((p) => p.attack_count);
        uvData     = trend.map((p) => p.uv_count);
      }

      const series: any[] = [
        { name: 'PV', type: 'line', smooth: true, data: pvData, itemStyle: { color: '#0052D9' }, areaStyle: { opacity: 0.08 } },
        { name: this.$t('page.overview.legend_attack'), type: 'line', smooth: true, data: attackData, itemStyle: { color: '#E34D59' } },
      ];
      if (!isHourMode) {
        series.push({ name: 'UV', type: 'line', smooth: true, data: uvData, lineStyle: { type: 'dashed' }, itemStyle: { color: '#00A870' } });
      }

      const option = {
        tooltip: { trigger: 'axis' },
        legend: { data: isHourMode ? ['PV', this.$t('page.overview.legend_attack')] : ['PV', this.$t('page.overview.legend_attack'), 'UV'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: xAxisData },
        yAxis: { type: 'value' },
        series,
      };

      if (this.isChartInitialed === false) {
        // 首次：初始化实例并渲染（对齐 MiddleChart.vue renderCharts 流程）
        this.detailChart = echarts.init(this.detailChartContainer);
        this.detailChart.setOption(option);
        this.isChartInitialed = true;
      } else {
        // 切换时间范围：直接 setOption 更新数据
        this.detailChart.setOption(option);
      }
    },
    onDetailClose() {
      if (this.detailChart) {
        this.detailChart.dispose();
        this.detailChart = null;
      }
      this.detailChartContainer = null;
      this.isChartInitialed = false;
    },
    formatTraffic(mb) {
      if (mb === undefined || mb === null) return '0 MB';
      if (mb >= 1024) return `${(mb / 1024).toFixed(2)  } GB`;
      if (mb >= 1) return `${mb.toFixed(2)  } MB`;
      return `${(mb * 1024).toFixed(0)  } KB`;
    },
  },
};
</script>

<style lang="less" scoped>
.site-overview {
  padding: 0;
}

.filter-card {
  margin-bottom: 16px;

  .filter-label {
    font-weight: 500;
    color: var(--td-text-color-secondary);
  }
}

.summary-cards {
  margin-bottom: 16px;
}

.summary-card {
  border-radius: 8px;
  overflow: hidden;

  .card-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
  }

  .card-title {
    font-size: 13px;
    color: var(--td-text-color-secondary);
    margin-bottom: 8px;
  }

  .card-value {
    font-size: 28px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }

  .card-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.85;
  }

  &.card-blue   .card-icon { background: rgba(0, 82, 217, 0.12);  color: #0052D9; }
  &.card-cyan   .card-icon { background: rgba(0, 168, 112, 0.12); color: #00A870; }
  &.card-purple .card-icon { background: rgba(122, 75, 212, 0.12);color: #7A4BD4; }
  &.card-red    .card-icon { background: rgba(227, 77, 89, 0.12);  color: #E34D59; }
  &.card-orange .card-icon { background: rgba(232, 133, 34, 0.12); color: #E88522; }
  &.card-green  .card-icon { background: rgba(0, 168, 112, 0.12);  color: #00A870; }
}

.site-table-card {
  margin-bottom: 16px;

  .table-hint {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
  }

  .site-name {
    font-weight: 500;
    color: var(--td-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .site-code {
    font-size: 11px;
    color: var(--td-text-color-placeholder);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .attack-num {
    color: #E34D59;
    font-weight: 600;
  }

  /deep/ tr {
    cursor: pointer;
  }
}

.detail-content {
  overflow-x: hidden;
  .detail-header {
    margin-bottom: 16px;
  }

  .detail-chart {
    width: 100%;
    height: 320px;
  }

  .detail-metrics {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 16px 0;

    .metric-item {
      text-align: center;

      .metric-label {
        font-size: 13px;
        color: var(--td-text-color-secondary);
        margin-bottom: 8px;
      }

      .metric-value {
        font-size: 32px;
        font-weight: 700;
        color: var(--td-text-color-primary);

        .unit {
          font-size: 14px;
          font-weight: 400;
          margin-left: 4px;
          color: var(--td-text-color-secondary);
        }

        &.metric-green {
          color: #00A870;
        }
      }
    }
  }
}
</style>
