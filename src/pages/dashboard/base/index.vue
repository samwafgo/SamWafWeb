<template>
  <div class="dashboard-page">
    <!-- 降级运行：旧程序 + 新库（容器重建后回退），过去只在日志里，现在摆到台面上 -->
    <t-alert
      v-if="upgradeSummary.downgrade"
      theme="error"
      class="row-container"
      :message="upgradeSummary.downgrade_msg"
      :close="true"
      @close="handleDowngradeAck"
    />

    <!-- 升级须知提示条：处理完自动消失；收起只对本次升级生效，下次升级会重新出现 -->
    <t-alert
      v-if="showUpgradeTip"
      theme="info"
      class="row-container"
      :close="true"
      @close="handleUpgradeTipClose"
    >
      <template #message>{{ upgradeTipMessage }}</template>
      <template #operation>
        <span class="tips-link" @click="handleUpgradeNoticeOperation">{{ $t('dashboard.upgrade_notice_link') }}</span>
      </template>
    </t-alert>

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

    <!-- 重要升级须知：一辈子只弹一次，关掉即回写 popup_shown -->
    <t-dialog
      :visible.sync="upgradePopupVisible"
      :header="$t('dashboard.upgrade_notice_popup_title', { to: upgradeSummary.to_version || upgradeSummary.current_version })"
      :cancelBtn="$t('dashboard.upgrade_notice_popup_all', { count: upgradeSummary.pending_count })"
      :confirmBtn="$t('dashboard.upgrade_notice_popup_ok')"
      width="680px"
      @cancel="handleUpgradePopupAll"
      @confirm="handleUpgradePopupClose"
      @close="handleUpgradePopupClose"
    >
      <p class="upgrade-popup__desc">
        {{ $t('dashboard.upgrade_notice_popup_desc', { count: upgradeSummary.high_pending_count }) }}
      </p>
      <div v-for="item in upgradeSummary.popup_items" :key="item.notice_id" class="upgrade-popup__item">
        <div class="upgrade-popup__title">
          <t-tag theme="danger" variant="light" size="small">{{ $t('page.upgrade_notice.level_high') }}</t-tag>
          <span>{{ item.title }}</span>
        </div>
        <div class="upgrade-popup__detail">{{ item.detail }}</div>
      </div>
    </t-dialog>
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

      ],
      // 升级须知
      upgradeSummary: {
        current_version: '',
        from_version: '',
        to_version: '',
        pending_count: 0,
        high_pending_count: 0,
        total_count: 0,
        need_popup: false,
        popup_items: [],
        downgrade: false,
        downgrade_msg: '',
      },
      upgradeTipClosed: false,
      upgradePopupVisible: false
    }
  },
  computed: {
    visibleTips() {
      return this.tips.filter((item) => item.visable);
    },
    showUpgradeTip() {
      return this.upgradeSummary.pending_count > 0 && !this.upgradeTipClosed;
    },
    upgradeTipMessage() {
      const params = {
        from: this.upgradeSummary.from_version,
        to: this.upgradeSummary.to_version || this.upgradeSummary.current_version,
        count: this.upgradeSummary.pending_count,
      };
      // 没有历史版本记录时（老库首次升上来/全新安装）不谈"从哪升上来"，免得显示成空版本号
      return this.upgradeSummary.from_version
        ? this.$t('dashboard.upgrade_notice_tip', params)
        : this.$t('dashboard.upgrade_notice_tip_unknown', params);
    },
  },
  mounted() {
    this.loadSysInfo()
    this.loadUpgradeSummary()
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
    // 升级须知汇总：提示条 + 重要须知弹窗
    loadUpgradeSummary() {
      this.$request
        .get('/upgradenotice/summary', { params: { lang: localStorage.getItem('lang') || 'zh_CN' } })
        .then((res) => {
          if (res.code !== 0 || !res.data) {
            return
          }
          this.upgradeSummary = res.data
          // 收起状态按"这次升到哪个版本"记，下次再升级时提示条会重新出现
          this.upgradeTipClosed =
            localStorage.getItem('upgrade_notice_tip_closed') === (res.data.to_version || res.data.current_version)
          this.upgradePopupVisible = !!res.data.need_popup && (res.data.popup_items || []).length > 0
        })
        .catch((e) => {
          console.log(e)
        })
    },
    // 确认降级告警：记下当前这个"历史最高版本"，此后不再提示；
    // 若之后最高版本又变高（又升级又回退了一次），告警会重新出现
    handleDowngradeAck() {
      this.upgradeSummary.downgrade = false
      this.$request.post('/upgradenotice/downgradeack', {}).catch((e) => {
        console.log(e)
      })
    },
    handleUpgradeTipClose() {
      this.upgradeTipClosed = true
      localStorage.setItem(
        'upgrade_notice_tip_closed',
        this.upgradeSummary.to_version || this.upgradeSummary.current_version,
      )
    },
    handleUpgradeNoticeOperation() {
      this.$router.push('/sys/UpgradeNotice')
    },
    // 弹窗只弹一次：关掉就回写，不管用户有没有真的去处理
    handleUpgradePopupClose() {
      this.upgradePopupVisible = false
      this.$request.post('/upgradenotice/popupshown', {}).catch((e) => {
        console.log(e)
      })
    },
    handleUpgradePopupAll() {
      this.handleUpgradePopupClose()
      this.handleUpgradeNoticeOperation()
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

.upgrade-popup__desc {
  color: var(--td-text-color-secondary);
  margin: 4px 0 14px;
}

.upgrade-popup__item {
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-default);
  padding: 12px 14px;
  margin-bottom: 10px;
}

.upgrade-popup__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  margin-bottom: 4px;
}

.upgrade-popup__detail {
  color: var(--td-text-color-secondary);
  line-height: 1.7;
}
</style>
