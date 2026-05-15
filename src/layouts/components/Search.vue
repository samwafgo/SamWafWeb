<template>
  <div v-if="layout === 'side'" class="header-menu-search">
    <t-select
      v-model="searchData"
      :class="{ 'hover-active': isSearchFocus }"
      filterable
      clearable
      :filter="filterSearch"
      :options="searchOptions"
      placeholder="搜索页面"
      @focus="changeSearchFocus(true)"
      @blur="changeSearchFocus(false)"
      @change="handleNavigate"
    >
      <template #prefix-icon>
        <search-icon class="icon" size="16" />
      </template>
    </t-select>
  </div>

  <div v-else class="header-menu-search-left">
    <t-button
      :class="{ 'search-icon-hide': isSearchFocus }"
      theme="default"
      shape="square"
      variant="text"
      @click="changeSearchFocus(true)"
    >
      <search-icon />
    </t-button>
    <t-select
      v-model="searchData"
      :class="['header-search', { 'width-zero': !isSearchFocus }]"
      filterable
      clearable
      :filter="filterSearch"
      :options="searchOptions"
      placeholder="搜索页面"
      :autofocus="isSearchFocus"
      @blur="changeSearchFocus(false)"
      @change="handleNavigate"
    >
      <template #prefix-icon>
        <search-icon size="16" />
      </template>
    </t-select>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { SearchIcon } from 'tdesign-icons-vue';

interface SearchOption {
  value: string;
  label: string;
}

export default Vue.extend({
  components: {
    SearchIcon,
  },
  props: {
    layout: {
      type: String as PropType<string>,
    },
  },
  data() {
    return {
      isSearchFocus: false,
      searchData: null as string | null,
    };
  },
  computed: {
    searchOptions(): SearchOption[] {
      const options: SearchOption[] = [];
      // 从运行时 router 读取，避免循环依赖
      const allRoutes: any[] = (this as any).$router?.options?.routes || [];

      const flatten = (routes: any[], parentPath: string, parentLabel: string) => {
        for (const route of routes) {
          if (!route.meta?.title || route.meta?.hidden) continue;
          const path = route.path.startsWith('/')
            ? route.path
            : parentPath ? `${parentPath}/${route.path}` : route.path;
          const label = (this as any).$t(route.meta.title);
          if (route.children?.length) {
            flatten(route.children, path, label);
          } else {
            const display =
              parentLabel && parentLabel !== label ? `${parentLabel} / ${label}` : label;
            options.push({ value: path, label: display });
          }
        }
      };
      flatten(allRoutes, '', '');
      return options;
    },
  },
  methods: {
    changeSearchFocus(value: boolean) {
      if (!value) {
        this.searchData = null;
      }
      this.isSearchFocus = value;
    },
    filterSearch(filterWords: string, option: SearchOption): boolean {
      if (!filterWords) return true;
      return option.label.toLowerCase().includes(filterWords.toLowerCase());
    },
    handleNavigate(path: string) {
      if (!path) return;
      this.$router.push(path).catch(() => {});
      this.$nextTick(() => {
        this.searchData = null;
        this.isSearchFocus = false;
      });
    },
  },
});
</script>
<style lang="less" scoped>
@import '@/style/variables.less';

.header-menu-search {
  display: flex;
  margin-left: 16px;

  .hover-active {
    /deep/ .t-input {
      background: var(--td-bg-color-secondarycontainer);
    }

    /deep/ .t-icon {
      color: var(--td-brand-color);
    }
  }

  /deep/ .t-icon {
    font-size: 20px;
    color: var(--td-text-color-primary);
  }

  /deep/ .t-select__wrap .t-input {
    border: none;
    outline: none;
    box-shadow: none;
    transition: background @anim-duration-base linear;

    &:hover {
      background: var(--td-bg-color-secondarycontainer);
    }
  }
}

.header-search {
  width: 200px;
  transition: width @anim-duration-base @anim-time-fn-easing;

  /deep/ .t-select__wrap .t-input {
    border: 0;
    padding-left: 40px;

    &:focus {
      box-shadow: none;
    }
  }

  &.width-zero {
    width: 0;
    opacity: 0;
  }
}

.t-button {
  transition: opacity @anim-duration-base @anim-time-fn-easing;
}

.search-icon-hide {
  opacity: 0;
}

.header-menu-search-left {
  display: flex;
  align-items: center;
}
</style>
