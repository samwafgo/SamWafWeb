<template>
  <div>
    <t-card class="list-card-container">
      <div class="page-header">
        <h3>{{ $t('page.notify_subscription.page_title') }} </h3>
        <p class="page-desc">{{ $t('page.notify_subscription.alert_message') }}</p>
      </div>

      <t-loading :loading="dataLoading" size="large">
        <t-table 
          :data="tableData" 
          :columns="tableColumns" 
          row-key="messageType"
          :bordered="true"
          :hover="true"
          table-layout="auto"
        >
          <!-- 消息类型列 -->
          <template #messageType="{ row }">
            <div class="message-type-cell">
              <div class="message-type-name">{{ row.messageTypeName }}</div>
            </div>
          </template>

          <!-- 钉钉渠道表头 -->
          <template #dingtalk-title>
            <div class="channel-header-wrapper">
              <t-tag theme="primary" size="small">钉钉</t-tag>
              <t-dropdown :min-column-width="120">
                <t-button variant="text" size="small" shape="square">
                  <t-icon name="ellipsis" />
                </t-button>
                <t-dropdown-menu>
                  <t-dropdown-item @click="handleBatchAdd('dingtalk')">
                    <t-icon name="add" /> {{ $t('page.notify_subscription.batch_action_add') }}
                  </t-dropdown-item>
                  <t-dropdown-item @click="handleBatchEnable('dingtalk')">
                    <t-icon name="check-circle" /> {{ $t('page.notify_subscription.batch_action_enable') }}
                  </t-dropdown-item>
                  <t-dropdown-item @click="handleBatchDisable('dingtalk')">
                    <t-icon name="close-circle" /> {{ $t('page.notify_subscription.batch_action_disable') }}
                  </t-dropdown-item>
                  <t-dropdown-item @click="handleBatchDelete('dingtalk')">
                    <t-icon name="delete" /> {{ $t('page.notify_subscription.batch_action_delete') }}
                  </t-dropdown-item>
                </t-dropdown-menu>
              </t-dropdown>
            </div>
          </template>

          <!-- 飞书渠道表头 -->
          <template #feishu-title>
            <div class="channel-header-wrapper">
              <t-tag theme="success" size="small">飞书</t-tag>
              <t-dropdown :min-column-width="120">
                <t-button variant="text" size="small" shape="square">
                  <t-icon name="ellipsis" />
                </t-button>
                <t-dropdown-menu>
                  <t-dropdown-item @click="handleBatchAdd('feishu')">
                    <t-icon name="add" /> {{ $t('page.notify_subscription.batch_action_add') }}
                  </t-dropdown-item>
                  <t-dropdown-item @click="handleBatchEnable('feishu')">
                    <t-icon name="check-circle" /> {{ $t('page.notify_subscription.batch_action_enable') }}
                  </t-dropdown-item>
                  <t-dropdown-item @click="handleBatchDisable('feishu')">
                    <t-icon name="close-circle" /> {{ $t('page.notify_subscription.batch_action_disable') }}
                  </t-dropdown-item>
                  <t-dropdown-item @click="handleBatchDelete('feishu')">
                    <t-icon name="delete" /> {{ $t('page.notify_subscription.batch_action_delete') }}
                  </t-dropdown-item>
                </t-dropdown-menu>
              </t-dropdown>
            </div>
          </template>

          <!-- 邮箱渠道表头 -->
          <template #email-title>
            <div class="channel-header-wrapper">
              <t-tag theme="warning" size="small">邮箱</t-tag>
              <t-dropdown :min-column-width="120">
                <t-button variant="text" size="small" shape="square">
                  <t-icon name="ellipsis" />
                </t-button>
                <t-dropdown-menu>
                  <t-dropdown-item @click="handleBatchAdd('email')">
                    <t-icon name="add" /> {{ $t('page.notify_subscription.batch_action_add') }}
                  </t-dropdown-item>
                  <t-dropdown-item @click="handleBatchEnable('email')">
                    <t-icon name="check-circle" /> {{ $t('page.notify_subscription.batch_action_enable') }}
                  </t-dropdown-item>
                  <t-dropdown-item @click="handleBatchDisable('email')">
                    <t-icon name="close-circle" /> {{ $t('page.notify_subscription.batch_action_disable') }}
                  </t-dropdown-item>
                  <t-dropdown-item @click="handleBatchDelete('email')">
                    <t-icon name="delete" /> {{ $t('page.notify_subscription.batch_action_delete') }}
                  </t-dropdown-item>
                </t-dropdown-menu>
              </t-dropdown>
            </div>
          </template>

          <!-- Server酱渠道表头 -->
          <template #serverchan-title>
            <div class="channel-header-wrapper">
              <t-tag theme="danger" size="small">Server酱</t-tag>
              <t-dropdown :min-column-width="120">
                <t-button variant="text" size="small" shape="square">
                  <t-icon name="ellipsis" />
                </t-button>
                <t-dropdown-menu>
                  <t-dropdown-item @click="handleBatchAdd('serverchan')">
                    <t-icon name="add" /> {{ $t('page.notify_subscription.batch_action_add') }}
                  </t-dropdown-item>
                  <t-dropdown-item @click="handleBatchEnable('serverchan')">
                    <t-icon name="check-circle" /> {{ $t('page.notify_subscription.batch_action_enable') }}
                  </t-dropdown-item>
                  <t-dropdown-item @click="handleBatchDisable('serverchan')">
                    <t-icon name="close-circle" /> {{ $t('page.notify_subscription.batch_action_disable') }}
                  </t-dropdown-item>
                  <t-dropdown-item @click="handleBatchDelete('serverchan')">
                    <t-icon name="delete" /> {{ $t('page.notify_subscription.batch_action_delete') }}
                  </t-dropdown-item>
                </t-dropdown-menu>
              </t-dropdown>
            </div>
          </template>

          <!-- 企业微信渠道表头 -->
          <template #wechatwork-title>
            <div class="channel-header-wrapper">
              <t-tag theme="primary" size="small">企业微信</t-tag>
              <t-dropdown :min-column-width="120">
                <t-button variant="text" size="small" shape="square">
                  <t-icon name="ellipsis" />
                </t-button>
                <t-dropdown-menu>
                  <t-dropdown-item @click="handleBatchAdd('wechatwork')">
                    <t-icon name="add" /> {{ $t('page.notify_subscription.batch_action_add') }}
                  </t-dropdown-item>
                  <t-dropdown-item @click="handleBatchEnable('wechatwork')">
                    <t-icon name="check-circle" /> {{ $t('page.notify_subscription.batch_action_enable') }}
                  </t-dropdown-item>
                  <t-dropdown-item @click="handleBatchDisable('wechatwork')">
                    <t-icon name="close-circle" /> {{ $t('page.notify_subscription.batch_action_disable') }}
                  </t-dropdown-item>
                  <t-dropdown-item @click="handleBatchDelete('wechatwork')">
                    <t-icon name="delete" /> {{ $t('page.notify_subscription.batch_action_delete') }}
                  </t-dropdown-item>
                </t-dropdown-menu>
              </t-dropdown>
            </div>
          </template>

          <!-- 钉钉渠道 -->
          <template #dingtalk="{ row }">
            <div class="channel-cell-content">
              <div v-for="channel in row.channels.dingtalk" :key="channel.id" class="channel-item-inline">
                <div v-if="!channel.subscription" class="add-btn-inline">
                  <t-button size="small" variant="dashed" :disabled="channel.status === 0" @click="handleAddSubscription(row.messageType, channel)">
                    <t-icon name="add" size="14px" />
                    {{ channel.name }}
                  </t-button>
                </div>
                <div v-else class="subscription-inline">
                  <t-switch :value="channel.subscription.status === 1" :disabled="channel.status === 0" @change="(val) => handleChannelToggle(row.messageType, channel, val)" size="small" />
                  <div class="channel-info-inline">
                    <span class="channel-name">{{ channel.name }}</span>
                  </div>
                  <t-icon name="close-circle-filled" size="16px" class="delete-icon-inline" @click="handleDeleteSubscription(row.messageType, channel.id)" />
                </div>
              </div>
            </div>
          </template>

          <!-- 飞书渠道 -->
          <template #feishu="{ row }">
            <div class="channel-cell-content">
              <div v-for="channel in row.channels.feishu" :key="channel.id" class="channel-item-inline">
                <div v-if="!channel.subscription" class="add-btn-inline">
                  <t-button size="small" variant="dashed" :disabled="channel.status === 0" @click="handleAddSubscription(row.messageType, channel)">
                    <t-icon name="add" size="14px" />
                    {{ channel.name }}
                  </t-button>
                </div>
                <div v-else class="subscription-inline">
                  <t-switch :value="channel.subscription.status === 1" :disabled="channel.status === 0" @change="(val) => handleChannelToggle(row.messageType, channel, val)" size="small" />
                  <div class="channel-info-inline">
                    <span class="channel-name">{{ channel.name }}</span>
                  </div>
                  <t-icon name="close-circle-filled" size="16px" class="delete-icon-inline" @click="handleDeleteSubscription(row.messageType, channel.id)" />
                </div>
              </div>
            </div>
          </template>

          <!-- 邮箱渠道 -->
          <template #email="{ row }">
            <div class="channel-cell-content">
              <div v-for="channel in row.channels.email" :key="channel.id" class="channel-item-inline">
                <div v-if="!channel.subscription" class="add-btn-inline">
                  <t-button size="small" variant="dashed" :disabled="channel.status === 0" @click="handleAddSubscription(row.messageType, channel)">
                    <t-icon name="add" size="14px" />
                    {{ channel.name }}
                  </t-button>
                </div>
                <div v-else class="subscription-inline">
                  <t-switch :value="channel.subscription.status === 1" :disabled="channel.status === 0" @change="(val) => handleChannelToggle(row.messageType, channel, val)" size="small" />
                  <div class="channel-info-inline">
                    <span class="channel-name">{{ channel.name }}</span>
                    <span v-if="channel.subscription.recipients" class="channel-detail">{{ channel.subscription.recipients }}</span>
                    <a class="edit-link-inline" @click="handleEditRecipients(row.messageType, channel)">修改</a>
                  </div>
                  <t-icon name="close-circle-filled" size="16px" class="delete-icon-inline" @click="handleDeleteSubscription(row.messageType, channel.id)" />
                </div>
              </div>
            </div>
          </template>

          <!-- Server酱渠道 -->
          <template #serverchan="{ row }">
            <div class="channel-cell-content">
              <div v-for="channel in row.channels.serverchan" :key="channel.id" class="channel-item-inline">
                <div v-if="!channel.subscription" class="add-btn-inline">
                  <t-button size="small" variant="dashed" :disabled="channel.status === 0" @click="handleAddSubscription(row.messageType, channel)">
                    <t-icon name="add" size="14px" />
                    {{ channel.name }}
                  </t-button>
                </div>
                <div v-else class="subscription-inline">
                  <t-switch :value="channel.subscription.status === 1" :disabled="channel.status === 0" @change="(val) => handleChannelToggle(row.messageType, channel, val)" size="small" />
                  <div class="channel-info-inline">
                    <span class="channel-name">{{ channel.name }}</span>
                  </div>
                  <t-icon name="close-circle-filled" size="16px" class="delete-icon-inline" @click="handleDeleteSubscription(row.messageType, channel.id)" />
                </div>
              </div>
            </div>
          </template>

          <!-- 企业微信渠道 -->
          <template #wechatwork="{ row }">
            <div class="channel-cell-content">
              <div v-for="channel in row.channels.wechatwork" :key="channel.id" class="channel-item-inline">
                <div v-if="!channel.subscription" class="add-btn-inline">
                  <t-button size="small" variant="dashed" :disabled="channel.status === 0" @click="handleAddSubscription(row.messageType, channel)">
                    <t-icon name="add" size="14px" />
                    {{ channel.name }}
                  </t-button>
                </div>
                <div v-else class="subscription-inline">
                  <t-switch :value="channel.subscription.status === 1" :disabled="channel.status === 0" @change="(val) => handleChannelToggle(row.messageType, channel, val)" size="small" />
                  <div class="channel-info-inline">
                    <span class="channel-name">{{ channel.name }}</span>
                  </div>
                  <t-icon name="close-circle-filled" size="16px" class="delete-icon-inline" @click="handleDeleteSubscription(row.messageType, channel.id)" />
                </div>
              </div>
            </div>
          </template>
        </t-table>
      </t-loading>
    </t-card>

    <!-- 邮箱收件人配置对话框 -->
    <t-dialog 
      :header="'配置邮件收件人 - ' + getChannelName(emailFormData.channel_id)" 
      :visible.sync="emailDialogVisible" 
      :width="600" 
      :footer="false"
    >
      <div slot="body">
        <t-form :data="emailFormData" ref="emailForm" @submit="onEmailSubmit" :labelWidth="120">
          <t-form-item :label="$t('page.notify_subscription.label_message_type')">
            <t-tag theme="primary">{{ getMessageTypeName(emailFormData.message_type) }}</t-tag>
          </t-form-item>
          <t-form-item :label="$t('page.notify_subscription.label_recipients')" name="recipients">
            <t-input 
              :style="{ width: '100%' }" 
              v-model="emailFormData.recipients" 
              :placeholder="$t('page.notify_subscription.recipients_placeholder')"
            />
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              💡 <b>可选</b>：为此订阅单独指定收件人（多个邮箱用逗号分隔），不填则用渠道默认值
            </div>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onEmailDialogClose">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 删除确认对话框 -->
    <t-dialog 
      :header="$t('common.confirm_delete')" 
      :body="confirmBody" 
      :visible.sync="confirmVisible" 
      @confirm="onConfirmDelete" 
      :onCancel="onCancel"
    >
    </t-dialog>

    <!-- 批量操作确认对话框 -->
    <t-dialog 
      :header="batchConfirmType === 'delete' ? $t('page.notify_subscription.batch_delete_confirm', { channel: batchConfirmChannelName }) : $t('page.notify_subscription.batch_disable_confirm', { channel: batchConfirmChannelName })" 
      :body="batchConfirmType === 'delete' ? $t('page.notify_subscription.batch_delete_confirm_content') : $t('page.notify_subscription.batch_disable_confirm_content')" 
      :visible.sync="batchConfirmVisible" 
      @confirm="onBatchConfirm" 
      :confirm-btn="$t('common.confirm')"
      :cancel-btn="$t('common.cancel')"
    >
    </t-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { MessagePlugin, DialogPlugin } from 'tdesign-vue';
