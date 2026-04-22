<template>
  <div>
    <t-alert theme="info" :message="$t('page.owasp.sandbox.alert_message')" close />
    <t-row :gutter="16">
      <t-col :span="6">
        <t-form :data="form" :labelWidth="90" @submit="onSubmit">
          <t-form-item :label="$t('page.owasp.sandbox.method')">
            <t-select v-model="form.method" style="width:160px">
              <t-option value="GET" label="GET" />
              <t-option value="POST" label="POST" />
              <t-option value="PUT" label="PUT" />
              <t-option value="DELETE" label="DELETE" />
              <t-option value="PATCH" label="PATCH" />
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.owasp.sandbox.url')">
            <t-input v-model="form.url" :placeholder="$t('page.owasp.sandbox.url_ph')" />
          </t-form-item>
          <t-form-item :label="$t('page.owasp.sandbox.headers')">
            <t-textarea
              v-model="headersText"
              :autosize="{ minRows: 4, maxRows: 10 }"
              :placeholder="$t('page.owasp.sandbox.headers_ph')"
            />
          </t-form-item>
          <t-form-item :label="$t('page.owasp.sandbox.body')">
            <t-textarea v-model="form.body" :autosize="{ minRows: 4, maxRows: 12 }" />
          </t-form-item>
          <t-form-item>
            <t-button theme="primary" type="submit" :loading="loading">{{ $t('page.owasp.sandbox.run') }}</t-button>
            <t-button variant="outline" @click="fillExample">{{ $t('page.owasp.sandbox.load_example') }}</t-button>
          </t-form-item>
        </t-form>
      </t-col>
      <t-col :span="6">
        <div class="result-panel">
          <div class="result-header">
            <t-tag v-if="!hasRun" theme="default" variant="light">{{ $t('page.owasp.sandbox.not_run') }}</t-tag>
            <t-tag v-else-if="result.interrupted" theme="danger" variant="light">
              {{ $t('page.owasp.sandbox.interrupted') }} (rule {{ result.interrupt_rule_id }})
            </t-tag>
            <t-tag v-else theme="success" variant="light">{{ $t('page.owasp.sandbox.passed') }}</t-tag>
            <span style="margin-left:12px">
              {{ $t('page.owasp.sandbox.anomaly_score') }}: <b>{{ result.anomaly_score || 0 }}</b>
            </span>
            <span v-if="result.detection_score" style="margin-left:12px">
              {{ $t('page.owasp.sandbox.detection_score') }}: <b>{{ result.detection_score }}</b>
            </span>
            <span v-if="result.blocking_threshold" style="margin-left:12px;color:var(--td-text-color-placeholder)">
              {{ $t('page.owasp.sandbox.threshold') }}: {{ result.blocking_threshold }}
              · PL {{ result.blocking_paranoia }}/{{ result.detection_paranoia }}
            </span>
          </div>

          <!-- 诊断提示：命中了规则但拦截分未达到阈值 -->
          <t-alert
            v-if="diagnosis.show"
            :theme="diagnosis.theme"
            :title="diagnosis.title"
            :message="diagnosis.message"
            style="margin-bottom:12px"
          />

          <t-table :columns="hitColumns" :data="result.hits || []" rowKey="id" empty="-">
            <template #id="{ row }">
              <a class="rule-id-link" @click="onViewRule(row.id)">{{ row.id }}</a>
            </template>
            <template #severity="{ row }">
              <t-tag :theme="severityTheme(row.severity)" variant="light">{{ row.severity || '-' }}</t-tag>
            </template>
            <template #score="{ row }">
              <t-tooltip
                v-if="severityScore(row.severity) > 0"
                :content="isPl2PlusForBlocking(row)
                  ? $t('page.owasp.sandbox.pl_not_counted')
                  : $t('page.owasp.sandbox.score_counted')"
                placement="top"
              >
                <span :class="isPl2PlusForBlocking(row) ? 'score-not-counted' : 'score-counted'">
                  +{{ severityScore(row.severity) }}
                </span>
              </t-tooltip>
              <span v-else class="score-zero">-</span>
            </template>
            <template #paranoia="{ row }">
              <t-tag
                v-if="isPl2PlusForBlocking(row)"
                theme="warning"
                variant="light"
                :content="$t('page.owasp.sandbox.pl_not_counted')"
              >PL {{ paranoiaOfRule(row) }}</t-tag>
              <span v-else>{{ paranoiaOfRule(row) || '-' }}</span>
            </template>
            <template #op="{ row }">
              <t-space size="small">
                <t-tooltip :content="$t('page.owasp.sandbox.disable_rule')" placement="top">
                  <t-button size="small" variant="outline" theme="danger" @click="onDisableRule(row)">
                    {{ $t('page.owasp.sandbox.disable_rule') }}
                  </t-button>
                </t-tooltip>
                <t-tooltip :content="$t('page.owasp.sandbox.override_rule')" placement="top">
                  <t-button size="small" variant="outline" @click="onOverrideRule(row)">
                    {{ $t('page.owasp.sandbox.override_rule') }}
                  </t-button>
                </t-tooltip>
              </t-space>
            </template>
          </t-table>
        </div>
      </t-col>
    </t-row>

    <!-- 规则详情弹窗（只读） -->
    <t-dialog
      :header="ruleDialog.title"
      :visible.sync="ruleDialog.visible"
      :width="860"
      :footer="false"
      :loading="ruleDialog.loading"
    >
      <div v-if="ruleDialog.data" slot="body">
        <t-descriptions :column="2" size="small" bordered style="margin-bottom:16px">
          <t-descriptions-item :label="$t('page.owasp.rules.rule_id')">
            <b>{{ ruleDialog.data.id }}</b>
          </t-descriptions-item>
          <t-descriptions-item :label="$t('page.owasp.rules.directive')">
            {{ ruleDialog.data.directive || '-' }}
          </t-descriptions-item>
          <t-descriptions-item :label="$t('page.owasp.rules.phase_label')">
            <t-tag v-if="ruleDialog.data.phase" theme="primary" variant="light">
              Phase {{ ruleDialog.data.phase }} - {{ phaseName(ruleDialog.data.phase) }}
            </t-tag>
            <span v-else>-</span>
          </t-descriptions-item>
          <t-descriptions-item :label="$t('page.owasp.rules.severity')">
            <t-tag v-if="ruleDialog.data.severity" :theme="severityTheme(ruleDialog.data.severity)" variant="light">
              {{ ruleDialog.data.severity }} (+{{ severityScore(ruleDialog.data.severity) }})
            </t-tag>
            <span v-else>-</span>
          </t-descriptions-item>
          <t-descriptions-item :label="$t('page.owasp.rules.paranoia')">
            <t-tag v-if="ruleDialog.data.paranoia" theme="warning" variant="light">PL {{ ruleDialog.data.paranoia }}</t-tag>
            <span v-else>{{ $t('page.owasp.rules.paranoia_none') }}</span>
          </t-descriptions-item>
          <t-descriptions-item :label="$t('page.owasp.rules.file')">
            {{ ruleDialog.data.source_file }}
          </t-descriptions-item>
          <t-descriptions-item :span="2" :label="$t('page.owasp.rules.message')">
            {{ ruleDialog.data.message || '-' }}
          </t-descriptions-item>
          <t-descriptions-item :span="2" :label="$t('page.owasp.rules.tags')">
            <template v-if="ruleDialog.data.tags && ruleDialog.data.tags.length">
              <t-tag v-for="tg in ruleDialog.data.tags" :key="tg" variant="light" size="small" style="margin:2px 4px 2px 0">{{ tg }}</t-tag>
            </template>
            <span v-else>-</span>
          </t-descriptions-item>
        </t-descriptions>
        <t-form-item :label="$t('page.owasp.rules.content')" :label-width="100">
          <t-textarea :value="ruleDialog.data.content" :autosize="{ minRows: 8, maxRows: 20 }" readonly />
        </t-form-item>
        <div style="text-align:right;margin-top:8px">
          <t-button variant="outline" @click="onRuleDialogAi">{{ $t('page.owasp.rules.ai_analyze') }}</t-button>
          <t-button variant="outline" style="margin-left:8px" @click="ruleDialog.visible = false">{{ $t('common.close') }}</t-button>
        </div>
      </div>
    </t-dialog>

    <!-- AI 分析预览确认 -->
    <t-dialog
      :header="$t('page.owasp.rules.ai_analyze')"
      :visible.sync="aiDialog.visible"
      width="680px"
      :onConfirm="confirmSendAi"
      :onClose="() => { aiDialog.visible = false }"
    >
      <t-alert theme="info" :message="$t('page.owasp.rules.ai_analyze_tip')" style="margin-bottom:10px" />
      <t-textarea v-model="aiDialog.prompt" :autosize="{ minRows: 8, maxRows: 18 }" />
    </t-dialog>

    <!-- 禁用规则确认弹窗 -->
    <t-dialog
      :header="`${$t('page.owasp.sandbox.disable_confirm_title')} #${disableDialog.ruleId}`"
      :visible.sync="disableDialog.visible"
      width="520px"
      :confirm-btn="{ content: $t('page.owasp.sandbox.disable_rule'), theme: 'danger', loading: disableDialog.saving }"
      :onConfirm="confirmDisableRule"
      :onClose="() => { disableDialog.visible = false }"
    >
      <t-alert
        theme="warning"
        :message="$t('page.owasp.sandbox.disable_confirm_body').replace('{id}', String(disableDialog.ruleId))"
        style="margin-bottom:12px"
      />
      <p style="font-size:13px;color:var(--td-text-color-secondary)">
        SecRuleRemoveById {{ disableDialog.ruleId }}
      </p>
    </t-dialog>

    <!-- 改写规则弹窗 -->
    <t-dialog
      :header="`${$t('page.owasp.sandbox.override_rule')} #${overrideDialog.ruleId}`"
      :visible.sync="overrideDialog.visible"
      :width="860"
      :loading="overrideDialog.loading"
      :confirm-btn="{ content: $t('common.save'), loading: overrideDialog.saving }"
      :onConfirm="confirmOverrideRule"
      :onClose="() => { overrideDialog.visible = false }"
    >
      <t-alert theme="info" :message="$t('page.owasp.sandbox.override_tip')" style="margin-bottom:8px" />
      <!-- CRS tx.* 变量检测提示 -->
      <div v-if="overrideTxVars.length" style="margin-bottom:8px">
        <t-alert theme="warning">
          <template #message>
            <span>该规则引用了以下 <b>CRS 事务变量</b>，建议去「<b>调参 → CRS 变量参数</b>」设置，比直接改写更安全：</span>
            <div style="margin-top:4px">
              <t-tag
                v-for="v in overrideTxVars"
                :key="v"
                theme="warning"
                variant="light"
                size="small"
                style="margin:2px 4px 2px 0;cursor:pointer;font-family:monospace"
                @click="$emit('switch-tab','tuning')"
              >tx.{{ v }} ↗</t-tag>
            </div>
          </template>
        </t-alert>
      </div>
      <t-textarea
        v-model="overrideDialog.content"
        :autosize="{ minRows: 10, maxRows: 22 }"
        placeholder="SecRule ..."
      />
    </t-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { owaspDryRunApi, owaspRuleDetailApi, owaspRuleToggleApi, owaspRuleOverrideApi } from '@/apis/owasp';

