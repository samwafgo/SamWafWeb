<template>


  <div :class="layoutCls">
    <t-dialog width="600px" :visible.sync="update_visible" :header="$t('topNav.update.has_new_version')">
      <template #confirmBtn>
        <t-button :theme="update_new_ver && update_new_ver.toLowerCase().includes('beta') ? 'danger' : 'warning'" @click="handleConfirmUpdate">
          {{$t('topNav.update.confirm_update')}}
        </t-button>
      </template>

      <t-alert theme="warning">
          <template #message>
            {{$t('topNav.update.update_danger_tips')}}
          </template>
      </t-alert>
      <div style="margin: 16px 0 0 0; line-height: 1.8;">
        <div>
          <strong>{{ $t('topNav.update.version_label') }}</strong>
          {{ update_new_ver }}
        </div>
        <span style="color: red" v-if="update_new_ver && update_new_ver.toLowerCase().includes('beta')"> {{ $t('topNav.update.beta_version_warning') }} </span>

        <div>
          <strong>{{ $t('topNav.update.desc_label') }}</strong>
          <div v-html="compiledMarkdown"></div>
        </div>
        <div>
          <t-link theme="primary"
          underline href="https://doc.samwaf.com/quickstart/Update.html"
           target="black">{{ $t('topNav.update.more_label') }}</t-link>

        </div>
      </div>

    </t-dialog>
    
    <!-- 微信公众号二维码对话框 -->
    <t-dialog width="800px" :visible.sync="wechat_visible" :header="$t('topNav.wechat')" :confirmBtn="null" :cancelBtn="null">
      <div class="wechat-qr-container">
        <div class="qr-image-wrapper">
          <img src="@/assets/assets-mp-samwaf.png"  class="qr-image" />
        </div>
        <div class="qr-description">
          <p></p>
        </div>
      </div>
    </t-dialog>
    
    <t-head-menu :class="menuCls" :theme="theme" expandType="popup" :value="active">
      <template #logo>
        <span v-if="showLogo" class="header-logo-container" @click="handleNav('/dashboard/base')">
          <logo-full class="t-logo"/>
        </span>
        <div v-else class="header-operate-left">
          <t-button theme="default" shape="square" variant="text" @click="changeCollapsed">
            <view-list-icon class="collapsed-icon" />
          </t-button>
          <!--<search :layout="layout" />-->
        </div>
      </template>
      <menu-content v-show="layout !== 'side'" class="header-menu" :navData="menu" />
      <template #operations>
        <div class="operations-container">
          <!-- 搜索框 -->
          <search v-if="layout !== 'side'" :layout="layout" />

          <!-- 系统监控 -->
          <system-monitor />

          <!-- 全局通知 -->
          <notice />
          <!-- 版本说明 -->
          <t-tooltip placement="bottom" :content="$t('topNav.update.has_new_version')" v-show="hasNewVersion">
            <t-button theme="default" shape="square" variant="text" @click="checkVersion('manual')" style="position: relative; overflow: visible;">
              <NotificationErrorIcon />
              <span v-if="update_new_ver && update_new_ver.toLowerCase().includes('beta')"
                    style="position: absolute; top: -6px; right: -18px; font-size: 10px; color: white; background: #ff4d4f; border-radius: 8px; padding: 0 4px; line-height: 16px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.2); white-space: nowrap; z-index: 10;">
                Beta
              </span>
              <span v-else-if="hasNewVersion"
                    style="position: absolute; top: -6px; right: -18px; font-size: 10px; color: white; background: #52c41a; border-radius: 8px; padding: 0 4px; line-height: 16px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.2); white-space: nowrap; z-index: 10;">
                New
              </span>
            </t-button>
          </t-tooltip>

          <t-tooltip placement="bottom" :content="$t('topNav.wechat')">
            <t-button theme="default" shape="square" variant="text" @click="openWechat">
              <LogoWechatStrokeIcon />
            </t-button>
          </t-tooltip>
          <t-tooltip placement="bottom" :content="$t('topNav.contract')">
            <t-button theme="default" shape="square" variant="text" @click="sendMail">
              <MailIcon />
            </t-button>
          </t-tooltip>
          <t-tooltip placement="bottom" :content="$t('topNav.help_document')">
            <t-button theme="default" shape="square" variant="text" @click="navToHelper">
              <help-circle-icon />
            </t-button>
          </t-tooltip>
          <t-select v-model="langValue"
                    placeholder="SelectLanguage"
                    @change="changeLangEvent"  style="width: 150px; display: inline-block" title="Select Language">
            <t-option  v-for="(item, index) in langOptions"
                       :key="index"
                       :label="item.label"
                       :value="item.value"/>
          </t-select>
          <t-button theme="warning" @click="changeServer" v-if="hasClientServer">
            <template #icon><add-icon /></template>
            {{ $t('topNav.current_server')}} {{ current_server.client_server_name }}
          </t-button>
          <t-dropdown :min-column-width="125" trigger="click">
            <template #dropdown>
              <t-dropdown-menu>
                <t-dropdown-item class="operations-dropdown-container-item" @click="handleNav('/user/index')">
                  <user-circle-icon /> {{ $t('topNav.dropdown_person_center')}}
                </t-dropdown-item>
                <t-dropdown-item class="operations-dropdown-container-item" :disabled="isUpdateloading" @click="checkVersion('manual')">
                  <RotateIcon /> {{ $t('topNav.dropdown_update')}}
                </t-dropdown-item>
                <t-dropdown-item class="operations-dropdown-container-item" :disabled="isResetloading" @click="resetServer">
                  <ArrowUpDownCircleIcon />{{ $t('topNav.dropdown_reboot_waf')}}
                </t-dropdown-item>
                <t-dropdown-item class="operations-dropdown-container-item" @click="handleLogout">
                  <poweroff-icon />{{ $t('topNav.dropdown_logout')}}
                </t-dropdown-item>
              </t-dropdown-menu>
            </template>
            <t-button class="header-user-btn" theme="default" variant="text">
              <template #icon>
                <user-circle-icon class="header-user-avatar" />
              </template>
              <div class="header-user-account">
                {{current_account}}
                <chevron-down-icon />
              </div>
            </t-button>
          </t-dropdown>
          <t-tooltip placement="bottom" :content="$t('topNav.system_config')">
            <t-button theme="default" shape="square" variant="text" @click="toggleSettingPanel">
              <setting-icon />
            </t-button>
          </t-tooltip>
        </div>
      </template>
    </t-head-menu>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import {
    ViewListIcon,
    LogoGithubIcon,
    HelpCircleIcon,
    UserCircleIcon,
    PoweroffIcon,
    SettingIcon,
    ChevronDownIcon,
    RotateIcon,
    Icon,
    MailIcon,
    NotificationErrorIcon,
    ArrowUpDownCircleIcon,
    AddIcon,
    LogoWechatStrokeIcon
  } from 'tdesign-icons-vue';
  import {
    prefix
  } from '@/config/global';
  import LogoFull from '@/assets/assets-logo-full.svg';
  import {
    CheckVersionApi,DoUpdateApi
  } from '@/apis/sysinfo';
  import { marked } from 'marked'; // 导入 marked

  import Notice from './Notice.vue';
  import Search from './Search.vue';
  import MenuContent from './MenuContent.vue';
  import SystemMonitor from './SystemMonitor.vue';
  import {logoutapi} from '@/apis/login'
  export default Vue.extend({
    components: {
      MenuContent,
      LogoFull,
      Notice,
      Search,
      SystemMonitor,
      ViewListIcon,
      LogoGithubIcon,
      HelpCircleIcon,
      UserCircleIcon,
      PoweroffIcon,
      SettingIcon,
      ChevronDownIcon,
      RotateIcon,
      Icon,
      MailIcon,
      NotificationErrorIcon,
      ArrowUpDownCircleIcon,
      AddIcon,
      LogoWechatStrokeIcon
    },
    props: {
      theme: String,
      layout: {
        type: String,
        default: 'top',
      },
      showLogo: {
        type: Boolean,
        default: true,
      },
      menu: {
        type: Array,
      },
      isFixed: {
        type: Boolean,
        default: false,
      },
      isCompact: {
        type: Boolean,
        default: false,
      },
      maxLevel: {
        type: Number,
        default: 3,
      },
    },
    data() {
      return {
        prefix,
        visibleNotice: false,
        isSearchFocus: false,
        isResetloading:false,
        /**更新内容**/
        hasNewVersion:false,//是否有新版本
        isUpdateloading:false,
        update_visible:false,
        update_new_ver:"",
        update_desc:"",
        current_account:"not login",
        /**微信二维码对话框**/
        wechat_visible: false, 
        /**控制中心相关**/
        hasClientServer:false,
        current_server:"",
        /**语言问题**/
        langValue:"zh_CN",
        langOptions: [
          {
            value: "zh_CN",
            label: "中文"
          },
          {
            value: "en_US",
            label: "English"
          },
        ],
      };
    },
    computed: {
      active() {
        if (!this.$route.path) {
          return '';
        }
        return this.$route.path
          .split('/')
          .filter((item, index) => index <= this.maxLevel && index > 0)
          .map((item) => `/${item}`)
          .join('');
      },
      showMenu() {
        return !(this.layout === 'mix' && this.showLogo === 'side');
      },
      layoutCls() {
        return [`${this.prefix}-header-layout`];
      },
      menuCls() {
        return [{
          [`${this.prefix}-header-menu`]: !this.isFixed,
          [`${this.prefix}-header-menu-fixed`]: this.isFixed,
          [`${this.prefix}-header-menu-fixed-side`]: this.layout === 'side' && this.isFixed,
          [`${this.prefix}-header-menu-fixed-side-compact`]: this.layout === 'side' && this.isFixed && this
            .isCompact,
        }, ];
      },
      compiledMarkdown() {
        return marked(this.update_desc || '');
      },
    },
    mounted() {
      // 首次提示，每隔24小时 进行弹窗 ，其余实际不弹窗
      this.checkVersion("auto")
      this.init()
    },
    methods: {
      // 切换语言
      changeLangEvent(value, context) {
        switch (value) {
          case "zh_CN":
            this.langValue = value;
            this.$i18n.locale = this.langValue;
            localStorage.setItem("lang",this.langValue)
            break;
          case "en_US":
            this.langValue = value;
            this.$i18n.locale = this.langValue;
            localStorage.setItem("lang",this.langValue)
            break;
          default:
            break;
        }
        location.reload(); // 刷新页面
      },
      //init
      init(){
        //帐号初始化
        this.current_account = localStorage.getItem("current_account")
        //管控初始化
        if(localStorage.getItem("current_server")){
          this.hasClientServer = true
          this.current_server = JSON.parse(localStorage.getItem("current_server"))
        }else{
          this.hasClientServer = false
        }
        //多语言
        this.langValue = localStorage.getItem("lang") || "zh_CN"

      },
      //切换服务器
      changeServer(){
        this.$router.push('/center/CenterManager');
      },
      toggleSettingPanel() {
        this.$store.commit('setting/toggleSettingPanel', true);
      },
      handleLogout() {
        let current_account_token = localStorage.getItem("account_token")?localStorage.getItem("account_token"):""
        logoutapi({account_token:current_account_token})
        .then((res)=>{
            if(res.code==0){
              this.$router.push(`/login?redirect=${this.$router.history.current.fullPath}`);
            }else{
              this.$message.warning(res.msg);
            }
        })


      },
      changeCollapsed() {
        this.$store.commit('setting/toggleSidebarCompact');
      },
      handleNav(url) {
        this.$router.push(url);
      },
      navToHelper() {
        window.open(this.samwafglobalconfig.getOnlineUrl());
      },
      resetServer() {
        let that = this
        that.isResetloading = true
        this.$request
          .get('/resetWAF')
          .then((res) => {
            let resdata = res
            console.log(resdata)
            if (resdata.code === 0) {
              that.$message.success(resdata.msg);
              setTimeout(function() {
              		that.isResetloading = false
              }, 3000); // 定时时间
            } else {
              that.$message.warning(resdata.msg);
            }
          })
          .catch((e: Error) => {
            console.log(e);
            that.isResetloading = false
          })
          .finally(() => {});
      } ,
      sendMail(){
        const email = 'samwafgo@gmail.com'; // 设置收件人地址
        window.location.href = `mailto:${email}`;
      },
      openWechat(){
        this.wechat_visible = true;
      },
      checkVersion(method){
          let that = this;
          CheckVersionApi().then((res) => {
            let resdata = res
            console.log(resdata)
            if (resdata.code === 0) {
              that.hasNewVersion = true
              that.update_new_ver = resdata.data.version_new
              that.update_desc = resdata.data.version_desc
              if(method =="manual"){
                that.update_visible = true
              }else{
                // 从本地存储获取上次显示弹窗的时间
                const lastUpdatePopupTime = localStorage.getItem("lastUpdatePopupTime");

                // 如果是beta版本，不自动弹出提示
                if (that.update_new_ver && that.update_new_ver.toLowerCase().includes('beta')) {
                  // 只设置有新版本标志，但不弹窗
                  that.hasNewVersion = true;
                } else {
                  // 如果上次显示时间不存在或距离当前时间超过24小时，则显示弹窗
                  if (!lastUpdatePopupTime || Date.now() - lastUpdatePopupTime > 24 * 60 * 60 * 1000) {
                    that.update_visible = true
                    // 更新本地存储的上次显示时间为当前时间
                    localStorage.setItem("lastUpdatePopupTime", Date.now());
                  }
                }
              }

            }else{
              if(method =="manual"){
                that.$message.warning(resdata.msg);
              }
            }
          })
          .catch((e: Error) => {
            if(method =="manual"){
             that.$message.warning("检测版本异常，请检测网络");
            }
          })
      },
      handleConfirmUpdate() {
        // 如果是beta版本，需要二次确认
        if (this.update_new_ver && this.update_new_ver.toLowerCase().includes('beta')) {
          const confirmDia = this.$dialog.confirm({
            header: this.$t('topNav.update.beta_confirm_title') || '确认更新测试版本',
            body: this.$t('topNav.update.beta_confirm_content') || '您正在更新测试版本，该版本可能不稳定，确定要继续吗？',
            confirmBtn: {
              theme: 'danger',
              content: this.$t('topNav.update.beta_confirm_yes') || '确认更新',
            },
            cancelBtn: {
              theme: 'default',
              content: this.$t('topNav.update.beta_confirm_no') || '取消',
            },
            onConfirm: () => {
              this.handleDoUpdate();
              confirmDia.destroy();
            },
          });
        } else {
          // 非beta版本直接更新
          this.handleDoUpdate();
        }
      },
      handleDoUpdate(){
          //处理升级
          let that = this;
          that.isUpdateloading = true;
          // 检查是否为beta版本，如果是则添加渠道参数
          const params = that.update_new_ver && that.update_new_ver.toLowerCase().includes('beta')
            ? { channel: 'github' }
            : {channel: 'official'};

          DoUpdateApi(params).then((res) => {
            let resdata = res
            console.log(resdata)
            if (resdata.code === 0) {
              that.$message.success(resdata.msg);
              that.update_visible = false

            }else{
              that.$message.warning(resdata.msg);
               // 升级失败，关闭加载并显示错误信息
              that.isUpdateloading = false;
            }
          })
          .catch((e: Error) => {
             // 请求异常，关闭加载并显示错误信息
            that.isUpdateloading = false;
            console.log(e);
        })
      }
    },
  });
