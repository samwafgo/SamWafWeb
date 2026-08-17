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
      theme="default"
      shape="square"
      variant="text"
      class="search-trigger-btn"
      :title="$t('common.search_page')"
      @click="searchVisible = true"
    >
      <search-icon />
    </t-button>

    <!-- 页面搜索：按钮 + 模态框 -->
    <t-dialog
      :visible.sync="searchVisible"
      :header="$t('common.search_page')"
      :footer="false"
      width="560px"
      destroy-on-close
      @closed="onDialogClosed"
    >
      <div class="search-dialog-body">
        <t-select
          v-model="searchData"
          filterable
          clearable
          autofocus
          :filter="filterSearch"
          :options="searchOptions"
          :placeholder="$t('common.search_page_placeholder')"
          @change="handleNavigate"
        >
          <template #prefix-icon>
            <search-icon size="16" />
          </template>
        </t-select>
        <p class="search-dialog-tip">{{ $t('common.search_page_tip') }}</p>
      </div>
    </t-dialog>
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
      searchVisible: false,
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
        this.searchVisible = false;
      });
    },
    // 关闭搜索模态框时重置输入
    onDialogClosed() {
      this.searchData = null;
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

.header-menu-search-left {
  display: flex;
  align-items: center;
}

/* 搜索模态框 */
.search-dialog-body {
  padding-top: 8px;
}

.search-dialog-tip {
  margin: 12px 2px 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--td-text-color-placeholder);
}
</style>
