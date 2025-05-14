<template>
  <div class="healthy-config">
    <t-form-item :label="$t('page.host.health_check.is_enable_healthy')">
      <t-tooltip class="placement top center" :content="$t('page.host.health_check.is_enable_healthy_tips')" placement="top"
                 :overlay-style="{ width: '200px' }" show-arrow>
        <t-radio-group v-model="localHealthyConfig.is_enable_healthy" @change="updateParent">
          <t-radio value="0">{{ $t('common.off') }}</t-radio>
          <t-radio value="1">{{ $t('common.on') }}</t-radio>
        </t-radio-group>
      </t-tooltip>
    </t-form-item>

    <template v-if="localHealthyConfig.is_enable_healthy == '1'">
      <t-form-item :label="$t('page.host.health_check.fail_count')">
        <t-tooltip class="placement top center" :content="$t('page.host.health_check.fail_count_tips')" placement="top"
                   :overlay-style="{ width: '200px' }" show-arrow>
          <t-input-number :style="{ width: '150px' }"
                          v-model="localHealthyConfig.fail_count"
                          @change="updateParent"
                          :min="1"
                          :max="10">
          </t-input-number>
        </t-tooltip>
      </t-form-item>

      <t-form-item :label="$t('page.host.health_check.success_count')">
        <t-tooltip class="placement top center" :content="$t('page.host.health_check.success_count_tips')" placement="top"
                   :overlay-style="{ width: '200px' }" show-arrow>
          <t-input-number :style="{ width: '150px' }"
                          v-model="localHealthyConfig.success_count"
                          @change="updateParent"
                          :min="1"
                          :max="10">
          </t-input-number>
        </t-tooltip>
      </t-form-item>

      <t-form-item :label="$t('page.host.health_check.response_time')">
        <t-tooltip class="placement top center" :content="$t('page.host.health_check.response_time_tips')" placement="top"
                   :overlay-style="{ width: '200px' }" show-arrow>
          <t-input-number :style="{ width: '150px' }"
                          v-model="localHealthyConfig.response_time"
                          @change="updateParent"
                          :min="1">
          </t-input-number>
          <span style="margin-left: 8px;">{{$t('page.host.health_check.seconds')}}</span>
        </t-tooltip>
      </t-form-item>

      <t-form-item :label="$t('page.host.health_check.check_method')">
        <t-select v-model="localHealthyConfig.check_method" @change="updateParent" :style="{ width: '150px' }">
          <t-option value="GET">GET</t-option>
          <t-option value="HEAD">HEAD</t-option>
        </t-select>
      </t-form-item>

      <t-form-item :label="$t('page.host.health_check.check_path')">
        <t-input :style="{ width: '480px' }"
                 v-model="localHealthyConfig.check_path"
                 @change="updateParent"
                 :placeholder="$t('page.host.health_check.check_path_placeholder')">
        </t-input>
      </t-form-item>

      <t-form-item :label="$t('page.host.health_check.expected_codes')">
        <t-input :style="{ width: '480px' }"
                 v-model="localHealthyConfig.expected_codes"
                 @change="updateParent"
                 :placeholder="$t('page.host.health_check.expected_codes_placeholder')">
        </t-input>
      </t-form-item>
    </template>
  </div>
</template>

<script lang="ts">
export default {
  name: 'HealthyConfig',
  props: {
    healthyConfig: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      // 创建一个本地副本，避免直接修改props
      localHealthyConfig: JSON.parse(JSON.stringify(this.healthyConfig))
    };
  },
  watch: {
    // 当父组件传入的配置变化时更新本地数据
    healthyConfig: {
      handler(newVal) {
        // 避免直接引用，使用深拷贝
        this.localHealthyConfig = JSON.parse(JSON.stringify(newVal));
      },
      immediate: true
    }
  },
  methods: {
    // 当本地数据变化时通知父组件
    updateParent() {
      console.log("HealthyConfig", JSON.parse(JSON.stringify(this.localHealthyConfig)));
      // 创建新对象避免直接修改props
      this.$emit('update', JSON.parse(JSON.stringify(this.localHealthyConfig)));
    }
  }
};
</script>
