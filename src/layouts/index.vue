<template>
  <div>
    <template v-if="setting.layout === 'side'">
      <t-layout key="side">
        <t-aside><layout-sidebar /></t-aside>
        <t-layout>
          <t-header><layout-header /></t-header>
          <t-content><layout-content /></t-content>
          <t-drawer :visible.sync="aiChatBoxVisible" :closeBtn="true" size="500px" :header="$t('page.gpt.assistant')">
            <div ref="chatContainer" class="chat-container">
              <div v-for="(item, index) in questionList" :key="index"
                   class="message-wrapper" :class="item.role">
                <div class="message-bubble">
                  <div class="avatar">
                    <user-icon v-if="item.role === 'user'" name="user"  > </user-icon>
                    <logo-android-icon v-else name="robot"/>
                  </div>
                  <div class="content">
                    <div v-html="convertMarkdown(item.content)" class="text"></div>
                    <div v-if="item.loading" class="loading">...</div>
                  </div>
                </div>
              </div>
            </div>

            <template #footer>
              <div class="input-area">
                <t-textarea
                  v-model="inputMessage"
                  :placeholder="$t('page.gpt.chat.chat_placeholder')"
                  name="description"
                  :autosize="{ minRows: 3,maxRows: 4 }" @enter="sendMessage">
                </t-textarea>
                <t-button @click="sendMessage">{{ $t('page.gpt.chat.chat_send') }}</t-button>
              </div>
            </template>
          </t-drawer>

          <t-sticky-tool :style="{ position: 'fixed', right: '20px', overflow: 'hidden', height: '70px' }"
                         @click="openChat">
            <t-sticky-item :label="$t('page.gpt.assistant')" :icon="renderChatIcon"/>
          </t-sticky-tool>
        </t-layout>

      </t-layout>
    </template>
    <template v-else-if="setting.layout === 'top'">
      <t-layout key="top">
        <t-header> <layout-header /></t-header>
        <t-content><layout-content /></t-content>
      </t-layout>
    </template>
    <template v-else>
      <t-layout key="mix">
        <t-header><layout-header /></t-header>
        <t-layout>
          <t-aside><layout-sidebar /></t-aside>
          <t-content><layout-content />
          </t-content>
        </t-layout>
      </t-layout>
    </template>
    <setting />
  </div>
</template>

<script lang="ts">
import Vue , { h }  from 'vue'; //import Vue , { h }  from 'vue';
import { mapGetters } from 'vuex';
import { ChatIcon, AddIcon, QrcodeIcon,UserIcon, LogoAndroidIcon  } from 'tdesign-icons-vue';
import { marked } from 'marked';


import LayoutHeader from './components/LayoutHeader.vue';
import LayoutContent from './components/LayoutContent.vue';
import LayoutSidebar from './components/LayoutSidebar.vue';
import Setting from './setting.vue';

import { prefix } from '@/config/global';
import { SettingType } from '@/interface';
import { fetchChatStream } from '@/utils/eventSource';

import '@/style/layout.less';
const name = `${prefix}-base-layout`;

