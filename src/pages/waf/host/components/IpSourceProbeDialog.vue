<template>
  <!-- 真实IP来源诊断：展示最近真实到达该站点的请求头(已脱敏)。
       站点编辑页与访问日志页共用同一个组件，避免两处逻辑走偏。 -->
  <t-dialog :header="dialogTitle" :visible="visible" :width="900" :footer="false"
            @update:visible="(v) => $emit('update:visible', v)">
    <div slot="body">
      <!-- 探针默认关闭：先把开关状态摆在最上面，避免用户对着空列表反复刷新 -->
      <t-alert v-if="probeData && !probeData.probe_enabled" theme="warning">
        <div>
          {{ $t('page.host.ip_probe_switch_off') }}
          <t-button size="small" theme="primary" style="margin-left: 8px;" :loading="switching" @click="toggleProbe(true)">
            {{ $t('page.host.ip_probe_enable_btn') }}
          </t-button>
        </div>
      </t-alert>
      <t-alert v-else theme="info">
        <div>
          {{ $t('page.host.ip_probe_tips') }}
          <a class="t-button-link" style="margin-left: 6px;" @click="toggleProbe(false)">{{ $t('page.host.ip_probe_disable_btn') }}</a>
        </div>
      </t-alert>

      <div class="ip-probe-toolbar">
        <div class="ip-probe-summary" v-if="probeData">
          <span>{{ $t('page.host.ip_probe_cur_mode') }}：<b>{{ modeText }}</b></span>
          <span>
            {{ $t('page.host.ip_probe_effective_header') }}：
            <b :style="{ color: probeData.compat_header_unset ? 'var(--td-error-color)' : '' }">
              {{ probeData.effective_header || (probeData.compat_header_unset ? $t('page.host.ip_probe_effective_header_unset') : $t('page.host.ip_probe_effective_header_none')) }}
            </b>
          </span>
          <span v-if="probeData.ip_source_mode === 'cdn_preset'">
            {{ $t('page.host.ip_probe_provider_ranges') }}：
            <b :style="{ color: probeData.provider_range_count > 0 ? 'var(--td-success-color)' : 'var(--td-error-color)' }">
              {{ $t('page.host.ip_probe_provider_ranges_count', { count: probeData.provider_range_count }) }}
            </b>
          </span>
        </div>
        <div>
          <t-button size="small" :loading="loading" @click="loadProbe">{{ $t('page.host.ip_probe_refresh') }}</t-button>
          <t-button size="small" variant="outline" style="margin-left: 8px;" @click="clearProbe">{{ $t('page.host.ip_probe_clear') }}</t-button>
        </div>
      </div>

      <div v-if="!loading && (!probeData || !probeData.samples || probeData.samples.length === 0)" class="ip-probe-empty">
        {{ probeData && !probeData.probe_enabled ? $t('page.host.ip_probe_empty_off') : $t('page.host.ip_probe_empty') }}
      </div>

      <div v-for="(sample, idx) in (probeData && probeData.samples) || []" :key="idx" class="ip-probe-sample">
        <div class="ip-probe-sample-head">
          <span>{{ sample.time }}</span>
          <span class="ip-probe-req">{{ sample.method }} {{ sample.host }}{{ sample.url }}</span>
        </div>
        <div class="ip-probe-line">
          <span>{{ $t('page.host.ip_probe_net_ip') }}：<b>{{ sample.net_ip || '-' }}</b></span>
          <t-tag v-if="needTrustCheck" size="small" variant="light"
                 :theme="sample.net_ip_trusted ? 'success' : 'danger'" style="margin-left: 6px;">
            {{ sample.net_ip_trusted ? $t('page.host.ip_probe_trusted') : $t('page.host.ip_probe_untrusted') }}
          </t-tag>
          <span class="ip-probe-resolved">{{ $t('page.host.ip_probe_resolved_ip') }}：<b>{{ sample.resolved_ip || '-' }}</b></span>
        </div>
        <div v-for="(tip, ti) in sampleTips(sample)" :key="'tip' + ti"
             :class="['ip-probe-tip', tip.type === 'ok' ? 'ip-probe-tip--ok' : 'ip-probe-tip--warn']">{{ tip.text }}</div>
        <table class="ip-probe-table">
          <thead>
            <tr>
              <th style="width: 210px;">{{ $t('page.host.ip_probe_col_name') }}</th>
              <th>{{ $t('page.host.ip_probe_col_value') }}</th>
              <th style="width: 150px;">{{ $t('page.host.ip_probe_col_ip') }}</th>
              <th v-if="canUseHeader" style="width: 100px;">{{ $t('page.host.ip_probe_col_action') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(header, hi) in sample.headers" :key="hi" :class="{ 'ip-probe-row--ip': header.is_ip_header }">
              <td>{{ header.name }}</td>
              <td class="ip-probe-value">
                {{ header.value }}
                <t-tag v-if="header.masked" size="small" variant="light">{{ $t('page.host.ip_probe_masked') }}</t-tag>
              </td>
              <td>{{ header.parsed_ip || '-' }}</td>
              <td v-if="canUseHeader">
                <a v-if="header.parsed_ip" class="t-button-link" @click="$emit('use-header', header.name)">{{ $t('page.host.ip_probe_use_header') }}</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </t-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { getIpSourceProbe, clearIpSourceProbe } from '@/apis/host';
import { get_detail_by_item_api, edit_system_config_api } from '@/apis/systemconfig';

export default Vue.extend({
  name: 'IpSourceProbeDialog',
  props: {
    visible: { type: Boolean, default: false },
    hostCode: { type: String, default: '' },
    hostName: { type: String, default: '' },
    // 站点编辑页里可以"用这个头"一键回填；日志页只看不改
    canUseHeader: { type: Boolean, default: false },
  },
  data() {
    return {
      loading: false,
      switching: false,
      probeData: null,
    };
  },
  computed: {
    dialogTitle(): string {
      const name = this.hostName ? ` · ${this.hostName}` : '';
      return `${this.$t('page.host.ip_probe_title')}${name}`;
    },
    modeText(): string {
      const map = {
        '': 'page.host.ip_source_compat',
        nic: 'page.host.ip_mode_nic',
        header: 'page.host.ip_source_header',
        xff_depth: 'page.host.ip_source_xff',
        cdn_preset: 'page.host.ip_source_cdn',
      };
      const mode = (this.probeData && this.probeData.ip_source_mode) || '';
      return this.$t(map[mode] || 'page.host.ip_source_compat');
    },
    // 只有会做来源校验的模式，标"来源可信/不可信"才有意义
    needTrustCheck(): boolean {
      if (!this.probeData) return false;
      if (this.probeData.ip_source_mode === 'cdn_preset') return true;
      return ['header', 'xff_depth'].indexOf(this.probeData.ip_source_mode) >= 0
        && !!(this.probeData.ip_trust_proxies || '').trim();
    },
  },
  watch: {
    visible(val) {
      if (val) this.loadProbe();
    },
  },
  methods: {
    loadProbe() {
      if (!this.hostCode) return;
      this.loading = true;
      getIpSourceProbe({ code: this.hostCode })
        .then((res) => {
          if (res.code === 0) {
            this.probeData = res.data;
          } else {
            this.$message.error(res.msg);
          }
        })
        .catch((e) => { console.log(e); })
        .finally(() => { this.loading = false; });
    },
    clearProbe() {
      if (!this.hostCode) return;
      clearIpSourceProbe({ code: this.hostCode })
        .then(() => { this.probeData = null; this.loadProbe(); })
        .catch((e) => { console.log(e); });
    },
    // 开/关探针总开关(系统配置 ipprobe_enable)，关闭时后端会顺带清空已采样本
    toggleProbe(enable) {
      this.switching = true;
      get_detail_by_item_api({ item: 'ipprobe_enable' })
        .then((res) => {
          if (res.code !== 0 || !res.data) {
            this.$message.error(res.msg);
            return null;
          }
          const config = { ...res.data, value: enable ? '1' : '0' };
          return edit_system_config_api(config);
        })
        .then((res) => {
          if (!res) return;
          if (res.code === 0) {
            this.$message.success(this.$t(enable ? 'page.host.ip_probe_enable_ok' : 'page.host.ip_probe_disable_ok'));
            this.loadProbe();
          } else {
            this.$message.error(res.msg);
          }
        })
        .catch((e) => { console.log(e); })
        .finally(() => { this.switching = false; });
    },
    // 一条采样的结论：哪一步没走通，直接写清楚
    sampleTips(sample) {
      const tips = [];
      const data = this.probeData || {};
      // 兼容模式最容易踩的坑：全局「获取访客IP头信息」没配，等于谁都不读，永远取网络层IP
      if (data.compat_header_unset) {
        tips.push({ type: 'warn', text: this.$t('page.host.ip_probe_tip_compat_unset') });
      }
      if (data.ip_source_mode === 'cdn_preset' && !sample.net_ip_trusted) {
        tips.push({ type: 'warn', text: this.$t('page.host.ip_probe_tip_untrusted') });
      }
      if (data.effective_header && !sample.config_header_present) {
        tips.push({ type: 'warn', text: this.$t('page.host.ip_probe_tip_header_missing', { header: data.effective_header }) });
      }
      if (sample.fallback) {
        tips.push({ type: 'warn', text: this.$t('page.host.ip_probe_tip_fallback') });
      }
      if (tips.length === 0) {
        tips.push({ type: 'ok', text: this.$t('page.host.ip_probe_tip_ok') });
      }
      return tips;
    },
  },
});
</script>

<style scoped>
.ip-probe-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0 8px;
  flex-wrap: wrap;
  gap: 8px;
}
.ip-probe-summary span {
  margin-right: 16px;
  color: var(--td-text-color-secondary, rgba(0, 0, 0, 0.6));
}
.ip-probe-empty {
  padding: 24px;
  text-align: center;
  color: var(--td-text-color-placeholder, rgba(0, 0, 0, 0.4));
}
.ip-probe-sample {
  border: 1px solid var(--td-component-border, #dcdcdc);
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 12px;
}
.ip-probe-sample-head {
  display: flex;
  justify-content: space-between;
  color: var(--td-text-color-secondary, rgba(0, 0, 0, 0.6));
  font-size: 12px;
  margin-bottom: 6px;
}
.ip-probe-req {
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ip-probe-line {
  margin-bottom: 6px;
}
.ip-probe-resolved {
  margin-left: 24px;
}
.ip-probe-tip {
  font-size: 12px;
  line-height: 1.6;
  margin-bottom: 4px;
}
.ip-probe-tip--warn {
  color: var(--td-error-color, #d54941);
}
.ip-probe-tip--ok {
  color: var(--td-success-color, #2ba471);
}
.ip-probe-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12px;
  margin-top: 6px;
}
.ip-probe-table th,
.ip-probe-table td {
  border: 1px solid var(--td-component-stroke, #e7e7e7);
  padding: 4px 8px;
  text-align: left;
  word-break: break-all;
}
.ip-probe-row--ip {
  background: var(--td-brand-color-light, #f2f3ff);
}
.ip-probe-value {
  word-break: break-all;
}
</style>
