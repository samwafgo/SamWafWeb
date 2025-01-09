<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">

        </div>
        <div >
          <t-form ref="form" :data="searchformData" :label-width="90" layout="inline" colon >
            <t-form-item :label="$t('page.host.loadbalance.remote_ip')" name="remote_ip">
              <t-input v-model="searchformData.remote_ip"  :placeholder="$t('common.placeholder')" clearable>
              </t-input>
            </t-form-item>
            <t-form-item :label="$t('page.host.loadbalance.remote_port')" name="remote_port">
              <t-input v-model="searchformData.remote_port"  :placeholder="$t('common.placeholder')" clearable>
              </t-input>
            </t-form-item>
            <t-form-item >
              <t-button theme="default"  @click="handleAdd">
                <add-icon slot="icon" />
                {{ $t('page.host.loadbalance.label_add_loadbalance') }} </t-button>
              <t-button theme="default"   @click="getList('all')">
                  <search-icon slot="icon" />
                  {{ $t('common.search') }} </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
          @page-change="rehandlePageChange" @change="rehandleChange" @select-change="rehandleSelectChange"
          :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop }">

         <template #host_code="{ row }">
            <span> {{host_dic[row.host_code]}}</span>
          </template>

          <template #op="slotProps">
            <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>

    </t-card>


    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="100">
          <t-form-item :label="$t('page.host.loadbalance.remote_ip')" name="remote_ip">
            <t-input :style="{ width: '480px' }" v-model="formData.remote_ip" ></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.host.loadbalance.remote_port')" name="remote_port">
            <t-input-number :style="{ width: '480px' }" v-model="formData.remote_port" min="1" max="65535"></t-input-number>
          </t-form-item>
          <t-form-item :label="$t('page.host.loadbalance.weight')" name="weight" >
            <t-input-number :style="{ width: '480px' }" v-model="formData.weight" min="1" defaultValue="5"  max="10"></t-input-number>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formData.remarks"  name="remarks">
            </t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="form" :rules="rules" @submit="onSubmitEdit" :labelWidth="100">
         <t-form-item :label="$t('page.host.loadbalance.remote_ip')" name="remote_ip">
           <t-input :style="{ width: '480px' }" v-model="formEditData.remote_ip"></t-input>
         </t-form-item>
          <t-form-item :label="$t('page.host.loadbalance.remote_port')" name="remote_port">
            <t-input-number :style="{ width: '480px' }" v-model="formEditData.remote_port" min="1" max="65535"></t-input-number>
          </t-form-item>
          <t-form-item :label="$t('page.host.loadbalance.weight')" name="weight">
            <t-input-number :style="{ width: '480px' }" v-model="formEditData.weight" min="1" defaultValue="5"  max="10"></t-input-number>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formEditData.remarks"  name="remarks">
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
    SearchIcon,AddIcon
  } from 'tdesign-icons-vue';
  import Trend from '@/components/trend/index.vue';
  import {
    prefix
  } from '@/config/global';
  import {
    allhost
  } from '@/apis/host';

  import {
    wafLoadBalanceDetailApi,wafLoadBalanceListApi,wafLoadBalanceEditApi,wafLoadBalanceDelApi,wafLoadBalanceAddApi
  } from '@/apis/loadbalance';


  const INITIAL_DATA = {
    remote_ip: '',
    remote_port: 0,
    weight: 5,
    remarks: '',
  };
  export default Vue.extend({
    name: 'LoadBalance',
    components: {
      SearchIcon,
      Trend,
      AddIcon
    },
    props: {
      propHostCode: String,
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
            message: this.$t('common.placeholder')+this.$t('page.host.loadbalance.website'),
            type: 'error'
          }],
          remote_ip: [{
            required: true,
            message: this.$t('common.placeholder')+this.$t('page.host.loadbalance.remote_ip'),
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
          /*{
            title: this.$t('page.host.loadbalance.website'),
            width: 150,
            ellipsis: true,
            colKey: 'host_code',
          },*/
          {
            title: this.$t('page.host.loadbalance.remote_ip'),
            width: 150,
            ellipsis: true,
            colKey: 'remote_ip',
          },
          {
            title: this.$t('page.host.loadbalance.remote_port'),
            width: 100,
            ellipsis: true,
            colKey: 'remote_port',
          },
          {
            title: this.$t('page.host.loadbalance.weight'),
            width: 50,
            ellipsis: true,
            colKey: 'weight',
          },
          {
            title: this.$t('common.remarks'),
            width: 50,
            ellipsis: true,
            colKey: 'remarks',
          },
          {
            align: 'left',
            fixed: 'right',
            width: 100,
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
          host_code:"",
          remote_ip:"",
          remote_port:""
        },
        //索引区域
        deleteIdx: -1,
        guardStatusIdx :-1,
        //主机字典
        host_dic:{}
      };
    },
    watch: {
      propHostCode(newVal) {
        // 当 propHostCode 更新时，更新相应的数据
        this.searchformData.host_code = newVal;
        this.getList("")
      }
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
    created() {
      this.searchformData.host_code = this.propHostCode;
    },
    mounted() {
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
        let postdata = {
          pageSize: that.pagination.pageSize,
          pageIndex: that.pagination.current,
          ...that.searchformData
        }
        postdata['remote_port'] = Number(postdata['remote_port'])
        console.log('getList',postdata)
        wafLoadBalanceListApi( {...postdata})
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
      handleClickEdit(e) {
        console.log(e)
        const {
          id
        } = e.row
        console.log(id)
        this.editFormVisible = true
        this.getDetail(id)
      },
      handleAdd() {
        this.addFormVisible = true
        this.formData = {...INITIAL_DATA};
        this.formData.host_code = this.propHostCode
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
          postdata['remote_port'] = Number(postdata['remote_port'])
          postdata['weight'] = Number(postdata['weight'])
          wafLoadBalanceAddApi({...postdata})
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
          postdata['remote_port'] = Number(postdata['remote_port'])
          postdata['weight'] = Number(postdata['weight'])
          wafLoadBalanceEditApi({...postdata})
            .then((res) => {
              let resdata = res
              console.log(resdata)
              if (resdata.code === 0) {
                that.$message.success(resdata.msg);
                that.editFormVisible = false;
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
        wafLoadBalanceDelApi({
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
        wafLoadBalanceDetailApi({
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
