<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAddipblock"> {{ $t('page.ipblock.button_add_ip') }} </t-button>
          <t-button variant="base" theme="default" @click="HandleExportExcel()"> {{ $t('page.ipblock.export_data') }} </t-button>
          <t-button 
            theme="danger" 
            variant="outline" 
            @click="handleBatchDelete"
            :disabled="selectedRowKeys.length === 0">
            {{ $t('page.ipblock.button_batch_delete') }}
          </t-button>
          <t-button 
            theme="danger" 
            :disabled="data.length === 0"
            @click="handleClearAll" >
            {{ $t('page.ipblock.button_clear_all') }}
          </t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="80" layout="inline" colon :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.ipblock.label_website')" name="host_code">
              <t-select v-model="searchformData.host_code" clearable :style="{ width: '150px' }">
                <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                  {{ item }}
                </t-option>
              </t-select>
            </t-form-item>
            <t-form-item :label="'Ip'" name="ip">
              <t-input v-model="searchformData.ip" class="search-input" clearable>
              </t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>

        </div>
      </t-row>
      <t-alert theme="info" :message="$t('page.ipblock.alert_message')" close>
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

    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="100">
          <t-form-item :label="$t('page.ipblock.label_website')" name="host_code">
            <t-select v-model="formData.host_code" clearable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item"
                :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.ipblock.label_ip')" name="ip">
            <t-input :style="{ width: '480px' }" v-model="formData.ip" ></t-input>
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

    <t-dialog :header=" $t('common.edit')" :visible.sync="editFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="form" :rules="rules" @submit="onSubmitEdit" :labelWidth="100">
          <t-form-item :label="$t('page.ipblock.label_website')" name="host_code">
            <t-select v-model="formEditData.host_code" clearable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item"
                :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>
         <t-form-item :label="$t('page.ipblock.label_ip')" name="ip">
           <t-input :style="{ width: '480px' }" v-model="formEditData.ip" ></t-input>
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

    <!-- 批量删除确认对话框 -->
    <t-dialog 
      :header="$t('page.ipblock.confirm_batch_delete')" 
      :body="$t('common.data_delete_warning')" 
      :visible.sync="batchDeleteConfirmVisible" 
      @confirm="onConfirmBatchDelete"
      :onCancel="onCancelBatchDelete">
    </t-dialog>

    <!-- 清空所有确认对话框 -->
    <t-dialog 
      :header="$t('page.ipblock.confirm_clear_all')" 
      :body="$t('common.data_delete_warning')" 
      :visible.sync="clearAllConfirmVisible" 
      @confirm="onConfirmClearAll"
      :onCancel="onCancelClearAll">
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
    wafIPBlockListApi,wafIPBlockDelApi,wafIPBlockEditApi,wafIPBlockAddApi,wafIPBlockDetailApi,wafIPBlockBatchDelApi,wafIPBlockDelAllApi
  } from '@/apis/ipblock';
  import {
    export_api
  } from '@/apis/common';
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
    ip: '',
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
        confirmVisible: false,
        batchDeleteConfirmVisible: false,
        clearAllConfirmVisible: false,
        formData: {
          ...INITIAL_DATA
        },
        formEditData: {
          ...INITIAL_DATA
        },
        rules: {
          host_code: [{
            required: true,
            message: this.$t('common.placeholder')+this.$t('page.ipblock.label_website'),
            type: 'error'
          }],
          ip: [{
            required: true,
            message: this.$t('common.placeholder')+this.$t('page.ipblock.label_ip'),
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
           { colKey: 'row-select', type: 'multiple', width: 64, fixed: 'left' },
          {
            title: this.$t('page.ipblock.label_website'),
            align: 'left',
            width: 250,
            ellipsis: true,
            colKey: 'host_code',
          },
          {
            title: this.$t('page.ipblock.label_ip'),
            width: 200,
            ellipsis: true,
            colKey: 'ip',
          },
          {
            title:this.$t('common.remarks'),
            width: 200,
            ellipsis: true,
            colKey: 'remarks',
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
        rowKey: 'id',
        tableLayout: 'auto',
        verticalAlign: 'top',
        hover: true,
        rowClassName: (rowKey: string) => `${rowKey}-class`,
        pagination: {
          total: 0,
          current: 1,
          pageSize: 10
        },
        //顶部搜索
        searchformData: {
          ip:"",
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
        wafIPBlockListApi( {
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

              this.loadHostList()
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
        console.log('统一Change', changeParams, triggerAndData);
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
      handleAddipblock() {
        this.addFormVisible = true
        this.formData = {
          host_code: '',
          ip: '',
          remarks: '',
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
          wafIPBlockAddApi({
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
          wafIPBlockEditApi({
              ...postdata
            })
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
        wafIPBlockDelApi({
              id: id
          })
          .then((res) => {
            let resdata = res
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
        wafIPBlockDetailApi({
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
      handleJumpOnlineUrl(){
        window.open(this.samwafglobalconfig.getOnlineUrl()+"/guide/IPBlack.html");
      },
      // 批量删除处理
      handleBatchDelete() {
        if (this.selectedRowKeys.length === 0) {
          this.$message.warning(this.$t('page.ipblock.no_data_selected'));
          return;
        }
        this.batchDeleteConfirmVisible = true;
      },

      // 清空所有处理
      handleClearAll() { 
        this.clearAllConfirmVisible = true;
      },

      // 确认批量删除
      onConfirmBatchDelete() {
        this.batchDeleteConfirmVisible = false;
        let that = this;
        
        wafIPBlockBatchDelApi({
          ids: this.selectedRowKeys
        })
        .then((res) => {
          let resdata = res;
          if (resdata.code === 0) {
            that.getList("");
            that.$message.success(that.$t('page.ipblock.batch_delete_success'));
            that.selectedRowKeys = []; // 清空选中项
          } else {
            that.$message.warning(resdata.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
      },

      // 确认清空所有
      onConfirmClearAll() {
        this.clearAllConfirmVisible = false;
        let that = this;
        
        wafIPBlockDelAllApi({
          host_code: this.searchformData.host_code
        })
        .then((res) => {
          let resdata = res;
          if (resdata.code === 0) {
            that.getList("");
            that.$message.success(that.$t('page.ipblock.clear_all_success'));
          } else {
            that.$message.warning(resdata.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
      },

      // 取消批量删除
      onCancelBatchDelete() {
        this.batchDeleteConfirmVisible = false;
      },

      // 取消清空所有
      onCancelClearAll() {
        this.clearAllConfirmVisible = false;
      },
      /**
       * 导出Excel数据
       */
      HandleExportExcel() {
        let that = this
        export_api({table_name: "ipblock"}).then((res) => {
          let resdata = res
          console.log(resdata)
          let blob = new Blob([res], {type: "application/force-download"}) // Blob 对象表示一个不可变、原始数据的类文件对象
          console.log(blob);
          let fileReader = new FileReader()   // FileReader 对象允许Web应用程序异步读取存储在用户计算机上的文件的内容
          fileReader.readAsDataURL(blob)
          //开始读取指定的Blob中的内容。一旦完成，result属性中将包含一个data: URL格式的Base64字符串以表示所读取文件的内容
          fileReader.onload = (e) => {
            let a = document.createElement('a')
            a.download = `ipblock.xlsx`
            a.href = e.target.result
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          }
        })
          .catch((e: Error) => {
            console.log(e);
          })
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

  
