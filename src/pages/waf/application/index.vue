<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAdd">{{ $t('page.application.new_app') }}</t-button>
        </div>
        <div class="right-operation-container">
          <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList">
            {{ $t('common.search') }}
          </t-button>
        </div>
      </t-row>

      <div class="table-container">
        <t-table
          :columns="columns"
          :data="data"
          rowKey="id"
          :verticalAlign="'middle'"
          :hover="true"
          :pagination="pagination"
          :loading="dataLoading"
          @page-change="rehandlePageChange"
          :headerAffixedTop="true"
          :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }"
        >
          <template #run_status="{ row }">
            <t-tag theme="success" v-if="row.run_status === 1">{{ $t('page.application.status_running') }}</t-tag>
            <t-tag theme="danger"  v-else-if="row.run_status === 2">{{ $t('page.application.status_crashed') }}</t-tag>
            <t-tag theme="default" v-else>{{ $t('page.application.status_stopped') }}</t-tag>
          </template>

          <template #start_status="{ row }">
            <t-tag theme="success" v-if="row.start_status === 1 || row.start_status === '1'">
              {{ $t('common.on') }}
            </t-tag>
            <t-tag theme="warning" v-else>{{ $t('common.off') }}</t-tag>
          </template>

          <template #auto_start="{ row }">
            <t-tag theme="primary" v-if="row.auto_start === 1 || row.auto_start === '1'">
              {{ $t('common.yes') }}
            </t-tag>
            <t-tag theme="default" v-else>{{ $t('common.no') }}</t-tag>
          </template>

          <template #op="slotProps">
            <template v-if="actingCode !== slotProps.row.code">
              <a class="t-button-link" @click="handleStart(slotProps)"   v-if="slotProps.row.run_status !== 1">{{ $t('page.application.start') }}</a>
              <a class="t-button-link" @click="handleStop(slotProps)"    v-if="slotProps.row.run_status === 1">{{ $t('page.application.stop') }}</a>
              <a class="t-button-link" @click="handleRestart(slotProps)">{{ $t('page.application.restart') }}</a>
              <a class="t-button-link" @click="handleShowLogs(slotProps)">{{ $t('page.application.view_logs') }}</a>
              <a class="t-button-link" @click="handleShowUpgrade(slotProps)">{{ $t('page.application.upgrade') }}</a>
              <a class="t-button-link" @click="handleShowNetwork(slotProps)">{{ $t('page.application.network') }}</a>
              <t-badge :count="unreadChangeCount(slotProps.row)" :max-count="99" size="small" style="margin-right:8px">
                <a class="t-button-link" @click="handleShowChangeLogs(slotProps)">{{ $t('page.application.change_logs') }}</a>
              </t-badge>
              <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
              <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
            </template>
            <span v-else class="t-button-link acting-text">{{ $t('page.application.acting') }}</span>
          </template>
        </t-table>
      </div>
    </t-card>

    <!-- 新增对话框 -->
    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="760" :footer="false">
      <div slot="body">
        <app-form :value="formData" :op-password="currentOpPassword" @close="addFormVisible=false" @submit="onSubmit"></app-form>
      </div>
    </t-dialog>

    <!-- 编辑对话框 -->
    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="760" :footer="false">
      <div slot="body">
        <app-form :value="formEditData" :is-edit="true" :op-password="currentOpPassword" @close="editFormVisible=false" @submit="onSubmitEdit"></app-form>
      </div>
    </t-dialog>

    <!-- 删除确认 -->
    <t-dialog
      :header="$t('common.confirm_delete')"
      :body="confirmBody"
      :visible.sync="confirmVisible"
      @confirm="onConfirmDelete"
      :onCancel="onCancel"
    ></t-dialog>

    <!-- 日志对话框 -->
    <t-dialog :header="$t('page.application.view_logs')" :width="900" :visible.sync="logsVisible"
      @confirm="logsVisible=false" :onCancel="()=>{logsVisible=false}">
      <app-logs ref="appLogs" :app-code="selectedCode" :key="selectedCode + logsKey"></app-logs>
    </t-dialog>

    <!-- 升级对话框 -->
    <t-dialog :header="$t('page.application.upgrade')" :width="640" :visible.sync="upgradeVisible"
      :footer="false" :onCancel="()=>{upgradeVisible=false}">
      <app-upgrade :key="selectedCode" :app-code="selectedCode" :op-password="currentOpPassword" @close="upgradeVisible=false" @done="onUpgradeDone"></app-upgrade>
    </t-dialog>

    <!-- 网络对话框 -->
    <t-dialog :header="$t('page.application.network')" :width="680" :visible.sync="networkVisible"
      :footer="false" :onCancel="()=>{networkVisible=false}">
      <app-network :key="selectedCode + '_net'" :app-code="selectedCode"></app-network>
    </t-dialog>

    <!-- 变更记录抽屉 -->
    <t-drawer
      :header="$t('page.application.change_logs') + ' — ' + selectedAppName"
      :visible.sync="changeLogsVisible"
      :size="720"
      :footer="false"
      placement="right"
    >
      <app-change-log v-if="changeLogsVisible" :app-code="selectedCode" :key="selectedCode + '_cl'"></app-change-log>
    </t-drawer>

    <!-- 应用操作密码确认弹框 -->
    <t-dialog
      :header="$t('page.application.op_password_title')"
      :visible.sync="opPasswordDialogVisible"
      :width="420"
      :confirm-btn="{ loading: opPwdVerifying, content: $t('common.confirm') }"
      @confirm="onOpPasswordConfirm"
      :onCancel="onOpPasswordCancel"
    >
      <div slot="body" style="padding: 8px 0">
        <p style="margin-bottom:12px;color:#666;font-size:13px">{{ $t('page.application.op_password_hint') }}</p>
        <t-input
          v-model="opPasswordInput"
          type="password"
          :placeholder="$t('page.application.op_password_placeholder')"
          @keyup.enter.native="onOpPasswordConfirm"
          autofocus
        />
        <div style="margin-top:10px">
          <t-checkbox v-model="opPasswordRemember">{{ $t('page.application.op_password_remember') }}</t-checkbox>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { prefix } from '@/config/global';