</script>
<style lang="less">
  @import '@/style/variables.less';

  .header-menu {
    flex: 1 1 1;
    display: inline-flex;
  }

  .operations-container {
    display: flex;
    align-items: center;
    margin-right: 12px;
    overflow: visible; /* 确保下拉面板不被裁剪 */

    .t-popup__reference {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .t-button {
      margin: 0 8px;

      &.header-user-btn {
        margin: 0;
      }
    }

    .t-icon {
      font-size: 20px;

      &.general {
        margin-right: 16px;
      }
    }
  }

  /* 确保头部菜单容器也不会裁剪下拉内容 */
  .t-head-menu__inner {
    border-bottom: 1px solid var(--td-border-level-1-color);
    overflow: visible; /* 确保下拉面板不被裁剪 */
  }

  .header-operate-left {
    display: flex;
    margin-left: 20px;
    align-items: normal;
    line-height: 0;

    .collapsed-icon {
      font-size: 20px;
    }
  }

  .header-logo-container {
    width: 184px;
    height: 26px;
    display: flex;
    margin-left: 24px;
    padding: 0 0px;
    color: var(--td-text-color-primary);

    .t-logo {
      width: 100%;
      height: 100%;
      padding: 0 0px;
      &:hover {
        cursor: pointer;
      }
    }

    &:hover {
      cursor: pointer;
    }
  }

  .header-user-account {
    display: inline-flex;
    align-items: center;
    color: var(--td-text-color-primary);

    .t-icon {
      margin-left: 4px;
      font-size: 16px;
    }
  }

  .t-head-menu__inner {
    border-bottom: 1px solid var(--td-border-level-1-color);
  }

  .t-menu--light {
    .header-user-account {
      color: var(--td-text-color-primary);
    }
  }

  .t-menu--dark {
    .t-head-menu__inner {
      border-bottom: 1px solid var(--td-gray-color-10);
    }

    .header-user-account {
      color: rgba(255, 255, 255, 0.55);
    }

    .t-button {
      --ripple-color: var(--td-gray-color-10) !important;

      &:hover {
        background: var(--td-gray-color-12) !important;
      }
    }
  }

  .operations-dropdown-container-item {
    width: 100%;
    display: flex;
    align-items: center;

    .t-icon {
      margin-right: 8px;
    }

    .t-dropdown__item {
      .t-dropdown__item__content {
        display: flex;
        justify-content: center;
      }

      .t-dropdown__item__content__text {
        display: flex;
        align-items: center;
        font-size: 14px;
      }
    }

    .t-dropdown__item {
      width: 100%;
      margin-bottom: 0px;
    }

    &:last-child {
      .t-dropdown__item {
        margin-bottom: 8px;
      }
    }
  }

  /* 微信二维码对话框样式 */
  .wechat-qr-container {
    text-align: center;
    padding: 20px;
    
    .qr-image-wrapper {
      margin-bottom: 16px;
      
      .qr-image {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
    
    .qr-description {
      p {
        margin: 0;
        color: var(--td-text-color-secondary);
        font-size: 14px;
        line-height: 1.5;
      }
    }
  }
</style>

