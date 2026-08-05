<template>
  <div class="channel-cell-content">
    <div v-for="channel in channels" :key="channel.id" class="channel-item-inline">
      <!-- 还没订阅：显示添加按钮 -->
      <div v-if="!channel.subscription" class="add-btn-inline">
        <t-button size="small" variant="dashed" :disabled="channel.status === 0" @click="$emit('add', { messageType: messageType, channel: channel })">
          <t-icon name="add" size="14px" />
          {{ channel.name }}
        </t-button>
      </div>

      <!-- 已订阅：开关 + 配置摘要 + 齿轮 + 删除 -->
      <div v-else class="subscription-inline">
        <t-switch
          :value="channel.subscription.status === 1"
          :disabled="channel.status === 0"
          size="small"
          @change="(val) => $emit('toggle', { messageType: messageType, channel: channel, value: val })"
        />
        <div class="channel-info-inline">
          <span class="channel-name">{{ channel.name }}</span>
          <span v-if="channelType === 'email' && channel.subscription.recipients" class="channel-detail">
            {{ channel.subscription.recipients }}
          </span>
          <a v-if="channelType === 'email'" class="edit-link-inline" @click="$emit('edit-recipients', { messageType: messageType, channel: channel })">
            {{ $t('common.edit') }}
          </a>
          <!-- 配置摘要：只显示改过的项，一眼看出哪个格子被单独配过 -->
          <span class="config-summary" :title="summaryTitle(channel.subscription)">{{ summary(channel.subscription) }}</span>
        </div>
        <t-tooltip :content="$t('page.notify_subscription.config_title')">
          <t-icon name="setting" size="16px" class="config-icon-inline" @click="$emit('config', { messageType: messageType, channel: channel })" />
        </t-tooltip>
        <t-icon name="close-circle-filled" size="16px" class="delete-icon-inline" @click="$emit('remove', { messageType: messageType, channelId: channel.id })" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'NotifySubscriptionChannelCell',
  props: {
    channels: { type: Array, default: () => [] },
    messageType: { type: String, required: true },
    channelType: { type: String, required: true },
  },
  methods: {
    parseJSON(text: string) {
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch (e) {
        return null;
      }
    },
    // 把生效配置压成一行灰字。只列非默认项——全默认时不显示任何东西，避免噪音
    summaryParts(sub: any): string[] {
      const parts: string[] = [];
      if (!sub) return parts;
      const throttle = this.parseJSON(sub.throttle_json) || {};

      const modeMap: any = {
        realtime: this.$t('page.notify_subscription.throttle_mode_realtime'),
        aggregate: this.$t('page.notify_subscription.throttle_mode_aggregate'),
        cooldown: this.$t('page.notify_subscription.throttle_mode_cooldown'),
      };
      if (sub.throttle_mode && sub.throttle_mode !== 'inherit' && modeMap[sub.throttle_mode]) {
        let modeText = modeMap[sub.throttle_mode];
        if (sub.throttle_mode === 'aggregate' && throttle.aggregate_window_sec > 0) {
          modeText += `${throttle.aggregate_window_sec}s`;
        }
        parts.push(modeText);
      }
      if (throttle.max_per_hour > 0) {
        parts.push(this.$t('page.notify_subscription.summary_limit', { count: throttle.max_per_hour }) as string);
      }
      if (throttle.quiet_hours) {
        parts.push(this.$t('page.notify_subscription.summary_quiet') as string);
      }
      if (sub.title_template || sub.content_template) {
        parts.push(this.$t('page.notify_subscription.summary_custom_template') as string);
      }
      if (sub.filter_json) {
        parts.push(this.$t('page.notify_subscription.summary_filtered') as string);
      }
      return parts;
    },
    summary(sub: any): string {
      return this.summaryParts(sub).join(' · ');
    },
    summaryTitle(sub: any): string {
      return this.summaryParts(sub).join(' · ');
    },
  },
});
</script>

<style lang="less" scoped>
.channel-cell-content {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .channel-item-inline {
    display: flex;
    align-items: center;

    .add-btn-inline {
      width: 100%;
    }

    .subscription-inline {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;

      .channel-info-inline {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;

        .channel-name {
          font-size: 13px;
          color: #333;
          font-weight: 500;
        }

        .channel-detail {
          font-size: 12px;
          color: #0052d9;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .edit-link-inline {
          font-size: 12px;
          color: #0052d9;
          cursor: pointer;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }

        .config-summary {
          font-size: 12px;
          color: #999;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .config-icon-inline {
        color: #666;
        cursor: pointer;
        transition: all 0.2s;
        flex-shrink: 0;

        &:hover {
          color: #0052d9;
          transform: scale(1.15);
        }
      }

      .delete-icon-inline {
        color: #666;
        cursor: pointer;
        transition: all 0.2s;
        flex-shrink: 0;

        &:hover {
          color: #e34d59;
          transform: scale(1.15);
        }
      }
    }
  }
}
</style>
