<template>
  <t-popup
    expand-animation
    placement="bottom-right"
    trigger="hover"
    :visible="isMonitorVisible"
    @visible-change="onPopupVisibleChange"
  >
    <template #content>
      <div class="system-monitor-panel">
        <div class="monitor-header">
          <p>{{ $t('topNav.system_monitor')  }}</p>
          <t-button
            v-if="!loading"
            class="refresh-btn"
            variant="text"
            theme="primary"
            @click="refreshData"
            :loading="loading"
          >
            <template #icon><refresh-icon /></template>
            {{ $t('common.refresh')}}
          </t-button>
        </div>

        <!-- 监控内容区域 - 始终显示，加载时显示加载状态 -->
        <div class="monitor-content" :class="{ 'loading-state': loading }">
          <!-- 错误状态 -->
          <div v-if="error && !loading" class="monitor-error">
            <span>{{ $t('topNav.load_failed')  }}</span>
            <t-button size="small" theme="primary" @click="refreshData">
              {{ $t('topNav.retry') }}
            </t-button>
          </div>

          <!-- 监控数据内容 - 始终显示 -->
          <div class="monitor-data" :class="{ 'data-loading': loading }">
            <!-- 运行环境：数据库 / 缓存（含连接目标与切换方式） -->
            <div class="env-section">
              <div class="section-title">{{ $t('topNav.runtime_env') }}</div>
              <div class="env-row">
                <span class="item-label">{{ $t('topNav.runtime_db') }}</span>
                <span class="item-value">{{ dbDetail }}</span>
              </div>
              <div class="env-row">
                <span class="item-label">{{ $t('topNav.runtime_cache') }}</span>
                <span class="item-value">{{ cacheDetail }}</span>
              </div>
              <div class="env-tip">
                <div>{{ $t('topNav.runtime_switch_tip') }}</div>
                <div class="env-migrate">
                  {{ $t('topNav.runtime_migrate_tip') }}
                  <t-link theme="primary" hover="color" @click="openWechat">{{ $t('topNav.wechat_account_name') }}</t-link>
                </div>
              </div>
            </div>

            <!-- CPU信息 -->
            <div class="monitor-item">
              <div class="item-header">
                <span class="item-label">CPU</span>
                <span class="item-value" :style="{ color: getUsageColor(getCpuUsageLocal()) }">{{ getCpuUsageLocal() }}%</span>
              </div>
              <t-progress
                :percentage="getCpuUsageLocal()"
                :color="getUsageColor(getCpuUsageLocal())"
                size="small"
                :show-text="false"
              />
            </div>

            <!-- 内存信息 -->
            <div class="monitor-item">
              <div class="item-header">
                <span class="item-label">{{ $t('topNav.memory') }}</span>
                <span class="item-value" :style="{ color: getUsageColor(getMemoryUsageLocal()) }">{{ getMemoryUsageLocal() }}%</span>
              </div>
              <t-progress
                :percentage="getMemoryUsageLocal()"
                :color="getUsageColor(getMemoryUsageLocal())"
                size="small"
                :show-text="false"
              />
            </div>

            <!-- 磁盘信息 -->
            <div class="disk-section" v-if="getDiskListLocal().length > 0">
              <div class="section-title">{{ $t('topNav.disk') }}</div>
              <div class="disk-list">
                <div
                  v-for="disk in getDiskListLocal()"
                  :key="disk.mount_point || disk.file_system"
                  class="disk-item"
                >
                  <div class="item-header">
                    <span class="item-label">{{ disk.mount_point || disk.file_system }}</span>
                    <span class="item-value" :style="{ color: getUsageColor(getDiskUsage(disk)) }">{{ getDiskUsage(disk) }}%</span>
                  </div>
                  <t-progress
                    :percentage="getDiskUsage(disk)"
                    :color="getUsageColor(getDiskUsage(disk))"
                    size="small"
                    :show-text="false"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="monitor-footer">
          <t-button
            class="detail-btn"
            variant="text"
            theme="primary"
            @click="goToMonitorPage"
          >
            {{ $t('topNav.view_details') }}
          </t-button>
        </div>
      </div>
    </template>

    <!-- 触发器 - 直观显示系统状态 -->
    <div class="system-monitor-trigger" @click="isMonitorVisible = true">
      <!-- 系统整体状态灯（绿/黄/橙/红，悬浮查看含义） -->
      <div class="status-indicator" :class="getOverallStatusClass()" :title="$t('topNav.overall_status')"></div>
      <div class="monitor-display">
        <div class="monitor-item-inline">
          <span class="label">CPU</span>
          <span class="value" :style="{ color: getUsageColor(getCpuUsageLocal()) }">
            {{ getCpuUsageLocal() }}%
          </span>
        </div>
        <div class="monitor-item-inline">
          <span class="label">{{ $t('topNav.memory') }}</span>
          <span class="value" :style="{ color: getUsageColor(getMemoryUsageLocal()) }">
            {{ getMemoryUsageLocal() }}%
          </span>
        </div>
        <div class="monitor-item-inline" v-if="getAverageDiskUsageLocal() > 0">
  <span class="label">{{ $t('topNav.disk') }}</span>
  <span class="value" :style="{ color: getUsageColor(getAverageDiskUsageLocal()) }">
    {{ getAverageDiskUsageLocal() }}%
  </span>
