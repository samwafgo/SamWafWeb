<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">

        </div>
        <div class="right-operation-container">

        </div>
      </t-row>
      <t-alert theme="info" :message="$t('page.otp.alert_message')" close>
        <template #operation>
          <span @click="handleJumpOnlineUrl">{{ $t('common.online_document') }}</span>
        </template>
      </t-alert>
      <div class="table-container">
        <t-form v-if="!isBind" :data="formData" ref="form" :rules="rules" @submit="onBindSubmit" :labelWidth="200">
          <t-form-item style="text-align: center">
            <qrcode-vue :value="formData.url" :size="qrSize" level="H" />
          </t-form-item>
          <t-form-item :label="$t('page.otp.secret_code')" name="secret_code">
            <t-input :style="{ width: '480px' }" v-model="formData.secret_code" ></t-input>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button theme="primary" type="submit">{{ $t('page.otp.bind') }}</t-button>
          </t-form-item>
        </t-form>

        <t-alert  v-if="isBind"  theme="success" close :max-line="1">
          <span>{{ $t('page.otp.bind_success_tip') }}</span>
          <t-form :data="formBindData" ref="unBindForm" :rules="rules" @submit="onUnBindSubmit" :labelWidth="200">
            <t-form-item :label="$t('page.otp.secret_code')" name="secret_code">
              <t-input :style="{ width: '480px' }" v-model="formBindData.secret_code" ></t-input>
            </t-form-item>
            <t-form-item style="float: right">
              <t-button theme="primary" type="submit">{{ $t('page.otp.unbind') }}</t-button>
            </t-form-item>
          </t-form>
        </t-alert>


      </div>
      <div>
      <router-view></router-view>
      </div>
    </t-card>
  </div>
</template>
<script lang="ts">
  import Vue from 'vue';
  import QrcodeVue from 'qrcode.vue'

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
    wafOtpInitApi,wafOtpBindApi,wafOtpUnBindApi
  } from '@/apis/otp.ts';

  const INITIAL_DATA = {
    user_name:'',
    is_enable_otp:'',
    url:'',
    secret:'',
    remarks:'',

  };
  export default Vue.extend({
    name: 'OtpBase',
    components: {
      SearchIcon,
      Trend,
      QrcodeVue
    },
    data() {
      return {
        addFormVisible: false,
        editFormVisible: false,
        guardVisible: false,
        confirmVisible: false,
        formData: {
          user_name: "",
          url: "",
          secret: "",
          remarks: "",
          secret_code: ""
        },
        formBindData: {
          id: "",
          secret_code: ""
        },
        rules: {
          secret_code: [{
              required: true,
              message: this.$t('common.placeholder')+this.$t('page.otp.secret_code'),
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
        host_dic:{},

        //是否是绑定
        isBind:false,
        qrSize: 300,
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
      this.loadInitData().then(() => {

      });
    },

    methods: {
      loadInitData() {
        return new Promise((resolve, reject) => {
          wafOtpInitApi()
            .then((res) => {
              let resdata = res;
              console.log('loadInitData',resdata);
              if (resdata.code === 0) {
                if(resdata.data.id===undefined){
                  this.isBind = false
                  this.formData.secret_code = ""
                  this.formData = resdata.data;
                }else{
                  this.isBind = true
                  this.formBindData.secret_code = ""
                  this.formBindData.id= resdata.data.id
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
      onBindSubmit({
        result,
        firstError
      }): void {
        let that = this
        if (!firstError) {

          let postdata = {
            ...that.formData
          }
          wafOtpBindApi({...postdata})
            .then((res) => {
              let resdata = res
              console.log(resdata)
              if (resdata.code === 0) {
                that.$message.success(resdata.msg);
                that.isBind = true;
                that.loadInitData().then(() => {

                });
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
      onUnBindSubmit({
        result,
        firstError
      }): void {
        let that = this
        if (!firstError) {

          let postdata = {
            ...that.formBindData
          }
          console.log('unbind',postdata)
          wafOtpUnBindApi({...postdata})
            .then((res) => {
              let resdata = res
              console.log(resdata)
              if (resdata.code === 0) {
                that.$message.success(resdata.msg);
                that.isBind = false;
                that.loadInitData().then(() => {

                });
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
      onCancel() {
        this.resetIdx();
      },

      handleJumpOnlineUrl(){
        window.open(this.samwafglobalconfig.getOnlineUrl()+"/guide/Otp.html");
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
