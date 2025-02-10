<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAdd" theme="success"> {{ $t('common.new') }} </t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="300" layout="inline" colon :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.batchtask.label_batch_task_name')" name="batch_task_name">
              <t-input v-model="searchformData.batch_task_name" class="search-input" clearable></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <t-alert theme="info" :message="$t('page.batchtask.alert_message')" close>
        <template #operation>
          <span @click="handleJumpOnlineUrl">{{ $t('common.online_document') }}</span>
        </template>
      </t-alert>
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
                 :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
                 @page-change="rehandlePageChange"
                 :headerAffixedTop="true" >
           <template #batch_host_code="{ row }">
            <span> {{host_dic[row.batch_host_code]}}</span>
          </template>

         <template #batch_type="{ row }">
            <p>
              {{
                batch_task_type.find(option => option.value === row.batch_type)?.label || row.batch_type
              }}
            </p>
          </template>
          <template #batch_source_type="{ row }">
            <p>
              {{
               batch_source_type.find(option => option.value === row.batch_source_type)?.label || row.batch_source_type
              }}
            </p>
          </template>
          <template #batch_execute_method="{ row }">
            <p>
              {{
                batch_execute_method.find(option => option.value === row.batch_execute_method)?.label || row.batch_execute_method
              }}
            </p>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleClickManual(slotProps)">{{ $t('page.batchtask.label_btn_manual') }}</a>
            <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
      <div>
        <router-view></router-view>
      </div>
    </t-card>

    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="750" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="220">
         <t-form-item :label="$t('page.batchtask.label_batch_task_name')" name="batch_task_name">
        <t-input v-model="formData.batch_task_name" :style="{ width: '480px' }"></t-input>
      </t-form-item>
      <t-form-item :label="$t('page.batchtask.label_website')" name="batch_host_code">
            <t-select v-model="formData.batch_host_code" clearable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item"
                :key="index">
                {{ item }}
              </t-option>
            </t-select>
      </t-form-item>
      <t-form-item :label="$t('page.batchtask.label_batch_type')" name="batch_type">
         <t-select v-model="formData.batch_type" :style="{ width: '480px' }">
          <t-option v-for="item in batch_task_type" :value="item.value" :label="`${item.label}`"></t-option>
        </t-select>
      </t-form-item>
      <t-form-item :label="$t('page.batchtask.label_batch_source_type')" name="batch_source_type">
        <t-select v-model="formData.batch_source_type" :style="{ width: '480px' }">
          <t-option  v-for="item in batch_source_type" :value="item.value" :label="`${item.label}`" ></t-option>
        </t-select>
      </t-form-item>
      <t-form-item :label="$t('page.batchtask.label_batch_source')" name="batch_source">
        <t-input v-model="formData.batch_source" :style="{ width: '480px' }"></t-input>
      </t-form-item>
      <t-form-item :label="$t('page.batchtask.label_batch_execute_method')" name="batch_execute_method">
        <t-select v-model="formData.batch_execute_method" :style="{ width: '480px' }">
          <t-option  v-for="item in batch_execute_method" :value="item.value" :label="`${item.label}`" ></t-option>
        </t-select>
      </t-form-item>
      <t-form-item :label="$t('page.batchtask.label_remark')" name="remark">
        <t-textarea v-model="formData.remark" :style="{ width: '480px' }" rows="4"></t-textarea>
      </t-form-item>
      <t-form-item style="float: right">
        <t-button variant="outline" @click="onClickCloseBtn">{{ $t('common.close') }}</t-button>
        <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
      </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="750" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="form" :rules="rules" @submit="onSubmitEdit" :labelWidth="220">
          <t-form-item :label="$t('page.batchtask.label_batch_task_name')" name="batch_task_name">
            <t-input v-model="formEditData.batch_task_name" :style="{ width: '480px' }"></t-input>
          </t-form-item>
           <t-form-item :label="$t('page.batchtask.label_website')" name="batch_host_code">
            <t-select v-model="formEditData.batch_host_code" clearable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item"
                :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.batchtask.label_batch_type')" name="batch_type">
            <t-select v-model="formEditData.batch_type" :style="{ width: '480px' }">
              <t-option v-for="item in batch_task_type" :value="item.value" :label="`${item.label}`"></t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.batchtask.label_batch_source_type')" name="batch_source_type">
               <t-select v-model="formEditData.batch_source_type" :style="{ width: '480px' }">
                <t-option  v-for="item in batch_source_type" :value="item.value" :label="`${item.label}`" ></t-option>
              </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.batchtask.label_batch_source')" name="batch_source">
            <t-input v-model="formEditData.batch_source" :style="{ width: '480px' }"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.batchtask.label_batch_execute_method')" name="batch_execute_method">
            <t-select v-model="formEditData.batch_execute_method" :style="{ width: '480px' }">
              <t-option  v-for="item in batch_execute_method" :value="item.value" :label="`${item.label}`" ></t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.batchtask.label_remark')" name="remark">
            <t-textarea v-model="formEditData.remark" :style="{ width: '480px' }" rows="4"></t-textarea>
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
  batchTaskAddApi,batchTaskDelApi,batchTaskDetailApi,batchTaskEditApi,batchTaskListApi ,batchTaskManualApi
} from '@/apis/batchtask';
  import {
    allhost
  } from '@/apis/host';
