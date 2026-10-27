<template>
  <div class="website-diagnostic">
    <header class="diagnostic-heading">
      <div>
        <h2>{{ tr('title') }}</h2>
        <p>{{ tr('description') }}</p>
      </div>
      <t-button variant="text" @click="backToHosts">{{ tr('back') }}</t-button>
    </header>

    <t-card :bordered="false" class="diagnostic-input">
      <div class="site-picker">
        <label for="diagnostic-site">{{ tr('site') }}</label>
        <t-select
          id="diagnostic-site"
          v-model="hostCode"
          filterable
          :loading="sitesLoading"
          :placeholder="tr('select_site')"
          @change="loadSite"
        >
          <t-option v-for="site in sites" :key="site.value" :value="site.value" :label="site.label" />
        </t-select>
        <t-tag v-if="siteTitle" theme="primary" variant="light">{{ tr('saved') }}</t-tag>
        <t-button v-if="hostCode && siteTitle" variant="text" @click="openEditor('basic', '')">{{
          tr('view_config')
        }}</t-button>
      </div>
      <p v-if="siteTitle" class="site-title">{{ siteTitle }}</p>
      <label class="input-caption" for="diagnostic-url">{{ tr('url') }}</label>
      <div class="request-inputs">
        <t-select v-model="method" :aria-label="tr('method')">
          <t-option value="GET" label="GET" /><t-option value="HEAD" label="HEAD" />
        </t-select>
        <t-input
          id="diagnostic-url"
          v-model="visitorUrl"
          :maxlength="4096"
          :placeholder="wildcardSite ? wildcardExample : tr('url_placeholder')"
          :status="urlRequired ? 'error' : undefined"
          autocomplete="off"
          spellcheck="false"
        />
        <t-button
          theme="primary"
          :disabled="!hostCode || !siteTitle || siteLoading || sitesLoading || running"
          @click="start"
          >{{ snapshot ? tr('rerun') : tr('start') }}</t-button
        >
        <t-button :disabled="!running" @click="cancel(true)">{{ tr('cancel') }}</t-button>
      </div>
      <p v-if="wildcardSite" class="scope-note">{{ tr('wildcard_hint', { example: wildcardExample }) }}</p>
      <p v-if="urlRequired" class="url-error" role="alert">{{ tr('actual_domain') }}</p>
      <div class="proxy-option">
        <label for="diagnostic-system-proxy">{{ tr('use_system_proxy') }}</label>
        <t-switch id="diagnostic-system-proxy" v-model="useSystemProxy" :aria-label="tr('use_system_proxy')" />
        <span>{{ tr('system_proxy_note') }}</span>
      </div>
      <details class="custom-headers">
        <summary>{{ tr('headers') }}</summary>
        <div v-for="(header, index) in headers" :key="index" class="header-inputs">
          <t-input
            v-model="header.name"
            :maxlength="128"
            :placeholder="tr('header_name')"
            :aria-label="tr('header_name')"
            autocomplete="off"
          />
          <t-input
            v-model="header.value"
            type="password"
            :maxlength="2048"
            :placeholder="tr('header_value')"
            :aria-label="tr('header_value')"
            autocomplete="off"
          />
          <t-button theme="default" variant="text" @click="headers.splice(index, 1)">{{ tr('remove') }}</t-button>
        </div>
        <t-button
          size="small"
          variant="outline"
          :disabled="headers.length >= 20"
          @click="headers.push({ name: '', value: '' })"
          >{{ tr('add_header') }}</t-button
        >
        <p>{{ tr('headers_note') }}</p>
      </details>
      <t-alert theme="info" :message="tr('notice')" />
      <p class="scope-note">{{ tr('scope') }}</p>
    </t-card>

    <t-alert v-if="error" theme="error" :message="error" class="diagnostic-alert" />
    <t-alert v-if="stale" theme="warning" :message="tr('stale')" class="diagnostic-alert" />
    <template v-if="snapshot">
      <div class="result-heading" aria-live="polite">
        <h3>{{ running ? tr('running') : cancelled ? tr('cancelled') : tr('results') }} · {{ runSiteTitle }}</h3>
        <span>{{ tr('processed', { count: processed }) }} · {{ runTime }}</span>
      </div>
      <div v-if="attention" class="attention-summary" role="status">
        <div class="attention-line">
          <t-tag :theme="attention.status === 'failed' ? 'danger' : 'warning'" variant="light">
            {{ tr('status_' + attention.status) }}
          </t-tag>
          <p>{{ attention.message }}</p>
          <small>{{ tr('phase_' + attention.phase) }}</small>
        </div>
        <t-button size="small" variant="outline" @click="focusAttention">{{ tr('focus_issue') }}</t-button>
      </div>
      <div class="result-layout">
        <nav class="phase-list" :aria-label="tr('phases')">
          <button
            v-for="phase in phaseOrder"
            :key="phase"
            type="button"
            class="phase-button"
            :class="{ selected: selectedPhase === phase }"
            :aria-pressed="selectedPhase === phase"
            @click="selectPhase(phase)"
          >
            <strong>{{ tr('phase_' + phase) }}</strong>
            <span :class="'state-' + phaseStatus(phase)">{{ phaseLabel(phase) }}</span>
            <small>{{ tr('source_' + phase) }}</small>
          </button>
        </nav>
        <section class="phase-detail">
          <header class="detail-heading">
            <h3>{{ tr('phase_' + selectedPhase) }}</h3>
            <p>{{ tr('source_' + selectedPhase) }}</p>
            <p v-if="selectedPhase === 'origin' && originTotal">
              {{ tr('origin_count', { count: phases.origin.checks.length, total: originTotal }) }}
            </p>
            <t-button
              v-if="selectedPhase === 'origin' && originHasMore"
              size="small"
              variant="outline"
              :disabled="running || stale || stopped || cancelled"
              @click="continueOrigins"
              >{{ tr('continue_origins') }}</t-button
            >
          </header>
          <div v-if="currentChecks.length > 1" class="check-picker">
            <t-select v-model="selectedCheck" filterable :aria-label="tr('check')">
              <t-option
                v-for="(check, index) in currentChecks"
                :key="check.id + index"
                :value="index"
                :label="check.title"
              />
            </t-select>
          </div>
          <t-tabs v-model="activeTab">
            <t-tab-panel v-for="tab in detailTabs" :key="tab" :value="tab" :label="tr('tab_' + tab)" />
          </t-tabs>
          <div class="detail-content">
            <t-alert
              v-if="currentCheck && phases[selectedPhase].error"
              theme="error"
              :message="phases[selectedPhase].error"
            />
            <div v-if="!currentCheck" class="empty-evidence">
              {{ phases[selectedPhase].error || phaseLabel(selectedPhase) }}
              <p>{{ tr('no_evidence') }}</p>
            </div>
            <template v-else>
              <div v-if="activeTab === 'overview'">
                <div class="check-heading">
                  <h4>{{ currentCheck.title }}</h4>
                  <t-tag :theme="statusTheme(currentCheck.status)" variant="light">{{
                    tr('status_' + currentCheck.status)
                  }}</t-tag>
                </div>
                <p class="check-message">{{ currentCheck.message }}</p>
                <dl v-if="currentCheck.overview && currentCheck.overview.length" class="evidence-fields">
                  <template v-for="(field, index) in currentCheck.overview"
                    ><dt :key="'label' + index">{{ field.label }}</dt>
                    <dd :key="'value' + index">{{ field.value }}</dd></template
                  >
                </dl>
                <p v-if="currentCheck.status_code" class="http-code">HTTP {{ currentCheck.status_code }}</p>
                <p class="scope-note">{{ tr('independent') }}</p>
              </div>
              <div v-else-if="activeTab === 'request' || activeTab === 'response'">
                <template v-if="packetText">
                  <div class="packet-heading">
                    <span>{{ tr('packet_note') }}</span
                    ><t-button size="small" variant="text" @click="copyPacket">{{ tr('copy') }}</t-button>
                  </div>
                  <pre class="packet-text">{{ packetText }}</pre>
                  <t-alert
                    v-if="activeTab === 'response' && currentCheck.body_truncated"
                    theme="warning"
                    :message="tr('truncated')"
                  />
                </template>
                <div v-else class="empty-evidence">
                  {{ activeTab === 'request' ? tr('no_request') : tr('no_response') }}
                  <p>{{ currentCheck.message }}</p>
                </div>
              </div>
              <dl
                v-else-if="activeTab === 'connection' && currentCheck.connection && currentCheck.connection.length"
                class="evidence-fields"
              >
                <template v-for="(field, index) in currentCheck.connection"
                  ><dt :key="'label' + index">{{ field.label }}</dt>
                  <dd :key="'value' + index">{{ field.value }}</dd></template
                >
              </dl>
              <div v-else-if="activeTab === 'connection'" class="empty-evidence">{{ tr('no_connection') }}</div>
              <div v-else-if="activeTab === 'advice'" class="advice-list">
                <div v-for="(advice, index) in currentCheck.advice" :key="advice.code + index" class="advice-item">
                  <p>{{ advice.message }}</p>
                  <t-button
                    v-if="canOpenAdvice(advice)"
                    size="small"
                    variant="outline"
                    @click="openEditor(advice.tab, advice.section)"
                    >{{ tr('locate_config') }}</t-button
                  >
                </div>
                <p v-if="!currentCheck.advice || !currentCheck.advice.length" class="empty-evidence">
                  {{ tr('no_advice') }}
                </p>
                <p class="scope-note">{{ tr('advice_note') }}</p>
              </div>
            </template>
          </div>
        </section>
      </div>
    </template>
    <t-card v-else :bordered="false" class="initial-state">{{ tr('initial') }}</t-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { allhost, getHostDetail } from '@/apis/host';
