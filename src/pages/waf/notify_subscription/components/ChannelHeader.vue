<template>
  <div class="channel-header-wrapper">
    <t-tag :theme="theme" size="small">{{ label }}</t-tag>
    <t-dropdown :min-column-width="140">
      <t-button variant="text" size="small" shape="square">
        <t-icon name="ellipsis" />
      </t-button>
      <t-dropdown-menu>
        <t-dropdown-item @click="$emit('batch', { action: 'add', type: type })">
          <t-icon name="add" /> {{ $t('page.notify_subscription.batch_action_add') }}
        </t-dropdown-item>
        <t-dropdown-item @click="$emit('batch', { action: 'enable', type: type })">
          <t-icon name="check-circle" /> {{ $t('page.notify_subscription.batch_action_enable') }}
        </t-dropdown-item>
        <t-dropdown-item @click="$emit('batch', { action: 'disable', type: type })">
          <t-icon name="close-circle" /> {{ $t('page.notify_subscription.batch_action_disable') }}
        </t-dropdown-item>
        <t-dropdown-item @click="$emit('batch', { action: 'config', type: type })">
          <t-icon name="setting" /> {{ $t('page.notify_subscription.batch_action_config') }}
        </t-dropdown-item>
        <t-dropdown-item @click="$emit('batch', { action: 'delete', type: type })">
          <t-icon name="delete" /> {{ $t('page.notify_subscription.batch_action_delete') }}
        </t-dropdown-item>
      </t-dropdown-menu>
    </t-dropdown>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

// 渠道列表头：原来 5 个渠道各复制一份同样的 25 行模板，
// 加一个"批量配置"菜单项就要改 5 处，抽出来后只改一处。
export default Vue.extend({
  name: 'NotifySubscriptionChannelHeader',
  props: {
    type: { type: String, required: true },
    label: { type: String, required: true },
    theme: { type: String, default: 'primary' },
  },
});
</script>

<style lang="less" scoped>
.channel-header-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>
