<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAdd"> {{ $t('page.threatip.button_add') }} </t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="60" layout="inline" colon :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.threatip.label_name')" name="name">
              <t-input v-model="searchformData.name" class="search-input" clearable> </t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <help-block
        :summary="$t('page.threatip.alert_message')"
        :items="helpItems"
        :note="$t('page.threatip.help_note')"
        :title="$t('page.threatip.help_title')"
        doc="guide/ThreatIP"
        :links="[{ label: $t('page.threatip.doc_feeds'), doc: 'guide/ThreatIP#常用订阅源' },
                 { label: $t('page.threatip.doc_firewall'), doc: 'guide/FirewallIPBlock' }]"
        storage-key="threatip"
      />
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="pagination" :loading="dataLoading" @page-change="rehandlePageChange"
          :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">
          <template #parser_type="{ row }">
            <t-tag theme="primary" variant="light">{{ parserLabel(row.parser_type) }}</t-tag>
          </template>
          <template #land_target="{ row }">
            <span>{{ landTargetLabel(row.land_target) }}</span>
          </template>
          <template #enable="{ row }">
            <t-tag v-if="row.enable === 1" theme="success" variant="light">{{ $t('page.threatip.enabled') }}</t-tag>
            <t-tag v-else theme="default" variant="light">{{ $t('page.threatip.disabled') }}</t-tag>
          </template>
          <template #last_count="{ row }">
            <span>{{ row.last_count }}</span>
            <!-- 落地层含系统防火墙、但系统层还没确认落到当前快照：
                 这正是"页面显示 ok、防火墙里其实只封了一半"的那种静默失效，必须让用户看得见 -->
            <t-tooltip v-if="!row.landed_ok" :content="$t('page.threatip.landed_incomplete_tip')">
              <t-tag theme="warning" variant="light" size="small" style="margin-left: 6px;">
                {{ $t('page.threatip.landed_incomplete') }}
              </t-tag>
            </t-tooltip>
          </template>
          <template #last_status="{ row }">
            <t-tag v-if="row.syncing" theme="warning" variant="light">
              {{ $t('page.threatip.syncing') }}{{ syncElapsedText(row) }}
            </t-tag>
            <span v-else>{{ row.last_status }}</span>
          </template>
          <template #last_sync_at="{ row }">
            <span>{{ formatTs(row.last_sync_at) }}</span>
          </template>
          <template #op="slotProps">
            <!-- 后端同一时刻只跑一个渠道的同步，所以只要有渠道在同步，所有行的按钮都禁用：
                 留着能点只会让用户白等一轮再收到"已跳过" -->
            <a v-if="anySyncing" class="t-button-link t-is-disabled"
               :style="{ color: '#bbb', cursor: 'not-allowed' }"
               :title="slotProps.row.syncing ? $t('page.threatip.sync_self_busy') : $t('page.threatip.sync_other_busy')">
              {{ $t('page.threatip.sync') }}
            </a>
            <a v-else class="t-button-link" @click="handleSync(slotProps)">{{ $t('page.threatip.sync') }}</a>
            <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
    </t-card>

    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="120">
          <t-form-item :label="$t('page.threatip.quick_fill_label')">
            <div style="width: 100%;">
              <t-select :style="{ width: '480px', maxWidth: '100%' }" :placeholder="$t('page.threatip.quick_fill_placeholder')"
                        clearable filterable @change="applyFeedPreset">
                <t-option v-for="p in feedPresets" :value="p.code" :label="p.optionLabel" :key="p.code" />
              </t-select>
              <div class="quick-fill-tips">{{ $t('page.threatip.quick_fill_tips') }}</div>
            </div>
          </t-form-item>
          <t-form-item :label="$t('page.threatip.label_code')" name="code">
            <t-input :style="{ width: '480px' }" v-model="formData.code" :placeholder="$t('page.threatip.code_tips')"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.threatip.label_name')" name="name">
            <t-input :style="{ width: '480px' }" v-model="formData.name"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.threatip.label_url')" name="url">
            <t-input :style="{ width: '480px' }" v-model="formData.url"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.threatip.label_parser')" name="parser_type">
            <t-select v-model="formData.parser_type" :style="{ width: '480px' }">
              <t-option v-for="item in parserOptions" :value="item.value" :label="item.label" :key="item.value" />
            </t-select>
          </t-form-item>
          <t-form-item v-if="formData.parser_type === 'ipsum'" :label="$t('page.threatip.label_threshold')" name="threshold">
            <t-input-number v-model="formData.threshold" :min="0" theme="column" />
          </t-form-item>
          <t-form-item :label="$t('page.threatip.label_land')" name="land_target">
            <t-select v-model="formData.land_target" :style="{ width: '480px' }">
              <t-option v-for="item in landOptions" :value="item.value" :label="item.label" :key="item.value" />
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.threatip.label_interval')" name="interval_hour">
            <t-input-number v-model="formData.interval_hour" :min="1" theme="column" />
          </t-form-item>
          <t-form-item :label="$t('page.threatip.label_enable')" name="enable">
            <t-switch v-model="formData.enable" :custom-value="[1, 0]" />
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formData.remarks"></t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="form" :rules="rules" @submit="onSubmitEdit" :labelWidth="120">
          <t-form-item :label="$t('page.threatip.label_code')" name="code">
            <t-input :style="{ width: '480px' }" v-model="formEditData.code" disabled></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.threatip.label_name')" name="name">
            <t-input :style="{ width: '480px' }" v-model="formEditData.name"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.threatip.label_url')" name="url">
            <t-input :style="{ width: '480px' }" v-model="formEditData.url"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.threatip.label_parser')" name="parser_type">
            <t-select v-model="formEditData.parser_type" :style="{ width: '480px' }">
              <t-option v-for="item in parserOptions" :value="item.value" :label="item.label" :key="item.value" />
            </t-select>
          </t-form-item>
          <t-form-item v-if="formEditData.parser_type === 'ipsum'" :label="$t('page.threatip.label_threshold')" name="threshold">
            <t-input-number v-model="formEditData.threshold" :min="0" theme="column" />
          </t-form-item>
          <t-form-item :label="$t('page.threatip.label_land')" name="land_target">
            <t-select v-model="formEditData.land_target" :style="{ width: '480px' }">
              <t-option v-for="item in landOptions" :value="item.value" :label="item.label" :key="item.value" />
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.threatip.label_interval')" name="interval_hour">
            <t-input-number v-model="formEditData.interval_hour" :min="1" theme="column" />
          </t-form-item>
          <t-form-item :label="$t('page.threatip.label_enable')" name="enable">
            <t-switch v-model="formEditData.enable" :custom-value="[1, 0]" />
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formEditData.remarks"></t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseEditBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <t-dialog :header="$t('common.confirm_delete')" :body="$t('common.data_delete_warning')" :visible.sync="confirmVisible"
      @confirm="onConfirmDelete" :onCancel="onCancel">
    </t-dialog>
  </div>
