<template>
  <div class="ssl-form">
    <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="220">
      <!-- 编辑模式下显示有效期 -->
      <t-form-item :label="$t('page.ssl.label_valid_to')" name="valid_to" v-if="isEdit && formData.valid_to">
        <span>{{formData.valid_to}} ({{formData.expiration_info}})</span>
      </t-form-item>

      <t-form-item :label="$t('page.ssl.label_cert_content')" name="cert_content">
        <t-textarea v-model="formData.cert_content" :style="{ width: '480px' }" rows="4" ></t-textarea>
      </t-form-item>

      <t-form-item :label="$t('page.ssl.label_key_content')" name="key_content">
        <t-textarea v-model="formData.key_content" :style="{ width: '480px' }" rows="4" ></t-textarea>
      </t-form-item>

      <!-- 编辑模式下显示自动更新相关字段 -->
      <template v-if="isEdit">
        <t-form-item>
          <b>{{$t("page.ssl.label_auto_tip")}}</b>
        </t-form-item>
        <t-form-item :label="$t('page.ssl.label_auto_key_path')" name="key_path">
          <t-textarea v-model="formData.key_path" :style="{ width: '480px' }" rows="4"></t-textarea>
        </t-form-item>
        <t-form-item :label="$t('page.ssl.label_auto_crt_path')" name="cert_path">
          <t-textarea v-model="formData.cert_path" :style="{ width: '480px' }" rows="4"></t-textarea>
        </t-form-item>
      </template>

      <t-form-item style="float: right;margin-top:5px">
        <t-button variant="outline" @click="$emit('close')">{{ $t('common.close') }}</t-button>
        <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
      </t-form-item>
    </t-form>
  </div>
</template>

<script>
import Vue from 'vue';

export default Vue.extend({
  name: 'SslForm',
  props: {
    value: {
      type: Object,
      required: true
    },
    isEdit: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      formData: JSON.parse(JSON.stringify(this.value)),
      rules: {
        cert_content: [{
          required: true,
          message: this.$t('common.select_placeholder') + this.$t('page.ssl.label_cert_content'),
          type: 'error'
        }],
        key_content: [{
          required: true,
          message: this.$t('common.select_placeholder') + this.$t('page.ssl.label_key_content'),
          type: 'error'
        }]
      }
    };
  },
  watch: {
    value: {
      handler(newVal) {
        this.formData = JSON.parse(JSON.stringify(newVal));
      },
      deep: true
    }
  },
  methods: {
    onSubmit({ validateResult, firstError }) {
      if (validateResult === true) {
        this.$emit('submit', { result: this.formData });
      } else {
        this.$message.warning(firstError);
      }
    }
  }
});
</script>