import {
  diagnoseWebsite,
  DiagnosticAdvice,
  DiagnosticCheck,
  DiagnosticPhase,
  DiagnosticRequest,
} from '@/apis/websiteDiagnostic';

const phaseOrder: DiagnosticPhase[] = ['inspect', 'local_ingress', 'origin', 'access_url'];
const emptyPhases = () =>
  phaseOrder.reduce((result, phase) => {
    result[phase] = { state: 'pending', checks: [] as DiagnosticCheck[], error: '' };
    return result;
  }, {} as Record<DiagnosticPhase, { state: string; checks: DiagnosticCheck[]; error: string }>);

export default Vue.extend({
  name: 'WebsiteDiagnostic',
  data() {
    return {
      phaseOrder,
      detailTabs: ['overview', 'request', 'response', 'connection', 'advice'],
      hostCode: '',
      sites: [] as { value: string; label: string }[],
      sitesLoading: false,
      siteLoading: false,
      siteTitle: '',
      wildcardSite: false,
      wildcardExample: '',
      urlRequired: false,
      visitorUrl: '',
      method: 'GET' as 'GET' | 'HEAD',
      useSystemProxy: true,
      headers: [] as { name: string; value: string }[],
      phases: emptyPhases(),
      selectedPhase: 'inspect' as DiagnosticPhase,
      selectedCheck: 0,
      activeTab: 'overview',
      running: false,
      cancelled: false,
      stale: false,
      stopped: false,
      error: '',
      snapshot: '',
      runTime: '',
      runSiteTitle: '',
      generation: 0,
      siteGeneration: 0,
      controller: null as AbortController | null,
      fingerprint: '',
      originCursor: -1,
      originHasMore: false,
      originTotal: 0,
      runInput: null as DiagnosticRequest | null,
    };
  },
  computed: {
    inputKey(): string {
      return JSON.stringify([this.hostCode, this.visitorUrl, this.method, this.headers, this.useSystemProxy]);
    },
    currentChecks(): DiagnosticCheck[] {
      return this.phases[this.selectedPhase].checks;
    },
    currentCheck(): DiagnosticCheck | null {
      return this.currentChecks[this.selectedCheck] || null;
    },
    packetText(): string {
      return this.currentCheck ? this.currentCheck[this.activeTab === 'response' ? 'response' : 'request'] : '';
    },
    processed(): number {
      return phaseOrder.filter((phase) => this.phases[phase].state === 'completed').length;
    },
    attention(): { phase: DiagnosticPhase; index: number; status: string; message: string } | null {
      let result: { phase: DiagnosticPhase; index: number; status: string; message: string } | null = null;
      phaseOrder.some((phase) => {
        result = this.phases[phase].checks.reduce(
          (hit, check, index) =>
            hit ||
            (['failed', 'warning'].includes(check.status)
              ? { phase, index, status: check.status, message: check.message }
              : null),
          result,
        );
        return result !== null;
      });
      return result;
    },
  },
  watch: {
    visitorUrl(value) {
      if (value.trim()) this.urlRequired = false;
    },
    inputKey(value) {
      if (this.snapshot && value !== this.snapshot) {
        this.cancel(false);
        this.stale = true;
      }
    },
    '$route.query.code': function onRouteCode(value) {
      if (typeof value === 'string' && value !== this.hostCode && this.sites.some((site) => site.value === value)) {
        this.hostCode = value;
        this.loadSite();
      }
    },
  },
  created() {
    this.loadSites();
  },
  beforeDestroy() {
    this.cancel(false);
    this.siteGeneration += 1;
    this.headers = [];
    this.runInput = null;
  },
  deactivated() {
    this.cancel(false);
  },
  methods: {
    tr(key: string, params = {}): string {
      return String(this.$t(`page.host.diagnostic.${key}`, params));
    },
    async loadSites() {
      this.sitesLoading = true;
      try {
        const res: any = await allhost({});
        if (res.code !== 0 || !Array.isArray(res.data)) throw new Error(this.tr('load_failed'));
        this.sites = res.data
          .filter((site) => site && site.value && Number(site.global_host) !== 1)
          .map((site) => ({ value: String(site.value), label: String(site.label) }));
        const { code } = this.$route.query;
        if (typeof code === 'string' && this.sites.some((site) => site.value === code)) {
          this.hostCode = code;
          await this.loadSite();
        }
      } catch (e) {
        this.error = this.tr('load_failed');
      } finally {
        this.sitesLoading = false;
      }
    },
    async loadSite() {
      this.cancel(false);
      this.siteGeneration += 1;
      const token = this.siteGeneration;
      const code = this.hostCode;
      this.siteTitle = '';
      this.wildcardSite = false;
      this.wildcardExample = '';
      this.urlRequired = false;
      this.visitorUrl = '';
      this.error = '';
      if (!code) return;
      this.siteLoading = true;
      try {
        const res: any = await getHostDetail({ code });
        if (token !== this.siteGeneration) return;
        if (res.code !== 0 || !res.data || Number(res.data.global_host) === 1) throw new Error(this.tr('load_failed'));
        const site = res.data;
        this.siteTitle = site.nickname ? `${site.host} (${site.nickname})` : String(site.host);
        const listens = Array.isArray(site.resolved_listens)
          ? site.resolved_listens.filter((listen) => listen && !listen.implied)
          : [];
        const main = listens.find((listen) => listen.is_main) || listens[0];
        const proto = (main && main.proto) || (String(site.ssl) === '1' ? 'https' : 'http');
        const port = Number((main && main.port) || site.port);
        let host = String(site.host || '');
        this.wildcardSite = host.includes('*');
        const defaultPort = (proto === 'https' && port === 443) || (proto === 'http' && port === 80);
        const portSuffix = port && !defaultPort ? `:${port}` : '';
        if (this.wildcardSite) {
          const exampleHost = host === '*' ? this.tr('example_host') : host.replace(/\*/g, 'www');
          this.wildcardExample = `${proto}://${exampleHost}${portSuffix}/`;
        } else if (host && !this.visitorUrl) {
          if (host.includes(':') && !host.startsWith('[')) host = `[${host}]`;
          this.visitorUrl = `${proto}://${host}${portSuffix}/`;
        }
      } catch (e) {
        if (token === this.siteGeneration) this.error = this.tr('load_failed');
      } finally {
        if (token === this.siteGeneration) this.siteLoading = false;
      }
    },
    validate(): boolean {
      this.urlRequired = this.wildcardSite && !this.visitorUrl.trim();
      if (this.urlRequired) {
        this.error = this.tr('actual_domain');
        return false;
      }
      if (this.visitorUrl) {
        try {
          const url = new URL(this.visitorUrl);
          if (
            !['http:', 'https:'].includes(url.protocol) ||
            url.username ||
            url.password ||
            url.hash ||
            url.hostname.includes('*')
          )
            throw new Error();
        } catch (e) {
          this.error = this.tr('invalid_url');
          return false;
        }
      }
      const forbidden =
        /^(host|content-length|transfer-encoding|connection|proxy-connection|upgrade|keep-alive|te|trailer|accept-encoding|proxy-authorization)$/i;
      const seen = new Set();
      const valid = this.headers.every((header) => {
        if (!header.name && !header.value) return true;
        const name = header.name.trim();
        if (
          !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name) ||
          forbidden.test(name) ||
          /[\r\n\0]/.test(header.value) ||
          seen.has(name.toLowerCase())
        )
          return false;
        seen.add(name.toLowerCase());
        return true;
      });
      if (!valid) this.error = this.tr('invalid_headers');
      const totalBytes = this.headers.reduce((sum, header) => sum + new Blob([header.name, header.value]).size, 0);
      if (valid && totalBytes > 8192) {
        this.error = this.tr('headers_too_large');
        return false;
      }
      return valid;
    },
    async start() {
      this.error = '';
      if (!this.validate()) return;
      this.cancel(false);
      this.generation += 1;
      const token = this.generation;
      this.phases = emptyPhases();
      this.fingerprint = '';
      this.originCursor = -1;
      this.originHasMore = false;
      this.originTotal = 0;
      this.selectedPhase = 'inspect';
      this.selectedCheck = 0;
      this.activeTab = 'overview';
      this.cancelled = false;
      this.stale = false;
      this.stopped = false;
      this.snapshot = this.inputKey;
      this.runTime = new Date().toLocaleString();
      this.runSiteTitle = this.siteTitle;
      this.runInput = {
        host_code: this.hostCode,
        phase: 'inspect',
        visitor_url: this.visitorUrl,
        method: this.method,
        headers: this.headers
          .filter((header) => header.name || header.value)
          .map((header) => ({ name: header.name.trim(), value: header.value })),
        use_system_proxy: this.useSystemProxy,
        config_fingerprint: '',
        origin_cursor: 0,
      };
      this.controller = new AbortController();
      this.running = true;
      try {
        if (!(await this.runPhase('inspect', token))) return;
        if (!this.runInput || !this.runInput.visitor_url) {
          this.error = this.tr('actual_domain');
          return;
        }
        await this.runPhase('local_ingress', token);
        if (token !== this.generation || this.stopped) return;
        await this.runPhase('origin', token);
        if (token !== this.generation || this.stopped) return;
        await this.runPhase('access_url', token);
      } finally {
        if (token === this.generation) {
          this.running = false;
          this.controller = null;
        }
      }
    },
    async runPhase(phase: DiagnosticPhase, token: number, append = false): Promise<boolean> {
      if (!this.runInput || !this.controller || token !== this.generation) return false;
      this.phases[phase].state = 'running';
      this.phases[phase].error = '';
      this.selectedPhase = phase;
      this.selectedCheck = 0;
      try {
        const result = await diagnoseWebsite(
          {
            ...this.runInput,
            phase,
            config_fingerprint: this.fingerprint,
            origin_cursor: append ? this.originCursor : 0,
          },
          this.controller.signal,
        );
        if (token !== this.generation) return false;
        const { data } = result;
        if (data && ['CONFIG_CHANGED', 'RUNTIME_CHANGED'].includes(data.error_code || '')) {
          this.stopped = true;
          this.stale = true;
          this.error = result.msg || this.tr('config_changed');
          this.phases[phase].state = 'error';
          this.phases[phase].error = this.error;
          if (Array.isArray(data.checks)) this.phases[phase].checks = data.checks;
          return false;
        }
        if (result.code !== 0 || !data || data.phase !== phase || !Array.isArray(data.checks))
          throw new Error(result.msg || this.tr('request_failed'));
        if (phase === 'inspect' && data.checks.some((check) => check.reason === 'URL_REQUIRED')) {
          this.phases.inspect.checks = data.checks;
          this.phases.inspect.state = 'completed';
          this.stopped = true;
          this.urlRequired = true;
          this.error = this.tr('actual_domain');
          return false;
        }
        if (phase === 'inspect') {
          this.fingerprint = data.config_fingerprint;
          if (!this.fingerprint) throw new Error(this.tr('request_failed'));
          if (!this.runInput.visitor_url && data.site && data.site.visitor_url) {
            this.visitorUrl = data.site.visitor_url;
            this.runInput.visitor_url = data.site.visitor_url;
            this.snapshot = this.inputKey;
          }
        } else if (data.config_fingerprint !== this.fingerprint) {
          this.stopped = true;
          this.stale = true;
          throw new Error(this.tr('config_changed'));
        }
        this.phases[phase].checks = append ? this.phases[phase].checks.concat(data.checks) : data.checks;
        this.phases[phase].state = 'completed';
        if (
          phase === 'inspect' &&
          data.checks.some((check) => ['CONFIG_CHANGED', 'RUNTIME_CHANGED'].includes(check.reason))
        ) {
          this.stopped = true;
          this.stale = true;
          this.error = this.tr('config_changed');
          return false;
        }
        if (phase === 'origin') {
          const previousCursor = append ? this.originCursor : 0;
          this.originCursor = data.next_cursor;
          this.originHasMore = data.has_more && data.next_cursor > previousCursor;
          this.originTotal = data.total;
          if (append && this.selectedPhase === 'origin')
            this.selectedCheck = Math.max(0, this.phases.origin.checks.length - data.checks.length);
        }
        return true;
      } catch (e) {
        if (token !== this.generation) return false;
        this.phases[phase].state = 'error';
        this.phases[phase].error =
          e && e.message && !['Network Error', 'timeout of 12000ms exceeded'].includes(e.message)
            ? e.message
            : this.tr('request_failed');
        if (phase === 'inspect' || this.stopped) this.error = this.phases[phase].error;
        return false;
      }
    },
    async continueOrigins() {
      if (this.running || this.stale || this.stopped || this.cancelled || !this.originHasMore) return;
      const token = this.generation;
      this.controller = new AbortController();
      this.running = true;
      try {
        await this.runPhase('origin', token, true);
      } finally {
        if (token === this.generation) {
          this.running = false;
          this.controller = null;
        }
      }
    },
    cancel(show: boolean) {
      this.generation += 1;
      if (this.controller) this.controller.abort();
      this.controller = null;
      phaseOrder.forEach((phase) => {
        if (this.phases[phase].state === 'running') this.phases[phase].state = 'cancelled';
      });
      if (show) this.cancelled = true;
      this.running = false;
    },
    selectPhase(phase: DiagnosticPhase) {
      this.selectedPhase = phase;
      this.selectedCheck = 0;
    },
    focusAttention() {
      if (!this.attention) return;
      this.selectedPhase = this.attention.phase;
      this.selectedCheck = this.attention.index;
      this.activeTab = 'overview';
    },
    phaseStatus(phase: DiagnosticPhase): string {
      const entry = this.phases[phase];
      if (entry.state !== 'completed') return entry.state;
      const statuses = entry.checks.map((check) => check.status);
      return (
        ['failed', 'warning', 'unknown', 'skipped'].find((status) => statuses.includes(status as any)) ||
        (statuses.length ? 'passed' : 'unknown')
      );
    },
    phaseLabel(phase: DiagnosticPhase): string {
      const state = this.phaseStatus(phase);
      if (state === 'pending' && !this.running) return this.tr('not_run');
      return this.tr(['pending', 'running', 'error', 'cancelled'].includes(state) ? state : `status_${state}`);
    },
    statusTheme(status: string): string {
      return (
        { passed: 'success', failed: 'danger', warning: 'warning', unknown: 'warning', skipped: 'default' }[status] ||
        'default'
      );
    },
    canOpenAdvice(advice: DiagnosticAdvice): boolean {
      return (
        !this.stale &&
        ['basic', 'other'].includes(advice.tab) &&
        (!advice.section || ['listen', 'backend', 'tls'].includes(advice.section))
      );
    },
    openEditor(tab: string, section: string) {
      if (
        !this.hostCode ||
        !['basic', 'other'].includes(tab) ||
        (section && !['listen', 'backend', 'tls'].includes(section))
      )
        return;
      this.cancel(false);
      this.$router.push({ name: 'WafHost', query: { editcode: this.hostCode, tab, ...(section ? { section } : {}) } });
    },
    backToHosts() {
      this.cancel(false);
      this.$router.push({ name: 'WafHost' });
    },
    copyPacket() {
      this.$copyText(this.packetText)
        .then(() => this.$message.success(this.tr('copied')))
        .catch(() => this.$message.warning(this.tr('copy_failed')));
    },
  },
});
</script>

