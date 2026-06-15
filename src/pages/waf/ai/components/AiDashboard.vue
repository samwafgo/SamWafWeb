<template>
  <div>
    <t-space style="margin-bottom:12px" align="center">
      <span>{{ $t('common.date') }}:</span>
      <t-date-range-picker v-model="range" :clearable="false" />
      <t-button theme="primary" :loading="loading" @click="loadData">{{ $t('page.ai.dashboard.refresh') }}</t-button>
    </t-space>

    <t-row :gutter="12" style="margin-bottom:12px">
      <t-col :span="3">
        <t-card :title="$t('page.ai.dashboard.total')" :bordered="false">
          <div class="stat-num">{{ data.total }}</div>
        </t-card>
      </t-col>
      <t-col :span="3">
        <t-card :title="$t('page.ai.dashboard.observe')" :bordered="false">
          <div class="stat-num warn">{{ data.observe_cnt }}</div>
        </t-card>
      </t-col>
      <t-col :span="3">
        <t-card :title="$t('page.ai.dashboard.block')" :bordered="false">
          <div class="stat-num danger">{{ data.block_cnt }}</div>
        </t-card>
      </t-col>
      <t-col :span="3">
        <t-card :title="$t('page.ai.dashboard.top_category')" :bordered="false">
          <div class="stat-num">{{ topCategory }}</div>
        </t-card>
      </t-col>
    </t-row>

    <t-row :gutter="12">
      <t-col :span="6">
        <t-card :title="$t('page.ai.dashboard.by_category')" :bordered="false">
          <div ref="catChart" style="height:300px"></div>
        </t-card>
      </t-col>
      <t-col :span="6">
        <t-card :title="$t('page.ai.dashboard.score_hist')" :bordered="false">
          <div ref="histChart" style="height:300px"></div>
        </t-card>
      </t-col>
    </t-row>

    <t-row style="margin-top:12px">
      <t-col :span="12">
        <t-card :title="$t('page.ai.dashboard.trend')" :bordered="false">
          <div ref="trendChart" style="height:300px"></div>
        </t-card>
      </t-col>
    </t-row>

    <t-alert v-if="!loading && data.total === 0" theme="info" :message="$t('page.ai.dashboard.empty')"
      style="margin-top:12px" />
  </div>
</template>

<script>
import { MessagePlugin } from 'tdesign-vue';
import * as echarts from 'echarts/core';
import { PieChart, BarChart, LineChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { aiDashboardApi } from '@/apis/ai';

echarts.use([PieChart, BarChart, LineChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

export default {
  name: 'AiDashboard',
  data() {
    return {
      loading: false,
      range: [],
      data: { total: 0, observe_cnt: 0, block_cnt: 0, categories: [], score_hist: [], trend: [] },
      charts: { cat: null, hist: null, trend: null },
    };
  },
  computed: {
    topCategory() {
      const cats = this.data.categories;
      return cats && cats.length ? cats[0].name : '-';
    },
  },
  mounted() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    this.range = [this.fmtDate(start), this.fmtDate(end)];
    this.loadData();
    window.addEventListener('resize', this.resizeCharts);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeCharts);
    Object.values(this.charts).forEach((c) => c && c.dispose());
  },
  methods: {
    fmtDate(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    },
    toDayInt(s) {
      return parseInt(String(s).replace(/-/g, ''), 10) || 0;
    },
    async loadData() {
      this.loading = true;
      try {
        const s = this.range && this.range.length === 2 ? this.range[0] : '';
        const e = this.range && this.range.length === 2 ? this.range[1] : '';
        const res = await aiDashboardApi({ start_day: this.toDayInt(s), end_day: this.toDayInt(e), host_code: '' });
        if (res.code === 0) {
          this.data = res.data || this.data;
          this.$nextTick(this.renderCharts);
        } else {
          MessagePlugin.error(res.msg || this.$t('page.ai.dashboard.load_failed'));
        }
      } catch (err) {
        MessagePlugin.error(this.$t('page.ai.dashboard.load_failed'));
      } finally {
        this.loading = false;
      }
    },
    initChart(refName, key) {
      const dom = this.$refs[refName];
      if (!dom) return null;
      if (!this.charts[key]) this.charts[key] = echarts.init(dom);
      return this.charts[key];
    },
    renderCharts() {
      this.renderCat();
      this.renderHist();
      this.renderTrend();
    },
    renderCat() {
      const c = this.initChart('catChart', 'cat');
      if (!c) return;
      const d = (this.data.categories || []).map((x) => ({ name: x.name, value: x.value }));
      c.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, type: 'scroll' },
        series: [{ type: 'pie', radius: ['40%', '65%'], data: d, label: { formatter: '{b}: {c}' } }],
      }, true);
    },
    renderHist() {
      const c = this.initChart('histChart', 'hist');
      if (!c) return;
      const h = this.data.score_hist || [];
      c.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: '8%', right: '4%', bottom: '14%', top: '10%' },
        xAxis: { type: 'category', data: h.map((x) => x.name), axisLabel: { rotate: 45 } },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: h.map((x) => x.value), itemStyle: { color: '#0052d9' } }],
      }, true);
    },
    renderTrend() {
      const c = this.initChart('trendChart', 'trend');
      if (!c) return;
      const t = this.data.trend || [];
      const obs = this.$t('page.ai.dashboard.observe');
      const blk = this.$t('page.ai.dashboard.block');
      c.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: [obs, blk], top: 0 },
        grid: { left: '6%', right: '4%', bottom: '8%', top: '15%' },
        xAxis: { type: 'category', data: t.map((x) => String(x.day)) },
        yAxis: { type: 'value' },
        series: [
          { name: obs, type: 'line', smooth: true, data: t.map((x) => x.observe), itemStyle: { color: '#e37318' } },
          { name: blk, type: 'line', smooth: true, data: t.map((x) => x.block), itemStyle: { color: '#d54941' } },
        ],
      }, true);
    },
    resizeCharts() {
      Object.values(this.charts).forEach((c) => c && c.resize());
    },
  },
};
</script>

<style scoped>
.stat-num {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.4;
}
.stat-num.warn { color: #e37318; }
.stat-num.danger { color: #d54941; }
</style>
