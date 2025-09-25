<template>
  <div>
    <t-alert theme="info" :message="$t('page.visit_log.visit_log')" :close="true">
      <template #operation>
        <span @click="handleJumpOnlineUrl">{{ $t('common.online_document') }}</span>
      </template>
    </t-alert>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <t-form ref="form" :data="searchformData" :label-width="150" colon layout="inline"
          :style="{ marginBottom: '8px' }">
          <t-form-item :label="$t('page.visit_log.website')" name="website">
            <t-select v-model="searchformData.host_code" clearable :style="{ width: '150px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.visit_log.rule_name')" name="rule">
            <t-input v-model="searchformData.rule" class="form-item-content" type="search"
              :placeholder="$t('common.placeholder') + $t('page.visit_log.rule_name')" :style="{ minWidth: '134px' }" />
          </t-form-item>
          <t-form-item :label="$t('page.visit_log.req_uuid')" name="req_uuid">
            <t-input v-model="searchformData.req_uuid" class="form-item-content" type="search"
              :placeholder="$t('common.placeholder') + $t('page.visit_log.req_uuid')" :style="{ minWidth: '200px' }" />
          </t-form-item>
          <t-form-item :label="$t('page.visit_log.access_status')" name="action">
            <t-select v-model="searchformData.action" class="form-item-content`" :options="action_options"
              :placeholder="$t('common.select_placeholder') + $t('page.visit_log.access_status')"
              :style="{ width: '100px' }" />
          </t-form-item>
          <t-form-item :label="$t('page.visit_log.status_code')" name="status_code">
            <t-input v-model="searchformData.status_code" class="form-item-content"
              :placeholder="$t('common.placeholder') + $t('page.visit_log.status_code')"
              :style="{ minWidth: '100px' }" />
          </t-form-item>
          <t-form-item :label="$t('page.visit_log.source_ip')" name="src_ip">
            <t-input v-model="searchformData.src_ip" class="form-item-content"
              :placeholder="$t('common.placeholder') + $t('page.visit_log.source_ip')" :style="{ minWidth: '100px' }" />
          </t-form-item>
          <t-form-item :label="$t('page.visit_log.access_date')" name="unix_add_time" v-if="attack_ip == ''">
            <t-date-range-picker v-model="dateControl.range1" :presets="dateControl.presets" enable-time-picker
              valueType="YYYY-MM-DD HH:mm:ss" />
          </t-form-item>
          <t-form-item :label="$t('page.visit_log.access_method')" name="method">
            <t-select v-model="searchformData.method" class="form-item-content`" :options="method_options"
              :placeholder="$t('common.placeholder') + $t('page.visit_log.access_method')"
              :style="{ width: '100px' }" />
          </t-form-item>
          <t-form-item :label="$t('page.visit_log.log_archive_db')" name="sharedb">
            <t-select v-model="searchformData.current_db_name" clearable :style="{ width: '150px' }">
              <t-option v-for="(item, index) in share_db_dic" :value="index" :label="item" :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item>
            <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')"> {{ $t('common.search') }}
            </t-button>
            <t-button theme="primary" :style="{ marginLeft: '8px' }" v-if="attack_ip == ''"
              @click="exportDbVisible = true">
              {{
                $t('common.export') }} </t-button>
            <t-button type="reset" variant="base" theme="default"> {{ $t('common.reset') }} </t-button>
          </t-form-item>
        </t-form>
      </t-row>

      <div class="table-container">
        <!-- 自定义工具栏，将所有按钮放在一起 -->
        <div class="table-toolbar"
          style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div class="left-actions">
            <!-- 可以放置其他操作按钮 -->
          </div>
          <div class="right-actions">
            <t-space>
              <!-- 列配置按钮排在第一位 -->
              <t-button theme="default" variant="outline" size="small" @click="toggleColumnController">
                <template #icon>
                  <t-icon name="setting" />
                </template>
                {{ $t('common.column_config') }}
              </t-button> 
              <!-- 重置列配置按钮 -->
              <t-button theme="default" variant="outline" size="small" @click="resetColumnConfig">
                {{ $t('common.reset_column_config') }}
              </t-button>
            </t-space>
          </div>
        </div>
        <t-table :columns="columns" :data="data" size="small" :rowKey="rowKey" :verticalAlign="verticalAlign"
          :displayColumns.sync="displayColumns"
          :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
          @page-change="rehandlePageChange" :sort="sorts" @change="rehandleChange" @select-change="rehandleSelectChange"
          @sort-change="onSortChange" @filter-change="onFilterChange"
          :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">


          <template #action="{ row }">
            <t-tag v-if="row.action === '放行'" shape="round" theme="success">{{ row.action }}</t-tag>
            <t-tag v-if="row.action === '阻止'" shape="round" theme="danger">{{ row.action }}</t-tag>
            <t-tag v-if="row.action === '禁止'" shape="round" theme="warning">{{ row.action }}</t-tag>

          </template>
          <template #rule="{ row }">
            <t-tag v-if="row.rule !== ''" shape="round" theme="primary" variant="outline">{{ row.rule }}</t-tag>
          </template>
          <template #log_only_mode="{ row }">
            <t-tag :theme="row.log_only_mode == '1' ? 'danger' : 'success'" variant="light-outline">
              {{ row.log_only_mode == '1' ? $t('page.visit_log.log_only_mode_on') : $t('page.visit_log.log_only_mode_off') }}
            </t-tag>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleClickIPDetail(slotProps)" v-if="attack_ip == ''">{{
              $t('common.search')
              + $t('page.visit_log.source_ip') }}</a>
            <a class="t-button-link" @click="handleClickDetail(slotProps)">{{ $t('common.details') }}</a>
          </template>
        </t-table>
      </div>
    </t-card>
    <t-dialog :header="$t('page.visit_log.export_db_file_header')" :body="$t('page.visit_log.export_db_file_content')"
      :visible.sync="exportDbVisible" @confirm="handelExport" width="40%" :confirmOnEnter="true"
      :onClose="() => { this.exportDbVisible = false }">
    </t-dialog>


    <t-dialog :header="$t('page.visit_log.pop_detail_header')" :visible.sync="visitDetailVisible" width="80%"
      :confirmOnEnter="true" :onConfirm="() => { this.visitDetailVisible = false }"
      :onClose="() => { this.visitDetailVisible = false }">
      <visit-detail-page :prop_current_db="searchformData.current_db_name"
        :prop_req_uuid="visitDetailUid"></visit-detail-page>
    </t-dialog>

    <!-- 列配置弹窗 -->
    <t-dialog :header="$t('common.column_config')" :visible.sync="columnControllerVisible" width="500px"
      @confirm="handleColumnControllerConfirm" @cancel="handleColumnControllerCancel">
      <div class="column-controller-content">
        <t-checkbox-group v-model="tempDisplayColumns" direction="vertical">
          <t-checkbox v-for="field in availableFields" :key="field.value" :value="field.value" :label="field.label" />
        </t-checkbox-group>
      </div>
    </t-dialog>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { SearchIcon } from 'tdesign-icons-vue';
