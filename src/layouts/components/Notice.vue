<template>
  <t-popup
    expand-animation
    placement="bottom-right"
    trigger="click"
    :visible="isNoticeVisible"
    @visible-change="onPopupVisibleChange"
  >
    <template #content>
      <div class="header-msg">
        <div class="header-msg-top">
          <p>{{ $t('page.notice.notice_title') }}</p>
          <t-button v-if="currentList.length > 0" class="clear-btn" variant="text" theme="primary" @click="setRead('tab')"
            >{{ $t('page.notice.clear') }}</t-button
          >
        </div>

        <!-- 防护告警与系统消息性质完全不同：一个是外面来的攻击，一个是软件自己的事。
             混在一列里，攻击一多就会把连接异常冲走 -->
        <div class="msg-tabs">
          <div :class="['msg-tab', { active: activeTab === 'guard' }]" @click="switchTab('guard')">
            <span>{{ $t('page.notice.tab_guard') }}</span>
            <span v-if="guardMsg.length" :class="['tab-count', { mute: activeTab !== 'guard' }]">{{ guardMsg.length }}</span>
          </div>
          <div :class="['msg-tab', { active: activeTab === 'system' }]" @click="switchTab('system')">
            <span>{{ $t('page.notice.tab_system') }}</span>
            <span v-if="systemMsg.length" :class="['tab-count', { mute: activeTab !== 'system' }]">{{ systemMsg.length }}</span>
          </div>
        </div>

        <t-list v-if="currentList.length > 0" class="narrow-scrollbar" :split="true">
          <t-list-item v-for="(item, index) in currentList" :key="item.message_id || index">
            <div>
              <p class="msg-content">
                <span v-if="item.message_local" class="msg-tag net">{{ $t('page.notice.kind_net') }}</span>
                <span v-else-if="activeTab === 'system'" class="msg-tag ops">{{ $t('page.notice.kind_ops') }}</span>
                {{ item.message_data }}
                <span v-if="item.message_count > 1" class="msg-count">{{ item.message_count }}</span>
              </p>
              <p class="msg-type">{{ item.message_type }}</p>
            </div>
            <p class="msg-time">{{ item.message_datetime }}</p>
            <template #action>
              <t-button size="small" variant="outline" @click="setRead('radio', item)"> {{ $t('page.notice.set_read') }} </t-button>
            </template>
          </t-list-item>
        </t-list>

        <div v-else class="empty-list">
          <empty-nothing-icon class="empty-icon" />
          <p>{{ $t('page.notice.empty') }}</p>
        </div>
        <div class="header-msg-bottom">
          <t-button
            v-if="currentList.length > 0"
            class="header-msg-bottom-link"
            variant="text"
            theme="primary"
            @click="goDetail"
            >{{ $t('page.notice.all') }}</t-button
          >
        </div>
      </div>
    </template>
    <t-badge :count="unreadMsg.length" :offset="[15, 21]">
      <!-- 顶栏不放独立的连接状态灯：有连接异常时让铃铛本身变色，不额外占位置 -->
      <t-button
        :class="['notice-bell', { 'has-net-error': netUnreadCount > 0 }]"
        theme="default"
        shape="square"
        variant="text"
        :title="bellTitle"
        @click="isNoticeVisible = true"
      >
        <NotificationIcon />
      </t-button>
    </t-badge>
  </t-popup>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState, mapGetters } from 'vuex';
import { MailIcon,NotificationIcon } from 'tdesign-icons-vue';

import EmptyNothingIcon from '@/assets/assets-empty-nothing.svg';
import { NotificationItem } from '@/interface';

