<template>
  <div class="stats-dashboard">
    <!-- 页面标题 + 实时状态 -->
    <div class="stats-head">
      <div class="stats-head__title">{{ $t('menu.dashboard.stats_title') }}</div>
      <div class="stats-head__subtitle">
        <span class="live-dot"></span>
        {{ $t('dashboard.stats.update_frequency') }} · {{ $t('dashboard.stats.last_update') }}: {{ lastUpdateTime }}
      </div>
    </div>

    <!-- 实时指标 -->
    <div class="stats-grid">
      <div
        v-for="item in statCards"
        :key="item.key"
        class="stat-card"
        :class="`stat-card--${item.theme}`"
      >
        <div class="stat-card__label">{{ item.label }}</div>
        <div v-if="!item.network" class="stat-card__value">
          {{ item.value }}<span v-if="item.unit" class="stat-card__unit">{{ item.unit }}</span>
        </div>
        <div v-else class="stat-card__network">
          <div class="stat-card__network-line">
            <span class="network-dot network-dot--in"></span>{{ item.recv }}
          </div>
          <div class="stat-card__network-line">
            <span class="network-dot network-dot--out"></span>{{ item.sent }}
          </div>
        </div>
      </div>
    </div>

    <!-- 趋势图表 -->
    <div class="charts-grid">
      <t-card :title="$t('dashboard.stats.qps_trend')" class="chart-card">
        <div ref="qpsChart" class="chart-box"></div>
      </t-card>
      <t-card :title="$t('dashboard.stats.queue_trend')" class="chart-card">
        <div ref="queueChart" class="chart-box"></div>
      </t-card>
      <t-card :title="$t('dashboard.stats.response_time_trend')" class="chart-card">
        <div ref="responseTimeChart" class="chart-box"></div>
      </t-card>
      <t-card :title="$t('dashboard.stats.system_resource_trend')" class="chart-card">
        <div ref="systemResourceChart" class="chart-box"></div>
      </t-card>
      <t-card :title="$t('dashboard.stats.network_traffic_trend')" class="chart-card chart-card--full">
        <div ref="networkTrafficChart" class="chart-box"></div>
      </t-card>
    </div>

    <!-- 实时消息日志 -->
    <t-card :title="$t('dashboard.stats.realtime_log')" class="message-log">
      <template #actions>
        <t-button 
          theme="primary" 
          size="small" 
          @click="exportToCSV"
          :disabled="recentMessages.length === 0"
          style="margin-right: 8px;"
        >
          {{ $t('dashboard.stats.export_csv') }}
        </t-button>
        <t-button 
          theme="default" 
          size="small" 
          @click="clearMessages"
          :disabled="recentMessages.length === 0"
        >
          {{ $t('dashboard.stats.clear_log') }}
        </t-button>
      </template>
      <div class="log-container">
        <div 
          v-for="(message, index) in recentMessages" 
          :key="index" 
          class="log-item"
        >
          <span class="log-time">{{ formatTime(message.timestamp) }}</span> 
          <span class="log-operation">{{ message.operatype }}</span>
          <span class="log-data">
            {{ $t('dashboard.stats.qps_label') }}: {{ message.qps }}, 
            {{ $t('dashboard.stats.log_qps_label') }}: {{ message.log_qps }}, 
            {{ $t('dashboard.stats.main_queue') }}: {{ message.main_queue }}, 
            {{ $t('dashboard.stats.log_queue') }}: {{ message.log_queue }}, 
            {{ $t('dashboard.stats.stats_queue') }}: {{ message.stats_queue }}, 
            {{ $t('dashboard.stats.message_queue') }}: {{ message.message_queue }},
            {{ $t('dashboard.stats.cpu_usage') }}: {{ message.cpu_percent }}%, 
            {{ $t('dashboard.stats.memory_usage') }}: {{ message.memory_percent }}%,
            {{ $t('dashboard.stats.network_recv_rate') }}: {{ formatBytes(message.network_recv_rate || 0) }},
            {{ $t('dashboard.stats.network_sent_rate') }}: {{ formatBytes(message.network_sent_rate || 0) }}
          </span>
        </div>
      </div>
    </t-card>

    <!-- 系统监控 -->
    <div class="system-monitor-section">
      <SystemMonitor />
    </div>
  </div>
