<template>
  <div class="transport-config">
    <t-form-item :label="$t('page.host.transport.max_idle_conns')">
      <t-tooltip class="placement top center" :content="$t('page.host.transport.max_idle_conns_tips')" placement="top"
                 :overlay-style="{ width: '200px' }" show-arrow>
        <t-input-number :style="{ width: '150px' }"
                        v-model="localTransportConfig.max_idle_conns"
                        @change="updateParent"
                        :min="0" 
                        :placeholder="$t('page.host.transport.max_idle_conns_placeholder')">
        </t-input-number>
      </t-tooltip>
    </t-form-item>

    <t-form-item :label="$t('page.host.transport.max_idle_conns_per_host')">
      <t-tooltip class="placement top center" :content="$t('page.host.transport.max_idle_conns_per_host_tips')" placement="top"
                 :overlay-style="{ width: '200px' }" show-arrow>
        <t-input-number :style="{ width: '150px' }"
                        v-model="localTransportConfig.max_idle_conns_per_host"
                        @change="updateParent"
                        :min="0" 
                        :placeholder="$t('page.host.transport.max_idle_conns_per_host_placeholder')">
        </t-input-number>
      </t-tooltip>
    </t-form-item>

    <t-form-item :label="$t('page.host.transport.max_conns_per_host')">
      <t-tooltip class="placement top center" :content="$t('page.host.transport.max_conns_per_host_tips')" placement="top"
                 :overlay-style="{ width: '200px' }" show-arrow>
        <t-input-number :style="{ width: '150px' }"
                        v-model="localTransportConfig.max_conns_per_host"
                        @change="updateParent"
                        :min="0" 
                        :placeholder="$t('page.host.transport.max_conns_per_host_placeholder')">
        </t-input-number>
      </t-tooltip>
    </t-form-item>

    <t-form-item :label="$t('page.host.transport.idle_conn_timeout')">
      <t-tooltip class="placement top center" :content="$t('page.host.transport.idle_conn_timeout_tips')" placement="top"
                 :overlay-style="{ width: '200px' }" show-arrow>
        <t-input-number :style="{ width: '150px' }"
                        v-model="localTransportConfig.idle_conn_timeout"
                        @change="updateParent"
                        :min="0" 
                        :placeholder="$t('page.host.transport.idle_conn_timeout_placeholder')">
        </t-input-number>
        <span class="unit-text">{{ $t('common.seconds') }}</span>
      </t-tooltip>
    </t-form-item>

    <t-form-item :label="$t('page.host.transport.tls_handshake_timeout')">
      <t-tooltip class="placement top center" :content="$t('page.host.transport.tls_handshake_timeout_tips')" placement="top"
                 :overlay-style="{ width: '200px' }" show-arrow>
        <t-input-number :style="{ width: '150px' }"
                        v-model="localTransportConfig.tls_handshake_timeout"
                        @change="updateParent"
                        :min="0" 
                        :placeholder="$t('page.host.transport.tls_handshake_timeout_placeholder')">
        </t-input-number>
        <span class="unit-text">{{ $t('common.seconds') }}</span>
      </t-tooltip>
    </t-form-item>

    <t-form-item :label="$t('page.host.transport.expect_continue_timeout')">
      <t-tooltip class="placement top center" :content="$t('page.host.transport.expect_continue_timeout_tips')" placement="top"
                 :overlay-style="{ width: '200px' }" show-arrow>
        <t-input-number :style="{ width: '150px' }"
                        v-model="localTransportConfig.expect_continue_timeout"
                        @change="updateParent"
                        :min="0" 
                        :placeholder="$t('page.host.transport.expect_continue_timeout_placeholder')">
        </t-input-number>
        <span class="unit-text">{{ $t('common.seconds') }}</span>
      </t-tooltip>
    </t-form-item>

    <div class="config-note">
      <t-alert theme="info" :message="$t('page.host.transport.config_note')" />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'TransportConfig',
  props: {
    transportConfig: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      // 创建一个本地副本，避免直接修改props
      localTransportConfig: JSON.parse(JSON.stringify(this.transportConfig))
    };
  },
  watch: {
    // 当父组件传入的配置变化时更新本地数据
    transportConfig: {
      handler(newVal) {
        // 避免直接引用，使用深拷贝
        this.localTransportConfig = JSON.parse(JSON.stringify(newVal));
        // 确保所有字段都有默认值
        if (!this.localTransportConfig.max_idle_conns) {
          this.localTransportConfig.max_idle_conns = 0;
        }
        if (!this.localTransportConfig.max_idle_conns_per_host) {
          this.localTransportConfig.max_idle_conns_per_host = 0;
        }
        if (!this.localTransportConfig.max_conns_per_host) {
          this.localTransportConfig.max_conns_per_host = 0;
        }
        if (!this.localTransportConfig.idle_conn_timeout) {
          this.localTransportConfig.idle_conn_timeout = 0;
        }
        if (!this.localTransportConfig.tls_handshake_timeout) {
          this.localTransportConfig.tls_handshake_timeout = 0;
        }
        if (!this.localTransportConfig.expect_continue_timeout) {
          this.localTransportConfig.expect_continue_timeout = 0;
        }
      },
      immediate: true
    }
  },
  methods: {
    // 当本地数据变化时通知父组件
    updateParent() {
      console.log("TransportConfig", JSON.parse(JSON.stringify(this.localTransportConfig)))
      // 创建新对象避免直接修改props
      this.$emit('update', JSON.parse(JSON.stringify(this.localTransportConfig)));
    }
  }
};
</script>

<style lang="less" scoped>
.transport-config {
  .unit-text {
    margin-left: 8px;
    font-size: 12px;
    color: var(--td-text-color-secondary);
  }
  
  .config-note {
    margin-top: 16px;
  }
}
</style>