<template>
  <div>

  <div class="host-form">
      <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="230">
        <div class="host-tabs-wrapper" :class="{ 'host-tabs-wrapper--left': tabPlacement === 'left' }">
          <div class="tab-placement-bar">
            <t-tooltip :content="tabPlacement === 'left' ? $t('page.host.tab_layout_horizontal') : $t('page.host.tab_layout_vertical')"
                       placement="top" show-arrow>
              <t-button variant="text" shape="square" size="small" @click="toggleTabPlacement">
                <t-icon :name="tabPlacement === 'left' ? 'view-list' : 'view-column'"/>
              </t-button>
            </t-tooltip>
          </div>
          <t-tabs v-model="activeTab" :placement="tabPlacement">
          <t-tab-panel :value="1">
            <template #label>
              <t-icon name="home" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_base')}}
            </template>
            
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

            <t-form-item :label="$t('page.host.disable_http2.label')" name="disable_http2" v-if="formData.ssl=='1'">
              <t-tooltip class="placement top center" :content="$t('page.host.disable_http2.tips')" placement="top"
                       :overlay-style="{ width: '260px' }" show-arrow>
                <t-radio-group v-model="formData.disable_http2">
                  <t-radio value="0">{{ $t('page.host.disable_http2.enable') }}</t-radio>
                  <t-radio value="1">{{ $t('page.host.disable_http2.disable') }}</t-radio>
                </t-radio-group>
              </t-tooltip>
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

            <t-form-item :label="$t('page.host.nickname')" name="nickname">
              <t-input :style="{ width: '480px' }" v-model="formData.nickname" :placeholder="$t('page.host.nickname_placeholder')"></t-input>
            </t-form-item>

            <t-form-item :label="$t('page.host.group.belong_group')" name="group_code">
              <t-select :style="{ width: '480px' }" v-model="formData.group_code" clearable
                        :placeholder="$t('page.host.group.belong_group_placeholder')">
                <t-option v-for="g in hostGroups" :key="g.group_code" :value="g.group_code" :label="g.group_name">
                  <i class="hg-form-dot" :style="{ background: g.color }"></i>{{ g.group_name }}
                </t-option>
              </t-select>
              <a class="hg-form-new" @click="openGroupQuickAdd()">＋ {{ $t('page.host.group.new_group') }}</a>
              <div class="hg-form-tip">{{ $t('page.host.group.belong_group_tip') }}</div>
            </t-form-item>

            <t-form-item :label="$t('common.remarks')" name="remarks">
              <t-textarea :style="{ width: '480px' }" v-model="formData.remarks" :placeholder="$t('common.placeholder_content')" name="remarks">
              </t-textarea>
            </t-form-item>
          </t-tab-panel>

          <t-tab-panel :value="2">
            <template #label>
              <t-icon name="layers" style="margin-right: 4px;color:#0052d9"/>
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

            <t-table
              :data="defenseRows"
              :columns="defenseColumns"
              row-key="key"
              size="small"
              :max-height="440"
              bordered
              hover
            >
              <template #detection="{ row }">
                <t-tooltip class="placement top center" :content="row.tips" placement="top"
                           :overlay-style="{ width: '300px' }" show-arrow>
                  <span>{{ row.label }}</span>
                </t-tooltip>
              </template>
              <template #status="{ row }">
                <t-radio-group :value="getDefenseValue(row)" @change="val => setDefenseValue(row, val)"
                               style="white-space:nowrap;flex-wrap:nowrap">
                  <t-radio value="0">{{$t('common.off')}}</t-radio>
                  <t-radio value="1">{{$t('common.on')}}</t-radio>
                </t-radio-group>
              </template>
              <template #op="{ row }">
                <t-link v-if="row.action && row.action.type==='route'" theme="primary" size="small"
                        @click="$router.push({name: row.action.name})">
                  {{ row.action.text }} <t-icon name="jump" />
                </t-link>
                <t-link v-else-if="row.action && row.action.type==='tab'" theme="primary" size="small"
                        @click="activeTab = row.action.tab">
                  {{ $t('page.host.config_detail') }} <t-icon name="jump" />
                </t-link>
              </template>
            </t-table>
          </t-tab-panel>

          <t-tab-panel :value="4">
            <template #label>
              <t-icon name="setting" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_other')}}
            </template>
            <!-- IP提取模式：不要用 t-tooltip 包裹整组单选，否则会拦截点击导致无法切换 -->
            <t-form-item name="ip_mode">
              <template #label>
                <span>{{ $t('page.host.ip_mode') }}</span>
                <t-tooltip class="placement top center" :content="$t('page.host.ip_mode_tips')" placement="top"
                           :overlay-style="{ width: '300px' }" show-arrow>
                  <t-icon name="help-circle" class="host-form-ip-mode-help-icon" />
                </t-tooltip>
              </template>
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
            </t-form-item>
            <!-- 真实IP来源加固：仅代理模式下有意义(网卡模式直接用网络层IP，此设置被忽略)。
                 默认(空)保持旧行为取 XFF 最左，向后兼容；选择加固模式后才改变取值。 -->
            <t-form-item v-if="formData.ip_mode === 'proxy'" name="ip_source_mode">
              <template #label>
                <span>{{ $t('page.host.ip_source_mode') }}</span>
                <t-tooltip class="placement top center" :content="$t('page.host.ip_source_mode_tips')" placement="top"
                           :overlay-style="{ width: '340px' }" show-arrow>
                  <t-icon name="help-circle" class="host-form-ip-mode-help-icon" />
                </t-tooltip>
              </template>
              <div class="ip-source-block">
                <t-select v-model="formData.ip_source_mode" :style="{ width: '320px' }" clearable>
                  <t-option value="" :label="$t('page.host.ip_source_compat')" />
                  <t-option value="header" :label="$t('page.host.ip_source_header')" />
                  <t-option value="xff_depth" :label="$t('page.host.ip_source_xff')" />
                  <t-option value="cdn_preset" :label="$t('page.host.ip_source_cdn')" />
                </t-select>
                <div class="limit-mode-desc">{{ ipSourceModeDesc }}</div>
                <!-- 全局(系统配置 gwaf_proxy_header) 与 站点设置 谁生效，必须写在用户眼前，否则改了全局发现某站点没变会懵 -->
                <div v-if="formData.ip_source_mode === ''" class="ip-source-scope">
                  <t-alert v-if="globalProxyHeader" theme="info">
                    <div>
                      {{ $t('page.host.ip_scope_inherit', { header: globalProxyHeader }) }}
                      <a class="t-button-link" @click="goSystemConfig">{{ $t('page.host.ip_scope_edit_global') }}</a>
                      <div class="limit-mode-desc">{{ $t('page.host.ip_scope_inherit_desc') }}</div>
                    </div>
                  </t-alert>
                  <t-alert v-else theme="error">
                    <div>
                      {{ $t('page.host.ip_scope_global_empty') }}
                      <a class="t-button-link" @click="goSystemConfig">{{ $t('page.host.ip_scope_goto_global') }}</a>
                    </div>
                  </t-alert>
                </div>
                <div v-else-if="formData.ip_source_mode !== 'nic'" class="ip-source-scope">
                  <t-alert theme="success" :message="$t('page.host.ip_scope_own')" />
                </div>
                <!-- 到底该配哪个头，只能看真实到达的请求头才知道；这里直接给个入口，免得跑去日志详情里翻(#956) -->
                <div v-if="isEdit && formData.code" class="ip-probe-entry">
                  <a class="t-button-link" @click="openIpProbe">{{ $t('page.host.ip_probe_entry') }}</a>
                </div>
              </div>
            </t-form-item>
            <t-form-item v-if="formData.ip_mode === 'proxy' && formData.ip_source_mode === 'cdn_preset'" :label="$t('page.host.cdn_provider')" name="cdn_provider">
              <t-select v-model="formData.cdn_provider" :style="{ width: '320px' }" @change="onCdnProviderChange">
                <t-option value="cloudflare" label="Cloudflare (CF-Connecting-IP)" />
                <t-option value="fastly" label="Fastly (Fastly-Client-IP)" />
                <t-option value="cloudfront" label="AWS CloudFront" />
                <t-option value="edgeone" label="腾讯云 EdgeOne (EO-Connecting-IP)" />
                <t-option value="aliyun" label="阿里云 CDN (Ali-Cdn-Real-Ip)" />
                <t-option value="akamai" label="Akamai (True-Client-IP)" />
              </t-select>
            </t-form-item>
            <!-- CDN 回源段由中心库统一管理：只读展示已下载条数/上次更新，不让用户手填 -->
            <t-form-item v-if="formData.ip_mode === 'proxy' && formData.ip_source_mode === 'cdn_preset' && formData.cdn_provider"
                         :label="$t('page.host.cdn_trusted_ips')">
              <div>
                <template v-if="cdnProviderInfo">
                  <span v-if="cdnProviderInfo.count > 0" style="color: var(--td-success-color);">
                    {{ $t('page.host.cdn_downloaded', { count: cdnProviderInfo.count }) }}
                    <span style="color: var(--td-text-color-placeholder);">（{{ $t('page.host.cdn_last_update') }}: {{ formatCdnTs(cdnProviderInfo.last_sync_at) }}）</span>
                  </span>
                  <span v-else style="color: var(--td-warning-color);">{{ $t('page.host.cdn_not_fetched') }}</span>
                  <a class="t-button-link" style="margin-left: 12px;" @click="goCdnPage">{{ $t('page.host.cdn_manage_link') }}</a>
                </template>
                <span v-else style="color: var(--td-text-color-placeholder);">-</span>
                <div class="limit-mode-desc">{{ $t('page.host.cdn_trusted_ips_tips') }}</div>
              </div>
            </t-form-item>
            <!-- 真实IP头名：指定头模式必填；CDN预设模式选填(留空用厂商默认头，填了可覆盖，
                 例如在 EdgeOne 控制台开了自定义「客户端IP头部」的场景) -->
            <t-form-item v-if="showIpRealHeader" :label="$t('page.host.ip_real_header')" name="ip_real_header">
              <div>
                <t-input :style="{ width: '320px' }" v-model="formData.ip_real_header"
                         :placeholder="cdnDefaultHeader || 'X-Real-IP / CF-Connecting-IP'"></t-input>
                <div v-if="formData.ip_source_mode === 'cdn_preset'" class="limit-mode-desc">
                  {{ $t('page.host.ip_real_header_cdn_desc', { header: cdnDefaultHeader || '-' }) }}
                </div>
              </div>
            </t-form-item>
            <t-form-item v-if="formData.ip_mode === 'proxy' && formData.ip_source_mode === 'xff_depth'" :label="$t('page.host.ip_trust_depth')" name="ip_trust_depth">
              <t-input-number :style="{ width: '150px' }" v-model="formData.ip_trust_depth" :min="1" theme="column" />
            </t-form-item>
            <!-- 可信代理网段：三种加固模式都用得上(header 校验来源、xff_depth 跳过可信 hop、
                 cdn_preset 在厂商无法自动拉取回源段时手填兜底) -->
            <t-form-item v-if="showIpTrustProxies"
                         :label="$t('page.host.ip_trust_proxies')" name="ip_trust_proxies">
              <div>
                <t-textarea :style="{ width: '320px' }" v-model="formData.ip_trust_proxies"
                            placeholder="172.16.0.0/12,10.0.0.0/8"></t-textarea>
                <!-- cdn_preset 且中心库没拉到回源段时，这里就是唯一的可信来源，必须填 -->
                <div v-if="cdnTrustProxiesRequired" style="color: var(--td-error-color);">
                  {{ $t('page.host.ip_trust_proxies_required') }}
                </div>
                <div class="limit-mode-desc">{{ ipTrustProxiesDesc }}</div>
              </div>
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
            <t-form-item :label="$t('page.host.response_buffering.label')" name="is_enable_response_buffering">
              <t-tooltip class="placement top center"
                         :content="$t('page.host.response_buffering.tips')" placement="top"
                         :overlay-style="{ width: '260px' }" show-arrow>
                <t-radio-group v-model="formData.is_enable_response_buffering">
                  <t-radio value="1">{{ $t('page.host.response_buffering.enable') }}</t-radio>
                  <t-radio value="0">{{ $t('page.host.response_buffering.disable') }}</t-radio>
                </t-radio-group>
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
              <t-icon name="user-password" style="margin-right: 4px;color:#0052d9"/>
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
            <t-form-item v-if="formData.is_enable_http_auth_base === '1' && formData.http_auth_base_type === 'custom'">
              <t-alert theme="info" :close="false">
                <div>
                  <div style="margin-bottom: 8px;"><strong>{{$t('page.host.http_auth_custom_page_tips_title')}}</strong></div>
                  <div>1. {{$t('page.host.http_auth_custom_page_tips_path')}}</div>
                  <div>2. {{$t('page.host.http_auth_custom_page_tips_lock')}}</div>
                  <div>3. {{$t('page.host.http_auth_custom_page_tips_global')}}</div>
                  <div>4. {{$t('page.host.http_auth_custom_page_tips_validate')}}</div>
                </div>
              </t-alert>
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
              <t-icon name="activity" style="margin-right: 4px;color:#00a870"/>
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
              <t-icon name="hard-disk-storage" style="margin-right: 4px;color:#0052d9"/>
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
              <t-icon name="arrow-up-circle" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_custom_headers')}}
            </template>
            <custom-headers-config :custom-headers-config="customHeadersConfigData" @update="val => customHeadersConfigData = val"></custom-headers-config>
          </t-tab-panel>
          <t-tab-panel :value="13">
            <template #label>
              <t-icon name="arrow-down-circle" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_custom_response_headers')}}
            </template>
            <custom-response-headers-config :custom-response-headers-config="customResponseHeadersConfigData" @update="val => customResponseHeadersConfigData = val"></custom-response-headers-config>
          </t-tab-panel>
          <t-tab-panel :value="14">
            <template #label>
              <t-icon name="file-paste" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_response_compress')}}
            </template>
            <response-compress-config :response-compress-config="responseCompressConfigData" @update="val => responseCompressConfigData = val"></response-compress-config>
          </t-tab-panel>
          <t-tab-panel :value="16">
            <template #label>
              <t-icon name="lock-on" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_cookie_security')}}
            </template>
            <cookie-security-config :cookie-security-config="cookieSecurityConfigData" @update="val => cookieSecurityConfigData = val"></cookie-security-config>
          </t-tab-panel>
          <t-tab-panel :value="17">
            <template #label>
              <t-icon name="secured" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_csrf')}}
            </template>
            <csrf-config :csrf-config="csrfConfigData" @update="val => csrfConfigData = val"></csrf-config>
          </t-tab-panel>
          <t-tab-panel :value="18">
            <template #label>
              <t-icon name="verify" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_tamper')}}
            </template>
            <tamper-config :tamper-config="tamperConfigData" :prop-host-code="formData.code" :prop-host="formData.host" :prop-bind-more-host="formData.bind_more_host" @update="val => tamperConfigData = val"></tamper-config>
          </t-tab-panel>
          <t-tab-panel :value="19">
            <template #label>
              <t-icon name="file-safety" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_upload_security')}}
            </template>
            <upload-security-config :upload-security-config="uploadSecurityConfigData" @update="val => uploadSecurityConfigData = val"></upload-security-config>
          </t-tab-panel>
          <t-tab-panel :value="20">
            <template #label>
              <t-icon name="user-safety" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_access')}}
            </template>
            <access-config :access-config="accessConfigData"
                           :cache-enabled="cacheConfigData && String(cacheConfigData.is_enable_cache) === '1'"
                           @update="val => accessConfigData = val"></access-config>
          </t-tab-panel>
          <t-tab-panel :value="15">
            <template #label>
              <t-icon name="swap" style="margin-right: 4px;color:#0052d9"/>
              {{$t('page.host.tab_path_rule')}}
            </template>
            <path-rule-config :prop-host-code="formData.code"></path-rule-config>
          </t-tab-panel>
          </t-tabs>
        </div>

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
    <!-- 真实IP来源诊断(与访问日志页共用同一组件) -->
    <ip-source-probe-dialog :visible.sync="ipProbeVisible" :host-code="formData.code"
                            :host-name="formData.host" :can-use-header="true"
                            @use-header="useProbeHeader" />

    <!-- 就地新建分组：省得先跳去列表页建好再回来 -->
    <t-dialog :visible.sync="groupQuickAddVisible" :header="$t('page.host.group.new_group')" :width="440"
              :confirm-btn="$t('common.confirm')" :cancel-btn="$t('common.cancel')" @confirm="saveGroupQuickAdd">
      <t-form :label-width="90" colon>
        <t-form-item :label="$t('page.host.group.name')">
          <t-input v-model="groupQuickAdd.group_name" :maxlength="50" :placeholder="$t('page.host.group.name_placeholder')" />
        </t-form-item>
        <t-form-item :label="$t('page.host.group.color')">
          <div class="hg-form-colors">
            <i v-for="c in groupColorOptions" :key="c" :class="{ on: groupQuickAdd.color === c }"
               :style="{ background: c }" @click="groupQuickAdd.color = c"></i>
          </div>
        </t-form-item>
      </t-form>
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
  import ResponseCompressConfig from '../components/ResponseCompressConfig.vue';
  import CookieSecurityConfig from '../components/CookieSecurityConfig.vue';
  import CsrfConfig from '../components/CsrfConfig.vue';
  import AccessConfig from '../components/AccessConfig.vue';
  import TamperConfig from '../components/TamperConfig.vue';
  import UploadSecurityConfig from '../components/UploadSecurityConfig.vue';
  import PathRuleConfig from '../components/PathRuleConfig.vue';
  import SslForm from '../components/SslForm.vue';
  import { INITIAL_HEALTHY, INITIAL_CAPTCHA, INITIAL_ANTILEECH,INITIAL_SSL_DATA,INITIAL_CACHE,INITIAL_STATIC_SITE,INITIAL_TRANSPORT,INITIAL_CUSTOM_HEADERS,INITIAL_CUSTOM_RESPONSE_HEADERS,INITIAL_RESPONSE_COMPRESS,INITIAL_COOKIE_SECURITY,INITIAL_CSRF,INITIAL_ACCESS,INITIAL_TAMPER,INITIAL_UPLOAD_SECURITY,DEFAULT_STATIC_SECURITY_HEADERS } from '../constants';
  import {sslConfigListApi,sslConfigAddApi,sslConfigEditApi,sslConfigDetailApi} from '@/apis/sslconfig';
  import {getOrDefault} from '@/utils/usuallytool';
  import {get_detail_by_item_api, edit_system_config_by_item_api} from '@/apis/systemconfig';
  import {wafCDNProviderInfoApi} from '@/apis/cdnip';
  import {addHostGroup} from '@/apis/hostgroup';
  import IpSourceProbeDialog from '../components/IpSourceProbeDialog.vue';
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
      ResponseCompressConfig,
      CookieSecurityConfig,
      CsrfConfig,
      AccessConfig,
      TamperConfig,
      UploadSecurityConfig,
      PathRuleConfig,
      IpSourceProbeDialog,
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
      },
      // 所属分组下拉数据，由父页面统一维护并下发。
      // 走 prop 而不是本组件自己拉：弹窗只 created 一次，自己拉的话左栏新建的分组要刷新页面才看得到。
      hostGroups: {
        type: Array,
        default: () => []
      },
      // 打开时定位到哪个配置 Tab（1基础内容 4其他配置），供外部深链使用
      initTab: {
        type: Number,
        default: 0
      }
    },
    data() {
      return {
        groupColorOptions: ['#0052D9', '#2BA471', '#E37318', '#D54941', '#834EC2', '#0594FA', '#8B8B8B', '#D4A017'],
        groupQuickAddVisible: false,
        groupQuickAdd: { group_name: '', color: '#0052D9' },
        cdnProviderInfo: null, // 所选 CDN 厂商中心库状态(只读展示)
        ipProbeVisible: false,   // 真实IP来源诊断弹窗
        globalProxyHeader: '',   // 全局「获取访客IP头信息」(兼容模式下本站实际沿用的值)
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
          ai: "0",
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
        responseCompressConfigData: { ...INITIAL_RESPONSE_COMPRESS },
        cookieSecurityConfigData: { ...INITIAL_COOKIE_SECURITY },
        csrfConfigData: { ...INITIAL_CSRF, protect_methods: [...INITIAL_CSRF.protect_methods] },
        accessConfigData: { ...INITIAL_ACCESS },
        tamperConfigData: { ...INITIAL_TAMPER },
        uploadSecurityConfigData: { ...INITIAL_UPLOAD_SECURITY },
        activeTab: 1, // 当前激活的配置 Tab（受控，供防御总览开关「配置详情」跳转/外部深链，见 initTab watch）
        // Tab 布局：left=竖向（默认），top=横向；用户偏好持久化到 localStorage
        tabPlacement: localStorage.getItem('samwaf_host_tab_placement') === 'top' ? 'top' : 'left',
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
      // 真实IP来源：随所选模式返回对应解释文案(显示在下拉框下方)
      ipSourceModeDesc() {
        const map = {
          '': 'page.host.ip_source_compat_desc',
          header: 'page.host.ip_source_header_desc',
          xff_depth: 'page.host.ip_source_xff_desc',
          cdn_preset: 'page.host.ip_source_cdn_desc',
        };
        return this.$t(map[this.formData.ip_source_mode] || 'page.host.ip_source_compat_desc');
      },
      // 所选 CDN 厂商的默认真实IP头(与后端 wafenginecore/clientip/providers.go 保持一致)
      cdnDefaultHeader() {
        const map = {
          cloudflare: 'CF-Connecting-IP',
          fastly: 'Fastly-Client-IP',
          cloudfront: 'CloudFront-Viewer-Address',
          edgeone: 'EO-Connecting-IP',
          aliyun: 'Ali-Cdn-Real-Ip',
          akamai: 'True-Client-IP',
        };
        return map[this.formData.cdn_provider] || '';
      },
      // 真实IP头名输入框：指定头模式必填，CDN预设模式选填(覆盖厂商默认头)
      showIpRealHeader() {
        return this.formData.ip_mode === 'proxy' &&
          ['header', 'cdn_preset'].indexOf(this.formData.ip_source_mode) >= 0;
      },
      // 可信代理网段输入框：三种加固模式都需要
      showIpTrustProxies() {
        return this.formData.ip_mode === 'proxy' &&
          ['header', 'xff_depth', 'cdn_preset'].indexOf(this.formData.ip_source_mode) >= 0;
      },
      // cdn_preset 且中心库没拉到该厂商回源段时，可信代理网段是唯一可用的可信来源，
      // 两个都空后端会拒绝保存(否则所有请求都只能取到 CDN 回源节点IP)，提前标红提示
      cdnTrustProxiesRequired() {
        return this.formData.ip_source_mode === 'cdn_preset' &&
          this.cdnProviderInfo && !this.cdnProviderInfo.count &&
          !(this.formData.ip_trust_proxies || '').trim();
      },
      // 可信代理网段：不同模式下作用不同，分别给对应说明
      ipTrustProxiesDesc() {
        const map = {
          header: 'page.host.ip_trust_proxies_header_desc',
          xff_depth: 'page.host.ip_trust_proxies_xff_desc',
          cdn_preset: 'page.host.ip_trust_proxies_cdn_desc',
        };
        return this.$t(map[this.formData.ip_source_mode] || 'page.host.ip_trust_proxies_tips');
      },
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
      },
      // 引擎自带防护表格列
      defenseColumns() {
        return [
          { colKey: 'detection', title: this.$t('page.host.defense_col_item'), width: 220 },
          { colKey: 'status', title: this.$t('page.host.defense_col_status'), width: 220 },
          { colKey: 'op', title: this.$t('page.host.defense_col_op'), width: 120, align: 'left' },
        ];
      },
      // 引擎自带防护行（src 决定开关绑定到 defense_json 还是各子配置的 is_enable）
      defenseRows() {
        return [
          { key: 'bot', src: 'defense', label: this.$t('page.host.bot_detection'), tips: this.$t('page.host.bot_detection_tips') },
          { key: 'sqli', src: 'defense', label: this.$t('page.host.sql_injection_detection'), tips: this.$t('page.host.sql_injection_detection_tips') },
          { key: 'xss', src: 'defense', label: this.$t('page.host.xss_detection'), tips: this.$t('page.host.xss_detection_tips') },
          { key: 'scan', src: 'defense', label: this.$t('page.host.scan_detection'), tips: this.$t('page.host.scan_detection_tips') },
          { key: 'rce', src: 'defense', label: this.$t('page.host.rce_detection'), tips: this.$t('page.host.rce_detection_tips') },
          { key: 'sensitive', src: 'defense', label: this.$t('page.host.sensitive_detection'), tips: this.$t('page.host.sensitive_detection_tips') },
          { key: 'traversal', src: 'defense', label: this.$t('page.host.dir_traversal_detection'), tips: this.$t('page.host.dir_traversal_detection_tips') },
          { key: 'owaspset', src: 'defense', label: this.$t('page.host.owaspset_detection'), tips: this.$t('page.host.owaspset_detection_tips'), action: { type: 'route', name: 'OwaspManage', text: this.$t('page.host.owasp_manage_link') } },
          { key: 'ai', src: 'defense', label: this.$t('page.host.ai_detection'), tips: this.$t('page.host.ai_detection_tips'), action: { type: 'route', name: 'AIModelManage', text: this.$t('page.host.ai_manage_link') } },
          { key: 'cookie', src: 'cookie', label: this.$t('page.host.tab_cookie_security'), tips: this.$t('page.host.cookie_security.intro'), action: { type: 'tab', tab: 16 } },
          { key: 'csrf', src: 'csrf', label: this.$t('page.host.tab_csrf'), tips: this.$t('page.host.csrf.intro'), action: { type: 'tab', tab: 17 } },
          { key: 'tamper', src: 'tamper', label: this.$t('page.host.tab_tamper'), tips: this.$t('page.host.tamper.intro'), action: { type: 'tab', tab: 18 } },
          { key: 'upload', src: 'upload', label: this.$t('page.host.tab_upload_security'), tips: this.$t('page.host.upload_security.intro'), action: { type: 'tab', tab: 19 } },
        ];
      }
    },
    watch: {
      // 外部深链(如访问日志"IP提取有问题?"跳过来)指定要定位的 Tab。
      // 组件实例在弹窗打开前就已创建，data() 里取一次是取不到的，必须 watch。
      initTab: {
        immediate: true,
        handler(val) {
          if (val > 0) this.activeTab = val;
        },
      },
      // 切换 Tab 后把内容区和弹窗滚动位置复位到顶部，避免左侧导航过长时右侧内容"看起来是空的"
      activeTab() {
        this.$nextTick(() => {
          const content = this.$el.querySelector('.t-tabs__content');
          if (content) content.scrollTop = 0;
          const dialogBody = this.$el.closest && this.$el.closest('.t-dialog__body');
          if (dialogBody) dialogBody.scrollTop = 0;
        });
      },
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
          this.formData.disable_http2 = this.formData.disable_http2 != null ? this.formData.disable_http2.toString() : "0"
          this.formData.is_trans_back_domain = this.formData.is_trans_back_domain != null ? this.formData.is_trans_back_domain.toString() : "0"
          this.formData.is_enable_http_auth_base = this.formData.is_enable_http_auth_base != null ? this.formData.is_enable_http_auth_base.toString() : "0"
          this.formData.http_auth_base_type = this.formData.http_auth_base_type != null ? this.formData.http_auth_base_type : "authorization"
          this.formData.response_time_out = this.formData.response_time_out != null ? this.formData.response_time_out.toString() : "60"
          this.formData.is_enable_response_buffering = this.formData.is_enable_response_buffering != null ? this.formData.is_enable_response_buffering.toString() : "1"
          this.formData.insecure_skip_verify = this.formData.insecure_skip_verify != null ? this.formData.insecure_skip_verify.toString() : "0"
          this.formData.log_only_mode = this.formData.log_only_mode != null ? this.formData.log_only_mode.toString() : "0"
          // 保证存在且为合法值，并用 $set 确保 Vue2 对新增字段的响应式
          const ipMode = this.formData.ip_mode === 'proxy' ? 'proxy' : 'nic'
          this.$set(this.formData, 'ip_mode', ipMode)

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
              that.hostDefenseData.ai = getOrDefault(defenseData, "ai", "0");
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

          // 解析自定义响应头信息配置（兼容旧版扁平 headers 和新版 rules 格式）
          if (this.formData.custom_response_headers_json && this.formData.custom_response_headers_json !== "") {
            try {
              const parsedConfig = JSON.parse(this.formData.custom_response_headers_json);
              const isEnable = String(parsedConfig.is_enable_custom_headers !== undefined ? parsedConfig.is_enable_custom_headers : 0);
              // 旧版兼容：若只有 headers 没有 rules（或 rules 为空），转换为 global 规则
              const hasRules = Array.isArray(parsedConfig.rules) && parsedConfig.rules.length > 0;
              const hasHeaders = Array.isArray(parsedConfig.headers) && parsedConfig.headers.length > 0;
              if (hasRules) {
                this.customResponseHeadersConfigData = {
                  is_enable_custom_headers: isEnable,
                  rules: parsedConfig.rules
                };
              } else if (hasHeaders) {
                // 旧格式：有 headers 数组，包装成一条 global 规则
                this.customResponseHeadersConfigData = {
                  is_enable_custom_headers: isEnable,
                  rules: [{
                    rule_name: '全局默认',
                    match_type: 'global',
                    match_value: '',
                    merge_mode: 'merge',
                    headers: parsedConfig.headers
                  }]
                };
              } else {
                // 无规则无 headers：保留开关状态，rules 为空
                this.customResponseHeadersConfigData = { is_enable_custom_headers: isEnable, rules: [] };
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

          // 解析响应压缩配置
          if (this.formData.response_compress_json) {
            try {
              let that = this;
              if (that.formData.response_compress_json !== '') {
                const rc = JSON.parse(that.formData.response_compress_json);
                that.responseCompressConfigData = {
                  is_enable: String(rc.is_enable !== undefined ? rc.is_enable : 0),
                  prefer: rc.prefer || INITIAL_RESPONSE_COMPRESS.prefer,
                  min_length: String(rc.min_length !== undefined && rc.min_length !== '' ? rc.min_length : INITIAL_RESPONSE_COMPRESS.min_length),
                  include_types: rc.include_types != null ? rc.include_types : '',
                  include_extensions: rc.include_extensions != null ? rc.include_extensions : '',
                  exclude_extensions: rc.exclude_extensions != null ? rc.exclude_extensions : '',
                  exclude_paths: rc.exclude_paths != null ? rc.exclude_paths : '',
                  compress_when_static_assist: String(rc.compress_when_static_assist !== undefined ? rc.compress_when_static_assist : 0),
                };
              } else {
                that.responseCompressConfigData = { ...INITIAL_RESPONSE_COMPRESS };
              }
            } catch (e) {
              console.error('解析response_compress_json失败', e);
              this.responseCompressConfigData = { ...INITIAL_RESPONSE_COMPRESS };
            }
          } else {
            this.responseCompressConfigData = { ...INITIAL_RESPONSE_COMPRESS };
          }

          // 解析 Cookie 安全保护配置
          if (this.formData.cookie_security_json && this.formData.cookie_security_json !== '') {
            try {
              const cs = JSON.parse(this.formData.cookie_security_json);
              this.cookieSecurityConfigData = {
                is_enable: String(cs.is_enable !== undefined ? cs.is_enable : 0),
                http_only: String(cs.http_only !== undefined ? cs.http_only : 1),
                secure: String(cs.secure !== undefined ? cs.secure : 2),
                same_site: cs.same_site != null ? cs.same_site : 'Lax',
                exclude_cookies: cs.exclude_cookies != null ? cs.exclude_cookies : '',
              };
            } catch (e) {
              console.error('解析cookie_security_json失败', e);
              this.cookieSecurityConfigData = { ...INITIAL_COOKIE_SECURITY };
            }
          } else {
            this.cookieSecurityConfigData = { ...INITIAL_COOKIE_SECURITY };
          }

          // 解析 CSRF 防护配置
          if (this.formData.csrf_json && this.formData.csrf_json !== '') {
            try {
              const cf = JSON.parse(this.formData.csrf_json);
              this.csrfConfigData = {
                is_enable: String(cf.is_enable !== undefined ? cf.is_enable : 0),
                protect_methods: (cf.protect_methods != null && cf.protect_methods !== '')
                  ? String(cf.protect_methods).split(',').map(s => s.trim()).filter(s => s)
                  : ['POST', 'PUT', 'DELETE', 'PATCH'],
                allowed_origins: cf.allowed_origins != null ? cf.allowed_origins : '',
                allow_empty_ref: String(cf.allow_empty_ref !== undefined ? cf.allow_empty_ref : 1),
                exclude_paths: cf.exclude_paths != null ? cf.exclude_paths : '',
              };
            } catch (e) {
              console.error('解析csrf_json失败', e);
              this.csrfConfigData = { ...INITIAL_CSRF, protect_methods: [...INITIAL_CSRF.protect_methods] };
            }
          } else {
            this.csrfConfigData = { ...INITIAL_CSRF, protect_methods: [...INITIAL_CSRF.protect_methods] };
          }

          // 解析统一访问认证(Access 模式)配置
          // 空值必须落在 mode="0"(继承全局)：存量站点的 access_json 是空的，
          // 若误落成强制开启，用户升级后整站会立刻要求登录。
          if (this.formData.access_json && this.formData.access_json !== '') {
            try {
              const ac = JSON.parse(this.formData.access_json);
              this.accessConfigData = {
                mode: String(ac.mode !== undefined ? ac.mode : 0),
                exclude_paths: ac.exclude_paths != null ? ac.exclude_paths : '',
                require_otp: String(ac.require_otp !== undefined ? ac.require_otp : 0),
                unauth_action: ac.unauth_action != null ? ac.unauth_action : '',
                allow_ip_group_code: ac.allow_ip_group_code != null ? ac.allow_ip_group_code : '',
              };
            } catch (e) {
              console.error('解析access_json失败', e);
              this.accessConfigData = { ...INITIAL_ACCESS };
            }
          } else {
            this.accessConfigData = { ...INITIAL_ACCESS };
          }

          // 解析网页防篡改配置
          if (this.formData.tamper_json && this.formData.tamper_json !== '') {
            try {
              const tp = JSON.parse(this.formData.tamper_json);
              this.tamperConfigData = {
                is_enable: String(tp.is_enable !== undefined ? tp.is_enable : 0),
                action: tp.action || 'replace',
                max_size_kb: tp.max_size_kb !== undefined ? tp.max_size_kb : 1024,
              };
            } catch (e) {
              console.error('解析tamper_json失败', e);
              this.tamperConfigData = { ...INITIAL_TAMPER };
            }
          } else {
            this.tamperConfigData = { ...INITIAL_TAMPER };
          }

          // 解析文件上传内容检测配置
          if (this.formData.upload_security_json && this.formData.upload_security_json !== '') {
            try {
              const up = JSON.parse(this.formData.upload_security_json);
              this.uploadSecurityConfigData = {
                is_enable: String(up.is_enable !== undefined ? up.is_enable : 0),
                check_ext: String(up.check_ext !== undefined ? up.check_ext : 0),
                ext_blacklist: up.ext_blacklist || '',
                check_content: String(up.check_content !== undefined ? up.check_content : 0),
                check_magic: String(up.check_magic !== undefined ? up.check_magic : 0),
                check_size: String(up.check_size !== undefined ? up.check_size : 0),
                max_size_kb: up.max_size_kb !== undefined ? up.max_size_kb : 10240,
                over_limit_action: up.over_limit_action || 'block',
                include_paths: up.include_paths || '',
                exclude_paths: up.exclude_paths || '',
              };
            } catch (e) {
              console.error('解析upload_security_json失败', e);
              this.uploadSecurityConfigData = { ...INITIAL_UPLOAD_SECURITY };
            }
          } else {
            this.uploadSecurityConfigData = { ...INITIAL_UPLOAD_SECURITY };
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
                that.staticSiteConfigData.security_headers = (that.staticSiteConfigData.security_headers && that.staticSiteConfigData.security_headers.length > 0)
                  ? that.staticSiteConfigData.security_headers
                  : JSON.parse(JSON.stringify(DEFAULT_STATIC_SECURITY_HEADERS));
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
      this.loadGlobalProxyHeader();
      this.getHttpsRedirectConfig();
      // 编辑已有站点且为 cdn_preset 时，加载所选厂商中心库状态
      if (this.formData.ip_source_mode === 'cdn_preset' && this.formData.cdn_provider) {
        this.loadCdnProviderInfo(this.formData.cdn_provider);
      }
    },
    methods: {
      openGroupQuickAdd() {
        this.groupQuickAdd = { group_name: '', color: this.groupColorOptions[0] };
        this.groupQuickAddVisible = true;
      },
      saveGroupQuickAdd() {
        const name = (this.groupQuickAdd.group_name || '').trim();
        if (!name) {
          this.$message.warning(this.$t('page.host.group.name_required'));
          return;
        }
        addHostGroup({ group_name: name, color: this.groupQuickAdd.color, remarks: '' }).then((res) => {
          if (res.code === 0) {
            this.groupQuickAddVisible = false;
            // 让父页面重新拉一次分组（左栏与本下拉共用同一份数据），再回填到当前表单
            this.$emit('group-changed');
            if (res.data && res.data.group_code) {
              this.formData.group_code = res.data.group_code;
            }
          } else {
            this.$message.error(res.msg || this.$t('common.failed'));
          }
        }).catch((e) => {
          console.log(e);
        });
      },
      // CDN 厂商选择变化：加载中心库状态(只读展示)
      onCdnProviderChange(v) {
        this.cdnProviderInfo = null;
        if (v) this.loadCdnProviderInfo(v);
      },
      loadCdnProviderInfo(provider) {
        wafCDNProviderInfoApi({ provider })
          .then((res) => { if (res.code === 0) this.cdnProviderInfo = res.data; })
          .catch((e) => { console.log(e); });
      },
      formatCdnTs(ts) {
        if (!ts) return '-';
        return new Date(ts * 1000).toLocaleString();
      },
      goCdnPage() {
        const route = this.$router.resolve({ name: 'WafCDNIP' });
        window.open(route.href, '_blank');
      },
      // 打开"真实IP来源诊断"：看最近真实到达的请求头
      openIpProbe() {
        this.ipProbeVisible = true;
      },
      // 直接把看到的头填进"真实IP头名"，省得手打错
      useProbeHeader(name) {
        this.formData.ip_real_header = name;
        if (['header', 'cdn_preset'].indexOf(this.formData.ip_source_mode) < 0) {
          this.formData.ip_source_mode = 'header';
        }
        this.ipProbeVisible = false;
        this.$message.success(this.$t('page.host.ip_probe_used_header'));
      },
      // 读全局「获取访客IP头信息」，用于兼容模式下回显"本站实际沿用的是什么"
      loadGlobalProxyHeader() {
        get_detail_by_item_api({ item: 'gwaf_proxy_header' })
          .then((res) => {
            if (res.code === 0 && res.data) {
              this.globalProxyHeader = (res.data.value || '').trim();
            }
          })
          .catch((e) => { console.log(e); });
      },
      goSystemConfig() {
        const route = this.$router.resolve({ name: 'SystemConfig' });
        window.open(route.href, '_blank');
      },
      // 切换 Tab 横向/竖向布局，偏好持久化并通知父级调整弹窗宽度
      toggleTabPlacement() {
        this.tabPlacement = this.tabPlacement === 'left' ? 'top' : 'left';
        localStorage.setItem('samwaf_host_tab_placement', this.tabPlacement);
        this.$emit('tab-placement-change', this.tabPlacement);
      },
      // 引擎自带防护表格：按 row.src 读开关值（defense_json 各项 或 各子配置的 is_enable）
      getDefenseValue(row) {
        switch (row.src) {
          case 'cookie': return this.cookieSecurityConfigData.is_enable;
          case 'csrf': return this.csrfConfigData.is_enable;
          case 'tamper': return this.tamperConfigData.is_enable;
          case 'upload': return this.uploadSecurityConfigData.is_enable;
          default: return this.hostDefenseData[row.key];
        }
      },
      // 引擎自带防护表格：按 row.src 写开关值
      setDefenseValue(row, val) {
        switch (row.src) {
          case 'cookie': this.cookieSecurityConfigData.is_enable = val; break;
          case 'csrf': this.csrfConfigData.is_enable = val; break;
          case 'tamper': this.tamperConfigData.is_enable = val; break;
          case 'upload':
            this.uploadSecurityConfigData.is_enable = val;
            // 一键开启时若四个检测维度全关，自动套用推荐策略（否则总开关开了也不检测）
            if (val === '1') {
              const u = this.uploadSecurityConfigData;
              const allOff = ['check_ext', 'check_content', 'check_magic', 'check_size']
                .every(k => String(u[k]) !== '1');
              if (allOff) {
                u.check_ext = '1';
                u.check_content = '1';
                u.check_magic = '1';
                u.check_size = '1';
                u.over_limit_action = u.over_limit_action || 'block';
                u.max_size_kb = u.max_size_kb || 10240;
              }
            }
            break;
          default: this.hostDefenseData[row.key] = val; break;
        }
      },
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
            postdata['disable_http2'] = Number(postdata['disable_http2']);
            postdata['is_trans_back_domain'] = Number(postdata['is_trans_back_domain']);
            postdata['is_enable_http_auth_base'] = Number(postdata['is_enable_http_auth_base']);
            postdata['response_time_out'] = Number(postdata['response_time_out']);
            postdata['is_enable_response_buffering'] = Number(postdata['is_enable_response_buffering']);
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
              owaspset: parseInt(this.hostDefenseData.owaspset),
              ai: parseInt(this.hostDefenseData.ai)
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

            const rcData = {
              is_enable: parseInt(this.responseCompressConfigData.is_enable, 10) || 0,
              prefer: this.responseCompressConfigData.prefer || 'br_first',
              min_length: parseInt(this.responseCompressConfigData.min_length, 10) || 256,
              include_types: this.responseCompressConfigData.include_types || '',
              include_extensions: this.responseCompressConfigData.include_extensions || '',
              exclude_extensions: this.responseCompressConfigData.exclude_extensions || '',
              exclude_paths: this.responseCompressConfigData.exclude_paths || '',
              compress_when_static_assist: parseInt(this.responseCompressConfigData.compress_when_static_assist, 10) || 0,
            };
            postdata['response_compress_json'] = JSON.stringify(rcData);

            // 处理 Cookie 安全保护配置
            postdata['cookie_security_json'] = JSON.stringify({
              is_enable: parseInt(this.cookieSecurityConfigData.is_enable, 10) || 0,
              http_only: parseInt(this.cookieSecurityConfigData.http_only, 10) || 0,
              secure: parseInt(this.cookieSecurityConfigData.secure, 10) || 0,
              same_site: this.cookieSecurityConfigData.same_site || '',
              exclude_cookies: this.cookieSecurityConfigData.exclude_cookies || '',
            });

            // 处理 CSRF 防护配置
            postdata['csrf_json'] = JSON.stringify({
              is_enable: parseInt(this.csrfConfigData.is_enable, 10) || 0,
              protect_methods: Array.isArray(this.csrfConfigData.protect_methods)
                ? this.csrfConfigData.protect_methods.join(',')
                : (this.csrfConfigData.protect_methods || 'POST,PUT,DELETE,PATCH'),
              allowed_origins: this.csrfConfigData.allowed_origins || '',
              allow_empty_ref: parseInt(this.csrfConfigData.allow_empty_ref, 10) || 0,
              exclude_paths: this.csrfConfigData.exclude_paths || '',
            });

            // 处理统一访问认证(Access 模式)配置
            postdata['access_json'] = JSON.stringify({
              mode: parseInt(this.accessConfigData.mode, 10) || 0,
              exclude_paths: this.accessConfigData.exclude_paths || '',
              require_otp: parseInt(this.accessConfigData.require_otp, 10) || 0,
              unauth_action: this.accessConfigData.unauth_action || '',
              allow_ip_group_code: this.accessConfigData.allow_ip_group_code || '',
            });

            // 处理网页防篡改配置
            postdata['tamper_json'] = JSON.stringify({
              is_enable: parseInt(this.tamperConfigData.is_enable, 10) || 0,
              action: this.tamperConfigData.action || 'replace',
              max_size_kb: parseInt(this.tamperConfigData.max_size_kb, 10) || 1024,
            });

            // 处理文件上传内容检测配置
            postdata['upload_security_json'] = JSON.stringify({
              is_enable: parseInt(this.uploadSecurityConfigData.is_enable, 10) || 0,
              check_ext: parseInt(this.uploadSecurityConfigData.check_ext, 10) || 0,
              ext_blacklist: this.uploadSecurityConfigData.ext_blacklist || '',
              check_content: parseInt(this.uploadSecurityConfigData.check_content, 10) || 0,
              check_magic: parseInt(this.uploadSecurityConfigData.check_magic, 10) || 0,
              check_size: parseInt(this.uploadSecurityConfigData.check_size, 10) || 0,
              max_size_kb: parseInt(this.uploadSecurityConfigData.max_size_kb, 10) || 10240,
              over_limit_action: this.uploadSecurityConfigData.over_limit_action || 'block',
              include_paths: this.uploadSecurityConfigData.include_paths || '',
              exclude_paths: this.uploadSecurityConfigData.exclude_paths || '',
            });

            // 处理静态网站配置
            let staticSiteData = {
              is_enable_static_site: parseInt(this.staticSiteConfigData.is_enable_static_site),
              static_site_path: this.staticSiteConfigData.static_site_path,
              static_site_prefix: this.staticSiteConfigData.static_site_prefix,
              sensitive_paths: this.staticSiteConfigData.sensitive_paths,
              sensitive_extensions: this.staticSiteConfigData.sensitive_extensions,
              allowed_extensions: this.staticSiteConfigData.allowed_extensions,
              sensitive_patterns: this.staticSiteConfigData.sensitive_patterns,
              security_headers: this.staticSiteConfigData.security_headers
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

            // 自定义响应头信息配置（V2 rules 格式，兼容旧版 headers 字段）
            const crConfig = this.customResponseHeadersConfigData || {};
            let crRules = crConfig.rules || [];
            // 防御：若 rules 为空但旧版 headers 存在，自动转为 global 规则（避免数据丢失）
            if (crRules.length === 0 && Array.isArray(crConfig.headers) && crConfig.headers.length > 0) {
              crRules = [{
                rule_name: '全局默认',
                match_type: 'global',
                match_value: '',
                merge_mode: 'merge',
                headers: crConfig.headers
              }];
            }
            const customResponseHeadersData = {
              is_enable_custom_headers: parseInt(crConfig.is_enable_custom_headers || INITIAL_CUSTOM_RESPONSE_HEADERS.is_enable_custom_headers),
              rules: crRules
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

<style scoped>
/* 切换 Tab 布局按钮独占一行、右对齐，避免遮挡标签或内容 */
.tab-placement-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 2px;
}
/* 竖向布局：限制整体高度，左侧导航与右侧内容各自独立滚动；
   否则导航过长会把弹窗撑高，切换靠下的 Tab 时内容在顶部，看起来像空的 */
.host-tabs-wrapper--left >>> .t-tabs__header,
.host-tabs-wrapper--left >>> .t-tabs__content {
  max-height: 65vh;
  overflow-y: auto;
  /* 滚动条平时隐藏、悬停才显示，避免左右两根粗滚动条并排刺眼 */
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
.host-tabs-wrapper--left >>> .t-tabs__header:hover,
.host-tabs-wrapper--left >>> .t-tabs__content:hover {
  scrollbar-color: rgba(0, 0, 0, 0.25) transparent;
}
.host-tabs-wrapper--left >>> .t-tabs__header::-webkit-scrollbar,
.host-tabs-wrapper--left >>> .t-tabs__content::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.host-tabs-wrapper--left >>> .t-tabs__header::-webkit-scrollbar-thumb,
.host-tabs-wrapper--left >>> .t-tabs__content::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
}
.host-tabs-wrapper--left >>> .t-tabs__header:hover::-webkit-scrollbar-thumb,
.host-tabs-wrapper--left >>> .t-tabs__content:hover::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.25);
}
.host-tabs-wrapper--left >>> .t-tabs__header::-webkit-scrollbar-track,
.host-tabs-wrapper--left >>> .t-tabs__content::-webkit-scrollbar-track,
.host-tabs-wrapper--left >>> .t-tabs__header::-webkit-scrollbar-button,
.host-tabs-wrapper--left >>> .t-tabs__content::-webkit-scrollbar-button {
  display: none;
}
.ip-probe-entry {
  margin-top: 4px;
}
.ip-source-block {
  /* t-form-item 内容区是 flex 行，这里独占一整行并让内部元素纵向排布，
     否则下拉框/说明/提示条会被挤成一列一列的窄条 */
  flex: 1 1 100%;
  min-width: 0;
  width: 100%;
}
.ip-source-scope {
  margin-top: 8px;
  max-width: 620px;
}
.host-form-ip-mode-help-icon {
  margin-left: 6px;
  vertical-align: middle;
  cursor: help;
  color: var(--td-text-color-secondary, rgba(0, 0, 0, 0.55));
}
.hg-form-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
}
.hg-form-new {
  margin-left: 10px;
  font-size: 12px;
  color: var(--td-brand-color, #0052d9);
  cursor: pointer;
}
.hg-form-colors {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  height: 32px;
}
.hg-form-colors i {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  display: inline-block;
}
.hg-form-colors i.on {
  border-color: var(--td-text-color-primary, rgba(0, 0, 0, 0.9));
}
.hg-form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: var(--td-text-color-placeholder, rgba(0, 0, 0, 0.35));
}
</style>
