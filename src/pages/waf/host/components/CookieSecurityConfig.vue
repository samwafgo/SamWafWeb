<template>
  <div class="cookie-security-config">
    <t-alert theme="info" :message="$t('page.host.cookie_security.intro')" style="margin-bottom: 16px;" />
    <t-form-item :label="$t('page.host.cookie_security.is_enable')">
      <t-radio-group v-model="local.is_enable" @change="updateParent">
        <t-radio value="0">{{ $t('page.host.cookie_security.disable') }}</t-radio>
        <t-radio value="1">{{ $t('page.host.cookie_security.enable') }}</t-radio>
      </t-radio-group>
      <t-button size="small" variant="outline" style="margin-left: 12px;" @click="applyRecommended">
        {{ $t('page.host.cookie_security.recommended') }}
      </t-button>
    </t-form-item>
    <t-form-item :label="$t('page.host.cookie_security.http_only')">
      <t-tooltip class="placement top center" :content="$t('page.host.cookie_security.http_only_tips')" placement="top"
                 :overlay-style="{ width: '320px' }" show-arrow>
        <t-radio-group v-model="local.http_only" @change="updateParent">
          <t-radio value="0">{{ $t('page.host.cookie_security.no_touch') }}</t-radio>
          <t-radio value="1">{{ $t('page.host.cookie_security.add_if_missing') }}</t-radio>
        </t-radio-group>
      </t-tooltip>
    </t-form-item>
    <t-form-item :label="$t('page.host.cookie_security.secure')">
      <t-tooltip class="placement top center" :content="$t('page.host.cookie_security.secure_tips')" placement="top"
                 :overlay-style="{ width: '340px' }" show-arrow>
        <t-select v-model="local.secure" :style="{ width: '280px' }" @change="updateParent">
          <t-option value="0" :label="$t('page.host.cookie_security.secure_0')" />
          <t-option value="2" :label="$t('page.host.cookie_security.secure_2')" />
          <t-option value="1" :label="$t('page.host.cookie_security.secure_1')" />
        </t-select>
      </t-tooltip>
    </t-form-item>
    <t-form-item :label="$t('page.host.cookie_security.same_site')">
      <t-tooltip class="placement top center" :content="$t('page.host.cookie_security.same_site_tips')" placement="top"
                 :overlay-style="{ width: '340px' }" show-arrow>
        <t-select v-model="local.same_site" :style="{ width: '280px' }" @change="updateParent">
          <t-option value="" :label="$t('page.host.cookie_security.same_site_empty')" />
          <t-option value="Lax" label="Lax" />
          <t-option value="Strict" label="Strict" />
          <t-option value="None" label="None" />
        </t-select>
      </t-tooltip>
    </t-form-item>
    <t-form-item :label="$t('page.host.cookie_security.exclude_cookies')">
      <t-tooltip class="placement top center" :content="$t('page.host.cookie_security.exclude_cookies_tips')" placement="top"
                 :overlay-style="{ width: '360px' }" show-arrow>
        <t-textarea v-model="local.exclude_cookies" :placeholder="$t('page.host.cookie_security.exclude_cookies_ph')"
                    :autosize="{ minRows: 2, maxRows: 4 }" :style="{ width: '480px' }" @blur="updateParent" />
      </t-tooltip>
    </t-form-item>
  </div>
</template>

<script lang="ts">
export default {
  name: 'CookieSecurityConfig',
  props: {
    cookieSecurityConfig: {
      type: Object,
      required: true
    }
  },
  data() {
    return { local: JSON.parse(JSON.stringify(this.cookieSecurityConfig)) };
  },
  watch: {
    cookieSecurityConfig: {
      handler(newVal) {
        this.local = JSON.parse(JSON.stringify(newVal));
      },
      deep: true
    }
  },
  methods: {
    updateParent() {
      this.$emit('update', { ...this.local });
    },
    applyRecommended() {
      this.local = { is_enable: '1', http_only: '1', secure: '2', same_site: 'Lax', exclude_cookies: this.local.exclude_cookies || '' };
      this.updateParent();
    }
  }
};
</script>
