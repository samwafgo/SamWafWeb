<template>
  <div class="cache-config">
    <t-form-item :label="$t('page.host.cache.is_enable')">
      <t-radio-group v-model="localConfig.is_enable_cache" @change="updateParent">
        <t-radio value="0">{{ $t('common.off') }}</t-radio>
        <t-radio value="1">{{ $t('common.on') }}</t-radio>
      </t-radio-group>
    </t-form-item>
    <t-form-item :label="$t('page.host.cache.cache_location')" v-if="localConfig.is_enable_cache == '1'">
      <t-radio-group v-model="localConfig.cache_location" @change="updateParent">
        <t-radio value="memory">{{ $t('page.host.cache.cache_location_memory') }}</t-radio>
        <t-radio value="file">{{ $t('page.host.cache.cache_location_file') }}</t-radio>
        <t-radio value="all">{{ $t('page.host.cache.cache_location_all') }}</t-radio>
      </t-radio-group>
    </t-form-item>
    <t-form-item :label="$t('page.host.cache.cache_dir')" v-if="localConfig.is_enable_cache == '1' && (localConfig.cache_location === 'file' || localConfig.cache_location === 'all')">
      <t-input v-model="localConfig.cache_dir" @change="updateParent" :placeholder="$t('page.host.cache.cache_dir_placeholder')" />
    </t-form-item>
    <t-form-item :label="$t('page.host.cache.max_file_size_mb')" v-if="localConfig.is_enable_cache == '1' && (localConfig.cache_location === 'file' || localConfig.cache_location === 'all')">
      <t-input v-model="localConfig.max_file_size_mb" @change="updateParent" :placeholder="$t('page.host.cache.max_file_size_mb_placeholder')" />
    </t-form-item>
    <t-form-item :label="$t('page.host.cache.max_memory_size_mb')" v-if="localConfig.is_enable_cache == '1' && (localConfig.cache_location === 'memory' || localConfig.cache_location === 'all')">
      <t-input v-model="localConfig.max_memory_size_mb" @change="updateParent" :placeholder="$t('page.host.cache.max_memory_size_mb_placeholder')" />
    </t-form-item>
  </div>
</template>

<script lang="ts">
export default {
  name: 'CacheConfig',
  props: {
    cacheConfig: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      localConfig: JSON.parse(JSON.stringify(this.cacheConfig))
    };
  },
  watch: {
    cacheConfig: {
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
