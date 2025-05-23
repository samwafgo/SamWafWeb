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
      
      <!-- 确认对话框 -->
      <t-dialog
        :visible.sync="confirmDialogVisible"
        :header="$t('common.confirm')"
        :body="$t('page.vpconfig.save_confirm')"
        @confirm="handleSave"
        @cancel="confirmDialogVisible = false"
      />
    </div>
  </template>
  
  <script lang="ts">
  import Vue from 'vue';
  import { prefix } from '@/config/global';
  import { getIpWhitelistApi, updateIpWhitelistApi } from '@/apis/vpconfig';
  import { MessagePlugin } from 'tdesign-vue';
  
  export default Vue.extend({
    name: 'VpConfig',
    data() {
      return {
        prefix,
        dataLoading: false,
        confirmDialogVisible: false,
        formData: {
          ip_whitelist: ''
        },
        rules: {
          ip_whitelist: [
            { required: true, message: this.$t('common.required'), type: 'error' }
          ]
        }
      };
    },
    mounted() {
      this.fetchData();
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
  </style>