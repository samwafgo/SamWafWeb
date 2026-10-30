<template>
    <t-dialog class="log-export-dialog" attach="body" :header="tr('title')" :visible="visible" width="min(1180px, calc(100vw - 32px))"
      :footer="false" :close-on-overlay-click="false" @close="close">
      <div class="log-export">
        <t-loading :loading="capLoading">
          <t-alert v-if="capError" theme="warning" :message="tr('unavailable')">
            <template #operation><t-button variant="text" @click="open(focusId)">{{ tr('retry') }}</t-button></template>
          </t-alert>
          <t-alert v-else-if="!capability.allowed" theme="warning" :message="tr('denied')" />
          <template v-else>
            <t-alert v-if="!capability.enabled" theme="warning" :message="tr('disabled')" />
            <t-alert theme="info" :message="tr('scope')" />
            <t-form label-align="top" class="export-form">
              <t-form-item :label="tr('tables')">
                <t-checkbox-group v-model="form.tables" :disabled="!capability.enabled || creating">
                  <t-checkbox value="access_log">{{ tr('access') }} (access_log)</t-checkbox>
                  <t-checkbox value="security_event">{{ tr('event') }} (security_event)</t-checkbox>
                </t-checkbox-group>
              </t-form-item>
              <t-form-item :label="tr('time')">
                <div class="field-stack">
                  <div class="inline-controls">
                    <t-radio-group v-model="form.range_mode" :disabled="!capability.enabled || creating">
                      <t-radio value="custom">{{ tr('custom') }}</t-radio>
                      <t-radio value="days">{{ tr('days') }}</t-radio>
                      <t-radio value="all">{{ tr('all') }}</t-radio>
                    </t-radio-group>
                    <t-button variant="text" :disabled="creating || !capability.enabled" @click="recent">{{ tr('recent') }}</t-button>
                  </div>
                  <t-date-range-picker v-if="form.range_mode === 'custom'" v-model="form.range" enable-time-picker clearable
                    value-type="YYYY-MM-DD HH:mm:ss" :disabled="!capability.enabled || creating" style="width:100%" />
                  <t-date-range-picker v-else-if="form.range_mode === 'days'" v-model="form.days" clearable
                    value-type="YYYY-MM-DD" :disabled="!capability.enabled || creating" style="width:100%" />
                  <span class="secondary">{{ tr(form.range_mode === 'days' ? 'daysBoundary' : 'boundary') }}</span>
                  <t-alert v-if="form.range_mode === 'all'" theme="warning" :message="tr('allWarning')" />
                </div>
              </t-form-item>
              <t-form-item :label="tr('format')">
                <div class="field-stack">
                  <t-select v-model="form.format" :options="formatOptions" :disabled="!capability.enabled || creating" />
                  <t-alert v-if="form.format === 'sqlite'" theme="warning" :message="tr('sqliteHint')" />
                  <span v-else-if="form.format" class="secondary">{{ tr(form.format + 'Hint') }}</span>
                  <span class="secondary">{{ tr('plaintext') }}</span>
                </div>
              </t-form-item>
              <t-button theme="primary" :loading="creating" :disabled="!capability.enabled || !formatOptions.length" @click="create">{{ tr('create') }}</t-button>
            </t-form>
            <div class="task-heading"><h3>{{ tr('tasks') }}</h3><t-button variant="outline" :loading="listLoading" @click="refresh">{{ tr('refresh') }}</t-button></div>
            <p class="secondary">{{ tr('progressHint') }}</p>
            <t-alert v-if="pollError" theme="warning" :message="tr('pollFailed')" />
            <div class="task-table">
              <t-table row-key="id" :data="tasks" :columns="columns" :loading="listLoading" :empty="tr('empty')"
                :pagination="pagination" :disable-data-page="true" :max-height="360" @page-change="pageChange">
                <template #created="{ row }"><span class="data-text">{{ time(row.created_at) }}</span><br />
                  <t-button variant="text" size="small" @click="selectTask(row.id)">{{ row.id }}</t-button></template>
                <template #range="{ row }"><div>{{ tableNames(row.tables) }} · {{ row.format }}</div><span class="secondary data-text">{{ rangeText(row) }}</span></template>
                <template #state="{ row }"><t-tag :theme="statusTheme(row.status)" variant="light">{{ statusText(row.status) }}</t-tag><br />
                  <span class="secondary">{{ statusText(row.phase) }}</span><br /><span class="secondary">{{ tr('sources', { done: row.source_done || 0, total: row.source_total || 0 }) }}</span>
                  <div v-if="row.status === 'partial'" class="partial-text">{{ tr('partialHint') }}</div>
                  <div v-if="row.error_code || row.error_message" class="error-text">{{ row.error_code }} {{ row.error_message }}</div>
                </template>
                <template #written="{ row }"><span class="data-text">{{ tr('rows', { count: count(row.rows_written) }) }}</span><br /><span class="secondary data-text">{{ bytes(row.bytes_written) }}</span></template>
                <template #expires="{ row }"><span class="data-text">{{ row.expires_at ? time(row.expires_at) : tr('pending') }}</span></template>
                <template #actions="{ row }"><div class="task-actions">
                  <t-button size="small" variant="text" @click="selectTask(row.id)">{{ tr('detail') }}</t-button>
                  <t-button v-if="isActive(row) && row.status !== 'cancelling'" size="small" variant="text" :loading="busy === row.id" :disabled="!!busy" @click="confirmAction(row, 'cancel')">{{ tr('cancel') }}</t-button>
                  <t-button v-if="downloadable(row)" size="small" variant="text" :loading="busy === row.id" :disabled="!!busy || !capability.enabled" @click="download(row)">{{ tr('download') }}</t-button>
                  <t-button v-if="row.status !== 'deleted'" size="small" theme="danger" variant="text" :loading="busy === row.id" :disabled="!!busy" @click="confirmAction(row, 'delete')">{{ tr('delete') }}</t-button>
                </div></template>
              </t-table>
            </div>
            <div v-if="focused" class="focused-task">
              <strong>{{ tr('taskId') }} <span class="data-text">{{ focused.id }}</span></strong>
              <p><t-tag :theme="statusTheme(focused.status)" variant="light">{{ statusText(focused.status) }}</t-tag> {{ statusText(focused.phase) }} · {{ tr('rows', { count: count(focused.rows_written) }) }} · {{ bytes(focused.bytes_written) }} · {{ tr('sources', { done: focused.source_done || 0, total: focused.source_total || 0 }) }}</p>
              <p>{{ tableNames(focused.tables) }} · {{ focused.format }} · {{ rangeText(focused) }}</p>
              <p v-if="focused.status === 'partial'" class="partial-text">{{ tr('partialHint') }}</p>
              <p v-if="focused.status === 'failed'" class="error-text">{{ tr('failedHint') }}</p>
              <p v-if="focused.status === 'expired'">{{ tr('expiredHint') }}</p>
              <p v-if="focused.status === 'ready' && Number(focused.rows_written) === 0">{{ tr('emptyHint') }}</p>
              <p v-if="focused.error_code || focused.error_message" class="error-text">{{ focused.error_code }} {{ focused.error_message }}</p>
              <p>{{ tr('expires') }}: {{ focused.expires_at ? time(focused.expires_at) : tr('pending') }}</p>
              <div class="inline-controls">
                <t-button v-if="downloadable(focused)" :disabled="!!busy || !capability.enabled" @click="download(focused)">{{ tr('download') }}</t-button>
                <t-button v-if="isActive(focused) && focused.status !== 'cancelling'" :disabled="!!busy" @click="confirmAction(focused, 'cancel')">{{ tr('cancel') }}</t-button>
                <t-button v-if="focused.status !== 'deleted'" theme="danger" variant="outline" :disabled="!!busy" @click="confirmAction(focused, 'delete')">{{ tr('delete') }}</t-button>
              </div>
            </div>
          </template>
        </t-loading>
        <div class="export-footer"><t-button theme="default" @click="close">{{ tr('close') }}</t-button></div>
      </div>
    </t-dialog>
