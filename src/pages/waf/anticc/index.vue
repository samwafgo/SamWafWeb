<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAddAntiCC"> {{ $t('page.cc.new_cc_protection') }} </t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="80" colon :style="{ marginBottom: '8px' }">

            <t-row>
              <span>{{$t('page.cc.host')}} :</span><t-select v-model="searchformData.host_code" clearable :style="{ width: '150px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                {{ item }}
              </t-option>
            </t-select>
              <span>URL：</span>
              <t-input v-model="searchformData.url" class="search-input" :placeholder="$t('common.placeholder')" clearable>
              </t-input>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')"> {{ $t('common.search') }} </t-button>
            </t-row>
          </t-form>
        </div>
      </t-row>
      <t-alert theme="info" :message="$t('page.cc.samwaf_cc_protection')" close>
        <template #operation>
          <span @click="handleJumpOnlineUrl">{{ $t('common.online_document') }}</span>
        </template>
      </t-alert>
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
          @page-change="rehandlePageChange" @change="rehandleChange" @select-change="rehandleSelectChange"
          :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">

          <template #host_code="{ row }">
            <span> {{host_dic[row.host_code]}}</span>
          </template>

          <template #op="slotProps">
             <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
      <div>
      <router-view></router-view>
      </div>
    </t-card>

    <!-- New CC Protect Dialog -->
    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="150">
          <t-form-item :label="$t('page.cc.website')" name="host_code">
            <t-select v-model="formData.host_code" clearable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item"
                :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.cc.url')" name="url">
            <t-input :style="{ width: '480px' }" v-model="formData.url" :placeholder="$t('page.cc.input_url_placeholder')"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.cc.rate')" name="rate">
            <t-input-number :style="{ width: '480px' }" v-model="formData.rate" :placeholder="$t('common.placeholder')+$t('page.cc.rate')"></t-input-number>
          </t-form-item>
          <t-form-item :label="$t('page.cc.limit')" name="limit">
            <t-input-number :style="{ width: '480px' }" v-model="formData.limit" :placeholder="$t('common.placeholder')+$t('page.cc.limit')"></t-input-number>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')"  name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formData.remarks" :placeholder="$t('common.placeholder_content')" name="remarks">
            </t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- Edit CC Protect Dialog -->
    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="form" :rules="rules" @submit="onSubmitEdit" :labelWidth="150">
          <t-form-item :label="$t('page.cc.website')"  name="host_code">
            <t-select v-model="formEditData.host_code" clearable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item"
                :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.cc.url')" name="url">
            <t-input :style="{ width: '480px' }" v-model="formEditData.url" :placeholder="$t('page.cc.input_url_placeholder')"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.cc.rate')"  name="rate">
            <t-input-number :style="{ width: '480px' }" v-model="formEditData.rate" :placeholder="$t('common.placeholder')+$t('page.cc.rate')"></t-input-number>
          </t-form-item>
          <t-form-item :label="$t('page.cc.limit')"  name="limit">
            <t-input-number :style="{ width: '480px' }" v-model="formEditData.limit" :placeholder="$t('common.placeholder')+$t('page.cc.limit')"></t-input-number>
          </t-form-item>

          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formEditData.remarks" :placeholder="$t('common.placeholder_content')" name="remarks">
            </t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseEditBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
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
    wafAntiCCListApi,wafAntiCCDelApi,wafAntiCCEditApi,wafAntiCCAddApi,wafAntiCCDetailApi
  } from '@/apis/anticc';
  import {
    SSL_STATUS,
    GUARD_STATUS,
    CONTRACT_STATUS,
    CONTRACT_STATUS_OPTIONS,
    CONTRACT_TYPES,
    CONTRACT_PAYMENT_TYPES
  } from '@/constants';

  const INITIAL_DATA = {
    host_code: '',
    url: '',
    rate: 1,
    limit: 30,
    remarks: '',
  };
  export default Vue.extend({
    name: 'ListBase',
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
            title: this.$t('page.cc.website'),
            align: 'left',
            width: 250,
            ellipsis: true,
            colKey: 'host_code',
          },
          {
            title: this.$t('page.cc.rate'),
            width: 200,
            ellipsis: true,
            colKey: 'rate',
          },
          {
            title: this.$t('page.cc.limit'),
            width: 200,
            ellipsis: true,
            colKey: 'limit',
          },
          {
            title: this.$t('common.create_time'),
            width: 200,
            ellipsis: true,
            colKey: 'create_time',
          },

          {
            align: 'left',
            width: 200,
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
          url:"",
          host_code:""
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
      this.loadHostList()
      this.getList("")
    },

    methods: {
      loadHostList(){
        let that = this;
        allhost().then((res) => {
              let resdata = res
              console.log(resdata)
              if (resdata.code === 0) {
                  let host_options = resdata.data;
                  for(let i = 0;i<host_options.length;i++){
                      that.host_dic[host_options[i].value] =  host_options[i].label
                  }
              }
            })
            .catch((e: Error) => {
              console.log(e);
        })
      },
      getList(keyword) {
        let that = this
        wafAntiCCListApi( {
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
      handleClickEdit(e) {
        const {
          id
        } = e.row
        console.log(id)
        this.editFormVisible = true
        this.getDetail(id)
      },
      handleAddAntiCC() {
        this.addFormVisible = true
        this.formData =  {
          host_code: '',
          url: '',
          remarks: '',
          rate:1,
          limit:30
        };
      },
      onSubmit({
        result,
        firstError
      }): void {
        let that = this
        if (!firstError) {

          let postdata = {
            ...that.formData
          }
          wafAntiCCAddApi({
              ...postdata
            })
            .then((res) => {
              let resdata = res
              console.log(resdata)
              if (resdata.code === 0) {
                that.$message.success(resdata.msg);
                that.addFormVisible = false;
                that.pagination.current = 1
                that.getList("")
              } else {
                that.$message.warning(resdata.msg);
              }
            })
            .catch((e: Error) => {
              console.log(e);
            })
            .finally(() => {});
        } else {
          console.log('Errors: ', result);
          that.$message.warning(firstError);
        }
      },
      onSubmitEdit({
        result,
        firstError
      }): void {
        let that = this
        if (!firstError) {

          let postdata = {
            ...that.formEditData
          }
          wafAntiCCEditApi({
              ...postdata
            })
            .then((res) => {
              let resdata = res
              console.log(resdata)
              if (resdata.code === 0) {
                that.$message.success(resdata.msg);
                that.editFormVisible = false;
                that.pagination.current = 1
                that.getList("")
              } else {
                that.$message.warning(resdata.msg);
              }
            })
            .catch((e: Error) => {
              console.log(e);
            })
            .finally(() => {});
        } else {
          console.log('Errors: ', result);
          that.$message.warning(firstError);
        }
      },
      onClickCloseBtn(): void {
        this.addFormVisible = false;
        this.formData = {...INITIAL_DATA};
      },
      onClickCloseEditBtn(): void {
        this.editFormVisible = false;
        this.formEditData = {...INITIAL_DATA};
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
        wafAntiCCDelApi( {
              id: id
          })
          .then((res) => {
            let resdata = res
            console.log(resdata)
            if (resdata.code === 0) {

              that.pagination.current = 1
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
        wafAntiCCDetailApi( {
              id: id
          })
          .then((res) => {
            let resdata = res
            console.log(resdata)
            if (resdata.code === 0) {
              that.detail_data = resdata.data;
              that.formEditData = {
                ...that.detail_data
              }
            }
          })
          .catch((e: Error) => {
            console.log(e);
          })
          .finally(() => {});
      },
      //跳转界面
      handleJumpOnlineUrl(){
        window.open(this.samwafglobalconfig.getOnlineUrl()+"/guide/CC.html");
      },
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
