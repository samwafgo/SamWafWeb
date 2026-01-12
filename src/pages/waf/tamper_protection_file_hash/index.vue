<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button variant="outline" @click="handleGoBack">{{ $t('common.return') }}</t-button>
        </div>
        <div class="right-operation-container">
            <t-form ref="form" :data="searchformData" :label-width="300" layout="inline" colon :style="{ marginBottom: '8px' }">
                   <t-form-item>
                  <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')">
                            {{ $t('common.search') }}
                          </t-button>
                   </t-form-item>
             </t-form>
        </div>
      </t-row>
      <t-alert theme="info" :message="$t('page.tamper_protection_file_hash.alert_message')" close>
        <template #operation>
          <span @click="handleJumpOnlineUrl">{{ $t('common.online_document') }}</span>
        </template>
      </t-alert>
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
          @page-change="rehandlePageChange" @change="rehandleChange" @select-change="rehandleSelectChange"
          :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">

          <template #op="slotProps">
            <a class="t-button-link" @click="handleClickView(slotProps)">{{ $t('common.details') }}</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
      <div>
      <router-view></router-view>
      </div>
    </t-card>


    <t-dialog :header="$t('common.details')" :visible.sync="viewFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="viewData" :labelWidth="100">
                        <t-form-item :label="$t('page.tamper_protection_file_hash.config_id')" name="config_id">
                           <t-input :style="{ width: '480px' }" :value="viewData.config_id" readonly></t-input>
                      </t-form-item>
           
                        <t-form-item :label="$t('page.tamper_protection_file_hash.file_path')" name="file_path">
                           <t-input :style="{ width: '480px' }" :value="viewData.file_path" readonly></t-input>
                      </t-form-item>
           
                        <t-form-item :label="$t('page.tamper_protection_file_hash.file_hash')" name="file_hash">
                           <t-input :style="{ width: '480px' }" :value="viewData.file_hash" readonly></t-input>
                      </t-form-item>
           
                        <t-form-item :label="$t('page.tamper_protection_file_hash.file_size')" name="file_size">
                           <t-input :style="{ width: '480px' }" :value="viewData.file_size" readonly></t-input>
                      </t-form-item>
           
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseViewBtn">{{ $t('common.close') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <t-dialog :header="$t('common.confirm_delete')" :body="confirmBody" :visible.sync="confirmVisible" @confirm="onConfirmDelete"
      :onCancel="onCancel">
    </t-dialog>
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
    allhost
  } from '@/apis/host';

  import {
    wafTamperProtectionFileHashListApi,wafTamperProtectionFileHashDelApi,wafTamperProtectionFileHashDetailApi
  } from '@/apis/tamper_protection_file_hash.ts';

  const INITIAL_DATA = {
     
    
    
    config_id:'',
    file_path:'',
    file_hash:'',
    file_size:'',
    
  };
  export default Vue.extend({
    name: 'TamperProtectionFileHashBase',
    components: {
      SearchIcon,
      Trend,
    },
    data() {
      return {
        viewFormVisible: false,
        guardVisible: false,
        confirmVisible: false,
        viewData: {
          ...INITIAL_DATA
        },
        rules: {
         
        },
        textareaValue: '',
        prefix,
        dataLoading: false,
        data: [], //列表数据信息
        detail_data: [], //加载详情信息用于编辑
        selectedRowKeys: [],
        value: 'first',
        columns: [
        { colKey: 'row-select', type: 'multiple', width: 64, fixed: 'left' },
        
         

            { title: this.$t('page.tamper_protection_file_hash.config_id'),
                    width: 200,
                    ellipsis: true,
                    colKey: 'config_id',
             },
         

            { title: this.$t('page.tamper_protection_file_hash.file_path'),
                    width: 200,
                    ellipsis: true,
                    colKey: 'file_path',
             },
         

            { title: this.$t('page.tamper_protection_file_hash.file_hash'),
                    width: 200,
                    ellipsis: true,
                    colKey: 'file_hash',
             },
         

            { title: this.$t('page.tamper_protection_file_hash.file_size'),
                    width: 200,
                    ellipsis: true,
                    colKey: 'file_size',
             },
         
          {
            align: 'left',
            fixed: 'right',
            width: 200,
            colKey: 'op',
            title: this.$t('common.op'),
          },
        ],
        rowKey: 'id',
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
          config_id: '',
        },
        //索引区域
        deleteIdx: -1,
        guardStatusIdx :-1,
        //主机字典
        host_dic:{}
      };
    },
    computed: {
      confirmBody() {
        if (this.deleteIdx > -1) {
          const {
            host
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
      // 从路由参数获取 config_id
      const configId = this.$route.query.config_id;
      if (configId) {
        this.searchformData.config_id = configId;
      }
      this.loadHostList().then(() => {
        this.getList("");
      });
    },

    methods: {
      loadHostList() {
        return new Promise((resolve, reject) => {
          allhost()
            .then((res) => {
              let resdata = res;
              console.log(resdata);
              if (resdata.code === 0) {
                let host_options = resdata.data;
                for (let i = 0; i < host_options.length; i++) {
                  this.host_dic[host_options[i].value] = host_options[i].label;
                }
              }
              resolve(); // 调用 resolve 表示加载完成
            })
            .catch((e: Error) => {
              console.log(e);
              reject(e); // 调用 reject 表示加载失败
            });
        });
      },
      getList(keyword) {
        let that = this
        wafTamperProtectionFileHashListApi( {
              pageSize: that.pagination.pageSize,
              pageIndex: that.pagination.current,
              ...that.searchformData
          })
          .then((res) => {
            let resdata = res
            console.log(resdata)
            if (resdata.code === 0) {

              this.data = resdata.data.list??[];
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
      },
      handleClickView(e) {
        console.log(e)
        const {
          id
        } = e.row
        console.log(id)
        this.viewFormVisible = true
        this.getDetail(id)
      },
      handleGoBack() {
        this.$router.push({
          name: 'WafTamperProtection'
        })
      },
      onClickCloseViewBtn(): void {
        this.viewFormVisible = false;
        this.viewData = {...INITIAL_DATA};
      },
      handleClickDelete(row) {
        console.log(row)
        this.deleteIdx = row.rowIndex;
        this.confirmVisible = true;
      },
      onConfirmDelete() {
        this.confirmVisible = false;
        console.log('delete', this.data)
        console.log('delete', this.data[this.deleteIdx])
        let {
          id
        } = this.data[this.deleteIdx]
        let that = this
        wafTamperProtectionFileHashDelApi({
              id: id
          })
          .then((res) => {
            let resdata = res
            console.log(resdata)
            if (resdata.code === 0) {

              that.getList("")
              that.$message.success(resdata.msg);
            } else {
              that.$message.warning(resdata.msg);
            }
          })
          .catch((e: Error) => {
            console.log(e);
          })
          .finally(() => {});


        this.resetIdx();
      },
      onCancel() {
        this.resetIdx();
      },
      resetIdx() {
        this.deleteIdx = -1;
      },
      getDetail(id) {
        let that = this
        wafTamperProtectionFileHashDetailApi({
              id: id
          })
          .then((res) => {
            let resdata = res
            console.log(resdata)
            if (resdata.code === 0) {
              that.detail_data = resdata.data;

              
              
              
              
                    
              
                    
              
                    
              
                    
              
              that.viewData = {
                ...that.detail_data
              }
            }
          })
          .catch((e: Error) => {
            console.log(e);
          })
          .finally(() => {});
      },
      handleJumpOnlineUrl(){
        window.open(this.samwafglobalconfig.getOnlineUrl()+"/guide/TamperProtectionFileHash.html");
      },
    },
  });
</script>

<style lang="less" scoped>
  @import '@/style/variables';

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
