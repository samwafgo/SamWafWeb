<template>
  <div>
    <t-card class="list-card-container">
      <div class="ban-toolbar">
        <t-button variant="outline" size="small" :loading="dataLoading" @click="getList('')">
          {{ $t('common.refresh') }}
        </t-button>
        <t-select v-model="filterScope" size="small" :style="{ width: '220px', marginLeft: '8px' }"
                  @change="applyFilter">
          <t-option value="" :label="$t('page.ccrule.ban_filter_all')" />
          <t-option value="global" :label="$t('page.ccrule.ban_scope_global')" />
          <t-option v-for="h in bannedHosts" :key="h.code" :value="h.code" :label="h.name" />
        </t-select>
        <span class="ban-toolbar-tip">{{ $t('page.ccrule.ban_refresh_tip') }}</span>
      </div>
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
                 :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
                 @page-change="rehandlePageChange" @change="rehandleChange" @select-change="rehandleSelectChange"
                 @filter-change="onFilterChange"
                 :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">
          <template #scope="{ row }">
            <template v-if="row.scope === 'host'">
              <t-tag theme="primary" variant="light">{{ $t('page.ccrule.ban_scope_host') }}</t-tag>
              <span class="ban-host-name">{{ hostName(row) }}</span>
            </template>
            <t-tag v-else theme="warning" variant="light">{{ $t('page.ccrule.ban_scope_global') }}</t-tag>
          </template>

          <template #op="slotProps">
            <a class="t-button-link" @click="handleRemoveBanIp(slotProps)">{{ $t('page.cc.remove_ban_ip') }}</a>
          </template>
        </t-table>
      </div>
      <div>
        <router-view></router-view>
      </div>
    </t-card>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import {
  SearchIcon
} from 'tdesign-icons-vue';
import Trend from '@/components/trend/index.vue';
import {
  prefix
} from '@/config/global';


import {
  wafAntiCCAddApi,
  wafAntiCCBanIPListApi, wafAntiCCRemoveBanIpApi
} from '@/apis/anticc';
import { allhost } from '@/apis/host';

