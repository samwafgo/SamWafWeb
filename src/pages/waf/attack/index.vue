<template>
  <div>
    <t-alert theme="info" :message="$t('page.visit_log.visit_log')" :close="true">
      <template #operation>
        <span @click="handleJumpOnlineUrl">{{ $t('common.online_document') }}</span>
      </template>
    </t-alert>

    <!-- 日志配置区域 -->
    <t-card class="log-config-card" style="margin-bottom: 16px;">
      <div @click="toggleLogConfig" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center;">
          <t-icon :name="logConfigVisible ? 'chevron-down' : 'chevron-right'" style="margin-right: 8px;" />
          <span style="font-weight: 500; font-size: 14px;">日志配置</span>
        </div>
        <t-button theme="primary" size="small" @click.stop="saveLogConfig" :loading="logConfigSaving">
          保存配置
        </t-button>
      </div>
      
      <div v-show="logConfigVisible" style="margin-top: 16px;">
        <t-form :data="logConfig" :label-width="200" layout="inline">
          <t-row :gutter="16">
            <t-col :span="6">
              <t-form-item label="是否记录响应报文" name="record_resp">
                <t-select v-model="logConfig.record_resp" style="width: 100%;">
                  <t-option value="1" label="是" />
                  <t-option value="0" label="否" />
                </t-select>
              </t-form-item>
            </t-col>
            
            <t-col :span="6">
              <t-form-item label="记录原始请求BODY报文" name="record_all_src_byte_info">
                <t-select v-model="logConfig.record_all_src_byte_info" style="width: 100%;">
                  <t-option value="1" label="启动" />
                  <t-option value="0" label="关闭" />
                </t-select>
              </t-form-item>
            </t-col>
            
            <t-col :span="6">
              <t-form-item label="日志记录类型" name="record_log_type">
                <t-select v-model="logConfig.record_log_type" style="width: 100%;">
                  <t-option value="all" label="全部" />
                  <t-option value="abnormal" label="非正常" />
                </t-select>
              </t-form-item>
            </t-col>
            
            <t-col :span="6">
              <t-form-item label="记录请求最大报文(字节)" name="record_max_req_body_length">
                <t-input-number v-model="logConfig.record_max_req_body_length" style="width: 100%;" :min="0" />
              </t-form-item>
            </t-col>
          </t-row>
          
          <t-row :gutter="16">
            <t-col :span="6">
              <t-form-item label="记录响应最大报文(字节)" name="record_max_res_body_length">
                <t-input-number v-model="logConfig.record_max_res_body_length" style="width: 100%;" :min="0" />
              </t-form-item>
            </t-col>
            
            <t-col :span="6">
              <t-form-item label="删除历史日志(天)" name="delete_history_log_day">
                <t-input-number v-model="logConfig.delete_history_log_day" style="width: 100%;" :min="1" />
              </t-form-item>
            </t-col>
            
            <t-col :span="6">
              <t-form-item label="日志归档最大记录数" name="log_db_size">
                <t-input-number v-model="logConfig.log_db_size" style="width: 100%;" :min="0" />
              </t-form-item>
            </t-col>
            
            <t-col :span="6">
              <t-form-item label="日志归档最大文件(MB)" name="db_file_size">
                <t-input-number v-model="logConfig.db_file_size" style="width: 100%;" :min="0" />
              </t-form-item>
            </t-col>
          </t-row>
          
          <t-row :gutter="16">
            <t-col :span="6">
              <t-form-item label="是否开启日志持久化" name="log_persist_enable">
                <t-select v-model="logConfig.log_persist_enable" style="width: 100%;">
                  <t-option value="1" label="开启" />
                  <t-option value="0" label="关闭" />
                </t-select>
              </t-form-item>
            </t-col>
            
            <t-col :span="6">
              <t-form-item label="数据库批量插入数量" name="batch_insert">
                <t-input-number v-model="logConfig.batch_insert" style="width: 100%;" :min="1" />
              </t-form-item>
            </t-col>
            
            <t-col :span="6">
              <t-form-item label="IP Tag 存放位置" name="ip_tag_db">
                <t-select v-model="logConfig.ip_tag_db" style="width: 100%;">
                  <t-option value="0" label="主库" />
                  <t-option value="1" label="读取 stat库" />
                </t-select>
              </t-form-item>
            </t-col>
          </t-row>
        </t-form>
      </div>
    </t-card>

    <t-card class="list-card-container">
      <t-row justify="space-between">
        <t-form ref="form" :data="searchformData" :label-width="150" colon layout="inline"
          :style="{ marginBottom: '8px' }">
          <t-form-item :label="$t('page.visit_log.website')" name="website">
            <t-select v-model="searchformData.host_code" clearable filterable :style="{ width: '150px' }">
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
            <t-button theme="primary" variant="outline" :style="{ marginLeft: '8px' }" @click="handleIPExtractIssue">
              {{ $t('page.visit_log.detail.ip_extract_issue') }}
            </t-button>
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
          <template #src_ip="{ row }">
            <span>{{ row.src_ip }}</span>
            <t-button theme="primary" shape="round" size="small" style="margin-left: 8px;" @click="handleAddipblock(row)">
              {{ $t('page.visit_log.detail.add_to_deny_list') }}
            </t-button>
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

    <!-- IP提取问题对话框 -->
    <t-dialog :header="$t('page.visit_log.detail.ip_extract_issue')" :visible.sync="ipExtractDialogVisible" :width="800" :footer="false">
      <div slot="body">
        <p>{{ $t('page.visit_log.detail.ip_extract_issue_desc') }}</p>
        
        <!-- 视频教程链接 -->
        <t-alert theme="success" style="margin-bottom: 16px;">
          <template #icon>
            <span style="font-size: 20px;">📺</span>
          </template>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span>{{ $t('page.visit_log.detail.ip_extract_video_tutorial') }}</span>
            <t-button theme="primary" size="small" @click="openVideoTutorial">
              {{ $t('page.visit_log.detail.ip_extract_watch_tutorial') }}
            </t-button>
          </div>
        </t-alert>
        
        <!-- 常用头信息提示区域 -->
        <t-card :title="$t('page.visit_log.detail.ip_extract_common_headers')" style="margin-bottom: 20px;">
          <p style="margin-bottom: 12px; color: #666;">{{ $t('page.visit_log.detail.ip_extract_common_headers_desc') }}</p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
            <t-button size="small" variant="outline" @click="selectIPHeader('CF-Connecting-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.cloudflare') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('True-Client-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.cloudflare_enterprise') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('X-Forwarded-For')">
              {{ $t('page.visit_log.detail.ip_extract_headers.x_forwarded_for') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('X-Real-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.x_real_ip') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('X-Client-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.x_client_ip') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('Fastly-Client-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.fastly') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('Incap-Client-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.incapsula') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('CF-Connecting-IP,X-Forwarded-For,X-Real-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.multiple') }}
            </t-button>
          </div>
          <t-alert theme="info" :message="$t('page.visit_log.detail.ip_extract_multiple_tips')" style="margin-top: 8px;" />
          <div style="margin-top: 8px; color: #999; font-size: 12px;">
            {{ $t('page.visit_log.detail.ip_extract_example') }}
          </div>
        </t-card>
        
        <t-form :data="ipExtractFormData" ref="ipExtractForm" :rules="ipExtractRules" @submit="onSubmitIPExtract" :labelWidth="150">
          <t-form-item :label="$t('page.systemconfig.label_configuration_item')" name="item">
            <t-input :style="{ width: '600px' }" v-model="ipExtractFormData.item" disabled></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.systemconfig.label_configuration_value')" name="value">
            <t-input :style="{ width: '600px' }" v-model="ipExtractFormData.value" :placeholder="$t('page.visit_log.detail.ip_extract_issue_tips')"></t-input>
            <div class="form-item-tips">{{ $t('page.visit_log.detail.ip_extract_issue_tips') }}</div>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="ipExtractDialogVisible = false">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
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
import {
  wafIPBlockAddApi
} from '@/apis/ipblock';
import {
  get_detail_by_item_api,
  edit_system_config_api
} from '@/apis/systemconfig';

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
          width: 200,
          ellipsis: true,
          colKey: 'src_ip',
          cell: 'src_ip',
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
      
      // 日志配置相关
      logConfigVisible: false, // 日志配置区域是否展开
      logConfigSaving: false, // 保存配置按钮加载状态
      logConfig: {
        record_log_type: 'all',
        record_max_req_body_length: '0',
        record_max_res_body_length: '0',
        record_resp: '0',
        record_all_src_byte_info: '0',
        delete_history_log_day: '7',
        log_db_size: '0',
        db_file_size: '0',
        log_persist_enable: '0',
        batch_insert: '0',
        ip_tag_db: '0',
      },
      logConfigItems: {}, // 存储配置项的完整信息（包含ID等）
      
      // IP提取配置相关
      ipExtractDialogVisible: false,
      ipExtractFormData: {
        item: 'gwaf_proxy_header',
        value: '',
        remarks: '获取访客IP头信息（按照顺序）'
      },
      ipExtractRules: {
        item: [{ required: true, message: '', type: 'error' }],
        value: [{ required: false, message: '', type: 'error' }]
      }
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
    // 加载日志配置
    this.loadLogConfig();
    
    if (this.$route.query.action != null) {
      console.log(this.$route.query.action)
      this.searchformData.action = this.$route.query.action
    }
    // 处理从其他页面传来的IP参数
    if (this.$route.query.src_ip != null) {
      console.log('从路由获取src_ip:', this.$route.query.src_ip)
      this.searchformData.src_ip = this.$route.query.src_ip
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
    '$route.query.src_ip'(newVal, oldVal) {
      console.log('src_ip changed', newVal, oldVal)
      if (newVal) {
        this.searchformData.src_ip = newVal
        this.getList("")
      }
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
          ...that.getFilteredSearchData()
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
    handleAddipblock(row) {
      const ip = row.src_ip;
      const host_code = row.host_code;

      if (!host_code) {
        this.$message.warning("当前网站不存在");
        return
      }

      let that = this

      const confirmDia = this.$dialog.confirm({
        header: this.$t('page.visit_log.detail.add_to_deny_list_confirm_header'),
        body: this.$t('page.visit_log.detail.add_to_deny_list_confirm_body'),
        confirmBtn: this.$t('common.confirm'),
        cancelBtn: this.$t('common.cancel'),
        onConfirm: ({ e }) => {
          //add deny IP
          let formData = {
            host_code: host_code,
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

    // 获取过滤后的搜索数据
    getFilteredSearchData() {
      const filteredData = {};
      Object.keys(this.searchformData).forEach(key => {
        const value = this.searchformData[key];
        if (typeof value === 'string') {
          filteredData[key] = value.trim();
        } else {
          filteredData[key] = value;
        }
      });
      return filteredData;
    },

    // 切换日志配置区域显示/隐藏
    toggleLogConfig() {
      this.logConfigVisible = !this.logConfigVisible;
    },

    // 加载日志配置
    loadLogConfig() {
      const configKeys = [
        'record_log_type',
        'record_max_req_body_length',
        'record_max_res_body_length',
        'record_resp',
        'record_all_src_byte_info',
        'delete_history_log_day',
        'log_db_size',
        'db_file_size',
        'log_persist_enable',
        'batch_insert',
        'ip_tag_db',
      ];
      
      // 使用 Promise.all 并行获取所有配置项
      const promises = configKeys.map(key => {
        return get_detail_by_item_api({ item: key })
          .then(res => {
            if (res.code === 0 && res.data) {
              this.logConfigItems[key] = res.data;
              // 直接使用原始值，不做类型转换
              this.logConfig[key] = res.data.value;
            }
            return { key, success: true };
          })
          .catch(err => {
            console.error(`加载配置项 ${key} 失败:`, err);
            return { key, success: false };
          });
      });
      
      Promise.all(promises).then(results => {
        const failedItems = results.filter(r => !r.success);
        if (failedItems.length === 0) {
          console.log('日志配置加载成功', this.logConfig);
        } else {
          console.warn('部分配置项加载失败:', failedItems);
        }
      });
    },

    // 保存日志配置
    saveLogConfig() {
      this.logConfigSaving = true;
      
      const configKeys = [
        'record_log_type',
        'record_max_req_body_length',
        'record_max_res_body_length',
        'record_resp',
        'record_all_src_byte_info',
        'delete_history_log_day',
        'log_db_size',
        'db_file_size',
        'log_persist_enable',
        'batch_insert',
        'ip_tag_db',
      ];
      
      const savePromises = configKeys.map(key => {
        const item = this.logConfigItems[key];
        if (item) {
          return edit_system_config_api({
            id: item.id,
            category: item.category,
            item: item.item,
            value: String(this.logConfig[key]),
            type: item.type,
            title: item.title,
            options: item.options || '',
          }).catch(err => {
            console.error(`保存配置项 ${key} 失败:`, err);
            throw err;
          });
        }
        return Promise.resolve();
      });
      
      Promise.all(savePromises)
        .then(() => {
          this.$message.success(this.$t('common.tips.save_success'));
          // 重新加载日志列表以应用新配置
          this.getList("");
        })
        .catch((e) => {
          console.error('保存日志配置失败', e);
          this.$message.error(this.$t('common.tips.save_failed'));
        })
        .finally(() => {
          this.logConfigSaving = false;
        });
    },

    // 处理IP提取问题
    handleIPExtractIssue() {
      this.ipExtractDialogVisible = true;
      // 获取当前配置
      get_detail_by_item_api({ item: 'gwaf_proxy_header' }).then(res => {
        if (res.code === 0 && res.data) {
          this.ipExtractFormData = res.data;
        }
      }).catch(err => {
        console.error('获取IP提取配置失败:', err);
      });
    },

    // 快捷选择IP头信息
    selectIPHeader(headerValue) {
      this.ipExtractFormData.value = headerValue;
      this.$message.success('已选择: ' + headerValue);
    },

    // 打开视频教程
    openVideoTutorial() {
      window.open('https://www.bilibili.com/video/BV1pn8Ez2ELQ/', '_blank');
    },

    // 提交IP提取配置
    onSubmitIPExtract({ validateResult }) {
      if (validateResult === true) {
        edit_system_config_api(this.ipExtractFormData).then(res => {
          if (res.code === 0) {
            this.$message.success(res.msg);
            this.ipExtractDialogVisible = false;
          } else {
            this.$message.error(res.msg);
          }
        }).catch(err => {
          this.$message.error(err.message);
        });
      }
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
