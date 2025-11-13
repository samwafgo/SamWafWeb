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
          </t-form>
        </t-loading>
      </t-card>
      
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
                <t-button theme="primary" size="small" @click="handleSelectCert(row)">
                  {{ $t('common.select_placeholder') }}
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
    </div>
  </template>
  
  <script lang="ts">
  import Vue from 'vue';
  import { prefix } from '@/config/global';
  import { getIpWhitelistApi, updateIpWhitelistApi, getSslStatusApi, updateSslEnableApi, uploadSslCertApi, restartManagerApi } from '@/apis/vpconfig';
  import { sslConfigListApi, sslConfigDetailApi } from '@/apis/sslconfig';
  import { MessagePlugin } from 'tdesign-vue';
  
  export default Vue.extend({
    name: 'VpConfig',
    data() {
      return {
        prefix,
        dataLoading: false,
        confirmDialogVisible: false,
        sslLoading: false,
        uploadCertDialogVisible: false,
        certListDialogVisible: false,
        certListLoading: false,
        restartDialogVisible: false,
        formData: {
          ip_whitelist: ''
        },
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
    mounted() {
      this.fetchData();
      this.fetchSslStatus();
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
        this.certListDialogVisible = true;
        this.fetchCertList();
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
      showRestartDialog() {
        this.restartDialogVisible = true;
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