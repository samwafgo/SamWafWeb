<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <!--<t-button @click="handleAdd">
            {{ $t('common.new') }}
          </t-button>-->
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
      <t-alert theme="info" :message="$t('page.task.alert_message')" close>
        <template #operation>
          <span @click="handleJumpOnlineUrl">{{ $t('common.online_document') }}</span>
        </template>
      </t-alert>
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
                 :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
                 @page-change="rehandlePageChange" @change="rehandleChange" @select-change="rehandleSelectChange"
                 :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">
          <template #task_unit="{ row }">
            <p>
              {{
                task_unit_type.find(option => option.value === row.task_unit)?.label || row.task_unit
              }}
            </p>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
            <!--<a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>-->
            <a class="t-button-link" @click="handleManual(slotProps)">{{ $t('page.task.button_manual_execute') }}</a>
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




          <t-form-item :label="$t('page.task.task_name')" name="task_name">
            <t-input :style="{ width: '480px' }" v-model="formData.task_name" :placeholder="$t('common.placeholder')+$t('page.task.task_name')"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.task.task_unit')" name="task_unit">
            <t-select :style="{ width: '480px' }" v-model="formData.task_unit" :placeholder="$t('common.select')+$t('page.task.task_unit')">
              <t-option v-for="item in task_unit_type" :key="item.value" :value="item.value" :label="item.label">
                {{ item.label }}
              </t-option>
            </t-select>
          </t-form-item>

          <t-form-item :label="$t('page.task.task_value')" name="task_value">
            <t-input-number :style="{ width: '480px' }" v-model="formData.task_value" :placeholder="$t('common.placeholder')+$t('page.task.task_value')">
            </t-input-number>
          </t-form-item>

          <t-form-item :label="$t('page.task.task_at')" name="task_at">
            <t-input :style="{ width: '480px' }" v-model="formData.task_at" :placeholder="$t('page.task.task_at_placeholder')"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.task.task_method')" name="task_method">
            <t-select :style="{ width: '480px' }" v-model="formData.task_method" :placeholder="$t('common.select')+$t('page.task.task_method')" filterable>
              <t-option v-for="item in task_method_type" :key="item.value" :value="item.value" :label="item.label">
                {{ item.label }}
              </t-option>
            </t-select>
          </t-form-item>

          <t-form-item :label="$t('page.task.task_days_of_week')" name="task_days_of_the_week" v-if="formData.task_unit === 'weekly'">
            <t-select :style="{ width: '480px' }" v-model="formData.task_days_of_the_week" :placeholder="$t('common.select')+$t('page.task.task_days_of_week')">
              <t-option v-for="item in week_days_type" :key="item.value" :value="item.value" :label="item.label">
                {{ item.label }}
              </t-option>
            </t-select>
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




          <t-form-item :label="$t('page.task.task_name')" name="task_name">
            <t-input :style="{ width: '480px' }" v-model="formEditData.task_name" :placeholder="$t('common.placeholder')+$t('page.task.task_name')"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.task.task_unit')" name="task_unit">
            <t-select :style="{ width: '480px' }" v-model="formEditData.task_unit" :placeholder="$t('common.select')+$t('page.task.task_unit')">
              <t-option v-for="item in task_unit_type" :key="item.value" :value="item.value" :label="item.label">
                {{ item.label }}
              </t-option>
            </t-select>
          </t-form-item>

          <t-form-item :label="$t('page.task.task_value')" name="task_value">
            <t-input-number :style="{ width: '480px' }" v-model="formEditData.task_value" :placeholder="$t('common.placeholder')+$t('page.task.task_value')">
            </t-input-number>
          </t-form-item>

          <t-form-item :label="$t('page.task.task_at')" name="task_at">
            <t-input :style="{ width: '480px' }" v-model="formEditData.task_at" :placeholder="$t('page.task.task_at_placeholder')"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.task.task_method')" name="task_method">
            <t-select :style="{ width: '480px' }" v-model="formEditData.task_method" :placeholder="$t('common.select')+$t('page.task.task_method')" filterable disabled>
              <t-option v-for="item in task_method_type" :key="item.value" :value="item.value" :label="item.label">
                {{ item.label }}
              </t-option>
            </t-select>
          </t-form-item>

          <t-form-item :label="$t('page.task.task_days_of_week')" name="task_days_of_the_week" v-if="formEditData.task_unit === 'weekly'">
            <t-select :style="{ width: '480px' }" v-model="formEditData.task_days_of_the_week" :placeholder="$t('common.select')+$t('page.task.task_days_of_week')">
              <t-option v-for="item in week_days_type" :key="item.value" :value="item.value" :label="item.label">
                {{ item.label }}
              </t-option>
            </t-select>
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
  wafTaskListApi,wafTaskDelApi,wafTaskEditApi,wafTaskAddApi,wafTaskDetailApi,wafTaskManualExecApi
} from '@/apis/task.ts';