</div>
        <!-- 数据库 / 缓存（仅显示类型，详情见悬浮面板） -->
        <div class="monitor-item-inline">
          <span class="label">{{ $t('topNav.runtime_db') }}</span>
          <span class="value env-text">{{ dbLabel }}</span>
        </div>
        <div class="monitor-item-inline">
          <span class="label">{{ $t('topNav.runtime_cache') }}</span>
          <span class="value env-text">{{ cacheLabel }}</span>
        </div>
      </div>
    </div>
  </t-popup>
</template>

<script lang="ts">
import Vue from 'vue';
import { RefreshIcon, DashboardIcon } from 'tdesign-icons-vue';
import { getSystemMonitorApi } from '@/apis/monitor';
import { mapGetters, mapMutations } from 'vuex';

// 后端 database.driver 取值 -> 展示名。
// 不能用「不是 mysql 就当 sqlite」的兜底：新增 postgres 后会被误显示成 SQLite。
// 未知 driver 直接原样显示，比错报一个数据库名要好。
const DB_DRIVER_LABELS = {
  sqlite: 'SQLite',
  mysql: 'MySQL',
  postgres: 'PostgreSQL',
};

export default Vue.extend({
  name: 'SystemMonitor',
  components: {
    RefreshIcon,
    DashboardIcon,
  },
  data() {
    return {
      loading: false,
      error: false,
      refreshTimer: null,
      isMonitorVisible: false,
    };
  },
  computed: {
    ...mapGetters('stats', [
      'getCurrentSystemMonitor',
      'getCpuUsage',
      'getMemoryUsage',
      'getDiskList',
      'getAverageDiskUsage'
    ]),
    systemInfo() {
      return this.getCurrentSystemMonitor || {
        cpu: { usage_percent: 0 },
        memory: { usage_percent: 0 },
        disk: []
      };
    },
    // 运行环境（来自 sysparams store）
    runtimeDb() {
      return this.$store.state.sysparams?.database || { driver: '' };
    },
    runtimeCache() {
      return this.$store.state.sysparams?.cache || { type: '' };
    },
    dbLabel() {
      const d = this.runtimeDb;
      if (!d.driver) return '-';
      return DB_DRIVER_LABELS[d.driver] || d.driver;
    },
    cacheLabel() {
      const c = this.runtimeCache;
      if (c.type === 'redis') return 'Redis';
      if (!c.type) return '-';
      return 'Memory';
    },
    dbDetail() {
      const d = this.runtimeDb;
      if (!d.driver) return '-';
      const name = DB_DRIVER_LABELS[d.driver] || d.driver;
      // 服务端数据库(mysql/postgres)才有 host/port，sqlite 是本地文件
      return d.host ? `${name} (${d.host}:${d.port})` : name;
    },
    cacheDetail() {
      const c = this.runtimeCache;
      if (c.type === 'redis') return c.host ? `Redis (${c.host}:${c.port})` : 'Redis';
      if (!c.type) return '-';
      return 'Memory';
    }
  },
  mounted() {
    this.fetchSystemInfo();/**
    // 每10秒自动刷新一次
    this.refreshTimer = setInterval(() => {
      this.fetchSystemInfo();
    }, 10*1000);*/
  },
  beforeDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  },
  methods: {
    ...mapMutations('stats', ['setSystemMonitor']),

    onPopupVisibleChange(visible: boolean, context) {
      if (context.trigger === 'trigger-element-click') {
        this.isMonitorVisible = true;
        return;
      }
      this.isMonitorVisible = visible;
    },

    // 获取系统监控数据
    fetchSystemInfo() {
      let that = this;
      this.loading = true;
      this.error = false;
      getSystemMonitorApi()
        .then((res) => {
          console.log('SystemMonitor API Response:', res);
          if (res.code === 0) {
            // 将数据存储到Vuex store
            that.setSystemMonitor(res.data);
            console.log('SystemMonitor Data stored to Vuex:', res.data);
          } else {
            that.error = true;
            console.error('SystemMonitor API Error:', res.msg);
          }
        })
        .catch((e) => {
          console.error('SystemMonitor API Exception:', e);
          that.error = true;
        })
        .finally(() => {
          that.loading = false;
        });
    },

    // 获取CPU使用率
    getCpuUsageLocal() {
      return Math.round(this.getCpuUsage);
    },

    // 获取内存使用率
    getMemoryUsageLocal() {
      return Math.round(this.getMemoryUsage);
    },

    // 获取磁盘列表
    getDiskListLocal() {
      return this.getDiskList;
    },

    // 获取磁盘使用率
    getDiskUsage(disk) {
      return Math.round(disk.usage_percent || 0);
    },

    // 刷新数据
    refreshData() {
      this.fetchSystemInfo();
    },

    // 跳转到监控页面
    goToMonitorPage() {
      this.$router.push('/dashboard/stats');
      this.isMonitorVisible = false; // 关闭弹窗
    },

    // 打开微信公众号二维码（复用头部的二维码弹窗）
    openWechat() {
      this.isMonitorVisible = false;
      this.$emit('open-wechat');
    },

    // 根据使用率获取颜色
    getUsageColor(percentage) {
      if (percentage >= 90) return '#e34d59';  // 红色
      if (percentage >= 70) return '#ed7b2f';  // 橙色
      if (percentage >= 50) return '#f2bd27';  // 黄色
      return '#00a870';  // 绿色
    },

    // 获取平均磁盘使用率
    getAverageDiskUsageLocal() {
      return Math.round(this.getAverageDiskUsage);
    },

    // 获取整体状态类
    getOverallStatusClass() {
      const maxUsage = Math.max(this.getCpuUsageLocal(), this.getMemoryUsageLocal(), this.getAverageDiskUsageLocal());
      if (maxUsage >= 90) return 'overall-critical';
      if (maxUsage >= 70) return 'overall-warning';
      if (maxUsage >= 50) return 'overall-caution';
      return 'overall-normal';
    }
  }
});
</script>

