<template>
  <div>
    <help-block :summary="$t('page.attack_log.attack_log')" doc="guide/AttackLog">
      <template #actions><ip-lookup ref="ipLookup" /></template>
    </help-block>
    <t-card class="list-card-container">
      <div class="attack-layout">
        <!-- 左侧规则筛选侧栏：规则标签基数无上限，必须能分组 + 搜索 -->
        <div v-if="tagLayout === 'left'" class="facet-side" :class="{ 'is-collapsed': facetCollapsed }">
          <div class="facet-head">
            <b v-show="!facetCollapsed">{{ $t('page.attack_log.filter_title') }}</b>
            <span class="facet-head-op">
              <t-tooltip v-if="!facetCollapsed" :content="$t('page.attack_log.layout_to_top')" placement="top" show-arrow>
                <t-button variant="text" shape="square" size="small" @click="toggleTagLayout">
                  <t-icon name="view-column" />
                </t-button>
              </t-tooltip>
              <t-tooltip :content="facetCollapsed ? $t('page.attack_log.facet_expand') : $t('page.attack_log.facet_collapse')" placement="top" show-arrow>
                <t-button variant="text" shape="square" size="small" @click="toggleFacet">
                  <t-icon :name="facetCollapsed ? 'chevron-right' : 'chevron-left'" />
                </t-button>
              </t-tooltip>
            </span>
          </div>

          <template v-if="!facetCollapsed">
            <div class="facet-search">
              <t-input v-model="tagKeyword" size="small" clearable :placeholder="$t('page.attack_log.search_placeholder')">
                <template #prefix-icon><search-icon /></template>
              </t-input>
            </div>

            <div class="facet-list">
              <div class="facet-item facet-item--all" :class="{ 'is-active': attackSearchformData.rule === '' }"
                   @click="selectTag('')">
                <span class="nm">{{ $t('page.attack_log.all_rules') }}</span>
                <span class="badge">{{ formatCount(totalTagCount) }}</span>
              </div>

              <template v-for="group in groupedTags">
                <div :key="'g-' + group.name" class="facet-group" :class="{ 'is-closed': isGroupClosed(group.name) }"
                     @click="toggleGroup(group.name)">
                  <t-icon class="caret" name="chevron-down" />
                  <span class="gname">{{ group.name }}</span>
                  <span class="gsum">{{ group.items.length }} · {{ formatCount(group.sum) }}</span>
                </div>
                <div v-if="!isGroupClosed(group.name)" :key="'b-' + group.name">
                  <div v-for="item in group.items" :key="item.value" class="facet-item"
                       :class="{ 'is-active': attackSearchformData.rule === item.value }"
                       :title="item.value" @click="selectTag(item.value)">
                    <span class="nm">{{ item.short }}</span>
                    <span class="badge">{{ formatCount(item.count) }}</span>
                    <t-icon class="del" name="close" @click.native.stop="handleDeleteTagByName(item.value)" />
                  </div>
                </div>
              </template>

              <div v-if="!groupedTags.length" class="facet-empty">{{ $t('page.attack_log.no_match') }}</div>
            </div>

            <!-- 标签存放位置：低频的存储层设置，放底部不跟高频筛选抢视线 -->
            <div class="facet-foot">
              <div class="foot-label">
                <span>{{ $t('page.attack_log.iptag_db_title') }}</span>
                <t-tooltip :content="$t('page.attack_log.iptag_db_tip')" placement="top" :overlay-style="{ width: '280px' }" show-arrow>
                  <t-icon name="help-circle" />
                </t-tooltip>
              </div>
              <t-radio-group :value="ipTagDb" variant="default-filled" size="small" :disabled="ipTagDbSaving"
                             @change="onIpTagDbChange">
                <t-radio-button value="0">{{ $t('page.attack_log.iptag_db_main') }}</t-radio-button>
                <t-radio-button value="1">{{ $t('page.attack_log.iptag_db_stats') }}</t-radio-button>
              </t-radio-group>
              <div class="foot-hint">
                {{ ipTagDb === '1' ? $t('page.attack_log.iptag_db_current_stats') : $t('page.attack_log.iptag_db_current_main') }}
              </div>
            </div>
          </template>
        </div>

        <div class="facet-main">
          <!-- 切 tab 直接查，不用再点一次「查询」 -->
          <t-tabs v-if="tagLayout === 'top'" v-model="attackSearchformData.rule" @change="handleTabChange">
            <t-tab-panel v-for="(item, index) in tabTags" :key="index" :value="item.value" :label="item.label">
            </t-tab-panel>
          </t-tabs>

          <div class="cur-bar">
            <span class="cur-label">{{ $t('page.attack_log.current_filter') }}</span>
            <t-tag shape="round" theme="primary" variant="light">
              {{ attackSearchformData.rule || $t('page.attack_log.all_rules') }}
            </t-tag>
            <t-link v-if="attackSearchformData.rule" theme="primary" hover="color" size="small" @click="selectTag('')">
              {{ $t('page.attack_log.clear_filter') }}
            </t-link>
            <span class="cur-spacer"></span>
            <t-tooltip v-if="tagLayout === 'top'" :content="$t('page.attack_log.layout_to_left')" placement="top" show-arrow>
              <t-button variant="text" shape="square" size="small" @click="toggleTagLayout">
                <t-icon name="view-list" />
              </t-button>
            </t-tooltip>
            <t-button v-if="attackSearchformData.rule" theme="danger" variant="outline" size="small" @click="handleDeleteTag">
              {{ $t('page.attack_log.delete_current_tag') }}
            </t-button>
            <t-button theme="danger" variant="outline" size="small" @click="handleBatchDeleteTag">
              {{ $t('common.batch_delete.title') }}
            </t-button>
          </div>

          <t-form ref="form" :data="attackSearchformData" :label-width="60" colon layout="inline" :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.attack_log.source_ip')" name="src_ip">
              <t-input v-model="attackSearchformData.src_ip" class="form-item-content" :placeholder="$t('common.placeholder')+$t('page.visit_log.source_ip')"
                       :style="{ minWidth: '180px' }" />
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')"> {{ $t('common.search') }} </t-button>
              <t-button type="reset" variant="base" theme="default"> {{ $t('common.reset') }}  </t-button>
            </t-form-item>
          </t-form>

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
                <!-- 点 IP 直接开归属查询：排查时最想知道的就是「这个IP现在被什么拦着」 -->
                <t-tooltip :content="$t('common.ip_lookup.click_tip')">
                  <a class="ipl-link" @click="openIpLookup(row.ip)">{{ row.ip }}</a>
                </t-tooltip>
              </template>
              <template #op="slotProps">
                <a class="t-button-link" @click="handleClickDetail(slotProps)">{{$t('common.details')}}</a>
              </template>
            </t-table>
          </div>
        </div>
      </div>
    </t-card>

    <t-dialog
      :header="$t('page.attack_log.batch_delete_header')"
      :visible.sync="batchDeleteVisible"
      width="520px"
      :confirmBtn="batchDeleteLoading ? { content: $t('common.batch_delete.deleting', { progress: batchDeleteProgress, total: batchDeleteTags.length }), loading: true, disabled: true } : { content: $t('common.batch_delete.confirm_btn'), theme: 'danger' }"
      :cancelBtn="{ content: $t('common.cancel'), disabled: batchDeleteLoading }"
      :closeOnEscKeydown="!batchDeleteLoading"
      :closeOnOverlayClick="!batchDeleteLoading"
      :onConfirm="confirmBatchDelete"
      :onClose="() => { if (!batchDeleteLoading) batchDeleteVisible = false }"
    >
      <div style="padding: 8px 0;">
        <t-alert theme="warning" :message="$t('common.batch_delete.warning')" style="margin-bottom: 16px;" />
        <div style="margin-bottom: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: 500;">{{ $t('page.attack_log.batch_delete_select_label') }}</span>
            <div>
              <t-link theme="primary" hover="color" size="small" @click="handleBatchSelectAll" style="margin-right: 8px;">{{ $t('common.batch_delete.select_all') }}</t-link>
              <t-link theme="primary" hover="color" size="small" @click="handleBatchInvertSelection" style="margin-right: 8px;">{{ $t('common.batch_delete.invert_selection') }}</t-link>
              <t-link theme="danger" hover="color" size="small" @click="handleBatchClearSelection">{{ $t('common.batch_delete.clear_selection') }}</t-link>
            </div>
          </div>
          <t-select
            v-model="batchDeleteTags"
            :options="attackTagsForBatch"
            multiple
            :style="{ width: '100%' }"
            :placeholder="$t('page.attack_log.batch_delete_select_placeholder')"
            clearable
          />
        </div>
        <div>
          <div style="font-weight: 500; margin-bottom: 8px;">{{ $t('common.batch_delete.delete_mode_label') }}</div>
          <t-radio-group v-model="batchDeleteMode" style="display: flex; flex-direction: column; gap: 8px;">
            <t-radio value="tag_only">{{ $t('common.batch_delete.mode_tag_only') }}</t-radio>
            <t-radio value="with_logs"><span style="color: #e34d59;">{{ $t('common.batch_delete.mode_with_logs') }}</span></t-radio>
          </t-radio-group>
        </div>
      </div>
    </t-dialog>

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
import {get_detail_by_item_api, edit_system_config_api} from '@/apis/systemconfig';
import WebLogList  from './index.vue'
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
      //规则筛选排布：left=左侧分组侧栏  top=顶部横向tab
      tagLayout: localStorage.getItem('samwaf_attack_tag_layout') === 'top' ? 'top' : 'left',
      // 窄屏默认收起，避免侧栏把本来就多的表格列挤没
      facetCollapsed: (function () {
        const v = localStorage.getItem('samwaf_attack_facet_collapsed');
        if (v === '1') return true;
        if (v === '0') return false;
        return window.innerWidth < 1400;
      })(),
      tagKeyword: '',
      closedGroups: {},
      // 标签数据存放位置 0主库 1统计库（后端 ip_tag_db）
      ipTagDb: '0',
      ipTagDbItem: null,
      ipTagDbSaving: false,
      currentTab:"",
      attackIpVisible:false,//访问明细
      trans_to_parent_ip:"",//传递给
      deleteLogMode: 'tag_only',//删除模式
      batchDeleteVisible: false,
      batchDeleteTags: [],
      batchDeleteMode: 'tag_only',
      batchDeleteLoading: false,
      batchDeleteProgress: 0,
    };
  },
  computed: {
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    },
    attackTagsForBatch() {
      return this.attackTags.filter((t: any) => t.value !== '');
    },
    // 归一化标签：优先用后端新增的 count 字段，老后端没有则从 label 的「(数字)」反解
    tagList() {
      return (this.attackTags || [])
        .filter((t: any) => t && t.value)
        .map((t: any) => {
          let count = Number(t.count || 0);
          if (!count) {
            const m = String(t.label || '').match(/^(.*)\s*\((\d+)\)\s*$/);
            if (m) count = Number(m[2]);
          }
          const name = String(t.value);
          const idx = name.search(/[:：]/);
          return {
            value: name,
            label: t.label,
            name,
            short: idx > -1 ? name.slice(idx + 1).trim() : name,
            count,
          };
        });
    },
    totalTagCount() {
      return this.tagList.reduce((a: number, b: any) => a + b.count, 0);
    },
    // 冒号前缀天然是规则族（静态文件安全检查: / AI检测: / OWASP: ...），组内沿用后端的量级倒序
    groupedTags() {
      const kw = this.tagKeyword.trim().toLowerCase();
      const list = kw
        ? this.tagList.filter((t: any) => t.name.toLowerCase().indexOf(kw) >= 0)
        : this.tagList;
      const map = {};
      const order = [];
      list.forEach((t: any) => {
        const g = this.groupOf(t.name);
        if (!map[g]) {
          map[g] = [];
          order.push(g);
        }
        map[g].push(t);
      });
      return order
        .map((g: string) => ({
          name: g,
          items: map[g],
          sum: map[g].reduce((a: number, b: any) => a + b.count, 0),
        }))
        .sort((a: any, b: any) => b.sum - a.sum);
    },
    tabTags() {
      const all = [{ value: '', label: this.$t('page.attack_log.all_rules') }];
      return all.concat(
        this.tagList.map((t: any) => ({ value: t.value, label: `${t.name} ${this.formatCount(t.count)}` })),
      );
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
    this.loadIpTagDb();
  },
  methods: {
    // 大数字用万/亿，否则计数比规则名还长
    formatCount(n) {
      const v = Number(n || 0);
      if (v >= 100000000) return `${(v / 100000000).toFixed(1)}亿`;
      if (v >= 10000) return `${(v / 10000).toFixed(1)}万`;
      return String(v);
    },
    // 冒号前缀优先，无冒号的按关键词兜底，保证新规则名也能自动落位
    groupOf(name) {
      const m = String(name).match(/^(.+?)[:：]/);
      if (m) return m[1];
      if (/黑名单|白名单|威胁情报|IP组/.test(name)) return this.$t('page.attack_log.group_list');
      if (/频次访问限制/.test(name)) return this.$t('page.attack_log.group_cc');
      if (/静态文件/.test(name)) return this.$t('page.attack_log.group_static');
      return this.$t('page.attack_log.group_other');
    },
    isGroupClosed(name) {
      // 搜索中一律展开，否则命中项藏在折叠组里等于没搜
      if (this.tagKeyword.trim()) return false;
      return !!this.closedGroups[name];
    },
    toggleGroup(name) {
      this.closedGroups = { ...this.closedGroups, [name]: !this.closedGroups[name] };
    },
    toggleFacet() {
      this.facetCollapsed = !this.facetCollapsed;
      localStorage.setItem('samwaf_attack_facet_collapsed', this.facetCollapsed ? '1' : '0');
    },
    toggleTagLayout() {
      this.tagLayout = this.tagLayout === 'left' ? 'top' : 'left';
      localStorage.setItem('samwaf_attack_tag_layout', this.tagLayout);
    },
    selectTag(value) {
      this.attackSearchformData.rule = value;
      this.pagination.current = 1;
      this.getList('all');
    },
    handleDeleteTagByName(tagName) {
      this.handleDeleteTag(tagName);
    },
    // 读当前的 IP Tag 存放位置（与访问日志页的日志配置是同一个配置项）
    loadIpTagDb() {
      get_detail_by_item_api({ item: 'ip_tag_db' })
        .then((res) => {
          if (res.code === 0 && res.data) {
            this.ipTagDbItem = res.data;
            this.ipTagDb = String(res.data.value) === '1' ? '1' : '0';
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
    },
    onIpTagDbChange(val) {
      const next = String(val);
      if (next === this.ipTagDb) return;
      const that = this;
      const nameOf = (v) => (v === '1'
        ? this.$t('page.attack_log.iptag_db_stats_full')
        : this.$t('page.attack_log.iptag_db_main_full'));
      const dialog = this.$dialog.confirm({
        header: this.$t('page.attack_log.iptag_db_switch_header'),
        body: this.$t('page.attack_log.iptag_db_switch_body', { from: nameOf(this.ipTagDb), to: nameOf(next) }),
        theme: 'warning',
        confirmBtn: this.$t('common.confirm'),
        cancelBtn: this.$t('common.cancel'),
        onConfirm: () => {
          dialog.destroy();
          that.doSaveIpTagDb(next);
        },
        onClose: () => {
          dialog.hide();
        },
      });
    },
    doSaveIpTagDb(next) {
      const item = this.ipTagDbItem;
      if (!item) {
        this.$message.warning(this.$t('page.attack_log.iptag_db_load_failed'));
        return;
      }
      const that = this;
      that.ipTagDbSaving = true;
      edit_system_config_api({
        id: item.id,
        category: item.category,
        item: item.item,
        value: next,
        type: item.type,
        title: item.title,
        options: item.options || '',
      })
        .then((res) => {
          if (res.code === 0) {
            that.ipTagDb = next;
            that.ipTagDbItem = { ...item, value: next };
            that.$message.success(that.$t('page.attack_log.iptag_db_saved'));
            // 换库了，标签和列表都得按新库重新拉
            that.attackSearchformData.rule = '';
            that.pagination.current = 1;
            that.getIpTags();
            that.getList('');
          } else {
            that.$message.warning(res.msg);
          }
        })
        .catch((e: Error) => {
          that.$message.error(e.message);
        })
        .finally(() => {
          that.ipTagDbSaving = false;
        });
    },
    // 点日志里的 IP 直接开归属查询弹窗，省得用户复制粘贴
    openIpLookup(ip) {
      if (!ip) return;
      this.$refs.ipLookup && this.$refs.ipLookup.open(ip);
    },
    // 切 tab 等于换了查询条件，回第一页再拉；否则停在上一次的页码上容易看到空列表
    handleTabChange() {
      this.pagination.current = 1;
      this.getList('all');
    },
    getIpTags(){
      allattacktaglist({
      }).then((res) => {
        console.log("res getIpTags",res.data)
        // 后端出错时 data 可能是对象/字符串而非数组，需兜底成数组，避免 unshift 报错导致前端异常弹窗
        this.attackTags = Array.isArray(res.data) ? res.data : [];
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
      this.$message.success(this.$t('common.tips.delete_success'));
      this.resetIdx();
    },
    onCancel() {
      this.resetIdx();
    },
    resetIdx() {
      this.deleteIdx = -1;
    },
    //Jump Url
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
    handleDeleteTag(tagName){
      let that = this
      // 侧栏条目传标签名进来；工具条按钮传的是事件对象，删的是当前筛选
      const currentTag = (typeof tagName === 'string' && tagName) ? tagName : this.attackSearchformData.rule
      if (!currentTag) {
        this.$message.warning(this.$t('page.attack_log.select_tag_warning'));
        return;
      }

      const dialog1 = this.$dialog.confirm({
        header: this.$t('page.attack_log.delete_tag_header'),
        body: this.$t('page.attack_log.delete_tag_confirm', { tag: currentTag }),
        confirmBtn: this.$t('common.next_step'),
        cancelBtn: this.$t('common.cancel'),
        onConfirm: ({ e }) => {
          dialog1.destroy();
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
        header: this.$t('page.attack_log.delete_mode_dialog_header'),
        body: this.$t('page.attack_log.delete_mode_dialog_body'),
        confirmBtn: {
          content: this.$t('common.batch_delete.mode_with_logs_btn'),
          theme: 'danger',
          variant: 'base'
        },
        cancelBtn: {
          content: this.$t('common.batch_delete.mode_tag_only_btn'),
          theme: 'default',
          variant: 'outline'
        },
        theme: 'warning',
        onConfirm: ({ e }) => {
          dialog2.destroy();
          that.confirmDeleteTag(tagName, 'with_logs');
        },
        onCancel: ({ e }) => {
          dialog2.destroy();
          that.confirmDeleteTag(tagName, 'tag_only');
        },
        onClose: ({ e, trigger }) => {
          if (trigger === 'cancel') {
            that.confirmDeleteTag(tagName, 'tag_only');
          }
          dialog2.hide();
        },
      });
    },
    // 确认删除tag
    confirmDeleteTag(tagName, deleteMode) {
      let that = this

      that.$message.loading(that.$t('common.deleting'), 0);

      deleteTagByNameApi({
        tag_name: tagName,
        delete_logs: deleteMode === 'with_logs'
      })
        .then((res) => {
          that.$message.closeAll();
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {
            that.$message.success(resdata.msg || that.$t('common.tips.delete_success'));
            if (that.attackSearchformData.rule === tagName) {
              that.attackSearchformData.rule = ''
            }
            that.getIpTags()
            that.getList('')
          } else {
            that.$message.warning(resdata.msg || that.$t('common.tips.delete_failed'));
          }
        })
        .catch((e: Error) => {
          that.$message.closeAll();
          console.log(e);
          that.$message.error(that.$t('common.tips.delete_failed_msg', { msg: e.message }));
        })
    },
    handleBatchSelectAll() {
      this.batchDeleteTags = this.attackTagsForBatch.map((t: any) => t.value);
    },
    handleBatchInvertSelection() {
      this.batchDeleteTags = this.attackTagsForBatch
        .filter((t: any) => !this.batchDeleteTags.includes(t.value))
        .map((t: any) => t.value);
    },
    handleBatchClearSelection() {
      this.batchDeleteTags = [];
    },
    handleBatchDeleteTag() {
      this.batchDeleteTags = [];
      this.batchDeleteMode = 'tag_only';
      this.batchDeleteProgress = 0;
      this.batchDeleteLoading = false;
      this.batchDeleteVisible = true;
    },
    async confirmBatchDelete() {
      if (this.batchDeleteTags.length === 0) {
        this.$message.warning(this.$t('common.batch_delete.select_warning'));
        return;
      }
      let that = this;
      that.batchDeleteLoading = true;
      that.batchDeleteProgress = 0;
      let successCount = 0;
      let failCount = 0;
      for (const tagName of that.batchDeleteTags) {
        try {
          const res: any = await deleteTagByNameApi({
            tag_name: tagName,
            delete_logs: that.batchDeleteMode === 'with_logs',
          });
          if (res.code === 0) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (e) {
          failCount++;
        }
        that.batchDeleteProgress++;
      }
      that.batchDeleteLoading = false;
      that.batchDeleteVisible = false;
      if (failCount === 0) {
        that.$message.success(that.$t('common.batch_delete.success', { count: successCount }));
      } else {
        that.$message.warning(that.$t('common.batch_delete.partial_success', { success: successCount, fail: failCount }));
      }
      that.attackSearchformData.rule = '';
      that.getIpTags();
      that.getList('');
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

.ipl-link {
  color: var(--td-brand-color);
  cursor: pointer;
}

.ipl-link:hover {
  color: var(--td-brand-color-hover);
  text-decoration: underline;
}

/* ===== 规则筛选侧栏 ===== */
.attack-layout {
  display: flex;
  align-items: stretch;
}

.facet-side {
  width: 250px;
  flex: none;
  display: flex;
  flex-direction: column;
  padding-right: 8px;
  border-right: 1px solid var(--td-component-stroke);

  &.is-collapsed {
    width: 40px;
    padding-right: 0;
  }
}

.facet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--td-component-stroke);

  b {
    font-size: 14px;
    font-weight: 500;
  }
}

.facet-search {
  padding: 8px 0;
}

.facet-list {
  flex: 1;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--td-component-border);
    border-radius: 3px;
  }
}

.facet-group {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  padding: 7px 6px 7px 2px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
  cursor: pointer;
  user-select: none;

  &:hover {
    color: var(--td-brand-color);
  }

  .caret {
    font-size: 14px;
    transition: transform 0.15s;
  }

  &.is-closed .caret {
    transform: rotate(-90deg);
  }

  .gname {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .gsum {
    margin-left: auto;
    font-size: 11px;
    color: var(--td-text-color-placeholder);
    flex: none;
  }
}

.facet-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 6px 6px 20px;
  font-size: 13px;
  border-radius: var(--td-radius-default);
  cursor: pointer;

  &.facet-item--all {
    padding-left: 6px;
    font-weight: 500;
  }

  &:hover {
    background: var(--td-bg-color-container-hover);
  }

  &.is-active {
    color: var(--td-brand-color);
    background: var(--td-brand-color-light);
    font-weight: 500;

    .badge {
      color: var(--td-brand-color);
      background: var(--td-brand-color-light-active);
    }
  }

  .nm {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .badge {
    flex: none;
    min-width: 20px;
    padding: 0 6px;
    font-size: 11px;
    line-height: 18px;
    text-align: center;
    color: var(--td-text-color-secondary);
    background: var(--td-bg-color-component);
    border-radius: 9px;
  }

  .del {
    flex: none;
    visibility: hidden;
    font-size: 14px;
    color: var(--td-text-color-placeholder);

    &:hover {
      color: var(--td-error-color);
    }
  }

  &:hover .del {
    visibility: visible;
  }
}

.facet-empty {
  padding: 16px 8px;
  font-size: 12px;
  text-align: center;
  color: var(--td-text-color-placeholder);
}

.facet-foot {
  margin-top: 6px;
  padding: 10px 4px 2px;
  border-top: 1px solid var(--td-component-stroke);

  .foot-label {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--td-text-color-secondary);
  }

  .foot-hint {
    margin-top: 6px;
    font-size: 11px;
    line-height: 1.6;
    color: var(--td-text-color-placeholder);
  }
}

.facet-main {
  flex: 1;
  min-width: 0;
  padding-left: 16px;
}

.attack-layout > .facet-main:first-child {
  padding-left: 0;
}

.cur-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 12px 0 8px;

  .cur-label {
    font-size: 13px;
    color: var(--td-text-color-secondary);
  }

  .cur-spacer {
    flex: 1;
  }
}
</style>
