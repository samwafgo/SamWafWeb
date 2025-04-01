<template>
  <div class="captcha-config">
    <t-form-item :label="$t('page.host.captcha.is_enable')">
      <t-tooltip class="placement top center" :content="$t('page.host.captcha.is_enable_captcha_tips')" placement="top"
                 :overlay-style="{ width: '200px' }" show-arrow>
        <t-radio-group v-model="localCaptchaConfig.is_enable_captcha" @change="updateParent">
          <t-radio value="0">{{ $t('common.off') }}</t-radio>
          <t-radio value="1">{{ $t('common.on') }}</t-radio>
        </t-radio-group>
      </t-tooltip>
    </t-form-item>

    <!-- 其他表单项也类似修改，添加@change="updateParent" -->
    <t-form-item :label="$t('page.host.captcha.exclude_urls')" v-if="localCaptchaConfig.is_enable_captcha == '1'">
      <t-tooltip class="placement top center" :content="$t('page.host.captcha.exclude_urls_tips')" placement="top"
                 :overlay-style="{ width: '200px' }" show-arrow>
        <t-textarea :style="{ width: '480px' }"
                    v-model="localCaptchaConfig.exclude_urls"
                    @change="updateParent"
                    :placeholder="$t('page.host.captcha.exclude_urls_placeholder')">
        </t-textarea>
      </t-tooltip>
    </t-form-item>

    <!-- 其他表单项也类似修改 -->
  </div>
</template>

<script lang="ts">
export default {
  name: 'CaptchaConfig',
  props: {
    captchaConfig: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      // 创建一个本地副本，避免直接修改props
      localCaptchaConfig: JSON.parse(JSON.stringify(this.captchaConfig))
    };
  },
  watch: {
    // 当父组件传入的配置变化时更新本地数据
    captchaConfig: {
      handler(newVal) {
        // 避免直接引用，使用深拷贝
        this.localCaptchaConfig = JSON.parse(JSON.stringify(newVal));
      },
      immediate: true
    }
  },
  methods: {
    // 当本地数据变化时通知父组件
    updateParent() {
      console.log("CaptchaConfig",JSON.parse(JSON.stringify(this.localCaptchaConfig)))
      // 创建新对象避免直接修改props
      this.$emit('update', JSON.parse(JSON.stringify(this.localCaptchaConfig)));
    }
  }
};
</script>

<style lang="less" scoped>
.mode-desc {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  margin-top: 4px;
}
</style>