<style scoped lang="less">
.website-diagnostic {
  color: var(--td-text-color-primary);
}
.diagnostic-heading,
.result-heading,
.check-heading,
.packet-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.diagnostic-heading {
  margin-bottom: 16px;
  align-items: flex-start;
}
h2,
h3,
h4,
p {
  margin: 0;
}
h2 {
  font-size: 22px;
}
h3 {
  font-size: 16px;
}
h4 {
  font-size: 14px;
}
.diagnostic-heading p,
.detail-heading p,
.scope-note,
.site-title {
  color: var(--td-text-color-secondary);
  font-size: 12px;
  line-height: 1.8;
  margin-top: 6px;
}
.site-picker {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.site-picker .t-select__wrap {
  width: 340px;
  max-width: 100%;
}
.site-title {
  margin-bottom: 16px;
}
.input-caption {
  display: block;
  margin: 16px 0 8px;
}
.request-inputs {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) auto auto;
  gap: 8px;
}
.url-error {
  color: var(--td-error-color);
  font-size: 12px;
  margin-top: 6px;
}
.proxy-option {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 16px;
}
.proxy-option span {
  color: var(--td-text-color-secondary);
  font-size: 12px;
  line-height: 1.8;
}
.custom-headers {
  margin: 16px 0;
  padding-top: 12px;
  border-top: 1px solid var(--td-component-border);
}
.custom-headers summary {
  cursor: pointer;
  margin-bottom: 12px;
}
.custom-headers p {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  margin-top: 8px;
}
.header-inputs {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto;
  gap: 8px;
  margin-bottom: 8px;
}
.attention-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin: 0 0 12px;
  padding: 12px 16px;
  background: var(--td-warning-color-light);
  border: 1px solid var(--td-warning-color-focus);
  border-radius: 6px;
}
.attention-line {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}
.attention-line p {
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.attention-line small {
  color: var(--td-text-color-secondary);
}
.diagnostic-alert {
  margin-top: 16px;
}
.result-heading {
  margin: 20px 0 12px;
}
.result-heading span {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}
.result-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  border-radius: 6px;
  overflow: hidden;
}
.phase-list {
  display: grid;
  align-content: start;
  gap: 8px;
  padding: 12px;
  border-right: 1px solid var(--td-component-border);
}
.phase-button {
  display: grid;
  gap: 7px;
  text-align: left;
  padding: 14px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: inherit;
  cursor: pointer;
  font: inherit;
}
.phase-button.selected {
  background: var(--td-brand-color-light);
  border-color: var(--td-brand-color);
}
.phase-button strong {
  font-size: 13px;
  font-weight: 500;
}
.phase-button span,
.phase-button small {
  font-size: 12px;
}
.phase-button small {
  color: var(--td-text-color-secondary);
  line-height: 1.6;
}
.phase-button:focus-visible {
  outline: 2px solid var(--td-brand-color);
  outline-offset: -2px;
}
.state-passed {
  color: var(--td-success-color);
}
.state-failed,
.state-error {
  color: var(--td-error-color);
}
.state-warning,
.state-unknown {
  color: var(--td-warning-color);
}
.state-running {
  color: var(--td-brand-color);
}
.phase-detail {
  min-width: 0;
}
.detail-heading {
  padding: 20px;
}
.detail-heading .t-button {
  margin-top: 10px;
}
.check-picker {
  padding: 0 20px 16px;
}
.detail-content {
  padding: 20px;
  min-height: 320px;
}
.check-message {
  margin: 10px 0 18px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.evidence-fields {
  display: grid;
  grid-template-columns: minmax(90px, 150px) minmax(0, 1fr);
  gap: 12px 16px;
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
}
.evidence-fields dt {
  color: var(--td-text-color-secondary);
}
.evidence-fields dd {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.http-code {
  margin-top: 16px;
  font-family: Consolas, monospace;
}
.empty-evidence {
  padding: 20px;
  background: var(--td-bg-color-secondarycontainer);
  border: 1px dashed var(--td-component-border);
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.8;
}
.empty-evidence p {
  margin-top: 8px;
  color: var(--td-text-color-secondary);
}
.packet-heading {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}
.packet-text {
  margin: 8px 0 12px;
  padding: 16px;
  background: var(--td-bg-color-secondarycontainer);
  border: 1px solid var(--td-component-border);
  border-radius: 4px;
  font: 12px/1.8 Consolas, monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 520px;
  overflow: auto;
}
.advice-item {
  margin-bottom: 16px;
}
.advice-item p {
  line-height: 1.8;
  margin-bottom: 8px;
}
.initial-state {
  margin-top: 16px;
  color: var(--td-text-color-secondary);
}
@media (max-width: 900px) {
  .request-inputs {
    grid-template-columns: 90px minmax(0, 1fr);
  }
  .result-layout {
    grid-template-columns: 180px minmax(0, 1fr);
  }
  .evidence-fields {
    grid-template-columns: 100px minmax(0, 1fr);
  }
}
@media (max-width: 640px) {
  .result-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .phase-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-right: 0;
    border-bottom: 1px solid var(--td-component-border);
  }
  .phase-button {
    padding: 10px;
  }
  .header-inputs {
    grid-template-columns: minmax(0, 1fr);
  }
  .header-inputs .t-button {
    justify-self: start;
  }
  .detail-content,
  .detail-heading {
    padding: 16px;
  }
  .site-picker {
    align-items: flex-start;
  }
  .site-picker label {
    width: 100%;
  }
  .evidence-fields {
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
  }
  .evidence-fields dd {
    margin-bottom: 10px;
  }
}
</style>
