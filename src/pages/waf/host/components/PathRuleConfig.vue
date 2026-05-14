<template>
  <div class="path-rule-config">
    <path-rule :prop-host-code="propHostCode"></path-rule>
  </div>
</template>

<script lang="ts">
import PathRule from '@/pages/waf/path_rule/index.vue';
export default {
  name: 'PathRuleConfig',
  props: {
    propHostCode: {
      type: String,
      required: true
    }
  },
  components: {
    PathRule
  }
};
</script>

<style lang="less" scoped>
.path-rule-config {
  width: 100%;
  overflow-x: auto;
}
</style>
