<template>
  <div>
    <t-card class="list-card-container">
      <t-alert theme="info" :message="$t('page.cdnip.alert_message')" close style="margin-bottom: 12px;" />
      <t-table :columns="columns" :data="data" rowKey="provider" verticalAlign="top" :hover="true" :loading="loading">
        <template #tier="{ row }">
          <t-tag v-if="row.tier === 'A'" theme="success" variant="light">{{ $t('page.cdnip.tier_public') }}</t-tag>
          <t-tag v-else-if="row.tier === 'A_auth'" theme="warning" variant="light">{{ $t('page.cdnip.tier_auth') }}</t-tag>
          <t-tag v-else theme="default" variant="light">{{ $t('page.cdnip.tier_header') }}</t-tag>
        </template>
        <template #auto_fetch="{ row }">
          <t-switch v-if="row.fetch_kind !== 'none'" :value="row.auto_fetch === 1"
                    @change="(v) => onToggleAutoFetch(row, v)" />
          <span v-else>-</span>
        </template>
        <template #count="{ row }">
          <t-tag v-if="row.count > 0" theme="primary" variant="light">{{ row.count }}</t-tag>
          <span v-else>0</span>
        </template>
        <template #in_use="{ row }">
          <t-tag v-if="row.in_use" theme="success" variant="light">{{ $t('page.cdnip.in_use_yes') }}</t-tag>
          <span v-else>-</span>
        </template>
        <template #last_sync_at="{ row }">
          <span>{{ formatTs(row.last_sync_at) }}</span>
        </template>
        <template #op="{ row }">
          <a v-if="row.fetch_kind !== 'none'" class="t-button-link" @click="onRefresh(row)">{{ $t('page.cdnip.refresh_now') }}</a>
          <a v-if="row.count > 0" class="t-button-link" @click="onViewIPs(row)">{{ $t('page.cdnip.view_ips') }}</a>
          <a v-if="row.need_credential" class="t-button-link" @click="onOpenCredential(row)">
            {{ row.has_credential ? $t('page.cdnip.edit_credential') : $t('page.cdnip.set_credential') }}
          </a>
        </template>
      </t-table>
    </t-card>

    <!-- 凭证配置弹窗(认证型厂商) -->
    <t-dialog :header="credTitle" :visible.sync="credVisible" :width="720" :footer="false">
      <div slot="body">
        <!-- 操作指引：告诉用户密钥去哪拿、要什么权限、站点ID在哪看 -->
        <div class="cred-guide">
          <div class="cred-guide-title">{{ $t('page.cdnip.guide_title') }}</div>
          <ol class="cred-guide-list">
            <li v-for="(step, idx) in credGuideSteps" :key="idx">
              <span>{{ step.text }}</span>
              <a v-if="step.link" class="cred-guide-link" :href="step.link" target="_blank" rel="noopener noreferrer">{{ step.linkText }}</a>
            </li>
          </ol>
        </div>
        <t-alert theme="warning" :message="$t('page.cdnip.credential_tips')" style="margin-bottom: 12px;" />
        <!-- autocomplete 关掉：AccessKey 文本框 + 密钥密码框会被浏览器当成登录表单，填进 admin 口令 -->
        <t-form :data="credForm" :labelWidth="150" autocomplete="off">
          <!-- EdgeOne：中国站 / 国际站 二选一(账号与密钥各自独立、接口域名也不同) -->
          <t-form-item v-if="credProvider === 'edgeone'" :label="$t('page.cdnip.eo_edition')" name="edition">
            <t-radio-group v-model="eoForm.edition">
              <t-radio value="cn">{{ $t('page.cdnip.eo_edition_cn') }}</t-radio>
              <t-radio value="intl">{{ $t('page.cdnip.eo_edition_intl') }}</t-radio>
            </t-radio-group>
            <div class="form-item-tips">{{ $t('page.cdnip.eo_edition_tips') }}</div>
          </t-form-item>
          <t-form-item :label="$t('page.cdnip.secret_id')" name="secret_id">
            <t-input v-model="credForm.secret_id" :style="{ width: '420px' }" autocomplete="off"
                     :placeholder="credHasCredential ? $t('page.cdnip.secret_keep') : credSecretIdPlaceholder" />
            <div class="form-item-tips">{{ credSecretTips }}</div>
          </t-form-item>
          <t-form-item :label="$t('page.cdnip.secret_key')" name="secret_key">
            <t-input v-model="credForm.secret_key" type="password" :style="{ width: '420px' }" autocomplete="new-password"
                     :placeholder="credHasCredential ? $t('page.cdnip.secret_keep') : credSecretKeyPlaceholder" />
          </t-form-item>
          <!-- EdgeOne 站点ID -->
          <template v-if="credProvider === 'edgeone'">
            <t-form-item :label="$t('page.cdnip.eo_zone_id')" name="zone_id">
              <t-input v-model="eoForm.zone_id" :style="{ width: '420px' }" placeholder="zone-xxxxxxxxxxxx" />
              <div class="form-item-tips">{{ $t('page.cdnip.eo_zone_id_tips') }}</div>
            </t-form-item>
          </template>
          <!-- 阿里云 加速域名 + 地域 -->
          <template v-else-if="credProvider === 'aliyun'">
            <t-form-item :label="$t('page.cdnip.ali_domain')" name="domain">
              <t-input v-model="aliForm.domain" :style="{ width: '420px' }" placeholder="cdn.example.com" />
              <div class="form-item-tips">{{ $t('page.cdnip.ali_domain_tips') }}</div>
            </t-form-item>
            <t-form-item :label="$t('page.cdnip.ali_region')" name="region">
              <t-input v-model="aliForm.region" :style="{ width: '420px' }" placeholder="cn-hangzhou" />
            </t-form-item>
          </template>
          <!-- 其它厂商：保留原始 JSON 输入 -->
          <t-form-item v-else :label="$t('page.cdnip.extra_param')" name="extra_param">
            <t-input v-model="credForm.extra_param" :style="{ width: '420px' }" />
          </t-form-item>
          <t-form-item style="float: right">
            <t-button v-if="credHasCredential" theme="danger" variant="outline" @click="onClearCredential">{{ $t('page.cdnip.clear_credential') }}</t-button>
            <t-button variant="outline" @click="credVisible = false">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" @click="onSaveCredential">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 回源段只读浏览弹窗 -->
    <t-dialog :header="ipDialogTitle" :visible.sync="ipDialogVisible" :width="600" :footer="false">
      <div slot="body">
        <t-form :data="ipSearch" layout="inline" colon :style="{ marginBottom: '8px' }">
          <t-form-item :label="'IP'" name="keyword">
            <t-input v-model="ipSearch.keyword" clearable :style="{ width: '260px' }" @enter="reloadIPs" />
          </t-form-item>
          <t-form-item>
            <t-button theme="primary" @click="reloadIPs">{{ $t('common.search') }}</t-button>
          </t-form-item>
        </t-form>
        <t-table :columns="ipColumns" :data="ipData" rowKey="ip" verticalAlign="top" :hover="true"
                 :pagination="ipPagination" :loading="ipLoading" @page-change="onIPPageChange" />
      </div>
    </t-dialog>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import {
    wafCDNProviderListApi, wafCDNProviderAutoFetchApi, wafCDNProviderRefreshApi,
    wafCDNProviderCredentialApi, wafCDNProviderCredentialClearApi, wafCDNProviderRangesApi,
  } from '@/apis/cdnip';

  export default Vue.extend({
    name: 'CDNIPList',
    data() {
      return {
        loading: false,
        data: [],
        columns: [
          { title: this.$t('page.cdnip.col_name'), align: 'left', width: 150, colKey: 'name' },
          { title: this.$t('page.cdnip.col_header'), width: 170, colKey: 'header' },
          { title: this.$t('page.cdnip.col_tier'), width: 110, colKey: 'tier' },
          { title: this.$t('page.cdnip.col_auto_fetch'), width: 90, colKey: 'auto_fetch' },
          { title: this.$t('page.cdnip.col_count'), width: 100, colKey: 'count' },
          { title: this.$t('page.cdnip.col_in_use'), width: 90, colKey: 'in_use' },
          { title: this.$t('page.cdnip.col_last_sync'), width: 170, colKey: 'last_sync_at' },
          { title: this.$t('page.cdnip.col_status'), align: 'left', ellipsis: true, colKey: 'last_status' },
          { title: this.$t('common.op'), align: 'left', width: 200, colKey: 'op' },
        ],
        // 凭证弹窗
        credVisible: false,
        credTitle: '',
        credProvider: '',
        credHasCredential: false,
        credForm: { secret_id: '', secret_key: '', extra_param: '' },
        // EdgeOne：站点版本(中国站/国际站) + 站点ID
        eoForm: { edition: 'cn', zone_id: '', region: '' },
        // 阿里云：加速域名 + 地域
        aliForm: { domain: '', region: 'cn-hangzhou' },
        // IP 浏览
        ipDialogVisible: false,
        ipDialogTitle: '',
        ipProvider: '',
        ipSearch: { keyword: '' },
        ipLoading: false,
        ipData: [],
        ipPagination: { total: 0, current: 1, pageSize: 10 },
        ipColumns: [{ title: 'IP / CIDR', align: 'left', colKey: 'ip' }],
      };
    },
    computed: {
      // 是否国际版 EdgeOne(edgeone.ai)：控制台/密钥/接口域名都与中国站不同
      isEdgeOneIntl() {
        return this.credProvider === 'edgeone' && this.eoForm.edition === 'intl';
      },
      credSecretIdPlaceholder() {
        return this.credProvider === 'aliyun' ? 'AccessKeyId' : 'SecretId';
      },
      credSecretKeyPlaceholder() {
        return this.credProvider === 'aliyun' ? 'AccessKeySecret' : 'SecretKey';
      },
      credSecretTips() {
        if (this.credProvider === 'edgeone') return this.$t('page.cdnip.eo_secret_tips');
        if (this.credProvider === 'aliyun') return this.$t('page.cdnip.ali_secret_tips');
        return '';
      },
      // 弹窗顶部的分步指引(含官方链接)
      credGuideSteps() {
        if (this.credProvider === 'edgeone') {
          const intl = this.isEdgeOneIntl;
          const consoleUrl = intl ? 'https://console.tencentcloud.com/edgeone' : 'https://console.cloud.tencent.com/edgeone';
          const capiUrl = intl ? 'https://console.tencentcloud.com/cam/capi' : 'https://console.cloud.tencent.com/cam/capi';
          const docUrl = intl ? 'https://edgeone.ai/document/zh/48535' : 'https://cloud.tencent.com/document/product/1552/120406';
          return [
            { text: this.$t('page.cdnip.eo_guide_1'), link: consoleUrl, linkText: this.$t('page.cdnip.link_console') },
            { text: this.$t('page.cdnip.eo_guide_2'), link: consoleUrl, linkText: this.$t('page.cdnip.link_zone') },
            { text: this.$t('page.cdnip.eo_guide_3'), link: capiUrl, linkText: this.$t('page.cdnip.link_capi') },
            { text: this.$t('page.cdnip.eo_guide_4'), link: docUrl, linkText: this.$t('page.cdnip.link_doc') },
          ];
        }
        if (this.credProvider === 'aliyun') {
          return [
            { text: this.$t('page.cdnip.ali_guide_1'), link: 'https://ram.console.aliyun.com/manage/ak', linkText: this.$t('page.cdnip.link_capi') },
            { text: this.$t('page.cdnip.ali_guide_2'), link: 'https://cdn.console.aliyun.com/domain/list', linkText: this.$t('page.cdnip.link_console') },
            { text: this.$t('page.cdnip.ali_guide_3'), link: 'https://help.aliyun.com/zh/cdn/developer-reference/api-cdn-2018-05-10-describel2vipsbydomain', linkText: this.$t('page.cdnip.link_doc') },
          ];
        }
        return [];
      },
    },
    mounted() {
      this.loadList();
    },
    methods: {
      formatTs(ts) {
        if (!ts) return '-';
        return new Date(ts * 1000).toLocaleString();
      },
      loadList() {
        this.loading = true;
        wafCDNProviderListApi({})
          .then((res) => {
            if (res.code === 0) this.data = res.data ?? [];
          })
          .catch((e: Error) => { console.log(e); })
          .finally(() => { this.loading = false; });
      },
      onToggleAutoFetch(row, v) {
        wafCDNProviderAutoFetchApi({ provider: row.provider, auto_fetch: v ? 1 : 0 })
          .then((res) => {
            if (res.code === 0) {
              this.$message.success(res.msg);
              if (v) this.$message.info(this.$t('page.cdnip.fetch_started'));
              setTimeout(() => this.loadList(), 1500);
            } else {
              this.$message.warning(res.msg);
              this.loadList();
            }
          })
          .catch((e: Error) => { console.log(e); });
      },
      onRefresh(row) {
        this.$message.info(this.$t('page.cdnip.fetch_started'));
        wafCDNProviderRefreshApi({ provider: row.provider })
          .then((res) => {
            if (res.code === 0) this.$message.success(res.msg);
            else this.$message.warning(res.msg);
            this.loadList();
          })
          .catch((e: Error) => { console.log(e); });
      },
      onOpenCredential(row) {
        this.credProvider = row.provider;
        this.credTitle = row.name + ' ' + this.$t('page.cdnip.credential');
        this.credHasCredential = row.has_credential;
        this.credForm = { secret_id: '', secret_key: '', extra_param: row.extra_param || '' };
        // 把已存的扩展参数 JSON 回填到结构化表单
        let extra = {};
        try {
          extra = JSON.parse(row.extra_param || '{}') || {};
        } catch (e) {
          extra = {};
        }
        this.eoForm = { edition: extra.edition === 'intl' ? 'intl' : 'cn', zone_id: extra.zone_id || '', region: extra.region || '' };
        this.aliForm = { domain: extra.domain || '', region: extra.region || 'cn-hangzhou' };
        this.credVisible = true;
      },
      // 结构化表单 → 后端存储用的扩展参数 JSON
      buildExtraParam() {
        if (this.credProvider === 'edgeone') {
          return JSON.stringify({
            zone_id: (this.eoForm.zone_id || '').trim(),
            edition: this.eoForm.edition,
            region: (this.eoForm.region || '').trim(),
          });
        }
        if (this.credProvider === 'aliyun') {
          return JSON.stringify({
            domain: (this.aliForm.domain || '').trim(),
            region: (this.aliForm.region || '').trim(),
          });
        }
        return this.credForm.extra_param;
      },
      onSaveCredential() {
        if (this.credProvider === 'edgeone' && !(this.eoForm.zone_id || '').trim()) {
          this.$message.warning(this.$t('page.cdnip.eo_zone_id_required'));
          return;
        }
        if (this.credProvider === 'aliyun' && !(this.aliForm.domain || '').trim()) {
          this.$message.warning(this.$t('page.cdnip.ali_domain_required'));
          return;
        }
        wafCDNProviderCredentialApi({
          provider: this.credProvider,
          secret_id: this.credForm.secret_id,
          secret_key: this.credForm.secret_key,
          extra_param: this.buildExtraParam(),
        })
          .then((res) => {
            if (res.code === 0) {
              this.$message.success(res.msg);
              this.credVisible = false;
              this.loadList();
            } else {
              this.$message.warning(res.msg);
            }
          })
          .catch((e: Error) => { console.log(e); });
      },
      onClearCredential() {
        wafCDNProviderCredentialClearApi({ provider: this.credProvider })
          .then((res) => {
            if (res.code === 0) {
              this.$message.success(res.msg);
              this.credVisible = false;
              this.loadList();
            } else {
              this.$message.warning(res.msg);
            }
          })
          .catch((e: Error) => { console.log(e); });
      },
      onViewIPs(row) {
        this.ipProvider = row.provider;
        this.ipDialogTitle = row.name;
        this.ipSearch.keyword = '';
        this.ipPagination.current = 1;
        this.ipDialogVisible = true;
        this.loadIPs();
      },
      reloadIPs() {
        this.ipPagination.current = 1;
        this.loadIPs();
      },
      loadIPs() {
        this.ipLoading = true;
        wafCDNProviderRangesApi({
          provider: this.ipProvider,
          keyword: this.ipSearch.keyword,
          pageIndex: this.ipPagination.current,
          pageSize: this.ipPagination.pageSize,
        })
          .then((res) => {
            if (res.code === 0) {
              this.ipData = (res.data.list ?? []).map((ip) => ({ ip }));
              this.ipPagination = { ...this.ipPagination, total: res.data.total };
            }
          })
          .catch((e: Error) => { console.log(e); })
          .finally(() => { this.ipLoading = false; });
      },
      onIPPageChange(curr) {
        this.ipPagination.current = curr.current;
        if (this.ipPagination.pageSize != curr.pageSize) {
          this.ipPagination.current = 1;
          this.ipPagination.pageSize = curr.pageSize;
        }
        this.loadIPs();
      },
    },
  });
</script>

<style lang="less" scoped>
  .cred-guide {
    background: var(--td-bg-color-container-hover);
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 12px;
  }
  .cred-guide-title {
    font-weight: 600;
    margin-bottom: 6px;
  }
  .cred-guide-list {
    margin: 0;
    padding-left: 18px;
    color: var(--td-text-color-secondary);
    font-size: 12px;
    line-height: 20px;
  }
  .cred-guide-link {
    margin-left: 6px;
    color: var(--td-brand-color);
  }
  .form-item-tips {
    color: var(--td-text-color-placeholder);
    font-size: 12px;
    margin-top: 4px;
  }
  .t-button-link + .t-button-link {
    margin-left: 12px;
  }
</style>
