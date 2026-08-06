<template>
  <!-- AI 助手：悬浮入口 + 对话抽屉 + 参数设置。放在布局外层，三种布局(side/top/mix)都能用 -->
  <div>
    <t-drawer :visible.sync="aiChatBoxVisible" :closeBtn="true" size="560px" class="ai-chat-drawer">
      <template #header>
        <div class="chat-header">
          <span class="chat-header-title">{{ $t('page.gpt.assistant') }}</span>
          <span v-if="sceneLabel" class="chat-header-scene">{{ sceneLabel }}</span>
          <div class="chat-header-ops">
            <t-tooltip :content="$t('page.gpt.clear_chat')">
              <t-button variant="text" shape="square" size="small"
                        :disabled="questionList.length === 0 || isStreaming" @click="clearMessage">
                <clear-icon />
              </t-button>
            </t-tooltip>
            <t-tooltip :content="$t('page.gpt.config.entry')">
              <t-button variant="text" shape="square" size="small" @click="gptConfigVisible = true">
                <setting-icon />
              </t-button>
            </t-tooltip>
          </div>
        </div>
      </template>

      <div ref="chatContainer" class="chat-container">
        <!-- 检测中：先不给结论，避免闪一下"未配置" -->
        <div v-if="gptChecking && !gptChecked" class="gpt-checking">{{ $t('page.gpt.checking') }}</div>

        <!-- 未配置密钥：不给空白框，直接引导去配置 -->
        <div v-else-if="gptChecked && !gptHasToken" class="gpt-unset">
          <error-circle-icon class="gpt-unset-icon" />
          <div class="gpt-unset-title">{{ $t('page.gpt.unset_title') }}</div>
          <div class="gpt-unset-desc">{{ $t('page.gpt.unset_desc') }}</div>
          <t-button theme="primary" @click="gptConfigVisible = true">{{ $t('page.gpt.unset_action') }}</t-button>
          <div class="gpt-unset-hint">{{ $t('page.gpt.unset_hint') }}</div>
        </div>

        <!-- 空态：告诉用户这里能问什么，点一下就能开聊 -->
        <div v-else-if="questionList.length === 0" class="chat-welcome">
          <div class="welcome-avatar"><logo-android-icon /></div>
          <div class="welcome-title">{{ $t('page.gpt.welcome_title') }}</div>
          <div class="welcome-desc">{{ $t('page.gpt.welcome_desc') }}</div>
          <div class="welcome-suggest-title">{{ $t('page.gpt.suggest_title') }}</div>
          <div class="suggest-list">
            <div class="suggest-item" v-for="(s, sIndex) in suggestions" :key="sIndex"
                 @click="useSuggestion(s)">
              <div class="suggest-main">
                <div class="suggest-label">{{ s.label }}</div>
                <div class="suggest-q">{{ s.q }}</div>
              </div>
              <chevron-right-icon class="suggest-arrow" />
            </div>
          </div>
          <!-- 模型本身不能联网，这两个入口是给用户自己查的 -->
          <div class="welcome-links">
            <t-link theme="primary" hover="color" size="small" :href="docUrl" target="_blank">
              {{ $t('page.gpt.link_doc') }}
            </t-link>
            <span class="welcome-links-split">·</span>
            <t-link theme="primary" hover="color" size="small" :href="issueUrl" target="_blank">
              {{ $t('page.gpt.link_issue') }}
            </t-link>
          </div>
          <div class="welcome-foot">{{ $t('page.gpt.welcome_foot') }}</div>
        </div>

        <template v-else>
          <div v-for="(item, index) in questionList" :key="index"
               class="message-wrapper" :class="item.role">
            <div class="message-bubble">
              <div class="avatar">
                <user-icon v-if="item.role === 'user'" name="user"> </user-icon>
                <logo-android-icon v-else name="robot"/>
              </div>
              <div class="content">
                <!-- 等待首字时给个打字动画，别让用户对着空框猜 -->
                <div v-if="item.loading && !item.content" class="text typing">
                  <span></span><span></span><span></span>
                </div>
                <div v-else v-html="convertMarkdown(item.content)" class="text"></div>
                <div v-if="item.role === 'assistant' && item.content && !item.loading" class="msg-ops">
                  <t-button variant="text" size="small" @click="copyMessage(item.content)">
                    <copy-icon />
                    <span>{{ $t('page.gpt.copy') }}</span>
                  </t-button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <template #footer>
        <div class="input-area">
          <div class="input-box">
            <t-textarea
              v-model="inputMessage"
              :placeholder="gptChecked && !gptHasToken ? $t('page.gpt.unset_send_tip') : $t('page.gpt.chat.chat_placeholder')"
              name="description"
              :autosize="{ minRows: 2,maxRows: 6 }"
              :disabled="isStreaming || (gptChecked && !gptHasToken)"
              @keydown.native="onInputKeydown">
            </t-textarea>
            <div class="input-foot">
              <span class="input-hint">{{ $t('page.gpt.send_hint') }}</span>
              <t-button v-if="gptChecked && !gptHasToken" theme="primary" size="small" @click="gptConfigVisible = true">
                {{ $t('page.gpt.unset_action') }}
              </t-button>
              <t-button v-else-if="!isStreaming" theme="primary" size="small"
                        :disabled="!inputMessage.trim()" @click="sendMessage">
                <send-icon slot="icon" />
                {{ $t('page.gpt.chat.chat_send') }}
              </t-button>
              <t-button v-else theme="danger" variant="outline" size="small" @click="stopStreaming">
                {{ $t('page.gpt.chat.chat_stop') }}
              </t-button>
            </div>
          </div>
        </div>
      </template>
    </t-drawer>

    <!-- AI 参数设置（与规则编排页共用同一个弹窗组件） -->
    <gpt-config-dialog :visible.sync="gptConfigVisible" @saved="onGptConfigSaved" />

    <t-sticky-tool :style="{ position: 'fixed', right: '20px', overflow: 'hidden', height: '70px' }"
                   @click="openChat">
      <t-sticky-item :label="$t('page.gpt.assistant')" :icon="renderChatIcon"/>
    </t-sticky-tool>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { marked } from 'marked';
