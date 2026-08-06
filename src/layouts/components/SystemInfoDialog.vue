<template>
  <t-dialog
    width="900px"
    :visible="visible"
    :header="$t('common.system_info.title')"
    :footer="false"
    attach="body"
    @update:visible="(val) => $emit('update:visible', val)"
  >
    <div v-if="loading" class="sysinfo-loading">{{ $t('common.loading') }}</div>
    <div v-else>
      <t-alert v-if="loadFailed" theme="warning" :message="$t('common.system_info.load_failed')" style="margin-bottom: 12px" />

      <!-- 运行环境信息 -->
      <div class="sysinfo-grid">
        <div class="sysinfo-item" v-for="item in infoRows" :key="item.label">
          <span class="sysinfo-label">{{ item.label }}</span>
          <span class="sysinfo-value">
            {{ item.value }}
            <t-tag v-if="item.tag" size="small" :theme="item.tagTheme || 'primary'" variant="light">{{ item.tag }}</t-tag>
          </span>
        </div>
      </div>

      <div class="sysinfo-actions">
        <t-button theme="default" variant="outline" size="small" @click="handleCopy">
          {{ $t('common.system_info.copy_info') }}
        </t-button>
        <t-button theme="default" variant="text" size="small" @click="handleClose">
          {{ $t('common.close') }}
        </t-button>
      </div>

      <!-- 在线交流渠道 -->
      <div class="sysinfo-channel-title">{{ $t('common.system_info.channel_title') }}</div>
      <div class="sysinfo-channels">
        <a v-for="channel in channels" :key="channel.key" class="sysinfo-channel" :href="channel.url" target="_blank" rel="noopener noreferrer">
          <component :is="channel.icon" class="sysinfo-channel-icon" />
          {{ channel.label }}
        </a>
        <a class="sysinfo-channel" href="javascript:void(0)" @click="wechatVisible = !wechatVisible">
          <logo-wechat-stroke-icon class="sysinfo-channel-icon" />
          {{ $t('common.system_info.wechat_mp') }}
        </a>
        <!-- 在线客服放最后 -->
        <a class="sysinfo-channel" href="https://service.samwaf.com/" target="_blank" rel="noopener noreferrer">
          <service-icon class="sysinfo-channel-icon" />
          {{ $t('common.system_info.online_service') }}
        </a>
      </div>
      <div v-if="wechatVisible" class="sysinfo-wechat">
        <img src="@/assets/assets-mp-samwaf.png" class="sysinfo-wechat-img" />
      </div>
    </div>
  </t-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { MessagePlugin } from 'tdesign-vue';
import {
  ServiceIcon,
  BookOpenIcon,
  LogoGithubIcon,
  GitRepositoryIcon,
  MailIcon,
  LogoWechatStrokeIcon,
} from 'tdesign-icons-vue';
import { SysRuntimeInfoApi } from '@/apis/sysinfo';

