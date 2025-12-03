<template>
  <div>
    <t-alert theme="info" :message="$t('page.attack_log.attack_log')" :close="true">
      <template #operation>
        <span @click="handleJumpOnlineUrl">{{ $t('common.online_document') }}</span>
      </template>
    </t-alert>
    <t-card class="list-card-container">

      <t-tabs v-model="attackSearchformData.rule">
        <t-tab-panel v-for="(item, index) in attackTags" :key="index" :value="item.value" :label="item.label">
        </t-tab-panel>
      </t-tabs>
      <t-row justify="space-between">

        <t-form ref="form" :data="attackSearchformData" :label-width="150" colon layout="inline" :style="{ marginBottom: '8px' }">

          <t-form-item :label="$t('page.attack_log.rule_name')" name="rule">
            <t-select v-model="attackSearchformData.rule" class="form-item-content`" :options="attackTags"
                      :style="{ width: '280px' }" />

          </t-form-item>
          <t-form-item :label="$t('page.attack_log.source_ip')" name="src_ip">
            <t-input v-model="attackSearchformData.src_ip" class="form-item-content" :placeholder="$t('common.placeholder')+$t('page.visit_log.source_ip')"
                     :style="{ minWidth: '100px' }" />
          </t-form-item>
          <t-form-item>
            <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')"> {{ $t('common.search') }} </t-button>
            <t-button type="reset" variant="base" theme="default"> {{ $t('common.reset') }}  </t-button>
            <t-button v-if="attackSearchformData.rule && attackSearchformData.rule !== ''" theme="danger" variant="outline" @click="handleDeleteTag"> {{ $t('common.delete') }} </t-button>
          </t-form-item>
        </t-form>
      </t-row>

      <div class="table-container">
        <t-table :columns="columns" :data="data"  size="small" :rowKey="rowKey" :verticalAlign="verticalAlign"
                 :pagination="pagination"
                 :selected-row-keys="selectedRowKeys" :loading="dataLoading"
                 @page-change="rehandlePageChange"
                 :sort="sorts"
                 @change="rehandleChange"
                 @select-change="rehandleSelectChange"
                 @sort-change="onSortChange"
                 @filter-change="onFilterChange"
                 :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }" :stripe="true">

          <template #rule="{ row }">
            <t-tag v-if="row.rule !== ''" shape="round" theme="primary" variant="outline">{{row.rule}}</t-tag>
          </template>
          <template #ip="{ row }">
            <span>{{ row.ip }}</span>
            <t-button theme="primary" shape="round" size="small" style="margin-left: 8px;" @click="handleAddipblock(row)">
              {{ $t('page.visit_log.detail.add_to_deny_list') }}
            </t-button>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleClickDetail(slotProps)">{{$t('common.details')}}</a>
          </template>
        </t-table>
      </div>
    </t-card>

    <t-dialog
      :header="$t('page.attack_log.attack_ip_visit_detail_list_header')"
      :visible.sync="attackIpVisible"
      width="100%"
      :confirmOnEnter="true"
      :onConfirm="() => { this.resetChildState() }"
      :onClose="() => {  this.resetChildState() }"
    >
      <web-log-list ref="childLog" :attack_ip="trans_to_parent_ip"></web-log-list>
    </t-dialog>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { SearchIcon } from 'tdesign-icons-vue';
