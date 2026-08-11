<template>
  <span class="ip-lookup">
    <t-button v-if="!hideTrigger" :theme="theme" :variant="variant" :size="size" @click="open()">
      <template #icon><search-icon /></template>
      {{ triggerText || $t('common.ip_lookup.title') }}
    </t-button>

    <!-- attach="body" + 更高的 z-index：这个弹窗经常是从别的弹窗里(查看IP列表)点开的，
         不挂到 body 会被父弹窗的层叠上下文困住——表现为弹窗跑到后面、遮罩只盖住半个屏幕 -->
    <t-dialog
      :header="$t('common.ip_lookup.title')"
      :visible.sync="visible"
      :width="720"
      :footer="false"
      attach="body"
      :z-index="zIndex"
      destroy-on-close
      @closed="onClosed"
    >
      <div slot="body" class="ipl-body">
        <div class="ipl-search">
          <t-input
            v-model="ip"
            class="ipl-input"
            clearable
            :placeholder="$t('common.ip_lookup.placeholder')"
            @enter="doQuery"
          />
          <t-button theme="primary" :loading="loading" @click="doQuery">
            {{ $t('common.search') }}
          </t-button>
        </div>
        <div class="ipl-tip">{{ $t('common.ip_lookup.scope_tip') }}</div>

        <!-- 分批查询的进度：慢的那批(威胁情报)不该挡住快的先出结果，
             所以这里显示每一批的状态，而不是整页转圈 -->
        <div v-if="loading || partialDone" class="ipl-progress">
          <div
            v-for="g in groups"
            :key="g.key"
            class="ipl-step"
            :class="'is-' + (groupState[g.key] || 'wait')"
          >
            <loading-icon v-if="groupState[g.key] === 'doing'" class="ipl-step-ico" />
            <check-circle-filled-icon v-else-if="groupState[g.key] === 'done'" class="ipl-step-ico" />
            <error-circle-filled-icon v-else-if="groupState[g.key] === 'fail'" class="ipl-step-ico" />
            <span v-else class="ipl-step-dot"></span>
            <span>{{ g.label }}</span>
          </div>
        </div>

        <div>
          <!-- 还没查过：给一块空白引导，不要一上来就显示「未命中」误导用户 -->
          <div v-if="!queried" class="ipl-empty">{{ $t('common.ip_lookup.idle') }}</div>

          <div v-else class="ipl-result">
            <div class="ipl-head">
              <span class="ipl-ip">{{ result.ip }}</span>
              <t-tag v-if="result.location" theme="default" variant="light" size="small">{{ result.location }}</t-tag>
              <span class="ipl-spacer"></span>
              <t-tag v-if="!result.hits.length" theme="success" variant="light">
                {{ $t('common.ip_lookup.no_hit') }}
              </t-tag>
              <t-tag v-else :theme="verdict.theme" variant="light">{{ verdict.text }}</t-tag>
            </div>

            <!-- 输入的是网段/区间时，明说实际查的是哪个IP，不闷声换个东西查 -->
            <div v-if="result.query_note" class="ipl-note">{{ result.query_note }}</div>

            <!-- 有源查失败时必须说出来：否则「没查到」会被当成「不在名单里」 -->
            <t-alert
              v-if="result.degraded && result.degraded.length"
              theme="warning"
              size="small"
              :message="$t('common.ip_lookup.degraded') + degradedNames"
              :style="{ marginTop: '8px' }"
            />

            <div v-if="!result.hits.length" class="ipl-none">
              {{ $t('common.ip_lookup.no_hit_tip') }}
            </div>

            <div v-else class="ipl-hits">
              <div v-for="(hit, idx) in result.hits" :key="idx" class="ipl-hit" :class="'is-' + hit.effect">
                <div class="ipl-hit-main">
                  <t-tag :theme="effectTheme(hit.effect)" variant="light" size="small">{{ hit.source_name }}</t-tag>
                  <span class="ipl-scope">{{ hit.scope }}</span>
                  <code v-if="hit.matched" class="ipl-matched">{{ hit.matched }}</code>
                  <span class="ipl-spacer"></span>
                  <span class="ipl-effect">{{ effectText(hit.effect) }}</span>
                </div>
                <div v-if="hit.detail" class="ipl-detail">{{ hit.detail }}</div>
              </div>
            </div>

            <!-- 加白/加黑都收在这儿，不再散在各个列表里 -->
            <div v-if="canAllow || canBlock" class="ipl-allow">
              <div v-if="!actionMode" class="ipl-allow-bar">
                <span class="ipl-allow-hint">{{ actionHint }}</span>
                <span class="ipl-spacer"></span>
                <t-button v-if="canAllow" theme="primary" variant="outline" size="small" @click="openActionForm('allow')">
                  {{ $t('common.ip_lookup.allow_btn') }}
                </t-button>
                <t-button v-if="canBlock" theme="danger" variant="outline" size="small" @click="openActionForm('block')">
                  {{ $t('common.ip_lookup.block_btn') }}
                </t-button>
              </div>

              <div v-else class="ipl-allow-form">
                <div class="ipl-allow-title">
                  {{ isBlockMode ? $t('common.ip_lookup.block_btn') : $t('common.ip_lookup.allow_btn') }}
                </div>

                <!-- 系统防火墙层是内核直接丢包，WAF 白名单根本轮不到判定。
                     这时候必须说清楚，否则用户加完白以为通了，实际还是连不上 -->
                <t-alert
                  v-if="!isBlockMode && systemLayerBlocked"
                  theme="warning"
                  size="small"
                  :style="{ marginBottom: '12px' }"
                >
                  <template #message>
                    <div>{{ $t('common.ip_lookup.system_layer_warn') }}</div>
                    <div class="ipl-warn-list">{{ systemLayerText }}</div>
                    <div class="ipl-warn-list">{{ $t('common.ip_lookup.system_layer_hint') }}</div>
                  </template>
                </t-alert>

                <t-form :data="allowForm" label-width="72px" colon>
                  <t-form-item :label="$t('common.ip_lookup.allow_host')">
                    <t-select
                      v-model="allowForm.host_code"
                      :style="{ width: '100%' }"
                      :loading="hostLoading"
                      filterable
                    >
                      <t-option v-for="(name, code) in hostDic" :key="code" :value="code" :label="name" />
                    </t-select>
                  </t-form-item>
                  <t-form-item v-if="isBlockMode" :label="$t('common.ip_lookup.block_layer')">
                    <t-select v-model="allowForm.target_layer" :style="{ width: '100%' }">
                      <t-option value="waf" :label="$t('common.ip_lookup.layer_waf')" />
                      <t-option value="system" :label="$t('common.ip_lookup.layer_system')" />
                      <t-option value="both" :label="$t('common.ip_lookup.layer_both')" />
                    </t-select>
                  </t-form-item>
                  <t-form-item :label="isBlockMode ? $t('common.ip_lookup.block_reason') : $t('common.ip_lookup.allow_reason')">
                    <t-textarea
                      v-model="allowForm.remarks"
                      :autosize="{ minRows: 2, maxRows: 4 }"
                      :placeholder="$t('common.ip_lookup.allow_reason_placeholder')"
                    />
                  </t-form-item>
                </t-form>

                <div class="ipl-allow-ops">
                  <t-button variant="outline" size="small" @click="actionMode = ''">
                    {{ $t('common.cancel') }}
                  </t-button>
                  <t-button
                    :theme="isBlockMode ? 'danger' : 'primary'"
                    size="small"
                    :loading="allowLoading"
                    @click="doAction"
                  >
                    {{ $t('common.confirm') }}
                  </t-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </t-dialog>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  SearchIcon,
  LoadingIcon,
  CheckCircleFilledIcon,
  ErrorCircleFilledIcon,
} from 'tdesign-icons-vue';
import { wafIPLookupApi } from '@/apis/iplookup';
import { wafIPWhiteAddApi } from '@/apis/ipwhite';
import { wafIPBlockAddApi } from '@/apis/ipblock';
import { allhost } from '@/apis/host';

