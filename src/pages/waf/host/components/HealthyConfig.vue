<template>
  <div class="healthy-config">
    <t-form-item :label="$t('page.host.health_check.is_enable_healthy')">
      <t-radio-group v-model="localHealthyConfig.is_enable_healthy" @change="updateParent">
        <t-radio value="0">{{ $t('common.off') }}</t-radio>
        <t-radio value="1">{{ $t('common.on') }}</t-radio>
      </t-radio-group>
    </t-form-item>
    <t-form-item v-if="localHealthyConfig.is_enable_healthy != '1'">
      <t-alert theme="info" :message="$t('page.host.health_check.test_scheduled_off')" />
    </t-form-item>

    <t-form-item :label="$t('page.host.health_check.fail_count')">
      <t-tooltip :content="$t('page.host.health_check.fail_count_tips')" placement="top" show-arrow>
        <t-input-number v-model="localHealthyConfig.fail_count" @change="updateParent" :min="1" :max="10"
                        :style="{ width: '150px' }" />
      </t-tooltip>
    </t-form-item>
    <t-form-item :label="$t('page.host.health_check.success_count')">
      <t-tooltip :content="$t('page.host.health_check.success_count_tips')" placement="top" show-arrow>
        <t-input-number v-model="localHealthyConfig.success_count" @change="updateParent" :min="1" :max="10"
                        :style="{ width: '150px' }" />
      </t-tooltip>
    </t-form-item>
    <t-form-item :label="$t('page.host.health_check.response_time')">
      <t-tooltip :content="$t('page.host.health_check.response_time_tips')" placement="top" show-arrow>
        <t-input-number v-model="localHealthyConfig.response_time" @change="updateParent" :min="1" :max="120"
                        :style="{ width: '150px' }" />
      </t-tooltip>
      <span class="healthy-unit">{{ $t('page.host.health_check.seconds') }}</span>
    </t-form-item>
    <t-form-item :label="$t('page.host.health_check.check_method')">
      <t-select v-model="localHealthyConfig.check_method" @change="updateParent" :style="{ width: '150px' }">
        <t-option value="GET">GET</t-option>
        <t-option value="HEAD">HEAD</t-option>
      </t-select>
    </t-form-item>
    <t-form-item :label="$t('page.host.health_check.check_path')">
      <t-input class="healthy-text-input" v-model="localHealthyConfig.check_path" @change="updateParent"
               :placeholder="$t('page.host.health_check.check_path_placeholder')" />
    </t-form-item>
    <t-form-item :label="$t('page.host.health_check.expected_codes')">
      <t-input class="healthy-text-input" v-model="localHealthyConfig.expected_codes" @change="updateParent"
               :placeholder="$t('page.host.health_check.expected_codes_placeholder')" />
    </t-form-item>
    <t-form-item>
      <div class="healthy-test">
        <t-button theme="primary" variant="outline" type="button" :loading="testLoading" :disabled="testLoading"
                  @click="testCurrentConfig">{{ $t('page.host.health_check.test_button') }}</t-button>
        <p class="healthy-help">{{ $t('page.host.health_check.test_help') }}</p>
        <p v-if="loadBalanceEnabled" class="healthy-help">{{ $t('page.host.health_check.test_saved_backends') }}</p>
        <t-alert v-if="testStale" theme="warning" :message="$t('page.host.health_check.test_stale')" />
        <t-alert v-if="testError" theme="error" :message="testError" />
        <p v-if="testLoading || testResults.length" aria-live="polite">
          {{ $t(testLoading ? 'page.host.health_check.test_progress' : 'page.host.health_check.test_complete',
                { count: testResults.length, total: testTotal }) }}
        </p>
        <div v-for="(result, index) in testResults" :key="index" class="healthy-result">
          <div class="healthy-result-heading">
            <strong>{{ backendAddress(result) }}</strong>
            <t-tag :theme="outcomeTheme(result.outcome)" variant="light">
              {{ $t('page.host.health_check.test_' + result.outcome) }}
            </t-tag>
          </div>
          <dl>
            <dt>{{ $t('page.host.health_check.test_dial_address') }}</dt><dd>{{ result.dial_address || '-' }}</dd>
            <dt>{{ $t('page.host.health_check.test_url') }}</dt><dd>{{ result.method }} {{ result.url || '-' }}</dd>
            <dt>{{ $t('page.host.health_check.test_request_host') }}</dt><dd>{{ result.request_host || '-' }}</dd>
            <dt>{{ $t('page.host.health_check.expected_codes') }}</dt><dd>{{ testExpectedCodes || $t('page.host.health_check.test_default_codes') }}</dd>
            <dt>{{ $t('page.host.health_check.test_actual_code') }}</dt><dd>{{ result.status_code || '-' }}</dd>
            <dt>{{ $t('page.host.health_check.test_elapsed') }}</dt><dd>{{ result.elapsed_ms }} ms</dd>
            <template v-if="result.error_reason">
              <dt>{{ $t('page.host.health_check.test_reason') }}</dt><dd>{{ result.error_reason }}</dd>
            </template>
          </dl>
        </div>
      </div>
    </t-form-item>
  </div>