import {
  wafAppListApi, wafAppAddApi, wafAppEditApi, wafAppDetailApi, wafAppDelApi,
  wafAppStartApi, wafAppStopApi, wafAppRestartApi, wafAppStatusApi,
  getAppOpPassword, saveAppOpPassword, wafAppVerifyPwdApi,
} from '@/apis/application';
import AppForm from './components/AppForm.vue';
import AppLogs from './components/AppLogs.vue';
import AppUpgrade from './components/AppUpgrade.vue';
import AppNetwork from './components/AppNetwork.vue';
import AppChangeLog from './components/AppChangeLog.vue';

export default Vue.extend({
  name: 'ApplicationList',
  components: { AppForm, AppLogs, AppUpgrade, AppNetwork, AppChangeLog },
  data() {
    return {
      prefix,
      dataLoading: false,
      data: [],
      selectedRowKeys: [],
      pagination: { total: 0, pageSize: 10, current: 1 },
      verticalAlign: 'middle',
      hover: true,
      offsetTop: 87,
      addFormVisible: false,
      editFormVisible: false,
      confirmVisible: false,
      logsVisible: false,
      upgradeVisible: false,
      networkVisible: false,
      changeLogsVisible: false,
      selectedCode: '',
      selectedAppName: '',
      logsKey: 0,
      deleteId: '',
      deleteCode: '',
      confirmBody: '',
      actingCode: '',
      formData: this.initFormData(),
      formEditData: {},
      // 操作密码弹框
      opPasswordDialogVisible: false,
      opPasswordInput: '',
      opPasswordRemember: true,
      opPwdVerifying: false,
      currentOpPassword: '',
      pendingAction: null as (() => void) | null,
      columns: [
        { colKey: 'name',          title: this.$t('page.application.name'),          width: 140 },
        { colKey: 'run_status',    title: this.$t('page.application.run_status'),     width: 100, cell: 'run_status' },
        { colKey: 'pid',           title: 'PID',                                      width: 80 },
        { colKey: 'restart_count', title: this.$t('page.application.restart_count'), width: 90 },
        { colKey: 'start_status',  title: this.$t('page.application.start_status'),  width: 90, cell: 'start_status' },
        { colKey: 'auto_start',    title: this.$t('page.application.auto_start'),    width: 90, cell: 'auto_start' },
        { colKey: 'restart_policy',title: this.$t('page.application.restart_policy'),width: 100 },
        { colKey: 'app_dir',       title: this.$t('page.application.app_dir'),        ellipsis: true },
        { colKey: 'remarks',       title: this.$t('common.remarks'),                  ellipsis: true },
        { colKey: 'op',            title: this.$t('common.op'),                       width: 420, cell: 'op', fixed: 'right' },
      ],
    };
  },
  mounted() {
    this.getList();
  },
  beforeDestroy() {
    const self = this as any;
    if (self._opPwdTimer) clearTimeout(self._opPwdTimer);
  },
  methods: {
    initFormData() {
      return {
        code: uuidv4(), name: '', app_dir: '', start_cmd: '', env: '',
        auto_start: 0, start_status: 1,
        stop_mode: 'signal', stop_cmd: '', stop_timeout: 30,
        restart_policy: 'no', restart_delay: 5, max_restart_count: 0,
        log_max_lines: 1000, remarks: ''
      };
    },
    getContainer() { return document.querySelector('.t-layout__content'); },
    getList() {
      this.dataLoading = true;
      wafAppListApi({ pageIndex: this.pagination.current, pageSize: this.pagination.pageSize })
        .then(res => {
          if (res && res.code === 0) {
            this.data = res.data.list || [];
            this.pagination.total = res.data.total || 0;
          }
        })
        .finally(() => { this.dataLoading = false; });
    },
    rehandlePageChange(curr) {
      this.pagination.current = curr.current;
      this.pagination.pageSize = curr.pageSize;
      this.getList();
    },

    // ---- 操作密码确认 ----
    _resetOpPwdTimer() {
      const self = this as any;
      if (self._opPwdTimer) clearTimeout(self._opPwdTimer);
      self._opPwdTimer = setTimeout(() => {
        this.currentOpPassword = '';
      }, 5 * 60 * 1000);
    },
    ensureOpPassword(action: () => void) {
      const existing = getAppOpPassword();
      if (existing) {
        // sessionStorage 未过期，同步到 prop 并重置 5 分钟计时器
        this.currentOpPassword = existing;
        this._resetOpPwdTimer();
        action();
        return;
      }
      this.opPasswordInput = '';
      this.opPasswordRemember = true;
      this.pendingAction = action;
      this.opPasswordDialogVisible = true;
    },
    onOpPasswordConfirm() {
      const pwd = this.opPasswordInput.trim();
      if (!pwd) {
        this.$message.warning(this.$t('page.application.op_password_required'));
        return;
      }
      // 先验证，成功才保存，避免错误密码写入 session 导致之后无法重新输入
      this.opPwdVerifying = true;
      wafAppVerifyPwdApi(pwd)
        .then(res => {
          if (res && res.code === 0) {
            this.currentOpPassword = pwd;
            this._resetOpPwdTimer();
            if (this.opPasswordRemember) {
              saveAppOpPassword(pwd);
            }
            this.opPasswordDialogVisible = false;
            if (this.pendingAction) {
              this.pendingAction();
              this.pendingAction = null;
            }
          } else {
            this.$message.error(this.$t('page.application.op_password_wrong'));
          }
        })
        .catch(() => {
          this.$message.error(this.$t('page.application.op_password_wrong'));
        })
        .finally(() => {
          this.opPwdVerifying = false;
        });
    },
    onOpPasswordCancel() {
      this.opPasswordDialogVisible = false;
      this.pendingAction = null;
    },

    // ---- 增删改 ----
    handleAdd() {
      this.formData = this.initFormData();
      this.ensureOpPassword(() => { this.addFormVisible = true; });
    },
    onSubmit() {
      this.addFormVisible = false;
      this.getList();
    },
    handleClickEdit(slotProps) {
      wafAppDetailApi({ id: slotProps.row.id }).then(res => {
        if (res && res.code === 0) {
          this.formEditData = res.data;
          this.ensureOpPassword(() => { this.editFormVisible = true; });
        }
      });
    },
    onSubmitEdit() {
      this.editFormVisible = false;
      this.getList();
    },
    handleClickDelete(slotProps) {
      this.deleteId = slotProps.row.id;
      this.deleteCode = slotProps.row.code;
      this.confirmBody = `${this.$t('common.confirm_delete')} ${slotProps.row.name}?`;
      this.ensureOpPassword(() => { this.confirmVisible = true; });
    },
    onConfirmDelete() {
      this.confirmVisible = false;
      const code = this.deleteCode;
      this.actingCode = code;
      wafAppDelApi({ id: this.deleteId })
        .then(res => {
          if (res && res.code === 0) {
            this.$message.success(this.$t('common.tips.delete_success'));
            this.pollUntilStatus(code, 0, 1000, 60000);
          } else {
            this.actingCode = '';
          }
        })
        .catch(() => { this.actingCode = ''; });
    },
    onCancel() { this.confirmVisible = false; },

    pollUntilStatus(code, targetStatus, initialDelayMs, maxWaitMs) {
      const deadline = Date.now() + maxWaitMs;
      const poll = () => {
        if (Date.now() >= deadline) { this.actingCode = ''; this.getList(); return; }
        wafAppStatusApi({ code }).then(res => {
          if (res && res.code === 0 && res.data.run_status === targetStatus) {
            this.actingCode = ''; this.getList();
          } else { setTimeout(poll, 1000); }
        }).catch(() => { this.actingCode = ''; this.getList(); });
      };
      setTimeout(poll, initialDelayMs);
    },

    handleStart(slotProps) {
      const code = slotProps.row.code;
      this.ensureOpPassword(() => {
        this.actingCode = code;
        wafAppStartApi({ code }).then(res => {
          if (res && res.code === 0) {
            this.$message.success(this.$t('page.application.start_sent'));
            this.pollUntilStatus(code, 1, 800, 30000);
          } else { this.actingCode = ''; }
        }).catch(() => { this.actingCode = ''; });
      });
    },
    handleStop(slotProps) {
      const code = slotProps.row.code;
      this.actingCode = code;
      wafAppStopApi({ code }).then(res => {
        if (res && res.code === 0) {
          this.$message.success(this.$t('page.application.stop_sent'));
          this.pollUntilStatus(code, 0, 800, 45000);
        } else { this.actingCode = ''; }
      }).catch(() => { this.actingCode = ''; });
    },
    handleRestart(slotProps) {
      const code = slotProps.row.code;
      this.ensureOpPassword(() => {
        this.actingCode = code;
        wafAppRestartApi({ code }).then(res => {
          if (res && res.code === 0) {
            this.$message.success(this.$t('page.application.restart_sent'));
            this.pollUntilStatus(code, 1, 3000, 60000);
          } else { this.actingCode = ''; }
        }).catch(() => { this.actingCode = ''; });
      });
    },
    handleShowLogs(slotProps) {
      this.selectedCode = slotProps.row.code;
      this.logsKey = Date.now();
      this.logsVisible = true;
    },
    handleShowUpgrade(slotProps) {
      this.ensureOpPassword(() => {
        this.selectedCode = slotProps.row.code;
        this.upgradeVisible = true;
      });
    },
    handleShowNetwork(slotProps) {
      this.selectedCode = slotProps.row.code;
      this.networkVisible = true;
    },
    // ---- 变更记录「未读」徽章 ----
    _clViewedKey(code: string) { return `app_cl_viewed_${code}`; },
    unreadChangeCount(row: any): number {
      const total = row.change_log_count || 0;
      const viewed = parseInt(localStorage.getItem(this._clViewedKey(row.code)) || '0', 10);
      return Math.max(0, total - viewed);
    },
    _markChangeLogViewed(code: string, total: number) {
      localStorage.setItem(this._clViewedKey(code), String(total));
    },

    handleShowChangeLogs(slotProps) {
      this.selectedCode = slotProps.row.code;
      this.selectedAppName = slotProps.row.name;
      this.changeLogsVisible = true;
      // 标记已读：存当前总数，下次渲染徽章变 0
      this._markChangeLogViewed(slotProps.row.code, slotProps.row.change_log_count || 0);
    },
    onUpgradeDone() {
      this.upgradeVisible = false;
      setTimeout(() => this.getList(), 1500);
    },
  },
});
</script>

<style scoped>
.list-card-container { padding: 20px; }
.left-operation-container, .right-operation-container { display: flex; align-items: center; margin-bottom: 16px; }
.table-container { margin-top: 8px; }
.t-button-link { color: var(--td-brand-color); cursor: pointer; margin-right: 8px; }
.t-button-link:hover { text-decoration: underline; }
.acting-text { color: #999; cursor: default; }
</style>