export default Vue.extend({
  name: 'OwaspSandboxTab',
  data() {
    return {
      form: {
        method: 'GET',
        url: '/index.php?id=1 AND 1=1',
        body: '',
      },
      headersText: 'User-Agent: curl/7.88\nAccept: */*',
      loading: false,
      hasRun: false,
      result: {
        interrupted: false,
        interrupt_rule_id: 0,
        anomaly_score: 0,
        detection_score: 0,
        blocking_threshold: 0,
        blocking_paranoia: 0,
        detection_paranoia: 0,
        hits: [],
      },
      ruleDialog: {
        visible: false,
        loading: false,
        editMode: false,
        saving: false,
        title: '',
        data: null as any,
        editContent: '',
      },
      aiDialog: {
        visible: false,
        prompt: '',
      },
      overrideDialog: {
        visible: false,
        loading: false,
        saving: false,
        ruleId: 0,
        sourceFile: '',
        content: '',
      },
      disableDialog: {
        visible: false,
        saving: false,
        ruleId: 0,
        sourceFile: '',
      },
      hitColumns: [
        { title: 'ID', colKey: 'id', width: 100 },
        { title: this.$t('page.owasp.sandbox.severity'), colKey: 'severity', width: 110 },
        { title: this.$t('page.owasp.sandbox.score'), colKey: 'score', width: 90 },
        { title: 'PL', colKey: 'paranoia', width: 90 },
        { title: this.$t('page.owasp.sandbox.phase'), colKey: 'phase', width: 70 },
        { title: this.$t('page.owasp.sandbox.message'), colKey: 'message', ellipsis: true },
        { title: this.$t('page.owasp.sandbox.op'), colKey: 'op', width: 140, fixed: 'right' },
      ],
    };
  },
  mounted() {
    const raw = sessionStorage.getItem('owasp_sandbox_prefill');
    if (raw) {
      try {
        const prefill = JSON.parse(raw);
        if (prefill.method) this.form.method = prefill.method;
        if (prefill.url) this.form.url = prefill.url;
        if (prefill.headers) this.headersText = prefill.headers;
      } catch (e) {
        // ignore malformed data
      }
      sessionStorage.removeItem('owasp_sandbox_prefill');
    }
  },
  computed: {
    diagnosis() {
      if (!this.hasRun) {
        return { show: false };
      }
      // 已拦截：对 949110 / 949111 做说明（消除"没开提前拦截为啥也拦了"的困惑）
      if (this.result.interrupted) {
        const rid = this.result.interrupt_rule_id;
        if (rid === 949110) {
          return {
            show: true,
            theme: 'info',
            title: this.$t('page.owasp.sandbox.diag_title_phase2_block'),
            message: this.$t('page.owasp.sandbox.diag_msg_phase2_block'),
          };
        }
        if (rid === 949111) {
          return {
            show: true,
            theme: 'info',
            title: this.$t('page.owasp.sandbox.diag_title_phase1_block'),
            message: this.$t('page.owasp.sandbox.diag_msg_phase1_block'),
          };
        }
        return { show: false };
      }
      const hits = this.result.hits || [];
      if (hits.length === 0) {
        return { show: false };
      }
      const score = this.result.anomaly_score || 0;
      const detection = this.result.detection_score || 0;
      const threshold = this.result.blocking_threshold || 0;
      const blockingPL = this.result.blocking_paranoia || 1;
      // 统计被"检测 PL 命中但未计入拦截分"的规则
      const plOverBlocking = hits.filter((h) => (h.paranoia || 0) > blockingPL).length;

      if (threshold > 0 && score < threshold) {
        const gap = threshold - score;
        return {
          show: true,
          theme: 'warning',
          title: this.$t('page.owasp.sandbox.diag_title_below_threshold'),
          message: this.$t('page.owasp.sandbox.diag_msg_below_threshold', {
            hits: hits.length,
            score,
            detection,
            threshold,
            gap,
            plSplit: blockingPL,
            plOverBlocking,
          }),
        };
      }
      if (plOverBlocking > 0) {
        return {
          show: true,
          theme: 'info',
          title: this.$t('page.owasp.sandbox.diag_title_pl_filtered'),
          message: this.$t('page.owasp.sandbox.diag_msg_pl_filtered', {
            plOverBlocking,
            blockingPL,
          }),
        };
      }
      return { show: false };
    },
    overrideTxVars(): string[] {
      const content = this.overrideDialog.content || '';
      const scoreVars = new Set([
        'inbound_anomaly_score', 'detection_inbound_anomaly_score',
        'blocking_inbound_anomaly_score', 'outbound_anomaly_score',
        'critical_anomaly_score', 'error_anomaly_score', 'warning_anomaly_score', 'notice_anomaly_score',
        'inbound_anomaly_score_pl1', 'inbound_anomaly_score_pl2',
        'inbound_anomaly_score_pl3', 'inbound_anomaly_score_pl4',
      ]);
      const matches = content.match(/%\{tx\.([a-zA-Z_][a-zA-Z0-9_]*)\}/g) || [];
      const vars = new Set<string>();
      for (const m of matches) {
        const name = m.replace('%{tx.', '').replace('}', '');
        if (!scoreVars.has(name)) vars.add(name);
      }
      return Array.from(vars);
    },
  },
  methods: {
    severityTheme(sev: string) {
      const s = (sev || '').toUpperCase();
      if (s === 'CRITICAL') return 'danger';
      if (s === 'ERROR') return 'warning';
      if (s === 'WARNING') return 'primary';
      return 'default';
    },
    severityScore(sev: string): number {
      const s = (sev || '').toUpperCase();
      if (s === 'CRITICAL') return 5;
      if (s === 'ERROR') return 4;
      if (s === 'WARNING') return 3;
      if (s === 'NOTICE') return 2;
      return 0;
    },
    phaseName(p: number): string {
      switch (p) {
        case 1: return this.$t('page.owasp.rules.phase_1');
        case 2: return this.$t('page.owasp.rules.phase_2');
        case 3: return this.$t('page.owasp.rules.phase_3');
        case 4: return this.$t('page.owasp.rules.phase_4');
        case 5: return this.$t('page.owasp.rules.phase_5');
        default: return '-';
      }
    },
    onViewRule(id: number) {
      this.ruleDialog.loading = true;
      this.ruleDialog.title = this.$t('page.owasp.rules.detail_title') + ` (${id})`;
      this.ruleDialog.data = null;
      this.ruleDialog.visible = true;
      owaspRuleDetailApi({ id })
        .then((res) => {
          if (res.code === 0 && res.data && res.data.rule) {
            const rule = res.data.rule;
            const override = res.data.override;
            this.ruleDialog.data = {
              id: rule.id,
              directive: rule.directive || '',
              phase: rule.phase || 0,
              severity: rule.severity || '',
              paranoia: rule.paranoia || 0,
              message: rule.message || '',
              tags: rule.tags || [],
              source_file: rule.file || '',
              content: (override && override.custom_content) ? override.custom_content : rule.raw,
            };
          } else {
            this.$message.warning(res.msg || '加载规则详情失败');
            this.ruleDialog.visible = false;
          }
        })
        .catch(() => {
          this.$message.error('请求规则详情出错');
          this.ruleDialog.visible = false;
        })
        .finally(() => { this.ruleDialog.loading = false; });
    },
    onRuleDialogAi() {
      const f = this.ruleDialog.data;
      if (!f) return;
      const phaseText = f.phase ? `Phase ${f.phase} - ${this.phaseName(f.phase)}` : '-';
      const plText = f.paranoia ? `PL${f.paranoia}` : '未指定（任意 PL 都启用）';
      const tagsText = (f.tags && f.tags.length) ? f.tags.join(', ') : '-';
      this.aiDialog.prompt = [
        '以下是一条来自 OWASP 核心规则集（CRS, Core Rule Set）的 WAF 规则，请用中文解释：',
        '1. 该规则的防护意图是什么？',
        '2. 它在什么场景/条件下会被触发？',
        '3. 可能导致哪些误报场景，管理员应如何调优？',
        '',
        `规则 ID：${f.id}`,
        `指令类型：${f.directive || 'SecRule'}`,
        `执行阶段：${phaseText}`,
        `严重级别：${f.severity || '-'}`,
        `偏执级别：${plText}`,
        `描述（msg）：${f.message || '-'}`,
        `标签：${tagsText}`,
        `所属文件：${f.source_file || '-'}`,
        '',
        '规则原文：',
        f.content || '-',
      ].join('\n');
      this.aiDialog.visible = true;
    },
    confirmSendAi() {
      this.$bus.$emit('sendAi', this.aiDialog.prompt);
      this.aiDialog.visible = false;
    },
    onDisableRule(row: any) {
      this.disableDialog.ruleId = row.id;
      this.disableDialog.sourceFile = row.file || '';
      this.disableDialog.saving = false;
      this.disableDialog.visible = true;
    },
    confirmDisableRule() {
      this.disableDialog.saving = true;
      owaspRuleToggleApi({ id: this.disableDialog.ruleId, disabled: true, source_file: this.disableDialog.sourceFile })
        .then((res: any) => {
          if (res.code === 0) {
            this.disableDialog.visible = false;
            this.$dialog.confirm({
              header: `规则 #${this.disableDialog.ruleId} 已禁用`,
              body: 'WAF 已热重载生效。是否前往「规则列表」查看禁用状态？也可在「变更记录」中查看完整操作历史。',
              confirmBtn: '查看规则列表',
              cancelBtn: '留在沙盒',
              onConfirm: () => { this.$emit('switch-tab', 'rules'); },
            });
          } else {
            this.$message.error(res.msg || '禁用失败');
          }
        })
        .catch(() => { this.$message.error('禁用请求失败'); })
        .finally(() => { this.disableDialog.saving = false; });
    },
    onOverrideRule(row: any) {
      this.overrideDialog.ruleId = row.id;
      this.overrideDialog.sourceFile = row.file || '';
      this.overrideDialog.saving = false;
      this.overrideDialog.loading = true;
      this.overrideDialog.content = '';
      this.overrideDialog.visible = true;
      owaspRuleDetailApi({ id: row.id })
        .then((res: any) => {
          if (res.code === 0 && res.data) {
            const override = res.data.override;
            const rule = res.data.rule;
            this.overrideDialog.content = (override && override.custom_content)
              ? override.custom_content
              : (rule && rule.raw ? rule.raw : '');
          } else {
            this.$message.warning(res.msg || '加载规则内容失败');
          }
        })
        .catch(() => { this.$message.error('加载规则内容失败'); })
        .finally(() => { this.overrideDialog.loading = false; });
    },
    confirmOverrideRule() {
      if (!this.overrideDialog.content.trim()) {
        this.$message.warning('改写内容不能为空');
        return;
      }
      this.overrideDialog.saving = true;
      owaspRuleOverrideApi({
        id: this.overrideDialog.ruleId,
        source_file: this.overrideDialog.sourceFile,
        custom_content: this.overrideDialog.content,
      })
        .then((res: any) => {
          if (res.code === 0) {
            this.overrideDialog.visible = false;
            this.$dialog.confirm({
              header: `规则 #${this.overrideDialog.ruleId} 改写已保存`,
              body: 'WAF 已热重载生效。是否前往「规则列表」查看改写状态？也可在「变更记录」中查看完整操作历史。',
              confirmBtn: '查看规则列表',
              cancelBtn: '留在沙盒',
              onConfirm: () => { this.$emit('switch-tab', 'rules'); },
            });
          } else {
            this.$message.error(res.msg || '保存失败');
          }
        })
        .catch(() => { this.$message.error('保存请求失败'); })
        .finally(() => { this.overrideDialog.saving = false; });
    },
    paranoiaOfRule(row: any): number {
      return row.paranoia || 0;
    },
    isPl2PlusForBlocking(row: any): boolean {
      const pl = row.paranoia || 0;
      const blockingPL = this.result.blocking_paranoia || 1;
      return pl > 0 && pl > blockingPL;
    },
    fillExample() {
      this.form.method = 'POST';
      this.form.url = '/login?next=/admin';
      this.headersText = 'User-Agent: sqlmap/1.7\nContent-Type: application/x-www-form-urlencoded';
      this.form.body = "username=admin' OR 1=1 --&password=any";
    },
    parseHeaders(): Record<string, string> {
      const out: Record<string, string> = {};
      const lines = (this.headersText || '').split(/\r?\n/);
      for (const line of lines) {
        const idx = line.indexOf(':');
        if (idx <= 0) continue;
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim();
        if (k) out[k] = v;
      }
      return out;
    },
    onSubmit() {
      this.loading = true;
      const headers = this.parseHeaders();
      owaspDryRunApi({
        method: this.form.method,
        url: this.form.url,
        headers,
        body: this.form.body,
      })
        .then((res) => {
          if (res.code === 0) {
            this.result = {
              interrupted: false,
              interrupt_rule_id: 0,
              anomaly_score: 0,
              detection_score: 0,
              blocking_threshold: 0,
              blocking_paranoia: 0,
              detection_paranoia: 0,
              hits: [],
              ...(res.data || {}),
            };
            this.hasRun = true;
          } else {
            this.$message.warning(res.msg);
          }
        })
        .finally(() => (this.loading = false));
    },
  },
});
</script>

<style lang="less" scoped>
.rule-id-link {
  color: var(--td-brand-color);
  cursor: pointer;
  font-weight: 500;
  &:hover {
    text-decoration: underline;
  }
}
.score-counted {
  color: var(--td-success-color);
  font-weight: 600;
  cursor: help;
}
.score-not-counted {
  color: var(--td-text-color-placeholder);
  text-decoration: line-through;
  cursor: help;
}
.score-zero {
  color: var(--td-text-color-placeholder);
}
.result-panel {
  background: var(--td-bg-color-container);
  padding: 12px;
  border-radius: 4px;
  min-height: 320px;
}
.result-header {
  margin-bottom: 12px;
}
</style>
