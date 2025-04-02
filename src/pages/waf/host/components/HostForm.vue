<template>
    <div class="host-form">
      <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="230">
        <t-tabs :defaultValue="1">
          <t-tab-panel :value="1" :label="$t('page.host.tab_base')">
            <t-form-item :label="$t('page.host.website')" name="host">
              <t-tooltip class="placement top center" :content="$t('page.host.host_tips')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-input :style="{ width: '480px' }" v-model="formData.host" :placeholder="$t('common.placeholder')" :disabled="isEdit"></t-input>
              </t-tooltip>
            </t-form-item>
            <t-form-item :label="$t('page.host.port')" name="port">
              <t-tooltip class="placement top center"
                       :content="$t('page.host.port_tips')"
                       placement="top" :overlay-style="{ width: '200px' }" show-arrow>
                <t-input-number :style="{ width: '150px' }" v-model="formData.port" :placeholder="$t('page.host.port_placeholder')">
                </t-input-number>
              </t-tooltip>
              <t-tooltip class="placement top center"
                       :content="$t('page.host.bind_more_port_tips')"
                       placement="top" :overlay-style="{ width: '200px' }" show-arrow>
                {{ $t('page.host.bind_more_port')  }} <t-input  :style="{ width: '200px' }" v-model="formData.bind_more_port" :placeholder="$t('page.host.bind_more_port_placeholder')"></t-input>
              </t-tooltip>
            </t-form-item>
            <t-form-item :label="$t('page.host.ssl')" name="ssl">
              <t-tooltip class="placement top center" :content="$t('page.host.ssl_tips')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-radio-group v-model="formData.ssl">
                  <t-radio value="0">{{ $t('page.host.ssl_option_no') }}</t-radio>
                  <t-radio value="1">{{ $t('page.host.ssl_option_yes') }}</t-radio>
                </t-radio-group>
              </t-tooltip>
            </t-form-item>
            <t-form-item :label="$t('page.host.unrestricted_port.label_unrestricted_port_is_enable')" name="unrestricted_port">
              <t-tooltip class="placement top center" :content="$t('page.host.unrestricted_port.unrestricted_port_tip')" placement="top"
                         :overlay-style="{ width: '200px' }" show-arrow>
                <t-radio-group v-model="formData.unrestricted_port">
                  <t-radio value="0">{{ $t('page.host.unrestricted_port.label_unrestricted_port_is_enable_on') }}</t-radio>
                  <t-radio value="1">{{ $t('page.host.unrestricted_port.label_unrestricted_port_is_enable_off') }}</t-radio>
                </t-radio-group>
              </t-tooltip>
            </t-form-item>
            <t-form-item :label="$t('page.host.ssl_folder')" name="bind_ssl_id" v-if="formData.ssl=='1'">
              <div style="display: flex; align-items: center;">
                <t-select @change="handleSslChange" :filterable="selectCanFilter" v-model="formData.bind_ssl_id" :placeholder="$t('common.select_placeholder')+$t('page.host.ssl_folder')" style="flex-grow: 1;">
                  <t-option value="" :label="$t('common.select_placeholder')+$t('page.host.ssl_folder')" key=""></t-option>
                  <t-option v-for="item in sslConfigList" :value="item.id" :label="`${item.domains} (${item.valid_to})`" :key="item.id"></t-option>
                </t-select>

                <t-button @click="$emit('add-ssl')" style="margin-left: 10px;">{{$t('page.host.add_new_ssl')}}</t-button>
                <t-button @click="$emit('edit-ssl')" style="margin-left: 10px;">{{$t('page.host.edit_ssl')}}</t-button>
              </div>
            </t-form-item>

            <t-form-item :label="$t('page.host.start_status')" name="start_status">
              <t-tooltip class="placement top center" :content="$t('page.host.start_status_content')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-radio-group v-model="formData.start_status">
                  <t-radio value="0">{{ $t('page.host.auto_start_on') }}</t-radio>
                  <t-radio value="1">{{ $t('page.host.auto_start_off') }}</t-radio>
                </t-radio-group>
              </t-tooltip>
            </t-form-item>

            <t-form-item :label="$t('page.host.auto_jump_https.label_autu_jump_https')" name="auto_jump_https" v-if="formData.ssl=='1'">
              <t-radio-group v-model="formData.auto_jump_https">
                <t-radio value="0">{{ $t('page.host.auto_jump_https.label_autu_jump_https_off') }}</t-radio>
                <t-radio value="1">{{ $t('page.host.auto_jump_https.label_autu_jump_https_on') }}</t-radio>
              </t-radio-group>
            </t-form-item>



            <t-form-item :label="$t('page.host.keyfile')" name="keyfile" v-if="formData.ssl=='1'">
              <t-tooltip class="placement top center"
                       :content="$t('page.host.keyfile_content')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-textarea :style="{ width: '480px' }" v-model="formData.keyfile" :placeholder="$t('common.placeholder')" name="keyfile">
                </t-textarea>
              </t-tooltip>
            </t-form-item>
            <t-form-item :label="$t('page.host.certfile')" name="certfile" v-if="formData.ssl=='1'">
              <t-tooltip class="placement top center"
                       :content="$t('page.host.certfile_content')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-textarea :style="{ width: '480px' }" v-model="formData.certfile" :placeholder="$t('common.placeholder')"
                          name="certfile">
                </t-textarea>
              </t-tooltip>
            </t-form-item>

            <t-form-item :label="$t('page.host.loadbalance.label_loadbalance_is_enable')" name="is_enable_load_balance">
              <t-radio-group v-model="formData.is_enable_load_balance">
                <t-radio value="0">{{ $t('page.host.loadbalance.label_is_enable_load_balance_off') }} </t-radio>
                <t-radio value="1">{{ $t('page.host.loadbalance.label_is_enable_load_balance_on') }}</t-radio>
              </t-radio-group>
            </t-form-item>

            <t-form-item :label="$t('page.host.loadbalance.label_loadbalance_type')" name="load_balance_stage" v-if="formData.is_enable_load_balance=='1'">
              <t-radio-group v-model="formData.load_balance_stage">
                <t-radio value="1">{{ $t('page.host.loadbalance.label_loadbalance_type_weight_round_robin') }} </t-radio>
                <t-radio value="2">{{ $t('page.host.loadbalance.label_loadbalance_type_ip_hash') }}</t-radio>
              </t-radio-group>
            </t-form-item>

            <t-form-item name="loadbalance" v-if="formData.is_enable_load_balance=='1'">
              <load-balance :propHostCode="formData.code"></load-balance>
            </t-form-item>

            <t-form-item :label="$t('page.host.remote_host')" name="remote_host">
              <t-tooltip
                class="placement top center"
                :content="$t('page.host.remote_host_content')"
                placement="top"
                :overlay-style="{ width: '200px' }"
                show-arrow>
                <t-input :style="{ width: '480px' }" v-model="formData.remote_host" :placeholder="$t('common.placeholder')+$t('page.host.remote_host')"></t-input>
              </t-tooltip>
            </t-form-item>

            <t-form-item :label="$t('page.host.is_trans_back_domain')" name="is_trans_back_domain">
              <t-tooltip
                class="placement top center"
                :content="$t('page.host.is_trans_back_domain_content')"
                placement="top"
                :overlay-style="{ width: '200px' }"
                show-arrow>
                <t-radio-group v-model="formData.is_trans_back_domain">
                  <t-radio value="0">{{ $t('common.off') }}</t-radio>
                  <t-radio value="1">{{ $t('common.on') }}</t-radio>
                </t-radio-group>
              </t-tooltip>
            </t-form-item>

            <t-form-item :label="$t('page.host.remote_ip')" name="remote_ip" v-if="formData.is_enable_load_balance!='1'">
              <t-tooltip class="placement top center" :content="$t('page.host.remote_ip_content')"
                       placement="top" :overlay-style="{ width: '200px' }" show-arrow>
                <t-input :style="{ width: '480px' }" v-model="formData.remote_ip" :placeholder="$t('common.placeholder')+$t('page.host.remote_ip')"></t-input>
              </t-tooltip>
            </t-form-item>

            <t-form-item :label="$t('page.host.remote_port')" name="remote_port" v-if="formData.is_enable_load_balance!='1'">
              <t-tooltip class="placement top center"
                       :content="$t('page.host.remote_port_content')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-input-number :style="{ width: '150px' }" v-model="formData.remote_port"
                              :placeholder="$t('page.host.port_placeholder')">
                </t-input-number>
              </t-tooltip>
            </t-form-item>


            <t-form-item :label="$t('common.remarks')" name="remarks">
              <t-textarea :style="{ width: '480px' }" v-model="formData.remarks" :placeholder="$t('common.placeholder_content')" name="remarks">
              </t-textarea>
            </t-form-item>
          </t-tab-panel>

          <t-tab-panel :value="2">
            <template #label>
              {{$t('page.host.tab_more_domain')}}
            </template>
            <t-form-item :label="$t('page.host.more_domain')" name="bind_more_host">
              <t-tooltip class="placement top center" :content="$t('page.host.more_domain_tips')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-textarea :style="{ width: '480px' }" v-model="formData.bind_more_host" :placeholder="$t('common.placeholder')"
                          name="bind_more_host">
                </t-textarea>
              </t-tooltip>
            </t-form-item>
          </t-tab-panel>

          <t-tab-panel :value="3">
            <template #label>
              <file-safety-icon style="margin-right: 4px;color:red"/>
              {{$t('page.host.tab_engine')}}
            </template>

            <t-form-item :label="$t('page.host.bot_detection')">
              <t-tooltip class="placement top center" :content="$t('page.host.bot_detection_tips')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-radio-group v-model="hostDefenseData.bot">
                  <t-radio value="0">{{$t('common.off')}}</t-radio>
                  <t-radio value="1">{{$t('common.on')}}</t-radio>
                </t-radio-group>
              </t-tooltip>
            </t-form-item>

            <t-form-item :label="$t('page.host.sql_injection_detection')">
              <t-tooltip class="placement top center" :content="$t('page.host.sql_injection_detection_tips')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-radio-group v-model="hostDefenseData.sqli">
                  <t-radio value="0">{{$t('common.off')}}</t-radio>
                  <t-radio value="1">{{$t('common.on')}}</t-radio>
                </t-radio-group>
              </t-tooltip>
            </t-form-item>

            <t-form-item :label="$t('page.host.xss_detection')">
              <t-tooltip class="placement top center" :content="$t('page.host.xss_detection_tips')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-radio-group v-model="hostDefenseData.xss">
                  <t-radio value="0">{{$t('common.off')}}</t-radio>
                  <t-radio value="1">{{$t('common.on')}}</t-radio>
                </t-radio-group>
              </t-tooltip>
            </t-form-item>

            <t-form-item :label="$t('page.host.scan_detection')">
              <t-tooltip class="placement top center" :content="$t('page.host.scan_detection_tips')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-radio-group v-model="hostDefenseData.scan">
                  <t-radio value="0">{{$t('common.off')}}</t-radio>
                  <t-radio value="1">{{$t('common.on')}}</t-radio>
                </t-radio-group>
              </t-tooltip>
            </t-form-item>

            <t-form-item :label="$t('page.host.rce_detection')">
              <t-tooltip class="placement top center" :content="$t('page.host.rce_detection_tips')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-radio-group v-model="hostDefenseData.rce">
                  <t-radio value="0">{{$t('common.off')}}</t-radio>
                  <t-radio value="1">{{$t('common.on')}}</t-radio>
                </t-radio-group>
              </t-tooltip>
            </t-form-item>

            <t-form-item :label="$t('page.host.sensitive_detection')">
              <t-tooltip class="placement top center" :content="$t('page.host.sensitive_detection_tips')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-radio-group v-model="hostDefenseData.sensitive">
                  <t-radio value="0">{{$t('common.off')}}</t-radio>
                  <t-radio value="1">{{$t('common.on')}}</t-radio>
                </t-radio-group>
              </t-tooltip>
            </t-form-item>

            <t-form-item :label="$t('page.host.dir_traversal_detection')">
              <t-tooltip class="placement top center" :content="$t('page.host.dir_traversal_detection_tips')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-radio-group v-model="hostDefenseData.traversal">
                  <t-radio value="0">{{$t('common.off')}}</t-radio>
                  <t-radio value="1">{{$t('common.on')}}</t-radio>
                </t-radio-group>
              </t-tooltip>
            </t-form-item>
          </t-tab-panel>

          <t-tab-panel :value="4">
            <template #label>
              {{$t('page.host.tab_other')}}
            </template>
            <t-form-item :label="$t('page.host.exclude_url_log')" name="exclude_url_log">
              <t-tooltip class="placement top center" :content="$t('page.host.exclude_url_log_tips')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-textarea :style="{ width: '480px' }" v-model="formData.exclude_url_log" :placeholder="$t('page.host.exclude_url_log_tips')"
                          name="exclude_url_log">
                </t-textarea>
              </t-tooltip>
            </t-form-item>
            <t-form-item :label="$t('page.host.insecure_skip_verify')" name="insecure_skip_verify">
              <t-tooltip class="placement top center"
                         :content="$t('page.host.insecure_skip_verify_tips')" placement="top"
                         :overlay-style="{ width: '200px' }" show-arrow>
                <t-radio-group v-model="formData.insecure_skip_verify">
                  <t-radio value="0">{{ $t('common.off') }}</t-radio>
                  <t-radio value="1">{{ $t('common.on') }}</t-radio>
                </t-radio-group>
              </t-tooltip>
            </t-form-item>
            <t-form-item :label="$t('page.host.response_time_out')" name="response_time_out">
              <t-tooltip class="placement top center"
                         :content="$t('page.host.response_time_out_tips')" placement="top"
                         :overlay-style="{ width: '200px' }" show-arrow>
                <t-input-number :style="{ width: '150px' }" v-model="formData.response_time_out" >
                </t-input-number>
              </t-tooltip>
            </t-form-item>
          </t-tab-panel>

          <t-tab-panel :value="5">
            <template #label>
              {{$t('page.host.tab_password')}}
            </template>
            <t-form-item :label="$t('page.host.is_enable_http_auth_base')" name="is_enable_http_auth_base">
              <t-tooltip class="placement top center" :content="$t('page.host.is_enable_http_auth_base_tips')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-radio-group v-model="formData.is_enable_http_auth_base">
                  <t-radio value="0">{{$t('common.off')}}</t-radio>
                  <t-radio value="1">{{$t('common.on')}}</t-radio>
                </t-radio-group>
              </t-tooltip>
            </t-form-item>
            <t-form-item v-if="formData.is_enable_http_auth_base === '1'">
              <http-auth-base :propHostCode="formData.code"></http-auth-base>
            </t-form-item>
          </t-tab-panel>

          <t-tab-panel :value="6">
            <template #label>
              <t-icon name="health" style="margin-right: 4px;color:#00a870"/>
              {{$t('page.host.tab_health_check')}}
            </template>
            <healthy-config :healthy-config="healthyConfigData" @update="val => healthyConfigData = val"></healthy-config>
          </t-tab-panel>

          <t-tab-panel :value="7">
            <template #label>
              <t-icon name="lock-on" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_captcha')}}
            </template>
            <t-alert theme="warning" v-if="captchaConfigData.is_enable_captcha == '1'">
              <template #message>{{ $t('page.host.captcha.alert') }} </template>
            </t-alert>
            <captcha-config :captcha-config="captchaConfigData" @update="val => captchaConfigData = val"></captcha-config>
          </t-tab-panel>
        </t-tabs>

        <t-form-item style="float: right;margin-top:5px">
          <t-button variant="outline" @click="$emit('close')">{{ $t('common.close') }}</t-button>
          <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
        </t-form-item>
      </t-form>
    </div>
  </template>

  <script lang="ts">
  import Vue from 'vue';
  import { FileSafetyIcon } from 'tdesign-icons-vue';
  import LoadBalance from "../../loadbalance/index.vue";
  import HttpAuthBase from "../../http_auth_base/index.vue";
  import HealthyConfig from '../components/HealthyConfig.vue';
  import CaptchaConfig from '../components/CaptchaConfig.vue';
  import { INITIAL_HEALTHY, INITIAL_CAPTCHA } from '../constants';
  import {getOrDefault} from '@/utils/usuallytool';
  export default Vue.extend({
    name: 'HostForm',
    components: {
      FileSafetyIcon,
      LoadBalance,
      HttpAuthBase,
      HealthyConfig,
      CaptchaConfig,
    },
    props: {
      // 表单数据
      value: {
        type: Object,
        required: true
      },
      // 是否为编辑模式
      isEdit: {
        type: Boolean,
        default: false
      },
      // SSL配置列表
      sslConfigList: {
        type: Array,
        default: () => []
      },
      // 下拉框是否可筛选
      selectCanFilter: {
        type: Boolean,
        default: true
      },
      // 表单验证规则
      formRules: {
        type: Object,
        default: () => ({})
      },
      // 在线文档链接
      hostAddUrl: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        formData: JSON.parse(JSON.stringify(this.value)),
        // 主机防御细节
        hostDefenseData: {
          bot: "1",
          sqli: "1",
          xss: "1",
          scan: "1",
          rce: "1",
          sensitive: "1",
          traversal: "1",
        },
        // 健康度检测配置
        healthyConfigData: { ...INITIAL_HEALTHY },
        // 验证码配置
        captchaConfigData: { ...INITIAL_CAPTCHA },
        rules: {
          host: [{required: true,message: this.$t('common.placeholder')+this.$t('page.host.host'), type: 'error'},
            {
              validator: (val) => {

                const hostRegex = /^(?!https?:\/\/)[^\s]+$/;
                const isValid = !!val && (hostRegex.test(val));

                // 如果验证通过，则赋值
                if (isValid) {
                  // 如果是 IPv6 地址，确保加上方括号
                  if (val.includes(":") && !val.startsWith("[")) {
                    this.formData.remote_host = `http://[${val}]`;  // 处理 IPv6 地址
                  } else {
                    this.formData.remote_host = `http://${val}`;  // 处理 IPv4 或域名
                  }
                }else{
                  this.formData.remote_host = ""
                }
                return isValid;
              },            message: this.$t('page.host.host_validation'),
              type: 'error',
            },
          ],
          port: [{
            required: true,
            message: this.$t('common.placeholder')+this.$t('page.host.port'),
            type: 'error'
          }],
          remote_host: [
            {required: true, message: this.$t('common.placeholder')+this.$t('page.host.remote_host'), type: 'error' },
            {
              validator: (val) => {
                const regex = /^(http:\/\/|https:\/\/)[^\s]+$/; // 验证域名
                return regex.test(val); // 返回是否有效
              },
              message: this.$t('page.host.remote_host_validation'),
              type: 'error',
            },
          ],
          remote_ip: [{
            required: true,
            message: this.$t('common.placeholder')+this.$t('page.host.remote_ip'),
            type: 'error'
          }],
          remote_port: [{
            required: true,
            message: this.$t('common.placeholder')+this.$t('page.host.remote_port'),
            type: 'error'
          }],
        },
      };
    },
    watch: {
      value: {
        handler(newVal) {
          this.formData = JSON.parse(JSON.stringify(newVal));

          // 解析防御配置
          if (this.formData.defense_json) {

            try {
              const defenseData = JSON.parse(this.formData.defense_json);

              console.log(this.formData.defense_json)

              let that = this;
              that.hostDefenseData.bot = getOrDefault(defenseData, "bot", "1");
              that.hostDefenseData.sqli = getOrDefault(defenseData, "sqli", "1");
              that.hostDefenseData.xss = getOrDefault(defenseData, "xss", "1");
              that.hostDefenseData.scan = getOrDefault(defenseData, "scan", "1");
              that.hostDefenseData.rce = getOrDefault(defenseData, "rce", "1");
              that.hostDefenseData.sensitive = getOrDefault(defenseData, "sensitive", "1");
              that.hostDefenseData.traversal = getOrDefault(defenseData, "traversal", "1");
            } catch (e) {
              console.error("解析defense_json失败", e);
            }
          }

          // 解析健康检测配置
          if (this.formData.healthy_json) {
            try {
              let that = this;
              if (that.formData.healthy_json != "") {
                that.healthyConfigData = JSON.parse(that.formData.healthy_json);
                that.healthyConfigData.is_enable_healthy = getOrDefault(that.healthyConfigData, "is_enable_healthy", "1");
                that.healthyConfigData.fail_count = getOrDefault(that.healthyConfigData, "fail_count", "3");
                that.healthyConfigData.success_count = getOrDefault(that.healthyConfigData, "success_count", "3");
                that.healthyConfigData.response_time = getOrDefault(that.healthyConfigData, "response_time", "5");
                that.healthyConfigData.check_method = getOrDefault(that.healthyConfigData, "check_method", "GET");
                that.healthyConfigData.check_path = getOrDefault(that.healthyConfigData, "check_path", "/");
                that.healthyConfigData.expected_codes = getOrDefault(that.healthyConfigData, "expected_codes", "200,");
              } else {
                that.healthyConfigData = { ...INITIAL_HEALTHY };
              }
            } catch (e) {
              console.error("解析healthy_json失败", e);
              this.healthyConfigData = { ...INITIAL_HEALTHY };
            }
          } else {
            // 如果没有健康检测配置，使用默认值
            this.healthyConfigData = { ...INITIAL_HEALTHY };
          }

          // 解析验证码配置
          if (this.formData.captcha_json) {
            try {
              let that = this;
              if (that.formData.captcha_json != "") {
                that.captchaConfigData = JSON.parse(that.formData.captcha_json);
                that.captchaConfigData.is_enable_captcha = getOrDefault(that.captchaConfigData, "is_enable_captcha", "0");
                that.captchaConfigData.expire_time = getOrDefault(that.captchaConfigData, "expire_time", 24);
                that.captchaConfigData.ip_mode = getOrDefault(that.captchaConfigData, "ip_mode", "nic");
              } else {
                that.captchaConfigData = { ...INITIAL_CAPTCHA };
              }
            } catch (e) {
              console.error("解析captcha_json失败", e);
              this.captchaConfigData = { ...INITIAL_CAPTCHA };
            }
          } else {
            // 如果没有验证码配置，使用默认值
            this.captchaConfigData = { ...INITIAL_CAPTCHA };
          }
        },
        immediate: true,
        deep: true
      }
    },
    methods: {
      // 处理SSL选择变更
      handleSslChange(value) {
        this.$emit('ssl-change', value);
      },

      // 表单提交
      onSubmit({ validateResult, firstError }) {
        console.log(validateResult, firstError);
        if (validateResult === true) {
          let postdata = {
            ...this.formData
          };

          // 处理主机名
          postdata.host = postdata.host.toLowerCase();
          if (postdata.host.indexOf("http://") >= 0 || postdata.host.indexOf("https://") >= 0) {
            this.$message.warning(this.$t('page.host.host_rule_msg'));
            return;
          }
          postdata.remote_host = "http://" + postdata.host;

          // 转换字符串为数字
          postdata['ssl'] = Number(postdata['ssl']);
          postdata['start_status'] = Number(postdata['start_status']);
          postdata['unrestricted_port'] = Number(postdata['unrestricted_port']);
          postdata['is_enable_load_balance'] = Number(postdata['is_enable_load_balance']);
          postdata['load_balance_stage'] = Number(postdata['load_balance_stage']);
          postdata['auto_jump_https'] = Number(postdata['auto_jump_https']);
          postdata['is_trans_back_domain'] = Number(postdata['is_trans_back_domain']);
          postdata['is_enable_http_auth_base'] = Number(postdata['is_enable_http_auth_base']);
          postdata['response_time_out'] = Number(postdata['response_time_out']);
          postdata['insecure_skip_verify'] = Number(postdata['insecure_skip_verify']);

          // 处理防御配置
          let defenseData = {
            bot: parseInt(this.hostDefenseData.bot),
            sqli: parseInt(this.hostDefenseData.sqli),
            xss: parseInt(this.hostDefenseData.xss),
            scan: parseInt(this.hostDefenseData.scan),
            rce: parseInt(this.hostDefenseData.rce),
            sensitive: parseInt(this.hostDefenseData.sensitive),
            traversal: parseInt(this.hostDefenseData.traversal)
          };
          postdata['defense_json'] = JSON.stringify(defenseData);

          // 处理健康检测配置
          let healthyData = {
            is_enable_healthy: parseInt(this.healthyConfigData.is_enable_healthy),
            fail_count: parseInt(this.healthyConfigData.fail_count),
            success_count: parseInt(this.healthyConfigData.success_count),
            response_time: parseInt(this.healthyConfigData.response_time),
            check_method: this.healthyConfigData.check_method,
            check_path: this.healthyConfigData.check_path,
            expected_codes: this.healthyConfigData.expected_codes,
          };
          postdata['healthy_json'] = JSON.stringify(healthyData);

          // 处理验证码配置
          let captchaData = {
            is_enable_captcha: parseInt(this.captchaConfigData.is_enable_captcha),
            exclude_urls: this.captchaConfigData.exclude_urls,
            expire_time: this.captchaConfigData.expire_time,
            ip_mode: this.captchaConfigData.ip_mode
          };
          postdata['captcha_json'] = JSON.stringify(captchaData);

          // 提交表单
          this.$emit('submit', { result: postdata });
        } else {
          console.log('Errors: ', validateResult);
          this.$message.warning(firstError);
          //this.$emit('submit', { result: validateResult, firstError });
        }
      }
    }
  });
  </script>