export default Vue.extend({
  components: {
    MailIcon,
    NotificationIcon,
    EmptyNothingIcon
  },
  data() {
    return {
      isNoticeVisible: false,
      // 为空表示「跟随默认规则」，用户手点过之后才固定下来
      pickedTab: '',
    };
  },
  computed: {
    ...mapState('notification', ['msgData']),
    ...mapGetters('notification', ['unreadMsg', 'guardMsg', 'systemMsg', 'netUnreadCount']),
    // 连不上后端的时候，用户点开铃铛最想知道的就是这件事，不该让他再点一下页签
    activeTab(): string {
      if (this.pickedTab) return this.pickedTab;
      return this.netUnreadCount > 0 ? 'system' : 'guard';
    },
    currentList(): Array<any> {
      return this.activeTab === 'guard' ? this.guardMsg : this.systemMsg;
    },
    bellTitle(): string {
      return this.netUnreadCount > 0
        ? this.$t('page.notice.net_error_tip', { count: this.netUnreadCount })
        : this.$t('page.notice.notice_title');
    },
  },
  methods: {
    switchTab(tab: string) {
      this.pickedTab = tab;
    },
    onPopupVisibleChange(visible: boolean, context) {
      if (context.trigger === 'trigger-element-click') {
        this.isNoticeVisible = true;
        return;
      }
      this.isNoticeVisible = visible;
      // 关掉面板就把选择交回默认规则，下次打开仍能自动落到有异常的那一侧
      if (!visible) this.pickedTab = '';
    },
    goDetail() {
      // 两类消息的归档去处不同：攻击看日志页，系统消息看通知中心
      this.$router.push(this.activeTab === 'guard' ? '/waf/wafattacklog' : '/detail/secondary');
      this.isNoticeVisible = false;
    },
    setRead(type: string, item?: NotificationItem) {
      // 只作用于当前页签：防护告警是安全记录、系统消息是状态回声，
      // 一个按钮把两类一起抹掉，用户不敢点
      if (type === 'tab') {
        this.$store.commit('notification/markCategoryRead', this.activeTab);
        return;
      }
      const changeMsg = this.msgData;
      changeMsg.forEach((e) => {
        if (e.message_id === item.message_id) {
          e.message_unread_status = false;
        }
      });
      this.$store.commit('notification/setMsgData', changeMsg);
    },
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables.less';

.header-msg {
  width: 400px;
  height: 500px;

  // 104 = 顶部 56 + 底部 48；加了页签栏之后再让出 38
  .empty-list {
    height: calc(100% - 142px);
    text-align: center;
    padding-top: 110px;
    font-size: 14px;
    color: var(--td-text-color-secondary);

    .empty-icon {
      width: 63px;
      height: 63px;
    }

    p {
      margin-top: 30px;
    }
  }

  &-top {
    position: relative;
    height: 56px;
    font-size: 16px;
    color: var(--td-text-color-primary);
    text-align: center;
    line-height: 56px;
    border-bottom: 1px solid var(--td-component-border);

    .clear-btn {
      position: absolute;
      top: 12px;
      right: 24px;
    }
  }

  &-bottom {
    height: 48px;
    align-items: center;
    display: flex;
    justify-content: center;

    &-link {
      text-decoration: none;
      font-size: 14px;
      color: var(--td-brand-color);
      line-height: 48px;
      cursor: pointer;
    }
  }

  .t-list {
    height: calc(100% - 142px);
  }

  .t-list-item {
    overflow: hidden;
    width: 100%;
    padding: 16px 24px;
    border-radius: @border-radius;
    font-size: 14px;
    color: var(--td-text-color-primary);
    line-height: 22px;
    cursor: pointer;

    &:hover {
      transition: background 0.2s ease;
      background: var(--td-bg-color-container-hover);

      .msg-content {
        color: var(--td-brand-color-8);
      }

      .t-list-item__action {
        button {
          bottom: 16px;
          opacity: 1;
        }
      }

      .msg-time {
        bottom: -6px;
        opacity: 0;
      }
    }

    .msg-content {
      margin-bottom: 16px;
    }

    .msg-type {
      color: var(--td-text-color-secondary);
    }

    .t-list-item__action {
      button {
        opacity: 0;
        position: absolute;
        right: 24px;
        bottom: -6px;
      }
    }

    .msg-time {
      transition: all 0.2s ease;
      opacity: 1;
      position: absolute;
      right: 24px;
      bottom: 16px;
      color: var(--td-text-color-secondary);
    }
  }

  // ---- 分类页签 ----
  .msg-tabs {
    display: flex;
    padding: 0 16px;
    height: 38px;
    border-bottom: 1px solid var(--td-component-border);
  }

  .msg-tab {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0 12px;
    font-size: 14px;
    color: var(--td-text-color-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;

    &.active {
      color: var(--td-brand-color);
      font-weight: 600;
      border-bottom-color: var(--td-brand-color);
    }
  }

  .tab-count {
    background: var(--td-error-color);
    color: #fff;
    font-size: 10px;
    line-height: 15px;
    min-width: 15px;
    text-align: center;
    border-radius: 8px;
    padding: 0 4px;

    &.mute {
      background: var(--td-text-color-placeholder);
    }
  }

  // 「连接 / 运维」小标签：同在系统页签里，来源不同
  .msg-tag {
    display: inline-block;
    font-size: 11px;
    line-height: 16px;
    border-radius: 2px;
    padding: 0 5px;
    margin-right: 6px;
    vertical-align: 1px;

    &.net {
      background: var(--td-warning-color-light);
      color: var(--td-warning-color-7);
    }

    &.ops {
      background: var(--td-success-color-light);
      color: var(--td-success-color-7);
    }
  }

  // 同一条消息重复出现的次数
  .msg-count {
    display: inline-block;
    background: var(--td-error-color);
    color: #fff;
    font-size: 11px;
    line-height: 16px;
    border-radius: 9px;
    padding: 0 6px;
    margin-left: 6px;
    font-weight: 600;
  }
}

// 有未读连接异常时整颗铃铛套一层浅红底，替代原本设想的顶栏状态灯
.notice-bell.has-net-error {
  background: var(--td-error-color-light);
  color: var(--td-error-color);
}
</style>