import Trend from '@/components/trend/index.vue';
import { prefix } from '@/config/global';
import {attackIpListApi,allattacktaglist,deleteTagByNameApi} from '@/apis/waflog/attacklog';
import WebLogList  from './index.vue'
import {
  wafIPBlockAddApi
} from '@/apis/ipblock';
export default Vue.extend({
  name: 'WebLogAttackListBase',
  components: {
    SearchIcon,
    Trend,
    WebLogList
  },
  data() {
    return {
      prefix,
      dataLoading: false,
      data: [],
      selectedRowKeys: [],
      value: 'first',
      customText: false,
       columns: [
        {
          title:  this.$t('page.attack_log.source_ip'),
          width: 200,
          ellipsis: true,
          colKey: 'ip',
          cell: 'ip',
        },
        {
          title:  this.$t('page.attack_log.deny_num'),
          width: 60,
          ellipsis: true,
          colKey: 'deny_num',
        },
        {
          title:this.$t('page.attack_log.pass_num'),
          width: 60,
          ellipsis: true,
          colKey: 'pass_num',
        },
        {
          title: this.$t('page.attack_log.first_time'),
          width: 100,
          ellipsis: true,
          colKey: 'first_time',
        },
        {
          title: this.$t('page.attack_log.latest_time'),
          align: 'left',
          width: 100,
          ellipsis: true,
          colKey: 'latest_time',
        },
        {
          title: this.$t('page.attack_log.ip_total_tag'),
          width: 150,
          ellipsis: true,
          colKey: 'ip_total_tag',
        },
        {
          align: 'left',
          width: 120,
          colKey: 'op',
          title: this.$t('common.op'),
        },
      ],
      rowKey: 'ip',
      tableLayout: 'auto',
      verticalAlign: 'top',
      hover: true,
      rowClassName: (rowKey : string) => `${rowKey}-class`,
      // 与pagination对齐
      pagination: {
        total: 0,
        current: 1,
        pageSize: 30
      },
      searchValue: '',
      confirmVisible: false,
      deleteIdx: -1,
      //顶部搜索
      attackSearchformData: {
        rule: "",
        src_ip: "",
      },
      //table 字段
      table:{
        multipleSort:true
      },
      //排序字段
      sorts: {
        sortBy:"create_time",
        descending:true,
      },
      //筛选字段
      filters:{
        filter_by:"",
        filter_value:"",
      },
      //tag所有
      attackTags:[],
      currentTab:"",
      attackIpVisible:false,//访问明细
      trans_to_parent_ip:"",//传递给
      deleteLogMode: 'tag_only',//删除模式
    };
  },
  computed: {
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    },
    columnControllerConfig() {
      return {
        placement: this.placement,
        fields: ['action', 'rule', 'create_time', 'host', 'method', 'url', 'header', 'country', 'province', 'city', 'status','risk_level','guest_identification','time_spent'],
        // 弹框组件属性透传
        dialogProps: { preventScrollThrough: true },
        // 列配置按钮属性
        buttonProps: this.customText ? { content: '显示列控制', theme: 'primary', variant: 'base' } : undefined,
      };
    },
  },
  created() {
  },
  mounted() {
    this.getIpTags()
    this.getList("");
  },
  methods: {
    getIpTags(){
      allattacktaglist({
      }).then((res) => {
        console.log("res getIpTags",res.data)
        this.attackTags = res.data??[];
        this.attackTags.unshift({ "label": "所有规则", "value": "" });
      })
    },
    getList(keyword) {
      attackIpListApi({
        pageSize: this.pagination.pageSize,
        pageIndex: this.pagination.current,
        ...this.attackSearchformData
      }).then((res) => {
        let resdata = res
        console.log(resdata)
        if (resdata.code === 0) {
          this.data = resdata.data.list??[];
          this.pagination = {
            ...this.pagination,
            total: resdata.data.total,
          };
        }else {
          this.$message.warning(resdata.msg);
        }
      })
        .catch((e : Error) => {
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
    rehandleSelectChange(selectedRowKeys : number[]) {
      this.selectedRowKeys = selectedRowKeys;
    },
    rehandleChange(changeParams, triggerAndData) {
    },
    handleClickDetail(e) {
      console.log(e)
      const { ip } = e.row
      console.log(ip)
      this.attackIpVisible = true
      this.trans_to_parent_ip = ip
    },
    handleClickDelete(row : { rowIndex : any }) {
      this.deleteIdx = row.rowIndex;
      this.confirmVisible = true;
    },
    onConfirmDelete() {
      this.data.splice(this.deleteIdx, 1);
      this.pagination.total = this.data.length;
      const selectedIdx = this.selectedRowKeys.indexOf(this.deleteIdx);
      if (selectedIdx > -1) {
        this.selectedRowKeys.splice(selectedIdx, 1);
      }
      this.confirmVisible = false;
      this.$message.success('删除成功');
      this.resetIdx();
    },
    onCancel() {
      this.resetIdx();
    },
    resetIdx() {
      this.deleteIdx = -1;
    },
    handleAddipblock(row) {
      const ip = row.ip;

      // 在攻击统计页面，我们需要让用户选择要添加到哪个网站
      // 由于该页面没有host_code，我们简化处理，使用空字符串
      // 实际上可能需要弹窗让用户选择网站
      let that = this

      const confirmDia = this.$dialog.confirm({
        header: this.$t('page.visit_log.detail.add_to_deny_list_confirm_header'),
        body: this.$t('page.visit_log.detail.add_to_deny_list_confirm_body'),
        confirmBtn: this.$t('common.confirm'),
        cancelBtn: this.$t('common.cancel'),
        onConfirm: ({ e }) => {
          //add deny IP
          let formData = {
            host_code: '', // 攻击统计页面可能需要全局黑名单或选择网站
            ip: ip,
            remarks: '手工增加',
          };
          wafIPBlockAddApi({
            ...formData
          })
            .then((res) => {
              let resdata = res
              console.log(resdata)
              if (resdata.code === 0) {
                that.$message.success(resdata.msg);
              } else {
                that.$message.warning(resdata.msg);
              }
            })
            .catch((e: Error) => {
              console.log(e);
            })
            .finally(() => { });

          confirmDia.destroy();
        },
        onClose: ({ e, trigger }) => {
          console.log('关闭弹窗');
          confirmDia.hide();
        },
      });
    },
    //Jump Url
    handleJumpOnlineUrl(){
      window.open(this.samwafglobalconfig.getOnlineUrl()+"/guide/attacklog.html");
    },
    /**
     * table 排序
     */
    onSortChange(sorter){
      let that = this

      if (sorter != undefined){
        this.sorts.sortBy= sorter.sortBy
        that.sorts.descending= sorter.descending

      }else{
        that.sorts.sortBy="create_time"
        that.sorts.descending= true
      }
      this.getList("")
    },
    /**
     * 访客身份筛选
     */
    filterGuestChange(e){
    },
    /**
     * 筛选结果
     */
    onFilterChange(e){
      this.filters.filter_by = "";
      this.filters.filter_value = "";
      //访客身份
      if(e.guest_identification != undefined && e.guest_identification!=""){
        this.filters.filter_by = "guest_identification";
        this.filters.filter_value = e.guest_identification ;
      }
      //header
      if(e.header != undefined && e.header!=""){
        if(this.filters.filter_by==""){
          this.filters.filter_by = "header";
          this.filters.filter_value = e.header ;
        }else{
          this.filters.filter_by = this.filters.filter_by +"|header";
          this.filters.filter_value = this.filters.filter_value +"|"+ e.header ;
        }
      }
      this.getList("")
    },
    resetChildState(){
      this.attackIpVisible = false
      this.$refs.childLog.resetState()
    },
    //删除tag
    handleDeleteTag(){
      let that = this
      const currentTag = this.attackSearchformData.rule
      if (!currentTag) {
        this.$message.warning('请选择要删除的规则标签');
        return;
      }

      // 第一步：确认是否删除标签
      const dialog1 = this.$dialog.confirm({
        header: '删除规则标签',
        body: '确定要删除规则标签 "' + currentTag + '" 吗？',
        confirmBtn: '下一步',
        cancelBtn: '取消',
        onConfirm: ({ e }) => {
          dialog1.destroy();
          // 第二步：询问是否连带删除日志
          that.askDeleteLogsMode(currentTag);
        },
        onClose: ({ e, trigger }) => {
          dialog1.hide();
        },
      });
    },
    // 询问是否连带删除日志
    askDeleteLogsMode(tagName){
      let that = this
      
      const dialog2 = this.$dialog.confirm({
        header: '是否连带删除相关日志？',
        body: '请选择删除方式：\n\n【仅删除标签】：只删除标签统计数据，不影响原始日志\n\n【同时删除日志】：删除标签和所有相关攻击日志\n   ⚠️ 警告：数据量大时需要较长时间，且不可恢复！',
        confirmBtn: {
          content: '同时删除日志',
          theme: 'danger',  // 红色危险按钮
          variant: 'base'
        },
        cancelBtn: {
          content: '仅删除标签',
          theme: 'default',  // 灰色普通按钮
          variant: 'outline'
        },
        theme: 'warning',
        onConfirm: ({ e }) => {
          // 选择同时删除日志
          dialog2.destroy();
          that.confirmDeleteTag(tagName, 'with_logs');
        },
        onCancel: ({ e }) => {
          // 选择仅删除标签
          dialog2.destroy();
          that.confirmDeleteTag(tagName, 'tag_only');
        },
        onClose: ({ e, trigger }) => {
          if (trigger === 'cancel') {
            // 点击取消按钮，执行仅删除标签
            that.confirmDeleteTag(tagName, 'tag_only');
          }
          dialog2.hide();
        },
      });
    },
    // 确认删除tag
    confirmDeleteTag(tagName, deleteMode) {
      let that = this
      
      that.$message.loading('正在删除，请稍候...', 0);
      
      deleteTagByNameApi({
        tag_name: tagName,
        delete_logs: deleteMode === 'with_logs'
      })
        .then((res) => {
          that.$message.closeAll();
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {
            that.$message.success(resdata.msg || '删除成功');
            // 重置搜索条件
            that.attackSearchformData.rule = ''
            // 重新加载标签列表和数据列表
            that.getIpTags()
            that.getList('')
          } else {
            that.$message.warning(resdata.msg || '删除失败');
          }
        })
        .catch((e: Error) => {
          that.$message.closeAll();
          console.log(e);
          that.$message.error('删除失败: ' + e.message);
        })
    },
    //end meathod
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables';
.t-button+.t-button {
  margin-left: @spacer;
}
</style>