import Trend from '@/components/trend/index.vue';
import { prefix } from '@/config/global';
import { allsharedblist, exportlog } from '@/apis/waflog/attacklog';
import VisitDetailPage from './detail/index.vue'

import { NowDate, ConvertStringToUnix, ConvertDateToString, ConvertUnixToDate } from '@/utils/date';
import {
  allhost
} from '@/apis/host';

import { CONTRACT_STATUS, CONTRACT_STATUS_OPTIONS, CONTRACT_TYPES, CONTRACT_PAYMENT_TYPES } from '@/constants';

const staticColumn = ['action', 'op'];

const GROUP_COLUMNS = [
  {
    label: '正常维度',
    value: 'index',
    columns: ['action', 'rule', 'create_time'],
  },
  {
    label: '次要维度',
    value: 'secondary',
    columns: ['action', 'rule', 'create_time'],
  },
  {
    label: '数据维度',
    value: 'data',
    columns: ['action', 'rule', 'create_time'],
  },
];

export default Vue.extend({
  name: 'WebLogList',
  components: {
    SearchIcon,
    Trend,
    VisitDetailPage
  },
  props: {
    attack_ip: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      dateControl: {
        presets: {
          最近300天: [ConvertDateToString(new Date(+new Date() - 86400000 * 299)) + " 00:00:00", ConvertDateToString(new Date()) + " 23:59:59"],
          最近7天: [ConvertDateToString(new Date(+new Date() - 86400000 * 6)) + " 00:00:00", ConvertDateToString(new Date()) + " 23:59:59"],
          最近3天: [ConvertDateToString(new Date(+new Date() - 86400000 * 2)) + " 00:00:00", ConvertDateToString(new Date()) + " 23:59:59"],
          今天: [ConvertDateToString(new Date()) + " 00:00:00", ConvertDateToString(new Date()) + " 23:59:59"],
        },
        range1: ['2023-11-01 00:00:00', '2023-11-16 23:59:59'],
      },
      action_options: [
        {
          label: this.$t('common.defense_status.all'),
          value: ''
        },
        {
          label: this.$t('common.defense_status.stop'),
          value: '阻止'
        },
        {
          label: this.$t('common.defense_status.pass'),
          value: '放行'
        },
        {
          label: this.$t('common.defense_status.forbid'),
          value: '禁止'
        },
      ],
      method_options: [
        {
          label: this.$t('common.all'),
          value: ''
        },
        {
          label: 'POST',
          value: 'POST'
        },
        {
          label: 'GET',
          value: 'GET'
        },
        {
          label: 'CONNECT',
          value: 'CONNECT'
        }
        ,
        {
          label: 'HEAD',
          value: 'HEAD'
        },
        {
          label: 'OPTIONS',
          value: 'OPTIONS'
        },
        {
          label: 'PRI',
          value: 'PRI'
        }
      ],
      CONTRACT_STATUS,
      CONTRACT_STATUS_OPTIONS,
      CONTRACT_TYPES,
      CONTRACT_PAYMENT_TYPES,
      prefix,
      dataLoading: false,
      data: [],
      selectedRowKeys: [],
      value: 'first',
      customText: false,
      columnControllerVisible: false, // 控制列配置弹窗显示
      tempDisplayColumns: [], // 临时存储列配置
      // 默认显示的列配置
      defaultDisplayColumns: staticColumn.concat(['guest_identification', 'time_spent', 'create_time', 'host', 'method', 'url', 'src_ip', 'country','log_only_mode','req_uuid']),
      displayColumns: staticColumn.concat(['guest_identification', 'time_spent', 'create_time', 'host', 'method', 'url', 'src_ip', 'country' ]),
      columns: [
        {
          title: this.$t('page.visit_log.guest_identity'),
          width: 100,
          ellipsis: true,
          colKey: 'guest_identification',
          filter: {
            type: 'input',
            resetValue: '',
            // 按下 Enter 键时也触发确认搜索
            confirmEvents: ['onEnter'],
            props: {
              placeholder: this.$t('common.placeholder'),
            },
            // 是否显示重置取消按钮，一般情况不需要显示
            showConfirmAndReset: true,
          },
        },
        {
          title: this.$t('page.visit_log.time_spent'),
          width: 100,
          ellipsis: true,
          colKey: 'time_spent',
          sorter: true
        },
        {
          title: this.$t('page.visit_log.risk_level'),
          width: 60,
          ellipsis: true,
          colKey: 'risk_level',
        },
        {
          title: this.$t('common.status'),
          width: 60,
          ellipsis: true,
          colKey: 'action',
        },
        {
          title: this.$t('page.visit_log.log_only_mode'),
          width: 120,
          ellipsis: true,
          colKey: 'log_only_mode',
        },
        {
          title: this.$t('page.visit_log.trigger_rule'),
          align: 'left',
          width: 150,
          ellipsis: true,
          colKey: 'rule',
        },
        {
          title: this.$t('page.visit_log.time'),
          width: 170,
          ellipsis: true,
          colKey: 'create_time',
          sorter: true
        },
        {
          title: this.$t('page.visit_log.domain'),
          align: 'left',
          width: 150,
          ellipsis: true,
          colKey: 'host',
        },

        {
          title: this.$t('page.visit_log.request'),
          width: 70,
          ellipsis: true,
          colKey: 'method',
        },
        {
          title: this.$t('page.visit_log.source_ip'),
          width: 150,
          ellipsis: true,
          colKey: 'src_ip',
        },
        {
          title: this.$t('page.visit_log.country'),
          width: 100,
          ellipsis: true,
          colKey: 'country',
        },
        {
          title: this.$t('page.visit_log.province'),
          width: 100,
          ellipsis: true,
          colKey: 'province',
        }, {
          title: this.$t('page.visit_log.city'),
          width: 100,
          ellipsis: true,
          colKey: 'city',
        },
        { 
          title: this.$t('page.visit_log.req_uuid'),
          width: 160,
          ellipsis: true,
          colKey: 'req_uuid',
          filter: {
            type: 'input',
            resetValue: '',
            // 按下 Enter 键时也触发确认搜索
            confirmEvents: ['onEnter'],
            props: {
              placeholder: this.$t('common.placeholder'),
            },
            // 是否显示重置取消按钮，一般情况不需要显示
            showConfirmAndReset: true,
          },
        }, 
        {
          title: this.$t('page.visit_log.access_url'),
          width: 160,
          ellipsis: true,
          colKey: 'url',
        },
        {
          title: 'Header',
          width: 300,
          ellipsis: true,
          colKey: 'header',
          filter: {
            type: 'input',
            resetValue: '',
            // 按下 Enter 键时也触发确认搜索
            confirmEvents: ['onEnter'],
            props: {
              placeholder: this.$t('common.placeholder'),
            },
            // 是否显示重置取消按钮，一般情况不需要显示
            showConfirmAndReset: true,
          },
        },
        {
          title: 'status',
          width: 100,
          ellipsis: true,
          colKey: 'status',
        },
        {
          align: 'left',
          width: 120,
          colKey: 'op',
          title: this.$t('common.op'),
        },
      ],
      rowKey: 'REQ_UUID',
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
      searchValue: '',
      confirmVisible: false,
      deleteIdx: -1,
      //顶部搜索
      searchformData: {
        rule: "",
        req_uuid: "",
        action: "",
        src_ip: "",
        host_code: "",
        status_code: "",
        method: "",
        unix_add_time_begin: "",
        unix_add_time_end: "",
        current_db_name: "local_log.db",
        log_only_mode: "",
      },
      //table 字段
      table: {
        multipleSort: true
      },
      //排序字段
      sorts: {
        sortBy: "unix_add_time",
        descending: true,
      },
      //筛选字段
      filters: {
        filter_by: "",
        filter_value: "",
      },
      //主机字典
      host_dic: {},
      //日志存档字典
      share_db_dic: {},
      //export db
      exportDbVisible: false,
      visitDetailVisible: false,//访问详情弹窗
      visitDetailUid: "",//访问详情id
    };
  },
  computed: {
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    }, 
    // 可用字段列表
    availableFields() {
      return [
        { value: 'action', label: this.$t('common.status') },
        { value: 'rule', label: this.$t('page.visit_log.trigger_rule') },
        { value: 'create_time', label: this.$t('common.create_time') },
        { value: 'host', label: this.$t('page.visit_log.domain') },
        { value: 'method', label: this.$t('page.visit_log.access_method') },
        { value: 'url', label: this.$t('page.visit_log.access_url') },
        { value: 'header', label: this.$t('page.visit_log.request') },
        { value: 'country', label: this.$t('page.visit_log.country') },
        { value: 'province', label: this.$t('page.visit_log.province') },
        { value: 'city', label: this.$t('page.visit_log.city') },
        { value: 'status', label: this.$t('page.visit_log.response_code') },
        { value: 'risk_level', label: this.$t('page.visit_log.risk_level') },
        { value: 'guest_identification', label: this.$t('page.visit_log.guest_identity') },
        { value: 'time_spent', label: this.$t('page.visit_log.time_spent') },
        { value: 'log_only_mode', label: this.$t('page.visit_log.log_only_mode') },
        { value: 'req_uuid',label:this.$t('page.visit_log.req_uuid')}

      ];
    }
  },
  created() {
    console.log(NowDate)
    this.dateControl.range1[0] = NowDate + " 00:00:00"
    this.dateControl.range1[1] = NowDate + " 23:59:59"
    this.searchformData.unix_add_time_begin = ConvertStringToUnix(this.dateControl.range1[0]).toString()
    this.searchformData.unix_add_time_end = ConvertStringToUnix(this.dateControl.range1[1]).toString()
    console.log(this.range1)


  },
  mounted() {
    console.log("attack list mounted ");
    // 加载保存的列配置
    this.loadColumnConfig();
    if (this.$route.query.action != null) {
      console.log(this.$route.query.action)
      this.searchformData.action = this.$route.query.action
    }
    // 判断 vuex 中是否有保存的搜索参数

    if (this.$store.state.attacklog.msgData) {
      const attack = this.$store.state.attacklog;
      this.pagination.current = attack.msgData.currentpage;
      this.pagination.pageSize = attack.msgData.pagesize;
      this.searchformData = attack.msgData.searchData;   // 可以直接取出整个对象
      console.log('daysrc', attack.msgData.searchData)
      let newrange = Array()
      newrange[0] = ConvertUnixToDate(parseInt(attack.msgData.searchData.unix_add_time_begin))
      newrange[1] = ConvertUnixToDate(parseInt(attack.msgData.searchData.unix_add_time_end))
      //console.log(this.dateControl.range1)
      this.$set(this.dateControl, "range1", newrange)
    }

    this.loadShareDbList()
    this.loadHostList().then(() => {
      this.getList("");
    });
  },
  watch: {
    '$route.query.action'(newVal, oldVal) {
      console.log('action changed', newVal, oldVal)
      this.searchformData.action = newVal
      this.getList("")
    },
    attack_ip(newVal) {
      if (newVal !== "") {
        this.updateSearchFormAttackPage();  // 当 attack_ip 变化时，更新表单数据
      }
    }
  },
  beforeRouteLeave(to, from, next) {
    console.log("attack list beforeRouteLeave ");
    // vuex 存储操作
    this.$store.dispatch("attacklog/setAttackMsgData", {
      //query: this.queryParam,
      pagesize: this.pagination.pageSize,
      currentpage: this.pagination.current,
      searchData: this.searchformData,
    })
    next(); // 继续后续的导航解析过程
  },
  methods: {
    // 切换列配置弹窗
    toggleColumnController() {
      this.tempDisplayColumns = [...this.displayColumns];
      this.columnControllerVisible = true;
    },
    // 确认列配置
    handleColumnControllerConfirm() {
      this.displayColumns = [...this.tempDisplayColumns];
      this.columnControllerVisible = false;
      // 触发列配置变化回调
      this.handleDisplayColumnsChange(this.displayColumns);
    },
    // 取消列配置
    handleColumnControllerCancel() {
      this.columnControllerVisible = false;
      this.tempDisplayColumns = [];
    },
    // 加载保存的列配置
    loadColumnConfig() {
      try {
        const savedConfig = localStorage.getItem('attack_table_display_columns');
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig);
          if (Array.isArray(parsedConfig) && parsedConfig.length > 0) {
            this.displayColumns = parsedConfig;
          }
        }
      } catch (error) {
        console.error(this.$t('common.column_config_load_failed'), error);
        // 如果加载失败，使用默认配置
        this.displayColumns = [...this.defaultDisplayColumns];
      }
    },

    // 保存列配置到localStorage
    saveColumnConfig() {
      try {
        localStorage.setItem('attack_table_display_columns', JSON.stringify(this.displayColumns));
        this.$message.success(this.$t('common.column_config_saved'));
      } catch (error) {
        console.error(this.$t('common.column_config_save_failed'), error);
        this.$message.error(this.$t('common.column_config_save_failed'));
      }
    },

    // 重置列配置为默认值
    resetColumnConfig() {
      if (confirm(this.$t('common.column_config_reset_confirm'))) {
        this.displayColumns = [...this.defaultDisplayColumns];
        this.saveColumnConfig();
        this.$message.success(this.$t('common.column_config_reset_success'));
      }
    },

    // 处理列配置变化
    handleDisplayColumnsChange(columns) {
      this.displayColumns = columns;
      this.saveColumnConfig();
    },
    updateSearchFormAttackPage() {
      console.log("updateSearchFormAttackPage")
      if (this.attack_ip != "") {
        console.log("attack ip index", this.attack_ip)
        this.searchformData.src_ip = this.attack_ip
        this.dateControl.range1[0] = "2022-01-01 00:00:00"
        this.dateControl.range1[1] = NowDate + " 23:59:59"
        this.searchformData.unix_add_time_begin = ConvertStringToUnix(this.dateControl.range1[0]).toString()
        this.searchformData.unix_add_time_end = ConvertStringToUnix(this.dateControl.range1[1]).toString()
        this.pagination.current = 1
        this.getList("")
      }

    },
    loadShareDbList() {
      let that = this;
      allsharedblist("").then((res) => {
        let resdata = res
        console.log("loadShareDbList", resdata)
        if (resdata.code === 0) {
          let share_options = resdata.data;
          for (let i = 0; i < share_options.length; i++) {
            that.share_db_dic[share_options[i].file_name] = share_options[i].file_name + "(" + share_options[i].cnt + ")"
          }
        }
      })
        .catch((e: Error) => {
          console.log(e);
        })
    },
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
      console.log("getList")
      let that = this
      if (keyword != undefined && keyword == "all") {
        that.pagination.current = 1
      }
      that.searchformData.unix_add_time_begin = ConvertStringToUnix(this.dateControl.range1[0]).toString()
      that.searchformData.unix_add_time_end = ConvertStringToUnix(this.dateControl.range1[1]).toString()

      console.log("getList searchformData", that.searchformData)
      let sort_descending = that.sorts.descending ? "desc" : "asc"

      this.$request
        .post('/waflog/attack/list', {
          pageSize: that.pagination.pageSize,
          pageIndex: that.pagination.current,
          sort_by: that.sorts.sortBy,
          sort_descending: sort_descending,
          filter_by: that.filters.filter_by,
          filter_value: that.filters.filter_value,
          unix_add_time_begin: ConvertStringToUnix(this.dateControl.range1[0]).toString(),
          unix_add_time_end: ConvertStringToUnix(this.dateControl.range1[1]).toString(),
          ...that.searchformData
        },
        )
        .then((res) => {
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {

            //const { list = [] } = resdata.data.list;

            this.data = resdata.data.list ?? [];
            this.pagination = {
              ...this.pagination,
              total: resdata.data.total,
            };
          } else {
            that.$message.warning(resdata.msg);
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
    handelExport(keyword) {

      let that = this
      if (keyword != undefined && keyword == "all") {
        that.pagination.current = 1
      }
      that.searchformData.unix_add_time_begin = ConvertStringToUnix(this.dateControl.range1[0]).toString()
      that.searchformData.unix_add_time_end = ConvertStringToUnix(this.dateControl.range1[1]).toString()

      let sort_descending = that.sorts.descending ? "desc" : "asc"

      exportlog({
        batch_size: 1000,
        pageSize: that.pagination.pageSize,
        pageIndex: that.pagination.current,
        sort_by: that.sorts.sortBy,
        sort_descending: sort_descending,
        filter_by: that.filters.filter_by,
        filter_value: that.filters.filter_value,
        unix_add_time_begin: ConvertStringToUnix(this.dateControl.range1[0]).toString(),
        unix_add_time_end: ConvertStringToUnix(this.dateControl.range1[1]).toString(),
        ...that.searchformData
      }
      ).then((res) => {
        let resdata = res
        console.log(resdata)
      })
        .catch((e: Error) => {
          console.log(e);
        })
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
    handleClickDetail(e) {
      console.log(e)
      const { req_uuid } = e.row
      console.log(req_uuid)

      if (this.attack_ip == "") {
        this.$router.push(
          {
            path: '/waf/wafattacklogdetail',
            query: {
              req_uuid: req_uuid + "#" + this.searchformData.current_db_name,
            },
          },
        );
      } else {
        this.visitDetailUid = req_uuid
        this.visitDetailVisible = true
      }

    },
    handleClickIPDetail(e) {
      console.log(e)
      const { src_ip } = e.row
      this.searchformData.src_ip = src_ip
      this.getList("")

    },
    handleClickDelete(row: { rowIndex: any }) {
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
    //Jump Url
    handleJumpOnlineUrl() {
      window.open(this.samwafglobalconfig.getOnlineUrl() + "/guide/attacklog.html");
    },
    /**
     * table 排序
     */
    onSortChange(sorter) {
      let that = this

      if (sorter != undefined) {
        this.sorts.sortBy = sorter.sortBy
        that.sorts.descending = sorter.descending

      } else {
        that.sorts.sortBy = "unix_add_time"
        that.sorts.descending = true
      }
      this.getList("")
    },
    /**
     * 访客身份筛选
     */
    filterGuestChange(e) {
    },
    /**
     * 筛选结果
     */
    onFilterChange(e) {
      this.filters.filter_by = "";
      this.filters.filter_value = "";
      //访客身份
      if (e.guest_identification != undefined && e.guest_identification != "") {
        this.filters.filter_by = "guest_identification";
        this.filters.filter_value = e.guest_identification;
      }
      //请求ID
      if (e.req_uuid != undefined && e.req_uuid != "") {
        if (this.filters.filter_by == "") {
          this.filters.filter_by = "req_uuid";
          this.filters.filter_value = e.req_uuid;
        } else {
          this.filters.filter_by = this.filters.filter_by + "|req_uuid";
          this.filters.filter_value = this.filters.filter_value + "|" + e.req_uuid;
        }
      }
      //header
      if (e.header != undefined && e.header != "") {
        if (this.filters.filter_by == "") {
          this.filters.filter_by = "header";
          this.filters.filter_value = e.header;
        } else {
          this.filters.filter_by = this.filters.filter_by + "|header";
          this.filters.filter_value = this.filters.filter_value + "|" + e.header;
        }
      }
       
      this.getList("")
    },
    resetState() {
      console.log("来自上级得状态清理")
      this.$refs.form.reset()
      this.dateControl.range1[0] = NowDate + " 00:00:00"
      this.dateControl.range1[1] = NowDate + " 23:59:59"
      this.searchformData.unix_add_time_begin = ConvertStringToUnix(this.dateControl.range1[0]).toString()
      this.searchformData.unix_add_time_end = ConvertStringToUnix(this.dateControl.range1[1]).toString()
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