const INITIAL_DATA = {
  task_name:'',
  task_unit:'',
  task_value:'',
  task_at:'',
  task_method:'',
  task_days_of_the_week:'',
};
export default Vue.extend({
  name: 'TaskBase',
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
        task_name: [{
          required: true,
          message: this.$t('common.placeholder')+this.$t('page.task.task_name'),
          type: 'error'
        }],
        task_unit: [{
          required: true,
          message: this.$t('common.select')+this.$t('page.task.task_unit'),
          type: 'error'
        }],
        task_value: [{
          required: true,
          message: this.$t('common.placeholder')+this.$t('page.task.task_value'),
          type: 'error'
        }],
        task_method: [{
          required: true,
          message: this.$t('common.select')+this.$t('page.task.task_method'),
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
        { title: this.$t('page.task.task_name'),
          width: 300,
          ellipsis: true,
          colKey: 'task_name',
        },


        { title: this.$t('page.task.task_unit'),
          width: 150,
          ellipsis: true,
          colKey: 'task_unit',
        },


        { title: this.$t('page.task.task_value'),
          width: 150,
          ellipsis: true,
          colKey: 'task_value',
        },
        { title: this.$t('page.task.task_at'),
          width: 200,
          ellipsis: true,
          colKey: 'task_at',
        },

        { title: this.$t('page.task.task_method'),
          width: 200,
          ellipsis: true,
          colKey: 'task_method',
        },
        
        { title: this.$t('page.task.task_days_of_week'),
          width: 150,
          ellipsis: true,
          colKey: 'task_days_of_the_week',
        },

        {
          align: 'left',
          fixed: 'right',
          width: 280,
          colKey: 'op',
          title: this.$t('common.op'),
        },
      ],
      //间隔单位转换
      task_unit_type: [
        {
          label: this.$t('page.task.task_unit_type.second'),
          value: 'second'
        },{
          label: this.$t('page.task.task_unit_type.minute'),
          value: 'minute'
        },{
          label: this.$t('page.task.task_unit_type.hour'),
          value: 'hour'
        },{
          label: this.$t('page.task.task_unit_type.day'),
          value: 'day'
        },{
          label: this.$t('page.task.task_unit_type.weekly'),
          value: 'weekly'
        },
      ],
      //任务方法类型
      task_method_type: [
        {
          label: this.$t('page.task.task_method_type.runtime_qps_clean'),
          value: 'task_runtime_qps_clean'
        },
        {
          label: this.$t('page.task.task_method_type.host_qps_clean'),
          value: 'task_host_qps_clean'
        },
        {
          label: this.$t('page.task.task_method_type.share_db'),
          value: 'task_share_db'
        },
        {
          label: this.$t('page.task.task_method_type.counter'),
          value: 'task_counter'
        },
        {
          label: this.$t('page.task.task_method_type.delay_info'),
          value: 'task_delay_info'
        },
        {
          label: this.$t('page.task.task_method_type.load_config'),
          value: 'task_load_config'
        },
        {
          label: this.$t('page.task.task_method_type.reflush_wechat_access_token'),
          value: 'task_reflush_wechat_access_token'
        },
        {
          label: this.$t('page.task.task_method_type.delete_history_info'),
          value: 'task_delete_history_info'
        },
        {
          label: this.$t('page.task.task_method_type.delete_history_download_file'),
          value: 'task_delete_history_download_file'
        },
        {
          label: this.$t('page.task.task_method_type.ssl_order_renew'),
          value: 'task_ssl_order_renew'
        },
        {
          label: this.$t('page.task.task_method_type.ssl_path_load'),
          value: 'task_ssl_path_load'
        },
        {
          label: this.$t('page.task.task_method_type.batch'),
          value: 'task_batch'
        },
        {
          label: this.$t('page.task.task_method_type.ssl_expire_check'),
          value: 'task_ssl_expire_check'
        },
        {
          label: this.$t('page.task.task_method_type.notice'),
          value: 'task_notice'
        },
        {
          label: this.$t('page.task.task_method_type.health'),
          value: 'task_health'
        },
        {
          label: this.$t('page.task.task_method_type.clear_cc_windows'),
          value: 'task_clear_cc_windows'
        },
        {
          label: this.$t('page.task.task_method_type.clear_webcache'),
          value: 'task_clear_webcache'
        },
        {
          label: this.$t('page.task.task_method_type.gc'),
          value: 'task_gc'
        },
        {
          label: this.$t('page.task.task_method_type.stats_push'),
          value: 'task_stats_push'
        },
        {
          label: this.$t('page.task.task_method_type.db_monitor'),
          value: 'task_db_monitor'
        },
        {
          label: this.$t('page.task.task_method_type.firewall_clean_expired'),
          value: 'task_firewall_clean_expired'
        },
      ],
      //星期选项
      week_days_type: [
        {
          label: this.$t('page.task.week_days.sunday'),
          value: '0'
        },
        {
          label: this.$t('page.task.week_days.monday'),
          value: '1'
        },
        {
          label: this.$t('page.task.week_days.tuesday'),
          value: '2'
        },
        {
          label: this.$t('page.task.week_days.wednesday'),
          value: '3'
        },
        {
          label: this.$t('page.task.week_days.thursday'),
          value: '4'
        },
        {
          label: this.$t('page.task.week_days.friday'),
          value: '5'
        },
        {
          label: this.$t('page.task.week_days.saturday'),
          value: '6'
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
      wafTaskListApi( {
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
    handleManual(e) {
      console.log(e)
      const {
        id
      } = e.row
      console.log(id)
      wafTaskManualExecApi({id:id}).then((res)=>{
        let resdata = res
        console.log(resdata)
        if (resdata.code === 0) {
          this.$message.success(resdata.msg);
        } else {
          this.$message.warning(resdata.msg);
        }
      }).catch((e: Error) => {
        console.log(e);
      })
      .finally(() => {});
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
      this.formData = { ...INITIAL_DATA };
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
        postdata['task_value'] = Number(postdata['task_value'])
        
        // 如果不是weekly类型，清空task_days_of_the_week
        if (postdata['task_unit'] !== 'weekly') {
          postdata['task_days_of_the_week'] = ''
        }
        
        wafTaskAddApi({...postdata})
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

        postdata['task_value'] = Number(postdata['task_value'])
        
        // 如果不是weekly类型，清空task_days_of_the_week
        if (postdata['task_unit'] !== 'weekly') {
          postdata['task_days_of_the_week'] = ''
        }

        wafTaskEditApi({...postdata})
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
      wafTaskDelApi({
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
      wafTaskDetailApi({
        id: id
      })
        .then((res) => {
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {
            that.detail_data = resdata.data;

            that.detail_data.task_value = that.detail_data.task_value.toString()

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
      window.open(this.samwafglobalconfig.getOnlineUrl()+"/guide/Task.html");
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
