<template>
  <div>
    <t-card class="list-card-container">
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
                 :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
                 @page-change="rehandlePageChange" @change="rehandleChange" @select-change="rehandleSelectChange"
                 @filter-change="onFilterChange"
                 :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">

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
      data: [], //列表数据信息
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
    this.getList("")
  },

  methods: {
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

            this.data = resdata.data.list;
            this.data_attach = []
            console.log('getList',this.data)
            this.pagination = {
              ...this.pagination,
              total: resdata.data.total,
            };
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
     * 筛选结果
     */
    onFilterChange(e){
      if (e.ip) {
         this.data = this.data.filter(item => item.ip.includes(e.ip));
      }else{
         this.getList("");
      }
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

.t-button+.t-button {
  margin-left: @spacer;
}
</style>
