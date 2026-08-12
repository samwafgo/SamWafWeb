<template>
  <div class="dashboard-page">
    <t-swiper
      v-if="tipsVisable"
      class="tips-container"
      :duration="300"
      :interval="5000"
      :navigation="navigation"
      trigger="click"
    >
      <t-swiper-item v-for="(item, index) in visibleTips" :key="index">
        <t-alert :theme="item.tipsType" :message="$t(item.message)">
          <template #operation>
            <span v-if="item.name==='emptyHost'" class="tips-link" @click="handleCreateWebOperation">{{$t('dashboard.tip_create_website_link')}}</span>
            <span v-if="item.name==='defaultAccount'" class="tips-link" @click="handleModifyDefaultPassWebOperation">{{$t('dashboard.tip_modify_pwd_link')}}</span>
            <span v-if="item.name==='emptyOtp'" class="tips-link" @click="handleModify2FaWebOperation">{{$t('dashboard.tip_empty_otp_link')}}</span>
          </template>
        </t-alert>
      </t-swiper-item>
    </t-swiper>

    <!-- 系统公告 -->
    <t-card v-if="announcements.length > 0" class="announcement-card row-container">
      <template #title>
        <div class="announcement-title">
          <notification-icon class="announcement-title__icon" />
          <span>{{ $t('dashboard.announcement_title') }}</span>
          <t-tag class="announcement-title__count" theme="primary" variant="light" size="small">{{ announcements.length }}</t-tag>
        </div>
      </template>
      <t-list :split="false">
        <t-list-item v-for="(item, index) in announcements" :key="index" class="announcement-item">
          <div class="announcement-wrapper">
            <div class="announcement-left">
              <t-tag class="announcement-tag" theme="primary" variant="light">{{ item.type }}</t-tag>
              <span class="announcement-text">{{ item.content }}</span>
              <t-tag v-if="index === 0" class="announcement-new" theme="danger" variant="light" size="small">{{ $t('dashboard.announcement_new') }}</t-tag>
              <t-link v-if="item.link" theme="primary" hover="color" class="announcement-link" @click="handleAnnouncementLink(item)">
                {{ $t('dashboard.announcement_detail') }}
              </t-link>
            </div>
            <div class="announcement-right">
              <calendar-icon class="announcement-date__icon" />
              <span class="announcement-date">{{ item.date }}</span>
            </div>
          </div>
        </t-list-item>
      </t-list>
    </t-card>

    <!-- 顶部指标卡片 -->
    <top-panel class="row-container" />
    <!-- 中部图表 -->
    <middle-chart class="row-container" />
    <!-- 列表排名 -->
    <rank-list class="row-container" />
  </div>
</template>
<script lang="ts">
import { NotificationIcon, CalendarIcon } from 'tdesign-icons-vue';
import TopPanel from './components/TopPanel.vue';
import MiddleChart from './components/MiddleChart.vue';
import RankList from './components/RankList.vue';
import {
  wafStatSysinfoapi
} from '@/apis/stats';

import {GetAnnouncementApi} from '@/apis/sysinfo'

