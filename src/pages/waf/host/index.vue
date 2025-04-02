<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAddHost"> {{ $t('page.host.new_protection') }}</t-button>
          <t-button variant="base" theme="default" @click="HandleExportExcel()"> {{ $t('page.host.export_data') }}</t-button>
          <t-button variant="base" theme="default" @click="HandleImportExcel()"> {{ $t('page.host.import_data') }}</t-button>
          <t-button variant="base" theme="warning" @click="handleModifyAllGuardStatus()"> {{ $t('page.host.modify_all_guard_status') }}</t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="80" colon   layout="inline" :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.host.website')" name="code">
              <t-select v-model="searchformData.code" clearable :style="{ width: '200px' }">
                <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                  {{ item }}
                </t-option>
              </t-select>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>

        </div>
      </t-row>

      <div class="table-container">
        <t-alert theme="info" :message="$t('page.host.core_features')" close>
          <template #operation>
            <span @click="handleJumpOnlineUrl">{{ $t('common.online_document') }}</span>
          </template>
        </t-alert>
        <t-table :columns="columns" size="small" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign"
                 :hover="hover" :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
                 @page-change="rehandlePageChange" @change="rehandleChange" @select-change="rehandleSelectChange"  @sort-change="onSortChange"
                 @filter-change="onFilterChange"
                 :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">
          <template #healthy_status="{ row }">
            <health-status
              v-if="row.global_host!==1"
              :healthyStatus="row.healthy_status"
              :isLoadBalance="row.is_enable_load_balance === '1' || row.is_enable_load_balance === 1"
            />
          </template>
          <template #guard_status="{ row }">
            <t-switch size="medium" v-model="row.guard_status ===1" :label="[$t('page.host.guard_status_on'), $t('page.host.guard_status_off')]"
                      @change="changeGuardStatus($event,row)">
            </t-switch>
          </template>
          <template #real_time="{ row }">
            <span :title="$t('page.host.real_qps')">{{row.real_time_qps}}</span> / <span :title="$t('page.host.real_active')">{{row.real_time_connect_cnt}}</span>
          </template>
          <template #start_status="{ row }">
            <t-switch size="medium" v-model="row.start_status===0" :label="[$t('page.host.auto_start_on'), $t('page.host.auto_start_off')]"
                      @change="changeStartStatus($event,row)">
            </t-switch>
          </template>
          <template #ssl="{ row }">
            <p v-if="row.ssl === SSL_STATUS.NOT_SSL">{{ $t('page.host.ssl_no') }}</p>
            <p v-if="row.ssl === SSL_STATUS.SSL">{{ $t('page.host.ssl_yes') }}</p>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" v-if="slotProps.row.global_host!==1" @click="handleClickCopy(slotProps)">{{ $t('common.copy') }}</a>
            <a class="t-button-link" v-if="slotProps.row.global_host!==1" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" v-if="slotProps.row.global_host!==1" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
            <a class="t-button-link" v-if="slotProps.row.global_host!==1" @click="handleClickSSLApply(slotProps)">{{ $t('page.host.ssl_auto_apply') }}</a>
          </template>
        </t-table>
      </div>
      <div>
        <router-view></router-view>
      </div>
    </t-card>

    <!-- New WebSite Dialog -->
    <t-dialog :visible.sync="addFormVisible" :width="700" :footer="false">
      <div slot="header">
        {{ $t('common.new') }}
        <t-link theme="primary" :href="hostAddUrl" target="_blank">
          <link-icon slot="prefix-icon"></link-icon>
          {{ $t('common.online_document') }}
        </t-link>
      </div>
      <div slot="body">
        <host-form
          :value="formData"
          :ssl-config-list="sslConfigList"
          :select-can-filter="selectCanFilter"
          @close="onClickCloseBtn"
          @submit="onSubmit"
          @add-ssl="handleAddNewSsl"
          @edit-ssl="handleEditSsl('new')"
          @ssl-change="handleSslChange"
        ></host-form>
      </div>
    </t-dialog>

    <!-- Edit WebSite Dialog -->
    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="700" :footer="false">
      <div slot="body">
        <host-form
        :value="formEditData"
        :ssl-config-list="sslConfigList"
        :select-can-filter="selectCanFilter"
        :is-edit="true"
        @close="onClickCloseEditBtn"
        @submit="onSubmitEdit"
        @add-ssl="handleAddNewSsl"
        @edit-ssl="handleEditSsl('edit')"
        @ssl-change="handleSslChange"
        ></host-form>
      </div>
    </t-dialog>

    <t-dialog :header="$t('common.confirm_delete')" :body="confirmBody" :visible.sync="confirmVisible" @confirm="onConfirmDelete"
              :onCancel="onCancel">
    </t-dialog>

    <t-dialog :visible.sync="ImportXlsxVisible" @confirm="ImportXlsxVisible=false">
      <t-radio-group v-model="uploadParams.import_code_strategy">
        <t-radio value="0">{{$t('page.host.upload.import_auto_create_code')}}</t-radio>
        <t-radio value="1">{{$t('page.host.upload.import_remain_code')}}</t-radio>
      </t-radio-group>
      <t-upload :action="fileUploadUrl" :tips="tips" :headers="fileHeader" v-model="files" @fail="handleFail"
                :data="uploadParams"
                @success="onSuccess" theme="file-input" :placeholder="$t('page.host.upload_tips')"></t-upload>
    </t-dialog>

    <t-dialog :header="$t('page.host.guard_status_confirm')" :visible.sync="guardConfirmVisible" @confirm="onGuardStatusConfirm"
              :onCancel="onGuardStatusCancel">
      <div slot="body">
        <div>{{$t('page.host.guard_status_confirm_content')}}</div>
      </div>
    </t-dialog>

    <t-dialog :header="$t('page.host.start_status_confirm')" :visible.sync="startConfirmVisible" @confirm="onStartStatusConfirm"
              :onCancel="onStartStatusCancel">
      <div>{{$t('page.host.start_status_confirm_content')}}</div>
    </t-dialog>

    <t-dialog :header="$t('common.new')" :visible.sync="addSSLFormVisible" :width="750" :footer="false">
      <div slot="body">
        <ssl-form
          :value="sslformData"
          @close="addSSLFormVisible = !addSSLFormVisible"
          @submit="onSSLSubmit"
        ></ssl-form>
      </div>
    </t-dialog>
    <t-dialog :header="$t('common.edit')" :visible.sync="editSSLFormVisible" :width="750" :footer="false">
      <div slot="body">
        <ssl-form
          :value="sslformEditData"
          :is-edit="true"
          @close="editSSLFormVisible = !editSSLFormVisible"
          @submit="onSSLSubmitEdit"
        ></ssl-form>
      </div>
    </t-dialog>

    <t-dialog :header="$t('page.host.ssl_auto_apply')" :visible.sync="sslAutoApplyVisible" :width="900" :footer="false">
      <div slot="body">
        <ssl-order-list :src-host-code="currentHostCode"></ssl-order-list>
      </div>
    </t-dialog>

    <t-dialog :header="$t('page.host.modify_all_guard_status')" :visible.sync="guardAllConfirmVisible" @confirm="onGuardAllStatusConfirm"
              :onCancel="onGuardAllStatusCancel">
      <div slot="body">
        <div>{{$t('page.host.confirm_modify_all_guard_status')}}</div>
        <t-radio-group v-model="guardAllStatus" style="margin-top: 16px;">
          <t-radio value="1">{{$t('page.host.guard_status_on')}}</t-radio>
          <t-radio value="0">{{$t('page.host.guard_status_off')}}</t-radio>
        </t-radio-group>
      </div>
    </t-dialog>

  </div>