const INITIAL_DATA = {
  host_code: '',
  url: '',
  rate: 1,
  limit: 30,
  lock_minutes:10,//默认10分钟
  remarks: '',
};
export default Vue.extend({
  name: 'BanIpList',
  components: {
    SearchIcon,
    Trend,
  },
  data() {
    return {
      addFormVisible: false,
      editFormVisible: false,
      guardVisible: false,
      confirmVisible: false,
      formData: {
        ...INITIAL_DATA
      },
      formEditData: {
        ...INITIAL_DATA
      },
      rules: {
        host_code: [{
          required: true,
          message: this.$t('page.cc.website'),
          type: 'error'
        }],
        rate: [{
          required: true,
          message: this.$t('page.cc.rate'),
          type: 'error'
        }],
        limit: [{
          required: true,
          message: this.$t('page.cc.limit'),
          type: 'error'
        }],
      },
      textareaValue: '',
      prefix,
      dataLoading: false,
      data: [], //列表数据信息（当前筛选后的视图）
      rawData: [], //接口返回的原始数据，筛选都在它之上做
      filterScope: '', //作用范围筛选：空=全部，global=全局生效，其余为站点码
      ipKeyword: '', //IP 列的筛选关键字
      hosts: [], //站点列表，用于把站点码换成域名
      detail_data: [], //加载详情信息用于编辑
      selectedRowKeys: [],
      value: 'first',
      columns: [
        {
          title: this.$t('page.cc.ban_ip'),
          align: 'left',
          ellipsis: true,
          colKey: 'ip',
          filter: {
            type: 'input',
            resetValue: '',
            confirmEvents: ['onEnter'],
            props: {
              placeholder: this.$t('common.placeholder'),
            },
            showConfirmAndReset: true,
          },
        },
        {
          title: this.$t('page.cc.ban_remain_time'),
          width: 150,
          ellipsis: true,
          colKey: 'remain_time',
        },
        {
          title: this.$t('page.cc.ban_ip_belong'),
          width: 200,
          ellipsis: true,
          colKey: 'region',
        },
        {
          title: this.$t('page.ccrule.ban_col_scope'),
          minWidth: 220,
          ellipsis: true,
          colKey: 'scope',
        },
        {
          align: 'left',
          width: 150,
          colKey: 'op',
          title: this.$t('common.op'),
        },
      ],
      rowKey: 'code',
      tableLayout: 'auto',
      verticalAlign: 'top',
      hover: true,
      rowClassName: (rowKey: string) => `${rowKey}-class`,
      // 与pagination对齐
      pagination: {
        total: 0,
        current: 1,
        pageSize: 10
      },
      //顶部搜索
      searchformData: {
        host_code:""
      },
      //索引区域
      deleteIdx: -1,
      guardStatusIdx :-1,
    };
  },
  computed: {
    hostDict() {
      const dict = {};
      (this.hosts || []).forEach((h) => { dict[h.value] = h.pre_host || h.label; });
      return dict;
    },
    // 只列出当前确实有封禁的站点，避免下拉里塞一堆选了也没结果的站点
    bannedHosts() {
      const seen = {};
      const list = [];
      (this.rawData || []).forEach((r) => {
        if (r.scope !== 'host' || !r.host_code || seen[r.host_code]) return;
        seen[r.host_code] = true;
        list.push({ code: r.host_code, name: this.hostName(r) });
      });
      return list;
    },
    confirmBody() {
      if (this.deleteIdx > -1) {
        const {
          url
        } = this.data?. [this.deleteIdx];
        return this.$t('common.data_delete_warning');
      }
      return '';
    },
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    },
  },
  mounted() {
    this.loadHosts();
    this.getList("")
  },

  methods: {
    loadHosts() {
      // 后端返回的 host_name 是「域名:端口」形式的显示名（同一域名常有多个端口各成一个站点）；
      // 万一取不到（例如站点已删除），再用站点列表兜一层，最后才退回站点码——
      // 直接显示一串 UUID 对用户没有意义
      allhost({}).then((res) => {
        if (res.code === 0) {
          this.hosts = res.data || [];
        }
      }).catch(() => { /* 只是显示用，取不到不影响封禁列表本身 */ });
    },
    hostName(row) {
      if (!row) return '-';
      return row.host_name || this.hostDict[row.host_code] || row.host_code || '-';
    },
    getList(keyword) {
      let that = this
      wafAntiCCBanIPListApi( {
        pageSize: that.pagination.pageSize,
        pageIndex: that.pagination.current,
        ... that.searchformData
      })
        .then((res) => {
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {

            this.rawData = resdata.data.list || [];
            // 选中的站点这一轮可能已经没有封禁了，筛选条件留着会显示空列表，退回全部
            if (this.filterScope && this.filterScope !== 'global'
                && !this.rawData.some((r) => r.host_code === this.filterScope)) {
              this.filterScope = '';
            }
            this.applyFilter();
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
          this.dataLoading = false;
        });
      this.dataLoading = true;
    },
    getContainer() {
      return document.querySelector('.tdesign-starter-layout');
    },
    rehandlePageChange(curr, pageInfo) {
      console.log('分页变化', curr, pageInfo);
      this.pagination.current = curr.current
      if (this.pagination.pageSize != curr.pageSize) {
        this.pagination.current = 1
        this.pagination.pageSize = curr.pageSize
      }
      this.getList("")
    },
    rehandleSelectChange(selectedRowKeys: number[]) {
      this.selectedRowKeys = selectedRowKeys;
    },
    rehandleChange(changeParams, triggerAndData) {
      console.log('统一Change', changeParams, triggerAndData);
    },
    handleRemoveBanIp(e) {
      let that = this
      const {
        ip
      } = e.row
      wafAntiCCRemoveBanIpApi({
        "ip":ip
      })
        .then((res) => {
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {
            that.$message.success(resdata.msg);
            that.getList("")
          } else {
            that.$message.warning(resdata.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {});
    },
    /**
     * 作用范围与 IP 关键字两个筛选条件叠加生效，都在 rawData 之上做，
     * 免得先筛一次之后 data 变小、第二个条件在残缺数据上过滤
     */
    applyFilter() {
      let list = this.rawData || [];
      if (this.filterScope === 'global') {
        list = list.filter((r) => r.scope !== 'host');
      } else if (this.filterScope) {
        list = list.filter((r) => r.host_code === this.filterScope);
      }
      if (this.ipKeyword) {
        list = list.filter((r) => (r.ip || '').includes(this.ipKeyword));
      }
      this.data = list;
      this.pagination = { ...this.pagination, total: list.length };
    },
    onFilterChange(e) {
      this.ipKeyword = e.ip || '';
      this.applyFilter();
    }
    //END Methods
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables';

.payment-col {
  display: flex;

  .trend-container {
    display: flex;
    align-items: center;
    margin-left: 8px;
  }
}

.left-operation-container {
  padding: 0 0 6px 0;
  margin-bottom: 16px;

  .selected-count {
    display: inline-block;
    margin-left: 8px;
    color: var(--td-text-color-secondary);
  }
}

.search-input {
  width: 360px;
}

.ban-host-name {
  margin-left: 6px;
  color: var(--td-text-color-secondary);
}

.ban-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 12px;

  .ban-toolbar-tip {
    margin-left: 8px;
    font-size: 12px;
    color: var(--td-text-color-placeholder);
  }
}

.t-button+.t-button {
  margin-left: @spacer;
}
</style>
