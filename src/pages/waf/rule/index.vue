<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAddRule"> {{ $t('page.rule.button_add_rule') }} </t-button>
          <t-button 
            theme="danger" 
            variant="outline" 
            @click="handleBatchDelete"
            :disabled="selectedRowKeys.length === 0"
          >
            {{ $t('page.rule.button_batch_delete') }}
          </t-button>
          <t-button 
            theme="danger" 
            :disabled="data.length === 0"
            @click="handleClearAll"
          >
            {{ $t('page.rule.button_clear_all') }}
          </t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="80" layout="inline" colon :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.rule.label_website')" name="host_code">
              <t-select v-model="searchformData.host_code" clearable filterable :style="{ width: '150px' }">
                <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                  {{ item }}
                </t-option>
              </t-select>
            </t-form-item>
            <t-form-item :label="$t('page.rule.label_rule_name')" name="rule_name">
              <t-input v-model="searchformData.rule_name" class="search-input" clearable>
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

      <t-alert theme="info" :message="$t('page.rule.alert_message')" close>
        <template #operation>
          <span @click="handleJumpOnlineUrl">{{$t('page.rule.rule_online_document')}}</span>
        </template>
      </t-alert>
      <div class="table-container">
        <t-table
          :columns="columns"
             size="small"
          :data="data"
          :rowKey="rowKey"
          :verticalAlign="verticalAlign"
          :hover="hover"
          :pagination="pagination"
          :selected-row-keys="selectedRowKeys"
          :loading="dataLoading"
          @page-change="rehandlePageChange"
          @change="rehandleChange"
          @select-change="rehandleSelectChange"
          :headerAffixedTop="true"
          :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }"
        ><template #host_code="{ row }">
            <span> {{host_dic[row.host_code]}}</span>
          </template>
          <template #rule_status="{ row }">
            <t-switch size="medium" v-model="row.rule_status === 1" :label="[$t('page.rule.rule_on'), $t('page.rule.rule_off')]"
                      @change="changeRuleStatus($event, row)">
            </t-switch>
          </template>

          <template #op="slotProps">
            <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
    </t-card>



    <t-dialog
      :header="$t('common.confirm_delete')"
      :body="confirmBody"
      :visible.sync="confirmVisible"
      @confirm="onConfirmDelete"
      :onCancel="onCancel"
    >
    </t-dialog>
    <t-dialog 
      :header="$t('page.rule.confirm_batch_delete')" 
      :visible.sync="batchDeleteVisible" 
      @confirm="onConfirmBatchDelete"
      @cancel="onCancelBatchDelete"
    >
      <div slot="body">
        {{ $t('page.rule.confirm_batch_delete') }}
      </div>
    </t-dialog>

    <t-dialog 
      :header="$t('page.rule.confirm_clear_all')" 
      :visible.sync="clearAllVisible" 
      @confirm="onConfirmClearAll"
      @cancel="onCancelClearAll"
    >
      <div slot="body">
        {{ $t('page.rule.confirm_clear_all') }}
      </div>
    </t-dialog>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { SearchIcon } from 'tdesign-icons-vue';
import Trend from '@/components/trend/index.vue';
import { prefix } from '@/config/global';
import { wafRuleListApi,wafRuleDelApi,wafRuleBatchDelApi,wafRuleDelAllApi,changeRuleStatus } from '@/apis/rules';
import { allhost } from '@/apis/host';
import { RULE_STATUS,CONTRACT_STATUS, CONTRACT_STATUS_OPTIONS, CONTRACT_TYPES, CONTRACT_PAYMENT_TYPES } from '@/constants';