</template>
<script lang="ts">
import {AesDecrypt, getBaseUrl,getOrDefault} from '@/utils/usuallytool';
import Vue from 'vue';
import {FileSafetyIcon, LinkIcon, SearchIcon} from 'tdesign-icons-vue';
import {prefix} from '@/config/global';

import {export_api} from '@/apis/common';
import {allhost, changeGuardStatus, changeStartStatus, hostlist,getHostDetail,delHost,addHost,editHost,modifyAllGuardStatus} from '@/apis/host';
import {sslConfigListApi,sslConfigAddApi,sslConfigEditApi,sslConfigDetailApi} from '@/apis/sslconfig';
import SslOrderList from "@/pages/waf/sslorder/index.vue";
import { v4 as uuidv4 } from 'uuid';
import {
  GUARD_STATUS,
  SSL_STATUS,
  START_STATUS
} from '@/constants';
import LoadBalance from "../loadbalance/index.vue";
import HttpAuthBase from "../http_auth_base/index.vue"
import HealthStatus from "./components/health-status/HealthStatus.vue";
/*配置组件*/
import HealthyConfig from './components/HealthyConfig.vue';
import CaptchaConfig from './components/CaptchaConfig.vue';
import HostForm from './components/HostForm.vue';
import SslForm from './components/SslForm.vue';
// 导入初始化常量
import { INITIAL_DATA, INITIAL_SSL_DATA, INITIAL_HEALTHY, INITIAL_CAPTCHA } from './constants';