// 全局站点在库里就是一条 host="全局网站"、port=0 的普通记录，code 是 uuid。
// 全站其它页面(anticc / host / SpiderActive)也是按这个字面量认的，保持一致。
const GLOBAL_HOST_NAME = '全局网站:0';

export default Vue.extend({
  name: 'IpLookup',
  components: { SearchIcon, LoadingIcon, CheckCircleFilledIcon, ErrorCircleFilledIcon },
  props: {
    // 预填的 IP，比如从日志某一行点进来
    value: { type: String, default: '' },
    // 只想用 ref 调 open() 时把按钮藏掉
    hideTrigger: { type: Boolean, default: false },
    triggerText: { type: String, default: '' },
    theme: { type: String, default: 'default' },
    variant: { type: String, default: 'outline' },
    size: { type: String, default: 'small' },
    // TDesign 弹窗默认 2500，这里取更高的值好压住把它调起来的那个弹窗
    zIndex: { type: Number, default: 3500 },
  },
  data() {
    return {
      visible: false,
      loading: false,
      queried: false,
      // 每批的状态: wait / doing / done / fail
      groupState: {},
      partialDone: false,
      ip: '',
      result: { ip: '', location: '', query_note: '', hits: [], degraded: [] },
      hostDic: {},
      hostLoading: false,
      // 全局网站在库里是一条普通站点记录，code 是 uuid。
      // global.GWAF_GLOBAL_HOST_CODE 那个 "0" 是引擎路由表的 key，不是数据库 code，
      // 直接拿 "0" 提交会存出一条不属于任何站点的死数据
      globalHostCode: '',
      // '' = 只显示按钮；'allow'/'block' = 展开对应表单
      actionMode: '',
      allowLoading: false,
      allowForm: { host_code: '', remarks: '', target_layer: 'waf' },
    };
  },
  computed: {
    // 分批依据是「快慢」而不是「业务分类」：名单类查库几十毫秒，
    // 威胁情报要编译十万条的大集合，放一批里会被拖死
    groups() {
      return [
        { key: 'list', label: this.$t('common.ip_lookup.step_list'), sources: ['ip_white', 'ip_black', 'ip_group'] },
        { key: 'ban', label: this.$t('common.ip_lookup.step_ban'), sources: ['ip_failure', 'cc_ban', 'firewall'] },
        { key: 'threat', label: this.$t('common.ip_lookup.step_threat'), sources: ['threat_ip'] },
        { key: 'cdn', label: this.$t('common.ip_lookup.step_cdn'), sources: ['cdn'] },
      ];
    },
    // 一堆命中里用户最想先知道的是「到底放行还是拦截」，白名单优先于黑名单
    verdict() {
      const hits = this.result.hits || [];
      const allowed = hits.some((h) => h.effect === 'allow');
      // 白名单只在 WAF 层生效。系统防火墙那层还拦着的时候不能报「会被放行」，
      // 否则用户刚加完白看到绿字，实际还是连不上
      if (allowed && this.systemLayerBlocked) {
        return { theme: 'warning', text: this.$t('common.ip_lookup.verdict_partial') };
      }
      if (allowed) {
        return { theme: 'success', text: this.$t('common.ip_lookup.verdict_allow') };
      }
      if (hits.some((h) => h.effect === 'block')) {
        return { theme: 'danger', text: this.$t('common.ip_lookup.verdict_block') };
      }
      return { theme: 'warning', text: this.$t('common.ip_lookup.verdict_none') };
    },
    degradedNames() {
      return (this.result.degraded || []).map((s) => this.sourceName(s)).join('、');
    },
    isBlockMode() {
      return this.actionMode === 'block';
    },
    // 已经在白名单里就别再让加一条重的
    canAllow() {
      const hits = this.result.hits || [];
      return hits.some((h) => h.effect === 'block') && !hits.some((h) => h.effect === 'allow');
    },
    // 已经在黑名单里就没必要再加；已在白名单里也不给加黑，避免造出自相矛盾的两条
    canBlock() {
      const hits = this.result.hits || [];
      return !hits.some((h) => h.source === 'ip_black') && !hits.some((h) => h.effect === 'allow');
    },
    actionHint() {
      if (this.canAllow) return this.$t('common.ip_lookup.allow_hint');
      return this.$t('common.ip_lookup.block_hint');
    },
    // 落到系统防火墙的拦截：内核层直接丢包，WAF 白名单管不着。
    // 用后端给的结构化标记，不解析 detail 文案——文案一改判断就静默失效
    systemLayerHits() {
      return (this.result.hits || []).filter((h) => h.system_layer && h.effect === 'block');
    },
    systemLayerBlocked() {
      return this.systemLayerHits.length > 0;
    },
    systemLayerText() {
      return this.systemLayerHits.map((h) => `${h.source_name}｜${h.scope}`).join('；');
    },
  },
  watch: {
    value(v) {
      if (v) this.ip = v;
    },
  },
  methods: {
    open(ip) {
      this.ip = ip || this.value || '';
      this.queried = false;
      this.actionMode = '';
      this.result = { ip: '', location: '', query_note: '', hits: [], degraded: [] };
      this.visible = true;
      // 带着 IP 进来的（从日志点过来）直接出结果，不用再点一次查询
      if (this.ip) this.$nextTick(this.doQuery);
    },
    onClosed() {
      this.loading = false;
    },
    // 按来源分批并发查：名单类和缓存类几十毫秒就回来了，
    // 威胁情报/CDN 要编译大集合，慢的那批不该挡住快的先出结果
    doQuery() {
      const ip = (this.ip || '').trim();
      if (!ip) {
        this.$message.warning(this.$t('common.ip_lookup.placeholder'));
        return;
      }

      this.loading = true;
      this.partialDone = false;
      this.result = { ip, location: '', query_note: '', hits: [], degraded: [] };
      const state = {};
      this.groups.forEach((g) => {
        state[g.key] = 'doing';
      });
      this.groupState = state;

      const tasks = this.groups.map((g) =>
        wafIPLookupApi({ ip, sources: g.sources.join(',') })
          .then((res) => {
            if (res.code !== 0) {
              this.$set(this.groupState, g.key, 'fail');
              // 整批失败要计入 degraded，否则「没查到」会被当成「不在名单里」
              this.result.degraded = this.result.degraded.concat(g.sources);
              return;
            }
            const d = res.data || {};
            if (d.ip) this.result.ip = d.ip;
            if (d.query_note && !this.result.query_note) this.result.query_note = d.query_note;
            if (d.location && !this.result.location) this.result.location = d.location;
            this.result.hits = this.result.hits.concat(d.hits || []);
            this.result.degraded = this.result.degraded.concat(d.degraded || []);
            this.$set(this.groupState, g.key, 'done');
            // 每批回来就先渲染，用户能立刻看到已完成部分
            this.queried = true;
            this.partialDone = true;
          })
          .catch(() => {
            this.$set(this.groupState, g.key, 'fail');
            this.result.degraded = this.result.degraded.concat(g.sources);
          }),
      );

      Promise.all(tasks).finally(() => {
        this.loading = false;
        this.queried = true;
        // 白名单排前面，结论一眼可见
        const order = { allow: 0, block: 1, none: 2 };
        this.result.hits.sort((a, b) => (order[a.effect] ?? 9) - (order[b.effect] ?? 9));
        // 全部完成后进度条收起来，别一直占着地方
        setTimeout(() => {
          if (!this.loading) this.partialDone = false;
        }, 600);
      });
    },
    effectTheme(effect) {
      if (effect === 'allow') return 'success';
      if (effect === 'block') return 'danger';
      return 'warning';
    },
    effectText(effect) {
      if (effect === 'allow') return this.$t('common.ip_lookup.effect_allow');
      if (effect === 'block') return this.$t('common.ip_lookup.effect_block');
      return this.$t('common.ip_lookup.effect_none');
    },
    sourceName(code) {
      return this.$t('common.ip_lookup.source.' + code);
    },
    openActionForm(mode) {
      this.actionMode = mode;
      this.allowForm = {
        host_code: this.globalHostCode,
        remarks: this.buildReason(mode),
        target_layer: 'waf',
      };
      this.loadHostDic();
    },
    // 原因预填成「为什么这么做」，用户改一下就能存，比留空强——
    // 三个月后翻名单时最难受的就是不知道当初为什么加的
    buildReason(mode) {
      const date = new Date();
      const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (mode === 'block') {
        return this.$t('common.ip_lookup.block_reason_tpl', { date: day, ip: this.result.ip });
      }
      const hits = (this.result.hits || []).filter((h) => h.effect === 'block');
      const from = hits.map((h) => `${h.source_name}${h.scope ? '(' + h.scope + ')' : ''}`).join('、');
      return this.$t('common.ip_lookup.allow_reason_tpl', { date: day, from: from || '-' });
    },
    loadHostDic() {
      if (Object.keys(this.hostDic).length) {
        if (!this.allowForm.host_code) this.allowForm.host_code = this.globalHostCode;
        return;
      }
      this.hostLoading = true;
      allhost({})
        .then((res) => {
          if (res.code !== 0) return;
          const dic = {};
          let globalCode = '';
          (res.data || []).forEach((item) => {
            dic[item.value] = item.label;
            // 全局站点认 pre_host（域名:端口），它就是引擎里的 GWAF_GLOBAL_HOST_NAME。
            // 认 label 不行：label 会被昵称/备注拼进去
            if (item.pre_host === GLOBAL_HOST_NAME) globalCode = item.value;
          });
          this.hostDic = dic;
          this.globalHostCode = globalCode;
          // 默认落在全局站点；万一没找到就留空，让用户自己选，不瞎猜一个
          if (!this.allowForm.host_code) this.allowForm.host_code = globalCode;
        })
        .finally(() => {
          this.hostLoading = false;
        });
    },
    doAction() {
      const remarks = (this.allowForm.remarks || '').trim();
      if (!remarks) {
        this.$message.warning(this.$t('common.ip_lookup.allow_reason_required'));
        return;
      }
      if (!this.allowForm.host_code) {
        this.$message.warning(this.$t('common.ip_lookup.allow_host_required'));
        return;
      }

      const block = this.isBlockMode;
      const payload = {
        host_code: this.allowForm.host_code,
        ip: this.result.ip,
        remarks,
        ip_type: 'ip',
        group_code: '',
      };
      if (block) payload.target_layer = this.allowForm.target_layer;

      this.allowLoading = true;
      (block ? wafIPBlockAddApi(payload) : wafIPWhiteAddApi(payload))
        .then((res) => {
          if (res.code === 0) {
            this.$message.success(res.msg);
            this.actionMode = '';
            // 加完立刻重查一次，让用户自己看到结论变了，
            // 而不是只收到一句"添加成功"然后半信半疑
            this.doQuery();
          } else {
            this.$message.warning(res.msg);
          }
        })
        .finally(() => {
          this.allowLoading = false;
        });
    },
  },
});
</script>