const INITIAL_DATA = {
  host: 'baidu.com',
  port: 80,
  remote_host: 'baidu2.com',
  remote_port: 80,
  ssl:'0',
  remote_system:"宝塔",
  remote_app:"API业务系统",
  guard_status: '',
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
      addFormVisible:false,
      editFormVisible:false,
      batchDeleteVisible: false,
      clearAllVisible: false,
      formData: { ...INITIAL_DATA },
      formEditData: { ...INITIAL_DATA },
      rules: {
        host: [{ required: true, message: this.$t('common.select_placeholder')+this.$t('page.rule.label_website'), type: 'error' }],
      },
      textareaValue: '',
      RULE_STATUS,
      prefix,
      dataLoading: false,
      data: [], //列表数据信息
      detail_data:[],//加载详情信息用于编辑
      selectedRowKeys: [],
      value: 'first',
      columns: [
        { colKey: 'row-select', type: 'multiple', width: 64, fixed: 'left' },
          {
            title: this.$t('page.rule.label_website'),
            align: 'left',
            width: 200,
            ellipsis: true,
            colKey: 'host_code',
          },
        {
          title: this.$t('page.rule.label_rule_name'),
          align: 'left',
          width: 200,
          ellipsis: true,
          colKey: 'rule_name',
        },
        { title: this.$t('page.rule.label_rule_version'), colKey: 'rule_version', width: 70, cell: { col: 'version' } },
        { title: this.$t('page.rule.label_rule_status'), colKey: 'rule_status', width: 70, cell: { col: 'rule_status' } },
        {
          title: this.$t('common.update_time'),
          width: 200,
          ellipsis: true,
          colKey: 'update_time',
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
      rowKey: 'rule_code',
      tableLayout: 'auto',
      verticalAlign: 'top',
      hover: true,
      rowClassName: (rowKey: string) => `${rowKey}-class`,
      pagination: {
        total: 0,
        current: 1,
        pageSize:10
      },
      //顶部搜索
      searchformData: {
        rule_name:"",
        host_code:""
      },
      confirmVisible: false,
      deleteIdx: -1,
      //主机字典
      host_dic:{}
    };
  },
  computed: {
    confirmBody() {
      if (this.deleteIdx > -1) {
        const { host } = this.data?.[this.deleteIdx];
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
    getList(keyword){
      let that = this
      wafRuleListApi(
              {
                 pageSize: that.pagination.pageSize,
                 pageIndex: that.pagination.current,
                ...that.searchformData
             }
        )
        .then((res) => {
          let resdata = res
          console.log(resdata)
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
    getContainer() {
      return document.querySelector('.tdesign-starter-layout');
    },
    rehandlePageChange(curr, pageInfo) {
      this.pagination.current = curr.current
      if(this.pagination.pageSize != curr.pageSize){
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
      const { rule_code } = e.row
      console.log(rule_code)
      this.$router.push(
              {
                path:'/waf-host/wafruleedit',
                query: {
                  type: "edit",
                  code: rule_code
                },
              },
       );
    },
    handleAddRule() {
      this.$router.push(
              {
                path:'/waf-host/wafruleedit',
                query: {
                  type: "add",
                },
              },
       );
    },
    onClickCloseBtn(): void {
      this.formVisible = false;
      this.formData = {};
    },
    onClickCloseEditBtn(): void {
      this.editFormVisible = false;
      this.formEditData = {};
    },
    handleClickDelete(row) {
      console.log(row)
      this.deleteIdx = row.rowIndex;
      this.confirmVisible = true;
    },
    onConfirmDelete() {
      this.confirmVisible = false;
      let {rule_code} =  this.data[this.deleteIdx]
      let that = this
      wafRuleDelApi({ CODE: rule_code })
        .then((res) => {
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {

            that.pagination.current = 1
            that.getList("")
            that.$message.success(resdata.msg);
          }else{
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
    // 批量删除处理
    handleBatchDelete() {
      if (this.selectedRowKeys.length === 0) {
        this.$message.warning(this.$t('page.rule.no_data_selected'));
        return;
      }
      this.batchDeleteVisible = true;
    },

    // 清空所有处理
    handleClearAll() { 
      this.clearAllVisible = true;
    },

    // 确认批量删除
    onConfirmBatchDelete() {
      this.batchDeleteVisible = false;
      const that = this;
      const codes = this.selectedRowKeys.map(key => {
        const item = this.data.find(d => d.rule_code === key);
        return item ? item.rule_code : null;
      }).filter(rule_code => rule_code !== null);
      
      wafRuleBatchDelApi({ codes: codes })
        .then((res) => {
          const resdata = res;
          console.log(resdata);
          if (resdata.code === 0) {
            that.getList("");
            that.selectedRowKeys = [];
            that.$message.success(that.$t('page.rule.batch_delete_success'));
          } else {
            that.$message.warning(resdata.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
          that.$message.error('批量删除失败');
        })
        .finally(() => {});
    },
    
    // 确认清空所有
    onConfirmClearAll() {
      this.clearAllVisible = false;
      const that = this;
      
      wafRuleDelAllApi({ host_code: this.searchformData.host_code })
        .then((res) => {
          const resdata = res;
          console.log(resdata);
          if (resdata.code === 0) {
            that.getList("");
            that.selectedRowKeys = [];
            that.$message.success(that.$t('page.rule.clear_all_success'));
          } else {
            that.$message.warning(resdata.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
          that.$message.error('清空失败');
        })
        .finally(() => {});
    },
    
    // 取消批量删除
    onCancelBatchDelete() {
      this.batchDeleteVisible = false;
    },
    
    // 取消清空所有
    onCancelClearAll() {
      this.clearAllVisible = false;
    },
    //跳转界面
    handleJumpOnlineUrl(){
      window.open(this.samwafglobalconfig.getOnlineUrl()+"/guide/Rule.html");
    },
    // 修改规则状态
    changeRuleStatus(value, row) {
      // value 当前状态 true/1 启动, false/0 关闭，点击时应该切换为相反的状态
      const that = this;
      const currentStatus = row.rule_status === 1 ? 1 : 0;
      const newStatus = currentStatus === 1 ? 0 : 1; // 切换为相反的状态

      let postData = {
        CODE: row.rule_code,
        rule_status: newStatus
      }
      console.log("rule PostData",postData);
      changeRuleStatus(postData)
        .then((res) => {
          const resdata = res;
          console.log(resdata);
          if (resdata.code === 0) {
            row.rule_status = newStatus;
            that.$message.success(resdata.msg);
          } else {
            // 如果失败，则恢复原来状态
            row.rule_status = currentStatus;
            that.$message.warning(resdata.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
          // 操作失败，恢复原来状态
          row.rule_status = currentStatus;
          that.$message.error(that.$t('common.operation_failed'));
        });
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

.t-button + .t-button {
    margin-left: @spacer;
 }
</style>