export default Vue.extend({
  name: 'SystemInfoDialog',
  components: {
    LogoWechatStrokeIcon,
    ServiceIcon,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading: false,
      loadFailed: false,
      wechatVisible: false,
      info: {} as Record<string, any>,
    };
  },
  computed: {
    // 在线交流渠道：地址固定，用户反馈问题时可直接跳转（微信公众号、在线客服在模板里单列，排在最后）
    channels(): Array<{ key: string; label: string; url: string; icon: any }> {
      return [
        { key: 'doc', label: this.$t('common.system_info.online_document') as string, url: 'https://doc.samwaf.com', icon: BookOpenIcon },
        { key: 'github', label: this.$t('common.system_info.github_issue') as string, url: 'https://github.com/samwafgo/SamWaf/issues', icon: LogoGithubIcon },
        { key: 'gitee', label: this.$t('common.system_info.gitee_issue') as string, url: 'https://gitee.com/samwaf/SamWaf/issues', icon: GitRepositoryIcon },
        { key: 'email', label: this.$t('common.system_info.email') as string, url: 'mailto:samwafgo@gmail.com', icon: MailIcon },
      ];
    },
    // 展示行：取不到的字段直接不展示，保证任何一项缺失都不影响弹窗
    infoRows(): Array<{ label: string; value: string; tag?: string; tagTheme?: string }> {
      const info = this.info || {};
      const t = (key: string) => this.$t(`common.system_info.${key}`) as string;
      const rows: Array<{ label: string; value: string; tag?: string; tagTheme?: string }> = [];

      const versionText = [info.version_name, info.version ? `(${info.version})` : ''].filter(Boolean).join(' ');
      if (versionText) {
        rows.push({
          label: t('software_version'),
          value: versionText,
          tag: info.version_release === 'false' ? t('release_debug') : t('release_official'),
          tagTheme: info.version_release === 'false' ? 'warning' : 'success',
        });
      }
      if (info.os_name) {
        rows.push({ label: t('os'), value: info.os_name });
      }
      if (info.os) {
        rows.push({ label: t('system_type'), value: info.os });
      }
      if (info.arch) {
        // 32位程序跑在64位系统时，内核架构与编译架构不同，一并展示便于定位
        const arch = info.kernel_arch && info.kernel_arch !== info.arch ? `${info.arch} (${t('kernel_arch')}: ${info.kernel_arch})` : info.arch;
        rows.push({ label: t('arch'), value: arch });
      }
      if (info.kernel_version) {
        rows.push({ label: t('kernel'), value: info.kernel_version });
      }
      if (info.go_version) {
        rows.push({ label: t('go_version'), value: info.go_version });
      }
      // 运行环境：容器/K8s/WSL/虚拟化，识别到才展示
      const envParts: string[] = [];
      if (info.container) {
        envParts.push(`${t('container')}(${info.container})`);
      }
      if (info.in_kubernetes) {
        envParts.push(t('kubernetes'));
      }
      if (info.is_wsl) {
        envParts.push(t('wsl'));
      }
      if (info.virtualization) {
        envParts.push(`${t('virtualization')}(${info.virtualization})`);
      }
      if (envParts.length > 0) {
        rows.push({ label: t('runtime_env'), value: envParts.join(' / ') });
      }
      // Win7 内核只在 Windows 下才有意义
      if (info.is_windows) {
        rows.push({
          label: t('win7_kernel'),
          value: info.is_win7_kernel ? (this.$t('common.yes') as string) : (this.$t('common.no') as string),
          tag: info.is_win7_build ? t('win7_build') : '',
          tagTheme: 'warning',
        });
      }
      if (info.os) {
        rows.push({
          label: t('start_mode'),
          value: info.run_as_service ? t('start_service') : t('start_console'),
        });
      }
      if (info.system_uptime_seconds > 0) {
        rows.push({ label: t('system_uptime'), value: this.formatDuration(info.system_uptime_seconds) });
      }
      if (info.process_uptime_seconds >= 0 && info.os) {
        rows.push({ label: t('process_uptime'), value: this.formatDuration(info.process_uptime_seconds) });
      }
      return rows;
    },
  },
  watch: {
    visible(newVal: boolean) {
      if (newVal) {
        this.loadRuntimeInfo();
      }
    },
  },
  methods: {
    handleClose() {
      this.$emit('update:visible', false);
    },
    loadRuntimeInfo() {
      this.loading = true;
      this.loadFailed = false;
      this.wechatVisible = false;
      SysRuntimeInfoApi()
        .then((res: any) => {
          if (res && res.code === 0 && res.data) {
            this.info = res.data;
          } else {
            this.loadFailed = true;
          }
        })
        .catch(() => {
          // 接口异常时仍然展示弹窗（交流渠道可用），只是环境信息为空
          this.loadFailed = true;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    formatDuration(totalSeconds: number): string {
      const total = Math.max(0, Math.floor(Number(totalSeconds) || 0));
      return this.$t('common.system_info.duration', {
        days: Math.floor(total / 86400),
        hours: Math.floor(total / 3600) % 24,
        minutes: Math.floor(total / 60) % 60,
        seconds: total % 60,
      }) as string;
    },
    handleCopy() {
      const text = this.infoRows.map((row) => `${row.label}: ${row.value}${row.tag ? ` [${row.tag}]` : ''}`).join('\n');
      const onSuccess = () => MessagePlugin.success(this.$t('common.system_info.copy_success') as string);
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(() => this.fallbackCopy(text, onSuccess));
      } else {
        this.fallbackCopy(text, onSuccess);
      }
    },
    fallbackCopy(text: string, onSuccess: () => void) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        onSuccess();
      } catch (e) {
        MessagePlugin.warning(this.$t('common.system_info.copy_failed') as string);
      }
    },
  },
});
</script>

<style lang="less" scoped>
/* 窗口宽度按内容放宽，小屏时不撑出屏幕 */
::v-deep .t-dialog {
  max-width: 92vw;
}

.sysinfo-loading {
  padding: 32px 0;
  text-align: center;
  color: var(--td-text-color-secondary);
}

.sysinfo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 24px;
}

@media screen and (max-width: 600px) {
  .sysinfo-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.sysinfo-item {
  display: flex;
  align-items: flex-start;
  line-height: 22px;
  word-break: break-all;
}

.sysinfo-label {
  flex: 0 0 auto;
  min-width: 96px;
  color: var(--td-text-color-secondary);
}

.sysinfo-value {
  flex: 1;
  color: var(--td-text-color-primary);
}

.sysinfo-actions {
  margin-top: 16px;
}

.sysinfo-channel-title {
  margin-top: 20px;
  padding-top: 12px;
  border-top: 1px solid var(--td-component-stroke);
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.sysinfo-channels {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

/* 渠道做成带图标的按钮块，比纯文字链接更容易被注意到 */
.sysinfo-channel {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-default);
  color: var(--td-text-color-primary);
  text-decoration: none;
  transition: all 0.2s;
}

.sysinfo-channel:hover {
  border-color: var(--td-brand-color);
  color: var(--td-brand-color);
  background-color: var(--td-brand-color-light);
}

.sysinfo-channel-icon {
  font-size: 16px;
}

.sysinfo-wechat {
  margin-top: 12px;
  text-align: center;
}

.sysinfo-wechat-img {
  max-width: 320px;
  width: 100%;
}
</style>