<style lang="less" scoped>
@import '@/style/variables.less';

/* 系统监控面板样式 */
.system-monitor-panel {
  width: 400px;
  height: 450px;

  .monitor-header {
    position: relative;
    height: 56px;
    font-size: 16px;
    color: var(--td-text-color-primary);
    text-align: center;
    line-height: 56px;
    border-bottom: 1px solid var(--td-component-border);

    .refresh-btn {
      position: absolute;
      top: 12px;
      right: 16px;
    }
  }

  .monitor-loading,
  .monitor-error {
    height: calc(100% - 104px);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--td-text-color-secondary);
    font-size: 14px;
    flex-direction: column;
  }

  .monitor-content {
    padding: 16px;
    height: calc(100% - 104px);
    overflow-y: auto;
    position: relative;

    &.loading-state {
      .monitor-data {
        opacity: 0.6;
        pointer-events: none;
      }
    }
  }

  .monitor-loading-indicator {
    position: absolute;
    top: 8px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--td-text-color-secondary);
    font-size: 12px;
    z-index: 10;
    background: var(--td-bg-color-container);
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid var(--td-border-level-1-color);
  }

  .monitor-error {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--td-text-color-secondary);
    font-size: 14px;
    flex-direction: column;
    z-index: 10;
  }

  .monitor-data {
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition: opacity 0.3s ease;

    &.data-loading {
      opacity: 0.6;
    }
  }

  .monitor-footer {
    height: 48px;
    align-items: center;
    display: flex;
    justify-content: center;
    border-top: 1px solid var(--td-component-border);

    .detail-btn {
      text-decoration: none;
      font-size: 14px;
      color: var(--td-brand-color);
      line-height: 48px;
      cursor: pointer;
    }
  }
}

/* 运行环境区（数据库/缓存）样式 */
.env-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--td-component-border);

  .section-title {
    font-size: 14px;
    color: var(--td-text-color-secondary);
    font-weight: 500;
  }

  .env-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .env-tip {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
    line-height: 1.5;

    .env-migrate {
      margin-top: 4px;
    }
  }
}

/* 触发器内联的数据库/缓存文本（非百分比，取消等宽右对齐与最小宽度） */
.monitor-item-inline .value.env-text {
  font-family: inherit;
  min-width: 0;
  text-align: left;
  color: var(--td-text-color-primary);
}

/* 监控项样式 */
.monitor-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-label {
  font-size: 14px;
  color: var(--td-text-color-secondary);
  font-weight: 500;
}

.item-value {
  font-size: 14px;
  color: var(--td-text-color-primary);
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.disk-section {
  .section-title {
    font-size: 14px;
    color: var(--td-text-color-secondary);
    font-weight: 500;
    margin-bottom: 12px;
  }

  .disk-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .disk-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
}

/* 触发器样式 */
.system-monitor-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-border-level-1-color);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 180px;

  &:hover {
    background: var(--td-bg-color-container-hover);
    border-color: var(--td-border-level-2-color);
  }
}

.monitor-display {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.monitor-item-inline {
  display: flex;
  align-items: center;
  gap: 4px;

  .label {
    font-size: 11px;
    color: var(--td-text-color-secondary);
    font-weight: 500;
  }

  .value {
    font-size: 12px;
    font-weight: 600;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    min-width: 28px;
    text-align: right;
  }
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.overall-normal {
    background: #00a870;
  }

  &.overall-caution {
    background: #f2bd27;
  }

  &.overall-warning {
    background: #ed7b2f;
  }

  &.overall-critical {
    background: #e34d59;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .system-monitor-trigger {
    min-width: 120px;
  }

  .monitor-display {
    gap: 8px;
  }

  .monitor-item-inline .label {
    font-size: 10px;
  }

  .monitor-item-inline .value {
    font-size: 11px;
    min-width: 24px;
  }

  .system-monitor-panel {
    width: 320px;
    height: 400px;
  }
}
</style>
