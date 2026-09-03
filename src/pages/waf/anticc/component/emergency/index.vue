<template>
  <t-dialog :visible="visible" :header="$t('page.ccrule.emg_title')" :width="720" :footer="false" destroy-on-close
    @close="$emit('update:visible', false)">
    <div class="emg-intro">{{ $t('page.ccrule.emg_intro') }}</div>

    <!-- 这个开关让全部访客多走一道挑战，代价由真实用户承担，必须在按下去之前说清楚 -->
    <div class="emg-warn">
      <div>{{ $t('page.ccrule.emg_warn_1') }}</div>
      <div>{{ $t('page.ccrule.emg_warn_2') }}</div>
      <div>{{ $t('page.ccrule.emg_warn_3') }}</div>
    </div>

    <t-form label-width="130px" class="emg-form">
      <t-form-item :label="$t('page.ccrule.emg_scope')">
        <t-select v-model="hostCode" filterable :style="{ width: '320px' }">
          <t-option v-for="h in hosts" :key="h.value" :value="h.value" :label="h.label" />
        </t-select>
        <template #help>{{ $t('page.ccrule.emg_scope_hint') }}</template>
      </t-form-item>

      <t-form-item :label="$t('page.ccrule.emg_duration')">
        <t-radio-group v-model="durationMin">
          <t-radio-button :value="30">{{ $t('page.ccrule.emg_dur_30m') }}</t-radio-button>
          <t-radio-button :value="60">{{ $t('page.ccrule.emg_dur_1h') }}</t-radio-button>
          <t-radio-button :value="360">{{ $t('page.ccrule.emg_dur_6h') }}</t-radio-button>
          <t-radio-button :value="1440">{{ $t('page.ccrule.emg_dur_24h') }}</t-radio-button>
          <t-radio-button :value="0">{{ $t('page.ccrule.emg_dur_manual') }}</t-radio-button>
        </t-radio-group>
        <template #help>{{ $t('page.ccrule.emg_duration_hint') }}</template>
      </t-form-item>

    </t-form>

    <!-- 按钮不放进 FormItem：空 label 的 FormItem 不会给内容区加 margin-left，会贴到最左边 -->
    <div class="emg-submit">
      <t-button theme="danger" :loading="saving" :disabled="!hostCode" @click="turnOn">
        {{ $t('page.ccrule.emg_turn_on') }}
      </t-button>
    </div>

    <t-divider align="left">{{ $t('page.ccrule.emg_active_title') }}</t-divider>

    <div v-if="!activeList.length" class="emg-none">{{ $t('page.ccrule.emg_none') }}</div>
    <div v-for="row in activeList" :key="row.host_code" class="emg-row">
      <span class="n">
        {{ row.global_host === 1 ? $t('page.ccrule.emg_global_site') : row.host_name }}
      </span>
      <span class="t">{{ untilText(row) }}</span>
      <!-- 开着但站点防护是关的：紧急模式挂在 CC 检测下，防护关了它一样不生效，不说会以为开了就有用 -->
      <span v-if="row.guard_status !== 1" class="g">{{ $t('page.ccrule.emg_guard_off') }}</span>
      <a class="t-button-link" @click="turnOff(row.host_code)">{{ $t('page.ccrule.emg_turn_off') }}</a>
    </div>

    <div class="emg-foot">
      <t-button variant="outline" :loading="loading" @click="loadStatus">{{ $t('common.refresh') }}</t-button>
      <t-button theme="primary" style="margin-left: 10px" @click="$emit('update:visible', false)">
        {{ $t('common.close') }}
      </t-button>
    </div>
  </t-dialog>
</template>

<script>
import { wafAntiCCRuleEmergencyStatusApi, wafAntiCCRuleSetEmergencyApi } from '@/apis/anticcrule';

export default {
  name: 'CcEmergency',
  props: {
    visible: { type: Boolean, default: false },
    hosts: { type: Array, default: () => [] },
    defaultHostCode: { type: String, default: '' },
  },
  data() {
    return { hostCode: '', durationMin: 60, saving: false, loading: false, activeList: [] };
  },
  watch: {
    visible(val) {
      if (!val) return;
      // 每次打开都重置：上一次开完某个站点之后，下拉里还留着它容易误操作
      this.hostCode = this.defaultHostCode || (this.hosts[0] && this.hosts[0].value) || '';
      this.durationMin = 60;
      this.loadStatus();
    },
  },
  methods: {
    loadStatus() {
      this.loading = true;
      wafAntiCCRuleEmergencyStatusApi({})
        .then((res) => {
          this.loading = false;
          if (res.code === 0) this.activeList = res.data || [];
        })
        .catch(() => {
          this.loading = false;
        });
    },
    turnOn() {
      this.saving = true;
      wafAntiCCRuleSetEmergencyApi({ host_code: this.hostCode, enable: 1, duration_min: this.durationMin })
        .then((res) => {
          this.saving = false;
          if (res.code === 0) {
            this.$message.success(res.msg);
            this.loadStatus();
            this.$emit('changed');
          } else {
            this.$message.warning(res.msg);
          }
        })
        .catch(() => {
          this.saving = false;
        });
    },
    turnOff(code) {
      wafAntiCCRuleSetEmergencyApi({ host_code: code, enable: 0, duration_min: 0 })
        .then((res) => {
          if (res.code === 0) {
            this.$message.success(res.msg);
            this.loadStatus();
            this.$emit('changed');
          } else {
            this.$message.warning(res.msg);
          }
        })
        .catch(() => {});
    },
    untilText(row) {
      if (!row.until) return this.$t('page.ccrule.emg_until_manual');
      const d = new Date(row.until * 1000);
      const p = (n) => (n < 10 ? `0${n}` : `${n}`);
      const t = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
      // 库里写着「开」但已过自动关闭时间：到期判定在读取侧做，界面要能表达这个状态
      if (!row.active) return this.$t('page.ccrule.emg_until_expired', { time: t });
      return this.$t('page.ccrule.emg_until_at', { time: t });
    },
  },
};
</script>

<style lang="less" scoped>
.emg-intro {
  font-size: 13px;
  line-height: 1.9;
  margin-bottom: 12px;
}

.emg-warn {
  padding: 10px 14px;
  border-radius: var(--td-radius-default);
  background: var(--td-warning-color-1);
  color: var(--td-text-color-primary);
  font-size: 13px;
  line-height: 1.9;
  margin-bottom: 16px;
}

.emg-form {
  margin-bottom: 4px;
}

.emg-submit {
  margin-left: 130px;
  margin-bottom: 8px;
}

.emg-none {
  padding: 16px 0;
  color: var(--td-text-color-placeholder);
  font-size: 13px;
}

.emg-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 6px 0;
  border-top: 1px dashed var(--td-component-stroke);
  font-size: 13px;

  .n {
    width: 240px;
    flex: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .t {
    flex: 1;
    min-width: 0;
    color: var(--td-text-color-secondary);
  }

  .g {
    flex: none;
    color: var(--td-warning-color-7);
  }
}

.emg-foot {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}
</style>
