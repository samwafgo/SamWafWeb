import {
  UserSafetyIcon, SystemSettingIcon, UsergroupIcon, SystemLogIcon, ApplicationIcon, LightingCircleIcon,
  ServerIcon, ForkIcon, NotificationIcon
} from 'tdesign-icons-vue';
import Layout from '@/layouts/index.vue';

export default [

  {
    path: '/waf-host',
    name: 'wafhost',
    component: Layout,
    meta: { title: 'menu.host.parent_title', icon: ApplicationIcon },
    children: [
      {
        path: 'wafhost',
        name: 'WafHost',
        component: () => import('@/pages/waf/host/index.vue'),
        meta: { title: 'menu.host.host_title' },

      },
      {
        path: 'wafrule',
        name: 'WafRule',
        component: () => import('@/pages/waf/rule/index.vue'),
        meta: { title: 'menu.host.host_protect_rule' },
      },
      {
        path: 'wafruleedit',
        name: 'Wafruleedit',
        component: () => import('@/pages/waf/rule/edit/index.vue'),
        meta: { title: 'menu.host.host_protect_rule_edit', keepAlive: false, hidden: true },
      },
      {
        path: 'wafipwhitelist',
        name: 'WafIpWhiteList',
        component: () => import('@/pages/waf/ipallow/index.vue'),
        meta: { title: 'menu.host.allow_ip' },

      },
      {
        path: 'wafurlwhitelist',
        name: 'WafUrlWhiteList',
        component: () => import('@/pages/waf/urlallow/index.vue'),
        meta: { title: 'menu.host.allow_url' },

      },

      {
        path: 'wafipBlocklist',
        name: 'WafIpBlockList',
        component: () => import('@/pages/waf/ipblock/index.vue'),
        meta: { title: 'menu.host.deny_ip' },

      },
      {
        path: 'wafurlblocklist',
        name: 'WafUrlBlockList',
        component: () => import('@/pages/waf/urlblock/index.vue'),
        meta: { title: 'menu.host.deny_url' },

      },
      {
        path: 'wafldpurllist',
        name: 'WafLdpUrlList',
        component: () => import('@/pages/waf/ldpurl/index.vue'),
        meta: { title: 'menu.host.ldp_url' },

      }, {
        path: 'wafanticclist',
        name: 'WafAntiCCList',
        component: () => import('@/pages/waf/anticc/index.vue'),
        meta: { title: 'menu.host.cc' },

      },
      {
        path: 'wafsensitivelist',
        name: 'WafSensitiveList',
        component: () => import('@/pages/waf/sensitive/index.vue'),
        meta: { title: 'menu.host.sensitive' },

      }, {
        path: 'wafsslconfiglist',
        name: 'WafSSLConfigList',
        component: () => import('@/pages/waf/sslconfig/index.vue'),
        meta: { title: 'menu.host.sslconfig' },

      }, {
        path: 'wafbatchtasklist',
        name: 'WafBatchTaskList',
        component: () => import('@/pages/waf/batchtask/index.vue'),
        meta: { title: 'menu.host.batchtask' },

      }, {
        path: 'wafsslOrderlist',
        name: 'WafSSLOrderList',
        component: () => import('@/pages/waf/sslorder/index.vue'),
        meta: { title: 'menu.host.sslorder' },

      },
      {
        path: 'wafsslExpirelist',
        name: 'WafsslExpireList',
        component: () => import('@/pages/waf/ssl_expire/index.vue'),
        meta: { title: 'menu.host.ssl_expire' },

      }, {
        path: 'wafBlockingPagelist',
        name: 'WafBlockingPagelist',
        component: () => import('@/pages/waf/bLocking_page/index.vue'),
        meta: { title: 'menu.host.blocking_page' },
      }, {
        path: 'wafIPFailure',
        name: 'WafIPFailure',
        component: () => import('@/pages/waf/ip_failure/index.vue'),
        meta: { title: 'menu.host.ip_failure' },

      }
    ],
  },

  {
    path: '/wafanalysis',
    name: 'wafanalysis',
    component: Layout,
    meta: { title: 'menu.analysis.parent_title', icon: SystemLogIcon },
    children: [
      {
        path: 'wafanalysislog',
        name: 'WafAnalysisLog',
        component: () => import('@/pages/waf/analysis/index.vue'),
        meta: { title: 'menu.analysis.analysis_title' },
      },
      {
        path: 'wafanalysisSpiderlog',
        name: 'WafAnalysisSpiderLog',
        component: () => import('@/pages/waf/analysis/SpiderActive.vue'),
        meta: { title: 'menu.analysis.analysis_spider_title' },
      },
    ],
  },
  {
    path: '/waf',
    name: 'waf',
    component: Layout,
    redirect: '/waf-log/visit',
    meta: { title: 'menu.visit_log.parent_title', icon: LightingCircleIcon },
    children: [
      {
        path: 'wafvisitlog',
        name: 'WafvisitLog',
        component: () => import('@/pages/waf/attack/index.vue'),
        meta: { title: 'menu.visit_log.visit_title' },
      },
      {
        path: 'wafattacklog',
        name: 'WafAttackLog',
        component: () => import('@/pages/waf/attack/attack_index.vue'),
        meta: { title: 'menu.visit_log.attack_title' },
      },
      {
        path: 'wafattacklogdetail',
        name: 'WafAttackLogDetail',
        component: () => import('@/pages/waf/attack/detail/index.vue'),
        meta: { title: 'menu.visit_log.visit_detail_title', hidden: true, keepAlive: false }
        ,

      },
    ],
  },
  {
    path: '/tunnel',
    name: 'tunnel',
    component: Layout,
    redirect: '/tunnel',
    meta: { title: 'menu.tunnel.parent_title', icon: ForkIcon },
    children: [
      {
        path: 'Tunnel',
        name: 'Tunnel',
        component: () => import('@/pages/waf/tunnel/index.vue'),
        meta: { title: 'menu.tunnel.list_title' },
      },
    ],
  },
  {
    path: '/account',
    name: 'account',
    component: Layout,
    redirect: '/account',
    meta: { title: 'menu.account.parent_title', icon: UsergroupIcon },
    children: [
      {
        path: 'Account',
        name: 'Account',
        component: () => import('@/pages/waf/account/index.vue'),
        meta: { title: 'menu.account.account_list_title' },
      },
      {
        path: 'AccountLog',
        name: 'AccountLog',
        component: () => import('@/pages/waf/accountlog/index.vue'),
        meta: { title: 'menu.account.account_log_title' },
      },
      {
        path: 'OTP',
        name: 'OTP',
        component: () => import('@/pages/waf/otp/index.vue'),
        meta: { title: 'menu.account.otp_title' },
      },

    ],
  },
  {
    path: '/sys',
    name: 'sys',
    component: Layout,
    redirect: '/sys',
    meta: { title: 'menu.system.parent_title', icon: SystemSettingIcon },
    children: [
      {
        path: 'VpConfig',
        name: 'VpConfig',
        component: () => import('@/pages/waf/vpconfig/index.vue'),
        meta: {
          title: 'menu.system.vpconfig_title',
        }
      },
      {
        path: 'FileManage',
        name: 'FileManage',
        component: () => import('@/pages/waf/filemanage/index.vue'),
        meta: {
          title: 'menu.system.filemanage_title',
        }
      },
      {
        path: 'SysLog',
        name: 'SysLog',
        component: () => import('@/pages/waf/syslog/index.vue'),
        meta: { title: 'menu.system.system_log_title' },
      },
      {
        path: 'SystemConfig',
        name: 'SystemConfig',
        component: () => import('@/pages/waf/systemconfig/index.vue'),
        meta: { title: 'menu.system.system_config_title' },
      },
      {
        path: 'PrivateInfo',
        name: 'PrivateInfo',
        component: () => import('@/pages/waf/private_info/index.vue'),
        meta: { title: 'menu.system.private_info_title' },
      },
      {
        path: 'RumtimeSysteminfo',
        name: 'RumtimeSysteminfo',
        component: () => import('@/pages/waf/sysruntime/index.vue'),
        meta: { title: 'menu.system.system_runtime_title' },
      }, {
        path: 'OneKeyMod',
        name: 'OneKeyMod',
        component: () => import('@/pages/waf/onekeymod/index.vue'),
        meta: { title: 'menu.system.system_one_key_modify_title' },
      }, {
        path: 'task',
        name: 'Task',
        component: () => import('@/pages/waf/task/index.vue'),
        meta: { title: 'menu.system.task' },
      }, {
        path: 'sqlquery',
        name: 'SqlQuery',
        component: () => import('@/pages/waf/sqlquery/index.vue'),
        meta: { title: 'menu.system.sql_query_title' },
      },
    ],
  },

  {
    path: '/notify',
    name: 'notify',
    component: Layout,
    redirect: '/notify/channel',
    meta: { title: 'menu.notify.parent_title', icon: NotificationIcon },
    children: [
      {
        path: 'channel',
        name: 'NotifyChannel',
        component: () => import('@/pages/waf/notify_channel/index.vue'),
        meta: { title: 'menu.notify.channel_title' },
      },
      {
        path: 'subscription',
        name: 'NotifySubscription',
        component: () => import('@/pages/waf/notify_subscription/index.vue'),
        meta: { title: 'menu.notify.subscription_title' },
      },
      {
        path: 'log',
        name: 'NotifyLog',
        component: () => import('@/pages/waf/notify_log/index.vue'),
        meta: { title: 'menu.notify.log_title' },
      },
    ],
  },

  {
    path: '/center',
    name: 'center',
    component: Layout,
    redirect: '/center',
    meta: { title: 'menu.pc.parent_title', icon: ServerIcon },
    children: [
      {
        path: 'CenterManager',
        name: 'CenterManager',
        component: () => import('@/pages/waf/center/index.vue'),
        meta: { title: 'menu.pc.pc_list_title' },
      }
    ],
  },
];