export default Vue.extend({
  name,
  components: {
    LayoutHeader,
    LayoutContent,
    LayoutSidebar,
    Setting,
    ChatIcon,
    AddIcon,
    QrcodeIcon,
    UserIcon,
    LogoAndroidIcon,
  },
  data() {
    return {
      aiChatBoxVisible:false,
      questionList: [] as Array<{
        role: 'user' | 'assistant';
        content: string;
        loading?: boolean;
        //unimportant?: boolean | false;//后端是否关注此类信息
      }>,
      inputMessage: '',
      loading: false,
      token: "your_token",  // 你需要动态传入token
    };
  },
  computed: {
    ...mapGetters({
      tabRouterList: 'tabRouter/tabRouterList',
    }),
    setting(): SettingType {
      return this.$store.state.setting;
    },
  },
  watch: {
    $route(newRoute) {
      // 监听路由变化往多标签新增
      const {
        path,
        meta: { title },
        name,
      } = newRoute;
      this.$store.commit('tabRouter/appendTabRouterList', { path, title, name, isAlive: true });
    },
  },
  // 如果不需要持久化标签页可以注释掉created和destroyed的内容
  created() {
    window.addEventListener('beforeunload', this.setTabRouterListCache);
  },
  destroyed() {
    window.removeEventListener('beforeunload', this.setTabRouterListCache);
  },
  mounted() {
    const {
      path,
      meta: { title },
      name,
    } = this.$route;

    if (localStorage.getItem('tabRouterList')) this.getTabRouterListCache();
    this.$store.commit('tabRouter/appendTabRouterList', { path, title, name, isAlive: true });

    let that = this
    that.$bus.$on("sendAi", (e) => {
      console.log('消息总线 来自其他内容 ', e)
      that.clearMessage()
      that.aiChatBoxVisible = true;
      that.inputMessage= e
      that.sendMessage()

    })

  },
  methods: {
    // 判断内容是否是 Markdown
    isMarkdown(content) {
      // 简单检查 Markdown 语法（例如 # 开头）
      return true //content.startsWith('#');
    },
    // 将 Markdown 转换为 HTML
    convertMarkdown(content) {
      return this.$purifyHtml(marked.parse(content));
    },
    clearMessage(){
      this.questionList = []
    },
    sendMessage() {
      if (!this.inputMessage.trim()) return;

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
      const answerIndex = this.questionList.length - 1;

      fetchChatStream({
        history: this.questionList,
        q,
        ctrl,
        onSuccess: (assistantMessage) => {
          const answer = this.questionList[answerIndex];
          //console.log("onSuccess",assistantMessage)
          answer.content += assistantMessage.content;
          this.$set(this.questionList, answerIndex, { ...answer });
          this.goChatBottom();

        },
        onComplete: () => {
          const answer = this.questionList[answerIndex];
          answer.loading = false;
          this.$set(this.questionList, answerIndex, { ...answer });
          this.goChatBottom();
        },
        onError: (errorMsg) => {
          this.$message.error(errorMsg);
          this.questionList.splice(answerIndex, 1); // 移除加载中的消息
        }
      });
    },

    goChatBottom() {
      this.$nextTick(() => {
        const container = this.$refs.chatContainer as HTMLElement;
        if (container) {
          //console.log('chatContainer:', container); // 检查是否能正确引用
          container.scrollTop = container.scrollHeight;
        } else {
          //console.error('chatContainer reference not found');
        }
      });
    },

    openChat(e: any) {
      console.log("aichat e=",e)
      if (e.item?.label === this.$t('page.gpt.assistant') ) {
        this.aiChatBoxVisible = true;
      }
    },
    renderChatIcon: function (createElement) {
      return createElement(ChatIcon);
    },
    getTabRouterListCache() {
      this.$store.commit('tabRouter/initTabRouterList', JSON.parse(localStorage.getItem('tabRouterList')));
    },
    setTabRouterListCache() {
      localStorage.setItem('tabRouterList', JSON.stringify(this.tabRouterList));
    },
    handleClick(context) {
      console.log('click', context);
    },
    handleHover(context) {
      console.log('hover', context);
    },

  },
});
</script>
<style scoped>
.chat-container {
  height: 60vh;
  overflow-y: auto;
  padding: 20px;
  background: var(--td-bg-color-container);
}

.message-wrapper {
  display: flex;
  margin: 12px 0;
}

.message-wrapper.user {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 80%;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.message-wrapper.user .message-bubble {
  flex-direction: row-reverse;
}

.avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--td-bg-color-component);
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  max-width: calc(100% - 44px);
}

.text {
  padding: 12px;
  border-radius: 6px;
  background: var(--td-bg-color-component);
  color: var(--td-text-color-primary);
  word-break: break-word;
}

.message-wrapper.user .text {
  background: var(--td-brand-color);
  color: var(--td-text-color-anti);
}

.loading {
  color: var(--td-text-color-secondary);
  font-size: 24px;
  padding: 12px;
}

.input-area {
  display: flex;
  gap: 12px;
  padding: 20px;
  background: var(--td-bg-color-container);
  border-top: 1px solid var(--td-component-border);
}
</style>