export default {
  name: 'DashboardBase',
  components: {
    TopPanel,
    MiddleChart,
    RankList,
    NotificationIcon,
    CalendarIcon,
  },
  data() {
    return {
      center: {lng: 0, lat: 0},
      zoom: 3,
      navigation:{
        type: 'bars' ,
        size:'small',
        showSlideBtn:'never' ,
        placement:'inside'
      },
      tipsVisable:false,
      tips:[
        {
          name:"emptyHost",
          visable:false,
          message:'dashboard.tip_create_website_title',
          tipsType:"success"
        },
        {
          name:"defaultAccount",
          visable:false,
          message:'dashboard.tip_modify_pwd_title',
          tipsType:"error"
        },
        {
          name:"emptyOtp",
          visable:false,
          message:'dashboard.tip_empty_otp_title',
          tipsType:"error"
        },
      ],
      // 系统公告数据
      announcements: [

      ]
    }
  },
  computed: {
    visibleTips() {
      return this.tips.filter((item) => item.visable);
    },
  },
  mounted() {
    this.loadSysInfo()
    //异步加载公告
    Promise.resolve().then(() => {
      this.loadAnnouncements()
    })
  },
  methods: {
     handler ({BMap, map}) {
          console.log(BMap, map)
          this.center.lng = 116.404
          this.center.lat = 39.915
          this.zoom = 15
    },
    //引导创建网站
    handleCreateWebOperation(){
      this.$router.push(
        {
          path: '/waf-host/wafhost',
          query: {
            sourcePage: "HomeFrist",
          },
        },
      );
    },
    //引导修改默认密码
    handleModifyDefaultPassWebOperation(){
      this.$router.push(
        {
          path: '/account/Account',
          query: {
            sourcePage: "HomeFrist",
          },
        },
      );
    },
    //引导用户去设置2fa
    handleModify2FaWebOperation(){
      this.$router.push(
        {
          path: '/account/otp',
          query: {
            sourcePage: "HomeFirst",
          },
        },
      );
    },
    loadSysInfo(){
      wafStatSysinfoapi({}).then((res)=>{
        console.log("home res",res.data)
        this.tips[0].visable = res.data.is_empty_host
        this.tips[1].visable = res.data.is_default_account
        this.tips[2].visable = res.data.is_empty_otp
        this.tipsVisable = this.tips[0].visable || this.tips[1].visable || this.tips[2].visable
      } ).catch((e: Error) => {
        console.log(e);
      }).finally(() => {})

    },
    // 加载公告信息
    loadAnnouncements() {
      GetAnnouncementApi({}).then(res => {
        console.log("GetAnnouncementApi",res)
        if (res.code==0 && res.data.code=='success'){
           //将data字符串转换成json对象
           let json = JSON.parse( res.data.data);
           console.log("GetAnnouncementApi",json)
          this.announcements = json.announcements
        }
       })
    },
    // 点击公告链接
    handleAnnouncementLink(item) {
      if (item.link) {
        // 如果是内部路由链接
        if (item.link.startsWith('/')) {
          this.$router.push(item.link);
        } else {
          // 如果是外部链接，在新窗口打开
          window.open(item.link, '_blank');
        }
      }
    }
    //end methods
  },
};
</script>
<style lang="less" scoped>
@import '@/style/variables.less';

.dashboard-page {
  /deep/ .t-row {
    row-gap: 16px;
  }
}

.row-container {
  margin-bottom: 16px;
}

.tips-container {
  margin-bottom: 16px;

  .tips-link {
    color: var(--td-brand-color);
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.map {
  width: 100%;
  height: 300px;
}

/* 系统公告 */
.announcement-card {
  padding: 8px;
  border-radius: var(--td-radius-large);

  /deep/ .t-card__header {
    padding-bottom: 8px;
  }

  /deep/ .t-card__title {
    font-size: 16px;
    font-weight: 600;
  }
}

.announcement-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &__icon {
    color: var(--td-brand-color);
    font-size: 18px;
  }

  &__count {
    min-width: 20px;
    justify-content: center;
  }
}

.announcement-item {
  padding: 12px 4px;
  border-radius: 8px;
  transition: background-color @anim-duration-base @anim-time-fn-easing;

  &:hover {
    background: var(--td-bg-color-container-hover);
  }
}

.announcement-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.announcement-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.announcement-tag {
  margin-right: 12px;
  min-width: 70px;
  text-align: center;
  flex: none;
}

.announcement-new {
  margin-left: 8px;
  flex: none;
}

.announcement-text {
  font-size: 14px;
  color: var(--td-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.announcement-right {
  margin-left: 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
}

.announcement-date {
  color: var(--td-text-color-placeholder);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.announcement-date__icon {
  color: var(--td-text-color-placeholder);
  font-size: 14px;
}

.announcement-link {
  margin-left: 12px;
  font-size: 14px;
  flex: none;
}
</style>