</template>
<script lang="ts">
  import Vue from 'vue';
  import { prefix } from '@/config/global';
  import {
    wafThreatIPListApi, wafThreatIPAddApi, wafThreatIPEditApi, wafThreatIPDelApi, wafThreatIPDetailApi, wafThreatIPSyncApi
  } from '@/apis/threatip';

  const INITIAL_DATA = {
    code: '',
    name: '',
    url: '',
    parser_type: 'plain_mixed',
    threshold: 0,
    land_target: 'waf',
    enable: 1,
    interval_hour: 24,
    remarks: '',
  };
  export default Vue.extend({
    name: 'ThreatIPList',
    data() {
      return {
        addFormVisible: false,
        editFormVisible: false,
        confirmVisible: false,
        formData: { ...INITIAL_DATA },
        formEditData: { ...INITIAL_DATA },
        rules: {
          code: [{ required: true, message: this.$t('common.placeholder') + this.$t('page.threatip.label_code'), type: 'error' }],
          name: [{ required: true, message: this.$t('common.placeholder') + this.$t('page.threatip.label_name'), type: 'error' }],
          url: [{ required: true, message: this.$t('common.placeholder') + this.$t('page.threatip.label_url'), type: 'error' }],
        },
        prefix,
        dataLoading: false,
        data: [],
        detail_data: [],
        parserOptions: [
          { value: 'plain_mixed', label: this.$t('page.threatip.parser_plain') },
          { value: 'cidr_only', label: this.$t('page.threatip.parser_cidr') },
          { value: 'ipsum', label: this.$t('page.threatip.parser_ipsum') },
        ],
        landOptions: [
          { value: 'waf', label: this.$t('page.threatip.land_waf') },
          { value: 'system', label: this.$t('page.threatip.land_system') },
          { value: 'both', label: this.$t('page.threatip.land_both') },
        ],
        // 常用威胁情报IP订阅源预设：点选自动填 code/name/url/parser/threshold(仍可改)。
        // parser_type 已与各源实际格式对齐(均跳过#注释；plain_mixed 取每行首字段容忍行尾注释)。
        feedPresets: [
          { code: 'ustc', name: '科技大学 USTC', url: 'https://blackip.ustc.edu.cn/list.php?txt', parser_type: 'cidr_only', threshold: 0, optionLabel: '科技大学 USTC · blackip.ustc.edu.cn（国内综合恶意IP）' },
          { code: 'ipsum', name: 'stamparm ipsum', url: 'https://raw.githubusercontent.com/stamparm/ipsum/master/ipsum.txt', parser_type: 'ipsum', threshold: 3, optionLabel: 'stamparm ipsum · github（多源聚合，阈值默认3）' },
          { code: 'firehol1', name: 'FireHOL Level1', url: 'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_level1.netset', parser_type: 'cidr_only', threshold: 0, optionLabel: 'FireHOL Level1 · github（低误报聚合，含Spamhaus/DShield）' },
          { code: 'blocklistde', name: 'blocklist.de', url: 'https://lists.blocklist.de/lists/all.txt', parser_type: 'cidr_only', threshold: 0, optionLabel: 'blocklist.de · lists.blocklist.de（攻击者IP，全量）' },
          { code: 'ciarmy', name: 'CINS Army', url: 'https://cinsscore.com/list/ci-badguys.txt', parser_type: 'cidr_only', threshold: 0, optionLabel: 'CINS Army · cinsscore.com（活跃恶意IP）' },
          { code: 'greensnow', name: 'GreenSnow', url: 'https://blocklist.greensnow.co/greensnow.txt', parser_type: 'cidr_only', threshold: 0, optionLabel: 'GreenSnow · greensnow.co（暴力破解/扫描）' },
          { code: 'et_comp', name: 'ET Compromised', url: 'https://rules.emergingthreats.net/blockrules/compromised-ips.txt', parser_type: 'cidr_only', threshold: 0, optionLabel: 'ET Compromised · emergingthreats.net（已失陷主机）' },
          { code: 'spamhaus', name: 'Spamhaus DROP', url: 'https://www.spamhaus.org/drop/drop.txt', parser_type: 'plain_mixed', threshold: 0, optionLabel: 'Spamhaus DROP · spamhaus.org（被劫持网段，低误报）' },
          { code: 'feodo', name: 'Feodo Tracker', url: 'https://feodotracker.abuse.ch/downloads/ipblocklist.txt', parser_type: 'cidr_only', threshold: 0, optionLabel: 'Feodo Tracker · abuse.ch（僵尸网络C2）' },
        ],
        columns: [
          { title: this.$t('page.threatip.label_name'), align: 'left', width: 160, ellipsis: true, colKey: 'name' },
          { title: this.$t('page.threatip.label_code'), width: 120, ellipsis: true, colKey: 'code' },
          { title: this.$t('page.threatip.label_parser'), width: 120, colKey: 'parser_type' },
          { title: this.$t('page.threatip.label_land'), width: 110, colKey: 'land_target' },
          { title: this.$t('page.threatip.label_enable'), width: 90, colKey: 'enable' },
          { title: this.$t('page.threatip.last_count'), width: 150, colKey: 'last_count' },
          { title: this.$t('page.threatip.last_status'), width: 220, ellipsis: true, colKey: 'last_status' },
          { title: this.$t('page.threatip.last_sync_at'), width: 170, colKey: 'last_sync_at' },
          { align: 'left', width: 200, colKey: 'op', title: this.$t('common.op') },
        ],
        rowKey: 'id',
        verticalAlign: 'top',
        hover: true,
        pagination: { total: 0, current: 1, pageSize: 10 },
        searchformData: { name: '' },
        deleteIdx: -1,
        // 同步是后台异步跑的(拉取最长 2 分钟)，点完立刻刷新必然看不到结果，
        // 所以这里用定时轮询，直到没有渠道处于 syncing 或达到上限为止。
        syncPollTimer: null,
        syncPollLeft: 0,
        syncPollDone: 0,
        syncPollSawSyncing: false,
      };
    },
    computed: {
      offsetTop() {
        return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
      },
      // 是否有任一渠道正在同步(后端全局串行，一个在跑其余点了也只会被跳过)
      anySyncing() {
        return this.data.some((row) => row.syncing);
      },
      // 四个操作各自做了什么，拆成条目比一整段文字好扫
      helpItems() {
        return [
          { k: this.$t('page.threatip.enable_op'), v: this.$t('page.threatip.help_enable'), tone: 'brand' },
          { k: this.$t('page.threatip.disable_op'), v: this.$t('page.threatip.help_disable') },
          { k: this.$t('page.threatip.sync_op'), v: this.$t('page.threatip.help_sync'), tone: 'brand' },
          { k: this.$t('page.threatip.delete_op'), v: this.$t('page.threatip.help_delete'), tone: 'danger' },
        ];
      },
    },
    mounted() {
      this.getList('');
    },
    beforeDestroy() {
      this.stopSyncPolling();
    },
    methods: {
      landTargetLabel(v) {
        const found = this.landOptions.find((o) => o.value === v);
        return found ? found.label : v;
      },
      parserLabel(v) {
        const found = this.parserOptions.find((o) => o.value === v);
        return found ? found.label : v;
      },
      formatTs(ts) {
        if (!ts) return '-';
        const d = new Date(ts * 1000);
        return d.toLocaleString();
      },
      // silent=true 用于轮询刷新：不显示表格 loading，避免每 3 秒闪一次
      getList(_scope, silent) {
        let that = this;
        wafThreatIPListApi({
          pageSize: that.pagination.pageSize,
          pageIndex: that.pagination.current,
          ...that.searchformData,
        })
          .then((res) => {
            let resdata = res;
            if (resdata.code === 0) {
              this.data = resdata.data.list ?? [];
              this.pagination = { ...this.pagination, total: resdata.data.total };
              if (this.anySyncing) {
                // 定时任务触发的同步也要能跟进：进页面/翻页时发现有渠道在跑就自动开轮询，
                // 否则按钮会一直灰着直到用户手动刷新
                if (!this.syncPollTimer) {
                  this.startSyncPolling();
                }
                this.syncPollSawSyncing = true;
              } else if (this.syncPollTimer && (this.syncPollSawSyncing || this.syncPollDone >= 3)) {
                // 收工：已经观察到过"同步中"、或连轮几次都没看到就不用再轮了
                // (后端是异步起的 goroutine，第一次轮询时可能还没标上 syncing，所以留几次余量)
                this.stopSyncPolling();
              }
            }
          })
          .catch((e: Error) => { console.log(e); })
          .finally(() => { if (!silent) this.dataLoading = false; });
        if (!silent) this.dataLoading = true;
      },
      getContainer() {
        return document.querySelector('.tdesign-starter-layout');
      },
      rehandlePageChange(curr) {
        this.pagination.current = curr.current;
        if (this.pagination.pageSize != curr.pageSize) {
          this.pagination.current = 1;
          this.pagination.pageSize = curr.pageSize;
        }
        this.getList('');
      },
      handleAdd() {
        this.addFormVisible = true;
        this.formData = { ...INITIAL_DATA };
      },
      // 点选常用订阅源 → 自动填入 code/name/url/解析格式/阈值(仍可修改)
      applyFeedPreset(code) {
        if (!code) return;
        const p = this.feedPresets.find((x) => x.code === code);
        if (!p) return;
        this.formData.code = p.code;
        this.formData.name = p.name;
        this.formData.url = p.url;
        this.formData.parser_type = p.parser_type;
        this.formData.threshold = p.threshold || 0;
      },
      handleClickEdit(e) {
        this.editFormVisible = true;
        this.getDetail(e.row.id);
      },
      onSubmit({ firstError }): void {
        let that = this;
        if (!firstError) {
          wafThreatIPAddApi({ ...that.formData })
            .then((res) => {
              if (res.code === 0) {
                that.$message.success(res.msg);
                that.addFormVisible = false;
                that.pagination.current = 1;
                that.getList('');
              } else {
                that.$message.warning(res.msg);
              }
            })
            .catch((e: Error) => { console.log(e); });
        } else {
          that.$message.warning(firstError);
        }
      },
      onSubmitEdit({ firstError }): void {
        let that = this;
        if (!firstError) {
          wafThreatIPEditApi({ ...that.formEditData })
            .then((res) => {
              if (res.code === 0) {
                that.$message.success(res.msg);
                that.editFormVisible = false;
                that.getList('');
              } else {
                that.$message.warning(res.msg);
              }
            })
            .catch((e: Error) => { console.log(e); });
        } else {
          that.$message.warning(firstError);
        }
      },
      onClickCloseBtn(): void {
        this.addFormVisible = false;
        this.formData = { ...INITIAL_DATA };
      },
      onClickCloseEditBtn(): void {
        this.editFormVisible = false;
        this.formEditData = { ...INITIAL_DATA };
      },
      handleSync(e) {
        let that = this;
        that.$message.info(that.$t('page.threatip.sync_started'));
        wafThreatIPSyncApi({ id: e.row.id })
          .then((res) => {
            if (res.code === 0) {
              that.$message.success(res.msg);
              // 后台已经开始跑了，启动轮询把结果等出来
              that.startSyncPolling();
            } else {
              that.$message.warning(res.msg);
              that.getList('');
            }
          })
          .catch((e: Error) => { console.log(e); });
      },
      // 同步中已持续时长，例如 "（12秒）"
      syncElapsedText(row) {
        if (!row.syncing || !row.sync_started_at) return '';
        const sec = Math.max(0, Math.floor(Date.now() / 1000) - row.sync_started_at);
        return `（${sec}s）`;
      },
      // 启动轮询：每 3 秒刷一次列表，最多 ~2 分钟(覆盖后端 2 分钟的拉取超时)。
      // 列表里已经没有 syncing 的行时提前收工。
      startSyncPolling() {
        this.stopSyncPolling();
        this.syncPollLeft = 40;
        this.syncPollDone = 0;
        this.syncPollSawSyncing = false;
        this.syncPollTimer = setInterval(() => {
          if (this.syncPollLeft <= 0) {
            this.stopSyncPolling();
            return;
          }
          this.syncPollLeft -= 1;
          this.syncPollDone += 1;
          this.getList('', true);
        }, 3000);
      },
      stopSyncPolling() {
        if (this.syncPollTimer) {
          clearInterval(this.syncPollTimer);
          this.syncPollTimer = null;
        }
        this.syncPollLeft = 0;
      },
      handleClickDelete(row) {
        this.deleteIdx = row.rowIndex;
        this.confirmVisible = true;
      },
      onConfirmDelete() {
        this.confirmVisible = false;
        let { id } = this.data[this.deleteIdx];
        let that = this;
        wafThreatIPDelApi({ id: id })
          .then((res) => {
            if (res.code === 0) {
              that.getList('');
              that.$message.success(res.msg);
            } else {
              that.$message.warning(res.msg);
            }
          })
          .catch((e: Error) => { console.log(e); });
        this.deleteIdx = -1;
      },
      onCancel() {
        this.deleteIdx = -1;
      },
      getDetail(id) {
        let that = this;
        wafThreatIPDetailApi({ id: id })
          .then((res) => {
            if (res.code === 0) {
              that.detail_data = res.data;
              that.formEditData = { ...that.detail_data };
            }
          })
          .catch((e: Error) => { console.log(e); });
      },
    },
  });
</script>

<style lang="less" scoped>
  @import '@/style/variables';
  .left-operation-container {
    padding: 0 0 6px 0;
    margin-bottom: 16px;
  }
  .search-input {
    width: 200px;
  }
  .t-button+.t-button {
    margin-left: @spacer;
  }
  .quick-fill-tips {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
    margin-top: 6px;
    width: 100%;
    line-height: 1.5;
  }
</style>
