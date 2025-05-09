<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAdd" theme="success"> {{ $t('common.new') }} </t-button>
          <span v-if="srcHostCode!=''"> {{host_dic[srcHostCode]}} </span>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="300" layout="inline" colon :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.sslorder.label_apply_domain')" name="apply_domain">
              <t-input v-model="searchformData.apply_domain" class="search-input" clearable></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <t-alert theme="info" :message="$t('page.sslorder.alert_message')" close>
        <template #operation>
          <span @click="handleJumpOnlineUrl">{{ $t('common.online_document') }}</span>
        </template>
      </t-alert>
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
                 :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
                 @page-change="rehandlePageChange"
                 :headerAffixedTop="true" >

          <template #host_code="{ row }">
            <span> {{host_dic[row.host_code]}}</span>
          </template>
          <template #apply_status="{ row }">
            <p>
              {{
                sslorder_status_type.find(option => option.value === row.apply_status)?.label || row.apply_status
              }}
            </p>
          </template>
          <template #apply_method="{ row }">
            <p>
              {{
                sslorder_apply_method_type.find(option => option.value === row.apply_method)?.label || row.apply_method
              }}
            </p>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.renew') }}</a>
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
          <t-form-item :label="$t('page.sslorder.label_website')" name="host_code">
            <t-select v-model="formData.host_code" clearable :style="{ width: '480px' }" @change="changeHostCode">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item"
                        :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.sslorder.label_apply_platform')" name="apply_platform">
            <t-select v-model="formData.apply_platform" clearable :style="{ width: '480px' }">
              <t-option v-for="item in sslorder_platform_type" :value="item.value" :label="`${item.label}`">
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.sslorder.label_apply_method')" name="apply_method">
            <t-select v-model="formData.apply_method" clearable :style="{ width: '480px' }">
              <t-option v-for="item in sslorder_apply_method_type" :value="item.value" :label="`${item.label}`">
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item v-if="formData.apply_method === 'dns01'" :label="$t('page.sslorder.label_apply_dns')" name="apply_dns">
            <t-select v-model="formData.apply_dns" clearable :style="{ width: '480px' }">
              <t-option v-for="item in sslorder_apply_dns_type" :value="item.value" :label="`${item.label}`">
              </t-option>
            </t-select>
          </t-form-item>
          
          <!-- DNS服务商密钥配置信息 -->
          <template v-if="formData.apply_method === 'dns01' && formData.apply_dns">
            <t-form-item v-for="(item, index) in dns_env[formData.apply_dns]" :key="index" 
                        :label="item.label">
              <div style="display: flex; align-items: center;">
                <t-tag theme="success" v-if="hasPrivateKey(item.value)">
                  {{ $t('page.sslorder.key_configured') }}
                </t-tag>
                <t-tag theme="warning" v-else>
                  {{ $t('page.sslorder.key_not_configured') }}
                </t-tag>
                <t-button theme="primary" variant="text" style="margin-left: 10px;" @click="handlePrivateInfo(item.value, hasPrivateKey(item.value) ? 'edit' : 'add')">
                  {{ hasPrivateKey(item.value) ? $t('common.edit') : $t('common.add') }}
                </t-button>
              </div>
            </t-form-item>
          </template>
          <t-form-item :label="$t('page.sslorder.label_apply_email')" name="apply_email">
            <t-input :style="{ width: '480px' }" v-model="formData.apply_email" ></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.sslorder.label_apply_domain')" name="apply_domain">
            <t-textarea v-model="formData.apply_domain" :style="{ width: '480px' }" rows="4"></t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>
    <t-dialog :header="$t('common.renew')" :visible.sync="editFormVisible" :width="750" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="form" :rules="rules" @submit="onSubmitEdit" :labelWidth="220">
          <t-form-item :label="$t('page.sslorder.label_website')" name="host_code">
            <t-select v-model="formEditData.host_code" clearable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item"
                        :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.sslorder.label_apply_platform')" name="apply_platform">
            <t-select v-model="formEditData.apply_platform" clearable :style="{ width: '480px' }">
              <t-option v-for="item in sslorder_platform_type" :value="item.value" :label="`${item.label}`">
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.sslorder.label_apply_method')" name="apply_method">
            <t-select v-model="formEditData.apply_method" clearable :style="{ width: '480px' }">
              <t-option v-for="item in sslorder_apply_method_type" :value="item.value" :label="`${item.label}`">
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item v-if="formEditData.apply_method === 'dns01'" :label="$t('page.sslorder.label_apply_dns')" name="apply_dns">
            <t-select v-model="formEditData.apply_dns" clearable :style="{ width: '480px' }">
              <t-option v-for="item in sslorder_apply_dns_type" :value="item.value" :label="`${item.label}`">
              </t-option>
            </t-select>
          </t-form-item>
          <!-- DNS服务商密钥配置信息 -->
          <template v-if="formEditData.apply_method === 'dns01' && formEditData.apply_dns">
            <t-form-item v-for="(item, index) in dns_env[formEditData.apply_dns]" :key="index" 
                        :label="item.label">
              <div style="display: flex; align-items: center;">
                <t-tag theme="success" v-if="hasPrivateKey(item.value)">
                  {{ $t('page.sslorder.key_configured') }}
                </t-tag>
                <t-tag theme="warning" v-else>
                  {{ $t('page.sslorder.key_not_configured') }}
                </t-tag>
                <t-button theme="primary" variant="text" style="margin-left: 10px;" @click="handlePrivateInfo(item.value, hasPrivateKey(item.value) ? 'edit' : 'add')">
                  {{ hasPrivateKey(item.value) ? $t('common.edit') : $t('common.add') }}
                </t-button>
              </div>
            </t-form-item>
          </template>
          <t-form-item :label="$t('page.sslorder.label_apply_email')" name="apply_email">
            <t-input :style="{ width: '480px' }" v-model="formEditData.apply_email" ></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.sslorder.label_apply_domain')" name="apply_domain">
            <t-textarea v-model="formEditData.apply_domain" :style="{ width: '480px' }" rows="4"></t-textarea>
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

    <!-- 添加/编辑私钥信息对话框 -->
    <t-dialog :header="privateFormMode === 'add' ? $t('common.add') : $t('common.edit')" :visible.sync="privateFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="privateFormData" ref="privateForm" :rules="privateRules" @submit="onPrivateSubmit" :labelWidth="200">
          <t-form-item :label="$t('page.private_info.private_key')" name="private_key">
            <t-input v-model="privateFormData.private_key" :style="{ width: '480px' }" :disabled="privateFormMode === 'edit'"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.private_info.private_value')" name="private_value">
            <t-input v-model="privateFormData.private_value" :style="{ width: '480px' }"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.private_info.remarks')" name="remarks">
            <t-input v-model="privateFormData.remarks" :style="{ width: '480px' }"></t-input>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="privateFormVisible = false">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
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
  sslOrderDetailApi,sslOrderAddApi,sslOrderDelApi,sslOrderEditApi,sslOrderListApi
} from '@/apis/sslorder';

