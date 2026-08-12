<template>
  <div>
    <t-card class="list-card-container">
      <!-- 标题 -->
      <t-row justify="space-between" style="margin-bottom: 16px;">
        <div class="left-operation-container">
          <h3>{{ $t('page.iplocation.title') }}</h3>
        </div>
      </t-row>

      <!-- 页面级说明统一走 help-block，和威胁情报等页面保持一致 -->
      <help-block
        :summary="$t('page.iplocation.hb_summary')"
        :items="helpItems"
        :note="$t('page.iplocation.hb_note')"
        :title="$t('page.iplocation.title')"
        doc="guide/IPLocation"
        storage-key="iplocation"
      ></help-block>

      <!-- IP 查询测试（固定在顶部） -->
      <div class="test-section">
        <t-form layout="inline" :label-width="120">
          <t-form-item :label="$t('page.iplocation.test_ip')">
            <t-input v-model="testIP" :placeholder="$t('page.iplocation.test_ip_placeholder')" style="width: 280px;"></t-input>
            <t-popup trigger="hover" placement="right" :overlay-inner-style="{ padding: '10px 14px' }">
              <help-circle-icon style="margin-left: 8px; cursor: pointer; color: var(--td-text-color-secondary); font-size: 16px; vertical-align: middle;" />
              <template #content>
                <div style="font-size: 12px;">
                  <div style="color: var(--td-text-color-secondary); margin-bottom: 6px;">点击下方 IP 自动填入</div>
                  <div style="margin-bottom: 4px;">
                    <span style="color: var(--td-text-color-secondary); margin-right: 6px;">Google IPv4:</span>
                    <t-link theme="primary" @click="testIP = '8.8.8.8'">8.8.8.8</t-link>
                  </div>
                  <div>
                    <span style="color: var(--td-text-color-secondary); margin-right: 6px;">Google IPv6:</span>
                    <t-link theme="primary" @click="testIP = '2001:4860:4860::8888'">2001:4860:4860::8888</t-link>
                  </div>
                </div>
              </template>
            </t-popup>
          </t-form-item>
          <t-form-item>
            <t-button theme="primary" @click="handleTest">{{ $t('page.iplocation.test_button') }}</t-button>
          </t-form-item>
        </t-form>
        <div v-if="testResult" class="test-result-box">
          <div class="result-meta-row">
            <t-tag theme="primary" variant="light" size="small">{{ testResult.ip_type || '-' }}</t-tag>
            <t-tag theme="success" variant="light" size="small">数据源：{{ testResult.used_source || '-' }}</t-tag>
            <t-tag v-if="testResult.used_source === 'ip2region' && testResult.used_format" theme="default" variant="light" size="small">格式：{{ testResult.used_format }}</t-tag>
          </div>
          <span class="result-item"><strong>{{ $t('page.iplocation.country') }}：</strong>{{ testResult.country || '-' }}</span>
          <span class="result-item"><strong>{{ $t('page.iplocation.province') }}：</strong>{{ testResult.province || '-' }}</span>
          <span class="result-item"><strong>{{ $t('page.iplocation.city') }}：</strong>{{ testResult.city || '-' }}</span>
          <span class="result-item"><strong>{{ $t('page.iplocation.isp') }}：</strong>{{ testResult.isp || '-' }}</span>
          <span class="result-item"><strong>{{ $t('page.iplocation.region') }}：</strong>{{ testResult.region || '-' }}</span>
          <span class="result-item"><strong>{{ $t('page.iplocation.district') }}：</strong>{{ testResult.district || '-' }}</span>
        </div>
      </div>

      <!-- ============ 段一：当前生效 ============ -->
      <div class="sec-head">
        <span class="sec-title">{{ $t('page.iplocation.sec_current') }}</span>
        <span class="sec-rule"></span>
      </div>

      <div class="config-row">
        <div class="config-col" v-for="p in protoList" :key="p.key">
          <!-- 用自绘卡片而不是 t-card：需要整卡随「未保存」变色 -->
          <div class="cfg-card" :class="{ 'is-edited': isProtoDirty(p.key) }">
            <div class="cfg-card-head">
              <span class="cfg-card-title">{{ p.title }}</span>
              <t-tag v-if="isProtoDirty(p.key)" theme="warning" variant="light" size="small">
                {{ $t('page.iplocation.state_unsaved') }}
              </t-tag>
              <t-tag v-else theme="success" variant="light" size="small">
                {{ $t('page.iplocation.state_running') }}
              </t-tag>
            </div>

            <div class="cfg-card-body">
              <t-form :label-width="76">
                <!-- 你选的：和下面「正在运行」区分开，避免两者不一致时被当成故障 -->
                <t-form-item :label="$t('page.iplocation.selected_label')">
                  <div class="field-line" :class="{ 'is-edited': isSourceDirty(p.key) }">
                    <t-select v-model="configForm[p.sourceKey]" style="width: 190px;">
                      <t-option v-for="s in p.sources" :key="s.value" :value="s.value" :label="s.label"></t-option>
                    </t-select>
                    <t-tag v-if="fileExistsFor(p.key, configForm[p.sourceKey])" theme="success" size="small" variant="light">✓ {{ $t('page.iplocation.file_ready') }}</t-tag>
                    <t-tag v-else-if="builtinExistsFor(p.key, configForm[p.sourceKey])" theme="primary" size="small" variant="light">✓ {{ $t('page.iplocation.builtin_ready') }}</t-tag>
                    <t-tag v-else theme="warning" size="small" variant="light">⚠ {{ $t('page.iplocation.file_missing') }}</t-tag>
                    <t-tag v-if="isSourceDirty(p.key)" theme="warning" size="small">{{ $t('page.iplocation.tag_unsaved') }}</t-tag>
                  </div>
                </t-form-item>

                <!-- 字段格式只有 ip2region 有，其余来源整行不渲染 -->
                <t-form-item v-if="configForm[p.sourceKey] === 'ip2region'" :label="$t('page.iplocation.format')">
                  <div class="field-line" :class="{ 'is-edited': isFormatDirty(p.key) }">
                    <t-select v-model="configForm[p.formatKey]" style="width: 190px;">
                      <t-option v-for="f in formatDescriptions" :key="f.id" :value="f.id" :label="f.version"></t-option>
                    </t-select>
                    <t-tag v-if="isFormatDirty(p.key)" theme="warning" size="small">{{ $t('page.iplocation.tag_unsaved') }}</t-tag>
                  </div>
                  <!-- 就地写清所选格式的字段结构，比一整段文字说明有用得多 -->
                  <div class="compat-box">
                    <div class="compat-struct">{{ formatInfo(configForm[p.formatKey]).fields }}</div>
                    <div class="compat-meta">
                      <strong>{{ formatFieldCount(configForm[p.formatKey]) }} {{ $t('page.iplocation.format_hint_count') }}</strong>
                      · {{ formatLangText(configForm[p.formatKey]) }}
                      <t-link theme="primary" size="small" style="margin-left: 6px;" @click="openFormatHelp(configForm[p.formatKey])">
                        {{ $t('page.iplocation.format_view_all') }}
                      </t-link>
                    </div>
                  </div>
                </t-form-item>

                <!-- GeoLite2 已去内嵌，选中时明确告诉用户要自己准备文件，别让人一脸懵 -->
                <t-form-item v-if="p.key === 'ipv6' && configForm.ipv6_source === 'geolite2' && !fileExistsFor('ipv6', 'geolite2')">
                  <t-alert theme="warning" :message="$t('page.iplocation.geolite2_notice')"></t-alert>
                </t-form-item>
                <t-form-item v-else-if="!sourceReadyFor(p.key, configForm[p.sourceKey])">
                  <t-alert theme="warning" :message="$t('page.iplocation.ipv6_missing_notice')"></t-alert>
                </t-form-item>
              </t-form>

              <!-- 正在运行：明确这里描述的是运行态，不是上面刚选的 -->
              <div class="run-head">
                <span class="run-title">{{ $t('page.iplocation.running_title') }}</span>
                <t-tag v-if="isProtoDirty(p.key)" theme="default" size="small" variant="light">
                  {{ $t('page.iplocation.running_excludes') }}
                </t-tag>
              </div>
              <dl class="run-kv">
                <template v-for="(row, idx) in runRows(p.key)">
                  <dt :key="'dt' + idx">{{ row.label }}</dt>
                  <dd :key="'dd' + idx">
                    {{ row.value }}
                    <t-tag v-if="row.builtin" theme="primary" size="small" variant="light" style="margin-left: 6px;">{{ $t('page.iplocation.builtin_tag') }}</t-tag>
                  </dd>
                </template>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 保存条：无改动时置灰，有改动时说清是哪个协议、从什么改成了什么 -->
      <div class="savebar" :class="{ 'is-dirty': isDirty }">
        <span class="savebar-msg">{{ dirtyText }}</span>
        <div class="savebar-actions">
          <t-button size="small" theme="default" variant="outline" :disabled="!isDirty" @click="handleResetConfig">
            {{ $t('page.iplocation.btn_revert') }}
          </t-button>
          <t-button size="small" theme="primary" :disabled="!isDirty" @click="handleSaveConfig">
            {{ $t('page.iplocation.btn_save_apply') }}
          </t-button>
        </div>
      </div>

      <!-- ============ 段二：本地库文件 ============ -->
      <div class="sec-head">
        <span class="sec-title">{{ $t('page.iplocation.sec_files') }}</span>
        <span class="sec-rule"></span>
        <div class="sec-actions">
          <t-button size="small" theme="default" variant="outline" :loading="downloadChecking" @click="handleCheckUpgrade">
            {{ $t('page.iplocation.download_check') }}
          </t-button>
          <t-button size="small" theme="default" variant="outline" @click="handleReload">
            {{ $t('page.iplocation.reload_button') }}
          </t-button>
        </div>
      </div>

      <!-- 手工替换目录：排错时最常问的一句话，常驻页面而不是藏进说明里 -->
      <div class="pathbar">
        <div class="pathbar-line">
          <span class="pathbar-label">{{ $t('page.iplocation.path_title') }}</span>
          <code class="pathbar-path">{{ upgradeInfo.data_dir || dataDirFallback }}</code>
          <t-button size="small" theme="default" variant="outline" @click="copyDataDir">
            {{ $t('page.iplocation.manual_copy_path') }}
          </t-button>
        </div>
        <div class="pathbar-hint">{{ $t('page.iplocation.path_hint') }}</div>
      </div>

      <t-alert v-if="upgradeError" theme="warning" :message="upgradeError" style="margin-bottom: 12px;"></t-alert>

      <!-- 下载进度：35MB 的包不给进度只给个转圈，用户根本不知道要等多久 -->
      <div v-if="downloadingKey" class="download-progress-box">
        <div class="download-progress-head">
          <span>{{ progressStateText(progress.state) }}<template v-if="progress.file_name"> · {{ progress.file_name }}</template></span>
          <span class="download-progress-bytes">
            {{ formatProgressSize(progress.downloaded) }} / {{ formatProgressSize(progress.total) }}
            <template v-if="progress.total > 0">（{{ progress.percent.toFixed(1) }}%）</template>
          </span>
        </div>
        <!-- 拿不到总大小时退化成不确定进度条，别画一个假的百分比 -->
        <t-progress
          v-if="progress.total > 0"
          theme="line"
          :percentage="Number(progress.percent.toFixed(1))"
          :label="false"
        ></t-progress>
        <t-progress v-else theme="line" :percentage="0" :label="false"></t-progress>
        <div class="download-progress-foot">
          <span class="download-progress-tip">{{ $t('page.iplocation.download_running') }}</span>
          <!-- 官方源在部分网络下很慢，必须让用户能停下来改用手动下载 -->
          <t-button size="small" theme="default" variant="outline" @click="handleCancelUpgrade">
            {{ $t('page.iplocation.download_cancel') }}
          </t-button>
        </div>
      </div>

      <!-- 首屏异步拉清单，拉不到时说清原因并给重试，别只留一张空表 -->
      <div v-if="!hasFileRows && downloadChecking" class="files-empty">
        <t-loading size="small"></t-loading>
        <span>{{ $t('page.iplocation.files_loading') }}</span>
      </div>
      <div v-else-if="!hasFileRows" class="files-empty">
        <span>{{ $t('page.iplocation.files_empty_tip') }}</span>
        <t-button size="small" theme="primary" variant="outline" @click="handleCheckUpgrade">
          {{ $t('page.iplocation.download_check') }}
        </t-button>
      </div>

      <t-table v-else :data="upgradeInfo.files" :columns="fileColumns" :bordered="true" :hover="true" size="small" rowKey="key">
        <!-- 数据库：名称 + 覆盖的 IP 类型。许可证对选库没有帮助，挪进帮助抽屉 -->
        <template #db="{ row }">
          <div style="font-weight: 500;">{{ row.desc }}</div>
          <div style="margin-top: 3px;">
            <t-tag size="small" variant="light" theme="default">{{ ipTypeText(row.ip_type) }}</t-tag>
          </div>
        </template>
        <!-- 文件名：用户手工放/上传都必须用这个名字，所以要显眼且可复制 -->
        <template #file="{ row }">
          <code class="file-name" @click="copyText(row.file_name)" :title="$t('page.iplocation.files_copy_name')">{{ row.file_name }}</code>
        </template>
        <!-- 用途：把「配置页选了谁」和「文件页有什么」这两件事在同一行里对上 -->
        <template #use="{ row }">
          <div class="use-tags">
            <t-tag
              v-for="(u, i) in usageTags(row)"
              :key="i"
              :theme="u.theme"
              size="small"
              variant="light"
            >{{ u.text }}</t-tag>
            <span v-if="!usageTags(row).length" class="use-none">{{ $t('page.iplocation.use_none') }}</span>
          </div>
        </template>
        <template #local="{ row }">
          <template v-if="row.local_exists">
            <t-tag theme="success" size="small" variant="light">{{ $t('page.iplocation.download_local_installed') }}</t-tag>
            <div class="local-meta">
              {{ formatFileSize(row.local_size) }}
              <template v-if="row.local_version"> · {{ row.local_version }}</template>
              <template v-if="row.local_mod_time"><br />{{ row.local_mod_time }}</template>
            </div>
          </template>
          <template v-else-if="row.builtin">
            <t-tag theme="primary" size="small" variant="light">{{ $t('page.iplocation.builtin_ready') }}</t-tag>
            <div class="local-meta">{{ $t('page.iplocation.files_builtin_meta') }}</div>
          </template>
          <t-tag v-else theme="warning" size="small" variant="light">{{ $t('page.iplocation.download_local_none') }}</t-tag>
        </template>
        <template #remote="{ row }">
          <span v-if="row.available">{{ row.latest_version }} / {{ formatFileSize(row.remote_size) }}</span>
          <span v-else-if="row.downloadable" style="color: var(--td-text-color-secondary);">{{ $t('page.iplocation.download_remote_none') }}</span>
          <!-- 不可在线下载不是「没做」，是许可证不允许转发分发，要说清楚 -->
          <span v-else class="obtain-hint">{{ obtainHint(row) }}</span>
        </template>
        <template #action="{ row }">
          <div class="row-actions">
            <t-button
              v-if="row.downloadable"
              size="small"
              theme="primary"
              variant="outline"
              :disabled="!row.available || downloadingKey !== ''"
              :loading="downloadingKey === row.key"
              @click="handleApplyUpgrade(row)"
            >
              <template v-if="downloadingKey === row.key && progress.total > 0">{{ progress.percent.toFixed(0) }}%</template>
              <template v-else>{{ row.local_exists ? $t('page.iplocation.download_redownload') : $t('page.iplocation.download_button') }}</template>
            </t-button>
            <!-- 上传带上 key，后端据此确定落盘文件名，不再靠扩展名猜是哪个库 -->
            <t-upload
              :action="uploadUrl"
              :headers="uploadHeaders"
              :data="{ type: row.upload_type, key: row.key }"
              :before-upload="beforeUpload"
              @success="handleUploadSuccess"
              @fail="handleUploadFail"
              :accept="row.accept"
              theme="custom"
            >
              <t-button size="small" theme="default" variant="outline">
                {{ $t('page.iplocation.files_upload') }}
              </t-button>
            </t-upload>
            <!-- 官方源慢的时候用户就在这一行点「重新下载」，镜像地址必须也在这一行 -->
            <t-popup v-if="row.downloadable" trigger="click" placement="bottom-right" :overlay-inner-style="{ padding: '12px 14px', maxWidth: '320px' }">
              <t-link theme="primary" size="small">{{ $t('page.iplocation.manual_row_link') }}</t-link>
              <template #content>
                <div class="manual-pop">
                  <div class="manual-pop-head">{{ $t('page.iplocation.manual_row_head') }}</div>
                  <!-- 上游文件名和 SamWaf 要的文件名并排放，不一致时一眼能看出来 -->
                  <div class="manual-pop-name">
                    <span class="manual-pop-tag">{{ $t('page.iplocation.manual_row_remote_name') }}</span>
                    <code class="file-name">{{ manualRemoteName(row) }}</code>
                  </div>
                  <div v-if="manualNeedsRename(row)" class="manual-pop-name">
                    <span class="manual-pop-tag is-warn">{{ $t('page.iplocation.manual_row_rename_to') }}</span>
                    <code class="file-name is-target">{{ row.file_name }}</code>
                  </div>
                  <div class="manual-pop-links">
                    <t-link href="https://gitee.com/lionsoul/ip2region/tree/master/data" target="_blank" theme="primary">Gitee</t-link>
                    <span class="manual-pop-sep">|</span>
                    <t-link href="https://github.com/lionsoul2014/ip2region/tree/master/data" target="_blank" theme="primary">GitHub</t-link>
                  </div>
                  <div class="manual-pop-foot">
                    {{ manualNeedsRename(row) ? $t('page.iplocation.manual_row_foot_rename') : $t('page.iplocation.manual_row_foot') }}
                  </div>
                </div>
              </template>
            </t-popup>
          </div>
        </template>
      </t-table>

    </t-card>

    <!-- 字段格式对照：只在选了 ip2region 时才有意义，所以做成上下文抽屉而不是页面级说明 -->
    <t-drawer
      :header="$t('page.iplocation.help_formats')"
      :visible.sync="helpVisible"
      size="520px"
      :footer="false"
    >
      <p class="help-text">{{ $t('page.iplocation.format_description_info') }}</p>
      <t-table
        :data="formatDescriptions"
        :columns="formatColumns"
        :bordered="true"
        :hover="true"
        size="small"
        rowKey="id"
        :row-class-name="formatRowClass"
      ></t-table>

      <!-- 投稿入口和格式说明是同一件事，放在这儿比压在页面底部合适 -->
      <div class="contribute-box">
        <p class="help-text">{{ $t('page.iplocation.contribute_desc') }}</p>
        <p>
          <span style="font-weight: 600;">{{ $t('page.iplocation.contribute_email_label') }}：</span>
          <t-link href="mailto:samwafgo@gmail.com" theme="primary">samwafgo@gmail.com</t-link>
        </p>
        <p class="help-text">{{ $t('page.iplocation.contribute_note') }}</p>
      </div>
    </t-drawer>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { MessagePlugin, DialogPlugin } from 'tdesign-vue';