</template>

<script lang="ts">
export default {
  name: 'HealthyConfig',
  props: {
    healthyConfig: { type: Object, required: true },
    testLoading: { type: Boolean, default: false },
    testResults: { type: Array, default: () => [] },
    testTotal: { type: Number, default: 0 },
    testStale: { type: Boolean, default: false },
    testError: { type: String, default: '' },
    testExpectedCodes: { type: String, default: '' },
    loadBalanceEnabled: { type: Boolean, default: false }
  },
  data() {
    return { localHealthyConfig: JSON.parse(JSON.stringify(this.healthyConfig)) };
  },
  watch: {
    healthyConfig: {
      handler(newVal) {
        this.localHealthyConfig = JSON.parse(JSON.stringify(newVal));
        this.localHealthyConfig.is_enable_healthy = String(this.localHealthyConfig.is_enable_healthy);
      },
      immediate: true
    }
  },
  methods: {
    updateParent() {
      this.$emit('update', JSON.parse(JSON.stringify(this.localHealthyConfig)));
    },
    testCurrentConfig() {
      if (!this.testLoading) this.$emit('test', JSON.parse(JSON.stringify(this.localHealthyConfig)));
    },
    backendAddress(result) {
      if (result.dial_address) return result.dial_address;
      const ip = result.back_ip;
      if (!ip) return this.$t('page.host.health_check.test_backend');
      if (!result.back_port) return ip;
      const host = ip.includes(':') && !ip.startsWith('[') ? `[${ip}]` : ip;
      return `${host}:${result.back_port}`;
    },
    outcomeTheme(outcome) {
      return { passed: 'success', failed: 'danger', skipped: 'warning' }[outcome] || 'default';
    }
  }
};
</script>

<style scoped>
.healthy-unit { margin-left: 8px; }
.healthy-text-input, .healthy-test { width: 480px; max-width: 100%; }
.healthy-help { color: var(--td-text-color-secondary); margin: 8px 0; line-height: 1.6; }
.healthy-test .t-alert { margin-top: 10px; }
.healthy-result { border: 1px solid var(--td-component-border); border-radius: 6px; padding: 12px; margin-top: 12px; }
.healthy-result-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; overflow-wrap: anywhere; }
.healthy-result dl { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 6px 12px; margin: 12px 0 0; }
.healthy-result dt { color: var(--td-text-color-secondary); }
.healthy-result dd { margin: 0; overflow-wrap: anywhere; white-space: pre-wrap; }
@media (max-width: 600px) {
  .healthy-result dl { grid-template-columns: 1fr; gap: 4px; }
  .healthy-result dd { margin-bottom: 6px; }
}
</style>
