<template>
  <div class="access-config">
    <t-alert theme="info" :message="$t('page.host.access.intro')" style="margin-bottom: 16px;" />
    <t-form-item :label="$t('page.host.access.mode')">
      <t-tooltip class="placement top center" :content="$t('page.host.access.mode_tips')" placement="top"
                 :overlay-style="{ width: '380px' }" show-arrow>
        <t-radio-group v-model="local.mode" @change="updateParent">
          <t-radio value="0">{{ $t('page.host.access.mode_inherit') }}</t-radio>
          <t-radio value="1">{{ $t('page.host.access.mode_force_on') }}</t-radio>
          <t-radio value="2">{{ $t('page.host.access.mode_force_off') }}</t-radio>
        </t-radio-group>
      </t-tooltip>
    </t-form-item>
    <t-form-item :label="$t('page.host.access.exclude_paths')">
      <t-tooltip class="placement top center" :content="$t('page.host.access.exclude_paths_tips')" placement="top"
                 :overlay-style="{ width: '380px' }" show-arrow>
        <t-textarea v-model="local.exclude_paths" :placeholder="$t('page.host.access.exclude_paths_ph')"
                    :autosize="{ minRows: 3, maxRows: 6 }" :style="{ width: '480px' }" @blur="updateParent" />
      </t-tooltip>
    </t-form-item>
    <t-form-item :label="$t('page.host.access.allow_ip_group')">
      <t-tooltip class="placement top center" :content="$t('page.host.access.allow_ip_group_tips')" placement="top"
                 :overlay-style="{ width: '360px' }" show-arrow>
        <t-select v-model="local.allow_ip_group_code" clearable :style="{ width: '480px' }"
                  :placeholder="$t('common.select_placeholder')" @change="updateParent">
          <t-option v-for="g in ipGroups" :key="g.group_code" :value="g.group_code" :label="g.group_name"></t-option>
        </t-select>
      </t-tooltip>
    </t-form-item>
    <t-form-item :label="$t('page.host.access.require_otp')">
      <t-tooltip class="placement top center" :content="$t('page.host.access.require_otp_tips')" placement="top"
                 :overlay-style="{ width: '360px' }" show-arrow>
        <t-radio-group v-model="local.require_otp" @change="updateParent">
          <t-radio value="0">{{ $t('page.host.access.mode_inherit') }}</t-radio>
          <t-radio value="1">{{ $t('page.host.access.otp_force') }}</t-radio>
          <t-radio value="2">{{ $t('page.host.access.otp_exempt') }}</t-radio>
        </t-radio-group>
      </t-tooltip>
    </t-form-item>
    <t-form-item :label="$t('page.host.access.unauth_action')">
      <t-tooltip class="placement top center" :content="$t('page.host.access.unauth_action_tips')" placement="top"
                 :overlay-style="{ width: '380px' }" show-arrow>
        <t-radio-group v-model="local.unauth_action" @change="updateParent">
          <t-radio value="">{{ $t('page.host.access.mode_inherit') }}</t-radio>
          <t-radio value="auto">{{ $t('page.host.access.unauth_auto') }}</t-radio>
          <t-radio value="redirect">{{ $t('page.host.access.unauth_redirect') }}</t-radio>
          <t-radio value="401">{{ $t('page.host.access.unauth_401') }}</t-radio>
        </t-radio-group>
      </t-tooltip>
    </t-form-item>
    <t-alert v-if="cacheConflict" theme="error" :message="$t('page.host.access.cache_conflict')"
             style="margin-top: 16px;" />
  </div>
</template>

<script lang="ts">
import { wafIPGroupOptionsApi } from '@/apis/ipgroup';

export default {
  name: 'AccessConfig',
  props: {
    accessConfig: {
      type: Object,
      required: true
    },
    // 站点是否同时开了 web 缓存。开着的话必须显式警告：
    // 缓存键不含身份，A 用户的私有页面可能被缓存后返回给 B 用户 —— 认证挡住了未登录的人，
    // 却挡不住登录用户之间的串号。
    cacheEnabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      local: JSON.parse(JSON.stringify(this.accessConfig)),
      ipGroups: []
    };
  },
  computed: {
    cacheConflict() {
      return this.cacheEnabled && this.local.mode !== '2';
    }
  },
  watch: {
    accessConfig: {
      handler(newVal) {
        this.local = JSON.parse(JSON.stringify(newVal));
      },
      deep: true
    }
  },
  mounted() {
    const that = this;
    wafIPGroupOptionsApi().then((res) => {
      if (res.code === 0) {
        that.ipGroups = res.data ?? [];
      }
    }).catch(() => { /* IP组接口不可用时不影响本页其余配置 */ });
  },
  methods: {
    updateParent() {
      this.$emit('update', { ...this.local });
    }
  }
};
</script>

<style lang="less" scoped>
.access-config {
  padding: 8px 0;
}
</style>
