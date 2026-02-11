<template>
  <div>

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
            <t-form-item :label="$t('page.host.ssl')" name="ssl">
              <t-tooltip class="placement top center" :content="$t('page.host.ssl_tips')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-radio-group v-model="formData.ssl">
                  <t-radio value="0">{{ $t('page.host.ssl_option_no') }}</t-radio>
                  <t-radio value="1">{{ $t('page.host.ssl_option_yes') }}</t-radio>
                </t-radio-group>
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
            <t-form-item :label="$t('page.host.unrestricted_port.label_unrestricted_port_is_enable')" name="unrestricted_port">
              <t-tooltip class="placement top center" :content="$t('page.host.unrestricted_port.unrestricted_port_tip')" placement="top"
                         :overlay-style="{ width: '200px' }" show-arrow>
                <t-radio-group v-model="formData.unrestricted_port">
                  <t-radio value="0">{{ $t('page.host.unrestricted_port.label_unrestricted_port_is_enable_on') }}</t-radio>
                  <t-radio value="1">{{ $t('page.host.unrestricted_port.label_unrestricted_port_is_enable_off') }}</t-radio>
                </t-radio-group>
              </t-tooltip>
            </t-form-item>
            <!-- SSL配置模式选择 (仅在新增模式且选择SSL时显示) -->
            <t-form-item :label="$t('page.host.ssl_config_mode')" name="ssl_config_mode" v-if="formData.ssl=='1' && !isEdit">
              <t-radio-group v-model="formData.ssl_config_mode">
                <t-radio value="existing">{{ $t('page.host.ssl_config_existing') }}</t-radio>
                <t-radio value="auto_apply">{{ $t('page.host.ssl_config_auto_apply') }}</t-radio>
              </t-radio-group>
            </t-form-item>
            
            <!-- 已有证书选择 (仅在选择"已有证书"模式时显示) -->
            <t-form-item :label="$t('page.host.ssl_folder')" name="bind_ssl_id" v-if="formData.ssl=='1' && (isEdit || formData.ssl_config_mode === 'existing')">
              <div style="display: flex; align-items: center;">
                <t-select @change="handleSslChange" :filterable="selectCanFilter" v-model="formData.bind_ssl_id" :placeholder="$t('common.select_placeholder')+$t('page.host.ssl_folder')" style="flex-grow: 1;">
                  <t-option value="" :label="$t('common.select_placeholder')+$t('page.host.ssl_folder')" key=""></t-option>
                  <t-option v-for="item in sslConfigList" :value="item.id" :label="`${item.domains} (${item.valid_to})`" :key="item.id"></t-option>
                </t-select>

                <t-button @click="handleAddNewSsl" style="margin-left: 10px;">{{$t('page.host.add_new_ssl')}}</t-button>
                <t-button @click="handleEditSsl" style="margin-left: 10px;">{{$t('page.host.edit_ssl')}}</t-button>
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
            <t-form-item :label="$t('page.host.log_only_mode')" name="log_only_mode">
              <t-tooltip class="placement top center" :content="$t('page.host.log_only_mode_tips')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
              <t-radio-group v-model="formData.log_only_mode">
                <t-radio value="0">{{ $t('page.host.log_only_mode_off') }}</t-radio>
                <t-radio value="1">{{ $t('page.host.log_only_mode_on') }}</t-radio>
              </t-radio-group>
              </t-tooltip>
            </t-form-item>

            <t-form-item :label="$t('page.host.auto_jump_https.label_autu_jump_https')" name="auto_jump_https" v-if="formData.ssl=='1'">
              <t-radio-group v-model="formData.auto_jump_https">
                <t-radio value="0">{{ $t('page.host.auto_jump_https.label_autu_jump_https_off') }}</t-radio>
                <t-radio value="1">{{ $t('page.host.auto_jump_https.label_autu_jump_https_on') }}</t-radio>
              </t-radio-group>
              
              <!-- 非标准443端口的HTTPS重定向服务器提示 -->
              <div v-if="shouldShowHttpsRedirectTip" style="margin-top: 10px;">
                <t-alert theme="warning" :close="false">
                  <div>
                    <div style="margin-bottom: 8px;">
                      {{ $t('page.host.auto_jump_https.non_standard_port_tip') }}
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span style="color: #555;">
                        {{ $t('page.host.auto_jump_https.redirect_server_status') }}: 
                        <strong>{{ httpsRedirectStatusText }}</strong>
                      </span>
                      <t-button 
                        size="small" 
                        theme="primary" 
                        @click="enableHttpsRedirect"
                        :loading="httpsRedirectConfig.loading"
                        :disabled="httpsRedirectConfig.enable_https_redirect === '1'"
                      >
                        {{ $t('page.host.auto_jump_https.enable_redirect_server') }}
                      </t-button>
                    </div>
                  </div>
                </t-alert>
              </div>
            </t-form-item>
            <t-form-item :label="$t('page.host.certfile')" name="certfile" v-if="formData.ssl=='1' && (isEdit || formData.ssl_config_mode === 'existing')">
              <t-tooltip class="placement top center"
                       :content="$t('page.host.certfile_content')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-textarea :style="{ width: '480px' }" v-model="formData.certfile" :placeholder="$t('common.placeholder')"
                          name="certfile">
                </t-textarea>
              </t-tooltip>
            </t-form-item>
            <t-form-item :label="$t('page.host.keyfile')" name="keyfile" v-if="formData.ssl=='1' && (isEdit || formData.ssl_config_mode === 'existing')">
              <t-tooltip class="placement top center"
                         :content="$t('page.host.keyfile_content')" placement="top"
                         :overlay-style="{ width: '200px' }" show-arrow>
                <t-textarea :style="{ width: '480px' }" v-model="formData.keyfile" :placeholder="$t('common.placeholder')" name="keyfile">
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
            <t-form-item :label="$t('page.host.owaspset_detection')">
              <t-tooltip class="placement top center" :content="$t('page.host.owaspset_detection_tips')" placement="top"
                       :overlay-style="{ width: '200px' }" show-arrow>
                <t-radio-group v-model="hostDefenseData.owaspset">
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
            <!-- IP提取模式选择 -->
            <t-form-item :label="$t('page.host.ip_mode')" name="ip_mode">
              <t-tooltip class="placement top center" :content="$t('page.host.ip_mode_tips')" placement="top"
                         :overlay-style="{ width: '300px' }" show-arrow>
                <t-radio-group v-model="formData.ip_mode">
                  <t-radio value="nic">
                    <div>
                      <div>{{ $t('page.host.ip_mode_nic') }}</div>
                      <div class="limit-mode-desc">{{ $t('page.host.ip_mode_nic_desc') }}</div>
                    </div>
                  </t-radio>
                  <t-radio value="proxy">
                    <div>
                      <div>{{ $t('page.host.ip_mode_proxy') }}</div>
                      <div class="limit-mode-desc">{{ $t('page.host.ip_mode_proxy_desc') }}</div>
                    </div>
                  </t-radio>
                </t-radio-group>
              </t-tooltip>
            </t-form-item>
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
            <t-form-item :label="$t('page.host.default_encoding')" name="default_encoding">
              <t-select v-model="formData.default_encoding" :style="{ width: '150px' }">
                <t-option value="auto">{{$t('page.host.default_encoding_auto')}}</t-option>
                <t-option value="utf-8">utf-8</t-option>
                <t-option value="gbk">gbk</t-option>
              </t-select>
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
            <t-form-item v-if="formData.is_enable_http_auth_base === '1'" :label="$t('page.host.http_auth_base_type')" name="http_auth_base_type">
              <t-tooltip class="placement top center" :content="$t('page.host.http_auth_base_type_tips')" placement="top"
                       :overlay-style="{ width: '400px' }" show-arrow>
                <t-radio-group v-model="formData.http_auth_base_type">
                  <t-radio value="authorization">{{$t('page.host.http_auth_base_type_authorization')}}</t-radio>
                  <t-radio value="custom">{{$t('page.host.http_auth_base_type_custom')}}</t-radio>
                </t-radio-group>
              </t-tooltip>
            </t-form-item>
            <t-form-item v-if="formData.is_enable_http_auth_base === '1'" :label="$t('page.host.http_auth_path_prefix')" name="http_auth_path_prefix">
              <t-tooltip class="placement top center" :content="$t('page.host.http_auth_path_prefix_tips')" placement="top"
                       :overlay-style="{ width: '500px' }" show-arrow>
                <t-input v-model="formData.http_auth_path_prefix" :placeholder="$t('page.host.http_auth_path_prefix_placeholder')" :style="{ width: '300px' }">
                  <template #suffix>
                    <t-button size="small" theme="primary" @click="generateHttpAuthPath">
                      {{$t('page.host.generate_random_path')}}
                    </t-button>
                  </template>
                </t-input>
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
          <t-tab-panel :value="8">
            <template #label>
              <t-icon name="link" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_anti_leech')}}
            </template>
            <anti-leech-config :anti-leech-config="antiLeechConfigData" @update="val => antiLeechConfigData = val"></anti-leech-config>
          </t-tab-panel>
          <t-tab-panel :value="9">
            <template #label>
              <t-icon name="memory" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_cache')}}
            </template>
            <cache-config :cache-config="cacheConfigData" :prop-host-code="formData.code" @update="val => cacheConfigData = val"></cache-config>
          </t-tab-panel>
          <t-tab-panel :value="10">
            <template #label>
              <t-icon name="folder" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_static_site')}}
            </template>
            <static-site-config :static-site-config="staticSiteConfigData" @update="val => staticSiteConfigData = val"></static-site-config>
          </t-tab-panel>
          <t-tab-panel :value="11">
            <template #label>
              <t-icon name="internet" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_transport')}}
            </template>
            <transport-config :transport-config="transportConfigData" @update="val => transportConfigData = val"></transport-config>
          </t-tab-panel>
          <t-tab-panel :value="12">
            <template #label>
              <t-icon name="filter" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_custom_headers')}}
            </template>
            <custom-headers-config :custom-headers-config="customHeadersConfigData" @update="val => customHeadersConfigData = val"></custom-headers-config>
          </t-tab-panel>
          <t-tab-panel :value="13">
            <template #label>
              <t-icon name="filter" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_custom_response_headers')}}
            </template>
            <custom-response-headers-config :custom-response-headers-config="customResponseHeadersConfigData" @update="val => customResponseHeadersConfigData = val"></custom-response-headers-config>
          </t-tab-panel>
          </t-tabs>

        <t-form-item style="float: right;margin-top:5px">
          <t-button variant="outline" @click="$emit('close')">{{ $t('common.close') }}</t-button>
          <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
        </t-form-item>
      </t-form>
    </div>

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

  </div>