</template>

<script>
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { exportCapabilities, createLogExport, listLogExports, getLogExport, cancelLogExport, deleteLogExport, logExportTicket, startLogExportDownload } from '@/apis/waflog/exports';

const active = ['queued', 'running', 'packaging', 'cancelling'];
export default {
  name: 'LogExportDialog',
  data() {
    return {
      visible: false, capability: { allowed: false, enabled: false, formats: [] }, capLoading: false, capError: false,
      form: { tables: ['access_log', 'security_event'], range_mode: 'custom', range: [], days: [], format: 'jsonl' },
      tasks: [], focused: null, focusId: '', pagination: { current: 1, pageSize: 10, total: 0 },
      listLoading: false, creating: false, busy: '', pollError: false, timer: null, pollDelay: 2000,
      generation: 0, listSequence: 0, detailSequence: 0, pendingCreate: null, confirmation: null,
      lastCapabilityAt: 0, routeActive: true,
    };
  },
  computed: {
    formatOptions() { return ['jsonl', 'csv', 'sqlite'].filter(f => (this.capability.formats || []).includes(f)).map(f => ({ value: f, label: this.tr(f) })); },
    columns() { return [
      { colKey: 'created', title: this.tr('created'), width: 210 }, { colKey: 'range', title: this.tr('range'), width: 250 },
      { colKey: 'state', title: this.tr('state'), width: 240 }, { colKey: 'written', title: this.tr('written'), width: 140 },
      { colKey: 'expires', title: this.tr('expires'), width: 170 }, { colKey: 'actions', title: this.tr('actions'), width: 160 },
    ]; },
  },
  watch: {
    '$route.query.export_task'(id) { if (this.onLogRoute() && typeof id === 'string' && id) this.open(id === 'tasks' ? '' : id); },
    '$route.name'(name) { if (name !== 'WafvisitLog') this.close(); },
  },
  mounted() {
    this.probe();
    const id = this.$route.query.export_task;
    if (this.onLogRoute() && typeof id === 'string' && id) this.open(id === 'tasks' ? '' : id);
    this.$bus.$on('log-export-open', this.handleOpenEvent);
  },
  activated() { this.routeActive = true; this.probe(); },
  deactivated() { this.routeActive = false; this.close(); },
  beforeDestroy() { this.routeActive = false; this.close(); this.$bus.$off('log-export-open', this.handleOpenEvent); },
  methods: {
    tr(key, params) { return this.$t(`logExport.${key}`, params); },
    onLogRoute() { return this.routeActive && this.$route.name === 'WafvisitLog'; },
    handleOpenEvent(id) { if (this.onLogRoute()) this.open(id); },
    validId(id) { return typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id); },
    isActive(row) { return active.includes(row.status); },
    downloadable(row) { return ['ready', 'partial'].includes(row.status) && (!row.expires_at || Date.parse(row.expires_at) > Date.now()); },
    statusTheme(status) { return ({ ready: 'success', partial: 'warning', failed: 'danger', expired: 'default', deleted: 'default', cancelled: 'default' })[status] || 'primary'; },
    statusText(value) { return value && this.$te(`logExport.${value}`) ? this.tr(value) : (value || '—'); },
    count(value) { return Number(value || 0).toLocaleString(); },
    bytes(value) { const n = Number(value || 0); if (!n) return '0 B'; const i = Math.min(4, Math.floor(Math.log(n) / Math.log(1024))); return `${(n / (1024 ** i)).toFixed(i ? 1 : 0)} ${['B', 'KiB', 'MiB', 'GiB', 'TiB'][i]}`; },
    time(value) { return value && dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '—'; },
    tableNames(tables) { return (Array.isArray(tables) ? tables : []).map(t => t === 'access_log' ? this.tr('access') : t === 'security_event' ? this.tr('event') : t).join(', '); },
    rangeText(task) { return task.range_mode === 'all' ? `${this.tr('all')} · t < ${this.time(task.end_time)}` : `${this.time(task.start_time)} ≤ t < ${this.time(task.end_time)}`; },
    recent() { this.form.range_mode = 'custom'; this.form.range = [dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss'), dayjs().format('YYYY-MM-DD HH:mm:ss')]; },
    result(res, allowEmpty = false) {
      if (!res || res.code !== 0 || (!allowEmpty && (!res.data || typeof res.data !== 'object'))) {
        const error = new Error((res && res.msg) || this.tr('requestFailed'));
        error.apiCode = res && res.code;
        error.exportCode = res && res.data && res.data.error_code;
        throw error;
      }
      return res.data;
    },
    applyCapability(data) {
      this.capability = { ...data, allowed: data.allowed === true, enabled: data.enabled === true, formats: Array.isArray(data.formats) ? data.formats : [] };
      this.lastCapabilityAt = Date.now();
      if (!this.capability.allowed) this.revoke();
    },
    revoke() {
      this.generation += 1; this.listSequence += 1; this.detailSequence += 1;
      this.capability = { allowed: false, enabled: false, formats: [] };
      this.tasks = []; this.focused = null; this.focusId = ''; this.pagination.total = 0;
      this.listLoading = false; this.capLoading = false; this.capError = false; this.creating = false; this.busy = ''; this.pollError = false;
      clearTimeout(this.timer); this.timer = null;
      if (this.confirmation) { this.confirmation.destroy(); this.confirmation = null; }
    },
    handleFailure(error) {
      if ([-999, -403].includes(error.apiCode) || error.exportCode === 'EXPORT_FORBIDDEN') this.revoke();
      else if (error.apiCode === -7 || error.exportCode === 'EXPORT_DISABLED') this.capability.enabled = false;
    },
    async probe() {
      const gen = this.generation;
      try { const data = this.result(await exportCapabilities()); if (gen === this.generation) this.applyCapability(data); }
      catch (e) { if (gen === this.generation) this.handleFailure(e); }
    },
    async open(id) {
      if (!this.onLogRoute()) return;
      this.close();
      const gen = this.generation;
      this.visible = true; this.capLoading = true; this.capError = false; this.pollError = false;
      this.tasks = []; this.focused = null; this.focusId = this.validId(id) ? id : ''; this.pendingCreate = null;
      this.pagination.current = 1; this.pagination.total = 0; this.creating = false; this.busy = ''; this.pollDelay = 2000;
      this.form.tables = ['access_log', 'security_event']; this.form.format = 'jsonl'; this.recent();
      this.form.days = [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')];
      try {
        const data = this.result(await exportCapabilities());
        if (gen !== this.generation) return;
        this.applyCapability(data);
        if (gen !== this.generation) return;
        if (!this.formatOptions.some(f => f.value === this.form.format)) this.form.format = this.formatOptions.length ? this.formatOptions[0].value : '';
        if (this.capability.allowed) await this.refresh();
      } catch (e) { if (gen === this.generation) { this.capError = true; this.handleFailure(e); } }
      finally { if (gen === this.generation) this.capLoading = false; }
    },
    close() {
      this.visible = false; this.generation += 1; this.listSequence += 1; this.detailSequence += 1;
      clearTimeout(this.timer); this.timer = null;
      if (this.confirmation) { this.confirmation.destroy(); this.confirmation = null; }
    },
    schedule() {
      clearTimeout(this.timer);
      if (this.visible && this.onLogRoute() && this.capability.allowed) {
        // Refreshing the current page also discovers tasks created in another tab.
        this.timer = setTimeout(() => this.refresh(true), this.pollDelay);
      }
    },
    async refresh(silent = false) {
      if (!this.visible || !this.onLogRoute() || !this.capability.allowed) return;
      clearTimeout(this.timer);
      const gen = this.generation; const seq = ++this.listSequence;
      if (!silent) this.listLoading = true;
      try {
        if (!silent || Date.now() - this.lastCapabilityAt >= 10000) {
          const capability = this.result(await exportCapabilities());
          if (gen !== this.generation || seq !== this.listSequence) return;
          this.applyCapability(capability);
          if (gen !== this.generation) return;
        }
        const data = this.result(await listLogExports({ page: this.pagination.current, page_size: this.pagination.pageSize }));
        if (gen !== this.generation || seq !== this.listSequence) return;
        if (!Array.isArray(data.list) || !Number.isFinite(Number(data.total))) throw new Error(this.tr('requestFailed'));
        this.tasks = data.list; this.pagination.total = Number(data.total);
        const lastPage = Math.max(1, Math.ceil(this.pagination.total / this.pagination.pageSize));
        if (this.pagination.current > lastPage) { this.pagination.current = lastPage; this.refresh(); return; }
        if (this.focusId) await this.loadFocused(gen);
        if (gen !== this.generation || seq !== this.listSequence) return;
        this.pollError = false; this.pollDelay = 2000;
      } catch (e) {
        if (gen === this.generation && seq === this.listSequence) {
          this.handleFailure(e);
          if (gen === this.generation) { this.pollError = true; this.pollDelay = Math.min(this.pollDelay * 2, 10000); }
        }
      }
      finally { if (gen === this.generation && seq === this.listSequence) { this.listLoading = false; this.schedule(); } }
    },
    pageChange(page) { this.pagination.current = page.pageSize !== this.pagination.pageSize ? 1 : page.current; this.pagination.pageSize = page.pageSize; this.refresh(); },
    async loadFocused(gen) {
      const id = this.focusId; const seq = ++this.detailSequence;
      try {
        const data = this.result(await getLogExport(id));
        if (gen === this.generation && seq === this.detailSequence && id === this.focusId) this.focused = data;
      } catch (e) {
        if (gen !== this.generation || seq !== this.detailSequence || id !== this.focusId) return;
        if (e.exportCode === 'EXPORT_NOT_FOUND') { this.focused = null; this.focusId = ''; this.$message.warning(e.message); return; }
        throw e;
      }
    },
    async selectTask(id) {
      if (!this.validId(id)) return;
      this.focusId = id; this.focused = null; const gen = this.generation;
      try { await this.loadFocused(gen); } catch (e) { if (gen === this.generation) { this.handleFailure(e); this.$message.error(e.message || this.tr('requestFailed')); } }
    },
    async create() {
      if (this.creating || !this.capability.allowed || !this.capability.enabled) return;
      const payload = { format: this.form.format, tables: this.form.tables.slice(), range_mode: this.form.range_mode === 'days' ? 'custom' : this.form.range_mode };
      if (!payload.tables.length || !this.formatOptions.some(f => f.value === payload.format)) { this.$message.warning(this.tr('validation')); return; }
      if (payload.range_mode === 'custom') {
        const wholeDays = this.form.range_mode === 'days';
        const [start, end] = (wholeDays ? this.form.days : this.form.range) || [];
        const from = dayjs(start); const to = dayjs(end);
        const invalidDate = wholeDays && (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || from.format('YYYY-MM-DD') !== start || to.format('YYYY-MM-DD') !== end);
        if (!start || !end || !from.isValid() || !to.isValid() || invalidDate || (wholeDays ? from.isAfter(to) : !from.isBefore(to))) { this.$message.warning(this.tr(wholeDays ? 'daysValidation' : 'validation')); return; }
        payload.start_time = (wholeDays ? from.startOf('day') : from).format('YYYY-MM-DDTHH:mm:ssZ');
        payload.end_time = (wholeDays ? to.add(1, 'day').startOf('day') : to).format('YYYY-MM-DDTHH:mm:ssZ');
      }
      const signature = JSON.stringify(payload);
      if (!this.pendingCreate || this.pendingCreate.signature !== signature) this.pendingCreate = { signature, request_id: uuidv4() };
      const gen = this.generation; this.creating = true;
      try {
        const task = this.result(await createLogExport({ ...payload, request_id: this.pendingCreate.request_id }));
        if (gen !== this.generation) return;
        this.pendingCreate = null; this.$message.success(this.tr('accepted'));
        this.focusId = task.task_id || task.id; this.pagination.current = 1; await this.refresh();
      } catch (e) { if (gen === this.generation) { this.handleFailure(e); this.$message.error(e.message || this.tr('requestFailed')); } }
      finally { if (gen === this.generation) this.creating = false; }
    },
    confirmAction(row, action) {
      if (this.confirmation || this.busy) return;
      const gen = this.generation;
      const dialog = this.$dialog.confirm({ header: this.tr(`${action}Title`), body: this.tr(`${action}Body`), confirmBtn: this.tr('confirm'), cancelBtn: this.tr('keep'),
        onConfirm: () => { dialog.destroy(); this.confirmation = null; if (gen === this.generation && this.visible) this.perform(row, action); },
        onClose: () => { dialog.destroy(); this.confirmation = null; },
      });
      this.confirmation = dialog;
    },
    async perform(row, action) {
      if (this.busy || !this.capability.allowed || !this.validId(row.id)) return;
      const gen = this.generation; this.busy = row.id;
      try { this.result(await (action === 'cancel' ? cancelLogExport(row.id) : deleteLogExport(row.id)), true); if (gen === this.generation) await this.refresh(); }
      catch (e) { if (gen === this.generation) { this.handleFailure(e); this.$message.error(e.message || this.tr('requestFailed')); } }
      finally { if (gen === this.generation) this.busy = ''; }
    },
    async download(row) {
      if (this.busy || !this.capability.allowed || !this.capability.enabled || !this.downloadable(row) || !this.validId(row.id)) return;
      const gen = this.generation; this.busy = row.id;
      try { const data = this.result(await logExportTicket(row.id)); if (gen !== this.generation || !this.visible) return; if (typeof data.ticket !== 'string' || !data.ticket) throw new Error(this.tr('requestFailed')); startLogExportDownload(row.id, data.ticket); }
      catch (e) { if (gen === this.generation) { this.handleFailure(e); this.$message.error(e.message || this.tr('requestFailed')); } }
      finally { if (gen === this.generation) this.busy = ''; }
    },
  },
};
</script>

<style scoped>
.log-export { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; min-width: 0; max-width: 100%; }
.log-export > *, .log-export /deep/ .t-loading, .export-form > *, .export-form /deep/ .t-form__controls, .export-form /deep/ .t-form__controls-content { min-width: 0; max-width: 100%; }
.log-export /deep/ .t-alert { margin-bottom: 12px; white-space: normal; overflow-wrap: anywhere; }
.export-form { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0 24px; margin-block: 16px 24px; }
.export-form /deep/ .t-radio-group, .export-form /deep/ .t-checkbox-group { display: flex; flex-wrap: wrap; gap: 8px 16px; }
.export-form /deep/ .t-form__label { white-space: normal; }
.export-form /deep/ .t-date-range-picker { width: 100%; min-width: 0; }
.export-form > :first-child, .export-form > :last-child { grid-column: 1 / -1; }
.export-form > :last-child { justify-self: start; }
.field-stack { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.inline-controls, .task-heading, .task-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.task-heading { justify-content: space-between; }
.task-heading h3 { margin: 0; font-size: 16px; }
.secondary { color: var(--td-text-color-secondary); font-size: 12px; }
.data-text { font-family: Consolas, monospace; font-variant-numeric: tabular-nums; }
.task-table { overflow-x: auto; min-width: 0; max-width: 100%; }
.field-stack { min-width: 0; overflow-wrap: anywhere; }
.log-export /deep/ .t-pagination { flex-wrap: wrap; gap: 8px; }
.log-export /deep/ .t-pagination__total { flex-wrap: wrap; }
.focused-task { background: var(--td-bg-color-secondarycontainer); padding: 16px; margin-top: 16px; overflow-wrap: anywhere; }
.partial-text { color: var(--td-warning-color); }
.error-text { color: var(--td-error-color); overflow-wrap: anywhere; }
.export-footer { display: flex; justify-content: flex-end; margin-top: 16px; }
@media (max-width: 1000px) { .export-form { grid-template-columns: minmax(0, 1fr); gap: 0; } }
</style>

<style>
.log-export-dialog .t-dialog { box-sizing: border-box; max-width: calc(100vw - 32px); }
.log-export-dialog .t-dialog__body { min-width: 0; white-space: normal; }
</style>