import {
  getNotifySubscriptionList,
  addNotifySubscription,
  editNotifySubscription,
  deleteNotifySubscription,
} from '@/apis/notify_subscription';
import { getNotifyChannelList } from '@/apis/notify_channel';

export default Vue.extend({
  name: 'NotifySubscription',
  data() {
    return {
      dataLoading: false,
      channelList: [],
      subscriptionList: [],
      channelTypes: [
        { type: 'dingtalk', name: '钉钉', theme: 'primary' },
        { type: 'feishu', name: '飞书', theme: 'success' },
        { type: 'email', name: '邮箱', theme: 'warning' },
        { type: 'serverchan', name: 'Server酱', theme: 'danger' },
        { type: 'wechatwork', name: '企业微信', theme: 'primary' },
      ],
      messageTypes: [
        {
          type: 'user_login',
          name: this.$t('page.notify_subscription.message_type_user_login'),
        },
        {
          type: 'rule_trigger',
          name: this.$t('page.notify_subscription.message_type_rule_trigger'),
        },
        {
          type: 'ip_ban',
          name: this.$t('page.notify_subscription.message_type_ip_ban'),
        },
        {
          type: 'attack_info',
          name: this.$t('page.notify_subscription.message_type_attack_info'),
        },
        {
          type: 'ssl_expire',
          name: this.$t('page.notify_subscription.message_type_ssl_expire'),
        },
        {
          type: 'weekly_report',
          name: this.$t('page.notify_subscription.message_type_weekly_report'),
        },
        {
          type: 'system_error',
          name: this.$t('page.notify_subscription.message_type_system_error'),
        },
        {
          type: 'operation_notice',
          name: this.$t('page.notify_subscription.message_type_operation_notice'),
        },
      ],
      emailDialogVisible: false,
      emailFormData: {
        subscription_id: '',
        message_type: '',
        channel_id: '',
        recipients: '',
        status: 1,
      } as any,
      addChannelDialogVisible: false,
      addChannelType: '',
      confirmVisible: false,
      confirmBody: '',
      formEditData: {} as any,
      // 批量操作确认对话框
      batchConfirmVisible: false,
      batchConfirmType: '', // 'delete' or 'disable'
      batchConfirmChannelType: '',
      batchConfirmChannelName: '',
    };
  },
  computed: {
    tableColumns() {
      const columns: any[] = [
        {
          colKey: 'messageType',
          title: this.$t('page.notify_subscription.label_message_type'),
          width: 200,
          fixed: 'left',
        },
      ];
      
      // 动态添加渠道类型列
      this.channelTypes.forEach((channelType: any) => {
        columns.push({
          colKey: channelType.type,
          title: `${channelType.type}-title`, // 指定title slot名称
          minWidth: 180,
        });
      });
      
      return columns;
    },
    tableData() {
      return this.messageTypes.map((msgType: any) => {
        const row: any = {
          messageType: msgType.type,
          messageTypeName: msgType.name,
          channels: {},
        };
        
        // 为每个渠道类型收集该类型的所有渠道及其订阅状态
        this.channelTypes.forEach((channelType: any) => {
          const channelsOfType = this.channelList
            .filter((ch: any) => ch.type === channelType.type)
            .map((channel: any) => {
              const subscription = this.subscriptionList.find(
                (sub: any) => sub.message_type === msgType.type && sub.channel_id === channel.id
              );
              return {
                ...channel,
                subscription: subscription || null,
              };
            });
          row.channels[channelType.type] = channelsOfType;
        });
        
        return row;
      });
    },
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      this.dataLoading = true;
      try {
        await Promise.all([
          this.loadChannelList(),
          this.loadSubscriptionList(),
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        this.dataLoading = false;
      }
    },
    async loadChannelList() {
      try {
        const res = await getNotifyChannelList({ pageIndex: 1, pageSize: 100 });
        if (res.code === 0) {
          this.channelList = res.data.list || [];
        }
      } catch (e) {
        console.error(e);
      }
    },
    async loadSubscriptionList() {
      try {
        const res = await getNotifySubscriptionList({ pageIndex: 1, pageSize: 100000 });
        if (res.code === 0) {
          this.subscriptionList = res.data.list || [];
        }
      } catch (e) {
        console.error(e);
      }
    },
    getChannelsByType(type: string) {
      return this.channelList.filter((c: any) => c.type === type);
    },
    isSubscribed(messageType: string, channelId: string) {
      return this.subscriptionList.some(
        (sub: any) => sub.message_type === messageType && sub.channel_id === channelId && sub.status === 1
      );
    },
    getSubscription(messageType: string, channelId: string) {
      return this.subscriptionList.find(
        (sub: any) => sub.message_type === messageType && sub.channel_id === channelId
      );
    },
    getSubscriptionInfo(messageType: string, channelId: string) {
      const sub = this.getSubscription(messageType, channelId);
      if (sub && sub.recipients) {
        return sub.recipients;
      }
      return '';
    },
    getChannelType(channelId: string) {
      const channel = this.channelList.find((c: any) => c.id === channelId);
      return channel ? channel.type : '';
    },
    getChannelName(channelId: string) {
      const channel = this.channelList.find((c: any) => c.id === channelId);
      return channel ? channel.name : '';
    },
    getMessageTypeName(type: string) {
      const msgType = this.messageTypes.find((m: any) => m.type === type);
      return msgType ? msgType.name : type;
    },
    async onConfirmDelete() {
      if (this.formEditData && this.formEditData.id) {
        await this.deleteSubscription(this.formEditData.id);
        this.confirmVisible = false;
      }
    },
    onCancel() {
      this.confirmVisible = false;
    },
    handleAddSubscription(messageType: string, channel: any) {
      // 如果渠道被禁用，不允许添加
      if (channel.status === 0) {
        MessagePlugin.warning('该渠道已被禁用，无法添加订阅');
        return;
      }
      
      // 邮箱渠道需要配置收件人
      if (channel.type === 'email') {
        this.emailFormData = {
          subscription_id: '', // 新增订阅，ID为空
          message_type: messageType,
          channel_id: channel.id,
          recipients: '',
          status: 1,
        };
        this.emailDialogVisible = true;
      } else {
        // 其他渠道直接添加
        this.addSubscription(messageType, channel.id, '');
      }
    },
    handleEditRecipients(messageType: string, channel: any) {
      const subscription = this.getSubscription(messageType, channel.id);
      this.emailFormData = {
        subscription_id: subscription?.id || '', // 添加订阅ID
        message_type: messageType,
        channel_id: channel.id,
        recipients: subscription?.recipients || '',
        status: 1,
      };
      this.emailDialogVisible = true;
    },
    async handleChannelToggle(messageType: string, channel: any, enabled: boolean) {
      const subscription = this.getSubscription(messageType, channel.id);
      
      if (!subscription) {
        // 不应该发生这种情况，因为没有订阅时显示的是+号
        MessagePlugin.warning('订阅不存在');
        return;
      }
      
      // 切换启用/禁用状态
      subscription.status = enabled ? 1 : 0;
      try {
        const res = await editNotifySubscription(subscription);
        if (res.code === 0) {
          MessagePlugin.success(enabled ? '已启用订阅' : '已禁用订阅');
          await this.loadSubscriptionList();
        } else {
          MessagePlugin.error(res.msg || '操作失败');
          await this.loadSubscriptionList();
        }
      } catch (error) {
        MessagePlugin.error('操作失败');
        await this.loadSubscriptionList();
      }
    },
    handleDeleteSubscription(messageType: string, channelId: string) {
      const subscription = this.getSubscription(messageType, channelId);
      if (!subscription) return;
      
      // 使用t-dialog的确认对话框
      this.formEditData = subscription;
      this.confirmBody = '确定要删除这个订阅吗？';
      this.confirmVisible = true;
    },
    async addSubscription(messageType: string, channelId: string, recipients: string, silent = false) {
      try {
        const data = {
          message_type: messageType,
          channel_id: channelId,
          recipients: recipients,
          status: 1,
          filter_json: '',
          remarks: '',
        };
        
        const res = await addNotifySubscription(data);
        if (res.code === 0) {
          if (!silent) {
            MessagePlugin.success(this.$t('page.notify_subscription.add_success'));
          }
          await this.loadSubscriptionList();
          return true;
        } else {
          if (!silent) {
            MessagePlugin.error(res.msg || this.$t('page.notify_subscription.add_failed'));
          }
          await this.loadSubscriptionList();
          return false;
        }
      } catch (error) {
        console.error(error);
        if (!silent) {
          MessagePlugin.error(this.$t('page.notify_subscription.add_failed'));
        }
        await this.loadSubscriptionList();
        return false;
      }
    },
    async updateSubscription(subscriptionId: string, recipients: string) {
      try {
        // 获取完整的订阅信息
        const subscription = this.subscriptionList.find((s: any) => s.id === subscriptionId);
        if (!subscription) {
          MessagePlugin.error('订阅信息不存在');
          return;
        }
        
        const data = {
          id: subscriptionId,
          message_type: subscription.message_type,
          channel_id: subscription.channel_id,
          recipients: recipients,
          status: subscription.status,
          filter_json: subscription.filter_json || '',
          remarks: subscription.remarks || '',
        };
        
        const res = await editNotifySubscription(data);
        if (res.code === 0) {
          MessagePlugin.success('修改收件人成功');
          await this.loadSubscriptionList();
        } else {
          MessagePlugin.error(res.msg || '修改收件人失败');
          await this.loadSubscriptionList();
        }
      } catch (error) {
        console.error(error);
        MessagePlugin.error('修改收件人失败');
        await this.loadSubscriptionList();
      }
    },
    async deleteSubscription(subscriptionId: string, silent = false) {
      try {
        const res = await deleteNotifySubscription({ id: subscriptionId });
        if (res.code === 0) {
          if (!silent) {
            MessagePlugin.success(this.$t('page.notify_subscription.delete_success'));
          }
          await this.loadSubscriptionList();
          return true;
        } else {
          if (!silent) {
            MessagePlugin.error(res.msg || this.$t('page.notify_subscription.delete_failed'));
          }
          await this.loadSubscriptionList();
          return false;
        }
      } catch (error) {
        console.error(error);
        if (!silent) {
          MessagePlugin.error(this.$t('page.notify_subscription.delete_failed'));
        }
        await this.loadSubscriptionList();
        return false;
      }
    },
    async onEmailSubmit({ validateResult, firstError }: any) {
      if (validateResult === true) {
        // 判断是新增还是编辑
        if (this.emailFormData.subscription_id) {
          // 编辑现有订阅
          await this.updateSubscription(
            this.emailFormData.subscription_id,
            this.emailFormData.recipients
          );
        } else {
          // 新增订阅
          await this.addSubscription(
            this.emailFormData.message_type,
            this.emailFormData.channel_id,
            this.emailFormData.recipients
          );
        }
        this.emailDialogVisible = false;
      } else {
        if (firstError) {
          MessagePlugin.warning(firstError);
        }
      }
    },
    onEmailDialogClose() {
      this.emailDialogVisible = false;
      this.loadSubscriptionList();
    },
    // 批量增加订阅
    async handleBatchAdd(channelType: string) {
      const channelsOfType = this.getChannelsByType(channelType);
      if (channelsOfType.length === 0) {
        MessagePlugin.warning(`当前没有可用的${this.getChannelTypeName(channelType)}渠道`);
        return;
      }
      
      let successCount = 0;
      let failCount = 0;
      
      // 为所有消息类型和该类型的所有渠道添加订阅
      for (const messageType of this.messageTypes) {
        for (const channel of channelsOfType) {
          const subscription = this.getSubscription(messageType.type, channel.id);
          if (!subscription && channel.status === 1) {
            const result = await this.addSubscription(messageType.type, channel.id, '', true); // silent模式
            if (result) {
              successCount++;
            } else {
              failCount++;
            }
          }
        }
      }
      
      // 显示汇总结果
      if (successCount > 0 || failCount > 0) {
        const channelName = this.getChannelTypeName(channelType);
        if (failCount === 0) {
          MessagePlugin.success(this.$t('page.notify_subscription.batch_add_success', { channel: channelName, count: successCount }));
        } else if (successCount === 0) {
          MessagePlugin.error(this.$t('page.notify_subscription.batch_add_failed', { channel: channelName, count: failCount }));
        } else {
          MessagePlugin.warning(this.$t('page.notify_subscription.batch_add_partial', { channel: channelName, success: successCount, fail: failCount }));
        }
      } else {
        MessagePlugin.info(this.$t('page.notify_subscription.batch_add_already_exist', { channel: this.getChannelTypeName(channelType) }));
      }
    },
    // 批量删除订阅
    async handleBatchDelete(channelType: string) {
      const channelsOfType = this.getChannelsByType(channelType);
      if (channelsOfType.length === 0) {
        MessagePlugin.warning(`当前没有${this.getChannelTypeName(channelType)}渠道的订阅`);
        return;
      }
      
      const subscriptionsToDelete: string[] = [];
      for (const channel of channelsOfType) {
        for (const subscription of this.subscriptionList) {
          if (subscription.channel_id === channel.id) {
            subscriptionsToDelete.push(subscription.id);
          }
        }
      }
      
      if (subscriptionsToDelete.length === 0) {
        MessagePlugin.warning(`当前没有${this.getChannelTypeName(channelType)}渠道的订阅`);
        return;
      }
      
      // 显示确认对话框
      this.batchConfirmType = 'delete';
      this.batchConfirmChannelType = channelType;
      this.batchConfirmChannelName = this.getChannelTypeName(channelType);
      this.batchConfirmVisible = true;
    },
    // 批量开启订阅
    async handleBatchEnable(channelType: string) {
      const channelsOfType = this.getChannelsByType(channelType);
      if (channelsOfType.length === 0) {
        MessagePlugin.warning(`当前没有${this.getChannelTypeName(channelType)}渠道的订阅`);
        return;
      }
      
      // 先检查该渠道类型是否有订阅
      let totalCount = 0;
      let updatedCount = 0;
      for (const channel of channelsOfType) {
        for (const subscription of this.subscriptionList) {
          if (subscription.channel_id === channel.id) {
            totalCount++;
            if (subscription.status === 0) {
              await this.toggleSubscriptionStatus(subscription.id, 1);
              updatedCount++;
            }
          }
        }
      }
      
      const channelName = this.getChannelTypeName(channelType);
      if (totalCount === 0) {
        MessagePlugin.info(this.$t('page.notify_subscription.batch_enable_no_subscription', { channel: channelName }));
      } else if (updatedCount === 0) {
        MessagePlugin.info(this.$t('page.notify_subscription.batch_enable_all_enabled', { channel: channelName, count: totalCount }));
      } else {
        MessagePlugin.success(this.$t('page.notify_subscription.batch_enable_success', { channel: channelName, count: updatedCount }));
      }
    },
    // 批量禁用订阅
    async handleBatchDisable(channelType: string) {
      const channelsOfType = this.getChannelsByType(channelType);
      if (channelsOfType.length === 0) {
        MessagePlugin.warning(`当前没有${this.getChannelTypeName(channelType)}渠道的订阅`);
        return;
      }
      
      // 先检查该渠道类型是否有订阅以及需要禁用的订阅数量
      let totalCount = 0;
      let toDisableCount = 0;
      const channelName = this.getChannelTypeName(channelType);
      
      for (const channel of channelsOfType) {
        for (const subscription of this.subscriptionList) {
          if (subscription.channel_id === channel.id) {
            totalCount++;
            if (subscription.status === 1) {
              toDisableCount++;
            }
          }
        }
      }
      
      if (totalCount === 0) {
        MessagePlugin.info(this.$t('page.notify_subscription.batch_disable_no_subscription', { channel: channelName }));
        return;
      }
      
      if (toDisableCount === 0) {
        MessagePlugin.info(this.$t('page.notify_subscription.batch_disable_all_disabled', { channel: channelName, count: totalCount }));
        return;
      }
      
      // 显示确认对话框
      this.batchConfirmType = 'disable';
      this.batchConfirmChannelType = channelType;
      this.batchConfirmChannelName = channelName;
      this.batchConfirmVisible = true;
    },
    // 切换订阅状态
    async toggleSubscriptionStatus(subscriptionId: string, status: number) {
      const subscription = this.subscriptionList.find((s: any) => s.id === subscriptionId);
      if (!subscription) {
        return;
      }
      
      const data = {
        id: subscriptionId,
        message_type: subscription.message_type,
        channel_id: subscription.channel_id,
        recipients: subscription.recipients || '',
        status: status,
        filter_json: subscription.filter_json || '',
        remarks: subscription.remarks || '',
      };
      
      await editNotifySubscription(data);
      await this.loadSubscriptionList();
    },
    // 获取渠道类型名称
    getChannelTypeName(channelType: string) {
      const type = this.channelTypes.find((t: any) => t.type === channelType);
      return type ? type.name : channelType;
    },
    // 批量操作确认处理
    async onBatchConfirm() {
      this.batchConfirmVisible = false;
      
      if (this.batchConfirmType === 'delete') {
        await this.executeBatchDelete();
      } else if (this.batchConfirmType === 'disable') {
        await this.executeBatchDisable();
      }
    },
    // 执行批量删除
    async executeBatchDelete() {
      const channelsOfType = this.getChannelsByType(this.batchConfirmChannelType);
      const subscriptionsToDelete: string[] = [];
      
      for (const channel of channelsOfType) {
        for (const subscription of this.subscriptionList) {
          if (subscription.channel_id === channel.id) {
            subscriptionsToDelete.push(subscription.id);
          }
        }
      }
      
      let successCount = 0;
      let failCount = 0;
      
      for (const id of subscriptionsToDelete) {
        const result = await this.deleteSubscription(id, true);
        if (result) {
          successCount++;
        } else {
          failCount++;
        }
      }
      
      const channelName = this.batchConfirmChannelName;
      if (failCount === 0) {
        MessagePlugin.success(this.$t('page.notify_subscription.batch_delete_success', { channel: channelName, count: successCount }));
      } else if (successCount === 0) {
        MessagePlugin.error(this.$t('page.notify_subscription.batch_delete_failed', { channel: channelName, count: failCount }));
      } else {
        MessagePlugin.warning(this.$t('page.notify_subscription.batch_delete_partial', { channel: channelName, success: successCount, fail: failCount }));
      }
    },
    // 执行批量禁用
    async executeBatchDisable() {
      const channelsOfType = this.getChannelsByType(this.batchConfirmChannelType);
      let updatedCount = 0;
      
      for (const channel of channelsOfType) {
        for (const subscription of this.subscriptionList) {
          if (subscription.channel_id === channel.id && subscription.status === 1) {
            await this.toggleSubscriptionStatus(subscription.id, 0);
            updatedCount++;
          }
        }
      }
      
      if (updatedCount > 0) {
        MessagePlugin.success(this.$t('page.notify_subscription.batch_disable_success', { channel: this.batchConfirmChannelName, count: updatedCount }));
      }
    },
  },
});
</script>

<style lang="less" scoped>
.list-card-container {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
  }
  
  .page-desc {
    margin: 0;
    color: #666;
    font-size: 14px;
  }
}

// 消息类型单元格
.message-type-cell {
  .message-type-name {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
  }
  
  .message-type-code {
    font-size: 12px;
    color: #999;
    font-family: monospace;
  }
}

// 渠道表头包装器
.channel-header-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

// 渠道单元格
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
