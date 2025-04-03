<template>
  <div>
    <t-swiper :duration="300" :interval="5000" :navigation="navigation" v-if="tipsVisable" trigger="click">
      <t-swiper-item  v-for="(item, index)  in tips" :key="index" v-if="item.visable" >
        <t-alert :theme="item.tipsType" :message="$t(item.message)" >
          <template #operation="row">
            <span @click="handleCreateWebOperation" v-if="item.name==='emptyHost'" >{{$t('dashboard.tip_create_website_link')}}</span>
            <span @click="handleModifyDefaultPassWebOperation" v-if="item.name==='defaultAccount'" >{{$t('dashboard.tip_modify_pwd_link')}}</span>
            <span @click="handleModify2FaWebOperation" v-if="item.name==='emptyOtp'" >{{$t('dashboard.tip_empty_otp_link')}}</span>

          </template>
        </t-alert>
      </t-swiper-item>
    </t-swiper>
<br>
    <!-- 系统公告 -->
    <t-card title="系统公告" class="row-container" v-if="announcements.length > 0">
          <t-list :split="true">
            <t-list-item v-for="(item, index) in announcements" :key="index" class="announcement-item">
              <div class="announcement-wrapper">
                <div class="announcement-left">
                  <t-tag class="announcement-tag" theme="primary" variant="light">{{item.type}}</t-tag>
                  <span class="announcement-text">{{item.content}}</span>
                  <t-link v-if="item.link" theme="primary" hover="color" class="announcement-link" @click="handleAnnouncementLink(item)">
                    查看详情
                  </t-link>
                </div>
                <div class="announcement-right">
                  <span class="announcement-date">{{item.date}}</span>
                </div>
              </div>
            </t-list-item>
          </t-list>
    </t-card>
    <!-- 顶部 card  -->
    <top-panel class="row-container" />
    <!-- 中部图表  -->
    <middle-chart class="row-container" />
    <!-- 列表排名 -->
    <rank-list class="row-container" />
  </div>
</template>
<script lang="ts">
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
<style scoped>
.row-container {
  margin-bottom: 16px;
}
.map {
  width: 100%;
  height: 300px;
}
/* 添加公告样式 */
.announcement-item {
  padding: 12px 0;
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
}
.announcement-tag {
  margin-right: 12px;
  min-width: 70px;
  text-align: center;
}
.announcement-text {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.9);
}
.announcement-right {
  margin-left: 16px;
}
.announcement-date {
  color: rgba(0, 0, 0, 0.4);
  font-size: 14px;
}
.announcement-link {
  margin-left: 12px;
  font-size: 14px;
}
</style>
