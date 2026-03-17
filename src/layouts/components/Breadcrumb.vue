<template>
  <div class="breadcrumb-container">
    <t-breadcrumb :max-item-width="'150'" class="tdesign-breadcrumb">
      <t-breadcrumbItem v-for="item in crumbs" :key="item.to" :to="item.to">
        {{ $t(item.title)}}
      </t-breadcrumbItem>
    </t-breadcrumb>
    <a href="https://mp.weixin.qq.com/s/AMKCsYO6XcwiUzuCcKUS1g" target="_blank" class="comm-channel-link">{{ $t('common.online_channel') }}</a>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TdesignStarterBreadcrumb',
  props: {
    isVisible: Boolean,
  },
  computed: {
    crumbs() {
      const pathArray = this.$route.path.split('/');
      pathArray.shift();

      const breadcrumbs = pathArray.reduce((breadcrumbArray, path, idx) => {
        breadcrumbArray.push({
          path,
          to: breadcrumbArray[idx - 1] ? `/${breadcrumbArray[idx - 1].path}/${path}` : `/${path}`,
          title: this.$route.matched[idx].meta.title || path,
        });
        return breadcrumbArray;
      }, []);
      return breadcrumbs;
    },
  },
});
</script>
<style scoped>
.breadcrumb-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.tdesign-breadcrumb {
  margin-bottom: 0;
}
.comm-channel-link {
  font-size: 14px;
  color: var(--td-brand-color);
  text-decoration: none;
}
.comm-channel-link:hover {
  text-decoration: underline;
}
</style>
