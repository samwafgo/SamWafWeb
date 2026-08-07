<template>
  <t-dialog
    :header="$t('page.hostguard.ban_dialog_title')"
    :visible="visible"
    :width="560"
    :footer="false"
    @close="onClose"
  >
    <div slot="body">
      <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="110">
        <t-form-item :label="$t('page.hostguard.col_ip')" name="ip">
          <t-input v-model="formData.ip" :style="{ width: '360px' }" />
        </t-form-item>
        <t-form-item :label="$t('page.hostguard.ban_minutes')" name="ban_minutes">
          <t-input-number v-model="formData.ban_minutes" :min="0" theme="column" :style="{ width: '360px' }" />
          <div class="desc">{{ $t('page.hostguard.ban_minutes_desc') }}</div>
        </t-form-item>
        <t-form-item :label="$t('page.hostguard.ban_reason')" name="reason">
          <t-input v-model="formData.reason" :style="{ width: '360px' }" />
        </t-form-item>
        <t-form-item style="float: right">
          <t-button variant="outline" @click="onClose">{{ $t('common.close') }}</t-button>
          <t-button theme="primary" type="submit" style="margin-left: 8px">{{ $t('common.confirm') }}</t-button>
        </t-form-item>
      </t-form>
    </div>
  </t-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { wafHostGuardBanManualApi } from '@/apis/hostguard';

export default Vue.extend({
  name: 'HostGuardBanDialog',
  props: {
    visible: { type: Boolean, default: false },
    ip: { type: String, default: '' },
    source: { type: String, default: 'ssh' },
  },
  data() {
    return {
      formData: { ip: '', ban_minutes: 60, reason: '', source: 'ssh' },
      rules: {
        ip: [{ required: true, message: this.$t('common.required'), type: 'error' }],
      },
    };
  },
  watch: {
    visible(val) {
      if (val) {
        this.formData = {
          ip: this.ip,
          ban_minutes: 60,
          reason: '',
          source: this.source || 'ssh',
        };
      }
    },
  },
  methods: {
    onClose() {
      this.$emit('update:visible', false);
    },
    onSubmit({ firstError }) {
      if (firstError) {
        this.$message.warning(firstError);
        return;
      }
      wafHostGuardBanManualApi(this.formData)
        .then((res) => {
          if (res.code === 0) {
            this.$message.success(res.msg);
            this.onClose();
            this.$emit('done');
          } else {
            this.$message.warning(res.msg);
          }
        })
        .catch(() => {});
    },
  },
});
</script>

<style lang="less" scoped>
// 同 SettingPanel：让说明文字独占一行，别和控件抢 flex 行内空间
/deep/ .t-form__controls-content {
  flex-wrap: wrap;
}
.desc {
  flex-basis: 100%;
  width: 100%;
  font-size: 12px;
  color: var(--td-text-color-secondary);
  margin-top: 4px;
}
</style>