</template>

  <script lang="ts">
  import Vue from 'vue';
  import { FileSafetyIcon } from 'tdesign-icons-vue';
  import LoadBalance from "../../loadbalance/index.vue";
  import HttpAuthBase from "../../http_auth_base/index.vue";
  import HealthyConfig from '../components/HealthyConfig.vue';
  import CaptchaConfig from '../components/CaptchaConfig.vue';
  import StaticSiteConfig from '../components/StaticSiteConfig.vue';
  import TransportConfig from '../components/TransportConfig.vue';

  import AntiLeechConfig from '../components/AntiLeechConfig.vue';
  import CacheConfig from '../components/CacheConfig.vue';
  import CustomHeadersConfig from '../components/CustomHeadersConfig.vue';
  import CustomResponseHeadersConfig from '../components/CustomResponseHeadersConfig.vue';
  import SslForm from '../components/SslForm.vue';
  import { INITIAL_HEALTHY, INITIAL_CAPTCHA, INITIAL_ANTILEECH,INITIAL_SSL_DATA,INITIAL_CACHE,INITIAL_STATIC_SITE,INITIAL_TRANSPORT,INITIAL_CUSTOM_HEADERS,INITIAL_CUSTOM_RESPONSE_HEADERS } from '../constants';
  import {sslConfigListApi,sslConfigAddApi,sslConfigEditApi,sslConfigDetailApi} from '@/apis/sslconfig';
  import {getOrDefault} from '@/utils/usuallytool';
  import {get_detail_by_item_api, edit_system_config_by_item_api} from '@/apis/systemconfig';
  export default Vue.extend({
    name: 'HostForm',
    components: {
      FileSafetyIcon,
      LoadBalance,
      HttpAuthBase,
      HealthyConfig,
      CaptchaConfig,
      AntiLeechConfig,
      SslForm,
      CacheConfig,
      StaticSiteConfig,
      TransportConfig,
      CustomHeadersConfig,
      CustomResponseHeadersConfig,
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
        formData: {
          ...JSON.parse(JSON.stringify(this.value)),
          // SSL配置模式字段，默认为已有证书
          ssl_config_mode: 'existing'
        },
        // 主机防御细节
        hostDefenseData: {
          bot: "1",
          sqli: "1",
          xss: "1",
          scan: "1",
          rce: "1",
          sensitive: "1",
          traversal: "1",
          owaspset: "0",
        },
        // 健康度检测配置
        healthyConfigData: { ...INITIAL_HEALTHY },
        // 验证码配置
        captchaConfigData: { ...INITIAL_ANTILEECH },
        // 防恶意链接配置
        antiLeechConfigData: {...INITIAL_CAPTCHA },
        cacheConfigData: { ...INITIAL_CACHE },
        staticSiteConfigData: {...INITIAL_STATIC_SITE},
        transportConfigData: {...INITIAL_TRANSPORT},
        customHeadersConfigData: {...INITIAL_CUSTOM_HEADERS},
        customResponseHeadersConfigData: {...INITIAL_CUSTOM_RESPONSE_HEADERS},
        rules: {
          host: [{required: true,message: this.$t('common.placeholder')+this.$t('page.host.host'), type: 'error'},
            {
              validator: (val) => {
                //debugger
                const hostRegex = /^(?!https?:\/\/)[^\s]+$/;
                const isValid = !!val && (hostRegex.test(val));

                return isValid;
              },
              message: this.$t('page.host.host_validation'),
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
        //ssl
        addSSLFormVisible:false,
        editSSLFormVisible:false,
        //ssl证书夹
        sslConfigList: [],
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
        // HTTPS重定向服务器配置
        httpsRedirectConfig: {
          enable_https_redirect: '0',    // 启用状态: 0-关闭 1-开启
          loading: false                 // 加载状态
        }

      };
    },
    computed: {
      // 判断是否需要显示HTTPS重定向提示
      shouldShowHttpsRedirectTip() {
        // 1. 开启了SSL
        // 2. 端口不是443
        // 3. HTTPS重定向服务器未启用
        return this.formData.ssl === '1' && 
               this.formData.port !== 443 && 
               this.httpsRedirectConfig.enable_https_redirect === '0';
      },
      // 获取HTTPS重定向服务器状态文本
      httpsRedirectStatusText() {
        return this.httpsRedirectConfig.enable_https_redirect === '1' 
          ? this.$t('page.host.auto_jump_https.https_redirect_server_on')
          : this.$t('page.host.auto_jump_https.https_redirect_server_off');
      }
    },
    watch: {
      value: {
        handler(newVal) {
          this.formData = {
            ...JSON.parse(JSON.stringify(newVal)),
            // 确保ssl_config_mode字段存在
            ssl_config_mode: newVal.ssl_config_mode || 'existing'
          };
          // 将数字类型转换为字符串类型，确保不为空时才转换
          this.formData.ssl = this.formData.ssl != null ? this.formData.ssl.toString() : "0"
          this.formData.start_status = this.formData.start_status != null ? this.formData.start_status.toString() : "0"
          this.formData.unrestricted_port = this.formData.unrestricted_port != null ? this.formData.unrestricted_port.toString() : "0"
          this.formData.is_enable_load_balance = this.formData.is_enable_load_balance != null ? this.formData.is_enable_load_balance.toString() : "0"
          this.formData.load_balance_stage = this.formData.load_balance_stage != null ? this.formData.load_balance_stage.toString() : "1"
          this.formData.auto_jump_https = this.formData.auto_jump_https != null ? this.formData.auto_jump_https.toString() : "0"
          this.formData.is_trans_back_domain = this.formData.is_trans_back_domain != null ? this.formData.is_trans_back_domain.toString() : "0"
          this.formData.is_enable_http_auth_base = this.formData.is_enable_http_auth_base != null ? this.formData.is_enable_http_auth_base.toString() : "0"
          this.formData.http_auth_base_type = this.formData.http_auth_base_type != null ? this.formData.http_auth_base_type : "authorization"
          this.formData.response_time_out = this.formData.response_time_out != null ? this.formData.response_time_out.toString() : "60"
          this.formData.insecure_skip_verify = this.formData.insecure_skip_verify != null ? this.formData.insecure_skip_verify.toString() : "0"
          this.formData.log_only_mode = this.formData.log_only_mode != null ? this.formData.log_only_mode.toString() : "0"
          this.formData.ip_mode = this.formData.ip_mode || "nic"

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
              that.hostDefenseData.owaspset = getOrDefault(defenseData, "owaspset", "0");
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
                that.captchaConfigData.path_prefix = getOrDefault(that.captchaConfigData, "path_prefix", "");
                that.captchaConfigData.expire_time = getOrDefault(that.captchaConfigData, "expire_time", 24);
                that.captchaConfigData.ip_mode = getOrDefault(that.captchaConfigData, "ip_mode", "nic");
                that.captchaConfigData.engine_type = getOrDefault(that.captchaConfigData, "engine_type", "default");
                if ( that.captchaConfigData.cap_js_config == null){
                  that.captchaConfigData.cap_js_config = {
                    challengeCount: 50,
                    challengeSize: 32,
                    challengeDifficulty: 4,
                    expiresMs: 600000,
                    infoTitle: {
                      zh: "验证码验证",
                      en: "Captcha Verification"
                    },
                    infoText: {
                      zh: "请完成以下验证以继续访问",
                      en: "Please complete the following verification to continue"
                    }
                  } 
                }else{
                  that.captchaConfigData.cap_js_config.challengeCount = getOrDefault(that.captchaConfigData.cap_js_config, "challengeCount", 50);
                  that.captchaConfigData.cap_js_config.challengeSize = getOrDefault(that.captchaConfigData.cap_js_config, "challengeSize", 32);
                  that.captchaConfigData.cap_js_config.challengeDifficulty = getOrDefault(that.captchaConfigData.cap_js_config, "challengeDifficulty", 4);
                  that.captchaConfigData.cap_js_config.expiresMs = getOrDefault(that.captchaConfigData.cap_js_config, "expiresMs", 600000);
                  
                  // 确保 infoTitle 和 infoText 有默认值
                  if (!that.captchaConfigData.cap_js_config.infoTitle) {
                    that.captchaConfigData.cap_js_config.infoTitle = {
                      zh: "验证码验证",
                      en: "Captcha Verification"
                    };
                  }
                  if (!that.captchaConfigData.cap_js_config.infoText) {
                    that.captchaConfigData.cap_js_config.infoText = {
                      zh: "请完成以下验证以继续访问",
                      en: "Please complete the following verification to continue"
                    };
                  }
                }
              } else {
                that.captchaConfigData = { ...INITIAL_ANTILEECH };
              }
            } catch (e) {
              console.error("解析captcha_json失败", e);
              this.captchaConfigData = { ...INITIAL_ANTILEECH };
            }
          } else {
            // 如果验证码配置，使用默认值
            this.captchaConfigData = { ...INITIAL_ANTILEECH };
          }

          // 解析transport配置
          if (this.formData.transport_json) {
            try {
              let that = this;
              if (that.formData.transport_json != "") {
                that.transportConfigData = JSON.parse(that.formData.transport_json);
                // 设置默认值为0
                that.transportConfigData.max_idle_conns = getOrDefault(that.transportConfigData, "max_idle_conns", INITIAL_TRANSPORT.max_idle_conns);
                that.transportConfigData.max_idle_conns_per_host = getOrDefault(that.transportConfigData, "max_idle_conns_per_host", INITIAL_TRANSPORT.max_idle_conns_per_host);
                that.transportConfigData.max_conns_per_host = getOrDefault(that.transportConfigData, "max_conns_per_host", INITIAL_TRANSPORT.max_conns_per_host);
                that.transportConfigData.idle_conn_timeout = getOrDefault(that.transportConfigData, "idle_conn_timeout", INITIAL_TRANSPORT.idle_conn_timeout);
                that.transportConfigData.tls_handshake_timeout = getOrDefault(that.transportConfigData, "tls_handshake_timeout", INITIAL_TRANSPORT.tls_handshake_timeout);
                that.transportConfigData.expect_continue_timeout = getOrDefault(that.transportConfigData, "expect_continue_timeout", INITIAL_TRANSPORT.expect_continue_timeout);
              } else {
                that.transportConfigData = { ...INITIAL_TRANSPORT };
              }
            } catch (e) {
              console.error("解析transport_json失败", e);
              this.transportConfigData = { ...INITIAL_TRANSPORT };
            }
          } else {
            // 如果transport配置为空，使用默认值
            this.transportConfigData = { ...INITIAL_TRANSPORT };
          }

          // 解析自定义头信息配置
          if (this.formData.custom_headers_json) {
            try {
              let that = this;
              if (that.formData.custom_headers_json != "") {
                const parsedConfig = JSON.parse(that.formData.custom_headers_json);
                that.customHeadersConfigData = {
                  // 转换为字符串类型，因为 radio-group 使用字符串值
                  is_enable_custom_headers: String(parsedConfig.is_enable_custom_headers !== undefined ? parsedConfig.is_enable_custom_headers : 0),
                  // 直接获取数组，不使用 getOrDefault（它会调用 toString）
                  headers: Array.isArray(parsedConfig.headers) ? parsedConfig.headers : []
                };
                console.log("解析自定义头信息配置:", that.customHeadersConfigData);
                console.log("headers 数组:", that.customHeadersConfigData.headers);
              } else {
                that.customHeadersConfigData = { ...INITIAL_CUSTOM_HEADERS };
              }
            } catch (e) {
              console.error("解析custom_headers_json失败", e);
              this.customHeadersConfigData = { ...INITIAL_CUSTOM_HEADERS };
            }
          } else {
            // 如果没有自定义头信息配置，使用默认值
            this.customHeadersConfigData = { ...INITIAL_CUSTOM_HEADERS };
          }

          // 解析自定义响应头信息配置
          if (this.formData.custom_response_headers_json) {
            try {
              let that = this;
              if (that.formData.custom_response_headers_json != "") {
                const parsedConfig = JSON.parse(that.formData.custom_response_headers_json);
                that.customResponseHeadersConfigData = {
                  is_enable_custom_headers: String(parsedConfig.is_enable_custom_headers !== undefined ? parsedConfig.is_enable_custom_headers : 0),
                  headers: Array.isArray(parsedConfig.headers) ? parsedConfig.headers : []
                };
              } else {
                that.customResponseHeadersConfigData = { ...INITIAL_CUSTOM_RESPONSE_HEADERS };
              }
            } catch (e) {
              console.error("解析custom_response_headers_json失败", e);
              this.customResponseHeadersConfigData = { ...INITIAL_CUSTOM_RESPONSE_HEADERS };
            }
          } else {
            this.customResponseHeadersConfigData = { ...INITIAL_CUSTOM_RESPONSE_HEADERS };
          }

          // 解析防盗链配置
          if (this.formData.anti_leech_json) {
            try {
              let that = this;
              if (that.formData.anti_leech_json != "") {
                that.antiLeechConfigData = JSON.parse(that.formData.anti_leech_json);
                that.antiLeechConfigData.is_enable_anti_leech = (that.antiLeechConfigData.is_enable_anti_leech || 0).toString();
              } else {
                that.antiLeechConfigData = { ...INITIAL_ANTILEECH };
              }
            } catch (e) {
              this.antiLeechConfigData = { ...INITIAL_ANTILEECH };
            }
          } else {
            this.antiLeechConfigData = { ...INITIAL_ANTILEECH };
          }

          // 解析缓存配置
          if (this.formData.cache_json) {
            try {
              let that = this;
              if (that.formData.cache_json != "") {
                that.cacheConfigData = JSON.parse(that.formData.cache_json);
                that.cacheConfigData.is_enable_cache = (that.cacheConfigData.is_enable_cache || 0).toString();
                that.cacheConfigData.max_file_size_mb = (that.cacheConfigData.max_file_size_mb || 0).toString();
                that.cacheConfigData.max_memory_size_mb = (that.cacheConfigData.max_memory_size_mb || 0).toString();
              } else {
                that.cacheConfigData = { ...INITIAL_CACHE };
              }
            } catch (e) {
              this.cacheConfigData = { ...INITIAL_CACHE };
            }
          } else {
            this.cacheConfigData = { ...INITIAL_CACHE };
          }
          // 解析静态网站配置
          if (this.formData.static_site_json) {
            try {
              let that = this;
              if (that.formData.static_site_json != "") {
                that.staticSiteConfigData = JSON.parse(that.formData.static_site_json);
                that.staticSiteConfigData.is_enable_static_site = (that.staticSiteConfigData.is_enable_static_site || 0).toString();
                that.staticSiteConfigData.sensitive_paths = that.staticSiteConfigData.sensitive_paths || "";
                that.staticSiteConfigData.sensitive_extensions = that.staticSiteConfigData.sensitive_extensions || "";
                that.staticSiteConfigData.allowed_extensions = that.staticSiteConfigData.allowed_extensions || "";
                that.staticSiteConfigData.sensitive_patterns = that.staticSiteConfigData.sensitive_patterns || "";
              } else {
                that.staticSiteConfigData = { ...INITIAL_STATIC_SITE };
              }
            } catch (e) {
              this.staticSiteConfigData = { ...INITIAL_STATIC_SITE };
            }
          } else {
            this.staticSiteConfigData = { ...INITIAL_STATIC_SITE };
          }

            
        
        },
        immediate: true,
        deep: true
      },
      'formData.host': function(val) {
          console.log("formData.host",val)
          const hostRegex = /^(?!https?:\/\/)[^\s]+$/;
          const isValid = !!val && (hostRegex.test(val));
          if ( isValid && !this.isEdit) {
            // 获取当前协议，如果已有remote_host则保留其协议，否则默认为http
            const currentProtocol = this.formData.remote_host && this.formData.remote_host.startsWith('https://') ? 'https://' : 'http://';

            if (val.includes(":") && !val.startsWith("[")) {
              this.formData.remote_host = `${currentProtocol}[${val}]`;
            } else {
              this.formData.remote_host = `${currentProtocol}${val}`;
            }
          }
        },
        // 监听SSL状态变化，自动设置端口和重置SSL配置模式
      'formData.ssl': {
        handler(newVal, oldVal) {
          // 只在非编辑模式下且SSL状态确实发生变化时才自动设置端口
          if (!this.isEdit && oldVal !== undefined && newVal !== oldVal) {
            if (newVal === "1") {
              // 选择SSL：重置SSL配置模式为已有证书
              this.formData.ssl_config_mode = 'existing';
              // 只有当端口为空或为默认的80时才设置为443
              if (!this.formData.port || this.formData.port === 80) {
                this.formData.port = 443;
              }
              // 只有当bind_more_port为空时才设置为80
              if (!this.formData.bind_more_port || this.formData.bind_more_port === '') {
                this.formData.bind_more_port = '80';
              }
            } else if (newVal === "0") {
              // 取消SSL：清除SSL配置模式
              this.formData.ssl_config_mode = 'existing';
              // 只有当端口为443时才设置为80
              if (this.formData.port === 443) {
                this.formData.port = 80;
              }
              // 只有当bind_more_port为'80'时才清空
              if (this.formData.bind_more_port === '80') {
                this.formData.bind_more_port = '';
              }
            }
          }
        }
      },
      // 监听HTTP认证开关状态，自动生成路径
      'formData.is_enable_http_auth_base': function(newVal, oldVal) {
        // 从关闭切换到开启时，如果路径为空则自动生成
        if (newVal === '1' && oldVal === '0' && !this.formData.http_auth_path_prefix) {
          this.generateHttpAuthPath();
        }
      },
    },
    created() {
      this.getSslFolderList();
      this.getHttpsRedirectConfig();
    },
    methods: {
      // 获取HTTPS重定向服务器配置
      async getHttpsRedirectConfig() {
        try {
          const res: any = await get_detail_by_item_api({ item: 'enable_https_redirect' });
          console.log("getHttpsRedirectConfig",res)
          if (res.code === 0 && res.data) {
            this.httpsRedirectConfig.enable_https_redirect = res.data.value || '0';
          }
        } catch (e) {
          console.log('获取HTTPS重定向配置失败:', e);
        }
      },
      // 启用HTTPS重定向服务器
      async enableHttpsRedirect() {
        this.httpsRedirectConfig.loading = true;
        try {
          const res: any = await edit_system_config_by_item_api({
            item: 'enable_https_redirect',
            value: '1'
          });
          
          if (res.code === 0) {
            this.httpsRedirectConfig.enable_https_redirect = '1';
            this.$message.success(this.$t('page.host.auto_jump_https.enable_success'));
          } else {
            this.$message.error(res.msg || this.$t('page.host.auto_jump_https.enable_failed'));
          }
        } catch (e) {
          console.log('启用HTTPS重定向服务器失败:', e);
          this.$message.error(this.$t('page.host.auto_jump_https.enable_failed'));
        } finally {
          this.httpsRedirectConfig.loading = false;
        }
      },
      getSslFolderList() {
        let that = this;
        sslConfigListApi({
          pageSize: 10000,
          remarks: "",
          code: ""
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
      // 处理SSL选择变更
      handleSslChange(value) {
        // 查找选中的SSL配置
        const selectedSsl = this.sslConfigList.find(item => item.id === value);
        // 如果找到了SSL配置，直接在本地更新证书内容
        if (selectedSsl) {
          this.formData.certfile = selectedSsl.cert_content;
          this.formData.keyfile = selectedSsl.key_content;
        }
      },
      handleAddNewSsl(){
      this.addSSLFormVisible = true
      this.sslformData ={...INITIAL_SSL_DATA}
      },
      handleEditSsl() {
        let sslConfigItem;

        if (!this.isEdit) {
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

        } else if (this.isEdit) {
          if (this.formData.bind_ssl_id === '') {
            this.$message.warning(this.$t('page.host.bind_empty_ssl_tips'));
            return;
          }
          sslConfigItem = this.sslConfigList.find(item => item.id === this.formData.bind_ssl_id);

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
      // 生成随机HTTP认证路径前缀
      generateHttpAuthPath() {
        // 生成格式: /_waf_{8位随机字符}
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let randomStr = '';
        for (let i = 0; i < 8; i++) {
          randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.formData.http_auth_path_prefix = `/_waf_${randomStr}`;
        this.$message.success(this.$t('page.host.generate_path_success'));
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
            console.log("处理前",postdata)
            // 处理远程主机名
            // 只有当remote_host为空时才自动设置
            if (!postdata.remote_host || postdata.remote_host === '') {
              postdata.remote_host = "http://" + postdata.host;
            }

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
            postdata['log_only_mode'] = Number(postdata['log_only_mode']);
            
            // 确保 ip_mode 字段存在，默认为 nic
            if (!postdata['ip_mode']) {
              postdata['ip_mode'] = 'nic';
            }

            if (postdata['ssl'] === 0) {
              postdata['bind_ssl_id'] = '';
              postdata['certfile'] = '';
              postdata['keyfile'] = '';
            }
            // 处理防御配置
            let defenseData = {
              bot: parseInt(this.hostDefenseData.bot),
              sqli: parseInt(this.hostDefenseData.sqli),
              xss: parseInt(this.hostDefenseData.xss),
              scan: parseInt(this.hostDefenseData.scan),
              rce: parseInt(this.hostDefenseData.rce),
              sensitive: parseInt(this.hostDefenseData.sensitive),
              traversal: parseInt(this.hostDefenseData.traversal),
              owaspset: parseInt(this.hostDefenseData.owaspset)
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
              path_prefix: this.captchaConfigData.path_prefix || '',
              exclude_urls: this.captchaConfigData.exclude_urls,
              expire_time: this.captchaConfigData.expire_time,
              ip_mode: this.captchaConfigData.ip_mode,
              engine_type: this.captchaConfigData.engine_type,
              cap_js_config: this.captchaConfigData.cap_js_config 
            };
            postdata['captcha_json'] = JSON.stringify(captchaData);

            // 处理防盗链配置
            let antiLeechData = {
              is_enable_anti_leech: parseInt(this.antiLeechConfigData.is_enable_anti_leech),
              file_types: this.antiLeechConfigData.file_types,
              valid_referers: this.antiLeechConfigData.valid_referers,
              action: this.antiLeechConfigData.action,
              redirect_url: this.antiLeechConfigData.redirect_url
            };
            postdata['anti_leech_json'] = JSON.stringify(antiLeechData);

            // 处理缓存配置
            let cacheData = {
              is_enable_cache: parseInt(this.cacheConfigData.is_enable_cache),
              cache_location: this.cacheConfigData.cache_location,
              cache_dir: this.cacheConfigData.cache_dir,
              max_file_size_mb: parseFloat(this.cacheConfigData.max_file_size_mb),
              max_memory_size_mb: parseFloat(this.cacheConfigData.max_memory_size_mb)
            };
            postdata['cache_json'] = JSON.stringify(cacheData);

            // 处理静态网站配置
            let staticSiteData = {
              is_enable_static_site: parseInt(this.staticSiteConfigData.is_enable_static_site),
              static_site_path: this.staticSiteConfigData.static_site_path,
              static_site_prefix: this.staticSiteConfigData.static_site_prefix,
              sensitive_paths: this.staticSiteConfigData.sensitive_paths,
              sensitive_extensions: this.staticSiteConfigData.sensitive_extensions,
              allowed_extensions: this.staticSiteConfigData.allowed_extensions,
              sensitive_patterns: this.staticSiteConfigData.sensitive_patterns
            };
            postdata['static_site_json'] = JSON.stringify(staticSiteData);

            // 处理transport配置
            let transportData = {
              // 将传输配置数据转换为整数类型
              max_idle_conns: parseInt(this.transportConfigData.max_idle_conns || INITIAL_TRANSPORT.max_idle_conns),
              max_idle_conns_per_host: parseInt(this.transportConfigData.max_idle_conns_per_host || INITIAL_TRANSPORT.max_idle_conns_per_host), 
              idle_conn_timeout: parseInt(this.transportConfigData.idle_conn_timeout || INITIAL_TRANSPORT.idle_conn_timeout),
              tls_handshake_timeout: parseInt(this.transportConfigData.tls_handshake_timeout || INITIAL_TRANSPORT.tls_handshake_timeout),
              expect_continue_timeout: parseInt(this.transportConfigData.expect_continue_timeout || INITIAL_TRANSPORT.expect_continue_timeout),
              max_conns_per_host: parseInt(this.transportConfigData.max_conns_per_host || INITIAL_TRANSPORT.max_conns_per_host),
              
            };
            postdata['transport_json'] = JSON.stringify(transportData);

            // 自定义头信息配置
            const customHeadersData = {
              is_enable_custom_headers: parseInt(this.customHeadersConfigData.is_enable_custom_headers || INITIAL_CUSTOM_HEADERS.is_enable_custom_headers),
              headers: this.customHeadersConfigData.headers || []
            };
            console.log("提交自定义头信息配置:", customHeadersData);
            postdata['custom_headers_json'] = JSON.stringify(customHeadersData);

            // 自定义响应头信息配置
            const customResponseHeadersData = {
              is_enable_custom_headers: parseInt(this.customResponseHeadersConfigData.is_enable_custom_headers || INITIAL_CUSTOM_RESPONSE_HEADERS.is_enable_custom_headers),
              headers: this.customResponseHeadersConfigData.headers || []
            };
            postdata['custom_response_headers_json'] = JSON.stringify(customResponseHeadersData);

            // 提交表单
            this.$emit('submit', { result: postdata });
          } else {
            console.log('Errors: ', validateResult);
            this.$message.warning(firstError);
          }
        }
      }
  });
  </script>
