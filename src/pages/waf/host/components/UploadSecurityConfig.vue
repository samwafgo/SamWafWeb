<template>
  <div class="upload-security-config">
    <t-alert theme="info" :message="$t('page.host.upload_security.intro')" style="margin-bottom: 16px;" />

    <t-form-item :label="$t('page.host.upload_security.is_enable')">
      <t-radio-group v-model="local.is_enable" @change="updateParent">
        <t-radio value="0">{{ $t('page.host.upload_security.disable') }}</t-radio>
        <t-radio value="1">{{ $t('page.host.upload_security.enable') }}</t-radio>
      </t-radio-group>
      <t-button size="small" variant="outline" style="margin-left: 12px;" @click="applyRecommended">
        {{ $t('page.host.upload_security.recommended') }}
      </t-button>
    </t-form-item>

    <t-form-item :label="$t('page.host.upload_security.check_ext')">
      <t-radio-group v-model="local.check_ext" @change="updateParent">
        <t-radio value="1">{{ $t('common.on') }}</t-radio>
        <t-radio value="0">{{ $t('common.off') }}</t-radio>
      </t-radio-group>
    </t-form-item>
    <t-form-item v-if="local.check_ext === '1'" :label="$t('page.host.upload_security.ext_blacklist')">
      <t-tooltip class="placement top center" :content="$t('page.host.upload_security.ext_blacklist_tips')" placement="top"
                 :overlay-style="{ width: '360px' }" show-arrow>
        <t-textarea v-model="local.ext_blacklist" :placeholder="$t('page.host.upload_security.ext_blacklist_ph')"
                    :autosize="{ minRows: 2, maxRows: 4 }" :style="{ width: '480px' }" @blur="updateParent" />
      </t-tooltip>
    </t-form-item>

    <t-form-item :label="$t('page.host.upload_security.check_content')">
      <t-tooltip class="placement top center" :content="$t('page.host.upload_security.check_content_tips')" placement="top"
                 :overlay-style="{ width: '360px' }" show-arrow>
        <t-radio-group v-model="local.check_content" @change="updateParent">
          <t-radio value="1">{{ $t('common.on') }}</t-radio>
          <t-radio value="0">{{ $t('common.off') }}</t-radio>
        </t-radio-group>
      </t-tooltip>
    </t-form-item>

    <t-form-item :label="$t('page.host.upload_security.check_magic')">
      <t-tooltip class="placement top center" :content="$t('page.host.upload_security.check_magic_tips')" placement="top"
                 :overlay-style="{ width: '360px' }" show-arrow>
        <t-radio-group v-model="local.check_magic" @change="updateParent">
          <t-radio value="1">{{ $t('common.on') }}</t-radio>
          <t-radio value="0">{{ $t('common.off') }}</t-radio>
        </t-radio-group>
      </t-tooltip>
    </t-form-item>

    <t-form-item :label="$t('page.host.upload_security.check_size')">
      <t-radio-group v-model="local.check_size" @change="updateParent">
        <t-radio value="1">{{ $t('common.on') }}</t-radio>
        <t-radio value="0">{{ $t('common.off') }}</t-radio>
      </t-radio-group>
    </t-form-item>
    <t-form-item :label="$t('page.host.upload_security.max_size_kb')">
      <t-tooltip class="placement top center" :content="$t('page.host.upload_security.max_size_kb_tips')" placement="top"
                 :overlay-style="{ width: '360px' }" show-arrow>
        <t-input-number v-model="local.max_size_kb" :min="1" :style="{ width: '180px' }" @change="updateParent" />
      </t-tooltip>
    </t-form-item>
    <t-form-item :label="$t('page.host.upload_security.over_limit_action')">
      <t-tooltip class="placement top center" :content="$t('page.host.upload_security.over_limit_tips')" placement="top"
                 :overlay-style="{ width: '360px' }" show-arrow>
        <t-radio-group v-model="local.over_limit_action" @change="updateParent">
          <t-radio value="block">{{ $t('page.host.upload_security.over_limit_block') }}</t-radio>
          <t-radio value="pass">{{ $t('page.host.upload_security.over_limit_pass') }}</t-radio>
        </t-radio-group>
      </t-tooltip>
    </t-form-item>

    <t-form-item :label="$t('page.host.upload_security.include_paths')">
      <t-tooltip class="placement top center" :content="$t('page.host.upload_security.include_paths_tips')" placement="top"
                 :overlay-style="{ width: '360px' }" show-arrow>
        <t-textarea v-model="local.include_paths" :placeholder="$t('page.host.upload_security.include_paths_ph')"
                    :autosize="{ minRows: 2, maxRows: 4 }" :style="{ width: '480px' }" @blur="updateParent" />
      </t-tooltip>
    </t-form-item>
    <t-form-item :label="$t('page.host.upload_security.exclude_paths')">
      <t-tooltip class="placement top center" :content="$t('page.host.upload_security.exclude_paths_tips')" placement="top"
                 :overlay-style="{ width: '360px' }" show-arrow>
        <t-textarea v-model="local.exclude_paths" :placeholder="$t('page.host.upload_security.exclude_paths_ph')"
                    :autosize="{ minRows: 2, maxRows: 4 }" :style="{ width: '480px' }" @blur="updateParent" />
      </t-tooltip>
    </t-form-item>
  </div>
</template>

<script lang="ts">
export default {
  name: 'UploadSecurityConfig',
  props: {
    uploadSecurityConfig: {
      type: Object,
      required: true,
    },
  },
  data() {
    return { local: JSON.parse(JSON.stringify(this.uploadSecurityConfig)) };
  },
  watch: {
    uploadSecurityConfig: {
      handler(newVal) {
        this.local = JSON.parse(JSON.stringify(newVal));
      },
      deep: true,
    },
  },
  methods: {
    updateParent() {
      this.$emit('update', { ...this.local });
    },
    applyRecommended() {
      this.local = {
        is_enable: '1',
        check_ext: '1',
        ext_blacklist: this.local.ext_blacklist || '',
        check_content: '1',
        check_magic: '1',
        check_size: '1',
        max_size_kb: 10240,
        over_limit_action: 'block',
        include_paths: this.local.include_paths || '',
        exclude_paths: this.local.exclude_paths || '',
      };
      this.updateParent();
    },
  },
};
</script>