import { HelpCircleIcon } from 'tdesign-icons-vue';
import { getIPDBStatusApi, getIPDBConfigApi, saveIPDBConfigApi, reloadIPDBApi, testIPLookupApi, checkIPDBUpgradeApi, applyIPDBUpgradeApi, getIPDBUpgradeProgressApi, cancelIPDBUpgradeApi } from '@/apis/iplocation';
import { getBaseUrl } from '@/utils/usuallytool';
import { v4 as uuidv4 } from 'uuid';

export default Vue.extend({
  name: 'IPLocation',
  components: { HelpCircleIcon },
  // 改了没保存就切走，配置会静默丢掉，这里拦一下
  beforeRouteLeave(to, from, next) {
    if (!(this as any).isDirty) {
      next();
      return;
    }
    const dialog = DialogPlugin.confirm({
      header: (this as any).$t('page.iplocation.leave_confirm_header'),
      body: (this as any).$t('page.iplocation.leave_confirm_body'),
      confirmBtn: (this as any).$t('page.iplocation.leave_confirm_ok'),
      cancelBtn: (this as any).$t('page.iplocation.leave_confirm_cancel'),
      onConfirm: () => { dialog.destroy(); next(); },
      onClose: () => { dialog.destroy(); next(false); },
    });
  },
  data() {
    return {
      status: {
        ipv4_source: '',
        ipv4_format: '',
        ipv4_file_size: 0,
        ipv4_load_time: '',
        ipv4_create_time: '',
        ipv4_builtin: false,
        ipv6_source: '',
        ipv6_format: '',
        ipv6_file_size: 0,
        ipv6_load_time: '',
        ipv6_create_time: '',
        ipv6_builtin: false,
        // 磁盘上是否有用户上传的文件
        file_exists: {
          ip2region_v4: false,
          ip2region_v6: false,
          geolite2: false,
          ipdb: false,
        },
        // 是否有内置数据兜底（随程序发布，无需上传）
        builtin_exists: {
          ip2region_v4: false,
          ip2region_v6: false,
          geolite2: false,
          ipdb: false,
        },
      },
      configForm: {
        ipv4_source: 'ip2region',
        ipv4_format: 'legacy',
        // GeoLite2 去内嵌后 IPv6 默认改用 ip2region，与后端默认值保持一致
        ipv6_source: 'ip2region',
        ipv6_format: 'legacy',
      },
      // 最近一次保存成功的配置，脏检查以它为基准
      savedConfig: {
        ipv4_source: 'ip2region',
        ipv4_format: 'legacy',
        ipv6_source: 'ip2region',
        ipv6_format: 'legacy',
      },
      protoList: [
        {
          key: 'ipv4',
          label: 'IPv4',
          title: this.$t('page.iplocation.ipv4_config'),
          sourceKey: 'ipv4_source',
          formatKey: 'ipv4_format',
          sources: [
            { value: 'ip2region', label: 'ip2region' },
            { value: 'ipdb', label: 'IPDB' },
          ],
        },
        {
          key: 'ipv6',
          label: 'IPv6',
          title: this.$t('page.iplocation.ipv6_config'),
          sourceKey: 'ipv6_source',
          formatKey: 'ipv6_format',
          sources: [
            { value: 'ip2region', label: 'ip2region' },
            { value: 'geolite2', label: 'GeoLite2' },
            { value: 'ipdb', label: 'IPDB' },
          ],
        },
      ],
      // 在线下载
      upgradeInfo: { latest_version: '', changelog: '', files: [] },
      upgradeError: '',
      downloadChecking: false,
      downloadingKey: '',
      // 下载进度（后端异步下载，这里轮询）
      progress: { key: '', file_name: '', total: 0, downloaded: 0, percent: 0, state: 'idle', message: '' },
      progressTimer: null,
      // 还没「检查更新」拿到服务端真实路径前的占位
      dataDirFallback: '<SamWaf 程序目录>/data',
      helpVisible: false,
      helpFormatId: '',
      fileColumns: [
        { colKey: 'db', title: this.$t('page.iplocation.download_col_file'), width: 230 },
        { colKey: 'file', title: this.$t('page.iplocation.files_col_name'), width: 200 },
        { colKey: 'use', title: this.$t('page.iplocation.col_use'), width: 150 },
        { colKey: 'local', title: this.$t('page.iplocation.download_col_local'), width: 180 },
        // 前两行是版本号、后两行是获取方式，列名得同时容得下这两种语义
        { colKey: 'remote', title: this.$t('page.iplocation.col_remote_source'), width: 220 },
        { colKey: 'action', title: this.$t('page.iplocation.download_col_action'), width: 240 },
      ],
      uploadUrl: '',
      uploadHeaders: {},
      testIP: '',
      testResult: null,
      formatColumns: [
        { colKey: 'version', title: this.$t('page.iplocation.format_version'), width: 110 },
        { colKey: 'fields', title: this.$t('page.iplocation.format_fields') },
      ],
      formatDescriptions: [
        {
          id: 'legacy',
          version: this.$t('page.iplocation.format_legacy'),
          fields: this.$t('page.iplocation.format_legacy_fields'),
          description: this.$t('page.iplocation.format_legacy_desc'),
        },
        {
          id: 'opensource',
          version: this.$t('page.iplocation.format_opensource'),
          fields: this.$t('page.iplocation.format_opensource_fields'),
          description: this.$t('page.iplocation.format_opensource_desc'),
        },
        {
          id: 'full',
          version: this.$t('page.iplocation.format_full'),
          fields: this.$t('page.iplocation.format_full_fields'),
          description: this.$t('page.iplocation.format_full_desc'),
        },
        {
          id: 'standard',
          version: this.$t('page.iplocation.format_standard'),
          fields: this.$t('page.iplocation.format_standard_fields'),
          description: this.$t('page.iplocation.format_standard_desc'),
        },
        {
          id: 'compact',
          version: this.$t('page.iplocation.format_compact'),
          fields: this.$t('page.iplocation.format_compact_fields'),
          description: this.$t('page.iplocation.format_compact_desc'),
        },
      ],
    };
  },
  computed: {
    hasFileRows(): boolean {
      return !!(this.upgradeInfo.files && this.upgradeInfo.files.length);
    },
    // 四个库各自怎么来。许可证标签从表格撤下后，这里是唯一讲清楚的地方
    helpItems(): any[] {
      return [
        { k: 'ip2region', v: this.$t('page.iplocation.hb_v_ip2region'), tone: 'brand' },
        { k: 'GeoLite2', v: this.$t('page.iplocation.hb_v_geolite2') },
        { k: 'IPDB', v: this.$t('page.iplocation.hb_v_ipdb') },
        { k: this.$t('page.iplocation.hb_k_manual'), v: this.$t('page.iplocation.hb_v_manual'), tone: 'brand' },
      ];
    },
    // 有哪些协议被改过（来源变了，或 ip2region 下的字段格式变了）
    dirtyProtos(): any[] {
      return this.protoList.filter((p: any) => this.isProtoDirty(p.key));
    },
    isDirty(): boolean {
      return this.dirtyProtos.length > 0;
    },
    // 保存条上的话：说清是哪个协议、从什么改成了什么
    dirtyText(): string {
      if (!this.isDirty) return this.$t('page.iplocation.config_clean');
      const parts = this.dirtyProtos.map((p: any) => {
        if (this.isSourceDirty(p.key)) {
          return `${p.label} ${this.$t('page.iplocation.unsaved_src')} ${this.sourceLabel(this.configForm[p.sourceKey])}`
            + `（${this.$t('page.iplocation.unsaved_saved_is')}：${this.sourceLabel(this.savedConfig[p.sourceKey])}）`;
        }
        return `${p.label} ${this.$t('page.iplocation.unsaved_fmt')} ${this.formatLabel(this.configForm[p.formatKey])}`
          + `（${this.$t('page.iplocation.unsaved_saved_is')}：${this.formatLabel(this.savedConfig[p.formatKey])}）`;
      });
      return parts.join('；') + this.$t('page.iplocation.unsaved_suffix');
    },
  },
  mounted() {
    this.loadStatus();
    this.loadConfig();
    const baseUrl = getBaseUrl();
    this.uploadUrl = baseUrl + '/iplocation/upload';
    const token = localStorage.getItem('access_token');
    this.uploadHeaders = { 'X-Token': token || '' };
    // 下载跑在服务端，用户可能中途离开页面又回来，这里把进度接回去（只查本地状态，不联网）
    this.resumeProgressIfRunning();
    // 合并单页后没有「切到文件页」这个触发点了，进来就异步拉一次清单，
    // 否则下面的表格是空的。拉不到也不影响本地状态展示。
    this.handleCheckUpgrade();
  },
  beforeDestroy() {
    // 离开页面必须停掉定时器，否则会一直空转发请求
    this.stopProgressPolling();
  },
  methods: {
    async loadStatus() {
      try {
        const res = await getIPDBStatusApi();
        if (res.code === 0) {
          this.status = res.data;
        } else {
          MessagePlugin.error(res.msg || this.$t('page.iplocation.load_status_failed'));
        }
      } catch (error) {
        MessagePlugin.error(this.$t('page.iplocation.load_status_failed'));
      }
    },
    async loadConfig() {
      try {
        const res = await getIPDBConfigApi();
        if (res.code === 0 && res.data) {
          this.configForm.ipv4_source = res.data.ipv4_source;
          this.configForm.ipv4_format = res.data.ipv4_format;
          this.configForm.ipv6_source = res.data.ipv6_source;
          this.configForm.ipv6_format = res.data.ipv6_format;
          this.markConfigSaved();
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    },
    // 把当前表单值记为「已保存」基准
    markConfigSaved() {
      this.savedConfig = { ...this.configForm };
    },
    // ---- 未保存判定 ----
    isSourceDirty(proto) {
      return this.configForm[`${proto}_source`] !== this.savedConfig[`${proto}_source`];
    },
    // 字段格式只在 ip2region 下有意义，别的来源改了也不算数
    isFormatDirty(proto) {
      if (this.configForm[`${proto}_source`] !== 'ip2region') return false;
      if (this.isSourceDirty(proto)) return false;
      return this.configForm[`${proto}_format`] !== this.savedConfig[`${proto}_format`];
    },
    isProtoDirty(proto) {
      if (this.isSourceDirty(proto)) return true;
      return this.configForm[`${proto}_source`] === 'ip2region'
        && this.configForm[`${proto}_format`] !== this.savedConfig[`${proto}_format`];
    },
    // ---- 展示用的名字，别把后端枚举值直接甩给用户 ----
    sourceLabel(code) {
      if (code === 'ipdb') return 'IPDB';
      if (code === 'geolite2') return 'GeoLite2';
      if (code === 'ip2region') return 'ip2region';
      return code || '-';
    },
    formatInfo(code) {
      return this.formatDescriptions.find((f) => f.id === code) || { id: code, version: code, fields: '-', description: '' };
    },
    formatLabel(code) {
      if (!code) return '-';
      return this.formatInfo(code).version;
    },
    formatFieldCount(code) {
      const { fields } = this.formatInfo(code);
      if (!fields || fields === '-') return 0;
      return String(fields).split('|').length;
    },
    // 只有内置的老版本格式是中文，社区版全是英文——地区规则写中文国名的会踩这个坑
    formatLangText(code) {
      return code === 'legacy'
        ? this.$t('page.iplocation.format_hint_lang_zh')
        : this.$t('page.iplocation.format_hint_lang_en');
    },
    // ---- 正在运行的键值对 ----
    runRows(proto) {
      const s: any = this.status;
      const rows: any[] = [
        { label: this.$t('page.iplocation.source'), value: this.sourceLabel(s[`${proto}_source`]), builtin: s[`${proto}_builtin`] },
      ];
      if (s[`${proto}_source`] === 'ip2region') {
        rows.push({ label: this.$t('page.iplocation.format'), value: this.formatLabel(s[`${proto}_format`]) });
      }
      rows.push({ label: this.$t('page.iplocation.file_size'), value: this.formatFileSize(s[`${proto}_file_size`]) });
      if (!s[`${proto}_builtin`]) {
        rows.push({ label: this.$t('page.iplocation.file_create_time'), value: s[`${proto}_create_time`] || '-' });
      }
      rows.push({ label: this.$t('page.iplocation.load_time'), value: s[`${proto}_load_time`] || '-' });
      return rows;
    },
    // Gitee / GitHub 上 IPv4 库叫 ip2region_v4.xdb，SamWaf 用的是 ip2region.xdb。
    // 不提醒改名的话，用户下完直接扔进 data 目录是不会生效的。
    manualRemoteName(row) {
      if (row.file_name === 'ip2region.xdb') return 'ip2region_v4.xdb';
      return row.file_name;
    },
    manualNeedsRename(row) {
      return this.manualRemoteName(row) !== row.file_name;
    },
    // 获取说明走前端 i18n，后端返回的 obtain_hint 只作兜底：
    // 后端那份是中文硬编码，英文界面下会串味
    obtainHint(row) {
      const source = this.sourceOfRow(row);
      if (source === 'geolite2') return this.$t('page.iplocation.obtain_geolite2');
      if (source === 'ipdb') return this.$t('page.iplocation.obtain_ipdb');
      return row.obtain_hint || '';
    },
    // ---- 用途列：把配置态和运行态摊到文件表里 ----
    sourceOfRow(row) {
      const key = String(row.key || '');
      if (key.indexOf('ip2region') === 0) return 'ip2region';
      if (key.indexOf('geolite2') === 0) return 'geolite2';
      if (key.indexOf('ipdb') === 0) return 'ipdb';
      return '';
    },
    usageTags(row) {
      const source = this.sourceOfRow(row);
      if (!source) return [];
      let protos = ['ipv4', 'ipv6'];
      if (row.ip_type === 'ipv4') protos = ['ipv4'];
      else if (row.ip_type === 'ipv6') protos = ['ipv6'];
      const out: any[] = [];
      protos.forEach((p) => {
        const label = p === 'ipv4' ? 'IPv4' : 'IPv6';
        const running = (this.status[`${p}_source`] || '') === source;
        const chosen = this.configForm[`${p}_source`] === source;
        if (running && chosen) {
          out.push({ text: `${label} ${this.$t('page.iplocation.use_running')}`, theme: 'primary' });
        } else if (running && !chosen) {
          out.push({ text: `${label} ${this.$t('page.iplocation.use_running')}`, theme: 'primary' });
          out.push({ text: this.$t('page.iplocation.use_replacing'), theme: 'warning' });
        } else if (chosen) {
          out.push({ text: `${label} ${this.$t('page.iplocation.use_pending')}`, theme: 'warning' });
        }
      });
      return out;
    },
    // ---- 字段格式对照抽屉 ----
    openFormatHelp(formatId) {
      this.helpFormatId = formatId || '';
      this.helpVisible = true;
    },
    formatRowClass(params) {
      const row = params && params.row ? params.row : params;
      return row && row.id === this.helpFormatId ? 'fmt-row-current' : '';
    },
    // 该来源对应的文件是否已上传到磁盘
    fileExistsForV4(source) {
      const fe = this.status.file_exists;
      if (!fe) return true;
      if (source === 'ip2region') return fe.ip2region_v4;
      if (source === 'ipdb') return fe.ipdb;
      return true;
    },
    fileExistsForV6(source) {
      const fe = this.status.file_exists;
      if (!fe) return true;
      if (source === 'ip2region') return fe.ip2region_v6;
      if (source === 'geolite2') return fe.geolite2;
      if (source === 'ipdb') return fe.ipdb;
      return true;
    },
    // 未上传文件时，该来源是否有内置数据兜底（全新安装即属此情况）
    builtinExistsForV4(source) {
      const be = this.status.builtin_exists;
      if (!be) return false;
      if (source === 'ip2region') return be.ip2region_v4;
      if (source === 'ipdb') return be.ipdb;
      return false;
    },
    builtinExistsForV6(source) {
      const be = this.status.builtin_exists;
      if (!be) return false;
      if (source === 'ip2region') return be.ip2region_v6;
      if (source === 'geolite2') return be.geolite2;
      if (source === 'ipdb') return be.ipdb;
      return false;
    },
    // 按协议分发，模板里两张卡走同一套写法
    fileExistsFor(proto, source) {
      return proto === 'ipv4' ? this.fileExistsForV4(source) : this.fileExistsForV6(source);
    },
    builtinExistsFor(proto, source) {
      return proto === 'ipv4' ? this.builtinExistsForV4(source) : this.builtinExistsForV6(source);
    },
    // 数据可用 = 已上传文件 或 有内置数据
    sourceReadyForV4(source) {
      return this.fileExistsForV4(source) || this.builtinExistsForV4(source);
    },
    sourceReadyForV6(source) {
      return this.fileExistsForV6(source) || this.builtinExistsForV6(source);
    },
    sourceReadyFor(proto, source) {
      return proto === 'ipv4' ? this.sourceReadyForV4(source) : this.sourceReadyForV6(source);
    },
    handleResetConfig() {
      this.configForm = { ...this.savedConfig };
    },
    async doSaveConfig() {
      try {
        const res = await saveIPDBConfigApi({
          ipv4_source: this.configForm.ipv4_source,
          ipv4_format: this.configForm.ipv4_format,
          ipv6_source: this.configForm.ipv6_source,
          ipv6_format: this.configForm.ipv6_format,
        });
        if (res.code === 0) {
          MessagePlugin.success(this.$t('page.iplocation.save_config_success'));
          // 保存成功才把基准推进，否则保存条会假装干净
          this.markConfigSaved();
          this.loadStatus();
        } else {
          MessagePlugin.error(res.msg || this.$t('page.iplocation.save_config_failed'));
        }
      } catch (error) {
        MessagePlugin.error(this.$t('page.iplocation.save_config_failed'));
      }
    },
    handleSaveConfig() {
      const v4Ok = this.sourceReadyForV4(this.configForm.ipv4_source);
      const v6Ok = this.sourceReadyForV6(this.configForm.ipv6_source);
      if (!v4Ok || !v6Ok) {
        const missing = [];
        if (!v4Ok) missing.push('IPv4');
        if (!v6Ok) missing.push('IPv6');
        const dialog = DialogPlugin.confirm({
          header: '数据库文件不存在',
          body: `${missing.join('、')} 所选来源的数据库文件尚未上传，保存后将无法正常查询。是否仍要保存？`,
          confirmBtn: '仍要保存',
          cancelBtn: '取消',
          onConfirm: () => { dialog.destroy(); this.doSaveConfig(); },
          onClose: () => { dialog.destroy(); },
        });
        return;
      }
      this.doSaveConfig();
    },
    // 检查远端可下载的数据库。拿不到远端清单也要把本地状态展示出来（内网环境是常态），
    // 所以后端在失败时也会带回 info，这里照样渲染表格，只是多一条告警。
    async handleCheckUpgrade() {
      this.downloadChecking = true;
      this.upgradeError = '';
      try {
        const res = await checkIPDBUpgradeApi();
        if (res.code === 0 && res.data) {
          this.upgradeInfo = res.data.info || { files: [] };
          if (res.data.error) {
            this.upgradeError = this.$t('page.iplocation.download_check_failed');
          }
        } else {
          this.upgradeError = res.msg || this.$t('page.iplocation.download_check_failed');
        }
      } catch (error) {
        this.upgradeError = this.$t('page.iplocation.download_check_failed');
      } finally {
        this.downloadChecking = false;
      }
    },
    // 启动下载：接口只负责把任务发起来，真实进度靠轮询
    async handleApplyUpgrade(row) {
      try {
        const res = await applyIPDBUpgradeApi({ key: row.key });
        if (res.code !== 0) {
          MessagePlugin.error(res.msg || this.$t('page.iplocation.download_failed'));
          return;
        }
        this.downloadingKey = row.key;
        this.progress = { key: row.key, file_name: '', total: row.remote_size || 0, downloaded: 0, percent: 0, state: 'downloading', message: '' };
        this.startProgressPolling();
      } catch (error) {
        MessagePlugin.error(this.$t('page.iplocation.download_failed'));
      }
    },
    // 页面重新打开时，如果服务端还在下载就把进度条接回来
    async resumeProgressIfRunning() {
      if (this.downloadingKey) return;
      try {
        const res = await getIPDBUpgradeProgressApi();
        if (res.code !== 0 || !res.data) return;
        const running = ['downloading', 'verifying', 'applying'].includes(res.data.state);
        if (running) {
          this.progress = res.data;
          this.downloadingKey = res.data.key;
          this.startProgressPolling();
        }
      } catch (error) {
        console.error('resume progress failed:', error);
      }
    },
    async handleCancelUpgrade() {
      try {
        const res = await cancelIPDBUpgradeApi();
        if (res.code !== 0) {
          MessagePlugin.error(res.msg || this.$t('page.iplocation.download_cancel_failed'));
          return;
        }
        // 状态由下一轮轮询拿回 canceled，这里不抢着改，避免和轮询打架
      } catch (error) {
        MessagePlugin.error(this.$t('page.iplocation.download_cancel_failed'));
      }
    },
    ipTypeText(t) {
      if (t === 'both') return this.$t('page.iplocation.files_iptype_both');
      if (t === 'ipv4') return 'IPv4';
      if (t === 'ipv6') return 'IPv6';
      return t || '-';
    },
    copyDataDir() {
      this.copyText(this.upgradeInfo.data_dir || this.dataDirFallback);
    },
    copyText(text) {
      if (!text) return;
      // 管理端可能跑在 http 下，navigator.clipboard 不可用，退回 execCommand
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(() => MessagePlugin.success(this.$t('page.iplocation.manual_copied')))
          .catch(() => this.fallbackCopy(text));
      } else {
        this.fallbackCopy(text);
      }
    },
    fallbackCopy(text) {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand('copy');
        MessagePlugin.success(this.$t('page.iplocation.manual_copied'));
      } catch (e) {
        MessagePlugin.error(this.$t('page.iplocation.manual_copy_failed'));
      }
      document.body.removeChild(el);
    },
    startProgressPolling() {
      this.stopProgressPolling();
      this.progressTimer = setInterval(this.pollProgress, 800);
      this.pollProgress();
    },
    stopProgressPolling() {
      if (this.progressTimer) {
        clearInterval(this.progressTimer);
        this.progressTimer = null;
      }
    },
    async pollProgress() {
      try {
        const res = await getIPDBUpgradeProgressApi();
        if (res.code !== 0 || !res.data) return;
        this.progress = res.data;
        if (res.data.state === 'done') {
          this.stopProgressPolling();
          this.downloadingKey = '';
          MessagePlugin.success(this.$t('page.iplocation.download_success'));
          this.loadStatus();
          this.loadConfig();
          this.handleCheckUpgrade();
        } else if (res.data.state === 'failed') {
          this.stopProgressPolling();
          this.downloadingKey = '';
          MessagePlugin.error(res.data.message || this.$t('page.iplocation.download_failed'));
        } else if (res.data.state === 'canceled') {
          this.stopProgressPolling();
          this.downloadingKey = '';
          MessagePlugin.info(this.$t('page.iplocation.download_canceled'));
        }
      } catch (error) {
        // 轮询失败不打断下载本身（后端在自己的 goroutine 里跑），下一轮再试
        console.error('poll progress failed:', error);
      }
    },
    // 状态机 → 界面文案
    progressStateText(state) {
      const map = {
        downloading: this.$t('page.iplocation.progress_downloading'),
        verifying: this.$t('page.iplocation.progress_verifying'),
        applying: this.$t('page.iplocation.progress_applying'),
        done: this.$t('page.iplocation.progress_done'),
        failed: this.$t('page.iplocation.progress_failed'),
      };
      return map[state] || '';
    },
    // 进度里 0 要显示成 "0 MB" 而不是 formatFileSize 的 "-"，
    // 否则刚开始下载那几秒会显示成 "- / 35.55 MB"，看着像出错了
    formatProgressSize(bytes) {
      if (!bytes) return '0 MB';
      return this.formatFileSize(bytes);
    },
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '-';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
    // 前端只做粗筛（后缀在三种之内），精确的"这个槽位只收哪种后缀"由后端按 key 严格校验，
    // 因为只有后端知道该 key 对应哪个文件名，前端放宽也不会传错位置。
    beforeUpload(file) {
      this.uploadHeaders['X-Request-Time'] = Math.floor(Date.now() / 1000).toString();
      this.uploadHeaders['X-Request-Id'] = uuidv4();
      const isValid = file.name.endsWith('.xdb') || file.name.endsWith('.mmdb') || file.name.endsWith('.ipdb');
      if (!isValid) MessagePlugin.error(this.$t('page.iplocation.invalid_file_type'));
      return isValid;
    },
    handleUploadSuccess(response) {
      if (response.response.code === 0) {
        MessagePlugin.success(this.$t('page.iplocation.upload_success'));
        this.loadStatus();
        this.loadConfig();
        // 同一张表既管下载也管上传，传完要把本地状态那一列刷新掉
        this.handleCheckUpgrade();
      } else {
        MessagePlugin.error(response.response.msg || this.$t('page.iplocation.upload_failed'));
      }
    },
    handleUploadFail() {
      MessagePlugin.error(this.$t('page.iplocation.upload_failed'));
    },
    async handleReload() {
      try {
        const res = await reloadIPDBApi();
        if (res.code === 0) {
          MessagePlugin.success(this.$t('page.iplocation.reload_success'));
          this.loadStatus();
        } else {
          MessagePlugin.error(res.msg || this.$t('page.iplocation.reload_failed'));
        }
      } catch (error) {
        MessagePlugin.error(this.$t('page.iplocation.reload_failed'));
      }
    },
    async handleTest() {
      if (!this.testIP) {
        MessagePlugin.warning(this.$t('page.iplocation.test_ip_required'));
        return;
      }
      try {
        const res = await testIPLookupApi({ ip: this.testIP });
        if (res.code === 0) {
          this.testResult = res.data;
          MessagePlugin.success(this.$t('page.iplocation.test_success'));
        } else {
          MessagePlugin.error(res.msg || this.$t('page.iplocation.test_failed'));
        }
      } catch (error) {
        MessagePlugin.error(this.$t('page.iplocation.test_failed'));
      }
    },
  },
});
</script>