</template>

<script>
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import * as echarts from 'echarts/core';
import { changeChartsTheme } from '@/utils/color';

import {heartbeat_api} from '@/apis/common';
import SystemMonitor from '@/pages/waf/monitor/index.vue';
echarts.use([GridComponent, TooltipComponent, LegendComponent, TitleComponent, LineChart, CanvasRenderer]);

export default {
  name: 'DashboardStats',
  components: {
    SystemMonitor
  },
  data() {
    return {
      qpsChart: null,
      queueChart: null,
      responseTimeChart: null,
      systemResourceChart: null,
      networkTrafficChart: null,
      qpsData: {
        times: [],
        qps: [],
        log_qps: []
      },
    
    handleResponseTimeData(responseTimeItem) {
      // 更新响应时间图表数据
      const timeStr = this.formatTime(responseTimeItem.timestamp);
      
      this.responseTimeData.times.push(timeStr);
      this.responseTimeData.responseTimes.push(responseTimeItem.responseTime);
      
      // 统计成功失败次数
      if (responseTimeItem.status === 'success') {
        this.responseTimeData.successCount++;
      } else {
        this.responseTimeData.errorCount++;
      }
      
      // 限制数据点数量
      if (this.responseTimeData.times.length > this.maxDataPoints) {
        this.responseTimeData.times.shift();
        this.responseTimeData.responseTimes.shift();
      }
      
      // 更新响应时间图表
      this.updateResponseTimeChart();
    },
    
    updateResponseTimeChart() {
      if (this.responseTimeChart) {
        this.responseTimeChart.setOption({
          xAxis: {
            data: this.responseTimeData.times
          },
          series: [
            {
              data: this.responseTimeData.responseTimes
            }
          ]
        });
      }
    },
    
    startHeartbeatMonitoring() {
      // 启动定时心跳监控
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, this.heartbeatIntervalTime);
    },
    
    stopHeartbeatMonitoring() {
      // 停止心跳监控
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    },
    
    async sendHeartbeat() {
      const startTime = Date.now();
      try {
        // 使用导入的heartbeat_api函数发送心跳请求
        const response = await heartbeat_api();
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // 记录响应时间数据
        const responseTimeData = {
          timestamp: endTime,
          responseTime: responseTime,
          status: response.code === 200 ? 'success' : 'error'
        };
        
        // 存储到store
        this.$store.commit('stats/addResponseTimeData', responseTimeData);
        
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // 记录错误响应时间
        const responseTimeData = {
          timestamp: endTime,
          responseTime: responseTime,
          status: 'error'
        };
        
        // 存储到store
        this.$store.commit('stats/addResponseTimeData', responseTimeData);
        
        console.error('心跳请求失败:', error);
      }
    },
    
    initResponseTimeChart() {
      this.responseTimeChart = echarts.init(this.$refs.responseTimeChart);
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          formatter: function(params) {
            let result = params[0].name + '<br/>';
            params.forEach(function(item) {
              result += item.marker + item.seriesName + ': ' + item.value + 'ms<br/>';
            });
            return result;
          }
        },
        legend: {
          data: [this.$t('dashboard.stats.response_time_label')]
        },
        grid: {
          left: '10%',
          right: '10%',
          bottom: '15%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.responseTimeData.times
        },
        yAxis: {
          type: 'value',
          name: 'ms',
          min: 0
        },
        series: [
          {
            name: this.$t('dashboard.stats.response_time_label'),
            type: 'line',
            data: this.responseTimeData.responseTimes,
            smooth: true,
            itemStyle: {
              color: '#ff7875'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{
                  offset: 0, color: 'rgba(255, 120, 117, 0.3)'
                }, {
                  offset: 1, color: 'rgba(255, 120, 117, 0.1)'
                }]
              }
            }
          }
        ]
      };
      this.responseTimeChart.setOption(option);
    },
      queueData: {
        times: [],
        main_queue: [],
        log_queue: [],
        stats_queue: [],
        message_queue: []
      },
      responseTimeData: {
        times: [],
        responseTimes: [],
        successCount: 0,
        errorCount: 0
      },
      systemResourceData: {
        times: [],
        cpu_percent: [],
        memory_percent: []
      },
      networkTrafficData: {
        times: [],
        recv_rate: [],
        sent_rate: []
      },
      recentMessages: [],
      maxDataPoints: 50, // 最多保留50个数据点
      maxMessages: 100, // 最多保留100条消息
      heartbeatInterval: null, // 心跳定时器
      heartbeatIntervalTime: 10000, // 心跳间隔10秒
      lastUpdateTime: '--' // 最新数据更新时间
    };
  },
  computed: {
    currentStats() {
      return this.$store.getters['stats/getCurrentStats'] || {
        qps: 0,
        log_qps: 0,
        main_queue: 0,
        log_queue: 0,
        stats_queue: 0,
        message_queue: 0,
        cpu_percent: 0,
        memory_percent: 0,
        network_recv_rate: 0,
        network_sent_rate: 0
      };
    },
    statsHistory() {
      return this.$store.getters['stats/getStatsHistory'] || [];
    },
    responseTimeHistory() {
      return this.$store.getters['stats/getResponseTimeHistory'] || [];
    },
    averageResponseTime() {
      return this.$store.getters['stats/getAverageResponseTime'] || 0;
    },
    networkRecvRateFormatted() {
      return this.formatBytes(this.currentStats.network_recv_rate || 0);
    },
    networkSentRateFormatted() {
      return this.formatBytes(this.currentStats.network_sent_rate || 0);
    },
    // 顶部指标卡数据（统一由 computed 驱动）
    statCards() {
      const fmt = (v) => (Number(v) || 0).toLocaleString('en-US');
      return [
        {
          key: 'qps',
          theme: 'primary',
          label: this.$t('dashboard.stats.current_qps'),
          value: fmt(this.currentStats.qps),
        },
        {
          key: 'log_qps',
          theme: 'primary',
          label: this.$t('dashboard.stats.log_qps'),
          value: fmt(this.currentStats.log_qps),
        },
        {
          key: 'avg_response',
          theme: 'primary',
          label: this.$t('dashboard.stats.avg_response_time'),
          value: Math.round(this.averageResponseTime),
          unit: 'ms',
        },
        {
          key: 'main_queue',
          theme: 'warning',
          label: this.$t('dashboard.stats.main_queue'),
          value: fmt(this.currentStats.main_queue),
        },
        {
          key: 'log_queue',
          theme: 'warning',
          label: this.$t('dashboard.stats.log_queue'),
          value: fmt(this.currentStats.log_queue),
        },
        {
          key: 'cpu',
          theme: 'danger',
          label: this.$t('dashboard.stats.cpu_usage'),
          value: (this.currentStats.cpu_percent || 0).toFixed(1),
          unit: '%',
        },
        {
          key: 'memory',
          theme: 'danger',
          label: this.$t('dashboard.stats.memory_usage'),
          value: (this.currentStats.memory_percent || 0).toFixed(1),
          unit: '%',
        },
        {
          key: 'network',
          theme: 'success',
          label: this.$t('dashboard.stats.network_rate'),
          network: true,
          recv: this.networkRecvRateFormatted,
          sent: this.networkSentRateFormatted,
        },
      ];
    }
  },
  watch: {
    statsHistory: {
      handler(newHistory) {
        // 监听stats store中的历史数据变化
        if (newHistory && newHistory.length > 0) {
          const latestStats = newHistory[newHistory.length - 1];
          this.handleStatsMessage(latestStats);
          // 更新最新数据时间
          this.lastUpdateTime = this.formatTime(Date.now());
        }
      },
      deep: true,
      immediate: true
    },
    responseTimeHistory: {
      handler(newHistory) {
        // 监听响应时间历史数据变化
        if (newHistory && newHistory.length > 0) {
          const latestResponseTime = newHistory[newHistory.length - 1];
          this.handleResponseTimeData(latestResponseTime);
          // 更新最新数据时间
          this.lastUpdateTime = this.formatTime(Date.now());
        }
      },
      deep: true,
      immediate: true
    }
  }, 
  mounted() {
    this.initCharts();
    // 监听主题变化
    this.$store.watch(
      (state) => state.setting.brandTheme,
      () => {
        changeChartsTheme([this.qpsChart, this.queueChart, this.responseTimeChart, this.systemResourceChart]);
      }
    );
    
    // 监听窗口大小变化，重新调整图表尺寸
    this.resizeHandler = () => {
      if (this.qpsChart) {
        this.qpsChart.resize();
      }
      if (this.queueChart) {
        this.queueChart.resize();
      }
      if (this.responseTimeChart) {
        this.responseTimeChart.resize();
      }
      if (this.systemResourceChart) {
        this.systemResourceChart.resize();
      }
      if (this.networkTrafficChart) {
        this.networkTrafficChart.resize();
      }
    };
    window.addEventListener('resize', this.resizeHandler);
    
    // 启动心跳监控
    this.startHeartbeatMonitoring();
  },
  beforeDestroy() {
    if (this.qpsChart) {
      this.qpsChart.dispose();
    }
    if (this.queueChart) {
      this.queueChart.dispose();
    }
    if (this.responseTimeChart) {
      this.responseTimeChart.dispose();
    }
    if (this.systemResourceChart) {
      this.systemResourceChart.dispose();
    }
    if (this.networkTrafficChart) {
      this.networkTrafficChart.dispose();
    }
    // 移除窗口大小变化监听器
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    // 停止心跳监控
    this.stopHeartbeatMonitoring();
  },
  methods: {
    initCharts() {
      // 使用 $nextTick 确保 DOM 已经渲染完成
      this.$nextTick(() => {
        this.initQpsChart();
        this.initQueueChart();
        this.initResponseTimeChart();
        this.initSystemResourceChart();
        this.initNetworkTrafficChart();
        changeChartsTheme([this.qpsChart, this.queueChart, this.responseTimeChart, this.systemResourceChart, this.networkTrafficChart]);
      });
    },
    
    updateSystemResourceChart() {
      if (!this.systemResourceChart) return;
      
      this.systemResourceChart.setOption({
        xAxis: {
          data: this.systemResourceData.times
        },
        series: [
          {
            data: this.systemResourceData.cpu_percent
          },
          {
            data: this.systemResourceData.memory_percent
          }
        ]
      });
    },
    
    initQpsChart() {
      this.qpsChart = echarts.init(this.$refs.qpsChart);
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: [this.$t('dashboard.stats.qps_label'), this.$t('dashboard.stats.log_qps_label')]
        },
        grid: {
          left: '10%',
          right: '10%',
          bottom: '15%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.qpsData.times
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: this.$t('dashboard.stats.qps_label'),
            type: 'line',
            data: this.qpsData.qps,
            smooth: true,
            itemStyle: {
              color: '#5470c6'
            }
          },
          {
            name: this.$t('dashboard.stats.log_qps_label'),
            type: 'line',
            data: this.qpsData.log_qps,
            smooth: true,
            itemStyle: {
              color: '#91cc75'
            }
          }
        ]
      };
      this.qpsChart.setOption(option);
    },
    
    initQueueChart() {
      this.queueChart = echarts.init(this.$refs.queueChart);
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: [this.$t('dashboard.stats.main_queue'), this.$t('dashboard.stats.log_queue'), this.$t('dashboard.stats.stats_queue'), this.$t('dashboard.stats.message_queue')]
        },
        grid: {
          left: '10%',
          right: '10%',
          bottom: '15%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.queueData.times
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: this.$t('dashboard.stats.main_queue'),
            type: 'line',
            data: this.queueData.main_queue,
            smooth: true,
            itemStyle: {
              color: '#5470c6'
            }
          },
          {
            name: this.$t('dashboard.stats.log_queue'),
            type: 'line',
            data: this.queueData.log_queue,
            smooth: true,
            itemStyle: {
              color: '#91cc75'
            }
          },
          {
            name: this.$t('dashboard.stats.stats_queue'),
            type: 'line',
            data: this.queueData.stats_queue,
            smooth: true,
            itemStyle: {
              color: '#fac858'
            }
          },
          {
            name: this.$t('dashboard.stats.message_queue'),
            type: 'line',
            data: this.queueData.message_queue,
            smooth: true,
            itemStyle: {
              color: '#ee6666'
            }
          }
        ]
      };
      this.queueChart.setOption(option);
    },
    
    initSystemResourceChart() {
      this.systemResourceChart = echarts.init(this.$refs.systemResourceChart);
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          formatter: function(params) {
            let result = params[0].name + '<br/>';
            params.forEach(function(item) {
              result += item.marker + item.seriesName + ': ' + item.value + '%<br/>';
            });
            return result;
          }
        },
        legend: {
          data: [this.$t('dashboard.stats.cpu_usage'), this.$t('dashboard.stats.memory_usage')]
        },
        grid: {
          left: '10%',
          right: '10%',
          bottom: '15%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.systemResourceData.times
        },
        yAxis: {
          type: 'value',
          name: '%',
          min: 0,
          max: 100
        },
        series: [
          {
            name: this.$t('dashboard.stats.cpu_usage'),
            type: 'line',
            data: this.systemResourceData.cpu_percent,
            smooth: true,
            itemStyle: {
              color: '#ff7875'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{
                  offset: 0, color: 'rgba(255, 120, 117, 0.3)'
                }, {
                  offset: 1, color: 'rgba(255, 120, 117, 0.1)'
                }]
              }
            }
          },
          {
            name: this.$t('dashboard.stats.memory_usage'),
            type: 'line',
            data: this.systemResourceData.memory_percent,
            smooth: true,
            itemStyle: {
              color: '#73d13d'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{
                  offset: 0, color: 'rgba(115, 209, 61, 0.3)'
                }, {
                  offset: 1, color: 'rgba(115, 209, 61, 0.1)'
                }]
              }
            }
          }
        ]
      };
      this.systemResourceChart.setOption(option);
    },
    
    initNetworkTrafficChart() {
      this.networkTrafficChart = echarts.init(this.$refs.networkTrafficChart);
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          formatter: (params) => {
            let result = params[0].name + '<br/>';
            params.forEach((item) => {
              const value = item.value;
              const formattedValue = this.formatBytes(value);
              result += item.marker + item.seriesName + ': ' + formattedValue + '<br/>';
            });
            return result;
          }
        },
        legend: {
          data: [this.$t('dashboard.stats.network_recv_rate'), this.$t('dashboard.stats.network_sent_rate')]
        },
        grid: {
          left: '10%',
          right: '10%',
          bottom: '15%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.networkTrafficData.times
        },
        yAxis: {
          type: 'value',
          name: 'Bytes/s',
          min: 0,
          axisLabel: {
            formatter: (value) => {
              return this.formatBytes(value);
            }
          }
        },
        series: [
          {
            name: this.$t('dashboard.stats.network_recv_rate'),
            type: 'line',
            data: this.networkTrafficData.recv_rate,
            smooth: true,
            itemStyle: {
              color: '#40a9ff'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{
                  offset: 0, color: 'rgba(64, 169, 255, 0.3)'
                }, {
                  offset: 1, color: 'rgba(64, 169, 255, 0.1)'
                }]
              }
            }
          },
          {
            name: this.$t('dashboard.stats.network_sent_rate'),
            type: 'line',
            data: this.networkTrafficData.sent_rate,
            smooth: true,
            itemStyle: {
              color: '#f759ab'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{
                  offset: 0, color: 'rgba(247, 89, 171, 0.3)'
                }, {
                  offset: 1, color: 'rgba(247, 89, 171, 0.1)'
                }]
              }
            }
          }
        ]
      };
      this.networkTrafficChart.setOption(option);
    },
    
    handleStatsMessage(statsData) {
      // currentStats现在从store中获取，不需要手动更新
      
      // 添加到消息日志
      this.recentMessages.unshift(statsData);
      if (this.recentMessages.length > this.maxMessages) {
        this.recentMessages = this.recentMessages.slice(0, this.maxMessages);
      }
      
      // 更新图表数据
      const timeStr = this.formatTime(statsData.timestamp);
      
      // 更新QPS数据
      this.qpsData.times.push(timeStr);
      this.qpsData.qps.push(statsData.qps || 0);
      this.qpsData.log_qps.push(statsData.log_qps || 0);
      
      // 更新队列数据
      this.queueData.times.push(timeStr);
      this.queueData.main_queue.push(statsData.main_queue || 0);
      this.queueData.log_queue.push(statsData.log_queue || 0);
      this.queueData.stats_queue.push(statsData.stats_queue || 0);
      this.queueData.message_queue.push(statsData.message_queue || 0);
      
      // 更新系统资源数据
      this.systemResourceData.times.push(timeStr);
      this.systemResourceData.cpu_percent.push(statsData.cpu_percent || 0);
      this.systemResourceData.memory_percent.push(statsData.memory_percent || 0);
      
      // 更新网络流量数据
      this.networkTrafficData.times.push(timeStr);
      this.networkTrafficData.recv_rate.push(statsData.network_recv_rate || 0);
      this.networkTrafficData.sent_rate.push(statsData.network_sent_rate || 0);
      
      // 限制数据点数量
      if (this.qpsData.times.length > this.maxDataPoints) {
        this.qpsData.times.shift();
        this.qpsData.qps.shift();
        this.qpsData.log_qps.shift();
        
        this.queueData.times.shift();
        this.queueData.main_queue.shift();
        this.queueData.log_queue.shift();
        this.queueData.stats_queue.shift();
        this.queueData.message_queue.shift();
        
        this.systemResourceData.times.shift();
        this.systemResourceData.cpu_percent.shift();
        this.systemResourceData.memory_percent.shift();
        
        this.networkTrafficData.times.shift();
        this.networkTrafficData.recv_rate.shift();
        this.networkTrafficData.sent_rate.shift();
      }
      
      // 更新图表
      this.updateCharts();
    },
    
    updateQpsChart() {
      if (!this.qpsChart) return;
      
      this.qpsChart.setOption({
        xAxis: {
          data: this.qpsData.times
        },
        series: [
          {
            data: this.qpsData.qps
          },
          {
            data: this.qpsData.log_qps
          }
        ]
      });
    },
    
    updateQueueChart() {
      if (!this.queueChart) return;
      
      this.queueChart.setOption({
        xAxis: {
          data: this.queueData.times
        },
        series: [
          {
            data: this.queueData.main_queue
          },
          {
            data: this.queueData.log_queue
          },
          {
            data: this.queueData.stats_queue
          },
          {
            data: this.queueData.message_queue
          }
        ]
      });
    },
    
    updateCharts() {
      this.updateQpsChart();
      this.updateQueueChart();
      this.updateSystemResourceChart();
      this.updateNetworkTrafficChart();
    },
    
    updateNetworkTrafficChart() {
      if (!this.networkTrafficChart) return;
      
      this.networkTrafficChart.setOption({
        xAxis: {
          data: this.networkTrafficData.times
        },
        series: [
          {
            data: this.networkTrafficData.recv_rate
          },
          {
            data: this.networkTrafficData.sent_rate
          }
        ]
      });
    },
    
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    },
    
    formatBytes(bytes) {
      if (bytes === 0) return '0 B/s';
      const k = 1024;
      const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    clearMessages() {
      this.recentMessages = [];
    },
    
    exportToCSV() {
      if (this.recentMessages.length === 0) {
        return;
      }
      
      // CSV 列标题
      const headers = [
        this.$t('dashboard.stats.time'),
        //this.$t('dashboard.stats.server'),
        this.$t('dashboard.stats.operation'),
        this.$t('dashboard.stats.qps_label'),
        this.$t('dashboard.stats.log_qps_label'),
        this.$t('dashboard.stats.main_queue'),
        this.$t('dashboard.stats.log_queue'),
        this.$t('dashboard.stats.stats_queue'),
        this.$t('dashboard.stats.message_queue'),
        this.$t('dashboard.stats.cpu_usage'),
        this.$t('dashboard.stats.memory_usage'),
        this.$t('dashboard.stats.network_recv_rate'),
        this.$t('dashboard.stats.network_sent_rate')
      ];
      
      // 构建CSV内容
      let csvContent = headers.join(',') + '\n';
      
      // 添加数据行
      this.recentMessages.forEach(message => {
        const row = [
          `"${this.formatTime(message.timestamp)}"`,
         // `"${message.server || ''}"`,
          `"${message.operatype || ''}"`,
          message.qps || 0,
          message.log_qps || 0,
          message.main_queue || 0,
          message.log_queue || 0,
          message.stats_queue || 0,
          message.message_queue || 0,
          `${(message.cpu_percent || 0).toFixed(1)}%`,
          `${(message.memory_percent || 0).toFixed(1)}%`,
          `"${this.formatBytes(message.network_recv_rate || 0)}"`,
          `"${this.formatBytes(message.network_sent_rate || 0)}"`
        ];
        csvContent += row.join(',') + '\n';
      });
      
      // 创建并下载文件
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // 生成文件名（包含当前时间）
      const now = new Date();
      const timestamp = now.getFullYear() + 
        String(now.getMonth() + 1).padStart(2, '0') + 
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') + 
        String(now.getMinutes()).padStart(2, '0') + 
        String(now.getSeconds()).padStart(2, '0');
      
      link.setAttribute('download', `samwaf_stats_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } 
};
</script>

<style lang="less" scoped>
@import '@/style/variables.less';

.stats-dashboard {
  padding: 0;
}

/* 页面标题 + 实时状态 */
.stats-head {
  margin-bottom: 20px;

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }

  &__subtitle {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    font-size: 13px;
    color: var(--td-text-color-secondary);
  }
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--td-success-color);
  box-shadow: 0 0 0 3px rgba(0, 168, 112, 0.15);
  animation: live-pulse 2s ease-in-out infinite;
}

@keyframes live-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

@media (prefers-reduced-motion: reduce) {
  .live-dot {
    animation: none;
  }
}

/* 实时指标卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  position: relative;
  padding: 16px 18px 18px;
  overflow: hidden;
  border-radius: var(--td-radius-large);
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-stroke);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &__label {
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 500;
    color: var(--td-text-color-secondary);
  }

  &__value {
    font-size: 26px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--td-text-color-primary);
    font-variant-numeric: tabular-nums;
  }

  &__unit {
    margin-left: 4px;
    font-size: 13px;
    font-weight: 400;
    color: var(--td-text-color-placeholder);
  }

  &__network {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__network-line {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 600;
    color: var(--td-text-color-primary);
    font-variant-numeric: tabular-nums;
  }

  .network-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: none;

    &--in {
      background: var(--td-success-color);
    }

    &--out {
      background: var(--td-brand-color);
    }
  }
}

/* 趋势图表 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  overflow: hidden;

  /deep/ .t-card__header {
    padding-bottom: 8px;
  }

  /deep/ .t-card__title {
    font-size: 15px;
    font-weight: 600;
  }

  &--full {
    grid-column: 1 / -1;
  }
}

.chart-box {
  width: 100%;
  height: 300px;
}

/* 实时消息日志 */
.message-log {
  margin-bottom: 16px;

  /deep/ .t-card__header {
    padding-bottom: 8px;
  }

  /deep/ .t-card__title {
    font-size: 15px;
    font-weight: 600;
  }
}

.log-container {
  max-height: 320px;
  overflow-y: auto;
  padding: 8px 12px;
  background: var(--td-bg-color-secondarycontainer);
  border: 1px solid var(--td-component-stroke);
  border-radius: var(--td-radius-medium);
}

.log-item {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--td-component-stroke);
  font-size: 12px;
  line-height: 1.5;

  &:last-child {
    border-bottom: none;
  }
}

.log-time {
  flex: none;
  color: var(--td-text-color-secondary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.log-operation {
  flex: none;
  color: var(--td-brand-color);
  font-weight: 600;
}

.log-data {
  color: var(--td-text-color-primary);
  word-break: break-all;
}

.system-monitor-section{
  margin: -16px;
}
</style>