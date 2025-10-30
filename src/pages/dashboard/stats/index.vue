<template>
  <div class="stats-dashboard">
    <t-card :title="$t('menu.dashboard.stats_title')" :bordered="false">
      <div class="stats-header">
        <t-row :gutter="16">
          <t-col :span="2">
            <t-card size="small" :bordered="true">
              <div class="stat-item">
                <div class="stat-value">{{ currentStats.qps || 0 }}</div>
                <div class="stat-label">{{ $t('dashboard.stats.current_qps') }}</div>
              </div>
            </t-card>
          </t-col>
          <t-col :span="2">
            <t-card size="small" :bordered="true">
              <div class="stat-item">
                <div class="stat-value">{{ currentStats.log_qps || 0 }}</div>
                <div class="stat-label">{{ $t('dashboard.stats.log_qps') }}</div>
              </div>
            </t-card>
          </t-col>
          <t-col :span="2">
            <t-card size="small" :bordered="true">
              <div class="stat-item">
                <div class="stat-value">{{ currentStats.main_queue || 0 }}</div>
                <div class="stat-label">{{ $t('dashboard.stats.main_queue') }}</div>
              </div>
            </t-card>
          </t-col>
          <t-col :span="2">
            <t-card size="small" :bordered="true">
              <div class="stat-item">
                <div class="stat-value">{{ currentStats.log_queue || 0 }}</div>
                <div class="stat-label">{{ $t('dashboard.stats.log_queue') }}</div>
              </div>
            </t-card>
          </t-col>
          <t-col :span="2">
            <t-card size="small" :bordered="true">
              <div class="stat-item">
                <div class="stat-value">{{ averageResponseTime }}ms</div>
                <div class="stat-label">{{ $t('dashboard.stats.avg_response_time') }}</div>
              </div>
            </t-card>
          </t-col>
        </t-row>
      </div>

      <div class="charts-container">
        <t-row :gutter="16">
          <t-col :span="12">
            <t-card :title="$t('dashboard.stats.qps_trend')" size="small" :bordered="true">
              <div ref="qpsChart" style="height: 300px;"></div>
            </t-card>
          </t-col>
          <t-col :span="12">
            <t-card :title="$t('dashboard.stats.queue_trend')" size="small" :bordered="true">
              <div ref="queueChart" style="height: 300px;"></div>
            </t-card>
          </t-col>
          <t-col :span="12">
            <t-card :title="$t('dashboard.stats.response_time_trend')" size="small" :bordered="true">
              <div ref="responseTimeChart" style="height: 300px;"></div>
            </t-card>
          </t-col>
        </t-row>
      </div>

      <div class="message-log">
        <t-card :title="$t('dashboard.stats.realtime_log')" size="small" :bordered="true">
          <div class="log-container">
            <div 
              v-for="(message, index) in recentMessages" 
              :key="index" 
              class="log-item"
            >
              <span class="log-time">{{ formatTime(message.timestamp) }}</span>
              <span class="log-server">{{ message.server }}</span>
              <span class="log-operation">{{ message.operatype }}</span>
              <span class="log-data">
                {{ $t('dashboard.stats.qps_label') }}: {{ message.qps }}, 
                {{ $t('dashboard.stats.log_qps_label') }}: {{ message.log_qps }}, 
                {{ $t('dashboard.stats.queue_label') }}: {{ message.main_queue }}/{{ message.log_queue }}/{{ message.stats_queue }}/{{ message.message_queue }}
              </span>
            </div>
          </div>
        </t-card>
      </div>
    </t-card>
  </div>
</template>

<script>
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import * as echarts from 'echarts/core';
import { changeChartsTheme } from '@/utils/color';

import {heartbeat_api} from '@/apis/common';
echarts.use([GridComponent, TooltipComponent, LegendComponent, TitleComponent, LineChart, CanvasRenderer]);

export default {
  name: 'DashboardStats',
  data() {
    return {
      qpsChart: null,
      queueChart: null,
      responseTimeChart: null,
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
      recentMessages: [],
      maxDataPoints: 50, // 最多保留50个数据点
      maxMessages: 100, // 最多保留100条消息
      heartbeatInterval: null, // 心跳定时器
      heartbeatIntervalTime: 10000 // 心跳间隔10秒
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
        message_queue: 0
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
    }
  },
  watch: {
    statsHistory: {
      handler(newHistory) {
        // 监听stats store中的历史数据变化
        if (newHistory && newHistory.length > 0) {
          const latestStats = newHistory[newHistory.length - 1];
          this.handleStatsMessage(latestStats);
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
        changeChartsTheme([this.qpsChart, this.queueChart, this.responseTimeChart]);
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
        changeChartsTheme([this.qpsChart, this.queueChart, this.responseTimeChart]);
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
    },
    
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    }
  } 
};
</script>

<style scoped>
.stats-dashboard {
  padding: 20px;
}

.stats-header {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.charts-container {
  margin-bottom: 20px;
}

.charts-container .t-card {
  overflow: hidden;
}

.charts-container [ref="qpsChart"],
.charts-container [ref="queueChart"],
.charts-container [ref="responseTimeChart"] {
  width: 100% !important;
  height: 300px !important;
}

.message-log {
  margin-top: 20px;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.log-item {
  display: block;
  padding: 8px 0;
  border-bottom: 1px solid #e8e8e8;
  font-size: 12px;
  line-height: 1.4;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #666;
  margin-right: 10px;
  font-weight: bold;
}

.log-server {
  color: #1890ff;
  margin-right: 10px;
}

.log-operation {
  color: #52c41a;
  margin-right: 10px;
}

.log-data {
  color: #333;
}
</style>