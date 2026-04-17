<template>
  <div class="response-compress-config">
    <t-alert theme="info" :message="$t('page.host.response_compress.intro')" style="margin-bottom: 16px;" />
    <t-form-item :label="$t('page.host.response_compress.is_enable')">
      <t-radio-group v-model="local.is_enable" @change="updateParent">
        <t-radio value="0">{{ $t('page.host.response_compress.disable') }}</t-radio>
        <t-radio value="1">{{ $t('page.host.response_compress.enable') }}</t-radio>
      </t-radio-group>
    </t-form-item>
    <t-form-item :label="$t('page.host.response_compress.prefer')">
      <t-tooltip class="placement top center" :content="$t('page.host.response_compress.prefer_tips')" placement="top"
                 :overlay-style="{ width: '320px' }" show-arrow>
        <t-select v-model="local.prefer" :style="{ width: '280px' }" @change="updateParent">
          <t-option value="zstd_first" :label="$t('page.host.response_compress.prefer_zstd_first')" />
          <t-option value="br_first" :label="$t('page.host.response_compress.prefer_br_first')" />
          <t-option value="gzip_only" :label="$t('page.host.response_compress.prefer_gzip_only')" />
          <t-option value="br_only" :label="$t('page.host.response_compress.prefer_br_only')" />
          <t-option value="zstd_only" :label="$t('page.host.response_compress.prefer_zstd_only')" />
        </t-select>
      </t-tooltip>
    </t-form-item>
    <t-form-item :label="$t('page.host.response_compress.min_length')">
      <t-tooltip class="placement top center" :content="$t('page.host.response_compress.min_length_tips')" placement="top"
                 :overlay-style="{ width: '280px' }" show-arrow>
        <t-input-number v-model="local.min_length" :min="0" :style="{ width: '160px' }" @change="updateParent" />
      </t-tooltip>
    </t-form-item>
    <t-form-item :label="$t('page.host.response_compress.include_types')">
      <t-tooltip class="placement top center" :content="$t('page.host.response_compress.include_types_tips')" placement="top"
                 :overlay-style="{ width: '360px' }" show-arrow>
        <t-textarea v-model="local.include_types" :placeholder="$t('page.host.response_compress.include_types_ph')"
                    :autosize="{ minRows: 2, maxRows: 6 }" :style="{ width: '480px' }" @blur="updateParent" />
      </t-tooltip>
    </t-form-item>
    <t-form-item :label="$t('page.host.response_compress.include_extensions')">
      <t-textarea v-model="local.include_extensions" :placeholder="$t('page.host.response_compress.include_extensions_ph')"
                  :autosize="{ minRows: 2, maxRows: 4 }" :style="{ width: '480px' }" @blur="updateParent" />
    </t-form-item>
    <t-form-item :label="$t('page.host.response_compress.exclude_extensions')">
      <t-textarea v-model="local.exclude_extensions" :placeholder="$t('page.host.response_compress.exclude_extensions_ph')"
                  :autosize="{ minRows: 2, maxRows: 4 }" :style="{ width: '480px' }" @blur="updateParent" />
    </t-form-item>
    <t-form-item :label="$t('page.host.response_compress.exclude_paths')">
      <t-textarea v-model="local.exclude_paths" :placeholder="$t('page.host.response_compress.exclude_paths_ph')"
                  :autosize="{ minRows: 2, maxRows: 6 }" :style="{ width: '480px' }" @blur="updateParent" />
    </t-form-item>
    <t-form-item :label="$t('page.host.response_compress.compress_static')">
      <t-tooltip class="placement top center" :content="$t('page.host.response_compress.compress_static_tips')" placement="top"
                 :overlay-style="{ width: '380px' }" show-arrow>
        <t-radio-group v-model="local.compress_when_static_assist" @change="updateParent">
          <t-radio value="0">{{ $t('page.host.response_compress.no') }}</t-radio>
          <t-radio value="1">{{ $t('page.host.response_compress.yes') }}</t-radio>
        </t-radio-group>
      </t-tooltip>
    </t-form-item>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ResponseCompressConfig',
  props: {
    responseCompressConfig: {
      type: Object,
      required: true
    }
  },
  data() {
    const p = JSON.parse(JSON.stringify(this.responseCompressConfig));
    const n = parseInt(p.min_length, 10);
    p.min_length = isNaN(n) ? 256 : n;
    return { local: p };
  },
  watch: {
    responseCompressConfig: {
      handler(newVal) {
        const p = JSON.parse(JSON.stringify(newVal));
        const n = parseInt(p.min_length, 10);
        p.min_length = isNaN(n) ? 256 : n;
        this.local = p;
      },
      deep: true
    }
  },
  methods: {
    updateParent() {
      const out = { ...this.local, min_length: String(this.local.min_length) };
      this.$emit('update', out);
    }
  }
};
</script>
