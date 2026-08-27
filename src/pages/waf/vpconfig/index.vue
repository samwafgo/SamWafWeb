<template>
    <div class="vpconfig-page">
      <!-- 顶栏：页面标题 + 常驻「重启管理端」。
           这页有八节，任何一节改完都可能要重启；按钮跟着某张卡走的话，
           用户滚到别处就找不着了，所以提到页面级、固定在右上角 -->
      <div class="vpconfig-bar" :style="{ top: stickyTop + 'px' }">
        <div class="vpconfig-bar__title">{{ $t('page.vpconfig.title') }}</div>
        <t-tag v-if="activeSectionLabel" theme="primary" variant="light">
          {{ $t('page.vpconfig.nav_current') }}{{ activeSectionLabel }}
        </t-tag>
        <div class="vpconfig-bar__gap"></div>
        <span v-if="restartPending" class="vpconfig-bar__hint">● {{ $t('page.vpconfig.restart_pending_short') }}</span>
        <t-button :theme="restartPending ? 'warning' : 'default'" @click="showRestartDialog">
          {{ $t('page.vpconfig.restart_manager') }}
        </t-button>
      </div>

      <!-- 整页说明：条目大多是"操作完为什么没生效""浏览器为什么报不安全"这类跨小节的问题，
           挂在某一张卡里反而找不着；固定走右侧抽屉，顶部只占一行 -->
      <help-block
        class="vpconfig-help"
        mode="drawer"
        :summary="$t('page.vpconfig.page_help_summary')"
        :items="accessHelpItems"
        :note="$t('page.vpconfig.access_help_note')"
        :title="$t('page.vpconfig.page_help_title')"
        doc="guide/VpConfig"
        :links="[{ label: $t('page.vpconfig.access_doc_localca'), doc: 'guide/VpConfig#_3-2-本地证书-没有域名时用' },
                 { label: $t('page.vpconfig.access_doc_import'), doc: 'guide/VpConfig#导入根证书' },
                 { label: $t('page.vpconfig.access_doc_faq'), doc: 'faq/#_3-4-证书配错-开了-仅允许https-打不开管理端怎么办' }]"
        storage-key="vpconfig-page"
      />

      <div class="vpconfig-body">
        <!-- 左侧只做定位，不切换内容：右侧始终是完整的一页。
             这几节配置彼此相关（改访问方式常要顺带看证书、改可信代理常要看白名单），
             做成路由式分页会失去全貌，所以用锚点 -->
        <div class="vpconfig-nav" :style="{ top: anchorOffset + 'px' }">
          <div class="vpconfig-nav__title">{{ $t('page.vpconfig.nav_title') }}</div>
          <a
            v-for="s in visibleSections"
            :key="s.id"
            class="vpconfig-nav__item"
            :class="{ 'is-active': activeSection === s.id, 'is-dirty': s.dirty }"
            @click="jumpTo(s.id)"
          >
            <i class="vpconfig-nav__dot"></i>
            <span class="vpconfig-nav__text">{{ s.label }}</span>
          </a>
        </div>

        <div class="vpconfig-content">
      <t-card id="vp-sec-ip" class="list-card-container" :style="sectionStyle">
        <template #header>
          <t-row justify="space-between">
            <div class="card-header-title">
              <t-space>
                <div>{{ $t('page.vpconfig.ip_whitelist') }}</div>
                <t-tooltip :content="$t('page.vpconfig.ip_whitelist_tips')">
                  <t-icon name="help-circle" />
                </t-tooltip>
              </t-space>
            </div>
            <t-space>
              <t-button theme="primary" @click="handleRefresh">{{ $t('common.refresh') }}</t-button>
              <t-button theme="primary" @click="showConfirmDialog">{{ $t('common.save') }}</t-button>
            </t-space>
          </t-row>
        </template>

        <t-loading :loading="dataLoading">
          <t-form ref="form" :data="formData" :rules="rules" :label-width="180">
            <t-form-item :label="$t('page.vpconfig.ip_whitelist')" name="ip_whitelist">
              <t-textarea
                v-model="formData.ip_whitelist"
                :placeholder="$t('page.vpconfig.ip_whitelist_placeholder')"
                :autosize="{ minRows: 5, maxRows: 10 }"
              />
              <div class="form-item-tips">{{ $t('page.vpconfig.ip_whitelist_tips') }}</div>
            </t-form-item>
          </t-form>
        </t-loading>
      </t-card>

      <!-- 管理端可信代理网段卡片 -->
      <t-card id="vp-sec-proxy" class="list-card-container" :style="sectionStyle">
        <template #header>
          <t-row justify="space-between">
            <div class="card-header-title">
              <t-space>
                <div>{{ $t('page.vpconfig.trusted_proxies_title') }}</div>
                <t-tooltip :content="$t('page.vpconfig.trusted_proxies_description')">
                  <t-icon name="help-circle" />
                </t-tooltip>
              </t-space>
            </div>
            <t-space>
              <t-button theme="primary" @click="handleTrustedProxiesRefresh">{{ $t('common.refresh') }}</t-button>
              <t-button theme="primary" @click="handleTrustedProxiesSave">{{ $t('common.save') }}</t-button>
            </t-space>
          </t-row>
        </template>

        <t-loading :loading="trustedProxiesLoading">
          <t-alert theme="info" :message="$t('page.vpconfig.trusted_proxies_union_tip')" style="margin-bottom: 12px;" />
          <t-form :data="trustedProxiesFormData" :label-width="180">
            <t-form-item :label="$t('page.vpconfig.manage_proxy_enable')">
              <t-switch v-model="enableManageProxy" @change="onEnableManageProxyChange" />
              <div class="form-item-tips">{{ $t('page.vpconfig.manage_proxy_enable_tips') }}</div>
            </t-form-item>
            <t-form-item v-if="enableManageProxy" :label="$t('page.vpconfig.manage_proxy_header')">
              <t-input
                v-model="manageProxyHeader"
                :placeholder="$t('page.vpconfig.manage_proxy_header_placeholder')"
                clearable
              />
              <div class="proxy-header-presets">
                <span class="preset-label">{{ $t('page.vpconfig.manage_proxy_header_quickfill') }}</span>
                <t-tag
                  v-for="p in proxyHeaderPresets"
                  :key="p.value"
                  size="small"
                  variant="outline"
                  theme="primary"
                  style="cursor: pointer; margin: 2px 6px 2px 0;"
                  @click="addProxyHeaderToken(p.value)"
                >{{ p.label }}</t-tag>
                <t-tag
                  size="small"
                  variant="outline"
                  theme="default"
                  style="cursor: pointer; margin: 2px 0;"
                  @click="manageProxyHeader = ''"
                >{{ $t('page.vpconfig.manage_proxy_header_clear') }}</t-tag>
              </div>
              <div class="form-item-tips">{{ $t('page.vpconfig.manage_proxy_header_tips') }}</div>
            </t-form-item>
            <t-form-item v-if="enableManageProxy" :label="$t('page.vpconfig.manage_cdn_provider')">
              <t-space>
                <t-select v-model="manageCdnProvider" :style="{ width: '240px' }"
                          :placeholder="$t('page.vpconfig.manage_cdn_provider_placeholder')" clearable
                          @change="handleManageCdnProviderChange">
                  <t-option value="cloudflare" label="Cloudflare" />
                  <t-option value="fastly" label="Fastly" />
                  <t-option value="cloudfront" label="AWS CloudFront" />
                  <t-option value="edgeone" label="腾讯云 EdgeOne" />
                  <t-option value="aliyun" label="阿里云 CDN" />
                  <t-option value="akamai" label="Akamai" />
                </t-select>
                <span v-if="manageCdnInfo && manageCdnProvider">
                  <span v-if="manageCdnInfo.count > 0" style="color: var(--td-success-color);">
                    {{ $t('page.vpconfig.manage_cdn_downloaded', { count: manageCdnInfo.count }) }}
                  </span>
                  <span v-else style="color: var(--td-warning-color);">{{ $t('page.vpconfig.manage_cdn_not_fetched') }}</span>
                </span>
                <a class="t-button-link" @click="goCdnPage">{{ $t('page.vpconfig.manage_cdn_link') }}</a>
              </t-space>
              <div class="form-item-tips">{{ $t('page.vpconfig.manage_cdn_provider_tips') }}</div>
            </t-form-item>
            <t-form-item v-if="enableManageProxy" :label="$t('page.vpconfig.trusted_proxies')">
              <t-textarea
                v-model="trustedProxiesFormData.trusted_proxies"
                :placeholder="$t('page.vpconfig.trusted_proxies_placeholder')"
                :autosize="{ minRows: 3, maxRows: 8 }"
              />
              <div class="form-item-tips">{{ $t('page.vpconfig.trusted_proxies_tips') }}</div>
            </t-form-item>
          </t-form>
        </t-loading>
      </t-card>

      <!-- CORS 跨域白名单卡片 -->
      <t-card id="vp-sec-cors" class="list-card-container" :style="sectionStyle">
        <template #header>
          <t-row justify="space-between">
            <div class="card-header-title">
              <t-space>
                <div>{{ $t('page.vpconfig.cors_title') }}</div>
                <t-tooltip :content="$t('page.vpconfig.cors_description')">
                  <t-icon name="help-circle" />
                </t-tooltip>
              </t-space>
            </div>
            <t-space>
              <t-button theme="primary" @click="handleCorsRefresh">{{ $t('common.refresh') }}</t-button>
              <t-button theme="primary" @click="handleCorsSave">{{ $t('common.save') }}</t-button>
            </t-space>
          </t-row>
        </template>

        <t-loading :loading="corsLoading">
          <t-form :data="corsFormData" :label-width="180">
            <t-form-item :label="$t('page.vpconfig.cors_origins')">
              <t-textarea
                v-model="corsFormData.cors_allow_origins"
                :placeholder="$t('page.vpconfig.cors_placeholder')"
                :autosize="{ minRows: 3, maxRows: 8 }"
              />
              <div class="form-item-tips">{{ $t('page.vpconfig.cors_tips') }}</div>
            </t-form-item>
          </t-form>
        </t-loading>
      </t-card>

      <!-- 域名白名单卡片 -->
      <t-card id="vp-sec-domain" class="list-card-container" :style="sectionStyle">
        <template #header>
          <t-row justify="space-between">
            <div class="card-header-title">
              <t-space>
                <div>{{ $t('page.vpconfig.domain_whitelist_title') }}</div>
                <t-tooltip :content="$t('page.vpconfig.domain_whitelist_description')">
                  <t-icon name="help-circle" />
                </t-tooltip>
              </t-space>
            </div>
            <t-space>
              <t-button theme="primary" @click="handleDomainRefresh">{{ $t('common.refresh') }}</t-button>
              <t-button theme="primary" @click="showDomainConfirmDialog">{{ $t('common.save') }}</t-button>
            </t-space>
          </t-row>
        </template>

        <t-loading :loading="domainLoading">
          <t-form :data="domainFormData" :label-width="180">
            <t-form-item :label="$t('page.vpconfig.domain_whitelist')">
              <t-textarea
                v-model="domainFormData.domain_whitelist"
                :placeholder="$t('page.vpconfig.domain_whitelist_placeholder')"
                :autosize="{ minRows: 3, maxRows: 8 }"
              />
              <div class="form-item-tips">{{ $t('page.vpconfig.domain_whitelist_tips') }}</div>
            </t-form-item>
          </t-form>
        </t-loading>
      </t-card>

      <!-- ===== 访问方式：讲端口与协议，与证书本身分开 ===== -->
      <!-- ===== 管理端访问与证书：同一件事的两半，合成一节 =====
           访问方式决定"要不要 HTTPS"，证书决定"HTTPS 起不起得来"。原先拆成两张卡，
           证书那张还挂着 v-if(ssl_enable)——没开 SSL 就不显示，第一次配置的人从头到尾
           看不到"还得配证书"这一步；而且"清除本地证书"要求先切回仅HTTP，一切回去
           整个证书区就消失了，那颗按钮永远够不着。合并后编号成两步，缺哪步一眼可见。 -->
      <t-card id="vp-sec-access" class="list-card-container" :style="sectionStyle">
        <template #header>
          <t-row justify="space-between" align="middle">
            <div class="card-header-title">
              <t-space align="center">
                <div>{{ $t('page.vpconfig.access_cert_title') }}</div>
                <t-tooltip :content="$t('page.vpconfig.access_description')">
                  <t-icon name="help-circle" />
                </t-tooltip>
                <t-tag>{{ $t('page.vpconfig.access_current_is') }}{{ accessModeLabel(savedAccessMode) }}</t-tag>
              </t-space>
            </div>
            <!-- 改动先攒着，点这里才写进 conf/config.yml。
                 原先是拨一下开关立刻发请求——用户还在犹豫，配置文件已经改了 -->
            <t-space align="center">
              <span v-if="accessDirty" class="access-dirty">● {{ $t('page.vpconfig.access_unsaved') }}</span>
              <t-button theme="primary" :disabled="!accessDirty || sslLoading" @click="handleSaveAccessMode">
                {{ $t('page.vpconfig.access_save') }}
              </t-button>
            </t-space>
          </t-row>
        </template>

        <t-loading :loading="sslLoading">
          <!-- 本次访问：常驻不可关闭。顶部横幅可按会话收起，这条不行——
               收起横幅不该等于信息消失，这里是它唯一"不消失"的落点。回环访问同样显示。 -->
          <t-alert :theme="transportUpstreamTls ? 'warning' : 'info'" class="access-now">
            <template #title>
              {{ $t('page.vpconfig.transport_status') }}:
              <template v-if="transportSecure">{{ $t('page.vpconfig.transport_status_https') }}</template>
              <template v-else-if="transportUpstreamTls">{{ $t('page.vpconfig.transport_status_upstream') }}</template>
              <template v-else-if="transportLoopback">{{ $t('page.vpconfig.transport_status_loopback') }}</template>
              <template v-else>{{ $t('page.vpconfig.transport_status_http') }}</template>
            </template>
            <template #message>{{ transportStatusTips }}</template>
          </t-alert>

          <!-- 第 1 步：访问方式。ssl_enable 与 force_https 两个 bool 的四种组合里有一种
               无意义（force 开着而 enable 关着，后端只会警告并忽略），三选一把它从界面上
               消掉，也让每一项能把后果直接写在旁边 -->
          <div class="step">
            <div class="step__t"><span class="step__n">1</span>{{ $t('page.vpconfig.access_step1') }}</div>
            <div class="step__d">{{ $t('page.vpconfig.access_step1_desc') }}</div>
            <div class="step__c">
              <div class="acc-opts">
                <div
                  v-for="o in accessOptions"
                  :key="o.key"
                  :class="['acc-opt', { 'acc-opt--on': pickedAccessMode === o.key }]"
                  @click="pickAccessMode(o.key)"
                >
                  <i class="acc-opt__rd"></i>
                  <div class="acc-opt__bd">
                    <div class="acc-opt__h">
                      <span>{{ $t(o.title) }}</span>
                      <t-tag size="small" :theme="o.tagTheme">{{ $t(o.tag) }}</t-tag>
                    </div>
                    <div class="acc-opt__s">{{ $t(o.desc) }}</div>
                    <div v-if="o.warn && pickedAccessMode === o.key && !certUsable" class="acc-opt__w">
                      {{ $t(o.warn) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 第 2 步：证书。不按访问方式条件隐藏——先配证书再切协议才是更稳的顺序 -->
          <div :class="['step', { 'step--dim': pickedAccessMode === 'http' }]">
            <div class="step__t">
              <span :class="['step__n', certStepClass]">{{ certStepDone ? '✓' : '2' }}</span>
              <span>{{ $t('page.vpconfig.access_step2') }}</span>
              <t-tag v-if="certSource === 'none'" theme="warning">{{ $t('page.vpconfig.cert_unconfigured') }}</t-tag>
              <t-tag v-else-if="certProblem" theme="danger">{{ $t('page.vpconfig.cert_unusable') }}</t-tag>
              <t-tag v-else theme="success">{{ $t('page.vpconfig.cert_configured') }}</t-tag>
            </div>
            <div class="step__d">{{ certStepDesc }}</div>
            <div class="step__c">
              <!-- 当前证书摘要：把原先散在三处的"证书状态/本地证书/绑定证书夹"合成一条 -->
              <div v-if="certSource === 'none'" :class="['cert-current', 'cert-current--empty', { 'cert-current--bad': pickedAccessMode !== 'http' }]">
                <div>{{ $t('page.vpconfig.cert_empty_title') }}</div>
                <div class="form-item-tips" style="margin-top: 6px">{{ $t('page.vpconfig.cert_empty_tips') }}</div>
              </div>

              <div v-else class="cert-current">
                <div class="cert-current__top">
                  <b>{{ certSummary.name }}</b>
                  <t-tag theme="success">{{ $t('page.vpconfig.cert_in_use') }}</t-tag>
                  <t-tag>{{ $t('page.vpconfig.cert_source') }}: {{ certSourceLabel }}</t-tag>
                  <t-tag :theme="certAutoRenew ? 'success' : 'warning'">
                    {{ certAutoRenew ? $t('page.vpconfig.cert_auto_renew') : $t('page.vpconfig.cert_manual_renew') }}
                  </t-tag>
                </div>
                <div class="cert-current__meta">
                  <span v-for="(m, i) in certSummary.meta" :key="i">
                    <i>{{ m.k }}</i>{{ m.v }}
                  </span>
                </div>
                <div class="cert-current__acts">
                  <t-button v-if="certSource === 'local'" theme="default" size="small" @click="handleDownloadLocalCa">
                    {{ $t('page.vpconfig.local_cert_download_ca') }}
                  </t-button>
                  <t-button v-if="certSource === 'local'" theme="default" size="small" :loading="localCertLoading" @click="handleGenerateLocalCert">
                    {{ $t('page.vpconfig.cert_renew_now') }}
                  </t-button>
                  <t-button theme="default" size="small" @click="openChangeCert(certSource)">
                    {{ $t('page.vpconfig.cert_change_current') }}
                  </t-button>
                </div>
              </div>

              <div class="cert-divider"></div>

              <!-- 更换证书：默认收起，日常进来只看到上面那条摘要 -->
              <div v-if="!changeCertOpen">
                <t-space align="center">
                  <t-button theme="default" @click="openChangeCert()">{{ $t('page.vpconfig.cert_change') }}</t-button>
                  <span class="form-item-tips">{{ $t('page.vpconfig.cert_change_tips') }}</span>
                </t-space>
              </div>

              <div v-else>
                <t-row justify="space-between" align="middle" style="margin-bottom: 12px">
                  <b>{{ $t('page.vpconfig.cert_pick_source') }}</b>
                  <t-button variant="text" theme="primary" @click="changeCertOpen = false">
                    {{ $t('page.vpconfig.cert_collapse') }}
                  </t-button>
                </t-row>

                <!-- 三张选择卡：把"我该走哪条路"的判断依据并排摆出来 -->
                <div class="cert-choices">
                  <div
                    v-for="c in certChoices"
                    :key="c.key"
                    :class="['cert-choice', { 'cert-choice--on': pickedSource === c.key }]"
                    @click="pickedSource = c.key"
                  >
                    <div class="cert-choice__title">
                      <span>{{ $t(c.title) }}</span>
                      <t-tag size="small" :theme="c.auto ? 'success' : 'warning'">
                        {{ c.auto ? $t('page.vpconfig.cert_auto_renew') : $t('page.vpconfig.cert_manual_renew') }}
                      </t-tag>
                    </div>
                    <div class="cert-choice__who">{{ $t(c.who) }}</div>
                    <ul class="cert-choice__list">
                      <li v-for="(li, i) in c.points" :key="i">{{ $t(li) }}</li>
                    </ul>
                    <div class="cert-choice__foot">{{ $t(c.foot) }}</div>
                  </div>
                </div>

                <!-- 面板一：证书夹绑定（持续同步） -->
                <div v-if="pickedSource === 'folder'" class="cert-panel">
                  <div class="cert-panel__title">{{ $t('page.vpconfig.cert_folder_title') }}</div>
                  <div class="form-item-tips" style="margin-bottom: 12px">{{ $t('page.vpconfig.cert_folder_tips') }}</div>

                  <div v-if="sslBindCert.ssl_config_id" class="cert-current cert-current--bound">
                    <div class="cert-current__top">
                      <b>{{ sslBindCert.domains }}</b>
                      <t-tag theme="primary">{{ $t('page.vpconfig.ssl_bind_cert_bound') }}</t-tag>
                    </div>
                    <div class="cert-current__meta">
                      <span v-if="sslBindCert.valid_to"><i>{{ $t('page.ssl.label_valid_to') }}</i>{{ sslBindCert.valid_to }}</span>
                    </div>
                  </div>
                  <div v-else class="cert-current cert-current--empty" style="padding: 18px">
                    {{ $t('page.vpconfig.cert_folder_unbound') }}
                  </div>

                  <t-space style="margin-top: 14px">
                    <t-button theme="primary" @click="showBindCertDialog">{{ $t('page.vpconfig.ssl_bind_cert_select') }}</t-button>
                    <t-button theme="danger" variant="outline" v-if="sslBindCert.ssl_config_id" @click="handleUnbindCert">
                      {{ $t('page.vpconfig.ssl_bind_cert_unbind') }}
                    </t-button>
                  </t-space>
                </div>

                <!-- 面板二：本机生成 -->
                <div v-if="pickedSource === 'local'" class="cert-panel">
                  <div class="cert-panel__title">{{ $t('page.vpconfig.local_cert_generate') }}</div>
                  <div class="form-item-tips" style="margin-bottom: 10px">{{ $t('page.vpconfig.local_cert_sans_intro') }}</div>
                  <t-input v-model="localCertSans" :placeholder="$t('page.vpconfig.local_cert_sans_placeholder')" />
                  <div class="form-item-tips">{{ $t('page.vpconfig.local_cert_sans_tips') }}</div>

                  <div class="cert-divider"></div>
                  <div class="form-item-tips" style="margin-bottom: 6px">{{ $t('page.vpconfig.local_cert_next_steps') }}</div>
                  <ol class="cert-steps">
                    <li>{{ $t('page.vpconfig.local_cert_step_import') }}</li>
                    <li>{{ $t('page.vpconfig.local_cert_step_restart') }}</li>
                  </ol>
                  <t-space>
                    <t-button theme="primary" :loading="localCertLoading" @click="handleGenerateLocalCert">
                      {{ $t('page.vpconfig.local_cert_do_generate') }}
                    </t-button>
                    <t-button theme="default" :disabled="!localCert.has_ca" @click="handleDownloadLocalCa">
                      {{ $t('page.vpconfig.local_cert_download_ca') }}
                    </t-button>
                  </t-space>


                  <!-- 生成后浏览器仍报「不安全」是最高频的疑问，直接把原因与操作写在页面上 -->
                  <t-alert v-if="localCert.has_ca" theme="info" class="cert-guide-alert">
                    <template #title>{{ $t('page.vpconfig.local_ca_notice_title') }}</template>
                    <template #message>
                      <div>{{ $t('page.vpconfig.local_ca_notice_body') }}</div>
                      <div v-if="localCert.ca && localCert.ca.fingerprint" class="cert-fp">
                        <div class="cert-fp__label">{{ $t('page.vpconfig.local_ca_fingerprint') }}</div>
                        <code class="cert-fp__val">{{ localCert.ca.fingerprint }}</code>
                        <div class="form-item-tips">{{ $t('page.vpconfig.local_ca_fingerprint_tips') }}</div>
                      </div>
                    </template>
                  </t-alert>

                  <t-collapse v-if="localCert.has_ca" class="cert-guide">
                    <t-collapse-panel :header="$t('page.vpconfig.local_ca_guide_title')">
                      <div class="cert-guide__intro">{{ $t('page.vpconfig.local_ca_guide_intro') }}</div>
                      <div class="cert-guide__os">{{ $t('page.vpconfig.local_ca_guide_win_title') }}</div>
                      <ul class="cert-guide__list">
                        <li>{{ $t('page.vpconfig.local_ca_guide_win1') }}</li>
                        <li class="cert-guide__key">{{ $t('page.vpconfig.local_ca_guide_win2') }}</li>
                        <li class="cert-guide__key">{{ $t('page.vpconfig.local_ca_guide_win3') }}</li>
                      </ul>
                      <ul class="cert-guide__list">
                        <li>{{ $t('page.vpconfig.local_ca_guide_mac') }}</li>
                        <li>{{ $t('page.vpconfig.local_ca_guide_linux') }}</li>
                        <li>{{ $t('page.vpconfig.local_ca_guide_firefox') }}</li>
                      </ul>
                      <div class="cert-guide__key">{{ $t('page.vpconfig.local_ca_guide_restart') }}</div>
                    </t-collapse-panel>

                    <t-collapse-panel :header="$t('page.vpconfig.local_ca_remove_title')">
                      <div class="cert-guide__intro">{{ $t('page.vpconfig.local_ca_remove_intro') }}</div>
                      <ul class="cert-guide__list">
                        <li>{{ $t('page.vpconfig.local_ca_remove_win') }}</li>
                        <li>{{ $t('page.vpconfig.local_ca_remove_mac') }}</li>
                        <li>{{ $t('page.vpconfig.local_ca_remove_linux') }}</li>
                        <li>{{ $t('page.vpconfig.local_ca_remove_firefox') }}</li>
                      </ul>
                    </t-collapse-panel>
                  </t-collapse>

                </div>

                <!-- 面板三：手工粘贴 -->
                <div v-if="pickedSource === 'manual'" class="cert-panel">
                  <div class="cert-panel__title">{{ $t('page.vpconfig.cert_manual_title') }}</div>
                  <div class="form-item-tips" style="margin-bottom: 12px">{{ $t('page.vpconfig.cert_manual_tips') }}</div>
                  <t-form :label-width="120">
                    <t-form-item :label="$t('page.vpconfig.cert_content')">
                      <t-textarea
                        v-model="certFormData.cert_content"
                        :placeholder="$t('page.vpconfig.cert_content_placeholder')"
                        :autosize="{ minRows: 5, maxRows: 10 }"
                      />
                    </t-form-item>
                    <t-form-item :label="$t('page.vpconfig.key_content')">
                      <t-textarea
                        v-model="certFormData.key_content"
                        :placeholder="$t('page.vpconfig.key_content_placeholder')"
                        :autosize="{ minRows: 5, maxRows: 10 }"
                      />
                    </t-form-item>
                  </t-form>
                  <t-space>
                    <t-button theme="primary" @click="showUploadCertDialog">{{ $t('page.vpconfig.upload_cert') }}</t-button>
                    <t-button theme="default" @click="showCertListDialog">{{ $t('page.vpconfig.select_from_certfolder') }}</t-button>
                  </t-space>
                  <div class="form-item-tips">{{ $t('page.vpconfig.cert_manual_copy_tips') }}</div>
                </div>
              </div>

              <!-- 本地 CA 的作废与清除。原先埋在「更换证书 → 本机生成」里面，要点三层才看得到，
                   而"我想把它删掉"恰恰是签完之后最常见的诉求；提到卡片底部常驻，仍然默认折叠 -->
              <div v-if="localCert.has_ca" class="cert-danger">
                <t-collapse>
                  <t-collapse-panel :header="$t('page.vpconfig.local_ca_danger_title')">
                    <div class="cert-guide__intro">{{ $t('page.vpconfig.local_ca_danger_tips') }}</div>
                    <div class="cert-guide__intro">{{ $t('page.vpconfig.local_ca_clear_precondition') }}</div>
                    <t-space>
                      <t-button theme="danger" variant="outline" :loading="localCertLoading" @click="handleRotateLocalCa">
                        {{ $t('page.vpconfig.local_ca_rotate') }}
                      </t-button>
                      <t-button theme="danger" variant="outline" @click="handleClearLocalCert">
                        {{ $t('page.vpconfig.local_ca_clear') }}
                      </t-button>
                    </t-space>
                  </t-collapse-panel>
                </t-collapse>
              </div>
            </div>
          </div>

          <!-- 状态提示统一一条：证书没配好 > 证书不可用 > 已保存待重启。
               重启按钮不在这里——全页只留顶栏右上角一个 -->
          <t-alert v-if="pickedAccessMode !== 'http' && certSource === 'none'" theme="error" class="cert-pending">
            <template #title>{{ $t('page.vpconfig.ssl_step_cert_title') }}</template>
            <template #message>
              {{ pickedAccessMode === 'only' ? $t('page.vpconfig.ssl_step_cert_body_forced') : $t('page.vpconfig.ssl_step_cert_body') }}
            </template>
          </t-alert>

          <t-alert v-else-if="pickedAccessMode !== 'http' && certProblem" theme="error" class="cert-pending">
            <template #title>{{ $t('page.vpconfig.ssl_step_cert_bad_title') }}</template>
            <template #message>{{ certProblem }}</template>
          </t-alert>

          <t-alert
            v-else-if="restartPending"
            theme="warning"
            class="cert-pending"
            :message="$t('page.vpconfig.restart_pending')"
          />
        </t-loading>
      </t-card>

      <!-- 安全路径入口卡片 -->
      <t-card id="vp-sec-entry" class="list-card-container" :style="sectionStyle">
        <template #header>
          <t-row justify="space-between">
            <div class="card-header-title">
              <t-space>
                <div>{{ $t('page.vpconfig.security_entry_title') }}</div>
                <t-tooltip :content="$t('page.vpconfig.security_entry_description')">
                  <t-icon name="help-circle" />
                </t-tooltip>
              </t-space>
            </div>
          </t-row>
        </template>

        <t-loading :loading="securityEntryLoading">
          <!-- 编辑表单：开关 + 自定义路径 + 保存按钮 -->
          <t-form :data="securityEntryFormData" :label-width="180">
            <t-form-item :label="$t('page.vpconfig.security_entry_enable')">
              <t-switch v-model="securityEntryFormData.entry_enable" />
              <div class="form-item-tips">{{ $t('page.vpconfig.security_entry_enable_tips') }}</div>
            </t-form-item>

            <!--
              【影响范围说明】
              安全路径 handler 拦截的是整个 HTTP Server 的所有请求，因此以下所有调用都受影响：
              1. 管理界面浏览器访问
              2. WebSocket 连接（/api/v1/ws）
              3. 开放平台 API Key 外部调用（/api/v1/oplatform/...）
              4. 任何通过脚本/程序直接调用的 /api/v1/... 接口

              启用后，所有调用方的 URL 都需要改为：
                http(s)://host:port/{安全码}/api/v1/...
            -->
            <t-form-item v-if="securityEntryFormData.entry_enable">
              <t-alert
                theme="info"
                :message="$t('page.vpconfig.security_entry_oplatform_notice')"
              />
            </t-form-item>

            <t-form-item v-if="securityEntryFormData.entry_enable" :label="$t('page.vpconfig.security_entry_custom_code')">
              <t-input
                v-model="securityEntryFormData.entry_path"
                :placeholder="$t('page.vpconfig.security_entry_custom_code_placeholder')"
                style="width: 280px; font-family: monospace;"
                clearable
              />
              <div class="form-item-tips">{{ $t('page.vpconfig.security_entry_custom_code_tips') }}</div>
            </t-form-item>

            <t-form-item>
              <t-button theme="primary" @click="handleSaveSecurityEntry">{{ $t('page.vpconfig.security_entry_save') }}</t-button>
            </t-form-item>
          </t-form>

          <!-- 已保存的访问信息：仅当服务端已启用时展示 -->
          <template v-if="savedSecurityEntry.entry_enable && savedSecurityEntry.entry_path">
            <t-divider />
            <t-form :label-width="180">
              <t-form-item>
                <t-alert theme="warning" :message="$t('page.vpconfig.security_entry_warning')" />
              </t-form-item>

              <t-form-item :label="$t('page.vpconfig.security_entry_code')">
                <t-input :value="savedSecurityEntry.entry_path" readonly style="width: 280px; font-family: monospace;" />
              </t-form-item>

              <t-form-item :label="$t('page.vpconfig.security_entry_url')">
                <t-space direction="vertical" style="width: 100%">
                  <t-input :value="securityEntryFullUrl" readonly style="width: 520px; font-family: monospace;" />
                  <div class="form-item-tips">{{ $t('page.vpconfig.security_entry_url_tips') }}</div>
                  <t-space>
                    <t-button theme="primary" @click="copySecurityUrl">{{ $t('page.vpconfig.security_entry_copy_url') }}</t-button>
                    <t-button theme="default" @click="openSecurityUrl">{{ $t('page.vpconfig.security_entry_open_url') }}</t-button>
                    <t-button theme="danger" variant="outline" @click="showRegenerateDialog">{{ $t('page.vpconfig.security_entry_regenerate') }}</t-button>
                  </t-space>
                </t-space>
              </t-form-item>
            </t-form>
          </template>
        </t-loading>
      </t-card>

      <!-- 通知标题前缀卡片 -->
      <t-card id="vp-sec-notice" class="list-card-container" :style="sectionStyle">
        <template #header>
          <t-row justify="space-between">
            <div class="card-header-title">
              <t-space>
                <div>{{ $t('page.vpconfig.notice_title_title') }}</div>
                <t-tooltip :content="$t('page.vpconfig.notice_title_description')">
                  <t-icon name="help-circle" />
                </t-tooltip>
              </t-space>
            </div>
          </t-row>
        </template>

        <t-loading :loading="noticeTitleLoading">
          <t-form :data="noticeTitleFormData" :label-width="180">
            <t-form-item :label="$t('page.vpconfig.notice_title_label')">
              <t-input
                v-model="noticeTitleFormData.notice_title"
                :placeholder="$t('page.vpconfig.notice_title_placeholder')"
                style="width: 320px;"
                clearable
              />
              <div class="form-item-tips">{{ $t('page.vpconfig.notice_title_tips') }}</div>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" @click="handleSaveNoticeTitle">{{ $t('page.vpconfig.notice_title_save') }}</t-button>
            </t-form-item>
          </t-form>
        </t-loading>
      </t-card>
        </div>
      </div>

      <!-- 域名白名单确认对话框 -->
      <t-dialog
        :visible.sync="domainConfirmDialogVisible"
        :header="$t('common.confirm')"
        :body="$t('page.vpconfig.domain_whitelist_save_confirm')"
        @confirm="handleDomainSave"
        @cancel="domainConfirmDialogVisible = false"
      />

      <!-- 确认对话框 -->
      <t-dialog
        :visible.sync="confirmDialogVisible"
        :header="$t('common.confirm')"
        :body="$t('page.vpconfig.save_confirm')"
        @confirm="handleSave"
        @cancel="confirmDialogVisible = false"
      />

      <!-- 证书上传确认对话框 -->
      <t-dialog
        :visible.sync="uploadCertDialogVisible"
        :header="$t('common.confirm')"
        :body="$t('page.vpconfig.upload_cert_confirm')"
        @confirm="handleUploadCert"
        @cancel="uploadCertDialogVisible = false"
      />

      <!-- 证书列表选择对话框 -->
      <t-dialog
        :visible.sync="certListDialogVisible"
        :header="$t('page.vpconfig.select_cert_from_folder')"
        :width="1200"
        :footer="false"
      >
        <div slot="body">
          <t-loading :loading="certListLoading">
            <t-table
              :columns="certColumns"
              :data="certListData"
              :rowKey="'id'"
              :hover="true"
              :pagination="certPagination"
              @page-change="handleCertPageChange"
            >
              <template #op="{ row }">
                <t-button theme="primary" size="small" @click="handleCertOp(row)">
                  {{ certDialogMode === 'bind' ? $t('page.vpconfig.ssl_bind_cert_do_bind') : $t('common.select_placeholder') }}
                </t-button>
              </template>
            </t-table>
          </t-loading>
        </div>
      </t-dialog>

      <!-- 重启管理端确认对话框 -->
      <t-dialog
        :visible.sync="restartDialogVisible"
        :header="$t('common.confirm')"
        :body="$t('page.vpconfig.restart_confirm')"
        @confirm="handleRestartManager(false)"
        @cancel="restartDialogVisible = false"
      />

      <!-- 重新生成访问码确认对话框 -->
      <t-dialog
        :visible.sync="regenerateDialogVisible"
        :header="$t('common.confirm')"
        :body="$t('page.vpconfig.security_entry_regenerate_confirm')"
        @confirm="handleRegenerateCode"
        @cancel="regenerateDialogVisible = false"
      />
    </div>
  </template>
  
  <script lang="ts">
  import Vue from 'vue';
  import { prefix } from '@/config/global';
  import { getIpWhitelistApi, updateIpWhitelistApi, getManageTrustedProxiesApi, updateManageTrustedProxiesApi, getManageCDNProviderApi, updateManageCDNProviderApi, getCorsAllowOriginsApi, updateCorsAllowOriginsApi, getSslStatusApi, updateSslEnableApi, uploadSslCertApi, restartManagerApi, getSecurityEntryApi, updateSecurityEntryApi, getNoticeTitleApi, updateNoticeTitleApi, getDomainWhitelistApi, updateDomainWhitelistApi, getSslForceHttpsApi, updateSslForceHttpsApi, getSslBindCertApi, updateSslBindCertApi, getLocalCertStatusApi, generateLocalCertApi, rotateLocalCaApi, clearLocalCertApi } from '@/apis/vpconfig';
  import { wafCDNProviderInfoApi } from '@/apis/cdnip';
  import { get_detail_by_item_api, edit_system_config_by_item_api } from '@/apis/systemconfig';
  import { sslConfigListApi, sslConfigDetailApi } from '@/apis/sslconfig';
  import { MessagePlugin } from 'tdesign-vue';
  import { isLoopbackHost } from '@/utils/insecure';

  // 外部入口（如顶部 HTTP 提示条）用 ?section=xxx 指定落地后停在哪一节。
  // URL 里走短名而不是锚点 id：短名是对外契约，id 是本页实现，改 id 不该牵动调用方
  const SECTION_BY_KEY = {
    ip: 'vp-sec-ip',
    proxy: 'vp-sec-proxy',
    cors: 'vp-sec-cors',
    domain: 'vp-sec-domain',
    access: 'vp-sec-access',
    entry: 'vp-sec-entry',
    notice: 'vp-sec-notice',
  };

  export default Vue.extend({
    name: 'VpConfig',
    data() {
      return {
        prefix,
        dataLoading: false,
        confirmDialogVisible: false,
        domainLoading: false,
        domainConfirmDialogVisible: false,
        domainFormData: {
          domain_whitelist: ''
        },
        sslLoading: false,
        uploadCertDialogVisible: false,
        certListDialogVisible: false,
        certListLoading: false,
        restartDialogVisible: false,
        securityEntryLoading: false,
        regenerateDialogVisible: false,
        noticeTitleLoading: false,
        noticeTitleFormData: {
          notice_title: ''
        },
        // 编辑中的表单值（开关+自定义路径，点保存才提交）
        securityEntryFormData: {
          entry_enable: false,
          entry_path: ''
        },
        // 服务端已保存的配置（fetch 或 save 成功后更新）
        savedSecurityEntry: {
          entry_enable: false,
          entry_path: ''
        },
        formData: {
          ip_whitelist: ''
        },
        // 管理端可信代理网段（配置存 config.yml，被白名单挡住时可改文件+重启自救）
        trustedProxiesFormData: {
          trusted_proxies: ''
        },
        trustedProxiesLoading: false,
        // 管理端代理头(DB参数 gwaf_manage_proxy_header)：从哪些头识别真实客户端IP，留空=直接用网络IP
        manageProxyHeader: '',
        // 总开关：代理头有值即开启；关闭=按直连网络IP判定，并隐藏下面代理头/①CDN/②网段
        enableManageProxy: false,
        // 代理头快捷填写预设(头名与后端 clientip 厂商注册表逐一对齐)
        proxyHeaderPresets: [
          { label: 'X-Forwarded-For', value: 'X-Forwarded-For' },
          { label: 'X-Real-IP', value: 'X-Real-IP' },
          { label: 'Cloudflare · CF-Connecting-IP', value: 'CF-Connecting-IP' },
          { label: 'Fastly · Fastly-Client-IP', value: 'Fastly-Client-IP' },
          { label: 'AWS CloudFront · CloudFront-Viewer-Address', value: 'CloudFront-Viewer-Address' },
          { label: '腾讯云 EdgeOne · EO-Client-IP', value: 'EO-Client-IP' },
          { label: '阿里云 CDN · Ali-Cdn-Real-Ip', value: 'Ali-Cdn-Real-Ip' },
          { label: 'Akamai · True-Client-IP', value: 'True-Client-IP' },
        ],
        // 管理端引用的CDN厂商(管理端也可能挂在CDN后，自动读中心库最新回源段)
        manageCdnProvider: '',
        manageCdnInfo: null,
        // CORS 跨域来源白名单（配置存 config.yml，回环/本机始终放行）
        corsFormData: {
          cors_allow_origins: ''
        },
        corsLoading: false,
        sslFormData: {
          ssl_enable: false,
          has_cert: false,
          cert_expire_at: '',
          cert_domain: ''
        },
        certFormData: {
          cert_content: '',
          key_content: ''
        },
        // 管理端仅允许HTTPS开关
        sslForceHttpsFormData: {
          force_https: false
        },
        // 管理端证书绑定的证书夹（自动同步）
        sslBindCert: {
          ssl_config_id: '',
          domains: '',
          valid_to: ''
        },
        localCert: {},
        localCertSans: '',
        localCertLoading: false,
        // 「更换证书」区默认收起：日常进来只看摘要，要换才展开
        changeCertOpen: false,
        pickedSource: 'folder',
        // 有待生效的证书改动。后端没有这个状态，也不必新增字段——
        // 它只在本次会话内有意义：做过写入即置位，点过重启即清除。
        restartPending: false,
        // SSL 状态拉回来之前不下"上游终止 TLS"的结论：默认值 false 会让判定短暂成立，
        // 页面一进来先闪一下橙色提示很唬人
        sslStatusLoaded: false,
        // 访问方式：pickedAccessMode 是待保存值，savedAccessMode（computed）是已保存值，
        // 两者不等即为"有改动未保存"。accessTouched 用来防止后台刷新覆盖用户正在改的选择。
        pickedAccessMode: 'http',
        accessTouched: false,
        // 三选一的文案表；顺序即界面顺序，从宽松到严格
        accessOptions: [
          {
            key: 'http',
            tag: 'page.vpconfig.access_opt_default',
            tagTheme: 'default',
            title: 'page.vpconfig.access_opt_http',
            desc: 'page.vpconfig.access_opt_http_desc',
          },
          {
            key: 'https',
            tag: 'page.vpconfig.access_opt_recommend',
            tagTheme: 'success',
            title: 'page.vpconfig.access_opt_https',
            desc: 'page.vpconfig.access_opt_https_desc',
            warn: 'page.vpconfig.access_opt_https_warn',
          },
          {
            key: 'only',
            tag: 'page.vpconfig.access_opt_strict',
            tagTheme: 'warning',
            title: 'page.vpconfig.access_opt_only',
            desc: 'page.vpconfig.access_opt_only_desc',
            warn: 'page.vpconfig.access_opt_only_warn',
          },
        ],
        // 锚点导航：当前高亮的节 + 顶栏吸顶时要避开的高度（多标签页签条的高度）
        activeSection: '',
        stickyTop: 0,
        spyLock: false,
        // 三张选择卡的文案表；点位与顺序即界面顺序
        certChoices: [
          {
            key: 'folder',
            auto: true,
            title: 'page.vpconfig.choice_folder_title',
            who: 'page.vpconfig.choice_folder_who',
            foot: 'page.vpconfig.choice_folder_foot',
            points: [
              'page.vpconfig.choice_folder_p1',
              'page.vpconfig.choice_folder_p2',
              'page.vpconfig.choice_folder_p3',
              'page.vpconfig.choice_folder_p4',
            ],
          },
          {
            key: 'local',
            auto: true,
            title: 'page.vpconfig.choice_local_title',
            who: 'page.vpconfig.choice_local_who',
            foot: 'page.vpconfig.choice_local_foot',
            points: [
              'page.vpconfig.choice_local_p1',
              'page.vpconfig.choice_local_p2',
              'page.vpconfig.choice_local_p3',
              'page.vpconfig.choice_local_p4',
            ],
          },
          {
            key: 'manual',
            auto: false,
            title: 'page.vpconfig.choice_manual_title',
            who: 'page.vpconfig.choice_manual_who',
            foot: 'page.vpconfig.choice_manual_foot',
            points: [
              'page.vpconfig.choice_manual_p1',
              'page.vpconfig.choice_manual_p2',
              'page.vpconfig.choice_manual_p3',
              'page.vpconfig.choice_manual_p4',
            ],
          },
        ],
        // 证书夹弹窗模式：copy=一次性复制内容到上传框, bind=绑定自动同步
        certDialogMode: 'copy',
        certListData: [],
        certPagination: {
          total: 0,
          current: 1,
          pageSize: 10
        },
        certColumns: [
          {
            align: 'left',
            width: 120,
            colKey: 'op',
            title: this.$t('common.op'),
          },
          {
            title: this.$t('page.ssl.label_subject'),
            align: 'left',
            width: 200,
            ellipsis: true,
            colKey: 'subject',
          },
          {
            title: this.$t('page.ssl.label_domains'),
            width: 200,
            ellipsis: true,
            colKey: 'domains',
          },
          {
            title: this.$t('page.ssl.label_valid_to'),
            width: 180,
            ellipsis: true,
            colKey: 'valid_to',
          },
          {
            title: this.$t('page.ssl.label_expire_time'),
            width: 150,
            ellipsis: true,
            colKey: 'expiration_info',
          },
        ],
        rules: {
          ip_whitelist: [
            { required: true, message: this.$t('common.required'), type: 'error' }
          ]
        }
      };
    },
    computed: {
      // ===== 左侧锚点导航 =====
      // 顺序即页面顺序；show 为假的节（如未启用 SSL 时的证书节）连锚点一起隐藏，
      // 否则点了会跳空。dirty 用来在左侧打黄点，让"哪一节还没生效"不用逐节找。
      sections() {
        return [
          { id: 'vp-sec-ip', label: this.$t('page.vpconfig.ip_whitelist'), show: true, dirty: false },
          { id: 'vp-sec-proxy', label: this.$t('page.vpconfig.trusted_proxies_title'), show: true, dirty: false },
          { id: 'vp-sec-cors', label: this.$t('page.vpconfig.cors_title'), show: true, dirty: false },
          { id: 'vp-sec-domain', label: this.$t('page.vpconfig.domain_whitelist_title'), show: true, dirty: false },
          { id: 'vp-sec-access', label: this.$t('page.vpconfig.access_cert_title'), show: true, dirty: this.accessDirty || this.restartPending },
          { id: 'vp-sec-entry', label: this.$t('page.vpconfig.security_entry_title'), show: true, dirty: false },
          { id: 'vp-sec-notice', label: this.$t('page.vpconfig.notice_title_title'), show: true, dirty: false },
        ];
      },
      visibleSections() {
        return this.sections.filter((s) => s.show);
      },
      activeSectionLabel() {
        const hit = this.visibleSections.find((s) => s.id === this.activeSection);
        return hit ? hit.label : '';
      },
      // 顶栏是吸顶的，锚点跳过去若不留出这段高度，小节标题会被顶栏盖住
      anchorOffset() {
        return this.stickyTop + 64;
      },
      sectionStyle() {
        return { scrollMarginTop: `${this.anchorOffset}px` };
      },
      // 传输加密状态：按当前访问方式判定，与后端配置无关——
      // 用户可能配了证书却仍从 http 端口进来，这里要如实反映"这一次访问"是不是加密的
      // ===== 证书来源判定（把原先散在三处的状态合成一个）=====
      // 优先级：绑定证书夹 > 本地CA签发 > 有证书文件即手工上传 > 未配置。
      // 绑定优先是因为它是"持续同步"关系，即便当前落盘的证书恰好也是本地签的，
      // 真正决定后续走向的仍是绑定关系。
      certSource() {
        if (this.sslBindCert && this.sslBindCert.ssl_config_id) return 'folder';
        if (this.localCert && this.localCert.is_local) return 'local';
        if (this.sslFormData && this.sslFormData.has_cert) return 'manual';
        return 'none';
      },
      certSourceLabel() {
        const map = {
          folder: 'page.vpconfig.cert_source_folder',
          local: 'page.vpconfig.cert_source_local',
          manual: 'page.vpconfig.cert_source_manual',
        };
        return map[this.certSource] ? this.$t(map[this.certSource]) : '';
      },
      // 顶部说明里的条目。选的都是实际会被问到的，不是把文档抄一遍：
      // 「浏览器报不安全」「改完没生效」「打不开了怎么救」占了这一节问题的绝大多数
      accessHelpItems() {
        return [
          { k: this.$t('page.vpconfig.access_help_k_save'), v: this.$t('page.vpconfig.access_help_v_save'), tone: 'brand' },
          { k: this.$t('page.vpconfig.access_help_k_insecure'), v: this.$t('page.vpconfig.access_help_v_insecure') },
          { k: this.$t('page.vpconfig.access_help_k_pick'), v: this.$t('page.vpconfig.access_help_v_pick') },
          { k: this.$t('page.vpconfig.access_help_k_locked'), v: this.$t('page.vpconfig.access_help_v_locked'), tone: 'danger' },
          { k: this.$t('page.vpconfig.access_help_k_local'), v: this.$t('page.vpconfig.access_help_v_local') },
          { k: this.$t('page.vpconfig.access_help_k_cdn'), v: this.$t('page.vpconfig.access_help_v_cdn') },
        ];
      },
      // ===== 访问方式（三选一）=====
      // 已保存值由后端两个 bool 推出来；界面上的三个选项与它们的映射见
      // 原型设计/2026-08-27-管理端访问与证书合并-原型.html
      savedAccessMode() {
        if (!this.sslFormData.ssl_enable) return 'http';
        return this.sslForceHttpsFormData.force_https ? 'only' : 'https';
      },
      accessDirty() {
        return this.pickedAccessMode !== this.savedAccessMode;
      },
      // 证书能不能真的把 HTTPS 起起来：既没配是不行，配了但过期/不配对也是不行
      certUsable() {
        return this.certSource !== 'none' && !this.certProblem;
      },
      certStepDone() {
        return this.pickedAccessMode !== 'http' && this.certUsable;
      },
      certStepClass() {
        if (this.pickedAccessMode === 'http') return 'step__n--todo';
        return this.certUsable ? 'step__n--done' : '';
      },
      certStepDesc() {
        if (this.pickedAccessMode === 'http') return this.$t('page.vpconfig.access_step2_desc_http');
        if (this.certUsable) return this.$t('page.vpconfig.access_step2_desc_ok');
        return this.$t('page.vpconfig.access_step2_desc_need', { mode: this.accessModeLabel(this.pickedAccessMode) });
      },
      // 证书在、却起不来的原因（过期 / 与私钥不配对 / 文件损坏），由后端判定后回传。
      // 没配证书是另一回事（certSource === 'none'），那条走"还差一步"的引导
      certProblem() {
        if (this.certSource === 'none') return '';
        return this.localCert && this.localCert.cert_usable === false ? (this.localCert.cert_problem || '') : '';
      },
      // 只有证书夹绑定与本地签发能自动续期；手工上传只能提醒
      certAutoRenew() {
        return this.certSource === 'folder' || this.certSource === 'local';
      },
      // 摘要条内容：名字 + 若干「键:值」，按来源给不同的组合
      certSummary() {
        const src = this.certSource;
        const meta = [];
        let name = '';

        if (src === 'folder') {
          name = this.sslBindCert.domains || this.sslFormData.cert_domain || '-';
          if (this.sslBindCert.valid_to) meta.push({ k: this.$t('page.vpconfig.cert_expire_at'), v: this.sslBindCert.valid_to });
          meta.push({ k: this.$t('page.vpconfig.cert_renew_way'), v: this.$t('page.vpconfig.cert_renew_folder') });
        } else if (src === 'local') {
          const sans = (this.localCert.sans || []).join('、');
          name = (this.localCert.cert && this.localCert.cert.subject) || sans || '-';
          if (sans) meta.push({ k: this.$t('page.vpconfig.cert_covered'), v: sans });
          if (this.localCertDaysLeft !== null) {
            meta.push({ k: this.$t('page.vpconfig.cert_days_left'), v: this.$t('page.vpconfig.cert_days_unit', { days: this.localCertDaysLeft }) });
          }
          meta.push({ k: this.$t('page.vpconfig.cert_renew_way'), v: this.$t('page.vpconfig.cert_renew_local') });
        } else if (src === 'manual') {
          name = this.sslFormData.cert_domain || '-';
          if (this.sslFormData.cert_expire_at) meta.push({ k: this.$t('page.vpconfig.cert_expire_at'), v: this.sslFormData.cert_expire_at });
          meta.push({ k: this.$t('page.vpconfig.cert_renew_way'), v: this.$t('page.vpconfig.cert_renew_manual') });
        }
        return { name, meta };
      },
      // 本地证书剩余天数（当前证书为本地签发时显示）
      localCertDaysLeft() {
        if (!this.localCert || !this.localCert.is_local || !this.localCert.cert || !this.localCert.cert.not_after) return null;
        const ms = new Date(this.localCert.cert.not_after).getTime() - Date.now();
        return Math.max(0, Math.floor(ms / 86400000));
      },
      // 浏览器看到 HTTPS、而管理端自己没开 SSL——TLS 一定终止在上游（CDN / 反向代理 / 隧道）。
      // 这时浏览器到上游那一段是加密的，上游到管理端那一段不是。两段必须分开说：
      // 只看 window.location.protocol 会给出一个"全程加密"的绿标签，那是不对的。
      transportUpstreamTls() {
        return this.sslStatusLoaded && window.location.protocol === 'https:' && !this.sslFormData.ssl_enable;
      },
      transportSecure() {
        return window.location.protocol === 'https:' && !this.transportUpstreamTls;
      },
      transportLoopback() {
        return window.location.protocol !== 'https:' && isLoopbackHost(window.location.hostname);
      },
      transportStatusTips() {
        if (this.transportUpstreamTls) return this.$t('page.vpconfig.transport_status_upstream_tips');
        if (this.transportSecure) return this.$t('page.vpconfig.transport_status_https_tips');
        if (this.transportLoopback) return this.$t('page.vpconfig.transport_status_loopback_tips');
        return this.$t('page.vpconfig.transport_status_http_tips');
      },
      securityEntryFullUrl() {
        const protocol = window.location.protocol;
        const host = window.location.host;
        return `${protocol}//${host}/${this.savedSecurityEntry.entry_path}/`;
      }
    },
    mounted() {
      this.fetchData();
      this.fetchTrustedProxies();
      this.fetchManageCdnProvider();
      this.fetchCors();
      this.fetchDomainWhitelist();
      this.fetchSslStatus();
      this.fetchSslForceHttps();
      this.fetchSslBindCert();
      this.fetchLocalCertStatus();
      this.fetchSecurityEntry();
      this.fetchNoticeTitle();
      this.setupScrollSpy();
      // 放在 setupScrollSpy 之后：锚点让位高度依赖它测出来的 stickyTop
      this.consumeRouteSection();
    },
    // 本页在 keep-alive 里，第二次进来只有 activated，没有 mounted
    activated() {
      this.consumeRouteSection();
    },
    beforeDestroy() {
      this.teardownScrollSpy();
      clearTimeout(this.sectionSettleTimer);
    },
    watch: {
      // 已经停在本页时点顶部提示条：组件不会重建，只有路由参数变，靠这里接住
      $route() {
        this.consumeRouteSection();
      },
      // 后端值变了（首次拉取、保存后重新拉取）而用户没有正在编辑时，待保存值跟随已保存值。
      // 有未保存改动时不跟随——否则一次后台刷新就把用户选了一半的东西抹掉了
      savedAccessMode: {
        immediate: true,
        handler(val) {
          if (!this.accessTouched) this.pickedAccessMode = val;
        },
      },
      // 证书节是条件渲染的：关掉 SSL 后它连同锚点一起消失，
      // 当时若正停在这一节，高亮要落回一个还存在的节，否则顶栏的"当前"会空着
      visibleSections(list) {
        if (this.activeSection && !list.some((s) => s.id === this.activeSection)) {
          this.activeSection = list.length ? list[list.length - 1].id : '';
        }
      },
    },
    methods: {
      // ===== 锚点定位与滚动高亮 =====
      // 这页不自建滚动容器：真正滚动的是布局的 .{prefix}-layout。
      // 监听 window 是没用的（它根本不滚），所以先把那个容器找出来。
      setupScrollSpy() {
        const layout = this.$el && this.$el.closest ? this.$el.closest(`.${prefix}-layout`) : null;
        this.spyScroller = layout || this.findScrollParent(this.$el);
        // 顶栏要停在多标签页签条下面，不能压在它身上（页签是 sticky top:0，z-index 更高）
        const tabs = document.querySelector(`.${prefix}-layout-tabs-nav`);
        this.stickyTop = tabs ? Math.round(tabs.getBoundingClientRect().height) : 0;

        this.spyHandler = () => {
          if (this.spyRaf) return;
          this.spyRaf = window.requestAnimationFrame(() => {
            this.spyRaf = 0;
            this.updateActiveSection();
          });
        };
        (this.spyScroller || window).addEventListener('scroll', this.spyHandler, { passive: true });
        window.addEventListener('resize', this.spyHandler, { passive: true });
        this.$nextTick(() => this.updateActiveSection());
      },
      teardownScrollSpy() {
        if (this.spyHandler) {
          (this.spyScroller || window).removeEventListener('scroll', this.spyHandler);
          window.removeEventListener('resize', this.spyHandler);
        }
        if (this.spyRaf) window.cancelAnimationFrame(this.spyRaf);
        clearTimeout(this.spyTimer);
      },
      findScrollParent(el) {
        let node = el && el.parentElement;
        while (node && node !== document.body) {
          const oy = window.getComputedStyle(node).overflowY;
          if (/(auto|scroll|overlay)/.test(oy) && node.scrollHeight > node.clientHeight + 1) return node;
          node = node.parentElement;
        }
        return null;
      },
      updateActiveSection() {
        const list = this.visibleSections;
        if (!list.length) return;
        // 平滑滚动途中会依次经过中间几节，跟着高亮看起来像乱跳；点击后先锁住
        if (this.spyLock) return;
        const line = this.anchorOffset + 12;
        let current = list[0].id;
        list.forEach((s) => {
          const el = document.getElementById(s.id);
          if (el && el.getBoundingClientRect().top - line <= 0) current = s.id;
        });
        // 最后一节可能很短，滚到底也越不过判定线，这里补一刀
        const sc = this.spyScroller;
        if (sc && sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4) {
          current = list[list.length - 1].id;
        }
        this.activeSection = current;
      },
      jumpTo(id, behavior = 'smooth') {
        const el = document.getElementById(id);
        if (!el) return;
        this.activeSection = id;
        this.spyLock = true;
        clearTimeout(this.spyTimer);
        this.spyTimer = setTimeout(() => {
          this.spyLock = false;
          this.updateActiveSection();
        }, 600);
        el.scrollIntoView({ behavior, block: 'start' });
      },
      // 外部入口带 ?section=xxx 进来时，落地直接停在那一节。
      // 参数读完即清：本页在 keep-alive 里，不清的话连点两次横幅第二次路由没变化就没反应了
      consumeRouteSection() {
        const key = this.$route.query && this.$route.query.section;
        if (!key) return;
        const query = { ...this.$route.query };
        delete query.section;
        this.$router.replace({ path: this.$route.path, query }).catch(() => {});

        const id = SECTION_BY_KEY[String(key)];
        if (!id) return;
        this.$nextTick(() => {
          // 是"直接落到位"不是"从头滚过去"，这里不要平滑动画
          this.jumpTo(id, 'auto');
          // 各节内容是异步拉的，撑开后目标会往下走，落定再校一次位置。
          // 期间用户自己点了别的锚点（高亮变了）就不抢他的滚动条
          clearTimeout(this.sectionSettleTimer);
          this.sectionSettleTimer = setTimeout(() => {
            if (this.activeSection === id) this.jumpTo(id, 'auto');
          }, 500);
        });
      },
      fetchData() {
        this.dataLoading = true;
        getIpWhitelistApi({})
          .then((res) => {
            if (res.code === 0) {
              this.formData.ip_whitelist = res.data.ip_whitelist || '';
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.api_error'));
            }
          })
          .catch((error) => {
            console.error('获取IP白名单失败:', error);
            MessagePlugin.error(this.$t('common.tips.api_error'));
          })
          .finally(() => {
            this.dataLoading = false;
          });
      },
      handleRefresh() {
        this.fetchData();
      },
      fetchTrustedProxies() {
        this.trustedProxiesLoading = true;
        getManageTrustedProxiesApi({})
          .then((res) => {
            if (res.code === 0) {
              this.trustedProxiesFormData.trusted_proxies = res.data.trusted_proxies || '';
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.api_error'));
            }
          })
          .catch(() => {
            MessagePlugin.error(this.$t('common.tips.api_error'));
          })
          .finally(() => {
            this.trustedProxiesLoading = false;
          });
        // 加载管理端代理头(DB参数)
        this.fetchManageProxyHeader();
      },
      // 快捷追加一个代理头(逗号优先级列表，已存在则忽略、大小写不敏感去重)
      addProxyHeaderToken(token) {
        const tokens = (this.manageProxyHeader || '')
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t !== '');
        if (tokens.some((t) => t.toLowerCase() === token.toLowerCase())) {
          return;
        }
        tokens.push(token);
        this.manageProxyHeader = tokens.join(',');
      },
      // 读取管理端代理头 DB 参数 gwaf_manage_proxy_header
      fetchManageProxyHeader() {
        get_detail_by_item_api({ item: 'gwaf_manage_proxy_header' })
          .then((res) => {
            if (res.code === 0 && res.data) {
              this.manageProxyHeader = res.data.value || '';
            }
            // 开关状态跟随代理头是否有值：有值即开启
            this.enableManageProxy = (this.manageProxyHeader || '').trim() !== '';
          })
          .catch(() => {});
      },
      // 总开关切换：关闭=清空代理头(按网络层IP判定)并隐藏下方项；开启=展开供填写
      onEnableManageProxyChange(val) {
        if (!val) {
          this.manageProxyHeader = '';
        }
      },
      handleTrustedProxiesRefresh() {
        this.fetchTrustedProxies();
      },
      // 加载管理端引用的CDN厂商 + 其中心库状态
      fetchManageCdnProvider() {
        getManageCDNProviderApi({})
          .then((res) => {
            if (res.code === 0) {
              this.manageCdnProvider = res.data.provider || '';
              if (this.manageCdnProvider) this.loadManageCdnInfo(this.manageCdnProvider);
            }
          })
          .catch(() => {});
      },
      loadManageCdnInfo(provider) {
        wafCDNProviderInfoApi({ provider })
          .then((res) => { if (res.code === 0) this.manageCdnInfo = res.data; })
          .catch(() => {});
      },
      // 切换/清除管理端引用CDN厂商(立即保存到 config.yml)
      handleManageCdnProviderChange(v) {
        updateManageCDNProviderApi({ provider: v || '' })
          .then((res) => {
            if (res.code === 0) {
              MessagePlugin.success(this.$t('common.tips.save_success'));
              this.manageCdnInfo = null;
              if (v) this.loadManageCdnInfo(v);
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.save_failed'));
            }
          })
          .catch(() => { MessagePlugin.error(this.$t('common.tips.api_error')); });
      },
      goCdnPage() {
        const route = this.$router.resolve({ name: 'WafCDNIP' });
        window.open(route.href, '_blank');
      },
      handleTrustedProxiesSave() {
        this.trustedProxiesLoading = true;
        // 一并保存：代理头(DB参数 gwaf_manage_proxy_header) + 手填可信代理网段(config.yml)
        Promise.all([
          edit_system_config_by_item_api({
            item: 'gwaf_manage_proxy_header',
            value: (this.manageProxyHeader || '').trim()
          }),
          updateManageTrustedProxiesApi({
            trusted_proxies: this.trustedProxiesFormData.trusted_proxies
          })
        ])
          .then(([headerRes, proxiesRes]) => {
            if (headerRes.code === 0 && proxiesRes.code === 0) {
              MessagePlugin.success(this.$t('common.tips.save_success'));
            } else {
              MessagePlugin.error(
                (headerRes.code !== 0 ? headerRes.msg : proxiesRes.msg) ||
                  this.$t('common.tips.save_failed')
              );
            }
          })
          .catch(() => {
            MessagePlugin.error(this.$t('common.tips.save_failed'));
          })
          .finally(() => {
            this.trustedProxiesLoading = false;
          });
      },
      fetchCors() {
        this.corsLoading = true;
        getCorsAllowOriginsApi({})
          .then((res) => {
            if (res.code === 0) {
              this.corsFormData.cors_allow_origins = res.data.cors_allow_origins || '';
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.api_error'));
            }
          })
          .catch(() => {
            MessagePlugin.error(this.$t('common.tips.api_error'));
          })
          .finally(() => {
            this.corsLoading = false;
          });
      },
      handleCorsRefresh() {
        this.fetchCors();
      },
      handleCorsSave() {
        this.corsLoading = true;
        updateCorsAllowOriginsApi({
          cors_allow_origins: this.corsFormData.cors_allow_origins
        })
          .then((res) => {
            if (res.code === 0) {
              MessagePlugin.success(this.$t('common.tips.save_success'));
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.save_failed'));
            }
          })
          .catch(() => {
            MessagePlugin.error(this.$t('common.tips.save_failed'));
          })
          .finally(() => {
            this.corsLoading = false;
          });
      },
      fetchDomainWhitelist() {
        this.domainLoading = true;
        getDomainWhitelistApi({})
          .then((res) => {
            if (res.code === 0) {
              this.domainFormData.domain_whitelist = res.data.domain_whitelist || '';
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.api_error'));
            }
          })
          .catch(() => {
            MessagePlugin.error(this.$t('common.tips.api_error'));
          })
          .finally(() => {
            this.domainLoading = false;
          });
      },
      handleDomainRefresh() {
        this.fetchDomainWhitelist();
      },
      showDomainConfirmDialog() {
        this.domainConfirmDialogVisible = true;
      },
      handleDomainSave() {
        this.domainLoading = true;
        updateDomainWhitelistApi({
          domain_whitelist: this.domainFormData.domain_whitelist
        })
          .then((res) => {
            if (res.code === 0) {
              MessagePlugin.success(this.$t('common.tips.save_success'));
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.save_failed'));
            }
          })
          .catch(() => {
            MessagePlugin.error(this.$t('common.tips.save_failed'));
          })
          .finally(() => {
            this.domainLoading = false;
            this.domainConfirmDialogVisible = false;
          });
      },
      showConfirmDialog() {
        this.$refs.form.validate().then((result) => {
          if (result === true) {
            this.confirmDialogVisible = true;
          }
        });
      },
      handleSave() {
        this.dataLoading = true;
        updateIpWhitelistApi({
          ip_whitelist: this.formData.ip_whitelist
        })
          .then((res) => {
            if (res.code === 0) {
              MessagePlugin.success(this.$t('common.tips.save_success'));
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.save_failed'));
            }
          })
          .catch((error) => {
            console.error('保存IP白名单失败:', error);
            MessagePlugin.error(this.$t('common.tips.save_failed'));
          })
          .finally(() => {
            this.dataLoading = false;
            this.confirmDialogVisible = false;
          });
      },
      fetchSslStatus() {
        this.sslLoading = true;
        getSslStatusApi({})
          .then((res) => {
            if (res.code === 0) {
              this.sslFormData.ssl_enable = res.data.ssl_enable || false;
              this.sslStatusLoaded = true;
              this.sslFormData.has_cert = res.data.has_cert || false;
              this.sslFormData.cert_expire_at = res.data.cert_expire_at || '';
              this.sslFormData.cert_domain = res.data.cert_domain || '';
              
              // 加载证书和私钥内容到输入框
              this.certFormData.cert_content = res.data.cert_content || '';
              this.certFormData.key_content = res.data.key_content || '';
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.api_error'));
            }
          })
          .catch((error) => {
            console.error('获取SSL状态失败:', error);
            MessagePlugin.error(this.$t('common.tips.api_error'));
          })
          .finally(() => {
            this.sslLoading = false;
          });
      },
      accessModeLabel(mode) {
        const map = {
          http: 'page.vpconfig.access_opt_http',
          https: 'page.vpconfig.access_opt_https',
          only: 'page.vpconfig.access_opt_only',
        };
        return map[mode] ? this.$t(map[mode]) : '';
      },
      pickAccessMode(mode) {
        this.pickedAccessMode = mode;
        this.accessTouched = true;
      },
      // 保存不做硬拦：先存开关、再配证书是完全合理的顺序，只提醒。
      // 真正的硬拦在重启——后端 RestartManagerApi 会校验证书可用性并拒绝，
      // 那才是"点下去就回不了头"的地方。两道关卡力度不同，缺一不可。
      handleSaveAccessMode() {
        if (!this.accessDirty) return;
        const target = this.pickedAccessMode;
        if (target !== 'http' && !this.certUsable) {
          const why = this.certSource === 'none'
            ? this.$t('page.vpconfig.access_save_no_cert')
            : this.$t('page.vpconfig.access_save_bad_cert', { reason: this.certProblem });
          const tail = target === 'only'
            ? this.$t('page.vpconfig.access_save_tail_only')
            : this.$t('page.vpconfig.access_save_tail_https');
          const dia = this.$dialog.confirm({
            header: this.$t('page.vpconfig.access_save_confirm_title'),
            body: `${why}

${tail}

${this.$t('page.vpconfig.access_save_tail_common')}`,
            confirmBtn: { content: this.$t('page.vpconfig.access_save_anyway'), theme: 'warning' },
            onConfirm: () => {
              dia.hide();
              this.doSaveAccessMode(target);
            },
          });
          return;
        }
        this.doSaveAccessMode(target);
      },
      // 只提交真正变了的那一个，把"前一个成功后一个失败"的半保存面积压到最小。
      // 顺序：开启先 enable 后 force，关闭反过来——中间态不会比目标更宽松。
      async doSaveAccessMode(target) {
        const enable = target !== 'http';
        const force = target === 'only';
        const needEnable = enable !== !!this.sslFormData.ssl_enable;
        const needForce = force !== !!this.sslForceHttpsFormData.force_https;
        if (!needEnable && !needForce) return;

        const stepEnable = needEnable ? () => updateSslEnableApi({ ssl_enable: enable }) : null;
        const stepForce = needForce ? () => updateSslForceHttpsApi({ force_https: force }) : null;
        const steps = (enable ? [stepEnable, stepForce] : [stepForce, stepEnable]).filter(Boolean);

        this.sslLoading = true;
        let done = 0;
        try {
          for (const step of steps) {
            // eslint-disable-next-line no-await-in-loop
            const res = await step();
            if (!res || res.code !== 0) {
              MessagePlugin.error((res && res.msg) || this.$t('common.tips.save_failed'));
              if (done > 0) MessagePlugin.warning(this.$t('page.vpconfig.access_save_partial'));
              return;
            }
            done += 1;
          }
          // 全部成功才认为"用户想要的状态已经落盘"，此时才让待保存值跟随后端
          this.accessTouched = false;
          MessagePlugin.success(this.$t('common.tips.save_success'));
          this.markRestartPending();
        } catch (error) {
          console.error('保存访问方式失败:', error);
          MessagePlugin.error(this.$t('common.tips.save_failed'));
          if (done > 0) MessagePlugin.warning(this.$t('page.vpconfig.access_save_partial'));
        } finally {
          this.sslLoading = false;
          // 成败都以后端为准重新拉一次：半保存时界面不能停在骗人的状态上
          this.fetchSslStatus();
          this.fetchSslForceHttps();
        }
      },
      showUploadCertDialog() {
        if (!this.certFormData.cert_content || !this.certFormData.key_content) {
          MessagePlugin.warning(this.$t('page.vpconfig.cert_required'));
          return;
        }
        this.uploadCertDialogVisible = true;
      },
      handleUploadCert() {
        this.sslLoading = true;
        uploadSslCertApi({
          cert_content: this.certFormData.cert_content,
          key_content: this.certFormData.key_content
        })
          .then((res) => {
            if (res.code === 0) {
              this.markRestartPending();
              MessagePlugin.success(res.msg || this.$t('common.tips.save_success'));
              this.certFormData.cert_content = '';
              this.certFormData.key_content = '';
              this.fetchSslStatus();
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.save_failed'));
            }
          })
          .catch((error) => {
            console.error('上传SSL证书失败:', error);
            MessagePlugin.error(this.$t('common.tips.save_failed'));
          })
          .finally(() => {
            this.sslLoading = false;
            this.uploadCertDialogVisible = false;
          });
      },
      showCertListDialog() {
        this.certDialogMode = 'copy';
        this.certListDialogVisible = true;
        this.fetchCertList();
      },
      showBindCertDialog() {
        this.certDialogMode = 'bind';
        this.certListDialogVisible = true;
        this.fetchCertList();
      },
      handleCertOp(row) {
        if (this.certDialogMode === 'bind') {
          this.handleBindCert(row);
        } else {
          this.handleSelectCert(row);
        }
      },
      fetchCertList() {
        this.certListLoading = true;
        sslConfigListApi({
          pageSize: this.certPagination.pageSize,
          pageIndex: this.certPagination.current,
          domains: ''
        })
          .then((res) => {
            if (res.code === 0) {
              this.certListData = res.data.list || [];
              this.certPagination = {
                ...this.certPagination,
                total: res.data.total || 0,
              };
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.api_error'));
            }
          })
          .catch((error) => {
            console.error('获取证书列表失败:', error);
            MessagePlugin.error(this.$t('common.tips.api_error'));
          })
          .finally(() => {
            this.certListLoading = false;
          });
      },
      handleCertPageChange(pageInfo) {
        this.certPagination.current = pageInfo.current;
        if (this.certPagination.pageSize !== pageInfo.pageSize) {
          this.certPagination.current = 1;
          this.certPagination.pageSize = pageInfo.pageSize;
        }
        this.fetchCertList();
      },
      handleSelectCert(row) {
        // 获取证书详情
        this.certListLoading = true;
        sslConfigDetailApi({
          id: row.id
        })
          .then((res) => {
            if (res.code === 0) {
              // 填充证书内容到表单
              this.certFormData.cert_content = res.data.cert_content || '';
              this.certFormData.key_content = res.data.key_content || '';
              
              MessagePlugin.success(this.$t('page.vpconfig.cert_selected_success'));
              this.certListDialogVisible = false;
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.api_error'));
            }
          })
          .catch((error) => {
            console.error('获取证书详情失败:', error);
            MessagePlugin.error(this.$t('common.tips.api_error'));
          })
          .finally(() => {
            this.certListLoading = false;
          });
      },
      handleBindCert(row) {
        this.certListLoading = true;
        updateSslBindCertApi({
          ssl_config_id: row.id
        })
          .then((res) => {
            if (res.code === 0) {
              this.markRestartPending();
              MessagePlugin.success(res.msg || this.$t('common.tips.save_success'));
              this.certListDialogVisible = false;
              this.fetchSslBindCert();
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.save_failed'));
            }
          })
          .catch((error) => {
            console.error('绑定管理端证书失败:', error);
            MessagePlugin.error(this.$t('common.tips.save_failed'));
          })
          .finally(() => {
            this.certListLoading = false;
          });
      },
      handleUnbindCert() {
        this.sslLoading = true;
        updateSslBindCertApi({
          ssl_config_id: ''
        })
          .then((res) => {
            if (res.code === 0) {
              this.markRestartPending();
              MessagePlugin.success(res.msg || this.$t('common.tips.save_success'));
              this.fetchSslBindCert();
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.save_failed'));
            }
          })
          .catch((error) => {
            console.error('解绑管理端证书失败:', error);
            MessagePlugin.error(this.$t('common.tips.save_failed'));
          })
          .finally(() => {
            this.sslLoading = false;
          });
      },
      // 打开「更换证书」区；带 src 时直接定位到那一张卡
      openChangeCert(src) {
        this.changeCertOpen = true;
        this.pickedSource = src || (this.certSource === 'none' ? 'folder' : this.certSource);
      },
      // 任何会改动落盘证书的操作都要置位——重启前那张证书还没真正生效
      markRestartPending() {
        this.restartPending = true;
      },
      // ===== 管理端本地证书（T24a/T25）=====
      // 与"上传证书""绑定证书夹"并列的第三条路：本机 CA 签一张给管理端用。
      // 续期就是拿同一批访问地址重签一次——CA 不变，用户导入过的根证书继续有效。
      async fetchLocalCertStatus() {
        try {
          const res = await getLocalCertStatusApi({});
          if (res.code === 0) {
            this.localCert = res.data || {};
            // 输入框预填：优先沿用证书里已有的访问地址，其次给一个基于当前访问方式的建议
            const sans = (this.localCert.sans || []).join(',');
            this.localCertSans = sans || this.suggestLocalCertSans();
          }
        } catch (e) {
          // 状态查询失败不阻塞整页，其它卡片照常用
        }
      },
      // 建议的访问地址：当前访问用的 host 一定要有，否则签出来的证书对自己都不生效
      suggestLocalCertSans() {
        const host = window.location.hostname;
        const items = [];
        if (host) items.push(host);
        for (const extra of ['localhost', '127.0.0.1']) {
          if (!items.includes(extra)) items.push(extra);
        }
        return items.join(',');
      },
      async handleGenerateLocalCert() {
        if (!this.localCertSans || !this.localCertSans.trim()) {
          MessagePlugin.warning(this.$t('page.vpconfig.local_cert_sans_required'));
          return;
        }
        this.localCertLoading = true;
        try {
          const res = await generateLocalCertApi({ sans: this.localCertSans });
          if (res.code === 0) {
            MessagePlugin.success(this.$t('page.vpconfig.local_cert_generated'));
            this.markRestartPending();
            await this.fetchLocalCertStatus();
            await this.fetchSslStatus();
          } else {
            MessagePlugin.error(res.msg || this.$t('common.operation_failed'));
          }
        } catch (e) {
          MessagePlugin.error(this.$t('common.operation_failed'));
        } finally {
          this.localCertLoading = false;
        }
      },
      // 重建根证书：破坏性操作，旧根证书立刻失效，必须二次确认
      handleRotateLocalCa() {
        const confirmDia = this.$dialog.confirm({
          header: this.$t('page.vpconfig.local_ca_rotate'),
          body: this.$t('page.vpconfig.local_ca_rotate_confirm'),
          confirmBtn: { content: this.$t('common.confirm'), theme: 'danger' },
          onConfirm: async () => {
            confirmDia.hide();
            this.localCertLoading = true;
            try {
              const res = await rotateLocalCaApi({ sans: this.localCertSans });
              if (res.code === 0) {
                MessagePlugin.success(this.$t('page.vpconfig.local_ca_rotated'));
                this.markRestartPending();
                await this.fetchLocalCertStatus();
                await this.fetchSslStatus();
              } else {
                MessagePlugin.error(res.msg || this.$t('common.operation_failed'));
              }
            } catch (e) {
              MessagePlugin.error(this.$t('common.operation_failed'));
            } finally {
              this.localCertLoading = false;
            }
          },
        });
      },
      // 清除本地CA与本地证书；后端在 SSL 仍启用时会拒绝，避免把管理端锁死
      handleClearLocalCert() {
        const confirmDia = this.$dialog.confirm({
          header: this.$t('page.vpconfig.local_ca_clear'),
          body: this.$t('page.vpconfig.local_ca_clear_confirm'),
          confirmBtn: { content: this.$t('common.confirm'), theme: 'danger' },
          onConfirm: async () => {
            confirmDia.hide();
            try {
              const res = await clearLocalCertApi({});
              if (res.code === 0) {
                MessagePlugin.success(res.msg || this.$t('page.vpconfig.local_ca_cleared'));
                await this.fetchLocalCertStatus();
                await this.fetchSslStatus();
              } else {
                MessagePlugin.error(res.msg || this.$t('common.operation_failed'));
              }
            } catch (e) {
              MessagePlugin.error(this.$t('common.operation_failed'));
            }
          },
        });
      },
      // 根证书在浏览器本地存成 .crt：内容随状态接口一起取回，
      // 不另开下载路由——window.open 带不了鉴权头，而查询串取令牌只对下载日志那条路径生效。
      handleDownloadLocalCa() {
        const pem = this.localCert.ca_pem;
        if (!pem) {
          MessagePlugin.warning(this.$t('page.vpconfig.local_cert_no_ca'));
          return;
        }
        const blob = new Blob([pem], { type: 'application/x-x509-ca-cert' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'samwaf-local-ca.crt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      fetchSslBindCert() {
        getSslBindCertApi({})
          .then((res) => {
            if (res.code === 0) {
              this.sslBindCert.ssl_config_id = res.data.ssl_config_id || '';
              this.sslBindCert.domains = res.data.domains || '';
              this.sslBindCert.valid_to = res.data.valid_to || '';
            }
          })
          .catch((error) => {
            console.error('获取管理端证书绑定信息失败:', error);
          });
      },
      fetchSslForceHttps() {
        getSslForceHttpsApi({})
          .then((res) => {
            if (res.code === 0) {
              this.sslForceHttpsFormData.force_https = res.data.force_https || false;
            }
          })
          .catch((error) => {
            console.error('获取仅HTTPS开关失败:', error);
          });
      },
      showRestartDialog() {
        this.restartDialogVisible = true;
      },
      fetchSecurityEntry() {
        this.securityEntryLoading = true;
        getSecurityEntryApi({})
          .then((res) => {
            if (res.code === 0) {
              const enable = res.data.entry_enable || false;
              const path = res.data.entry_path || '';
              // 同步到已保存状态和表单编辑状态
              this.savedSecurityEntry.entry_enable = enable;
              this.savedSecurityEntry.entry_path = path;
              this.securityEntryFormData.entry_enable = enable;
              this.securityEntryFormData.entry_path = path;
              // 同步到 localStorage（供开发环境使用）
              this.syncSecurityPathToStorage(enable, path);
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.api_error'));
            }
          })
          .catch(() => {
            MessagePlugin.error(this.$t('common.tips.api_error'));
          })
          .finally(() => {
            this.securityEntryLoading = false;
          });
      },
      // 保存安全路径到 localStorage，供开发模式的 host.ts / App.vue 使用
      syncSecurityPathToStorage(enable, path) {
        try {
          if (enable && path) {
            localStorage.setItem('__samwaf_security_path__', '/' + path);
          } else {
            localStorage.removeItem('__samwaf_security_path__');
          }
        } catch (e) {
          // localStorage 不可用时忽略
        }
      },
      // 点击保存按钮时才调用 API
      handleSaveSecurityEntry() {
        this.securityEntryLoading = true;
        updateSecurityEntryApi({
          entry_enable: this.securityEntryFormData.entry_enable,
          entry_path: this.securityEntryFormData.entry_path
        })
          .then((res) => {
            if (res.code === 0) {
              const enable = res.data.entry_enable;
              const path = res.data.entry_path || '';
              this.savedSecurityEntry.entry_enable = enable;
              this.savedSecurityEntry.entry_path = path;
              // 将新路径同步到表单（后端可能自动生成了路径）
              this.securityEntryFormData.entry_path = path;
              // 保存到 localStorage
              this.syncSecurityPathToStorage(enable, path);
              if (enable) {
                MessagePlugin.success(this.$t('page.vpconfig.security_entry_save_success'));
                setTimeout(() => {
                  window.location.href = this.securityEntryFullUrl;
                }, 2000);
              } else {
                MessagePlugin.success(this.$t('page.vpconfig.security_entry_disable_success'));
                setTimeout(() => {
                  window.location.href = `${window.location.protocol}//${window.location.host}/`;
                }, 2000);
              }
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.save_failed'));
            }
          })
          .catch(() => {
            MessagePlugin.error(this.$t('common.tips.save_failed'));
          })
          .finally(() => {
            this.securityEntryLoading = false;
          });
      },
      copySecurityUrl() {
        const url = this.securityEntryFullUrl;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(() => {
            MessagePlugin.success(this.$t('page.vpconfig.security_entry_copy_success'));
          }).catch(() => {
            this.fallbackCopy(url);
          });
        } else {
          this.fallbackCopy(url);
        }
      },
      fallbackCopy(text) {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        MessagePlugin.success(this.$t('page.vpconfig.security_entry_copy_success'));
      },
      openSecurityUrl() {
        window.open(this.securityEntryFullUrl, '_blank');
      },
      showRegenerateDialog() {
        this.regenerateDialogVisible = true;
      },
      handleRegenerateCode() {
        this.regenerateDialogVisible = false;
        this.securityEntryLoading = true;
        updateSecurityEntryApi({
          entry_enable: true,
          entry_path: '' // 传空触发后端重新生成18位随机码
        })
          .then((res) => {
            if (res.code === 0) {
              const path = res.data.entry_path || '';
              this.savedSecurityEntry.entry_enable = true;
              this.savedSecurityEntry.entry_path = path;
              this.securityEntryFormData.entry_path = path;
              this.syncSecurityPathToStorage(true, path);
              MessagePlugin.success(this.$t('page.vpconfig.security_entry_save_success'));
              setTimeout(() => {
                window.location.href = this.securityEntryFullUrl;
              }, 2000);
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.save_failed'));
            }
          })
          .catch(() => {
            MessagePlugin.error(this.$t('common.tips.save_failed'));
          })
          .finally(() => {
            this.securityEntryLoading = false;
          });
      },
      fetchNoticeTitle() {
        this.noticeTitleLoading = true;
        getNoticeTitleApi({})
          .then((res) => {
            if (res.code === 0) {
              this.noticeTitleFormData.notice_title = res.data.notice_title || '';
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.api_error'));
            }
          })
          .catch(() => {
            MessagePlugin.error(this.$t('common.tips.api_error'));
          })
          .finally(() => {
            this.noticeTitleLoading = false;
          });
      },
      handleSaveNoticeTitle() {
        this.noticeTitleLoading = true;
        updateNoticeTitleApi({
          notice_title: this.noticeTitleFormData.notice_title
        })
          .then((res) => {
            if (res.code === 0) {
              this.noticeTitleFormData.notice_title = res.data.notice_title || '';
              MessagePlugin.success(this.$t('common.tips.save_success'));
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.save_failed'));
            }
          })
          .catch(() => {
            MessagePlugin.error(this.$t('common.tips.save_failed'));
          })
          .finally(() => {
            this.noticeTitleLoading = false;
          });
      },
      // force 为真时跳过后端的证书可用性拦截。
      // 拦截本身是防"重启完就打不开、只能上服务器改配置文件"，但确实存在明知故犯的场景
      // （比如正准备去改配置文件），所以留一个需要二次确认的出口，而不是死拦。
      handleRestartManager(force) {
        this.restartDialogVisible = false;
        MessagePlugin.loading({
          content: this.$t('page.vpconfig.restarting'),
          duration: 0
        });

        restartManagerApi({ force: !!force })
          .then((res) => {
            if (res.code === 0) {
              this.restartPending = false;
              MessagePlugin.success(res.msg || this.$t('page.vpconfig.restart_success'));

              // 提示用户等待
              setTimeout(() => {
                MessagePlugin.info(this.$t('page.vpconfig.restart_wait_tip'));
              }, 1500);

              // 5秒后尝试刷新页面
              setTimeout(() => {
                window.location.reload();
              }, 5000);
            } else if (!force) {
              // 多半是证书不可用被拦下了：原因照抄给用户，再让他自己决定要不要硬来
              MessagePlugin.closeAll();
              const dia = this.$dialog.confirm({
                header: this.$t('page.vpconfig.restart_blocked_title'),
                body: `${res.msg || this.$t('page.vpconfig.restart_failed')}\n\n${this.$t('page.vpconfig.restart_blocked_tips')}`,
                confirmBtn: { content: this.$t('page.vpconfig.restart_anyway'), theme: 'danger' },
                onConfirm: () => {
                  dia.hide();
                  this.handleRestartManager(true);
                },
              });
            } else {
              MessagePlugin.closeAll();
              MessagePlugin.error(res.msg || this.$t('page.vpconfig.restart_failed'));
            }
          })
          .catch((error) => {
            console.error('重启管理端失败:', error);
            MessagePlugin.closeAll();
            MessagePlugin.error(this.$t('page.vpconfig.restart_failed'));
          });
      }
    }
  });
  </script>
  
  <style lang="less" scoped>
  /* ===== 页面外壳：吸顶顶栏 + 左锚点 / 右长页 ===== */
  .vpconfig-bar {
    position: sticky;
    z-index: 90;
    display: flex;
    align-items: center;
    gap: 12px;
    height: 52px;
    padding: 0 16px;
    margin-bottom: 12px;
    background: var(--td-bg-color-container, #fff);
    border-radius: var(--td-radius-medium, 3px);
    box-shadow: var(--td-shadow-1, 0 1px 10px rgba(0, 0, 0, 0.05));

    &__title {
      font-size: 16px;
      font-weight: 500;
      color: var(--td-text-color-primary, rgba(0, 0, 0, 0.9));
      white-space: nowrap;
    }

    &__gap {
      flex: 1;
    }

    &__hint {
      font-size: 12px;
      color: var(--td-warning-color, #e37318);
      white-space: nowrap;
    }
  }

  .vpconfig-help {
    margin-bottom: 12px;
  }

  .vpconfig-body {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .vpconfig-nav {
    position: sticky;
    flex: none;
    width: 190px;
    padding: 12px 0;
    background: var(--td-bg-color-container, #fff);
    border-radius: var(--td-radius-medium, 3px);
    box-shadow: var(--td-shadow-1, 0 1px 10px rgba(0, 0, 0, 0.05));
    max-height: calc(100vh - 180px);
    overflow-y: auto;

    &__title {
      padding: 0 16px 8px;
      font-size: 12px;
      color: var(--td-text-color-placeholder, rgba(0, 0, 0, 0.4));
    }

    &__item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      font-size: 13px;
      cursor: pointer;
      color: var(--td-text-color-secondary, rgba(0, 0, 0, 0.6));
      border-left: 3px solid transparent;

      &:hover {
        background: var(--td-brand-color-light, #f2f3ff);
        color: var(--td-text-color-primary, rgba(0, 0, 0, 0.9));
      }

      &.is-active {
        background: var(--td-brand-color-light, #f2f3ff);
        color: var(--td-brand-color, #0052d9);
        border-left-color: var(--td-brand-color, #0052d9);
        font-weight: 500;
      }
    }

    &__dot {
      flex: none;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--td-warning-color, #e37318);
      visibility: hidden;
    }

    &__item.is-dirty &__dot {
      visibility: visible;
    }

    &__text {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  .vpconfig-content {
    flex: 1;
    min-width: 0;
  }

  /* 窄屏放不下侧栏：改成一条横向的锚点带，仍然可点可高亮 */
  @media (max-width: 1100px) {
    .vpconfig-body {
      flex-direction: column;
    }

    .vpconfig-nav {
      position: static;
      width: 100%;
      max-height: none;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      padding: 8px 10px;

      &__title {
        padding: 0 8px;
      }

      &__item {
        border-left: none;
        border-radius: var(--td-radius-medium, 3px);
        padding: 4px 10px;

        &.is-active {
          border-left: none;
        }
      }
    }
  }

  /* ===== 管理端访问与证书：编号步骤 + 三选一 ===== */
  .access-dirty {
    font-size: 12px;
    color: var(--td-brand-color, #0052d9);
    white-space: nowrap;
  }

  .access-now {
    margin-bottom: 20px;
  }

  .step {
    margin-bottom: 24px;

    &:last-of-type {
      margin-bottom: 0;
    }

    &--dim {
      opacity: 0.6;
    }

    &__t {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
    }

    &__n {
      flex: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--td-brand-color, #0052d9);
      color: #fff;
      font-size: 11px;
      font-weight: 400;
      display: flex;
      align-items: center;
      justify-content: center;

      &--done {
        background: var(--td-success-color, #2ba471);
      }

      &--todo {
        background: #c6c6c6;
      }
    }

    &__d {
      margin: 4px 0 12px 26px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.4);
      line-height: 1.7;
    }

    &__c {
      margin-left: 26px;
    }
  }

  .acc-opts {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 780px;
  }

  .acc-opt {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 11px 14px;
    border: 1px solid var(--td-component-stroke, #e7e7e7);
    border-radius: var(--td-radius-medium, 3px);
    cursor: pointer;
    background: var(--td-bg-color-container, #fff);

    &:hover {
      border-color: var(--td-brand-color-focus, #d9e1ff);
    }

    &--on {
      border-color: var(--td-brand-color, #0052d9);
      background: var(--td-brand-color-light, #f2f3ff);
    }

    &__rd {
      flex: none;
      width: 15px;
      height: 15px;
      margin-top: 3px;
      border-radius: 50%;
      border: 1px solid #c6c6c6;
      background: #fff;
      box-sizing: border-box;
    }

    &--on &__rd {
      border-color: var(--td-brand-color, #0052d9);
      border-width: 5px;
    }

    &__bd {
      flex: 1;
      min-width: 0;
    }

    &__h {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    &__s {
      margin-top: 3px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.7;
    }

    &__w {
      margin-top: 5px;
      font-size: 12px;
      color: var(--td-warning-color, #e37318);
      line-height: 1.7;
    }
  }

  .list-card-container {
    padding: 16px;
    margin-bottom: 16px;
  }

  .card-header-title {
    font-size: 16px;
    font-weight: 500;
  }
  
  .form-item-tips {
    color: rgba(0, 0, 0, 0.4);
    font-size: 12px;
    margin-top: 8px;
  }


  /* ===== 管理端证书：当前状态摘要 + 三选一更换区 ===== */
  .cert-current {
    border: 1px solid var(--td-component-stroke, #e7e7e7);
    border-radius: 3px;
    padding: 14px 16px;
    background: var(--td-bg-color-container-hover, #fafafa);
  }

  .cert-current--bad {
    border-color: #f5b3b3;
    background: var(--td-error-color-1, #fdecee);
    color: var(--td-error-color, #d54941);
  }

  .cert-current--empty {
    border-style: dashed;
    text-align: center;
    padding: 26px 16px;
    color: rgba(0, 0, 0, 0.4);
  }

  .cert-current--bound {
    background: var(--td-brand-color-light, #f2f3ff);
    border-color: var(--td-brand-color-light-active, #d9e1ff);
  }

  .cert-current__top {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 8px;

    b {
      font-size: 15px;
    }
  }

  .cert-current__meta {
    display: flex;
    gap: 26px;
    flex-wrap: wrap;
    font-size: 13px;
    color: rgba(0, 0, 0, 0.6);
    line-height: 2;

    i {
      font-style: normal;
      color: rgba(0, 0, 0, 0.4);
      margin-right: 6px;
    }
  }

  .cert-current__acts {
    margin-top: 12px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .cert-pending {
    margin-top: 12px;
  }

  .cert-danger {
    margin-top: 16px;
  }

  .cert-divider {
    height: 1px;
    background: var(--td-component-stroke, #e7e7e7);
    margin: 20px 0;
  }

  /* 三张选择卡：把"该走哪条路"的判断依据并排摆出来 */
  .cert-choices {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  @media (max-width: 900px) {
    .cert-choices {
      grid-template-columns: 1fr;
    }
  }

  .cert-choice {
    border: 1px solid var(--td-component-border, #dcdcdc);
    border-radius: 3px;
    padding: 16px;
    cursor: pointer;
    background: #fff;
    display: flex;
    flex-direction: column;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:hover {
      border-color: var(--td-brand-color, #0052d9);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }

  .cert-choice--on {
    border-color: var(--td-brand-color, #0052d9);
    border-width: 2px;
    padding: 15px;
  }

  .cert-choice__title {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .cert-choice__who {
    font-size: 12px;
    color: var(--td-brand-color, #0052d9);
    margin-bottom: 10px;
    min-height: 32px;
  }

  .cert-choice__list {
    margin: 0;
    padding-left: 16px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
    line-height: 1.9;
    flex: 1;
  }

  .cert-choice__foot {
    margin-top: 12px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.4);
    border-top: 1px dashed var(--td-component-stroke, #e7e7e7);
    padding-top: 8px;
  }

  /* 选中卡片下方的展开面板，视觉上与卡片连成一体 */


  .cert-guide-alert {
    margin-top: 14px;
  }

  .cert-fp {
    margin-top: 10px;
  }

  .cert-fp__label {
    font-size: 12px;
    color: var(--td-text-color-secondary, rgba(0, 0, 0, 0.6));
    margin-bottom: 2px;
  }

  .cert-fp__val {
    display: block;
    font-family: Consolas, Monaco, monospace;
    font-size: 11px;
    line-height: 1.7;
    word-break: break-all;
    color: var(--td-text-color-primary, rgba(0, 0, 0, 0.9));
  }

  .cert-guide {
    margin-top: 12px;
  }

  .cert-guide__intro {
    font-size: 13px;
    color: var(--td-text-color-secondary, rgba(0, 0, 0, 0.6));
    margin-bottom: 8px;
  }

  .cert-guide__os {
    font-size: 13px;
    font-weight: 500;
    margin: 10px 0 4px;
  }

  .cert-guide__list {
    margin: 0 0 10px;
    padding-left: 18px;
    font-size: 13px;
    color: var(--td-text-color-secondary, rgba(0, 0, 0, 0.6));
    line-height: 2;
  }

  /* 最容易点错/最容易漏的那几步，视觉上拎出来 */
  .cert-guide__key {
    color: var(--td-warning-color, #e37318);
  }

  .cert-panel {
    border: 2px solid var(--td-brand-color, #0052d9);
    border-top: none;
    background: #fff;
    padding: 18px;
    border-radius: 0 0 3px 3px;
  }

  .cert-panel__title {
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .cert-steps {
    margin: 0 0 14px;
    padding-left: 20px;
    font-size: 13px;
    color: rgba(0, 0, 0, 0.6);
    line-height: 2;
  }

  .proxy-header-presets {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;

    .preset-label {
      color: rgba(0, 0, 0, 0.6);
      font-size: 12px;
      margin-right: 4px;
    }
  }

  .cert-info {
    color: rgba(0, 0, 0, 0.6);
    font-size: 14px;
    line-height: 24px;
  }
  </style>