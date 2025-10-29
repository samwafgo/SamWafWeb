import { DashboardIcon } from 'tdesign-icons-vue';
import Layout from '@/layouts/index.vue';

export default [
  {
    path: '/dashboard',
    component: Layout,
    redirect: '/dashboard/base',
    name: 'dashboard',
    meta: {
      title: 'menu.dashboard.parent_title',
      icon: DashboardIcon,
    },
    children: [
      {
        path: 'base',
        name: 'DashboardBase',
        component: () => import('@/pages/dashboard/base/index.vue'),
        meta: { title: 'menu.dashboard.dashboard_title'},
      },
      {
        path: 'stats',
        name: 'DashboardStats',
        component: () => import('@/pages/dashboard/stats/index.vue'),
        meta: { title: 'menu.dashboard.stats_title'},
      },
    ],
  },
];
