<template>
  <t-dialog :visible="true" :header="tr('title')" width="min(1100px, calc(100vw - 32px))"
    :footer="false" :close-on-overlay-click="false" @close="requestExit('close')">
    <div class="protection-body">
      <div class="protection-bar">
        <div class="protection-inline">
          <strong>{{ tunnel.name }}</strong>
          <t-tag variant="light">{{ protocol }}</t-tag>
          <t-tag v-if="detail" :theme="detail.whitelist_active ? 'primary' : 'default'" variant="light">
            {{ tr(detail.whitelist_active ? 'whitelist_on' : 'whitelist_off') }}
          </t-tag>
        </div>
        <t-button v-if="canViewAudit" variant="outline" size="small" :disabled="!!busy"
          @click="openAudit()">{{ tr('audit_all') }}</t-button>
      </div>
      <t-alert v-if="loadError" theme="warning" :message="loadError" />
      <t-loading :loading="busy === 'detail'" :text="tr('loading')" size="small">
        <div v-if="!detail" class="protection-empty">
          <t-button v-if="loadError && !forbidden" variant="outline" :disabled="!!busy"
            @click="reload()">{{ tr('retry') }}</t-button>
        </div>
        <template v-else>
          <p class="protection-note">{{ tr('source_note') }} {{ tr('connection_note') }}</p>
          <t-tabs v-model="tab">
            <t-tab-panel value="ddns" :label="tr('ddns_tab')">
              <div class="protection-section">
                <div class="protection-bar">
                  <strong>{{ tr('fixed_lists') }}</strong>
                </div>
                <p class="protection-note">{{ tr('fixed_note') }}</p>
                <div class="fixed-form">
                  <label class="fixed-row">
                    <span class="fixed-label">{{ tr('fixed_allow') }}</span>
                    <t-input v-model="fixedAllow" :disabled="!!busy" :placeholder="tr('fixed_allow_placeholder')"
                      :aria-label="tr('fixed_allow')" />
                  </label>
                  <label class="fixed-row">
                    <span class="fixed-label">{{ tr('fixed_deny') }}</span>
                    <t-input v-model="fixedDeny" :disabled="!!busy" :placeholder="tr('fixed_deny_placeholder')"
                      :aria-label="tr('fixed_deny')" />
                  </label>
                  <label class="fixed-row">
                    <span class="fixed-label">{{ $t('page.tunnel.allowed_time_ranges') }}</span>
                    <t-input v-model="fixedTime" :disabled="!!busy"
                      :placeholder="$t('page.tunnel.allowed_time_ranges_placeholder')"
                      :aria-label="$t('page.tunnel.allowed_time_ranges')" />
                  </label>
                  <p class="protection-note fixed-time-tips">{{ $t('page.tunnel.allowed_time_ranges_tips') }}</p>
                </div>
                <div class="protection-bar">
                  <span class="protection-note">{{ dirtyFixed ? tr('unsaved') : '' }}</span>
                  <div class="protection-inline">
                    <t-button v-if="dirtyFixed || loadError" variant="outline" :disabled="!!busy"
                      @click="requestReset('fixed')">{{ tr('reload_fixed') }}</t-button>
                    <t-button theme="primary" :loading="busy === 'fixed'" :disabled="!!busy || !dirtyFixed || !!loadError"
                      @click="saveFixed">{{ tr('save_fixed') }}</t-button>
                  </div>
                </div>
                <div class="protection-bar">
                  <strong>{{ tr('ddns_title') }}</strong>
                  <div class="protection-inline">
                    <t-button v-if="canViewAudit" variant="text" theme="primary" :disabled="!!busy"
                      @click="openAudit('config_tunnel_ddns_addresses')">{{ tr('audit_ddns') }}</t-button>
                    <t-button variant="outline" size="small" :disabled="!!busy" @click="reload()">{{ tr('refresh_status') }}</t-button>
                    <t-button variant="outline" size="small" :disabled="!!busy || ddns.bindings.length >= maxBindings"
                      @click="addBinding">{{ tr('add_binding') }}</t-button>
                  </div>
                </div>
                <p class="protection-note">{{ tr('ddns_note') }}</p>
                <p class="protection-note">{{ tr('ddns_public_note') }}</p>
                <t-alert v-if="willDisableWhitelist" theme="warning" :message="tr('whitelist_warning')" />
                <div class="protection-scroll">
                  <table class="protection-table ddns-table">
                    <thead><tr>
                      <th scope="col">{{ tr('domain') }}</th><th scope="col">{{ tr('family') }}</th>
                      <th scope="col">{{ tr('enabled') }}</th><th scope="col">{{ tr('resolved_ips') }}</th>
                      <th scope="col">{{ tr('state') }}</th><th scope="col">{{ tr('times') }}</th>
                      <th scope="col">{{ $t('common.op') }}</th>
                    </tr></thead>
                    <tbody>
                      <tr v-if="!bindingRows.length"><td colspan="7">{{ tr('no_bindings') }}</td></tr>
                      <tr v-for="{ binding, index, state, changed } in bindingRows" :key="binding.key">
                        <td><t-input v-model="binding.domain" :disabled="!!busy" :aria-label="tr('domain')"
                          placeholder="access.example.com" /></td>
                        <td><t-select v-model="binding.family" :options="families" :disabled="!!busy" :aria-label="tr('family')" /></td>
                        <td><t-switch v-model="binding.enabled" size="small" :disabled="!!busy" :aria-label="tr('enabled')" /></td>
                        <td class="binding-ips">
                          <code>{{ state.ips.length ? state.ips.join(', ') : '—' }}</code>
                        </td>
                        <td>
                          <t-tag :theme="stateTheme(state.state)" variant="light">{{ stateLabel(state.state) }}</t-tag>
                          <div v-if="state.error" class="state-error">{{ state.error }}</div>
                          <details v-if="state.families && state.families.length" class="family-details">
                            <summary>{{ tr('family_details') }}</summary>
                            <div v-for="family in state.families" :key="family.family">
                              <strong>{{ family.family.toUpperCase() }} · {{ stateLabel(family.state) }}</strong>
                              <div>{{ tr('last_check') }}: {{ formatTime(family.last_check) }}</div>
                              <div>{{ tr('valid_until') }}: {{ formatTime(family.valid_until) }}</div>
                              <code v-if="family.ips && family.ips.length">{{ family.ips.join(', ') }}</code>
                              <div v-if="family.error" class="state-error">{{ family.error }}</div>
                            </div>
                          </details>
                        </td>
                        <td>
                          <div>{{ tr('last_check') }}: {{ formatTime(state.last_check) }}</div>
                          <div>{{ tr('valid_until') }}: {{ formatTime(state.valid_until) }}</div>
                        </td>
                        <td class="protection-actions">
                          <t-button size="small" variant="text" theme="primary" :disabled="!!busy || changed || !binding.enabled || !!loadError"
                            @click="refreshBinding(binding)">{{ tr('resolve_now') }}</t-button>
                          <t-button size="small" variant="text" theme="danger" :disabled="!!busy"
                            @click="ddns.bindings.splice(index, 1)">{{ $t('common.delete') }}</t-button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="protection-bar">
                  <span class="protection-note">{{ dirtyDDNS ? tr('unsaved') : '' }}</span>
                  <div class="protection-inline">
                    <t-button v-if="dirtyDDNS || loadError" variant="outline" :disabled="!!busy"
                      @click="requestReset('ddns')">{{ tr('reload_ddns') }}</t-button>
                    <t-button theme="primary" :loading="busy === 'ddns'" :disabled="!!busy || !dirtyDDNS || !!loadError"
                      @click="requestSaveDDNS">{{ tr('save_ddns') }}</t-button>
                  </div>
                </div>
              </div>
            </t-tab-panel>

            <t-tab-panel value="region" :label="tr('region_tab')">
              <div class="protection-section">
                <div class="protection-bar">
                  <div class="protection-inline">
                    <t-switch v-model="region.enabled" :disabled="!!busy" :label="[tr('enabled'), tr('disabled')]"
                      :aria-label="tr('region_enabled')" />
                    <strong>{{ tr('region_enabled') }}</strong>
                  </div>
                  <t-button v-if="canViewAudit" variant="text" theme="primary" :disabled="!!busy"
                    @click="openAudit('config_tunnel_region')">{{ tr('audit_region') }}</t-button>
                </div>
                <p class="protection-note">{{ tr('region_note') }}</p>
                <div class="protection-inline">
                  <label>{{ tr('fallback') }}
                    <t-select v-model="region.fallback" class="action-control" :options="actions" :disabled="!!busy" />
                  </label>
                  <label>{{ tr('unknown') }}
                    <t-select v-model="region.unknown" class="action-control" :options="actions" :disabled="!!busy" />
                  </label>
                  <t-tag v-for="family in ['ipv4', 'ipv6']" :key="family" variant="light"
                    :theme="detail[`${family}_country_available`] ? 'success' : 'warning'">
                    {{ tr(detail[`${family}_country_available`] ? 'database_ready' : 'database_unavailable', { family: family === 'ipv4' ? 'IPv4' : 'IPv6' }) }}
                  </t-tag>
                </div>
                <t-alert v-if="region.enabled && region.fallback === 'deny'" theme="warning" :message="tr('fallback_warning')" />
                <t-alert v-if="region.enabled && region.unknown === 'deny'" theme="warning" :message="tr('strict_warning')" />
                <div class="protection-bar">
                  <strong>{{ tr('rules') }}</strong>
                  <t-button variant="outline" size="small" :disabled="!!busy || region.rules.length >= maxRules"
                    @click="addRule">{{ tr('add_rule') }}</t-button>
                </div>
                <div class="protection-scroll">
                  <table class="protection-table region-table">
                    <thead><tr>
                      <th scope="col">#</th><th scope="col">{{ tr('rule_name') }}</th>
                      <th scope="col">{{ tr('operator') }}</th><th scope="col">{{ tr('country') }}</th>
                      <th scope="col">{{ tr('action') }}</th><th scope="col">{{ tr('enabled') }}</th>
                      <th scope="col">{{ $t('common.op') }}</th>
                    </tr></thead>
                    <tbody>
                      <tr v-if="!region.rules.length"><td colspan="7">{{ tr('no_rules') }}</td></tr>
                      <tr v-for="(rule, index) in region.rules" :key="rule.key">
                        <td>{{ index + 1 }}</td>
                        <td><t-input v-model="rule.name" :disabled="!!busy" :aria-label="tr('rule_name')" /></td>
                        <td><t-select v-model="rule.operator" :disabled="!!busy" :options="operators" :aria-label="tr('operator')" /></td>
                        <td><t-select v-model="rule.country" :disabled="!!busy" :options="countries" filterable :aria-label="tr('country')" /></td>
                        <td><t-select v-model="rule.action" :disabled="!!busy" :options="actions" :aria-label="tr('action')" /></td>
                        <td><t-switch v-model="rule.enabled" size="small" :disabled="!!busy" :aria-label="tr('enabled')" /></td>
                        <td class="protection-actions">
                          <t-button size="small" variant="text" :disabled="!!busy || index === 0"
                            @click="moveRule(index, -1)">{{ tr('move_up') }}</t-button>
                          <t-button size="small" variant="text" :disabled="!!busy || index === region.rules.length - 1"
                            @click="moveRule(index, 1)">{{ tr('move_down') }}</t-button>
                          <t-button size="small" variant="text" theme="danger" :disabled="!!busy"
                            @click="region.rules.splice(index, 1)">{{ $t('common.delete') }}</t-button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="protection-inline">
                  <label>{{ tr('preview_country') }}
                    <t-select v-model="previewCountry" class="country-control" :options="previewCountries" filterable />
                  </label>
                  <span class="preview-result" aria-live="polite">{{ previewResult }}</span>
                </div>
                <div class="protection-bar">
                  <span class="protection-note">{{ dirtyRegion ? tr('unsaved') : '' }}</span>
                  <div class="protection-inline">
                    <t-button v-if="dirtyRegion || loadError" variant="outline" :disabled="!!busy"
                      @click="requestReset('region')">{{ tr('reload_region') }}</t-button>
                    <t-button theme="primary" :loading="busy === 'region'" :disabled="!!busy || !dirtyRegion || !!loadError"
                      @click="saveRegion">{{ tr('save_region') }}</t-button>
                  </div>
                </div>
              </div>
            </t-tab-panel>
          </t-tabs>
        </template>
      </t-loading>
    </div>
    <t-dialog v-if="confirmation" :visible="true" :header="tr(confirmation.title)" :body="tr(confirmation.message)"
      :confirm-btn="$t('common.confirm')" :cancel-btn="$t('common.cancel')" :close-on-overlay-click="false"
      @confirm="confirmAction" @close="confirmation = null" />
  </t-dialog>
