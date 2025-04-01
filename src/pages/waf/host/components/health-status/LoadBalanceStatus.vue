<template>
  <div class="health-status-container">
    <t-tooltip placement="top" theme="light">

      <t-tag
        theme="primary"
        :variant="hasUnhealthyServer ? 'dark' : 'light'"
        :style="{
          backgroundColor: hasUnhealthyServer ? '#fbe9e7' : '#e8f4ff',
          color: hasUnhealthyServer ? '#e34d59' : '#00a870'
        }"
      >
        {{ unhealthyCount === 0 ? $t('page.host.healthy_status_normal')  : `${healthyStatusList.length}/${unhealthyCount}` }}

      </t-tag>
      <template #content>
        <div class="health-status-tooltip">
          <div class="tooltip-content-wrapper">
            <!-- 每个服务器的详细信息 -->
            <div v-for="(status, index) in healthyStatusList" :key="index" class="server-section">
              <div class="server-title" :class="status.IsHealthy ? 'healthy-text' : 'unhealthy-text'">
                {{ getServerInfo(status, index) }}: {{ status.IsHealthy ? $t('page.host.healthy_status_normal') : $t('page.host.healthy_status_abnormal') }}
              </div>
              <table class="status-table">
                <tr>
                  <td class="label">{{ $t('page.host.healthy_status_detail.check_time') }}</td>
                  <td class="value">{{ formatTime(status.LastCheckTime) }}</td>
                </tr>
                <tr v-if="!status.IsHealthy">
                  <td class="label">{{ $t('page.host.healthy_status_detail.success_cnt') }}</td>
                  <td class="value">{{ status.SuccessCount || 0 }}</td>
                </tr>
                <tr v-if="!status.IsHealthy">
                  <td class="label">{{ $t('page.host.healthy_status_detail.failure_cnt') }}</td>
                  <td class="value">{{ status.FailCount }}</td>
                </tr>
                <tr v-if="!status.IsHealthy && status.LastErrorReason">
                  <td class="label error-text">{{ $t('page.host.healthy_status_detail.error_reason') }}</td>
                  <td class="value error-text">{{ status.LastErrorReason }}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      </template>
    </t-tooltip>
  </div>
</template>

<script>
export default {
  name: 'LoadBalanceStatus',
  props: {
    healthyStatusList: {
      type: Array,
      required: true
    }
  },
  computed: {
    hasUnhealthyServer() {
      return this.healthyStatusList.some(status => !status.IsHealthy);
    },
    unhealthyCount() {
      return this.healthyStatusList.filter(status => !status.IsHealthy).length;
    },
    healthyCount() {
      return this.healthyStatusList.filter(status => status.IsHealthy).length;
    }
  },
  methods: {
    formatTime(time) {
      return new Date(time).toLocaleString();
    },
    getServerInfo(status, index) {
      return `${status.BackIP}:${status.BackPort}`;
    }
  }
}
</script>

<style lang="less" scoped>
.health-status-container {
  display: inline-block;
}

.health-status-tooltip {
  min-width: 400px;
}

.tooltip-content-wrapper {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 5px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #aaa;
  }
}

.section-title {
  font-weight: bold;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #eee;
}

.server-section {
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px dashed #ddd;

  &:first-child {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }
}

.server-title {
  font-weight: bold;
  margin-bottom: 8px;
}

.status-table {
  width: 100%;
  border-collapse: collapse;

  tr {
    border-bottom: 1px solid #eee;

    &:last-child {
      border-bottom: none;
    }
  }

  .label {
    padding: 6px;
    font-weight: 500;
    width: 40%;
  }

  .value {
    padding: 6px;
    text-align: right;
    width: 60%;
  }
}

.healthy-text {
  color: #00a870;
}

.unhealthy-text {
  color: #e34d59;
}

.error-text {
  color: #e34d59;
}
</style>
