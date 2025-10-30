<template>
  <div class="monitor-container">
    <t-card :title="$t('page.monitor.alert_message')" :bordered="false">
      <template #actions>
        <t-space>
          <t-button theme="primary" @click="refreshData" :loading="loading">
            <template #icon><refresh-icon /></template>
            {{ $t('page.monitor.refresh_data') }}
          </t-button>
<!--          <t-switch
            v-model="autoRefresh"
            :label="[$t('page.monitor.auto_refresh')]"
            @change="handleAutoRefreshChange"
          />-->
        </t-space>
      </template>
    </t-card>

    <!-- CPU和内存信息行 -->
    <div class="system-info-container" style="margin-top: 16px;">
      <!-- CPU信息卡片 -->
      <div class="info-card-wrapper">
        <t-card :title="$t('page.monitor.cpu_info')" :bordered="false">
          <div v-if="loading" class="loading-container">
            <t-loading size="large" />
            <p>{{ $t('page.monitor.loading_data') }}</p>
          </div>
          <div v-else-if="error" class="error-container">
            <t-alert theme="error" :message="$t('page.monitor.load_failed')" />
            <t-button theme="primary" @click="refreshData" style="margin-top: 8px;">
              {{ $t('page.monitor.retry') }}
            </t-button>
          </div>
          <div v-else class="info-content">
            <div class="info-item">
              <span class="label">{{ $t('page.monitor.cpu_model') }}:</span>
              <span class="value">{{ systemInfo.cpu.model_name || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">{{ $t('page.monitor.physical_cores') }}:</span>
              <span class="value">{{ systemInfo.cpu.physical_cnt || 0 }}</span>
            </div>
            <div class="info-item">
              <span class="label">{{ $t('page.monitor.logical_cores') }}:</span>
              <span class="value">{{ systemInfo.cpu.logical_cnt || 0 }}</span>
            </div>
            <div class="info-item">
              <span class="label">{{ $t('page.monitor.cpu_cores') }}:</span>
              <span class="value">{{ systemInfo.cpu.cores || 0 }}</span>
            </div>
            <div class="usage-item">
              <span class="label">{{ $t('page.monitor.cpu_usage') }}:</span>
              <t-progress
                :percentage="systemInfo.cpu.usage_percent || 0"
                :color="getUsageColor(systemInfo.cpu.usage_percent)"
                :label="true"
                style="margin-top: 8px;"
              />
            </div>
          </div>
        </t-card>
      </div>

      <!-- 内存信息卡片 -->
      <div class="info-card-wrapper">
        <t-card :title="$t('page.monitor.memory_info')" :bordered="false">
          <div v-if="loading" class="loading-container">
            <t-loading size="large" />
            <p>{{ $t('page.monitor.loading_data') }}</p>
          </div>
          <div v-else-if="error" class="error-container">
            <t-alert theme="error" :message="$t('page.monitor.load_failed')" />
            <t-button theme="primary" @click="refreshData" style="margin-top: 8px;">
              {{ $t('page.monitor.retry') }}
            </t-button>
          </div>
          <div v-else class="info-content">
            <div class="info-item">
              <span class="label">{{ $t('page.monitor.total_memory') }}:</span>
              <span class="value">{{ systemInfo.memory.total || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">{{ $t('page.monitor.available_memory') }}:</span>
              <span class="value">{{ systemInfo.memory.available || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">{{ $t('page.monitor.used_memory') }}:</span>
              <span class="value">{{ systemInfo.memory.used || '-' }}</span>
            </div>
            <div class="usage-item">
              <span class="label">{{ $t('page.monitor.memory_usage') }}:</span>
              <t-progress
                :percentage="systemInfo.memory.usage_percent || 0"
                :color="getUsageColor(systemInfo.memory.usage_percent)"
                :label="true"
                style="margin-top: 8px;"
              />
            </div>
            <div class="info-item" style="margin-top: 16px;">
              <span class="label">{{ $t('page.monitor.jvm_memory') }}:</span>
              <span class="value">{{ systemInfo.memory.jvm_used || '-' }}</span>
            </div>
            <div class="usage-item">
              <span class="label">{{ $t('page.monitor.jvm_usage') }}:</span>
              <t-progress
                :percentage="systemInfo.memory.jvm_percent || 0"
                :color="getUsageColor(systemInfo.memory.jvm_percent)"
                :label="true"
                style="margin-top: 8px;"
              />
            </div>
          </div>
        </t-card>
      </div>
    </div>

    <!-- 磁盘信息表格 -->
    <div style="margin-top: 16px;">
      <t-card :title="$t('page.monitor.disk_info')" :bordered="false">
        <div v-if="loading" class="loading-container">
          <t-loading size="large" />
          <p>{{ $t('page.monitor.loading_data') }}</p>
        </div>
        <div v-else-if="error" class="error-container">
          <t-alert theme="error" :message="$t('page.monitor.load_failed')" />
          <t-button theme="primary" @click="refreshData" style="margin-top: 8px;">
            {{ $t('page.monitor.retry') }}
          </t-button>
        </div>
        <div v-else>
          <t-table
            :data="systemInfo.disk"
            :columns="diskColumns"
            row-key="file_system"
            :hover="true"
            :stripe="true"
          />
        </div>
      </t-card>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { RefreshIcon } from 'tdesign-icons-vue';
import { getSystemMonitorApi } from '@/apis/monitor';
import { mapGetters, mapMutations } from 'vuex';

export default Vue.extend({
  name: 'SystemMonitor',
  components: {
    RefreshIcon,
  },
  data() {
    return {
      loading: false,
      error: false,
      autoRefresh: false,
      refreshTimer: null,
      // 磁盘表格列配置
      diskColumns: [
        {
          colKey: 'file_system',
          title: this.$t('page.monitor.file_system'),
          width: 120,
          align: 'center'
        },
        {
          colKey: 'mount_point',
          title: this.$t('page.monitor.mount_point'),
          width: 120,
          align: 'center'
        },
        {
          colKey: 'total',
          title: this.$t('page.monitor.total_space'),
          width: 120,
          align: 'center'
        },
        {
          colKey: 'available',
          title: this.$t('page.monitor.available_space'),
          width: 120,
          align: 'center'
        },
        {
          colKey: 'used',
          title: this.$t('page.monitor.used_space'),
          width: 120,
          align: 'center'
        },
        {
          colKey: 'usage_percent',
          title: this.$t('page.monitor.disk_usage'),
          width: 200,
          align: 'center',
          cell: (h, { row }) => {
            return h('t-progress', {
              props: {
                percentage: row.usage_percent || 0,
                color: this.getUsageColor(row.usage_percent),
                label: true
              }
            });
          }
        }
      ]
    };
  },
  computed: {
    ...mapGetters('stats', ['getCurrentSystemMonitor']),
    systemInfo() {
      return this.getCurrentSystemMonitor || {
        cpu: {
          model_name: '',
          cores: 0,
          usage_percent: 0,
          physical_cnt: 0,
          logical_cnt: 0
        },
        memory: {
          total: '',
          available: '',
          used: '',
          usage_percent: 0,
          jvm_used: '',
          jvm_percent: 0
        },
        disk: []
      };
    }
  },
  mounted() {
    this.fetchSystemInfo();
  },
  beforeDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  },
  methods: {
    ...mapMutations('stats', ['setSystemMonitor']),

    // 获取系统监控数据
    fetchSystemInfo() {
      let that = this;
      this.loading = true;
      this.error = false;
      getSystemMonitorApi()
        .then((res) => {
          let resdata = res;
          console.log(resdata);
          if (resdata.code === 0) {
            // 将数据存储到Vuex store
            that.setSystemMonitor(resdata.data);
          } else {
            that.error = true;
            that.$message.error(resdata.msg || '获取系统监控数据失败');
          }
        })
        .catch((e: Error) => {
          console.log(e);
          that.error = true;
          that.$message.error('获取系统监控数据失败');
        })
        .finally(() => {
          that.loading = false;
        });
    },

    // 刷新数据
    refreshData() {
      this.fetchSystemInfo();
    },

    // 处理自动刷新开关
    handleAutoRefreshChange(value) {
      if (value) {
        // 开启自动刷新，每30秒刷新一次
        this.refreshTimer = setInterval(() => {
          this.fetchSystemInfo();
        }, 30000);
      } else {
        // 关闭自动刷新
        if (this.refreshTimer) {
          clearInterval(this.refreshTimer);
          this.refreshTimer = null;
        }
      }
    },

    // 根据使用率获取颜色
    getUsageColor(percentage) {
      if (percentage >= 90) return '#e34d59';  // 红色
      if (percentage >= 70) return '#ed7b2f';  // 橙色
      if (percentage >= 50) return '#f2bd27';  // 黄色
      return '#00a870';  // 绿色
    }
  }
});
</script>

<style scoped>
.monitor-container {
  padding: 16px;
}

/* Flexbox布局容器 */
.system-info-container {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: stretch; /* 让子元素拉伸到相同高度 */
}

/* 信息卡片包装器 */
.info-card-wrapper {
  flex: 1;
  min-width: 300px; /* 最小宽度，确保在小屏幕上不会太窄 */
  display: flex; /* 让卡片包装器也使用flex */
  flex-direction: column; /* 垂直方向 */
}

/* 让TDesign卡片占满容器高度 */
.info-card-wrapper .t-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 让卡片内容区域自动扩展 */
.info-card-wrapper .t-card /deep/ .t-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 响应式：在小屏幕上堆叠显示 */
@media (max-width: 768px) {
  .system-info-container {
    flex-direction: column;
    align-items: normal; /* 小屏幕上取消拉伸 */
  }

  .info-card-wrapper {
    min-width: auto;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.error-container {
  text-align: center;
  padding: 20px 0;
}

.info-content {
  padding: 8px 0;
  flex: 1; /* 让内容区域占满剩余空间 */
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* 内容均匀分布 */
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.usage-item {
  margin-bottom: 16px;
}

.label {
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.value {
  color: var(--td-text-color-secondary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}
</style>
