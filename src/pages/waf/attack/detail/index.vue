<template>
  <div class="detail-base">
    <!-- 加载态：避免先亮出空壳再填数据的闪动 -->
    <div v-if="!detailLoaded" class="vd-loading">
      <t-loading size="28px" />
      <span class="vd-loading-text">{{ $t('page.visit_log.detail.loading') }}</span>
    </div>
    <t-alert v-else-if="detailError" theme="error" :message="$t('page.visit_log.detail.load_failed')" />

    <template v-else>
      <!-- 结论横幅：防御动作、命中规则与关键操作先给结论，细节往下展开 -->
      <div class="vd-hero" :class="'vd-hero--' + verdictTheme">
        <div class="vd-hero-top">
          <div class="vd-hero-badge">
            <component :is="verdictIconComp" />
          </div>
          <div class="vd-hero-main">
            <div class="vd-hero-title">
              <span class="vd-verdict-label">{{ $t('page.visit_log.detail.defense_status_step') }}</span>
              <span class="vd-verdict">{{ detail_data.action || '—' }}</span>
              <t-tag v-if="detail_data.rule" class="vd-rule-tag" theme="danger" variant="light"
                :title="detail_data.rule">
                {{ $t('page.visit_log.detail.rule_hit') }} · {{ detail_data.rule }}
              </t-tag>
              <t-tag v-if="detail_data.rule && detail_data.log_only_mode != '0'"
                :theme="detail_data.log_only_mode == '1' ? 'danger' : 'success'" variant="light-outline">
                {{ $t('page.visit_log.log_only_mode') }}：{{ detail_data.log_only_mode == '1'
                  ? $t('page.visit_log.log_only_mode_on') : $t('page.visit_log.log_only_mode_off') }}
              </t-tag>
            </div>
            <div class="vd-hero-sub">
              <span v-if="detail_data.method" class="vd-method">{{ detail_data.method }}</span>
              <span class="vd-host">{{ detail_data.host }}</span>
              <span class="vd-path" :title="detail_data.url">{{ detail_data.url || '/' }}</span>
            </div>
            <div class="vd-hero-meta">
              <span class="vd-meta-item">
                <t-icon name="time" />{{ detail_data.create_time }}
              </span>
              <span v-if="detail_data.shard_name" class="vd-meta-item">
                <t-icon name="folder" />{{ $t('page.visit_log.detail.shard_name') }}：{{ detail_data.shard_name }}
              </span>
              <span class="vd-meta-item vd-uuid">
                <t-icon name="data" />{{ $t('page.visit_log.detail.request_identifier') }}：
                <code>{{ detail_data.req_uuid }}</code>
                <t-tooltip :content="$t('common.copy')">
                  <a class="vd-copy" @click="copyText(detail_data.req_uuid)"><t-icon name="file-copy" /></a>
                </t-tooltip>
              </span>
            </div>
          </div>
          <div class="vd-hero-actions">
            <t-button theme="primary" @click="beforeSendAi">
              <logo-android-icon slot="icon" />
              {{ $t('page.visit_log.detail.ai.log_ai_analysis') }}
            </t-button>
            <t-tooltip :content="$t('page.visit_log.detail.http_copy_mask_tip')">
              <t-button variant="outline" theme="default" @click="loadHttpCopyMask">
                <t-icon name="file-copy" slot="icon" />
                {{ $t('page.visit_log.detail.fp_report') }}
              </t-button>
            </t-tooltip>
            <t-button v-if="isOwaspRule" variant="outline" theme="default" @click="goToOwaspRule">
              {{ $t('page.visit_log.detail.owasp_view_rule') }}
            </t-button>
            <t-button v-if="isOwaspRule" variant="outline" theme="default" @click="goToOwaspSandbox">
              {{ $t('page.visit_log.detail.owasp_sandbox_test') }}
            </t-button>
            <t-button v-if="!isEmbedded" variant="text" theme="default" @click="backPage">
              <t-icon name="backward" slot="icon" />
              {{ $t('common.return') }}
            </t-button>
          </div>
        </div>
        <div v-if="payloadMissing" class="vd-hero-note">
          <t-icon name="info-circle" />
          <span>{{ $t('page.visit_log.detail.payload_missing') }}</span>
        </div>
      </div>

      <!-- 关键指标带 -->
      <div class="vd-kpis">
        <div v-for="k in kpis" :key="k.key" class="vd-kpi" :class="['vd-kpi--' + k.theme, { 'is-colored': k.valueColor }]">
          <div class="vd-kpi-label">{{ k.label }}</div>
          <div class="vd-kpi-value" :title="k.title || k.value">{{ k.value }}</div>
          <div v-if="k.sub" class="vd-kpi-sub" :title="k.sub">{{ k.sub }}</div>
        </div>
      </div>

      <!-- 主体：左报文 / 右上下文 -->
      <div class="vd-grid">
        <div class="vd-col-main">
          <!-- 请求报文 -->
          <div class="vd-card">
            <div class="vd-card-head">
              <span class="vd-card-title">{{ $t('page.visit_log.detail.request_payload') }}</span>
              <span class="vd-card-actions">
                <t-tooltip :content="$t('page.visit_log.detail.mouse_select_tooltip')">
                  <span class="vd-quick-rule">
                    {{ $t('page.visit_log.detail.quick_add_rule') }}
                    <t-switch v-model="quickAddRuleChecked" size="small" />
                  </span>
                </t-tooltip>
              </span>
            </div>
            <div class="vd-card-body">
              <div v-for="f in requestFields" :key="'rq-' + f.key" class="pl-block">
                <div class="pl-head">
                  <span class="pl-label">{{ f.label }}</span>
                  <span class="pl-ops">
                    <span v-if="f.value" class="pl-size">{{ fmtSize(f.value.length) }}</span>
                    <t-link v-if="canExpand(f)" theme="primary" size="small" @click="toggleField(f.key)">
                      {{ expandedMap[f.key] ? $t('page.visit_log.detail.body_show_less')
                        : $t('page.visit_log.detail.body_show_more') }}
                    </t-link>
                    <t-tooltip v-if="f.value" :content="$t('common.copy')">
                      <a class="pl-copy" @click="copyText(f.value)"><t-icon name="file-copy" /></a>
                    </t-tooltip>
                  </span>
                </div>
                <pre v-if="f.value" class="pl-code" :class="{ 'is-expanded': expandedMap[f.key] }"
                  @mouseup="captureSelection(f.key, $event)">{{ displayValue(f) }}</pre>
                <div v-else class="pl-empty">{{ $t('page.visit_log.detail.empty_content') }}</div>
              </div>
            </div>
          </div>

          <!-- 响应信息 -->
          <div class="vd-card">
            <div class="vd-card-head">
              <span class="vd-card-title">{{ $t('page.visit_log.detail.response.response_title') }}</span>
            </div>
            <div class="vd-card-body">
              <div class="pl-block">
                <div class="pl-head">
                  <span class="pl-label">{{ $t('page.visit_log.detail.response.response_status') }}</span>
                </div>
                <div class="pl-status">
                  <t-tag v-if="statusChip" :theme="statusTheme" variant="light">{{ statusChip }}</t-tag>
                  <span v-else class="pl-none">—</span>
                </div>
              </div>
              <div v-for="f in responseFields" :key="'rs-' + f.key" class="pl-block">
                <div class="pl-head">
                  <span class="pl-label">{{ f.label }}</span>
                  <span class="pl-ops">
                    <span v-if="f.value" class="pl-size">{{ fmtSize(f.value.length) }}</span>
                    <t-link v-if="canExpand(f)" theme="primary" size="small" @click="toggleField(f.key)">
                      {{ expandedMap[f.key] ? $t('page.visit_log.detail.body_show_less')
                        : $t('page.visit_log.detail.body_show_more') }}
                    </t-link>
                    <t-tooltip v-if="f.value" :content="$t('common.copy')">
                      <a class="pl-copy" @click="copyText(f.value)"><t-icon name="file-copy" /></a>
                    </t-tooltip>
                  </span>
                </div>
                <pre v-if="f.value" class="pl-code" :class="{ 'is-expanded': expandedMap[f.key] }"
                  @mouseup="captureSelection(f.key, $event)">{{ displayValue(f) }}</pre>
                <div v-else class="pl-empty">{{ $t('page.visit_log.detail.empty_content') }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="vd-col-side">
          <!-- 访问者信息 -->
          <div class="vd-card">
            <div class="vd-card-head">
              <span class="vd-card-title">{{ $t('page.visit_log.detail.visitor_info') }}</span>
            </div>
            <div class="vd-card-body">
              <div class="vd-ip-row">
                <code class="vd-ip">{{ detail_data.src_ip || '—' }}</code>
                <t-button v-if="detail_data.src_ip" size="small" theme="danger" variant="outline"
                  @click="handleAddipblock(detail_data.src_ip)">{{ $t('page.visit_log.detail.add_to_deny_list') }}</t-button>
              </div>
              <div class="vd-ip-sub">
                <span>{{ $t('page.visit_log.detail.visitor_port') }}：{{ detail_data.src_port || '—' }}</span>
                <a class="vd-link" @click="handleIPExtractIssue">{{ $t('page.visit_log.detail.ip_extract_issue') }}</a>
              </div>
              <div v-if="detail_data.src_ip != detail_data.net_src_ip" class="vd-sub-block">
                <div class="vd-sub-label vd-sub-label--warn">{{ $t('page.visit_log.detail.visitor_net_ip') }}</div>
                <div class="vd-ip-row">
                  <code class="vd-ip vd-ip--warn">{{ detail_data.net_src_ip }}</code>
                  <t-button size="small" theme="danger" variant="outline"
                    @click="handleAddipblock(detail_data.net_src_ip)">{{ $t('page.visit_log.detail.add_to_deny_list') }}</t-button>
                </div>
              </div>
              <div v-if="detail_data.is_balance == 1" class="vd-sub-block">
                <div class="vd-sub-label">{{ $t('page.visit_log.detail.balance_info') }}</div>
                <div class="vd-sub-value">{{ detail_data.balance_info }}</div>
              </div>
            </div>
          </div>

          <!-- 防御链路 -->
          <div class="vd-card">
            <div class="vd-card-head">
              <span class="vd-card-title">{{ $t('page.visit_log.detail.defense_status') }}</span>
            </div>
            <div class="vd-card-body">
              <div class="vd-chain">
                <div v-for="(n, i) in chainNodes" :key="'ch-' + i" class="vd-node" :class="'vd-node--' + n.theme">
                  <div class="vd-node-rail">
                    <span class="vd-node-dot"></span>
                    <span v-if="i < chainNodes.length - 1" class="vd-node-line"></span>
                  </div>
                  <div class="vd-node-body">
                    <div class="vd-node-title">{{ n.title }}</div>
                    <div class="vd-node-value" :class="{ 'is-muted': n.muted }" :title="n.value">
                      <t-tag v-if="n.tag" size="small" :theme="n.tag.theme" variant="light">{{ n.tag.text }}</t-tag>
                      <template v-else>{{ n.value }}</template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 耗时构成 -->
          <div class="vd-card">
            <div class="vd-card-head">
              <span class="vd-card-title">{{ $t('page.visit_log.detail.time_cost.title') }}</span>
              <span class="pl-size">{{ $t('page.visit_log.detail.time_cost.total_cost') }} {{ totalCost }}ms</span>
            </div>
            <div class="vd-card-body vd-costs">
              <div v-for="c in costRows" :key="c.key" class="vd-cost">
                <div class="vd-cost-head">
                  <span>{{ c.label }}</span>
                  <b>{{ c.value }}ms</b>
                </div>
                <div class="vd-cost-track">
                  <div class="vd-cost-bar" :class="'vd-cost-bar--' + c.theme" :style="{ width: c.pct + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 快捷加入规则：选中内容后浮出的确认按钮。
         不再用「点击页面空白」这种隐式触发——那个方案会把 AI 分析、误报反馈等
         任何一次点击都吞掉并劫持成跳转；改成显式点击本按钮才跳。 -->
    <button v-if="pendingSel" class="vd-sel-btn"
            :style="{ left: pendingSel.x + 'px', top: pendingSel.y + 'px' }"
            @mousedown.prevent @click="applySelRule">
      <t-icon name="add" />{{ $t('page.visit_log.detail.quick_add_rule_apply') }}
    </button>

    <t-dialog :header="$t('page.visit_log.detail.http_copy_mask')" :visible.sync="httpCopyMaskVisible"
      @confirm="() => { httpCopyMaskVisible = false }" :onCancel="() => { httpCopyMaskVisible = false }">
      <t-alert theme="info" :message="$t('page.visit_log.detail.http_copy_mask_tip')" />
      <t-textarea v-model="httpCopyMask" :autosize="{ minRows: 5, maxRows: 10 }" />
    </t-dialog>

    <t-dialog :header="$t('page.visit_log.detail.ai.before_send_ai')" :visible.sync="httpAiMaskVisible"
      @confirm="handelToAi" :onCancel="() => { httpAiMaskVisible = false }" width="700px">
      <t-alert theme="info" :message="$t('page.visit_log.detail.ai.before_send_ai_tip')" />
      <t-textarea v-model="httpAiMask" :autosize="{ minRows: 5, maxRows: 10 }" />
    </t-dialog>

    <!-- IP提取问题对话框 -->
    <t-dialog :header="$t('page.visit_log.detail.ip_extract_issue')" :visible.sync="ipExtractDialogVisible" :width="800"
      :footer="false">
      <div slot="body">
        <p>{{ $t('page.visit_log.detail.ip_extract_issue_desc') }}</p>

        <!-- 视频教程链接 -->
        <t-alert theme="success" style="margin-bottom: 16px;">
          <template #icon>
            <span style="font-size: 20px;">📺</span>
          </template>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span>{{ $t('page.visit_log.detail.ip_extract_video_tutorial') }}</span>
            <t-button theme="primary" size="small" @click="openVideoTutorial">
              {{ $t('page.visit_log.detail.ip_extract_watch_tutorial') }}
            </t-button>
          </div>
        </t-alert>

        <!-- 常用头信息提示区域 -->
        <t-card :title="$t('page.visit_log.detail.ip_extract_common_headers')" style="margin-bottom: 20px;">
          <p style="margin-bottom: 12px; color: #666;">{{ $t('page.visit_log.detail.ip_extract_common_headers_desc') }}</p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
            <t-button size="small" variant="outline" @click="selectIPHeader('CF-Connecting-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.cloudflare') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('True-Client-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.cloudflare_enterprise') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('X-Forwarded-For')">
              {{ $t('page.visit_log.detail.ip_extract_headers.x_forwarded_for') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('X-Real-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.x_real_ip') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('X-Client-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.x_client_ip') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('Fastly-Client-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.fastly') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('Incap-Client-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.incapsula') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('CF-Connecting-IP,X-Forwarded-For,X-Real-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.multiple') }}
            </t-button>
          </div>
          <t-alert theme="info" :message="$t('page.visit_log.detail.ip_extract_multiple_tips')" style="margin-top: 8px;" />
          <div style="margin-top: 8px; color: #999; font-size: 12px;">
            {{ $t('page.visit_log.detail.ip_extract_example') }}
          </div>
        </t-card>

        <t-form :data="ipExtractFormData" ref="ipExtractForm" :rules="ipExtractRules" @submit="onSubmitIPExtract"
          :labelWidth="150">
          <t-form-item :label="$t('page.systemconfig.label_configuration_item')" name="item">
            <t-input :style="{ width: '600px' }" v-model="ipExtractFormData.item" disabled></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.systemconfig.label_configuration_value')" name="value">
            <t-input :style="{ width: '600px' }" v-model="ipExtractFormData.value"
              :placeholder="$t('page.visit_log.detail.ip_extract_issue_tips')"></t-input>
            <div class="form-item-tips">{{ $t('page.visit_log.detail.ip_extract_issue_tips') }}</div>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="ipExtractDialogVisible = false">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>
  </div>
</template>
<script lang="ts">
import { LogoAndroidIcon, SecuredFilledIcon, ShieldErrorFilledIcon, ErrorTriangleFilledIcon } from 'tdesign-icons-vue';

import { wafIPBlockAddApi } from '@/apis/ipblock';
import { getHeaderCopyDetail, geWebLogDetail } from '@/apis/waflog/attacklog';
import { get_detail_by_item_api, edit_system_config_api } from '@/apis/systemconfig';

// 可映射到规则引擎请求侧字段的报文块，必须与规则编辑页 setRuleContentByMode 的 case 一一对应：
// url/header/user_agent/cookies/body 是同名字段；post_form 在规则编辑页映射到 POST_FORM。
// 响应侧（res_header / res_body）在请求检测字段里没有对应物，不能进快捷加规则流程。
const QUICK_RULE_FIELDS = ['url', 'header', 'user_agent', 'cookies', 'body', 'post_form'];

export default {
  name: 'WafAttackLogDetail',
  components: {
    LogoAndroidIcon,
    SecuredFilledIcon,
    ShieldErrorFilledIcon,
    ErrorTriangleFilledIcon,
  },
  props: {
    prop_req_uuid: {
      type: String,
      default: '',
    },
    prop_current_db: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      detail_data: {} as any,
      detailLoaded: false, // 详情已返回（payloadMissing 提示要等数据回来再判断）
      detailError: false,
      quickAddRuleChecked: false,
      // 各报文块的展开状态：>300 字符的块默认折叠，逐块展开
      expandedMap: {
        url: false,
        header: false,
        user_agent: false,
        cookies: false,
        body: false,
        post_form: false,
        res_header: false,
        res_body: false,
      } as Record<string, boolean>,
      pendingSel: null as any, // 快捷加入规则：选中待用的文本 + 来源块
      detail_req: {
        req_uuid: '',
        current_db: '',
      },
      httpCopyMask: '',
      httpCopyMaskVisible: false,
      httpAiMask: '',
      httpAiMaskVisible: false,
      ipExtractDialogVisible: false,
      ipExtractFormData: {
        item: 'gwaf_proxy_header',
        value: '',
        remarks: '获取访客IP头信息（按照顺序）',
      },
      ipExtractRules: {
        item: [{ required: true, message: this.$t('page.systemconfig.label_configuration_item'), type: 'error' }],
        value: [{ required: false, message: this.$t('page.systemconfig.label_configuration_value'), type: 'error' }],
      },
    };
  },
  computed: {
    // 弹窗内嵌场景：由父组件传 prop_req_uuid
    isEmbedded(): boolean {
      return !!this.prop_req_uuid;
    },
    // 报文列全空 = 这条没有报文行：正常请求默认只记访问行，
    // 采样命中或观察名单内的请求才有报文（user_agent/url 是窄行字段，不算报文）
    payloadMissing(): boolean {
      if (!this.detailLoaded) return false;
      const d = this.detail_data || {};
      return !d.header && !d.cookies && !d.body && !d.post_form && !d.res_header && !d.res_body;
    },
    isOwaspRule(): boolean {
      const rule = this.detail_data.rule || '';
      return rule.startsWith('OWASP:');
    },
    owaspRuleId(): string {
      const rule = this.detail_data.rule || '';
      const m = rule.match(/^OWASP:(\d+)/);
      return m ? m[1] : '';
    },
    // 防御动作 → 语义色
    verdictTheme(): string {
      const a = this.detail_data.action || '';
      if (a.indexOf('放行') > -1) return 'success';
      if (a.indexOf('阻止') > -1 || a.indexOf('禁止') > -1 || a.indexOf('拦截') > -1) return 'error';
      if (a) return 'warning';
      return 'brand';
    },
    verdictTagTheme(): string {
      const t = this.verdictTheme;
      return t === 'error' ? 'danger' : t;
    },
    verdictIconComp(): string {
      if (this.verdictTheme === 'success') return 'SecuredFilledIcon';
      if (this.verdictTheme === 'error') return 'ShieldErrorFilledIcon';
      return 'ErrorTriangleFilledIcon';
    },
    // 响应状态文案：后端 status 如 "200 OK" / 403 等
    statusChip(): string {
      const d = this.detail_data;
      if (d.status) return String(d.status);
      if (d.status_code) return String(d.status_code);
      return '';
    },
    statusTheme(): string {
      const code = Number(this.detail_data.status_code) || 0;
      if (code >= 400) return 'danger';
      if (code >= 300) return 'warning';
      if (code > 0) return 'success';
      return 'default';
    },
    totalCost(): number {
      const d = this.detail_data;
      return (Number(d.pre_check_cost) || 0) + (Number(d.forward_cost) || 0) + (Number(d.backend_check_cost) || 0);
    },
    // 关键指标带
    kpis(): any[] {
      const d = this.detail_data;
      const region = [d.country, d.province, d.city].filter(Boolean).join(' ') || '—';
      const len = Number(d.content_length) || 0;
      return [
        {
          key: 'action',
          label: this.$t('page.visit_log.detail.defense_status_step'),
          value: d.action || '—',
          theme: this.verdictTheme,
          valueColor: true,
        },
        {
          key: 'status',
          label: this.$t('page.visit_log.response_code'),
          value: d.status_code ? String(d.status_code) : '—',
          sub: d.status || '',
          theme: this.statusTheme === 'default' ? 'brand' : this.statusTheme,
          valueColor: true,
        },
        {
          key: 'method',
          label: this.$t('page.visit_log.detail.request_method'),
          value: d.method || '—',
          theme: 'brand',
        },
        {
          key: 'size',
          label: this.$t('page.visit_log.detail.request_content_size'),
          value: this.fmtSize(len),
          title: `${len  } bytes`,
          theme: 'brand',
        },
        {
          key: 'cost',
          label: this.$t('page.visit_log.detail.time_cost.total_cost'),
          value: `${this.totalCost  } ms`,
          theme: 'brand',
        },
        {
          key: 'region',
          label: this.$t('page.visit_log.detail.request_region'),
          value: region,
          title: region,
          theme: 'brand',
        },
      ];
    },
    // 耗时构成：条形按占比，总量为 0 时全部收起
    costRows(): any[] {
      const d = this.detail_data;
      const total = this.totalCost;
      const pct = (v: number) => (total > 0 ? Math.max((v / total) * 100, v > 0 ? 4 : 0) : 0);
      const pre = Number(d.pre_check_cost) || 0;
      const fwd = Number(d.forward_cost) || 0;
      const bk = Number(d.backend_check_cost) || 0;
      return [
        {
          key: 'pre',
          label: this.$t('page.visit_log.detail.time_cost.pre_check_cost'),
          value: pre,
          pct: pct(pre),
          theme: 'brand',
        },
        {
          key: 'fwd',
          label: this.$t('page.visit_log.detail.time_cost.forward_cost'),
          value: fwd,
          pct: pct(fwd),
          theme: 'cyan',
        },
        {
          key: 'bk',
          label: this.$t('page.visit_log.detail.time_cost.backend_check_cost'),
          value: bk,
          pct: pct(bk),
          theme: 'purple',
        },
      ];
    },
    // 防御链路：访问 → 检测 → 防御 → 响应
    chainNodes(): any[] {
      const d = this.detail_data;
      return [
        {
          title: this.$t('page.visit_log.detail.visit_time'),
          value: d.create_time || '—',
          theme: 'brand',
        },
        {
          title: this.$t('page.visit_log.detail.detection_time'),
          value: d.rule ? `${this.$t('page.visit_log.detail.rule_hit')}：${d.rule}` : this.$t('page.visit_log.detail.not_hit'),
          muted: !d.rule,
          theme: d.rule ? 'error' : 'success',
        },
        {
          title: this.$t('page.visit_log.detail.defense_status_step'),
          tag: { text: d.action || '—', theme: this.verdictTagTheme },
          theme: this.verdictTheme,
        },
        {
          title: this.$t('page.visit_log.detail.response_status'),
          value: this.statusChip || '—',
          muted: !this.statusChip,
          theme: this.statusTheme,
        },
      ];
    },
    requestFields(): any[] {
      const d = this.detail_data;
      return [
        { key: 'url', label: this.$t('page.visit_log.detail.request_path'), value: d.url || '' },
        { key: 'header', label: this.$t('page.visit_log.detail.request_header'), value: d.header || '' },
        { key: 'user_agent', label: this.$t('page.visit_log.detail.request_user_browser'), value: d.user_agent || '' },
        { key: 'cookies', label: this.$t('page.visit_log.detail.request_cookies'), value: d.cookies || '' },
        { key: 'body', label: this.$t('page.visit_log.detail.request_body'), value: d.body || '' },
        { key: 'post_form', label: this.$t('page.visit_log.detail.request_form'), value: d.post_form || '' },
      ];
    },
    responseFields(): any[] {
      const d = this.detail_data;
      return [
        { key: 'res_header', label: this.$t('page.visit_log.detail.response.response_header'), value: d.res_header || '' },
        { key: 'res_body', label: this.$t('page.visit_log.detail.response.response_body'), value: d.res_body || '' },
      ];
    },
  },
  watch: {
    '$route.query.req_uuid': function reqUuidChanged(newVal) {
      if (newVal !== undefined) {
        this.getDetail(newVal);
      }
    },
    prop_req_uuid(newVal) {
      if (newVal !== undefined) {
        this.getDetail(`${newVal}#${this.prop_current_db}`);
      }
    },
    quickAddRuleChecked(v) {
      if (!v) {
        this.pendingSel = null;
      }
    },
  },
  mounted() {
    // 快捷加入规则：选区被取消（点别处 / 拖拽取消）或页面滚动时，收起浮出的确认按钮
    document.addEventListener('selectionchange', this.onSelectionChange);
    document.addEventListener('scroll', this.dismissSel, true);
    const target = this.prop_req_uuid ? `${this.prop_req_uuid}#${this.prop_current_db}` : this.$route.query.req_uuid;
    this.getDetail(target);
  },
  beforeDestroy() {
    document.removeEventListener('selectionchange', this.onSelectionChange);
    document.removeEventListener('scroll', this.dismissSel, true);
  },
  methods: {
    goToOwaspRule() {
      this.$router.push({
        path: '/sys/OwaspManage',
        query: { tab: 'rules', rule_id: this.owaspRuleId },
      });
    },
    goToOwaspSandbox() {
      const d = this.detail_data as any;
      sessionStorage.setItem('owasp_sandbox_prefill', JSON.stringify({
        method: d.method || 'GET',
        url: d.url || '/',
        headers: d.header || '',
      }));
      this.$router.push({
        path: '/sys/OwaspManage',
        query: { tab: 'sandbox' },
      });
    },
    handleIPExtractIssue() {
      this.ipExtractDialogVisible = true;
      // 获取当前配置
      get_detail_by_item_api({ item: 'gwaf_proxy_header' }).then((res) => {
        if (res.code === 0 && res.data) {
          this.ipExtractFormData = res.data;
        }
      }).catch(() => {
        // 失败提示由请求层统一处理，这里不重复打扰
      });
    },
    onSubmitIPExtract({ validateResult }) {
      if (validateResult === true) {
        edit_system_config_api(this.ipExtractFormData).then((res) => {
          if (res.code === 0) {
            this.$message.success(res.msg);
            this.ipExtractDialogVisible = false;
          } else {
            this.$message.error(res.msg);
          }
        }).catch((err) => {
          this.$message.error(err.message);
        });
      }
    },
    // 快捷选择IP头信息
    selectIPHeader(headerValue) {
      this.ipExtractFormData.value = headerValue;
      this.$message.success(`已选择: ${headerValue}`);
    },
    // 打开视频教程
    openVideoTutorial() {
      window.open('https://www.bilibili.com/video/BV1pn8Ez2ELQ/', '_blank', 'noopener,noreferrer');
    },
    handelToAi() {
      // 日志详情走"安全风险分析"提示词
      this.$bus.$emit('sendAi', { q: this.httpAiMask, scene: 'security_log' });
      this.httpAiMaskVisible = false;
    },
    beforeSendAi() {
      this.httpAiMask = '';
      getHeaderCopyDetail({
        REQ_UUID: this.detail_req.req_uuid,
        current_db_name: this.detail_req.current_db,
        output_format: 'raw',
      })
        .then((res) => {
          if (res.code === 0) {
            this.httpAiMask = res.data;
            this.httpAiMaskVisible = true;
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
    },
    loadHttpCopyMask() {
      getHeaderCopyDetail({
        REQ_UUID: this.detail_req.req_uuid,
        current_db_name: this.detail_req.current_db,
        output_format: 'curl',
      })
        .then((res) => {
          if (res.code === 0) {
            this.httpCopyMask = res.data;
            this.httpCopyMaskVisible = true;
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
    },
    backPage() {
      window.history.go(-1);
    },
    getDetail(uuid_and_name) {
      if (!uuid_and_name) {
        return;
      }
      const arr = String(uuid_and_name).split('#');
      const id = arr[0];
      const current_db_name = arr[1];

      this.detail_req.req_uuid = id;
      this.detail_req.current_db = current_db_name;
      this.detailLoaded = false;
      this.detailError = false;
      this.pendingSel = null;
      this.expandedMap = {
        url: false,
        header: false,
        user_agent: false,
        cookies: false,
        body: false,
        post_form: false,
        res_header: false,
        res_body: false,
      };
      geWebLogDetail({
        REQ_UUID: id,
        current_db_name,
      })
        .then((res) => {
          if (res.code === 0) {
            this.detail_data = res.data || {};
            this.detailLoaded = true;
          } else {
            this.detailError = true;
            this.detailLoaded = true;
          }
        })
        .catch((e: Error) => {
          console.log(e);
          this.detailError = true;
          this.detailLoaded = true;
        });
    },
    handleAddipblock(ip) {
      if (this.detail_data.host_code === '') {
        this.$message.warning(this.$t('page.visit_log.detail.website_not_exist_warning'));
        return;
      }
      const confirmDia = this.$dialog.confirm({
        header: this.$t('page.visit_log.detail.add_to_deny_list_confirm_header'),
        body: this.$t('page.visit_log.detail.add_to_deny_list_confirm_body'),
        confirmBtn: this.$t('common.confirm'),
        cancelBtn: this.$t('common.cancel'),
        onConfirm: () => {
          wafIPBlockAddApi({
            host_code: this.detail_data.host_code,
            ip,
            remarks: '手工增加',
          })
            .then((res) => {
              if (res.code === 0) {
                this.$message.success(res.msg);
              } else {
                this.$message.warning(res.msg);
              }
            })
            .catch((e: Error) => {
              console.log(e);
            });
          confirmDia.destroy();
        },
        onClose: () => {
          confirmDia.hide();
        },
      });
    },
    // ===== 报文查看辅助 =====
    fmtSize(n) {
      const v = Number(n) || 0;
      if (v < 1024) return `${v  } B`;
      if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)  } KB`;
      return `${(v / (1024 * 1024)).toFixed(1)  } MB`;
    },
    canExpand(f) {
      return (f.value || '').length > 300;
    },
    displayValue(f) {
      const v = f.value || '';
      if (this.expandedMap[f.key] || v.length <= 300) return v;
      return `${v.slice(0, 300)  } …`;
    },
    toggleField(key) {
      this.$set(this.expandedMap, key, !this.expandedMap[key]);
    },
    copyText(text) {
      const t = String(text || '');
      if (!t) return;
      this.$copyText(t).then(() => {
        this.$message.success(this.$t('page.visit_log.detail.copied'));
      }).catch(() => {
        this.$message.error(this.$t('page.visit_log.detail.copy_failed'));
      });
    },
    // ===== 快捷加入规则：选中文本 → 选区旁浮出「加入规则」按钮 =====
    captureSelection(sourcePoint, e) {
      // 不在可映射白名单里的报文块（如响应报文）不提供入口：选中只当普通复制，
      // 顺带清掉可能残留的按钮（选区已经换到了别的块）
      if (QUICK_RULE_FIELDS.indexOf(sourcePoint) < 0 || !this.quickAddRuleChecked) {
        this.pendingSel = null;
        return;
      }
      const sel = window.getSelection ? window.getSelection() : null;
      const text = sel ? sel.toString() : '';
      if (!text) {
        // 同一块里的空 mouseup（点一下取消选择）也要收起按钮
        this.pendingSel = null;
        return;
      }
      const x = Math.min((e && e.clientX ? e.clientX : 0) + 10, window.innerWidth - 132);
      const y = Math.min((e && e.clientY ? e.clientY : 0) + 16, window.innerHeight - 46);
      this.pendingSel = { text, sourcePoint, x, y };
    },
    /** 选区被取消（点别处、拖拽取消）时收起浮出按钮 */
    onSelectionChange() {
      const sel = window.getSelection ? window.getSelection() : null;
      const hasText = sel && !sel.isCollapsed && String(sel.toString()).length > 0;
      if (!hasText && this.pendingSel) {
        this.pendingSel = null;
      }
    },
    dismissSel() {
      if (this.pendingSel) {
        this.pendingSel = null;
      }
    },
    /** 点击浮出按钮：带选中文本跳到规则编辑器 */
    applySelRule() {
      if (!this.pendingSel) return;
      const { text, sourcePoint } = this.pendingSel;
      this.pendingSel = null;
      this.$router.push({
        path: '/waf-host/wafruleedit',
        query: {
          type: 'add',
          host_code: this.detail_data.host_code,
          contentstr: text,
          is_manual_rule: 1,
          sourcePoint,
        },
      });
    },
  },
};
</script>
<style lang="less" scoped>
@import './index';
</style>