import {
  ChatIcon, UserIcon, LogoAndroidIcon, ErrorCircleIcon,
  ClearIcon, SettingIcon, CopyIcon, SendIcon, ChevronRightIcon,
} from 'tdesign-icons-vue';

import GptConfigDialog from '@/components/gpt-config/index.vue';
import { fetchChatStream } from '@/utils/eventSource';
import { wafGptConfigGetApi } from '@/apis/gpt';

export default Vue.extend({
  name: 'AiAssistant',
  components: {
    UserIcon,
    LogoAndroidIcon,
    ErrorCircleIcon,
    ClearIcon,
    SettingIcon,
    CopyIcon,
    SendIcon,
    ChevronRightIcon,
    GptConfigDialog,
  },
  data() {
    return {
      aiChatBoxVisible: false,
      questionList: [] as Array<{
        role: 'user' | 'assistant';
        content: string;
        loading?: boolean;
      }>,
      inputMessage: '',
      isStreaming: false,          // 是否正在流式输出
      currentCtrl: null as any,    // AbortController，用于中止流
      streamAborted: false,        // 标记是用户主动中止（区别于网络错误）
      // 当前对话场景，决定后端用哪套系统提示词：
      // general 通用问答（默认）/ security_log 日志安全分析 / owasp_rule OWASP规则解读
      currentScene: 'general',
      gptChecked: false,           // 是否已检测过 AI 配置
      gptChecking: false,          // 正在检测 AI 配置
      gptHasToken: false,          // AI 密钥是否已配置
      gptConfigVisible: false,     // AI 参数设置弹窗
    };
  },
  computed: {
    // 空态里的建议问题：让用户知道这儿能问什么，点一条直接开聊
    suggestions(): Array<{ label: string; q: string }> {
      return [
        { label: this.$t('page.gpt.suggest_1_label'), q: this.$t('page.gpt.suggest_1_q') },
        { label: this.$t('page.gpt.suggest_2_label'), q: this.$t('page.gpt.suggest_2_q') },
        { label: this.$t('page.gpt.suggest_3_label'), q: this.$t('page.gpt.suggest_3_q') },
        { label: this.$t('page.gpt.suggest_4_label'), q: this.$t('page.gpt.suggest_4_q') },
      ];
    },
    // 官方文档（按界面语言给中/英文档）
    docUrl(): string {
      const en = ((this.$i18n && this.$i18n.locale) || '').toLowerCase().indexOf('en') === 0;
      return en ? 'https://doc.samwaf.com/en/' : 'https://doc.samwaf.com/';
    },
    issueUrl(): string {
      return 'https://github.com/samwafgo/SamWaf/issues';
    },
    // 非通用场景时在标题旁标一下，用户知道当前这轮在聊什么
    sceneLabel(): string {
      if (this.currentScene === 'security_log') return this.$t('page.gpt.scene_security_log');
      if (this.currentScene === 'owasp_rule') return this.$t('page.gpt.scene_owasp_rule');
      return '';
    },
  },
  mounted() {
    this.$bus.$on('sendAi', this.onBusSendAi);
  },
  beforeDestroy() {
    this.$bus.$off('sendAi', this.onBusSendAi);
  },
  methods: {
    // 其他页面（日志详情/OWASP规则）把内容甩过来：
    // e 支持两种形式——字符串（老调用，按通用问答处理）或 { q, scene }
    async onBusSendAi(e) {
      console.log('消息总线 来自其他内容 ', e);
      const isObj = e !== null && typeof e === 'object';
      this.clearMessage();
      this.aiChatBoxVisible = true;
      this.currentScene = (isObj && e.scene) ? e.scene : 'general';
      this.inputMessage = isObj ? (e.q || '') : e;
      // 没配密钥就别发了，停在引导页；用户配置完点"发送"即可继续
      const configured = await this.checkGptConfig();
      if (!configured) {
        return;
      }
      this.sendMessage();
    },
    // 将 Markdown 转换为 HTML
    convertMarkdown(content) {
      return this.$purifyHtml(marked.parse(content));
    },
    clearMessage() {
      this.questionList = [];
    },
    // 点建议问题：填进输入框直接发，省一次输入
    useSuggestion(s) {
      if (this.isStreaming) return;
      this.inputMessage = s.q;
      this.sendMessage();
    },
    // Enter 发送、Shift+Enter 换行（输入法组字期间的回车不算）
    onInputKeydown(e) {
      if (e.key !== 'Enter' || e.shiftKey || e.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      if (!this.isStreaming) {
        this.sendMessage();
      }
    },
    copyMessage(content) {
      const ok = () => this.$message.success(this.$t('page.gpt.copied'));
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(content).then(ok).catch(() => this.fallbackCopy(content, ok));
      } else {
        this.fallbackCopy(content, ok);
      }
    },
    fallbackCopy(text, ok) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        ok();
      } catch (e) {
        console.log(e);
      }
      document.body.removeChild(ta);
    },
    // 检测 AI 是否已配置密钥（后端只回 has_token，不下发明文）
    async checkGptConfig() {
      this.gptChecking = true;
      try {
        const res = await wafGptConfigGetApi();
        this.gptHasToken = !!(res && res.code === 0 && res.data && res.data.has_token);
      } catch (e) {
        console.log(e);
        // 拿不到配置时按"未配置"引导，好过给个发不出去的空白对话框
        this.gptHasToken = false;
      } finally {
        this.gptChecked = true;
        this.gptChecking = false;
      }
      return this.gptHasToken;
    },
    // 保存完参数后复检，通过就直接可以聊了
    async onGptConfigSaved() {
      await this.checkGptConfig();
    },
    async sendMessage() {
      if (!this.inputMessage.trim()) return;
      // 发送前兜底：未配置密钥直接弹配置窗，不去请求后端
      if (!this.gptHasToken) {
        const configured = await this.checkGptConfig();
        if (!configured) {
          this.$message.warning(this.$t('page.gpt.unset_send_tip'));
          this.gptConfigVisible = true;
          return;
        }
      }

      const userMessage = this.inputMessage;
      this.inputMessage = '';

      // 添加用户消息
      this.questionList.push({
        role: 'user',
        content: userMessage,
      });

      // 添加机器人消息占位
      this.questionList.push({
        role: 'assistant',
        content: '',
        loading: true,
      });

      this.askQuestion(userMessage);
    },
    askQuestion(q: string) {
      const ctrl = new AbortController();
      this.currentCtrl = ctrl;
      this.isStreaming = true;
      this.streamAborted = false;
      const answerIndex = this.questionList.length - 1;

      fetchChatStream({
        history: this.questionList,
        q,
        scene: this.currentScene,
        ctrl,
        onSuccess: (assistantMessage) => {
          const answer = this.questionList[answerIndex];
          answer.content += assistantMessage.content;
          this.$set(this.questionList, answerIndex, { ...answer });
          this.goChatBottom();
        },
        onComplete: () => {
          this.isStreaming = false;
          this.currentCtrl = null;
          const answer = this.questionList[answerIndex];
          if (answer) {
            answer.loading = false;
            this.$set(this.questionList, answerIndex, { ...answer });
            this.goChatBottom();
          }
        },
        onError: (errorMsg) => {
          this.isStreaming = false;
          this.currentCtrl = null;
          const answer = this.questionList[answerIndex];
          if (this.streamAborted) {
            // 用户主动中止：保留已输出内容，标记为已停止
            if (answer) {
              answer.loading = false;
              if (!answer.content) answer.content = '_(已中止)_';
              this.$set(this.questionList, answerIndex, { ...answer });
              this.goChatBottom();
            }
          } else {
            // 真实错误：在气泡里展示错误，不删消息，让用户看到
            this.$message.error(errorMsg);
            if (answer) {
              answer.loading = false;
              answer.content = answer.content || ('⚠️ ' + errorMsg);
              this.$set(this.questionList, answerIndex, { ...answer });
              this.goChatBottom();
            }
          }
          this.streamAborted = false;
        },
      });
    },
    stopStreaming() {
      if (this.currentCtrl) {
        this.streamAborted = true;     // 先标记，让 onError 知道这是主动中止
        this.currentCtrl.abort();
        this.currentCtrl = null;
      }
      this.isStreaming = false;
    },
    goChatBottom() {
      this.$nextTick(() => {
        const container = this.$refs.chatContainer as HTMLElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },
    openChat(e: any) {
      if (e.item?.label === this.$t('page.gpt.assistant')) {
        this.aiChatBoxVisible = true;
        // 从悬浮球进来且没有历史对话，就是自由提问，别沿用上次日志分析的场景
        if (this.questionList.length === 0) {
          this.currentScene = 'general';
        }
        // 每次打开都检测一次，配置可能在别处（规则编排页/系统配置）刚改过
        this.checkGptConfig();
      }
    },
    renderChatIcon(createElement) {
      return createElement(ChatIcon);
    },
  },
});
</script>

