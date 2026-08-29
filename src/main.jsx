import Vue from 'vue';
import VueRouter from 'vue-router';
import { sync } from 'vuex-router-sync';
import TDesign from 'tdesign-vue';
import VueClipboard from 'vue-clipboard2';
import axiosInstance from '@/utils/request';
import App from './App.vue';
import router from './router';
import zhConfig from 'tdesign-vue/es/locale/zh_CN';
import enConfig from 'tdesign-vue/es/locale/en_US'; // 英文多语言配置
import globalconfig from './utils/globalconfig'
Vue.prototype.samwafglobalconfig = globalconfig;
import bus from './bus/bus'
import BaiduMap from 'vue-baidu-map'
import i18n from "./i18n";
import VueMeta from 'vue-meta';

import 'tdesign-vue/es/style/index.css';
import '@/style/index.less';
import './permission';
import store from './store';
import { purifyHtml } from './utils/purify';  // 引入 purify.js
Vue.prototype.$purifyHtml = purifyHtml;  // 将清理函数注册为全局方法
import { setupDialogOverlayGuard } from './utils/dialogOverlayGuard';  // 修复弹窗内按下、遮罩上松开被误关闭
setupDialogOverlayGuard();
import { setupMessageGuard } from './utils/messageguard';  // 全局提示去重 + 跳登录后抑制回声


Vue.use(VueRouter);
Vue.use(TDesign);
setupMessageGuard();  // 必须在 Vue.use(TDesign) 之后：此时 $message 才挂上
Vue.use(VueClipboard);
Vue.use(VueMeta);
Vue.prototype.$bus = bus
Vue.use(BaiduMap, {
  /* Visit http://lbsyun.baidu.com/apiconsole/key for details about app key. */
  ak: 'caXOspzWPw6SBPgPXtlgGng0QZXy444B'
})
Vue.component('t-page-header');
// 页面顶部的功能说明区：说明短了原地折叠、长了自动进右侧抽屉，全站统一入口
import HelpBlock from '@/components/help-block/index.vue';
Vue.component('help-block', HelpBlock);
// IP 归属查询：封禁源分散在七八个页面，这个组件一次查完
import IpLookup from '@/components/ip-lookup/index.vue';
Vue.component('ip-lookup', IpLookup);

Vue.prototype.$request = axiosInstance;

const originPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location) {
  return originPush.call(this, location).catch((err) => err);
};

const originReplace = VueRouter.prototype.replace;
VueRouter.prototype.replace = function replace(location) {
  return originReplace.call(this, location).catch((err) => err);
};

Vue.config.productionTip = false;
sync(store, router);
window.vm = new Vue({
  router,
  i18n,
  store,
  metaInfo: {
        title: (localStorage.getItem('lang')||'zh_CN') ==='zh_CN'?'SamWaf网站防火墙系统（Web Application Firewall）':"SamWaf Web Application Firewall",
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render: (h) => {
        const currentLanguage = store.getters['language/currentLanguage'];
        const globalConfig = currentLanguage === 'zh_CN' ? zhConfig :enConfig ;

        return (
            <div>
                <t-config-provider globalConfig={globalConfig}>
                    <App />
                </t-config-provider>
            </div>
        );
    },
}).$mount('#app');