const INITIAL_DATA = {
  batch_task_name: '',
  batch_host_code: '',
  batch_type: 'ipallow',
  batch_source_type: 'local',
  batch_source: '',
  batch_execute_method: 'append',
  remark: '',
};

export default Vue.extend({
  name: 'BatchTaskList',
  components: {
    SearchIcon,
    Trend,
  },
  data() {
    return {
      addFormVisible: false,
      editFormVisible: false,
      confirmVisible: false,
      formData: {
        ...INITIAL_DATA
      },
      formEditData: {
        ...INITIAL_DATA
      },
      rules: {
        batch_host_code: [{
            required: true,
            message: this.$t('common.select_placeholder')+this.$t('page.batchtask.label_website'),
            type: 'error'
        }],
        batch_task_name: [
          {
            required: true,
            message: this.$t('common.select_placeholder') + this.$t('page.batchtask.label_batch_task_name'),
            type: 'error'
          }
        ],
        batch_type: [
          {
            required: true,
            message: this.$t('common.select_placeholder') + this.$t('page.batchtask.label_batch_type'),
            type: 'error'
          }
        ],
        batch_source_type: [
          {
            required: true,
            message: this.$t('common.select_placeholder') + this.$t('page.batchtask.label_batch_source_type'),
            type: 'error'
          }
        ],
        batch_source: [
          {
            required: true,
            message: this.$t('common.select_placeholder') + this.$t('page.batchtask.label_batch_source'),
            type: 'error'
          }
        ],
        batch_execute_method: [
          {
            required: true,
            message: this.$t('common.select_placeholder') + this.$t('page.batchtask.label_batch_execute_method'),
            type: 'error'
          }
        ],
        remark: [
          {
            required: false,
            message: this.$t('common.select_placeholder') + this.$t('page.batchtask.label_remark'),
            type: 'error'
          }
        ]
      },
      dataLoading: false,
      data: [], // 列表数据信息
      selectedRowKeys: [],
      columns: [
       {
          title: this.$t('page.batchtask.label_website'),
          align: 'left',
          width: 250,
          ellipsis: true,
          colKey: 'batch_host_code',
          fixed: 'left',
        },
        {
          title: this.$t('page.batchtask.label_batch_task_name'),
          align: 'left',
          width: 250,
          ellipsis: true,
          colKey: 'batch_task_name',
        },
        {
          title: this.$t('page.batchtask.label_batch_type'),
          align: 'left',
          width: 250,
          ellipsis: true,
          colKey: 'batch_type',
        },
        {
          title: this.$t('page.batchtask.label_batch_source_type'),
          width: 200,
          ellipsis: true,
          colKey: 'batch_source_type',
        },
        {
          title: this.$t('page.batchtask.label_batch_source'),
          width: 200,
          ellipsis: true,
          colKey: 'batch_source',
        },
        {
          title: this.$t('page.batchtask.label_batch_execute_method'),
          width: 200,
          ellipsis: true,
          colKey: 'batch_execute_method',
        },
        {
          title: this.$t('page.batchtask.label_remark'),
          width: 250,
          ellipsis: true,
          colKey: 'remark',
        },
        {
          align: 'left',
          width: 300,
          colKey: 'op',
          title: this.$t('common.op'),
        },
      ],
      rowKey: 'id',
      tableLayout: 'auto',
      verticalAlign: 'top',
      hover: true,
      pagination: {
        total: 0,
        current: 1,
        pageSize: 10
      },
      searchformData: {
        batch_task_name: '',
      },
      deleteIdx: -1,
      //任务类型
      batch_task_type: [
        {
            label: this.$t('page.batchtask.batch_type.add_ipallow'),
            value: 'ipallow'
       },
        {
        label: this.$t('page.batchtask.batch_type.add_ipdeny'),
        value: 'ipdeny'
         },
      ],
      //来源类型
      batch_source_type: [
        {
            label: this.$t('page.batchtask.batch_source_type.local'),
            value: 'local'
       },{
            label: this.$t('page.batchtask.batch_source_type.remote'),
            value: 'remote'
       },
      ],
      //执行方式
      batch_execute_method: [
        {
            label: this.$t('page.batchtask.batch_execute_method.append'),
            value: 'append'
       },{
            label: this.$t('page.batchtask.batch_execute_method.overwrite'),
            value: 'overwrite'
       },
      ],
       //主机字典
      host_dic:{},
      //默认主机
      default_host_code:"",
      //end data
    };
  },
  computed: {
    confirmBody() {
      if (this.deleteIdx > -1) {
        return this.$t('common.confirm_delete');
      }
      return '';
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
                if(host_options.length>0){
                 this.default_host_code = host_options[0].value;
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
    rehandlePageChange(curr, pageInfo) {
      this.pagination.current = curr.current
      if (this.pagination.pageSize != curr.pageSize) {
        this.pagination.current = 1
        this.pagination.pageSize = curr.pageSize
      }
      this.getList("")
    },
    getList(keyword) {
      let that = this;
      batchTaskListApi({
        pageSize: that.pagination.pageSize,
        pageIndex: that.pagination.current,
        ...that.searchformData
      })
        .then((res) => {
          let resdata = res;
          if (resdata.code === 0) {
            this.data = resdata.data.list??[];
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
    handleAdd() {
      this.addFormVisible = true;
      this.formData = {
        ...INITIAL_DATA
      };
      this.formData.batch_host_code = this.default_host_code
    },
    onSubmit({
               result,
               firstError
             }): void {
      let that = this;
      if (!firstError) {
        batchTaskAddApi({
          ...this.formData,
        })
          .then((res) => {
            if (res.code === 0) {
              that.getList('');
              that.$message.success('添加成功');
              that.addFormVisible = false;
            }else{
              that.$message.warning(res.msg);
            }
          });
      }
    },
    handleClickEdit(slotProps) {
      const {
        row
      } = slotProps;
      this.formEditData = {
        ...row
      };
      this.editFormVisible = true;
    },
    onSubmitEdit({
                   result,
                   firstError
                 }): void {
      let that = this;
      if (!firstError) {
        batchTaskEditApi({
          ...this.formEditData,
        })
          .then((res) => {
            if (res.code === 0) {
              that.getList('');
              that.$message.success('编辑成功');
              that.editFormVisible = false;
            }else{
              that.$message.warning(res.msg);
            }
          });
      }
    },
    handleClickDelete(slotProps) {
      const {
        row
      } = slotProps;
      this.deleteIdx = row.id;
      this.confirmVisible = true;
    },
    onConfirmDelete() {
      let that = this;
      batchTaskDelApi({
        id: this.deleteIdx
      })
        .then((res) => {
          if (res.code === 0) {
            that.getList('');
            that.$message.success('删除成功');
            that.confirmVisible = false;
            that.deleteIdx = -1;
          }
        });
    },
    /**
     * 手工触发
     * @param slotProps
     */
    handleClickManual(slotProps) {
      console.log("slotProps",slotProps)
      const {
        id
      } = slotProps.row;
      let that = this;
      const confirmDialog = that.$dialog.confirm({
      body: this.$t('page.batchtask.label_confirm_message'),
      confirmBtn: this.$t('common.confirm'),
      cancelBtn: this.$t('common.cancel'),
      theme: 'warning',
      onConfirm: () => {
          batchTaskManualApi({
          id: id
        })
          .then((res) => {
            if (res.code === 0) {
              that.$message.success('执行成功');

            }
          });
          // 请求成功后，销毁弹框
          confirmDialog.destroy();
      },
      onCancel: () => {
        console.log('操作取消');
      }
    });



    },
    onCancel() {
      this.confirmVisible = false;
      this.deleteIdx = -1;
    },
    handleJumpOnlineUrl() {
      window.open(this.samwafglobalconfig.getOnlineUrl()+"/guide/BatchTask.html");
    },
    onClickCloseBtn() {
      this.addFormVisible = false;
    },
    onClickCloseEditBtn() {
      this.editFormVisible = false;
    },
  },
});
</script>

<style scoped>
.list-card-container {
  padding: 20px;
}
.table-container {
  margin-top: 20px;
}
.search-input {
  width: 200px;
}
</style>