<style scoped>
/* ============ 抽屉标题栏 ============ */
.chat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  /* 关闭按钮是绝对定位贴在右上角的，这里留出位置，别被压住 */
  padding-right: 36px;
  box-sizing: border-box;
}

.chat-header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.chat-header-scene {
  padding: 1px 8px;
  border-radius: 10px;
  background: var(--td-brand-color-1, #f2f3ff);
  color: var(--td-brand-color, #0052d9);
  font-size: 12px;
  font-weight: 400;
}

.chat-header-ops {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 2px;
}

/* ============ 消息区 ============ */
.chat-container {
  height: calc(100vh - 210px);
  min-height: 320px;
  overflow-y: auto;
  /* 长表格/长代码只在自己内部横向滚，别把整个抽屉撑出横向滚动条 */
  overflow-x: hidden;
  padding: 16px 20px;
  background: var(--td-bg-color-container);
}

.message-wrapper {
  display: flex;
  margin: 0 0 20px;
}

.message-wrapper.user {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 92%;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.message-wrapper.user .message-bubble {
  max-width: 85%;
  flex-direction: row-reverse;
}

.avatar {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--td-bg-color-component);
  color: var(--td-text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}

.content {
  min-width: 0;
  max-width: calc(100% - 38px);
}

.text {
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--td-bg-color-component);
  color: var(--td-text-color-primary);
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.message-wrapper.assistant .text {
  border-top-left-radius: 2px;
}

.message-wrapper.user .text {
  background: var(--td-brand-color);
  color: var(--td-text-color-anti);
  border-top-right-radius: 2px;
  white-space: pre-wrap;
}

/* markdown 正文排版：紧凑一点，别让首尾段落把气泡撑高 */
.text :deep(p) {
  margin: 0 0 8px;
}
.text :deep(p:last-child),
.text :deep(ul:last-child),
.text :deep(ol:last-child),
.text :deep(pre:last-child) {
  margin-bottom: 0;
}
.text :deep(h1),
.text :deep(h2),
.text :deep(h3),
.text :deep(h4) {
  margin: 12px 0 6px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
}
.text :deep(h1:first-child),
.text :deep(h2:first-child),
.text :deep(h3:first-child) {
  margin-top: 0;
}
.text :deep(ul),
.text :deep(ol) {
  margin: 0 0 8px;
  padding-left: 20px;
}
.text :deep(li) {
  margin: 2px 0;
}
.text :deep(code) {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--td-bg-color-secondarycontainer, rgba(0, 0, 0, 0.06));
  font-family: Consolas, Monaco, 'Andale Mono', monospace;
  font-size: 12.5px;
  word-break: break-all;
}
/* 代码块和表格是横向溢出的主要来源，各自内部滚动 */
.text :deep(pre) {
  margin: 8px 0;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--td-bg-color-secondarycontainer, rgba(0, 0, 0, 0.06));
  overflow-x: auto;
  max-width: 100%;
}
.text :deep(pre code) {
  padding: 0;
  background: none;
  white-space: pre;
  word-break: normal;
}
.text :deep(table) {
  display: block;
  width: max-content;
  max-width: 100%;
  overflow-x: auto;
  margin: 8px 0;
  border-collapse: collapse;
  font-size: 13px;
}
.text :deep(th),
.text :deep(td) {
  padding: 5px 10px;
  border: 1px solid var(--td-component-border, #e7e7e7);
  text-align: left;
  white-space: normal;
}
.text :deep(th) {
  background: var(--td-bg-color-secondarycontainer, rgba(0, 0, 0, 0.04));
  font-weight: 600;
}
.text :deep(blockquote) {
  margin: 8px 0;
  padding: 2px 0 2px 10px;
  border-left: 3px solid var(--td-component-border, #dcdcdc);
  color: var(--td-text-color-secondary);
}
.text :deep(a) {
  color: var(--td-brand-color, #0052d9);
  word-break: break-all;
}
.text :deep(img) {
  max-width: 100%;
}

/* 等首字时的打字动画 */
.typing {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 14px;
}
.typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--td-text-color-placeholder, #bbb);
  animation: chat-typing 1.2s infinite ease-in-out;
}
.typing span:nth-child(2) {
  animation-delay: 0.2s;
}
.typing span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes chat-typing {
  0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-3px); }
}

.msg-ops {
  margin-top: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}
.message-wrapper:hover .msg-ops {
  opacity: 1;
}

/* ============ 空态：欢迎 + 建议问题 ============ */
.chat-welcome {
  padding: 24px 4px;
}

.welcome-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--td-brand-color-1, #f2f3ff);
  color: var(--td-brand-color, #0052d9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.welcome-title {
  margin-top: 12px;
  font-size: 17px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.welcome-desc {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--td-text-color-secondary);
}

.welcome-suggest-title {
  margin: 20px 0 8px;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.suggest-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggest-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--td-component-border, #e7e7e7);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.suggest-item:hover {
  border-color: var(--td-brand-color, #0052d9);
  background: var(--td-brand-color-1, #f2f3ff);
}

.suggest-main {
  min-width: 0;
  flex: 1 1 auto;
}

.suggest-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.suggest-q {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--td-text-color-secondary);
}

.suggest-arrow {
  flex-shrink: 0;
  color: var(--td-text-color-placeholder);
}

.welcome-links {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.welcome-links-split {
  color: var(--td-text-color-placeholder);
}

.welcome-foot {
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--td-text-color-placeholder);
}

/* ============ 输入区 ============ */
.input-area {
  padding: 12px 20px 16px;
  background: var(--td-bg-color-container);
  border-top: 1px solid var(--td-component-border);
}

.input-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-foot {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-hint {
  flex: 1 1 auto;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

/* ============ 未配置 AI 密钥时的引导 ============ */
.gpt-checking {
  padding: 40px 20px;
  text-align: center;
  color: var(--td-text-color-secondary);
  font-size: 13px;
}

.gpt-unset {
  padding: 48px 24px;
  text-align: center;
}

.gpt-unset-icon {
  font-size: 32px;
  color: var(--td-warning-color, #e37318);
}

.gpt-unset-title {
  margin-top: 12px;
  font-size: 15px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.gpt-unset-desc {
  margin: 8px 0 16px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--td-text-color-secondary);
  text-align: left;
}

.gpt-unset-hint {
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--td-text-color-placeholder);
}
</style>

<!-- 抽屉自身的内边距要去掉，聊天区/输入区各自控制留白（drawer 可能挂到 body 上，不能用 scoped） -->
<style>
.ai-chat-drawer .t-drawer__body {
  padding: 0;
}
.ai-chat-drawer .t-drawer__footer {
  padding: 0;
  border-top: none;
}
.ai-chat-drawer .t-drawer__header {
  padding: 14px 20px;
}
</style>
