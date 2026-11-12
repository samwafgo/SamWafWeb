<template>
  <div class="security-report">
    <t-alert v-if="denied" theme="warning" :message="tr('denied')" />
    <template v-else>
      <t-alert theme="info" :message="tr('intro')" />
      <t-alert v-if="configError" theme="warning" :message="configError">
        <template #operation><t-button variant="text" @click="initialize">{{ tr('retry') }}</t-button></template>
      </t-alert>
      <t-loading :loading="configLoading">
        <t-tabs v-model="tab">
          <t-tab-panel value="settings" :label="tr('settings')">
            <t-form label-align="top" class="report-form" :disabled="!allowed || saving">
              <t-card :title="tr('title')" :bordered="false">
                <t-form-item :label="tr('enabled')"><div class="field-stack">
                  <t-switch v-model="config.enabled" /><span class="secondary">{{ tr('enabledHint') }}</span>
                </div></t-form-item>
                <p class="secondary">{{ tr('timezone') }}: {{ timezone || '—' }} · {{ tr('timezoneHint') }}</p>
              </t-card>
              <t-card :title="tr('schedule')" :bordered="false">
                <div class="form-grid">
                  <div v-for="kind in kinds" :key="kind" class="schedule-item">
                    <t-form-item :label="tr(kind)"><t-switch v-model="config[kind + '_enabled']" :disabled="!allowed || saving || !config.enabled" /></t-form-item>
                    <t-form-item :label="tr(kind + 'At')"><div class="field-stack">
                      <t-time-picker v-model="config[kind + '_at']" format="HH:mm" :allow-input="true" :clearable="false"
                        :disabled="!allowed || saving || !config.enabled || !config[kind + '_enabled']" />
                      <span class="secondary">{{ tr(kind + 'Hint') }}</span>
                    </div></t-form-item>
                  </div>
                </div>
              </t-card>
              <t-card :title="tr('content')" :bordered="false"><div class="form-grid">
                <t-form-item :label="tr('scope')"><span>{{ tr('allInstance') }}</span></t-form-item>
                <t-form-item :label="tr('language')"><t-select v-model="config.language" :options="languages" :disabled="!allowed || saving" /></t-form-item>
                <t-form-item :label="tr('topN')"><t-input-number v-model="config.top_n" :min="5" :max="50" :step="1" :disabled="!allowed || saving" /></t-form-item>
              </div>
                <t-form-item :label="tr('notify')"><div class="field-stack"><span class="secondary">{{ tr('notifyHint') }}</span>
                  <router-link :to="{ name: 'NotifySubscription' }">{{ tr('notifyLink') }}</router-link>
                </div></t-form-item>
              </t-card>
              <t-card :title="tr('storage')" :bordered="false"><div class="form-grid">
                <t-form-item :label="tr('retainDays')"><t-input-number v-model="config.retain_days" :min="1" :max="365" :step="1" :disabled="!allowed || saving" /></t-form-item>
                <t-form-item :label="tr('quotaMb')"><t-input-number v-model="config.quota_mb" :min="10" :max="10240" :step="10" :disabled="!allowed || saving" /></t-form-item>
              </div><p class="secondary">{{ tr('storageHint') }}</p></t-card>
              <div class="save-bar"><t-button theme="primary" :disabled="!allowed || configLoading" :loading="saving" @click="save">{{ tr('save') }}</t-button></div>
            </t-form>
          </t-tab-panel>
          <t-tab-panel value="tasks" :label="tr('tasks')">
            <t-card :bordered="false" class="task-card">
              <div class="toolbar"><t-button theme="primary" :disabled="!allowed" @click="openCreate">{{ tr('generate') }}</t-button>
                <t-button variant="outline" :loading="listLoading" :disabled="!allowed" @click="fetchList">{{ tr('refresh') }}</t-button>
                <span class="secondary">{{ tr('polling') }}</span>
              </div>
              <t-alert theme="info" :message="tr('dataHint')" />
              <t-alert v-if="listError" theme="warning" :message="listError" />
              <t-table row-key="id" :data="tasks" :columns="columns" :loading="listLoading" :pagination="pagination"
                :disable-data-page="true" :empty="tr('empty')" :max-height="600" @page-change="pageChange">
                <template #kind="{ row }"><div>{{ label(row.kind) }}</div><div class="secondary task-id">{{ row.id }}</div></template>
                <template #range="{ row }">{{ rangeText(row) }}</template>
                <template #status="{ row }"><t-tag :theme="statusTheme(row.status)" variant="light">{{ label(row.status) }}</t-tag>
                  <div v-if="row.status === 'partial'" class="warning-text">{{ tr('partialHint') }}</div>
                  <div v-if="row.error_message" class="error-text">{{ row.error_message }}</div>
                </template>
                <template #created="{ row }"><div>{{ time(row.created_at) }}</div><div class="secondary">{{ tr('completedAt') }}: {{ time(row.completed_at) }}</div></template>
                <template #size="{ row }">{{ bytes(row.size_bytes) }}</template>
                <template #source="{ row }">{{ row.source === 'schedule' ? tr('scheduleSource') : label(row.source) }}</template>
                <template #actions="{ row }"><div class="task-actions">
                  <t-button v-if="downloadable(row)" variant="text" size="small" :disabled="!!busy" :loading="busy === row.id" @click="readReport(row, true)">{{ tr('preview') }}</t-button>
                  <t-button v-if="downloadable(row)" variant="text" size="small" :disabled="!!busy" @click="readReport(row, false)">{{ tr('download') }}</t-button>
                  <t-popconfirm v-if="!active(row)" :content="tr('deleteConfirm')" :confirm-btn="tr('confirm')" :cancel-btn="tr('cancel')" @confirm="remove(row)">
                    <t-button theme="danger" variant="text" size="small" :disabled="!!busy">{{ tr('delete') }}</t-button>
                  </t-popconfirm>
                </div></template>
              </t-table>
            </t-card>
          </t-tab-panel>
        </t-tabs>
      </t-loading>
    </template>
    <t-dialog :visible="createVisible" :header="tr('generate')" width="min(560px, calc(100vw - 32px))" :footer="false" :close-on-overlay-click="false" @close="closeCreate">
      <t-form label-align="top">
        <t-form-item :label="tr('kind')"><t-radio-group v-model="createForm.kind" :disabled="creating" @change="previousPeriod"><t-radio v-for="kind in kinds" :key="kind" :value="kind">{{ tr(kind) }}</t-radio></t-radio-group></t-form-item>
        <t-form-item :label="tr('date')"><div class="field-stack">
          <div class="toolbar"><t-date-picker v-model="createForm.date" value-type="YYYY-MM-DD" :disabled="creating" /><t-button variant="text" :disabled="creating" @click="previousPeriod">{{ tr('previous') }}</t-button></div>
          <span class="secondary">{{ tr('dateHint') }} {{ tr('timezoneHint') }} ({{ timezone || '—' }})</span>
          <span>{{ tr('period') }}: {{ selectedPeriod }}</span>
        </div></t-form-item>
        <t-alert v-if="createError" theme="warning" :message="createError" />
        <div class="dialog-footer"><t-button theme="default" :disabled="creating" @click="closeCreate">{{ tr('cancel') }}</t-button><t-button theme="primary" :loading="creating" :disabled="!allowed" @click="create">{{ tr('generate') }}</t-button></div>
      </t-form>
    </t-dialog>
    <t-dialog :visible="!!previewUrl" :header="tr('previewTitle')" width="min(1200px, calc(100vw - 32px))" :footer="false" @close="closePreview">
      <p class="secondary">{{ tr('previewHint') }}</p>
      <iframe v-if="previewUrl" :src="previewUrl" sandbox="" referrerpolicy="no-referrer" :title="tr('previewTitle')" class="report-preview" />
      <div class="dialog-footer"><t-button theme="default" @click="closePreview">{{ tr('close') }}</t-button></div>
    </t-dialog>
  </div>
