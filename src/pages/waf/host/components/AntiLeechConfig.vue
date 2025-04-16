<template>
  <div class="anti-leech-config">
    <t-form-item :label="$t('page.host.anti_leech.is_enable')">
      <t-radio-group v-model="localConfig.is_enable_anti_leech" @change="updateParent">
        <t-radio value="0">{{ $t('common.off') }}</t-radio>
        <t-radio value="1">{{ $t('common.on') }}</t-radio>
      </t-radio-group>
    </t-form-item>
    <t-form-item :label="$t('page.host.anti_leech.file_types')" v-if="localConfig.is_enable_anti_leech == '1'">
      <t-input v-model="localConfig.file_types" @change="updateParent" :placeholder="$t('page.host.anti_leech.file_types_placeholder')" />
    </t-form-item>
    <t-form-item :label="$t('page.host.anti_leech.valid_referers')" v-if="localConfig.is_enable_anti_leech == '1'">
        <t-textarea v-model="localConfig.valid_referers" @change="updateParent" :placeholder="$t('page.host.anti_leech.valid_referers_placeholder')" />
      </t-form-item>
      <t-form-item  v-if="localConfig.is_enable_anti_leech == '1'">
        <t-alert theme="info" :message="$t('page.host.anti_leech.valid_referers_desc')" style="margin-top: 4px;" />
      </t-form-item>
    <t-form-item :label="$t('page.host.anti_leech.action')" v-if="localConfig.is_enable_anti_leech == '1'">
      <t-radio-group v-model="localConfig.action" @change="updateParent">
        <t-radio value="block">{{ $t('page.host.anti_leech.action_block') }}</t-radio>
        <t-radio value="redirect">{{ $t('page.host.anti_leech.action_redirect') }}</t-radio>
      </t-radio-group>
    </t-form-item>
    <t-form-item :label="$t('page.host.anti_leech.redirect_url')" v-if="localConfig.is_enable_anti_leech == '1' && localConfig.action === 'redirect'">
      <t-input v-model="localConfig.redirect_url" @change="updateParent" :placeholder="$t('page.host.anti_leech.redirect_url_placeholder')" />
    </t-form-item>
  </div>
</template>

<script lang="ts">
export default {
  name: 'AntiLeechConfig',
  props: {
    antiLeechConfig: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      localConfig: JSON.parse(JSON.stringify(this.antiLeechConfig))
    };
  },
  watch: {
    antiLeechConfig: {
      handler(newVal) {
        this.localConfig = JSON.parse(JSON.stringify(newVal));
      },
      immediate: true
    }
  },
  methods: {
    updateParent() {
      this.$emit('update', JSON.parse(JSON.stringify(this.localConfig)));
    }
  }
};
</script>