export default Vue.extend({
  name: 'ListBase',
  components: {
    SearchIcon,
    FileSafetyIcon,
    LinkIcon,
    SslOrderList,
    LoadBalance,
    HttpAuthBase,
    HealthStatus,
    HealthyConfig,
    CaptchaConfig,
    HostForm,
    SslForm,
  },
  data() {
    return {
      uploadParams:{
        import_code_strategy: '0',//编码导入策略 0 新增自动生成 1 保留原有
        import_table:"hosts",//导入到哪个表
      },
      files: [],
      tips: this.$t('page.host.upload_file_limit_size'),
      baseUrl: "",
      fileUploadUrl: "",
      fileHeader: {},
      addFormVisible: false,
      editFormVisible: false,
      guardVisible: false,
      confirmVisible: false,
      addSSLFormVisible:false,
      editSSLFormVisible:false,
      sslAutoApplyVisible: false,
      ImportXlsxVisible: false,
      formData: {
        ...INITIAL_DATA
      },
      formEditData: {
        ...INITIAL_DATA
      },
      sslformData: {
        ...INITIAL_SSL_DATA
      },
      sslformEditData: {
        ...INITIAL_SSL_DATA
      },
      sslrules: {
        cert_content: [
          {
            required: true,
            message: this.$t('common.select_placeholder') + this.$t('page.ssl.label_cert_content'),
            type: 'error'
          }
        ],
        key_content: [
          {
            required: true,
            message: this.$t('common.select_placeholder') + this.$t('page.ssl.label_key_content'),
            type: 'error'
          }
        ]
      },
      remote_system_options: [{
        label: this.$t('page.host.back_system_type_baota'),
        value: '1'
      },
        {
          label: this.$t('page.host.back_system_type_phpstudy'),
          value: '2'
        },
        {
          label: this.$t('page.host.back_system_type_phpnow'),
          value: '3'
        },
        {
          label: this.$t('page.host.back_system_type_default'),
          value: '4'
        },
      ],
      remote_app_options: [{
        label: this.$t('page.host.back_system_biz_website'),
        value: '1'
      },
        {
          label: this.$t('page.host.back_system_biz_api'),
          value: '2'
        },
        {
          label: this.$t('page.host.back_system_biz_mange'),
          value: '3'
        },
        {
          label: this.$t('page.host.back_system_biz_default'),
          value: '4'
        },
      ],
      GUARD_STATUS,
      SSL_STATUS,
      START_STATUS,
      prefix,
      dataLoading: false,
      data: [], //列表数据信息
      detail_data: [], //加载详情信息用于编辑
      selectedRowKeys: [],
      value: 'first',
      columns: [
        {
          title: this.$t('page.host.healthy_status'),
          colKey: 'healthy_status',
          width: 100,
          cell: {
            col: 'healthy_status'
          }
        },
        {
          title: this.$t('page.host.host'),
          align: 'left',
          width: 200,
          ellipsis: true,
          colKey: 'host',
          filter: {
            type: 'input',
            resetValue: '',
            confirmEvents: ['onEnter'],
            props: {
              placeholder: this.$t('common.placeholder'),
            },
            showConfirmAndReset: true,
          },
        },
        {
          title: this.$t('page.host.port'),
          width: 100,
          ellipsis: true,
          colKey: 'port',
          filter: {
            type: 'input',
            resetValue: '',
            confirmEvents: ['onEnter'],
            props: {
              placeholder: this.$t('common.placeholder'),
            },
            showConfirmAndReset: true,
          },
        },
        {
          title: this.$t('page.host.real_time'),
          colKey: 'real_time',
          width: 120,
          cell: {
            col: 'real_time'
          }
        },
        {
          title: this.$t('page.host.start_status'),
          colKey: 'start_status',
          width: 100,
          cell: {
            col: 'start_status'
          }
        },
        {
          title: this.$t('page.host.guard_status'),
          colKey: 'guard_status',
          width: 100,
          cell: {
            col: 'guard_status'
          }
        },
        {
          title:this.$t('page.host.ssl'),
          width: 100,
          ellipsis: true,
          colKey: 'ssl',
          cell: {
            col: 'ssl'
          }
        },
        {
          title: this.$t('page.host.remote_ip'),
          width: 100,
          ellipsis: true,
          colKey: 'remote_ip',
          filter: {
            type: 'input',
            resetValue: '',
            confirmEvents: ['onEnter'],
            props: {
              placeholder: this.$t('common.placeholder'),
            },
            showConfirmAndReset: true,
          },
        },
        {
          title: this.$t('page.host.remote_port'),
          width: 100,
          ellipsis: true,
          colKey: 'remote_port',
          filter: {
            type: 'input',
            resetValue: '',
            confirmEvents: ['onEnter'],
            props: {
              placeholder: this.$t('common.placeholder'),
            },
            showConfirmAndReset: true,
          },
        },
        {
          title: this.$t('common.remarks'),
          width: 100,
          ellipsis: true,
          colKey: 'remarks',
          filter: {
            type: 'input',
            resetValue: '',
            confirmEvents: ['onEnter'],
            props: {
              placeholder: this.$t('common.placeholder'),
            },
            showConfirmAndReset: true,
          },
        },
        {
          title: this.$t('common.create_time'),
          width: 200,
          ellipsis: true,
          colKey: 'create_time',
          sorter: true
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
      pagination: {
        total: 0,
        current: 1,
        pageSize: 10
      },
      //顶部搜索
      searchformData: {
        remarks: "",
        code: ""
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
      //索引区域
      deleteIdx: -1,
      guardStatusIdx: -1,
      startStatusIdx: -1,

      //来源页面
      sourcePage: "",
      hostAddUrl: this.samwafglobalconfig.getOnlineUrl() + '/guide/Host.html#_2-新增可被防火墙保护的网站',
      //主机字典
      host_dic: {},

      //弹窗确认
      guardConfirmVisible: false,//更改防护状态的弹窗控制
      startConfirmVisible: false,//更改启动状态的弹窗控制

      //负载列表
      loadBalanceColumns: [
        {
          title: this.$t('page.host.host'),
          align: 'left',
          width: 200,
          ellipsis: true,
          colKey: 'remote_ip',
        },
        {
          title: this.$t('page.host.port'),
          width: 100,
          ellipsis: true,
          colKey: 'remote_port',
        },
        {
          title: this.$t('common.remarks'),
          width: 200,
          ellipsis: true,
          colKey: 'remarks',
        },
        {
          align: 'left',
          width: 200,
          colKey: 'op',
          title: this.$t('common.op'),
        },
      ],
      //ssl证书夹
      sslConfigList: [],
      //下拉框是否可以筛选
      selectCanFilter:true,
      //当前选择的主机
      currentHostCode:"",
      guardAllConfirmVisible: false, // 一键修改所有主机防护状态的确认对话框
      guardAllStatus: "1", // 默认选择开启
    };
  },
  computed: {
    confirmBody() {
      if (this.deleteIdx > -1) {
        const {
          host
        } = this.data?.[this.deleteIdx];
        return this.$t('page.host.delete_confirm_clear_relation');
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
    this.baseUrl = getBaseUrl()
    this.fileUploadUrl = this.baseUrl + "/import"
    this.fileHeader['X-Token'] = localStorage.getItem("access_token") ? localStorage.getItem("access_token") : "" //此处换成自己获取回来的token，通常存在在cookie或者store里面
    console.log(this.baseUrl)
    if (this.$route.query != null && this.$route.query.sourcePage != "") {
      this.sourcePage = this.$route.query.sourcePage;
      if (this.sourcePage == "HomeFrist") {
        this.addFormVisible = true
      }
    }
  },

  methods: {
    // 一键修改所有主机防护状态
    handleModifyAllGuardStatus() {
      this.guardAllConfirmVisible = true;
    },

    // 确认修改所有主机防护状态
    onGuardAllStatusConfirm() {
      this.modifyAllGuardStatus(this.guardAllStatus);
      this.guardAllConfirmVisible = false;
    },

    // 取消修改所有主机防护状态
    onGuardAllStatusCancel() {
      this.guardAllConfirmVisible = false;
    },

    // 调用API修改所有主机防护状态
    modifyAllGuardStatus(status) {
      const loading = this.$loading({
        fullscreen: true,
        text: this.$t('common.loading'),
      });

      modifyAllGuardStatus({ guard_status: parseInt(status)})
        .then(response => {
          if (response.code === 0) {
            this.$message.success(this.$t('common.success'));
            this.getList('all'); // 刷新列表
          } else {
            this.$message.error(response.msg || this.$t('common.failed'));
          }
        })
        .catch(() => {
          this.$message.error(this.$t('common.failed'));
        })
        .finally(() => {
          loading.hide();
        });
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
      let that = this
      let sort_descending =that.sorts.descending?"desc":"asc"
      hostlist({
        pageSize: that.pagination.pageSize,
        pageIndex: that.pagination.current,
        sort_by: that.sorts.sortBy,
        sort_descending: sort_descending,
        filter_by:that.filters.filter_by,
        filter_value:that.filters.filter_value,
        ...that.searchformData
      }).then((res) => {
        let resdata = res
        console.log(resdata)
        if (resdata.code === 0) {

          //const { list = [] } = resdata.data.list;

          this.data = resdata.data.list??[];
          this.data_attach = []
          for (var i = 0; i < this.data.length; i++) {
            this.data[i].guard_status_visiable = false //可扩充
          }
          console.log('getList', this.data)
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
    handleClickDetail(e) {
      console.log(e)
      const {
        code
      } = e.row
      console.log('hostlist', code)
      this.$router.push({
        path: '/waf-host/wafhostdetail',
        query: {
          code: code,
        },
      },);
    },
    handleClickCopy(e) {

      console.log(e)
      const {
        code, global_host
      } = e.row
      if (global_host === 1) {
        this.$message.warning(this.$t('page.host.forbid_for_global_site'));
        return
      }
      console.log(code)
      this.addFormVisible = true
      let that = this
      getHostDetail({
        CODE: code,
      })
        .then((res) => {
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {
            let detail_data_tmp = resdata.data;
            that.formData= {
              ...detail_data_tmp
            }
            that.formData.code = uuidv4()
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
        });
    },
    handleClickEdit(e) {
      this.getSslFolderList()
      console.log(e)
      const {
        code, global_host
      } = e.row
      if (global_host === 1) {
        this.$message.warning(this.$t('page.host.forbid_for_global_site_only_change_guard_status'));
        return
      }
      console.log(code)
      this.editFormVisible = true
      this.getDetail(code)
    },
    handleAddHost() {
      this.getSslFolderList()
      this.addFormVisible = true
      this.formData.code = uuidv4()
      console.log("新增主机code信息", this.formData.code)
    },
    onSubmit(data ): void {
      console.log(data)
      let that = this
      addHost( {
        ...data.result
      }).then((res) => {
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {
            that.$message.success(resdata.msg);
            that.addFormVisible = false;
            that.pagination.current = 1

            that.formData = { ...INITIAL_DATA };
            that.getList("")
          } else {
            that.$message.warning(resdata.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
        });
    },
    onSubmitEdit(data): void {
      let that = this
      console.log('editHost',data)
      editHost( {
        ...data.result
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
        .finally(() => {
        });
    },
    onClickCloseBtn(): void {
      this.addFormVisible = false;
      this.formData = {};
      this.hostDefenseData = {
        bot: "1",
        sqli: "1",
        xss: "1",
        scan: "1",
        rce: "1",
        sensitive: "1",
        traversal: "1",
      }
      this.healthyConfigData = {
        ...INITIAL_HEALTHY
      }
      this.captchaConfigData = {
        ...INITIAL_CAPTCHA
      }
    },
    onClickCloseEditBtn(): void {
      this.editFormVisible = false;
      this.formEditData = {};
      this.hostDefenseData = {
        bot: "1",
        sqli: "1",
        xss: "1",
        scan: "1",
        rce: "1",
        sensitive: "1",
        traversal: "1",
      }
      this.healthyConfigData = {
        ...INITIAL_HEALTHY
      }
      this.captchaConfigData = {
        ...INITIAL_CAPTCHA
      }
    },
    handleClickDelete(row) {
      const {
        code, global_host
      } = row.row
      if (global_host === 1) {
        this.$message.warning("全局网站只能配置保护状态");
        //return
      }
      console.log(row)
      this.deleteIdx = row.rowIndex;
      this.confirmVisible = true;
    },
    //SSL申请
    handleClickSSLApply(row){
      const {
        code, global_host
      } = row.row
      if (global_host === 1) {
        this.$message.warning("全局网站不能申请");
      }
      this.sslAutoApplyVisible = true;
      this.currentHostCode = code
      console.log("code,global_host",code,global_host)
    },
    onConfirmDelete() {
      this.confirmVisible = false;
      console.log('delete', this.data)
      console.log('delete', this.data[this.deleteIdx])
      let {
        code
      } = this.data[this.deleteIdx]
      let that = this
      delHost({
        CODE: code,
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
        .finally(() => {
        });


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
      getHostDetail({
        CODE: id,
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
        .finally(() => {
        });
    },
    /**
     * 导出Excel数据
     */
    HandleExportExcel() {
      let that = this
      //window.open('https:\\www.baidu.com','_blank')
      //
      export_api({table_name: "hosts"}).then((res) => {
        let resdata = res
        console.log(resdata)
        let blob = new Blob([res], {type: "application/force-download"}) // Blob 对象表示一个不可变、原始数据的类文件对象
        console.log(blob);
        let fileReader = new FileReader()   // FileReader 对象允许Web应用程序异步读取存储在用户计算机上的文件的内容
        fileReader.readAsDataURL(blob)
        //开始读取指定的Blob中的内容。一旦完成，result属性中将包含一个data: URL格式的Base64字符串以表示所读取文件的内容
        fileReader.onload = (e) => {
          let a = document.createElement('a')
          a.download = `hosts.xlsx`
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
    /**
     * 导入Excel数据
     */
    HandleImportExcel() {
      this.ImportXlsxVisible = true
      this.tips = ""
      this.files= []
    },
    changeGuardStatus(e, row) {

      console.log(e, row)
      let {code} = row
      let rowIndex = this.data.findIndex(function (value, index, arr) {
        console.log("findIndex", value, index, arr)
        return value['code'] == code
      })
      console.log("rowIndex", rowIndex)
      this.guardStatusIdx = rowIndex
      console.log(e)
      this.guardConfirmVisible = true
    },
    changeStartStatus(e, row) {

      console.log(e, row)
      let {code} = row
      let rowIndex = this.data.findIndex(function (value, index, arr) {
        console.log("findIndex", value, index, arr)
        return value['code'] == code
      })
      console.log("rowIndex", rowIndex)
      this.startStatusIdx = rowIndex
      console.log(e)
      this.startConfirmVisible = true
    },
    handleFail({file}) {
      this.$message.error(`文件 ${file.name} 上传失败`);
    },
    onSuccess(e) {

      let data = JSON.parse(AesDecrypt(e.response.data))
      console.log('host upload', data)
      let lastMsg = "成功数量 :" + data.SuccessInt;
      if (data.FailInt > 0) {
        lastMsg += "失败数量 :" + data.FailInt + " 错误原因:" + data.Msg;
      }

      this.tips = lastMsg;
      this.getList("")
    },
    //跳转界面
    handleJumpOnlineUrl() {
      window.open(this.samwafglobalconfig.getOnlineUrl() + "/guide/Host.html");
    },
    //更改teatarea
    updateTextareaEdit(event) {
      //this.formEditData = event.target.value;

    },
    //更改teatarea
    updateTextareaAdd(event) {
      //this.formAddData = event.target.value;

    },

    //弹窗部分代码
    onGuardStatusConfirm(){

      let that = this
      console.log("this.guardStatusIdx", this.guardStatusIdx)
      if (this.guardStatusIdx == -1) {
        return
      }

      console.log("this.data", this.data[that.guardStatusIdx])
      let {
        code, guard_status
      } = this.data[this.guardStatusIdx]
      changeGuardStatus({
        CODE: code,
        GUARD_STATUS: guard_status == 1 ? 0 : 1,
      })
        .then((res) => {
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {
            that.getList("")
            that.$message.success(resdata.msg)
            that.guardStatusIdx = -1;
            this.guardConfirmVisible = false
          } else {
            that.$message.warning(resdata.msg);
            this.guardStatusIdx = -1;
            this.guardConfirmVisible = false

          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
        });
    },
    onGuardStatusCancel(){
      this.guardConfirmVisible = false
      this.guardStatusIdx = -1;
    },
    onStartStatusConfirm() {
      let that = this
      this.startConfirmVisible = false

      let {
        code, start_status
      } = this.data[this.startStatusIdx]
      console.log("code,start_status", code, start_status)
      changeStartStatus({
          CODE: code,
          START_STATUS: start_status === 1 ? 0 : 1,
        }
      )
        .then((res) => {
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {
            that.getList("")
            that.$message.success(resdata.msg)
            this.startStatusIdx = -1;
          } else {
            that.$message.warning(resdata.msg);
            this.startStatusIdx = -1;
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
        });
    },
    onStartStatusCancel() {
      this.startConfirmVisible = false
      this.startStatusIdx = -1;
    },
    getSslFolderList() {
      let that = this;
      sslConfigListApi({
        pageSize: 10000,
        ...that.searchformData
      })
        .then((res) => {
          let resdata = res;
          if (resdata.code === 0) {
            this.sslConfigList = resdata.data.list;
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
    handleAddNewSsl(){
      this.addSSLFormVisible = true
      this.sslformData ={...INITIAL_SSL_DATA}
    },
    handleEditSsl(source) {
      let sslConfigItem;

      if (source === "new") {
        if (this.formData.bind_ssl_id === '') {
          this.$message.warning(this.$t('page.host.bind_empty_ssl_tips'));
          return;
        }
        sslConfigItem = this.sslConfigList.find(item => item.id === this.formData.bind_ssl_id);

        if (!sslConfigItem) {
          this.$message.warning(this.$t('page.host.ssl_not_found_tips')); // 提示未找到 SSL
          return;
        }

        this.sslformEditData = { ...sslConfigItem };
        this.editSSLFormVisible = true;

      } else if (source === "edit") {
        if (this.formEditData.bind_ssl_id === '') {
          this.$message.warning(this.$t('page.host.bind_empty_ssl_tips'));
          return;
        }
        sslConfigItem = this.sslConfigList.find(item => item.id === this.formEditData.bind_ssl_id);

        if (!sslConfigItem) {
          this.$message.warning(this.$t('page.host.ssl_not_found_tips'));
          return;
        }

        this.sslformEditData = { ...sslConfigItem };
        this.editSSLFormVisible = true;
        console.log("edit ssl", this.sslformEditData);
      }
    },
    onSSLSubmit(data): void {
      let that = this;
      console.log("sslnew",data.result)
        sslConfigAddApi({
          ...data.result,
        })
          .then((res) => {
            if (res.code === 0) {
              that.getSslFolderList()
              that.$message.success('添加成功');
              that.addSSLFormVisible = false;
            }else{
              that.$message.warning(res.msg);
            }
          });
    },
    onSSLSubmitEdit(data): void {
      let that = this;
      console.log("ssledit",data.result)
      sslConfigEditApi({
        ...data.result,
      })
        .then((res) => {
          if (res.code === 0) {
            that.getSslFolderList()
            that.$message.success('编辑成功');
            that.editSSLFormVisible = false;
          }else{
            that.$message.warning(res.msg);
          }
        });
    },
    handleSslChange(selectedId) {
      // 根据选中的 ID 从 sslConfigList 中找到对应的项
      const selectedItem = this.sslConfigList.find(item => item.id === selectedId);
      if (selectedItem) {
        // 你可以在这里处理需要的逻辑，例如复制 selectedItem
        console.log('Selected SSL Item:', selectedItem);
        if(this.addFormVisible){
          this.formData.certfile = selectedItem.cert_content
          this.formData.keyfile = selectedItem.key_content
        }else if(this.editFormVisible){
          this.formEditData.certfile = selectedItem.cert_content
          this.formEditData.keyfile = selectedItem.key_content
        }
      }
    },
    /**
     * 筛选结果
     */
    onFilterChange(e){
      const filters = [];


      if (e.host) {
        filters.push({ by: "host", value: e.host });
      }
      if (e.port) {
        filters.push({ by: "port", value: e.port });
      }

      if (e.remote_ip) {
        filters.push({ by: "remote_ip", value: e.remote_ip });
      }
      if (e.remote_port) {
        filters.push({ by: "remote_port", value: e.remote_port });
      }
      if (e.remarks) {
        filters.push({ by: "remarks", value: e.remarks });
      }

      // 将 filters 数组中的 by 和 value 属性分别拼接到 filter_by 和 filter_value 字符串中
      this.filters.filter_by = filters.map(f => f.by).join("|");
      this.filters.filter_value = filters.map(f => f.value).join("|");

      this.getList("");
    },
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
    //end method
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

.t-button + .t-button {
  margin-left: @spacer;
}
</style>
