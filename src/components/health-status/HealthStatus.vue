<template>
  <div>
    <!-- 负载均衡模式 -->
    <div v-if="isLoadBalance">
      <load-balance-status 
        v-if="healthyStatus && healthyStatus.length > 0" 
        :healthyStatusList="healthyStatus"
      />
      <t-tag v-else theme="default" variant="light">{{ $t('page.host.healthy_status_unknown') }}</t-tag>
    </div>
    
    <!-- 单服务器模式 -->
    <div v-else>
      <single-server-status 
        v-if="healthyStatus && healthyStatus.length > 0" 
        :healthyStatus="healthyStatus[0]"
      />
      <t-tag v-else theme="default" variant="light">{{ $t('page.host.healthy_status_unknown') }}</t-tag>
    </div>
  </div>
</template>

<script>
import SingleServerStatus from './SingleServerStatus.vue';
import LoadBalanceStatus from './LoadBalanceStatus.vue';

export default {
  name: 'HealthStatus',
  components: {
    SingleServerStatus,
    LoadBalanceStatus
  },
  props: {
    healthyStatus: {
      type: [Array, Object],
      default: () => []
    },
    isLoadBalance: {
      type: Boolean,
      default: false
    }
  }
}
</script>