<template>
  <t-dialog
    :visible="visible"
    :header="isBlock ? $t('components.ip_disposal.header_block') : $t('components.ip_disposal.header_allow')"
    :confirm-btn="{ content: $t('common.confirm'), theme: isBlock ? 'danger' : 'primary', loading: submitting }"
    :cancel-btn="$t('common.cancel')"
    width="560px"
    @confirm="handleConfirm"
    @close="close"
  >
    <t-form label-width="90px">
      <t-form-item :label="$t('components.ip_disposal.label_ip')">
        <t-input :value="ip" readonly />
      </t-form-item>

      <!-- 站点必选：ipblock/ipwhite 两个接口的 host_code 都是 required，
           而分析页是跨站点聚合的，一个来源可能横跨多站，不能瞎猜一个 -->
      <t-form-item :label="$t('components.ip_disposal.label_host')" :status="form.host_code ? '' : 'error'">
        <t-select v-model="form.host_code" filterable :style="{ width: '100%' }"
                  :placeholder="$t('components.ip_disposal.placeholder_host')">
          <t-option v-for="item in hostOptions" :key="item.value" :value="item.value" :label="item.label">
            {{ item.label }}<span v-if="hostHits[item.value]" class="ipd-hit">　{{ $t('components.ip_disposal.host_hits', { n: hostHits[item.value] }) }}</span>
          </t-option>
        </t-select>
        <div v-if="hostCandidates.length > 1" class="ipd-tip">{{ $t('components.ip_disposal.host_multi_tip') }}</div>
      </t-form-item>

      <!-- 黑名单统一在 WAF 应用层拦截；需要系统层封禁引导去防火墙IP封禁页 -->
      <t-form-item v-if="isBlock" :label="$t('components.ip_disposal.label_layer')">
        <span class="ipd-tip" style="margin-top:0">{{ $t('components.ip_disposal.layer_waf_only_hint') }}</span>
      </t-form-item>

      <t-form-item :label="$t('components.ip_disposal.label_remarks')">
        <t-input v-model="form.remarks" :maxlength="200" />
      </t-form-item>
      <div v-if="isBlock" class="ipd-tip" style="margin: 0 0 4px 90px">
        {{ $t('components.ip_disposal.system_layer_hint') }}
        <a class="t-button-link" style="display:inline" @click="$router.push({ name: 'WafFirewallIPBlock' })">
          {{ $t('components.ip_disposal.goto_firewall_ipblock') }}
        </a>
      </div>
    </t-form>
  </t-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { wafIPBlockAddApi } from '@/apis/ipblock';
import { wafIPWhiteAddApi } from '@/apis/ipwhite';
import { allhost } from '@/apis/host';

// IP 处置弹窗：加黑与加白合用一个。
// 抽出来是因为「加入黑名单」此前在 4 个页面各写了一遍 $dialog.confirm，
// 既没有站点选择也没用上 recommend-layer；加白更是任何日志页都没有入口。
export default Vue.extend({
  name: 'IpDisposal',
  props: {
    visible: { type: Boolean, default: false },
    ip: { type: String, default: '' },
    // block=加黑 allow=加白（黑名单已统一为纯WAF层，不再有层级选择）
    mode: { type: String, default: 'block' },
    // 候选站点：[{ host_code, req_cnt }]，按请求数倒序。用来定默认值并在下拉里标注命中次数
    hostCandidates: { type: Array, default: () => [] },
    // 页面上已经筛了站点时优先用它
    preferHostCode: { type: String, default: '' },
    remarks: { type: String, default: '' },
  },
  data() {
    return {
      submitting: false,
      hostOptions: [] as Array<{ value: string; label: string }>,
      form: { host_code: '', remarks: '' },
    };
  },
  computed: {
    isBlock(): boolean {
      return this.mode !== 'allow';
    },
    hostHits(): Record<string, number> {
      const m: Record<string, number> = {};
      (this.hostCandidates as any[]).forEach((h) => {
        m[h.host_code] = h.req_cnt;
      });
      return m;
    },
  },
  watch: {
    // 弹窗内的数据必须每次打开重拉/重置，否则会留着上一次的选择
    visible(v: boolean) {
      if (v) this.init();
    },
  },
  methods: {
    init() {
      this.form.remarks = this.remarks;
      this.form.host_code = this.pickDefaultHost();
      this.loadHosts();
    },
    // 默认站点：页面筛过就用那个，否则取这个来源打得最多的站点
    pickDefaultHost(): string {
      if (this.preferHostCode) return this.preferHostCode;
      const list = (this.hostCandidates || []) as any[];
      const first = list.find((h) => h && h.host_code);
      // 兜底成空串：undefined 漏进 t-select 会去匹配选项、最后把 undefined 显示出来
      return first ? String(first.host_code) : '';
    },
    loadHosts() {
      allhost()
        .then((res) => {
          if (res.code === 0) {
            // allhost 返回的 json 字段就叫 value / label（见 model/response/all_host.go 的 tag），
            // 不是 code / host——取错的话下拉项全是空白、选中值会显示成 undefined
            this.hostOptions = (res.data || [])
              .filter((h) => h && h.value)
              .map((h) => ({ value: h.value, label: h.label || h.value }));
          }
        })
        .catch(() => {});
    },
    handleConfirm() {
      if (!this.form.host_code) {
        this.$message.warning(this.$t('components.ip_disposal.host_required'));
        return;
      }
      this.submitting = true;
      const payload: any = {
        host_code: this.form.host_code,
        ip: this.ip,
        remarks: this.form.remarks,
      };
      const call = this.isBlock ? wafIPBlockAddApi(payload) : wafIPWhiteAddApi(payload);
      call
        .then((res) => {
          if (res.code === 0) {
            this.$message.success(res.msg || this.$t('components.ip_disposal.done'));
            this.$emit('success', { ip: this.ip, mode: this.mode });
            this.close();
          } else {
            this.$message.error(res.msg);
          }
        })
        .catch(() => {})
        .finally(() => {
          this.submitting = false;
        });
    },
    close() {
      this.$emit('update:visible', false);
    },
  },
});
</script>

<style lang="less" scoped>
.ipd-tip {
  margin-top: 4px;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  line-height: 1.5;
}
.ipd-hit {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}
</style>
