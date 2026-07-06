<template>
    <div>
      <t-card class="list-card-container">
        <template #header>
          <t-row justify="space-between">
            <div class="card-header-title">
              <t-space>
                <div>{{ $t('page.vpconfig.title') }}</div>
                <t-tooltip :content="$t('page.vpconfig.description')">
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
      <t-card class="list-card-container">
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
          <t-form :data="trustedProxiesFormData" :label-width="180">
            <t-form-item :label="$t('page.vpconfig.trusted_proxies')">
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
      <t-card class="list-card-container">
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
      <t-card class="list-card-container">
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

      <t-card class="list-card-container">
        <template #header>
          <t-row justify="space-between">
            <div class="card-header-title">
              <t-space>
                <div>{{ $t('page.vpconfig.ssl_title') }}</div>
                <t-tooltip :content="$t('page.vpconfig.ssl_description')">
                  <t-icon name="help-circle" />
                </t-tooltip>
              </t-space>
            </div>
            <t-space>
              <t-button theme="warning" @click="showRestartDialog" v-if="sslFormData.ssl_enable">
                {{ $t('page.vpconfig.restart_manager') }}
              </t-button>
            </t-space>
          </t-row>
        </template>

        <t-loading :loading="sslLoading">
          <t-form ref="sslForm" :data="sslFormData" :label-width="180">
            <t-form-item :label="$t('page.vpconfig.ssl_enable')">
              <t-switch v-model="sslFormData.ssl_enable" @change="handleSslEnableChange" />
              <div class="form-item-tips">{{ $t('page.vpconfig.ssl_enable_tips') }}</div>
            </t-form-item>

            <t-form-item :label="$t('page.vpconfig.ssl_force_https')" v-if="sslFormData.ssl_enable">
              <t-switch v-model="sslForceHttpsFormData.force_https" @change="handleSslForceHttpsChange" />
              <div class="form-item-tips">{{ $t('page.vpconfig.ssl_force_https_tips') }}</div>
            </t-form-item>

            <t-form-item :label="$t('page.vpconfig.cert_status')" v-if="sslFormData.ssl_enable">
              <t-space direction="vertical" style="width: 100%">
                <div>
                  <t-tag v-if="sslFormData.has_cert" theme="success">{{ $t('page.vpconfig.cert_uploaded') }}</t-tag>
                  <t-tag v-else theme="warning">{{ $t('page.vpconfig.cert_not_uploaded') }}</t-tag>
                </div>
                <div v-if="sslFormData.has_cert && sslFormData.cert_domain" class="cert-info">
                  {{ $t('page.vpconfig.cert_domain') }}: {{ sslFormData.cert_domain }}
                </div>
                <div v-if="sslFormData.has_cert && sslFormData.cert_expire_at" class="cert-info">
                  {{ $t('page.vpconfig.cert_expire_at') }}: {{ sslFormData.cert_expire_at }}
                </div>
              </t-space>
            </t-form-item>

            <t-form-item :label="$t('page.vpconfig.cert_content')" v-if="sslFormData.ssl_enable">
              <t-textarea
                v-model="certFormData.cert_content"
                :placeholder="$t('page.vpconfig.cert_content_placeholder')"
                :autosize="{ minRows: 5, maxRows: 10 }"
              />
              <div class="form-item-tips">{{ $t('page.vpconfig.cert_content_tips') }}</div>
            </t-form-item>

            <t-form-item :label="$t('page.vpconfig.key_content')" v-if="sslFormData.ssl_enable">
              <t-textarea
                v-model="certFormData.key_content"
                :placeholder="$t('page.vpconfig.key_content_placeholder')"
                :autosize="{ minRows: 5, maxRows: 10 }"
              />
              <div class="form-item-tips">{{ $t('page.vpconfig.key_content_tips') }}</div>
            </t-form-item>

            <t-form-item v-if="sslFormData.ssl_enable">
              <t-space>
                <t-button theme="default" @click="showCertListDialog">{{ $t('page.vpconfig.select_from_certfolder') }}</t-button>
                <t-button theme="primary" @click="showUploadCertDialog">{{ $t('page.vpconfig.upload_cert') }}</t-button>
              </t-space>
            </t-form-item>

            <t-form-item :label="$t('page.vpconfig.ssl_bind_cert')" v-if="sslFormData.ssl_enable">
              <t-space direction="vertical" style="width: 100%">
                <div v-if="sslBindCert.ssl_config_id">
                  <t-tag theme="success">{{ $t('page.vpconfig.ssl_bind_cert_bound') }}</t-tag>
                  <span v-if="sslBindCert.domains" class="cert-info" style="margin-left: 8px">{{ sslBindCert.domains }}</span>
                  <span v-if="sslBindCert.valid_to" class="cert-info" style="margin-left: 8px">{{ $t('page.ssl.label_valid_to') }}: {{ sslBindCert.valid_to }}</span>
                </div>
                <div v-else>
                  <t-tag theme="default">{{ $t('page.vpconfig.ssl_bind_cert_unbound') }}</t-tag>
                </div>
                <t-space>
                  <t-button theme="primary" @click="showBindCertDialog">{{ $t('page.vpconfig.ssl_bind_cert_select') }}</t-button>
                  <t-button theme="danger" variant="outline" v-if="sslBindCert.ssl_config_id" @click="handleUnbindCert">{{ $t('page.vpconfig.ssl_bind_cert_unbind') }}</t-button>
                </t-space>
                <div class="form-item-tips">{{ $t('page.vpconfig.ssl_bind_cert_tips') }}</div>
              </t-space>
            </t-form-item>
          </t-form>
        </t-loading>
      </t-card>
      
      <!-- 安全路径入口卡片 -->
      <t-card class="list-card-container">
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
      <t-card class="list-card-container">
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
        @confirm="handleRestartManager"
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
  import { getIpWhitelistApi, updateIpWhitelistApi, getManageTrustedProxiesApi, updateManageTrustedProxiesApi, getCorsAllowOriginsApi, updateCorsAllowOriginsApi, getSslStatusApi, updateSslEnableApi, uploadSslCertApi, restartManagerApi, getSecurityEntryApi, updateSecurityEntryApi, getNoticeTitleApi, updateNoticeTitleApi, getDomainWhitelistApi, updateDomainWhitelistApi, getSslForceHttpsApi, updateSslForceHttpsApi, getSslBindCertApi, updateSslBindCertApi } from '@/apis/vpconfig';
  import { sslConfigListApi, sslConfigDetailApi } from '@/apis/sslconfig';
  import { MessagePlugin } from 'tdesign-vue';
  
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
      securityEntryFullUrl() {
        const protocol = window.location.protocol;
        const host = window.location.host;
        return `${protocol}//${host}/${this.savedSecurityEntry.entry_path}/`;
      }
    },
    mounted() {
      this.fetchData();
      this.fetchTrustedProxies();
      this.fetchCors();
      this.fetchDomainWhitelist();
      this.fetchSslStatus();
      this.fetchSslForceHttps();
      this.fetchSslBindCert();
      this.fetchSecurityEntry();
      this.fetchNoticeTitle();
    },
    methods: {
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
      },
      handleTrustedProxiesRefresh() {
        this.fetchTrustedProxies();
      },
      handleTrustedProxiesSave() {
        this.trustedProxiesLoading = true;
        updateManageTrustedProxiesApi({
          trusted_proxies: this.trustedProxiesFormData.trusted_proxies
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
      handleSslEnableChange(value) {
        this.sslLoading = true;
        updateSslEnableApi({
          ssl_enable: value
        })
          .then((res) => {
            if (res.code === 0) {
              MessagePlugin.success(res.msg || this.$t('common.tips.save_success'));
              this.fetchSslStatus();
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.save_failed'));
              // 恢复原值
              this.sslFormData.ssl_enable = !value;
            }
          })
          .catch((error) => {
            console.error('更新SSL启用状态失败:', error);
            MessagePlugin.error(this.$t('common.tips.save_failed'));
            // 恢复原值
            this.sslFormData.ssl_enable = !value;
          })
          .finally(() => {
            this.sslLoading = false;
          });
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
      handleSslForceHttpsChange(value) {
        this.sslLoading = true;
        updateSslForceHttpsApi({
          force_https: value
        })
          .then((res) => {
            if (res.code === 0) {
              MessagePlugin.success(res.msg || this.$t('common.tips.save_success'));
            } else {
              MessagePlugin.error(res.msg || this.$t('common.tips.save_failed'));
              this.sslForceHttpsFormData.force_https = !value;
            }
          })
          .catch((error) => {
            console.error('更新仅HTTPS开关失败:', error);
            MessagePlugin.error(this.$t('common.tips.save_failed'));
            this.sslForceHttpsFormData.force_https = !value;
          })
          .finally(() => {
            this.sslLoading = false;
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
      handleRestartManager() {
        this.restartDialogVisible = false;
        MessagePlugin.loading({
          content: this.$t('page.vpconfig.restarting'),
          duration: 0
        });
        
        restartManagerApi({})
          .then((res) => {
            if (res.code === 0) {
              MessagePlugin.success(res.msg || this.$t('page.vpconfig.restart_success'));
              
              // 提示用户等待
              setTimeout(() => {
                MessagePlugin.info(this.$t('page.vpconfig.restart_wait_tip'));
              }, 1500);
              
              // 5秒后尝试刷新页面
              setTimeout(() => {
                window.location.reload();
              }, 5000);
            } else {
              MessagePlugin.error(res.msg || this.$t('page.vpconfig.restart_failed'));
            }
          })
          .catch((error) => {
            console.error('重启管理端失败:', error);
            MessagePlugin.error(this.$t('page.vpconfig.restart_failed'));
          });
      }
    }
  });
  </script>
  
  <style lang="less" scoped>
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
  
  .cert-info {
    color: rgba(0, 0, 0, 0.6);
    font-size: 14px;
    line-height: 24px;
  }
  </style>