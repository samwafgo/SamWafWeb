<template>
  <div>
    <template v-if="setting.layout === 'side'">
      <t-layout key="side">
        <t-aside><layout-sidebar /></t-aside>
        <t-layout>
          <t-header><layout-header /></t-header>
          <t-content><layout-content /></t-content>
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
    <!-- AI 助手放在布局外层：三种布局(side/top/mix)下都可用 -->
    <ai-assistant />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';
import { NotifyPlugin } from 'tdesign-vue';

import LayoutHeader from './components/LayoutHeader.vue';
import LayoutContent from './components/LayoutContent.vue';
import LayoutSidebar from './components/LayoutSidebar.vue';
import AiAssistant from './components/AiAssistant.vue';
import Setting from './setting.vue';

import { prefix } from '@/config/global';
import { SettingType } from '@/interface';

import '@/style/layout.less';
const name = `${prefix}-base-layout`;

export default Vue.extend({
  name,
  components: {
    LayoutHeader,
    LayoutContent,
    LayoutSidebar,
    Setting,
    AiAssistant,
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

    this.showLoginNotice();
  },
  methods: {
    // 登录来源提醒：登录页把响应里的 login_notice 存进 sessionStorage，进入布局后在右下角弹一次。
    // 读完即删，保证刷新页面不会反复弹。
    showLoginNotice() {
      const raw = sessionStorage.getItem('login_notice');
      if (!raw) return;
      sessionStorage.removeItem('login_notice');

      let notice: any = null;
      try {
        notice = JSON.parse(raw);
      } catch (e) {
        return;
      }
      if (!notice || !notice.current_ip) return;

      const dash = (v: string) => (v && String(v).trim() !== '' ? v : '-');
      const rows: Array<[string, string]> = [
        [this.$t('page.login_notice.current_ip') as string, dash(notice.current_ip)],
        [this.$t('page.login_notice.current_area') as string, dash(notice.current_area)],
        [this.$t('page.login_notice.current_time') as string, dash(notice.current_time)],
      ];
      if (notice.is_changed) {
        rows.push([this.$t('page.login_notice.last_ip') as string, dash(notice.last_ip)]);
        rows.push([this.$t('page.login_notice.last_area') as string, dash(notice.last_area)]);
        rows.push([this.$t('page.login_notice.last_time') as string, dash(notice.last_time)]);
      }

      let tipKey = 'page.login_notice.same_tip';
      if (notice.is_changed) tipKey = 'page.login_notice.changed_tip';
      else if (notice.is_first) tipKey = 'page.login_notice.first_tip';

      // 全部用 h() 构造文本节点，IP/归属地这些外部来源的字符串不会被当成 HTML 解析
      const content = (h: any) =>
        h('div', { style: 'font-size:13px;line-height:22px;' }, [
          ...rows.map(([label, value]) =>
            h('div', { style: 'display:flex;gap:8px;' }, [
              h('span', { style: 'flex:0 0 84px;color:var(--td-text-color-secondary);' }, label),
              h('span', { style: 'flex:1;word-break:break-all;' }, value),
            ]),
          ),
          h(
            'div',
            {
              style: `margin-top:8px;${notice.is_changed ? 'color:var(--td-warning-color);' : 'color:var(--td-text-color-secondary);'}`,
            },
            this.$t(tipKey) as string,
          ),
        ]);

      const options: any = {
        title: this.$t(notice.is_changed ? 'page.login_notice.title_changed' : 'page.login_notice.title_normal'),
        content,
        placement: 'bottom-right',
        // 来源变化是要人看到并判断的，不自动消失，必须用户自己关；
        // 一致时 6 秒后自动关掉，别挡住页面
        duration: notice.is_changed ? 0 : 6000,
        closeBtn: true,
      };

      // instance 在 footer 渲染之后才赋值，但点击一定发生在渲染之后，闭包里拿得到
      let instance: any = null;
      if (notice.is_changed) {
        options.footer = (h: any) =>
          h('div', { style: 'display:flex;justify-content:flex-end;' }, [
            h(
              't-button',
              {
                props: { theme: 'primary', variant: 'text', size: 'small' },
                on: {
                  click: () => {
                    if (instance) NotifyPlugin.close(instance);
                    this.$router.push('/account/LoginHistory').catch(() => {});
                  },
                },
              },
              this.$t('page.login_notice.view_history') as string,
            ),
          ]);
      }
      instance = notice.is_changed ? NotifyPlugin.warning(options) : NotifyPlugin.success(options);
    },
    getTabRouterListCache() {
      this.$store.commit('tabRouter/initTabRouterList', JSON.parse(localStorage.getItem('tabRouterList')));
    },
    setTabRouterListCache() {
      localStorage.setItem('tabRouterList', JSON.stringify(this.tabRouterList));
    },
  },
});
</script>
