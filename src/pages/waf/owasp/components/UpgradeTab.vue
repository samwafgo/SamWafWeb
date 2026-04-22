<template>
  <div>
    <t-alert theme="warning" :message="$t('page.owasp.upgrade.alert_message')" close />
    <t-descriptions :column="1" bordered>
      <t-descriptions-item :label="$t('page.owasp.upgrade.current_version')">
        {{ info.current_version || '-' }}
      </t-descriptions-item>
      <t-descriptions-item :label="$t('page.owasp.upgrade.latest_version')">
        {{ info.latest_version || '-' }}
      </t-descriptions-item>
      <t-descriptions-item :label="$t('page.owasp.upgrade.need_update')">
        <t-tag v-if="info.need_update" theme="warning" variant="light">{{ $t('page.owasp.upgrade.yes') }}</t-tag>
        <t-tag v-else theme="success" variant="light">{{ $t('page.owasp.upgrade.no') }}</t-tag>
      </t-descriptions-item>
      <t-descriptions-item :label="$t('page.owasp.upgrade.last_check_at')">
        {{ info.last_check_at || '-' }}
      </t-descriptions-item>
      <t-descriptions-item :label="$t('page.owasp.upgrade.changelog')">
        <pre class="changelog">{{ info.changelog || '-' }}</pre>
      </t-descriptions-item>
    </t-descriptions>

    <div style="margin-top:16px">
      <t-button theme="primary" :loading="checking" @click="onCheck">
        {{ $t('page.owasp.upgrade.check') }}
      </t-button>
      <t-button theme="warning" :disabled="!info.need_update" :loading="applying" @click="onApply">
        {{ $t('page.owasp.upgrade.apply') }}
      </t-button>
    </div>

    <t-alert
      v-if="applying"
      style="margin-top:16px"
      theme="info"
      :message="$t('page.owasp.upgrade.applying_tip')"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { owaspUpdateCheckApi, owaspUpdateApplyApi } from '@/apis/owasp';

export default Vue.extend({
  name: 'OwaspUpgradeTab',
  data() {
    return {
      info: {
        current_version: '',
        latest_version: '',
        need_update: false,
        last_check_at: '',
        changelog: '',
      },
      checking: false,
      applying: false,
    };
  },
  mounted() {
    this.onCheck();
  },
  methods: {
    onCheck() {
      this.checking = true;
      owaspUpdateCheckApi()
        .then((res) => {
          if (res.code === 0) {
            this.info = { ...this.info, ...res.data };
          } else {
            this.$message.warning(res.msg);
          }
        })
        .finally(() => (this.checking = false));
    },
    onApply() {
      this.applying = true;
      owaspUpdateApplyApi()
        .then((res) => {
          if (res.code === 0) {
            this.$message.success(res.msg);
          } else {
            this.$message.warning(res.msg);
          }
        })
        .finally(() => {
          setTimeout(() => {
            this.applying = false;
            this.onCheck();
          }, 3000);
        });
    },
  },
});
</script>

<style lang="less" scoped>
.changelog {
  white-space: pre-wrap;
  margin: 0;
}
</style>