</template>

<script>
import { getReportConfig, saveReportConfig, listReports, createReport, deleteReport, downloadReport } from '@/apis/securityReport';

const defaults = () => ({ enabled: true, daily_enabled: true, weekly_enabled: true, monthly_enabled: true,
  daily_at: '00:30', weekly_at: '08:00', monthly_at: '09:00', retain_days: 30, quota_mb: 500, top_n: 10, language: 'zh-CN' });
const pad = n => String(n).padStart(2, '0');
const calendarDate = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
function period(kind, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return null;
  const start = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(start.getTime()) || calendarDate(start) !== date) return null;
  if (kind === 'weekly') start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  if (kind === 'monthly') start.setUTCDate(1);
  const end = new Date(start);
  if (kind === 'monthly') end.setUTCMonth(end.getUTCMonth() + 1);
  else end.setUTCDate(end.getUTCDate() + (kind === 'weekly' ? 7 : 1));
  return { start, end };
}

export default {
  name: 'SecurityReport',
  data() { return {
    config: defaults(), tab: 'settings', kinds: ['daily', 'weekly', 'monthly'], languages: [{ value: 'zh-CN', label: '中文' }, { value: 'en-US', label: 'English' }],
    allowed: false, denied: false, configLoading: false, configError: '', saving: false, timezone: '', timezoneOffset: null, serverTime: 0, serverReceivedAt: 0,
    tasks: [], pagination: { current: 1, pageSize: 20, total: 0 }, listLoading: false, listError: '', timer: null, alive: false, generation: 0, listSequence: 0,
    createVisible: false, createForm: { kind: 'daily', date: '' }, createError: '', creating: false, busy: '', previewUrl: '',
  }; },
  computed: {
    columns() { return [
      { colKey: 'kind', title: this.tr('kind'), width: 220 }, { colKey: 'range', title: this.tr('range'), width: 200 },
      { colKey: 'status', title: this.tr('status'), width: 240 }, { colKey: 'created', title: this.tr('created'), width: 220 },
      { colKey: 'size', title: this.tr('size'), width: 110 }, { colKey: 'source', title: this.tr('source'), width: 100 },
      { colKey: 'actions', title: this.tr('actions'), width: 220 },
    ]; },
    selectedPeriod() {
      const p = period(this.createForm.kind, this.createForm.date);
      return p ? `${calendarDate(p.start)} ~ ${calendarDate(new Date(p.end.getTime() - 1))}` : '—';
    },
  },
  mounted() { this.initialize(); },
  activated() { if (!this.alive) this.initialize(); },
  deactivated() { this.stop(); },
  beforeDestroy() { this.stop(); },
  methods: {
    tr(key) { return this.$t(`securityReport.${key}`); },
    label(value) { return value && this.$te(`securityReport.${value}`) ? this.tr(value) : (value || '—'); },
    result(res) {
      if (!res || res.code !== 0 || !res.data || typeof res.data !== 'object') {
        const error = new Error((res && res.msg) || this.tr('requestFailed'));
        error.apiCode = res && res.code;
        throw error;
      }
      return res.data;
    },
    handleError(error) {
      if ([-403, -999, -3, -4].includes(error.apiCode)) {
        this.allowed = false; this.denied = true; this.tasks = []; this.pagination.total = 0;
        this.listSequence += 1; this.listLoading = false;
        clearTimeout(this.timer); this.timer = null; this.createVisible = false; this.closePreview();
        if (error.apiCode === -999 || error.apiCode === -4) this.$router.replace({ path: '/login' });
        if (error.apiCode === -3) this.$router.replace({ path: '/account/OTP' });
      }
      return error.message === 'REPORT_DOWNLOAD_FAILED' ? this.tr('requestFailed') : (error.message || this.tr('requestFailed'));
    },
    stop() { this.alive = false; this.generation += 1; this.listSequence += 1; clearTimeout(this.timer); this.timer = null; this.configLoading = false; this.listLoading = false; this.saving = false; this.creating = false; this.busy = ''; this.createVisible = false; this.closePreview(); },
    async initialize() {
      clearTimeout(this.timer); this.timer = null;
      this.alive = true; const gen = ++this.generation;
      this.allowed = false; this.denied = false; this.configLoading = true; this.configError = '';
      try {
        const data = this.result(await getReportConfig());
        if (!this.alive || gen !== this.generation) return;
        const value = defaults(); Object.keys(value).forEach(key => { if (data[key] !== undefined) value[key] = data[key]; });
        this.config = value; this.timezone = typeof data.timezone === 'string' ? data.timezone : '';
        this.timezoneOffset = Number.isFinite(data.timezone_offset) ? data.timezone_offset : null;
        this.serverTime = Number(data.server_time) || 0; this.serverReceivedAt = Date.now();
        this.allowed = true; this.fetchList();
      } catch (error) { if (this.alive && gen === this.generation) this.configError = this.handleError(error) || this.tr('loadFailed'); }
      finally { if (gen === this.generation) this.configLoading = false; }
    },
    async save() {
      if (!this.allowed || this.saving) return;
      const c = this.config;
      const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
      if (!this.kinds.every(k => /^([01]\d|2[0-3]):[0-5]\d$/.test(c[k + '_at'])) ||
        !integer(c.retain_days, 1, 365) || !integer(c.quota_mb, 10, 10240) || !integer(c.top_n, 5, 50) || !['zh-CN', 'en-US'].includes(c.language)) {
        this.$message.warning(this.tr('configInvalid')); return;
      }
      this.saving = true; const gen = this.generation;
      try {
        const body = {}; Object.keys(defaults()).forEach(key => { body[key] = c[key]; });
        const res = await saveReportConfig(body);
        if (!this.alive || gen !== this.generation) return;
        if (!res || res.code !== 0) { const error = new Error((res && res.msg) || this.tr('requestFailed')); error.apiCode = res && res.code; throw error; }
        this.$message.success(this.tr('saved'));
      } catch (error) { if (this.alive && gen === this.generation) this.$message.error(this.handleError(error)); }
      finally { if (gen === this.generation) this.saving = false; }
    },
    async fetchList() {
      if (!this.alive || !this.allowed) return;
      clearTimeout(this.timer); this.timer = null;
      const gen = this.generation; const seq = ++this.listSequence; this.listLoading = true;
      try {
        const data = this.result(await listReports({ pageIndex: this.pagination.current, pageSize: this.pagination.pageSize }));
        if (!this.alive || gen !== this.generation || seq !== this.listSequence) return;
        if (!Array.isArray(data.list) || !Number.isFinite(data.total)) throw new Error(this.tr('listFailed'));
        this.tasks = data.list; this.pagination.total = data.total; this.listError = '';
        const lastPage = Math.max(1, Math.ceil(data.total / this.pagination.pageSize));
        if (this.pagination.current > lastPage) { this.pagination.current = lastPage; this.fetchList(); }
      } catch (error) { if (this.alive && gen === this.generation && seq === this.listSequence) { const msg = this.handleError(error); this.listError = `${this.tr('listFailed')} ${msg}`; } }
      finally {
        if (this.alive && gen === this.generation && seq === this.listSequence) {
          this.listLoading = false;
          if (this.allowed) this.timer = setTimeout(() => this.fetchList(), 5000);
        }
      }
    },
    pageChange(page) { this.pagination.current = page.current; this.pagination.pageSize = page.pageSize; this.fetchList(); },
    active(row) { return ['queued', 'running'].includes(row.status); },
    downloadable(row) { return ['completed', 'partial'].includes(row.status); },
    statusTheme(status) { return ({ completed: 'success', partial: 'warning', failed: 'danger', expired: 'default' })[status] || 'primary'; },
    time(value, dateOnly = false) {
      const n = Number(value); if (!Number.isFinite(n) || n <= 0) return '—';
      const d = new Date((n + (this.timezoneOffset || 0)) * 1000);
      if (!Number.isFinite(d.getTime())) return '—';
      if (this.timezoneOffset === null) return dateOnly ? d.toLocaleDateString() : d.toLocaleString();
      return dateOnly ? calendarDate(d) : `${calendarDate(d)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    },
    rangeText(row) { return row.range_start && row.range_end ? `${this.time(row.range_start, true)} ~ ${this.time(Number(row.range_end) - 1, true)}` : '—'; },
    bytes(value) { const n = Number(value); if (!Number.isFinite(n) || n < 0 || value === null || value === undefined) return '—'; if (!n) return '0 B'; const i = Math.min(3, Math.floor(Math.log(n) / Math.log(1024))); return `${(n / (1024 ** i)).toFixed(i ? 1 : 0)} ${['B', 'KiB', 'MiB', 'GiB'][i]}`; },
    openCreate() { this.createError = ''; this.createVisible = true; this.previousPeriod(); },
    closeCreate() { if (!this.creating) this.createVisible = false; },
    previousPeriod() {
      const seconds = this.serverTime ? this.serverTime + (Date.now() - this.serverReceivedAt) / 1000 : Date.now() / 1000;
      let today;
      if (this.timezoneOffset !== null) today = calendarDate(new Date((seconds + this.timezoneOffset) * 1000));
      else { const d = new Date(); today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
      const p = period(this.createForm.kind, today);
      this.createForm.date = calendarDate(new Date(p.start.getTime() - 86400000)); this.createError = '';
    },
    async create() {
      if (!this.allowed || this.creating) return;
      if (!period(this.createForm.kind, this.createForm.date)) { this.createError = this.tr('invalidDate'); return; }
      this.creating = true; this.createError = ''; const gen = this.generation;
      try {
        this.result(await createReport({ kind: this.createForm.kind, date: this.createForm.date }));
        if (!this.alive || gen !== this.generation) return;
        this.createVisible = false; this.tab = 'tasks'; this.pagination.current = 1;
        this.$message.success(this.tr('accepted')); this.fetchList();
      } catch (error) { if (this.alive && gen === this.generation) this.createError = this.handleError(error); }
      finally { if (gen === this.generation) this.creating = false; }
    },
    validId(id) { return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id); },
    async remove(row) {
      if (!this.allowed || this.busy || !this.validId(row.id) || this.active(row)) return;
      this.busy = row.id; const gen = this.generation;
      try {
        const res = await deleteReport(row.id);
        if (!this.alive || gen !== this.generation) return;
        if (!res || res.code !== 0) { const error = new Error((res && res.msg) || this.tr('requestFailed')); error.apiCode = res && res.code; throw error; }
        this.$message.success(this.tr('deleted')); this.fetchList();
      } catch (error) { if (this.alive && gen === this.generation) this.$message.error(this.handleError(error)); }
      finally { if (gen === this.generation) this.busy = ''; }
    },
    async readReport(row, preview) {
      if (!this.allowed || this.busy || !this.validId(row.id) || !this.downloadable(row)) return;
      this.busy = row.id; const gen = this.generation;
      try {
        let blob = await downloadReport(row.id);
        if (!this.alive || !this.allowed || gen !== this.generation) return;
        if (preview) {
          const html = await blob.text();
          if (!this.alive || !this.allowed || gen !== this.generation) return;
          const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">`;
          blob = new Blob(['<!doctype html>', policy, html], { type: 'text/html;charset=utf-8' });
        }
        const url = URL.createObjectURL(blob);
        if (preview) { this.closePreview(); this.previewUrl = url; }
        else {
          const link = document.createElement('a'); link.href = url; link.download = `samwaf-report-${row.id}.html`;
          document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
      } catch (error) { if (this.alive && gen === this.generation) this.$message.error(this.handleError(error)); }
      finally { if (gen === this.generation) this.busy = ''; }
    },
    closePreview() { if (this.previewUrl) URL.revokeObjectURL(this.previewUrl); this.previewUrl = ''; },
  },
};
</script>

<style scoped lang="less">
.security-report {
  > .t-alert { margin-bottom: 16px; }
  .t-card { margin: 16px 0; }
  .report-form { max-width: 1200px; }
  .form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px 28px; }
  .field-stack { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; width: 100%; }
  .secondary { color: var(--td-text-color-secondary); font-size: 12px; line-height: 1.7; }
  .toolbar, .task-actions, .dialog-footer { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .toolbar { margin-bottom: 12px; }
  .dialog-footer, .save-bar { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
  .task-card .t-alert { margin-bottom: 12px; }
  .task-id, .error-text, .warning-text { overflow-wrap: anywhere; margin-top: 6px; }
  .warning-text { color: var(--td-warning-color); font-size: 12px; }
  .error-text { color: var(--td-error-color); font-size: 12px; white-space: pre-wrap; }
  .report-preview { width: 100%; height: 68vh; border: 1px solid var(--td-component-border); background: white; }
  @media (max-width: 960px) { .form-grid { grid-template-columns: 1fr; gap: 0; } }
}
</style>
