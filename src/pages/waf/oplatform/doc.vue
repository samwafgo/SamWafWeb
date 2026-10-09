<template>
  <div class="doc-container">
    <t-card class="doc-card">
      <p class="doc-title">{{ $t('menu.oplatform.doc_title') }}</p>
      <!-- 不内嵌 iframe：点击才跳转，且不带 Referer -->
      <t-link theme="primary" :href="docUrl" target="_blank" rel="noopener noreferrer">
        {{ docUrl }}
      </t-link>
    </t-card>
  </div>
</template>

<script>
export default {
  name: 'OPlatformDoc',
  computed: {
    docUrl() {
      return 'https://doc.samwaf.com/api/'
    }
  }
}
</script>

<style scoped>
.doc-container {
  padding: 16px;
}
.doc-card {
  max-width: 640px;
}
.doc-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}
</style>