</template>

<script>
import {
  wafTunnelProtectionDetailApi, wafTunnelProtectionRegionApi, wafTunnelProtectionDDNSApi, wafTunnelProtectionRefreshApi,
  wafTunnelDetailApi, wafTunnelEditApi,
} from '@/apis/tunnel';

const MAX_RULES = 32;
const MAX_BINDINGS = 16;
const stateThemes = {
  active: 'success', pending: 'warning', partial: 'warning', degraded: 'warning',
  error: 'danger', expired: 'danger', disabled: 'default', nxdomain: 'warning', nodata: 'warning', unresolved: 'warning',
};

function ruleData({ name, operator, country, action, enabled }) {
  return { name, operator, country, action, enabled };
}

function bindingData({ id, domain, family, enabled }) {
  return { id, domain, family, enabled };
}

function normalizeDomain(value) {
  const name = value.trim();
  if (!name || name.length > 1024 || /[\s/:?#@%\\]/.test(name)) return '';
  try {
    const hostname = new URL(`http://${name}`).hostname.replace(/\.$/, '').toLowerCase();
    const labels = hostname.split('.');
    if (hostname.length > 253 || labels.length < 2 || !/[a-z]/.test(labels[labels.length - 1])) return '';
    return labels.every((part) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(part)) ? hostname : '';
  } catch {
    return '';
  }
}

export default {
  name: 'TunnelProtection',
  props: { tunnel: { type: Object, required: true } },
  data() {
    return {
      detail: null, region: null, ddns: null, nextKey: 0,
      tab: 'ddns', busy: '', loadError: '', forbidden: false, confirmation: null,
      previewCountry: 'unknown', maxRules: MAX_RULES, maxBindings: MAX_BINDINGS,
      fixedAllow: '', fixedDeny: '', fixedTime: '',
    };
  },
  computed: {
    protocol() {
      if (this.tunnel.protocol === 'tcp' && Number(this.tunnel.ssl_status) === 1) return 'TCP / TLS';
      return String(this.tunnel.protocol || '').toUpperCase();
    },
    canViewAudit() {
      return this.detail && this.detail.can_view_audit === true;
    },
    actions() {
      return ['allow', 'deny'].map((value) => ({ value, label: this.tr(value) }));
    },
    operators() {
      return ['eq', 'ne'].map((value) => ({ value, label: this.tr(value) }));
    },
    families() {
      return ['ipv4', 'ipv6', 'both'].map((value) => ({ value, label: this.tr(`family_${value}`) }));
    },
    countries() {
      const locale = this.$i18n.locale.replace('_', '-');
      let names;
      try { names = new Intl.DisplayNames([locale], { type: 'region' }); } catch { /* ISO codes work on older browsers. */ }
      return ((this.detail && this.detail.countries) || []).map((value) => ({
        value, label: names ? `${names.of(value)} · ${value}` : value,
      })).sort((a, b) => a.label.localeCompare(b.label, locale));
    },
    previewCountries() {
      return [{ value: 'unknown', label: this.tr('unknown_value') }, ...this.countries];
    },
    regionPayload() {
      if (!this.region) return null;
      return { ...this.region, rules: this.region.rules.map(ruleData) };
    },
    ddnsPayload() {
      if (!this.ddns) return null;
      return { ...this.ddns, bindings: this.ddns.bindings.map(bindingData) };
    },
    dirtyRegion() {
      return this.detail && JSON.stringify(this.regionPayload) !== JSON.stringify(this.detail.region);
    },
    dirtyDDNS() {
      return this.detail && JSON.stringify(this.ddnsPayload) !== JSON.stringify(this.detail.ddns);
    },
    dirtyFixed() {
      if (!this.detail) return false;
      return this.fixedAllow.trim() !== (this.detail.allow_ip || '')
        || this.fixedDeny.trim() !== (this.detail.deny_ip || '')
        || this.fixedTime.trim() !== (this.detail.allowed_time_ranges || '');
    },
    willDisableWhitelist() {
      // Use the saved static list and the saved enabled set, not the draft's resolution status.
      return this.detail && !this.detail.allow_ip
        && this.detail.ddns.bindings.some((binding) => binding.enabled)
        && !this.ddns.bindings.some((binding) => binding.enabled);
    },
    previewResult() {
      if (!this.region.enabled) return this.tr('preview_off');
      if (this.previewCountry === 'unknown') return this.tr(`preview_unknown_${this.region.unknown}`);
      const ruleIndex = this.region.rules.findIndex((rule) => rule.enabled && rule.country && (
        rule.operator === 'eq' ? rule.country === this.previewCountry : rule.country !== this.previewCountry
      ));
      if (ruleIndex === -1) return this.tr(`preview_fallback_${this.region.fallback}`);
      const rule = this.region.rules[ruleIndex];
      return this.tr(`preview_rule_${rule.action}`, { number: ruleIndex + 1, name: rule.name || '—' });
    },
    bindingRows() {
      const saved = new Map(this.detail.ddns.bindings.map((binding) => [binding.id, binding]));
      const states = new Map((this.detail.states || []).map((state) => [state.binding_id, state]));
      return this.ddns.bindings.map((binding, index) => {
        const original = saved.get(binding.id);
        const changed = !original || original.domain !== binding.domain || original.family !== binding.family
          || original.enabled !== binding.enabled;
        const state = !changed && binding.enabled && states.get(binding.id);
        return {
          binding, index, changed,
          state: state ? { ...state, ips: state.ips || [] }
            : { state: changed ? 'draft' : binding.enabled ? 'pending' : 'disabled', ips: [] },
        };
      });
    },
  },
  mounted() {
    this.reload();
  },
  methods: {
    tr(key, values) {
      return this.$t(`page.tunnel.protection.${key}`, values);
    },
    async reload(reset) {
      if (this.busy) return;
      this.busy = 'detail';
      this.loadError = '';
      this.forbidden = false;
      try {
        const res = await wafTunnelProtectionDetailApi({ id: this.tunnel.id });
        if (this._isDestroyed) return;
        if (res && res.code === -403) {
          this.showForbidden();
          return;
        }
        if (!res || typeof res.code !== 'number' || (res.code === 0 && (!res.data || !res.data.region || !res.data.ddns
          || !Number.isSafeInteger(res.data.region.revision) || !Number.isSafeInteger(res.data.ddns.revision)
          || !Array.isArray(res.data.countries)))) {
          this.loadError = this.tr('unsupported');
          return;
        }
        if (res.code !== 0) {
          this.loadError = res.msg || this.tr('load_failed');
          return;
        }
        const preserveRegion = this.dirtyRegion && reset !== 'region';
        const preserveDDNS = this.dirtyDDNS && reset !== 'ddns';
        const preserveFixed = this.dirtyFixed && reset !== 'fixed';
        const { data } = res;
        this.detail = {
          ...data,
          region: {
            revision: data.region.revision, enabled: data.region.enabled,
            fallback: data.region.fallback, unknown: data.region.unknown, rules: (data.region.rules || []).map(ruleData),
          },
          ddns: { revision: data.ddns.revision, bindings: (data.ddns.bindings || []).map(bindingData) },
        };
        // Keep the original revision with an unsaved draft so a reload can't mask a write conflict.
        if (!preserveRegion) {
          this.region = { ...this.detail.region, rules: this.detail.region.rules.map((rule) => ({ ...rule, key: ++this.nextKey })) };
        }
        if (!preserveDDNS) {
          this.ddns = { ...this.detail.ddns, bindings: this.detail.ddns.bindings.map((binding) => ({ ...binding, key: ++this.nextKey })) };
        }
        if (!preserveFixed) {
          this.fixedAllow = data.allow_ip || '';
          this.fixedDeny = data.deny_ip || '';
          this.fixedTime = data.allowed_time_ranges || '';
        }
      } catch (err) {
        if (this._isDestroyed) return;
        const status = err.response && err.response.status;
        this.loadError = this.tr(status === 404 || status === 405 ? 'unsupported' : 'load_failed');
      } finally {
        this.busy = '';
      }
    },
    showForbidden() {
      this.forbidden = true;
      this.detail = null;
      this.loadError = this.tr('forbidden');
    },
    addRule() {
      this.region.rules.push({ key: ++this.nextKey, name: '', operator: 'eq', country: '', action: 'deny', enabled: true });
    },
    moveRule(index, delta) {
      const [rule] = this.region.rules.splice(index, 1);
      this.region.rules.splice(index + delta, 0, rule);
    },
    addBinding() {
      this.ddns.bindings.push({ key: ++this.nextKey, id: '', domain: '', family: 'ipv4', enabled: true });
    },
    saveRegion() {
      const rules = this.region.rules.map((rule) => ({ ...ruleData(rule), name: rule.name.trim() }));
      const badRule = rules.findIndex((rule) => !rule.name || Array.from(rule.name).length > 60
        || /[\p{Cc}]/u.test(rule.name) || !this.detail.countries.includes(rule.country));
      if (badRule !== -1) {
        this.$message.warning(this.tr('invalid_rule', { number: badRule + 1 }));
        return;
      }
      this.submit('region', wafTunnelProtectionRegionApi, { ...this.regionPayload, rules }, 'saved');
    },
    requestSaveDDNS() {
      const domains = new Set();
      const bindings = [];
      for (const [index, binding] of this.ddns.bindings.entries()) {
        const domain = normalizeDomain(binding.domain);
        if (!domain) {
          this.$message.warning(this.tr('invalid_domain', { number: index + 1 }));
          return;
        }
        if (domains.has(domain)) {
          this.$message.warning(this.tr('duplicate_domain', { number: index + 1 }));
          return;
        }
        domains.add(domain);
        bindings.push({ ...bindingData(binding), domain });
      }
      const save = (confirmed) => this.submit('ddns', wafTunnelProtectionDDNSApi, {
        revision: this.ddns.revision, bindings, confirm_disable_whitelist: confirmed,
      }, 'saved');
      if (this.willDisableWhitelist) {
        this.confirmation = { title: 'whitelist_confirm', message: 'whitelist_warning', run: () => save(true) };
      } else {
        save(false);
      }
    },
    validateTimeRanges(value) {
      const val = (value || '').trim();
      if (!val) return '';
      if (!/^(\d{2}:\d{2}-\d{2}:\d{2})(;\d{2}:\d{2}-\d{2}:\d{2})*$/.test(val)) {
        return this.tr('invalid_time_format');
      }
      for (const range of val.split(';')) {
        for (const time of range.split('-')) {
          const parts = time.split(':');
          const hour = parseInt(parts[0], 10);
          const minute = parseInt(parts[1], 10);
          if (Number.isNaN(hour) || hour < 0 || hour > 23 || Number.isNaN(minute) || minute < 0 || minute > 59) {
            return this.tr('invalid_time_value');
          }
        }
      }
      return '';
    },
    async saveFixed() {
      if (this.busy || this.loadError) return;
      const timeError = this.validateTimeRanges(this.fixedTime);
      if (timeError) {
        this.$message.warning(timeError);
        return;
      }
      this.busy = 'fixed';
      let saved = false;
      try {
        const detail = await wafTunnelDetailApi({ id: this.tunnel.id });
        if (this._isDestroyed) return;
        if (!detail || detail.code !== 0 || !detail.data) {
          this.$message.warning(this.tr('submit_failed'));
          return;
        }
        const postdata = {
          ...detail.data,
          allow_ip: this.fixedAllow.trim(),
          deny_ip: this.fixedDeny.trim(),
          allowed_time_ranges: this.fixedTime.trim(),
        };
        for (const key of ['remote_port', 'start_status', 'conn_timeout', 'read_timeout', 'write_timeout',
          'max_in_connect', 'max_out_connect']) {
          postdata[key] = Number(postdata[key]);
        }
        postdata.ssl_status = Number(postdata.ssl_status || 0);
        const res = await wafTunnelEditApi(postdata);
        if (this._isDestroyed) return;
        if (res && res.code === -403) {
          this.showForbidden();
        } else if (res && res.code === 0) {
          saved = true;
          this.$message.success(this.tr('saved'));
        } else {
          this.$message.warning((res && res.msg) || this.tr('submit_failed'));
        }
      } catch {
        if (!this._isDestroyed) this.$message.error(this.tr('submit_failed'));
      } finally {
        this.busy = '';
      }
      if (saved) await this.reload('fixed');
    },
    refreshBinding(binding) {
      this.submit('refresh', wafTunnelProtectionRefreshApi, { binding_id: binding.id }, 'refresh_queued');
    },
    async submit(kind, api, data, success) {
      if (this.busy || this.loadError) return;
      this.busy = kind;
      let saved = false;
      try {
        const res = await api({ id: this.tunnel.id, ...data });
        if (this._isDestroyed) return;
        if (res && res.code === -403) {
          this.showForbidden();
        } else if (res && res.code === 0) {
          saved = true;
          this.$message.success(this.tr(success));
        } else {
          this.$message.warning((res && res.msg) || this.tr('submit_failed'));
        }
      } catch {
        if (!this._isDestroyed) this.$message.error(this.tr('submit_failed'));
      } finally {
        this.busy = '';
      }
      if (saved) await this.reload(kind);
    },
    requestReset(section) {
      const reset = () => this.reload(section);
      const dirty = section === 'region' ? this.dirtyRegion : section === 'fixed' ? this.dirtyFixed : this.dirtyDDNS;
      if (dirty) {
        this.confirmation = { title: 'discard_title', message: 'discard_one', run: reset };
      } else {
        reset();
      }
    },
    requestExit(action) {
      if (this.busy) return;
      const run = typeof action === 'function' ? action : () => this.$emit(action);
      if (this.dirtyRegion || this.dirtyDDNS || this.dirtyFixed) {
        this.confirmation = { title: 'discard_title', message: 'discard_all', run };
      } else {
        run();
      }
    },
    openAudit(event) {
      this.requestExit(() => {
        const query = { object_type: 'tunnel', object_id: String(this.tunnel.id), category: 'config' };
        if (event) query.event = event;
        this.$emit('close');
        this.$router.push({ name: 'WafAccessAudit', query }).catch(() => { /* Already at this location. */ });
      });
    },
    confirmAction() {
      if (!this.confirmation) return;
      const { run } = this.confirmation;
      this.confirmation = null;
      run();
    },
    stateTheme(state) {
      return stateThemes[state] || 'default';
    },
    stateLabel(state) {
      const key = `page.tunnel.protection.state_${state}`;
      return state && (this.$te(key) ? this.$t(key) : state) || '—';
    },
    formatTime(value) {
      if (!value || String(value).startsWith('0001-')) return '—';
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString(this.$i18n.locale.replace('_', '-'));
    },
  },
};
</script>

<style scoped>
.protection-body, .protection-section { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
.protection-body { max-height: 72vh; overflow-y: auto; }
.protection-section { padding: 12px 0 4px; }
.protection-bar, .protection-inline { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
.protection-bar { justify-content: space-between; }
.protection-inline label { display: inline-flex; align-items: center; gap: 8px; }
.protection-note { color: var(--td-text-color-secondary); margin: 0; }
.protection-empty { min-height: 64px; padding-top: 8px; }
.action-control { width: 104px; }
.country-control { width: 210px; max-width: 100%; }
.protection-scroll { overflow: auto; }
.protection-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.region-table { min-width: 760px; }
.ddns-table { min-width: 920px; }
.protection-table th, .protection-table td { text-align: left; padding: 8px; border-bottom: 1px solid var(--td-component-border); }
.protection-table th { background: var(--td-bg-color-secondarycontainer); white-space: nowrap; }
.protection-actions { white-space: nowrap; }
.protection-actions .t-button { padding: 0 5px; }
.preview-result, .binding-ips, .state-error, .family-details { overflow-wrap: anywhere; }
.fixed-form { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; max-width: 640px; }
.fixed-row { display: grid; grid-template-columns: 130px minmax(0, 1fr); align-items: center; gap: 8px 12px; }
.fixed-label { color: var(--td-text-color-primary); }
.fixed-time-tips { margin: -4px 0 0 142px; }
.binding-ips { max-width: 160px; }
.state-error, .family-details { max-width: 180px; color: var(--td-text-color-secondary); }
.family-details summary { cursor: pointer; }
</style>
