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
    <t-dialog :header="credTitle" :visible.sync="credVisible" :width="620" :footer="false">
      <div slot="body">
        <t-alert theme="warning" :message="$t('page.cdnip.credential_tips')" style="margin-bottom: 12px;" />
        <t-form :data="credForm" :labelWidth="130">
          <t-form-item :label="$t('page.cdnip.secret_id')" name="secret_id">
            <t-input v-model="credForm.secret_id" :style="{ width: '420px' }"
                     :placeholder="credHasCredential ? $t('page.cdnip.secret_keep') : 'SecretId / AccessKeyId'" />
          </t-form-item>
          <t-form-item :label="$t('page.cdnip.secret_key')" name="secret_key">
            <t-input v-model="credForm.secret_key" type="password" :style="{ width: '420px' }"
                     :placeholder="credHasCredential ? $t('page.cdnip.secret_keep') : 'SecretKey / AccessKeySecret'" />
          </t-form-item>
          <t-form-item :label="$t('page.cdnip.extra_param')" name="extra_param">
            <t-input v-model="credForm.extra_param" :style="{ width: '420px' }" :placeholder="credExtraPlaceholder" />
            <div class="form-item-tips">{{ credExtraTips }}</div>
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
        credExtraPlaceholder: '',
        credExtraTips: '',
        credForm: { secret_id: '', secret_key: '', extra_param: '' },
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
        if (row.provider === 'edgeone') {
          this.credExtraPlaceholder = '{"zone_id":"zone-xxxx","region":""}';
          this.credExtraTips = this.$t('page.cdnip.extra_tips_edgeone');
        } else if (row.provider === 'aliyun') {
          this.credExtraPlaceholder = '{"domain":"cdn.example.com","region":"cn-hangzhou"}';
          this.credExtraTips = this.$t('page.cdnip.extra_tips_aliyun');
        } else {
          this.credExtraPlaceholder = '';
          this.credExtraTips = '';
        }
        this.credVisible = true;
      },
      onSaveCredential() {
        wafCDNProviderCredentialApi({
          provider: this.credProvider,
          secret_id: this.credForm.secret_id,
          secret_key: this.credForm.secret_key,
          extra_param: this.credForm.extra_param,
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
  .form-item-tips {
    color: var(--td-text-color-placeholder);
    font-size: 12px;
    margin-top: 4px;
  }
  .t-button-link + .t-button-link {
    margin-left: 12px;
  }
</style>
