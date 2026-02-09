<template>
  <div class="captcha-config">
    <t-form-item :label="$t('page.host.captcha.is_enable')">
      <t-tooltip class="placement top center" :content="$t('page.host.captcha.is_enable_tips')" placement="top"
                 :overlay-style="{ width: '200px' }" show-arrow>
        <t-radio-group v-model="localCaptchaConfig.is_enable_captcha" @change="updateParent">
          <t-radio value="0">{{ $t('common.off') }}</t-radio>
          <t-radio value="1">{{ $t('common.on') }}</t-radio>
        </t-radio-group>
      </t-tooltip>
    </t-form-item> 
    <t-form-item :label="$t('page.host.captcha.engine_type')" v-if="localCaptchaConfig.is_enable_captcha == '1'">
      <t-tooltip class="placement top center" :content="$t('page.host.captcha.engine_type_tips')" placement="top"
                 :overlay-style="{ width: '200px' }" show-arrow>
        <t-radio-group v-model="localCaptchaConfig.engine_type" @change="updateParent">
          <t-radio value="traditional">{{ $t('page.host.captcha.engine_traditional') }}</t-radio>
          <t-radio value="capJs">{{ $t('page.host.captcha.engine_capjs') }}</t-radio>
        </t-radio-group>
      </t-tooltip>
    </t-form-item>

    <t-form-item :label="$t('page.host.captcha.path_prefix')" v-if="localCaptchaConfig.is_enable_captcha == '1'">
      <t-tooltip class="placement top center" :content="$t('page.host.captcha.path_prefix_tips')" placement="top"
                 :overlay-style="{ width: '300px' }" show-arrow>
        <t-input :style="{ width: '300px' }"
                 v-model="localCaptchaConfig.path_prefix"
                 @change="updateParent"
                 :placeholder="$t('page.host.captcha.path_prefix_placeholder')">
          <template #suffix>
            <t-button size="small" theme="primary" @click="generateCaptchaPath">
              {{$t('page.host.generate_random_path')}}
            </t-button>
          </template>
        </t-input>
      </t-tooltip>
    </t-form-item>

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

    <t-form-item :label="$t('page.host.captcha.expire_time')" v-if="localCaptchaConfig.is_enable_captcha == '1'">
      <t-tooltip class="placement top center" :content="$t('page.host.captcha.expire_time_tips')" placement="top"
                 :overlay-style="{ width: '200px' }" show-arrow>
        <t-input-number :style="{ width: '150px' }"
                        v-model="localCaptchaConfig.expire_time"
                        @change="updateParent"
                        :placeholder="$t('page.host.captcha.expire_time_placeholder')">
        </t-input-number>
      </t-tooltip>
    </t-form-item>


    <!-- capJS配置部分 -->
    <div v-if="localCaptchaConfig.is_enable_captcha == '1' && localCaptchaConfig.engine_type == 'capJs'">
      <t-divider>{{ $t('page.host.captcha.capjs_config') }}</t-divider>
      
      <t-form-item :label="$t('page.host.captcha.challenge_count')">
        <t-tooltip class="placement top center" :content="$t('page.host.captcha.challenge_count_tips')" placement="top"
                   :overlay-style="{ width: '200px' }" show-arrow>
          <t-input-number :style="{ width: '150px' }"
                          v-model="localCaptchaConfig.cap_js_config.challengeCount"
                          @change="updateParent"
                          :min="1"
                          :max="100">
          </t-input-number>
        </t-tooltip>
      </t-form-item>

      <t-form-item :label="$t('page.host.captcha.challenge_size')">
        <t-tooltip class="placement top center" :content="$t('page.host.captcha.challenge_size_tips')" placement="top"
                   :overlay-style="{ width: '200px' }" show-arrow>
          <t-input-number :style="{ width: '150px' }"
                          v-model="localCaptchaConfig.cap_js_config.challengeSize"
                          @change="updateParent"
                          :min="16"
                          :max="64">
          </t-input-number>
        </t-tooltip>
      </t-form-item>

      <t-form-item :label="$t('page.host.captcha.challenge_difficulty')">
        <t-tooltip class="placement top center" :content="$t('page.host.captcha.challenge_difficulty_tips')" placement="top"
                   :overlay-style="{ width: '200px' }" show-arrow>
          <t-input-number :style="{ width: '150px' }"
                          v-model="localCaptchaConfig.cap_js_config.challengeDifficulty"
                          @change="updateParent"
                          :min="1"
                          :max="10">
          </t-input-number>
        </t-tooltip>
      </t-form-item>

      <t-form-item :label="$t('page.host.captcha.capjs_expires_ms')">
        <t-tooltip class="placement top center" :content="$t('page.host.captcha.capjs_expires_ms_tips')" placement="top"
                   :overlay-style="{ width: '200px' }" show-arrow>
          <t-input-number :style="{ width: '150px' }"
                          v-model="localCaptchaConfig.cap_js_config.expiresMs"
                          @change="updateParent"
                          :min="60000"
                          :max="3600000">
          </t-input-number>
        </t-tooltip>
      </t-form-item>

      <t-form-item :label="$t('page.host.captcha.capjs_info_title_zh')">
        <t-tooltip class="placement top center" :content="$t('page.host.captcha.capjs_info_title_zh_tips')" placement="top"
                   :overlay-style="{ width: '200px' }" show-arrow>
          <t-input :style="{ width: '300px' }"
                   v-model="localCaptchaConfig.cap_js_config.infoTitle.zh"
                   @change="updateParent"
                   :placeholder="$t('page.host.captcha.capjs_info_title_zh_placeholder')">
          </t-input>
        </t-tooltip>
      </t-form-item>

      <t-form-item :label="$t('page.host.captcha.capjs_info_text_zh')">
        <t-tooltip class="placement top center" :content="$t('page.host.captcha.capjs_info_text_zh_tips')" placement="top"
                   :overlay-style="{ width: '200px' }" show-arrow>
          <t-textarea :style="{ width: '400px' }"
                      v-model="localCaptchaConfig.cap_js_config.infoText.zh"
                      @change="updateParent"
                      :placeholder="$t('page.host.captcha.capjs_info_text_zh_placeholder')">
          </t-textarea>
        </t-tooltip>
      </t-form-item>
      
      <t-form-item :label="$t('page.host.captcha.capjs_info_title_en')">
        <t-tooltip class="placement top center" :content="$t('page.host.captcha.capjs_info_title_en_tips')" placement="top"
                   :overlay-style="{ width: '200px' }" show-arrow>
          <t-input :style="{ width: '300px' }"
                   v-model="localCaptchaConfig.cap_js_config.infoTitle.en"
                   @change="updateParent"
                   :placeholder="$t('page.host.captcha.capjs_info_title_en_placeholder')">
          </t-input>
        </t-tooltip>
      </t-form-item>
 
      <t-form-item :label="$t('page.host.captcha.capjs_info_text_en')">
        <t-tooltip class="placement top center" :content="$t('page.host.captcha.capjs_info_text_en_tips')" placement="top"
                   :overlay-style="{ width: '200px' }" show-arrow>
          <t-textarea :style="{ width: '400px' }"
                      v-model="localCaptchaConfig.cap_js_config.infoText.en"
                      @change="updateParent"
                      :placeholder="$t('page.host.captcha.capjs_info_text_en_placeholder')">
          </t-textarea>
        </t-tooltip>
      </t-form-item>
    </div>
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
        // 确保新字段有默认值
        if (!this.localCaptchaConfig.engine_type) {
          this.localCaptchaConfig.engine_type = 'traditional';
        }
        if (!this.localCaptchaConfig.path_prefix) {
          this.localCaptchaConfig.path_prefix = '';
        }
        if (!this.localCaptchaConfig.cap_js_config) {
          this.localCaptchaConfig.cap_js_config = {
            challengeCount: 50,
            challengeSize: 32,
            challengeDifficulty: 4,
            expiresMs: 600000,
            infoTitle: {
              zh: "验证码验证",
              en: "Captcha Verification"
            },
            infoText: {
              zh: "请完成以下验证以继续访问",
              en: "Please complete the following verification to continue"
            }
          };
        }
      },
      immediate: true
    },
    // 监听验证码开关状态，自动生成路径
    'localCaptchaConfig.is_enable_captcha': function(newVal, oldVal) {
      // 从关闭切换到开启时，如果路径为空则自动生成
      if (newVal === '1' && oldVal === '0' && !this.localCaptchaConfig.path_prefix) {
        this.generateCaptchaPath();
      }
    }
  },
  methods: {
    // 当本地数据变化时通知父组件
    updateParent() {
      console.log("CaptchaConfig", JSON.parse(JSON.stringify(this.localCaptchaConfig)))
      // 创建新对象避免直接修改props
      this.$emit('update', JSON.parse(JSON.stringify(this.localCaptchaConfig)));
    },
    // 生成随机验证码路径前缀
    generateCaptchaPath() {
      // 生成格式: /_waf_{8位随机字符}
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let randomStr = '';
      for (let i = 0; i < 8; i++) {
        randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      this.localCaptchaConfig.path_prefix = `/_waf_${randomStr}`;
      this.$message.success(this.$t('page.host.generate_path_success'));
      // 通知父组件更新
      this.updateParent();
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