import {
    wafPrivateInfoListApi,wafPrivateInfoDelApi,wafPrivateInfoEditApi,wafPrivateInfoAddApi,wafPrivateInfoDetailApi
  } from '@/apis/private_info.ts';
import {
  allhost,alldomainbyhostcode
} from '@/apis/host';

const INITIAL_DATA = {
  host_code:"",
  apply_platform:"letsencrypt",
  apply_method:"http01",
  apply_dns:"",
  apply_email:"",
  apply_domain:"",
  apply_status:"submitted",
};

export default Vue.extend({
  name: 'SslOrderList',
  components: {
    SearchIcon,
    Trend,
  },
  props: {
    //原主机码
    srcHostCode:{
      type: String,
      default: ''
    }
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
        host_code: [{
          required: true,
          message: this.$t('common.placeholder')+this.$t('page.sslorder.label_website'),
          type: 'error'
        }],
        apply_email: [
          {
            required: true,
            message: this.$t('common.select_placeholder') + this.$t('page.sslorder.label_apply_email'),
            type: 'error'
          }
        ],
        apply_domain: [
          {
            required: true,
            message: this.$t('common.select_placeholder') + this.$t('page.sslorder.label_apply_domain'),
            type: 'error'
          }
        ]
      },
      dataLoading: false,
      data: [], // 列表数据信息
      private_data:[],// 私有信息

      // 私钥信息表单
      privateFormVisible: false,
      privateFormMode: 'add', // 'add' 或 'edit'
      privateFormData: {
        private_key: '',
        private_value: '',
        remarks: ''
      },
      privateRules: {
        private_key: [{
          required: true,
          message: this.$t('common.placeholder') + this.$t('page.private_info.label_private_key'),
          type: 'error'
        }],
        private_value: [{
          required: true,
          message: this.$t('common.placeholder') + this.$t('page.private_info.label_private_value'),
          type: 'error'
        }]
      }, 
      selectedRowKeys: [],
      columns: [
        {
          align: 'left',
          width: 200,
          colKey: 'op',
          title: this.$t('common.op'),
        },

        {
          title: this.$t('page.sslorder.label_website'),
          align: 'left',
          width: 250,
          ellipsis: true,
          colKey: 'host_code',
        },
        {
          title: this.$t('page.sslorder.label_apply_status'),
          align: 'left',
          width: 100,
          ellipsis: true,
          colKey: 'apply_status',
        },
        {
          title: this.$t('page.sslorder.label_result_error'),
          align: 'left',
          width: 100,
          ellipsis: true,
          colKey: 'result_error',
        },
        {
          title: this.$t('page.sslorder.label_apply_platform'),
          align: 'left',
          width: 250,
          ellipsis: true,
          colKey: 'apply_platform',
        },
        {
          title: this.$t('page.sslorder.label_apply_method'),
          width: 200,
          ellipsis: true,
          colKey: 'apply_method',
        },
        {
          title: this.$t('page.sslorder.label_apply_dns'),
          width: 200,
          ellipsis: true,
          colKey: 'apply_dns',
        },
        {
          title: this.$t('page.sslorder.label_apply_email'),
          width: 200,
          ellipsis: true,
          colKey: 'apply_email',
        },
        {
          title: this.$t('page.sslorder.label_apply_domain'),
          width: 200,
          ellipsis: true,
          colKey: 'apply_domain',
        },
        {
          title: this.$t('common.create_time'),
          width: 200,
          ellipsis: true,
          colKey: 'create_time',
          sorter: true
        },
        {
          title: "id",
          align: 'left',
          width: 250,
          ellipsis: true,
          colKey: 'id',
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
        apply_domain: '',
        host_code:'',
      },
      deleteIdx: -1,
      //主机字典
      host_dic:{},
      //订单状态
      sslorder_status_type: [
        {
          label: this.$t('page.sslorder.sslorder_status_type.submitted'),
          value: 'submitted'
        },{
          label: this.$t('page.sslorder.sslorder_status_type.applying'),
          value: 'applying'
        },
        {
          label: this.$t('page.sslorder.sslorder_status_type.fail'),
          value: 'fail'
        },
        {
          label: this.$t('page.sslorder.sslorder_status_type.success'),
          value: 'success'
        },
        {
          label: this.$t('page.sslorder.sslorder_status_type.renewed'),
          value: 'renewed'
        },
        {
          label: this.$t('page.sslorder.sslorder_status_type.expired'),
          value: 'expired'
        },
      ],
      //平台类型
      sslorder_platform_type: [
        {
          label: this.$t('page.sslorder.sslorder_platform_type.letsencrypt'),
          value: 'letsencrypt'
        },
      ],
      //申请方式
      sslorder_apply_method_type: [
        {
          label: this.$t('page.sslorder.sslorder_apply_method_type.http01'),
          value: 'http01'
        },
        {
          label: this.$t('page.sslorder.sslorder_apply_method_type.dns01'),
          value: 'dns01'
        },
      ],
      sslorder_apply_dns_type: [
        {
          label: this.$t('page.sslorder.sslorder_apply_dns_type.aliyun'),
          value: 'alidns'
        },
        {
          label: this.$t('page.sslorder.sslorder_apply_dns_type.huaweicloud'),
          value: 'huaweicloud'
        },
        {
          label: this.$t('page.sslorder.sslorder_apply_dns_type.tencentcloud'),
          value: 'tencentcloud'
        },
        {
          label: this.$t('page.sslorder.sslorder_apply_dns_type.cloudflare'),
          value: 'cloudflare'
        },
       
      ],
      dns_env:{
        alidns: [
          {
            value: 'ALICLOUD_ACCESS_KEY',
            label: this.$t('page.sslorder.sslorder_apply_dns_config.alidns.access_key'),
          },
          {
            value: 'ALICLOUD_SECRET_KEY',
            label: this.$t('page.sslorder.sslorder_apply_dns_config.alidns.secret_key'),
          },
          {
            value: 'ALICLOUD_SECURITY_TOKEN',
            label: this.$t('page.sslorder.sslorder_apply_dns_config.alidns.security_token'),
          }
        ], 
        huaweicloud: [
          {
            value: 'HUAWEICLOUD_ACCESS_KEY_ID',
            label: this.$t('page.sslorder.sslorder_apply_dns_config.huaweicloud.access_key'),
          },
          {
            value: 'HUAWEICLOUD_SECRET_ACCESS_KEY',
            label: this.$t('page.sslorder.sslorder_apply_dns_config.huaweicloud.secret_key'),
          },
          {
            value: 'HUAWEICLOUD_REGION',
            label: this.$t('page.sslorder.sslorder_apply_dns_config.huaweicloud.region'),
          }
        ],
        tencentcloud: [
          {
            value: 'TENCENTCLOUD_SECRET_ID',
            label: this.$t('page.sslorder.sslorder_apply_dns_config.tencentcloud.secret_id'),
          },{
            value: 'TENCENTCLOUD_SECRET_KEY',
            label: this.$t('page.sslorder.sslorder_apply_dns_config.tencentcloud.secret_key'),
          }
        ],
        cloudflare: [
          {
            value: 'CF_DNS_API_TOKEN',
            label: this.$t('page.sslorder.sslorder_apply_dns_config.cloudflare.dns_api_token'),
          }
        ]
          
      },
      //END Data
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
  created() {
  },
  mounted() {
    this.loadHostList().then(() => {
      this.getList("");
      this.getPrivateList("")
    });
  },
  methods: {
     // 处理私钥信息
     handlePrivateInfo(keyName, action) {
      console.log(`处理私钥信息: ${keyName}, 操作类型: ${action}`);
      
      if (action === 'edit') {
        // 编辑现有私钥
        const privateInfo = this.private_data.find(item => item.private_key === keyName);
        if (privateInfo) {
          this.privateFormMode = 'edit';
          this.privateFormData = { ...privateInfo };
          this.privateFormVisible = true;
        } else {
          this.$message.warning(this.$t('common.data_not_found'));
        }
      } else {
        // 添加新私钥
        this.privateFormMode = 'add';
        this.privateFormData = {
          private_key: keyName,
          private_value: '',
          remarks: ''
        };
        this.privateFormVisible = true;
      }
    },
    
    // 提交私钥信息表单
    onPrivateSubmit({ result, firstError }) {
      let that = this;
      if (!firstError) {
        if (this.privateFormMode === 'add') {
          // 添加新私钥
          wafPrivateInfoAddApi({...this.privateFormData})
            .then((res) => {
              if (res.code === 0) {
                that.$message.success(res.msg);
                that.privateFormVisible = false;
                // 刷新私钥列表
                that.getPrivateList("");
              } else {
                that.$message.warning(res.msg);
              }
            })
            .catch((e) => {
              console.log(e); 
            });
        } else {
          // 编辑私钥
          wafPrivateInfoEditApi({...this.privateFormData})
            .then((res) => {
              if (res.code === 0) {
                that.$message.success(res.msg);
                that.privateFormVisible = false;
                // 刷新私钥列表
                that.getPrivateList("");
              } else {
                that.$message.warning(res.msg);
              }
            })
            .catch((e) => {
              console.log(e); 
            });
        }
      } else {
        console.log('Errors: ', result);
        that.$message.warning(firstError);
      }
    },
    // 检查是否已配置特定的私有密钥
    hasPrivateKey(keyName) {
      return this.private_data.some(item => item.private_key === keyName);
    },
    getPrivateList(keyword) {
        let that = this
        wafPrivateInfoListApi( {
              pageSize: 100,
              pageIndex: 1, 
          })
          .then((res) => {
            let resdata = res
            console.log(resdata)
            if (resdata.code === 0) {

              that.private_data = resdata.data.list??[]; 
              console.log("private_data",this.private_data)
            }
          })
          .catch((e: Error) => {
            console.log(e);
          })
          .finally(() => { 
          }); 
      },
    changeHostCode(hostCode){
      console.log("changeHostCode",hostCode)
      if(hostCode!=""){
          alldomainbyhostcode({ code: hostCode})
            .then((res)=>{
              console.log("changeHostCode ",res)
              console.log("changeHostCode ",res.code===0)
              if(res.code===0){
                // 提取所有的label并过滤掉空值
                let labels = res.data
                  .map(item => item.label) // 提取所有label
                  .filter(label => label); // 过滤掉空字符串或不存在的值
                // 将所有的非空label用逗号连接起来
                let labelsString = labels.join(', ');
                this.formData.apply_domain = labelsString;
              }else{
                this.$message.warning(res.msg);
              }
            }).catch((error)=>{
              console.log(error)
          })
      }
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
                if(host_options[i].label=="全局网站:0"){
                  continue
                }
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
      that.searchformData.host_code = this.srcHostCode
      sslOrderListApi({
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
      this.formData = { ...INITIAL_DATA};
      console.log("mounted sslorder,srchostCode",this.srcHostCode)
      if(this.srcHostCode!=""){
          this.formData.host_code = this.srcHostCode;
          this.changeHostCode(this.srcHostCode)
      }
    },
    onSubmit({
               result,
               firstError
             }): void {
      let that = this;
      if (!firstError) {

        // 如果是http01方式,域名不能包含通配符
        if (this.formData.apply_method == "http01"){
           if( this.formData.apply_domain.indexOf("*")!=-1){
             that.$message.warning(that.$t('page.sslorder.error_domain_not_match_method'));
              return
           }
        }
        // 如果是dns方式,apply_dns不能为空
        if (this.formData.apply_method == "dns01") {
          if (!this.formData.apply_dns) {
            that.$message.warning(that.$t('common.select_placeholder') + that.$t('page.sslorder.label_apply_dns'));
            return
          }
        }
        sslOrderAddApi({
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
        this.formEditData.apply_status="renewed"
        sslOrderEditApi({
          ...this.formEditData,
        })
          .then((res) => {
            if (res.code === 0) {
              that.getList('');
              that.$message.success('已发起续期');
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
      sslOrderDelApi({
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
    onCancel() {
      this.confirmVisible = false;
      this.deleteIdx = -1;
    },
    handleJumpOnlineUrl() {
      window.open(this.samwafglobalconfig.getOnlineUrl()+"/guide/SSLOrder.html");
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