<style scoped lang="less">
.list-card-container {
  padding: 20px;
}

.test-section {
  padding: 12px 0;
}

.test-result-box {
  margin-top: 10px;
  padding: 10px 14px;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
}

.result-meta-row {
  width: 100%;
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--td-component-border, #e7e7e7);
}

.result-item {
  font-size: 13px;
  white-space: nowrap;
}

// 段标题：一条细线拉通，右侧放该段的操作
.sec-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 12px;
}

.sec-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--td-text-color-secondary);
  white-space: nowrap;
}

.sec-rule {
  flex: 1;
  height: 1px;
  background: var(--td-component-stroke, #e7e7e7);
}

.sec-actions {
  display: flex;
  gap: 8px;
  flex: none;
}

// IPv4 / IPv6 必须等宽，用 grid 而不是 flex:1，避免内容长度把两栏挤歪
.config-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}

.config-col {
  min-width: 0;
}

.cfg-card {
  border: 1px solid var(--td-component-border, #e7e7e7);
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.15s;

  // 有未保存更改时整张卡都变色，改动点在哪一眼能看到
  &.is-edited {
    border-color: var(--td-warning-color, #e37318);
  }
}

.cfg-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--td-bg-color-secondarycontainer, #f5f5f5);
  border-bottom: 1px solid var(--td-component-border, #e7e7e7);

  .cfg-card.is-edited & {
    background: var(--td-warning-color-1, #fdf0e4);
    border-bottom-color: var(--td-warning-color-3, #f3d2ae);
  }
}

.cfg-card-title {
  font-size: 14px;
  font-weight: 600;
  flex: 1;
  min-width: 0;
}

.cfg-card-body {
  padding: 14px 14px 12px;
}

.field-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  // 被改过的下拉描一圈橙边，手指还在哪儿提示就在哪儿
  // TDesign 的 select 外层结构随版本变过，这里把两层都盖住
  &.is-edited ::v-deep .t-input,
  &.is-edited ::v-deep .t-input__inner,
  &.is-edited ::v-deep .t-select-input .t-input {
    border-color: var(--td-warning-color, #e37318);
    box-shadow: 0 0 0 2px var(--td-warning-color-1, #fdf0e4);
  }
}

// 所选格式的字段结构，取代原来那一整段中英文名说明
.compat-box {
  margin-top: 8px;
  padding: 8px 10px;
  border: 1px solid var(--td-component-stroke, #e7e7e7);
  border-radius: 4px;
  background: var(--td-bg-color-secondarycontainer, #f5f5f5);
}

.compat-struct {
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.6;
  word-break: break-all;
}

.compat-meta {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--td-text-color-secondary);
}

.run-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 8px;
  padding-top: 12px;
  border-top: 1px solid var(--td-component-stroke, #e7e7e7);
}

.run-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--td-text-color-secondary);
}

// 键值对用两列网格，比一行行 <p> 好扫
.run-kv {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 5px 14px;
  margin: 0;
  font-size: 12px;

  dt {
    color: var(--td-text-color-placeholder);
    white-space: nowrap;
  }

  dd {
    margin: 0;
    font-family: Consolas, Monaco, monospace;
    font-variant-numeric: tabular-nums;
    word-break: break-all;
  }
}

.savebar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding: 10px 14px;
  border: 1px solid var(--td-component-border, #e7e7e7);
  border-radius: 4px;
  background: var(--td-bg-color-secondarycontainer, #f5f5f5);
  transition: background 0.18s, border-color 0.18s;

  &.is-dirty {
    border-color: var(--td-warning-color-3, #f3d2ae);
    background: var(--td-warning-color-1, #fdf0e4);
  }
}

.savebar-msg {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--td-text-color-secondary);

  .savebar.is-dirty & {
    color: var(--td-warning-color, #e37318);
    font-weight: 500;
  }
}

.savebar-actions {
  display: flex;
  gap: 8px;
  flex: none;
}

// 手工替换目录常驻页面，排错时不用再去翻说明
.pathbar {
  margin-bottom: 12px;
  padding: 11px 14px;
  border: 1px solid var(--td-component-border, #e7e7e7);
  border-radius: 4px;
  background: var(--td-bg-color-secondarycontainer, #f5f5f5);
}

.pathbar-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.pathbar-label {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.pathbar-path {
  padding: 4px 9px;
  border-radius: 3px;
  background: var(--td-bg-color-container, #fff);
  border: 1px solid var(--td-component-border, #e7e7e7);
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  // 路径可能很长，允许换行而不是把整行撑破
  word-break: break-all;
}

.pathbar-hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--td-text-color-secondary);
}

// 清单要联网才能拿到，没拿之前把原因说清楚，别让人以为是坏了
.files-empty {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px;
  border: 1px dashed var(--td-component-border, #e7e7e7);
  border-radius: 4px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.use-tags {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.use-none {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.download-progress-box {
  padding: 12px 14px;
  margin-bottom: 12px;
  border-radius: 4px;
  background: #f5f5f5;
}

.download-progress-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}

.download-progress-bytes {
  // 数字用等宽，避免进度跳动时整行左右抖
  font-variant-numeric: tabular-nums;
  color: var(--td-text-color-secondary);
}

.download-progress-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  gap: 12px;
}

.download-progress-tip {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.manual-path-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.manual-path {
  padding: 3px 8px;
  border-radius: 3px;
  background: var(--td-bg-color-container, #fff);
  border: 1px solid var(--td-component-border, #e7e7e7);
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  word-break: break-all;
}

.help-text {
  font-size: 13px;
  line-height: 1.7;
  color: var(--td-text-color-secondary);
}

.contribute-box {
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px dashed var(--td-component-border, #e7e7e7);
}

// 行内「手动下载」浮层：下哪个文件、去哪下、放哪里，一次说完
.manual-pop {
  font-size: 12px;
  line-height: 1.6;
}

.manual-pop-head {
  margin-bottom: 8px;
  color: var(--td-text-color-secondary);
}

.manual-pop-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.manual-pop-tag {
  flex: none;
  color: var(--td-text-color-placeholder);

  &.is-warn {
    color: var(--td-warning-color, #e37318);
    font-weight: 600;
  }
}

// 改名的目标名字要比来源名更抢眼，用户照着它敲
.file-name.is-target {
  border: 1px solid var(--td-warning-color, #e37318);
  color: var(--td-warning-color, #e37318);
}

.manual-pop-links {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.manual-pop-sep {
  color: var(--td-text-color-placeholder);
}

.manual-pop-foot {
  color: var(--td-text-color-secondary);
}

// 文件名是用户手工放文件时必须照抄的东西，做成可点复制
.file-name {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  background: var(--td-bg-color-secondarycontainer, #f3f3f3);
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  word-break: break-all;
  cursor: pointer;
}

.local-meta {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--td-text-color-secondary);
}

.obtain-hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--td-text-color-secondary);
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 900px) {
  .config-row {
    grid-template-columns: 1fr;
  }
}
</style>

<style lang="less">
:root[theme-mode='dark'] .download-progress-box,
:root[theme-mode='dark'] .test-result-box {
  background: var(--td-bg-color-component);
  color: var(--td-text-color-primary);
  border: 1px solid var(--td-component-border);
}

// 抽屉里高亮当前所选的那种格式，省得自己对
.fmt-row-current > td {
  background: var(--td-brand-color-light, #ecf2fe) !important;
}
</style>
