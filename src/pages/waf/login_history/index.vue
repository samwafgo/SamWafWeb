<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="filter-bar">
          <t-input
            v-model="searchAccount"
            class="search-input"
            :placeholder="$t('page.login_history.login_account')"
            clearable
            @enter="onSearch"
            @clear="onSearch"
          >
            <template #suffix-icon>
              <search-icon size="20px" />
            </template>
          </t-input>
          <t-input
            v-model="searchIp"
            class="search-input"
            :placeholder="$t('page.login_history.login_ip')"
            clearable
            @enter="onSearch"
            @clear="onSearch"
          />
          <t-select v-model="searchChanged" class="search-select" @change="onSearch">
            <t-option value="" :label="$t('page.login_history.filter_all')"></t-option>
            <t-option value="1" :label="$t('page.login_history.changed_yes')"></t-option>
            <t-option value="0" :label="$t('page.login_history.changed_no')"></t-option>
          </t-select>
          <t-button @click="onSearch">{{ $t('common.search') }}</t-button>
        </div>
      </t-row>

      <div class="table-container">
        <t-table
          :columns="columns"
          :data="data"
          :rowKey="rowKey"
          :verticalAlign="verticalAlign"
          :hover="hover"
          :pagination="pagination"
          :loading="dataLoading"
          @page-change="rehandlePageChange"
          :headerAffixedTop="true"
          :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }"
        >
          <template #is_changed="slotProps">
            <t-tag v-if="slotProps.row.is_first === 1" theme="default" variant="light">
              {{ $t('page.login_history.first_login') }}
            </t-tag>
            <t-tag v-else-if="slotProps.row.is_changed === 1" theme="warning" variant="light">
              {{ $t('page.login_history.changed_yes') }}
            </t-tag>
            <t-tag v-else theme="success" variant="light">
              {{ $t('page.login_history.changed_no') }}
            </t-tag>
          </template>

          <template #prev="slotProps">
            <span v-if="slotProps.row.is_changed === 1">
              {{ slotProps.row.prev_ip || '-' }}
              <span class="prev-area">{{ slotProps.row.prev_area }}</span>
            </span>
            <span v-else>-</span>
          </template>
        </t-table>
      </div>
    </t-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SearchIcon } from 'tdesign-icons-vue';
import { prefix } from '@/config/global';

export default Vue.extend({
  name: 'LoginHistory',
  components: {
    SearchIcon,
  },
  data() {
    return {
      prefix,
      dataLoading: false,
      data: [],
      searchAccount: '',
      searchIp: '',
      // "" 表示不过滤；后端按字符串判断，避免 0 被当成"没传"
      searchChanged: '',
      columns: [
        {
          title: this.$t('page.login_history.login_account'),
          align: 'left',
          width: 140,
          ellipsis: true,
          colKey: 'login_account',
        },
        {
          title: this.$t('page.login_history.login_ip'),
          width: 150,
          ellipsis: true,
          colKey: 'login_ip',
        },
        {
          title: this.$t('page.login_history.login_area'),
          width: 200,
          ellipsis: true,
          colKey: 'login_area',
        },
        {
          title: this.$t('page.login_history.is_changed'),
          width: 110,
          colKey: 'is_changed',
        },
        {
          title: this.$t('page.login_history.prev_ip'),
          width: 220,
          ellipsis: true,
          colKey: 'prev',
        },
        {
          title: this.$t('page.login_history.login_type'),
          width: 90,
          colKey: 'login_type',
        },
        {
          title: this.$t('page.login_history.user_agent'),
          width: 260,
          ellipsis: true,
          colKey: 'user_agent',
        },
        {
          title: this.$t('page.login_history.login_time'),
          width: 180,
          ellipsis: true,
          colKey: 'create_time',
        },
      ],
      rowKey: 'id',
      verticalAlign: 'top',
      hover: true,
      pagination: {
        total: 0,
        current: 1,
        pageSize: 10,
      },
    };
  },
  computed: {
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    },
  },
  mounted() {
    this.getList();
  },
  methods: {
    getList() {
      this.dataLoading = true;
      this.$request
        .get('/login_history/list', {
          params: {
            pageSize: this.pagination.pageSize,
            pageIndex: this.pagination.current,
            login_account: this.searchAccount,
            login_ip: this.searchIp,
            is_changed: this.searchChanged,
          },
        })
        .then((res) => {
          if (res.code === 0) {
            this.data = res.data.list ?? [];
            this.pagination = {
              ...this.pagination,
              total: res.data.total,
            };
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
          this.dataLoading = false;
        });
    },
    onSearch() {
      // 换了过滤条件必须回到第 1 页，否则会停在一个新结果集里不存在的页码上，看着像"没数据"
      this.pagination.current = 1;
      this.getList();
    },
    getContainer() {
      return document.querySelector('.tdesign-starter-layout');
    },
    rehandlePageChange(curr) {
      this.pagination.current = curr.current;
      if (this.pagination.pageSize !== curr.pageSize) {
        this.pagination.current = 1;
        this.pagination.pageSize = curr.pageSize;
      }
      this.getList();
    },
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables';

.filter-bar {
  display: flex;
  gap: @spacer;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  width: 220px;
}

.search-select {
  width: 140px;
}

.prev-area {
  color: var(--td-text-color-secondary);
  margin-left: 4px;
}
</style>