<style lang="less" scoped>
.ipl-search {
  display: flex;
  gap: 8px;
}

.ipl-input {
  flex: 1;
}

.ipl-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  line-height: 1.6;
}

.ipl-progress {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: var(--td-radius-default);
  background: var(--td-bg-color-secondarycontainer);
}

.ipl-step {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.ipl-step.is-doing {
  color: var(--td-text-color-primary);
}

.ipl-step.is-done {
  color: var(--td-success-color);
}

.ipl-step.is-fail {
  color: var(--td-error-color);
}

.ipl-step-ico {
  font-size: 14px;
}

.ipl-step.is-doing .ipl-step-ico {
  animation: ipl-spin 0.9s linear infinite;
}

.ipl-step-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--td-component-border);
}

@keyframes ipl-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ipl-step.is-doing .ipl-step-ico {
    animation: none;
  }
}

.ipl-empty,
.ipl-none {
  margin-top: 16px;
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--td-text-color-placeholder);
}

.ipl-result {
  margin-top: 12px;
}

.ipl-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--td-component-stroke);
}

.ipl-ip {
  font-size: 15px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.ipl-note {
  margin-top: 8px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.ipl-spacer {
  flex: 1;
}

.ipl-hits {
  margin-top: 4px;
  max-height: 380px;
  overflow-y: auto;
}

.ipl-hit {
  padding: 10px 12px;
  border-bottom: 1px solid var(--td-component-stroke);
  border-left: 2px solid transparent;
}

.ipl-hit.is-block {
  border-left-color: var(--td-error-color);
}

.ipl-hit.is-allow {
  border-left-color: var(--td-success-color);
}

.ipl-hit.is-none {
  border-left-color: var(--td-warning-color);
}

.ipl-hit-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
}

.ipl-scope {
  color: var(--td-text-color-primary);
}

.ipl-matched {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  padding: 1px 6px;
  border-radius: 2px;
  background: var(--td-bg-color-secondarycontainer);
  color: var(--td-text-color-secondary);
}

.ipl-effect {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.ipl-detail {
  margin-top: 4px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
  line-height: 1.6;
}

.ipl-allow {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--td-component-stroke);
}

.ipl-allow-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ipl-allow-hint {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.ipl-allow-form {
  background: var(--td-bg-color-secondarycontainer);
  border-radius: var(--td-radius-default);
  padding: 14px 16px;
}

.ipl-allow-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  margin-bottom: 12px;
}

.ipl-warn-list {
  margin-top: 4px;
  font-size: 12px;
}

.ipl-allow-ops {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
