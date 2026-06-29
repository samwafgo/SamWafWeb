<template>
  <t-dialog
    :header="$t('page.account.change_password')"
    :visible.sync="innerVisible"
    :width="560"
    :footer="false"
    :close-btn="!forced"
    :close-on-overlay-click="!forced"
    :close-on-esc-keydown="!forced"
    @close="handleClose"
  >
    <div slot="body">
      <t-alert v-if="forced && reason" theme="warning" :message="reason" :style="{ marginBottom: '12px' }" />
      <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="120">
        <t-form-item v-if="!hideOld" :label="$t('page.account.old_password')" name="old_password">
          <t-input :style="{ width: '380px' }" type="password" v-model="formData.old_password"
                   :placeholder="$t('common.placeholder') + $t('page.account.old_password')"></t-input>
        </t-form-item>
        <t-form-item :label="$t('page.account.new_password')" name="new_password">
          <t-input :style="{ width: '380px' }" type="password" v-model="formData.new_password"
                   :placeholder="$t('common.placeholder') + $t('page.account.new_password')"></t-input>
        </t-form-item>
        <t-form-item :label="$t('page.account.confirm_password')" name="new_password2">
          <t-input :style="{ width: '380px' }" type="password" v-model="formData.new_password2"
                   :placeholder="$t('common.placeholder') + $t('page.account.confirm_password')"></t-input>
        </t-form-item>
        <t-form-item style="float: right">
          <t-button v-if="!forced" variant="outline" @click="handleClose">{{ $t('common.close') }}</t-button>
          <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
        </t-form-item>
      </t-form>
    </div>
  </t-dialog>
</template>
<script lang="ts">
import Vue from 'vue';
import { account_change_my_password_api } from '@/apis/account';

export default Vue.extend({
  name: 'ChangePasswordDialog',
  props: {
    visible: { type: Boolean, default: false },
    // forced=true 用于首次登录/口令到期强制改密：不可关闭
    forced: { type: Boolean, default: false },
    reason: { type: String, default: '' },
    // 强制改密场景下，用户刚刚登录用的密码即旧密码，可预置后隐藏旧密码输入
    presetOldPassword: { type: String, default: '' },
  },
  data() {
    return {
      formData: { old_password: '', new_password: '', new_password2: '' },
      rules: {
        old_password: [{ required: true, message: this.$t('common.placeholder') + this.$t('page.account.old_password'), type: 'error' }],
        new_password: [{ required: true, message: this.$t('common.placeholder') + this.$t('page.account.new_password'), type: 'error' }],
        new_password2: [{ required: true, message: this.$t('common.placeholder') + this.$t('page.account.confirm_password'), type: 'error' }],
      },
    };
  },
  computed: {
    innerVisible: {
      get(): boolean { return this.visible; },
      set(val: boolean) { this.$emit('update:visible', val); },
    },
    hideOld(): boolean {
      return this.forced && !!this.presetOldPassword;
    },
  },
  watch: {
    visible(val: boolean) {
      if (val) {
        // 每次打开清空输入
        this.formData = { old_password: '', new_password: '', new_password2: '' };
      }
    },
  },
  methods: {
    handleClose() {
      if (this.forced) return; // 强制改密不允许关闭
      this.innerVisible = false;
    },
    onSubmit({ validateResult, firstError }): void {
      if (validateResult !== true) {
        this.$message.warning(firstError);
        return;
      }
      if (this.formData.new_password !== this.formData.new_password2) {
        this.$message.warning(this.$t('page.account.password_mismatch_warning'));
        return;
      }
      const oldPwd = this.hideOld ? this.presetOldPassword : this.formData.old_password;
      account_change_my_password_api({
        old_password: oldPwd,
        new_password: this.formData.new_password,
        new_password2: this.formData.new_password2,
      })
        .then((res) => {
          if (res.code === 0) {
            this.$message.success(res.msg);
            this.innerVisible = false;
            this.$emit('success');
          } else {
            this.$message.warning(res.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
    },
  },
});
</script>
