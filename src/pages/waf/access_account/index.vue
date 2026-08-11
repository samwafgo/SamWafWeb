<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAdd">{{ $t('page.access.account.button_add') }}</t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="searchForm" :data="searchformData" :label-width="80" layout="inline" colon
            :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.access.account.label_name')" name="account_name">
              <t-input v-model="searchformData.account_name" class="search-input" clearable></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList()">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <help-block :summary="$t('page.access.account.alert_message')" doc="guide/AccessAccount" />
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="pagination" :loading="dataLoading" @page-change="rehandlePageChange"
          :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">
          <template #status="{ row }">
            <t-tag v-if="row.status === 1" theme="success" variant="light">{{ $t('page.access.account.status_enable') }}</t-tag>
            <t-tag v-else theme="danger" variant="light">{{ $t('page.access.account.status_disable') }}</t-tag>
          </template>
          <template #otp_bound="{ row }">
            <t-tag v-if="row.otp_bound === 1" theme="primary" variant="light">{{ $t('page.access.account.otp_bound') }}</t-tag>
            <span v-else>-</span>
          </template>
          <template #allow_host_codes="{ row }">
            <t-tag v-if="!row.allow_host_codes" theme="primary" variant="light">{{ $t('page.access.account.all_hosts') }}</t-tag>
            <t-tooltip v-else :content="hostNames(row.allow_host_codes)">
              <t-tag theme="warning" variant="light">{{ countLines(row.allow_host_codes) }}</t-tag>
            </t-tooltip>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleEdit(slotProps.row)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleResetPwd(slotProps.row)">{{ $t('page.access.account.button_resetpwd') }}</a>
            <a class="t-button-link" @click="handleOtp(slotProps.row)">{{ $t('page.access.account.button_otp') }}</a>
            <a class="t-button-link" @click="handleKick(slotProps.row)">{{ $t('page.access.account.button_kick') }}</a>
            <a class="t-button-link" @click="handleDelete(slotProps.row)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
    </t-card>

    <!-- 新增 -->
    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="700" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="addForm" :rules="addRules" @submit="onSubmitAdd" :labelWidth="120"
          autocomplete="off">
          <!-- autocomplete 必须显式关掉。
               浏览器看到「文本框 + 紧跟着的密码框」就认定这是登录表单，会把保存的
               **管理端 admin 账号密码**填进来；用户不留神点了确定，就凭空多出一个
               与管理员同名同密码、而且是公网可登录的访客账号。
               Chrome 只认 new-password（off 对密码框无效），所以两个都得给。 -->
          <t-form-item :label="$t('page.access.account.label_name')" name="account_name">
            <t-input :style="{ width: '460px' }" v-model="formData.account_name"
              autocomplete="off"></t-input>
            <div class="form-tips">{{ $t('page.access.account.name_immutable_tips') }}</div>
          </t-form-item>
          <t-form-item :label="$t('page.access.account.label_password')" name="password">
            <t-input type="password" :style="{ width: '460px' }" v-model="formData.password"
              autocomplete="new-password"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.access.account.label_nickname')" name="nick_name">
            <t-input :style="{ width: '460px' }" v-model="formData.nick_name"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.access.account.label_status')" name="status">
            <t-radio-group v-model="formData.status">
              <t-radio :value="1">{{ $t('page.access.account.status_enable') }}</t-radio>
              <t-radio :value="0">{{ $t('page.access.account.status_disable') }}</t-radio>
            </t-radio-group>
          </t-form-item>
          <t-form-item :label="$t('page.access.account.label_force_otp')" name="force_otp">
            <t-radio-group v-model="formData.force_otp">
              <t-radio :value="0">{{ $t('page.access.mode_inherit') }}</t-radio>
              <t-radio :value="1">{{ $t('page.access.account.otp_force') }}</t-radio>
              <t-radio :value="2">{{ $t('page.access.account.otp_exempt') }}</t-radio>
            </t-radio-group>
            <div class="form-tips">{{ $t('page.access.account.force_otp_tips') }}</div>
          </t-form-item>
          <t-form-item :label="$t('page.access.account.label_allow_hosts')" name="allow_host_codes">
            <t-select :style="{ width: '460px' }" v-model="addAllowHosts" multiple filterable clearable
              :placeholder="$t('page.access.account.allow_hosts_placeholder')">
              <t-option v-for="h in hostOptions" :key="h.value" :value="h.value" :label="h.label"></t-option>
            </t-select>
            <div class="form-tips">{{ $t('page.access.account.allow_hosts_tips') }}</div>
          </t-form-item>
          <t-form-item :label="$t('page.access.account.label_expire')" name="expire_time">
            <t-date-picker :style="{ width: '460px' }" v-model="formData.expire_time" enable-time-picker clearable
              format="YYYY-MM-DD HH:mm:ss" value-type="YYYY-MM-DD HH:mm:ss"
              :placeholder="$t('page.access.account.expire_placeholder')"></t-date-picker>
            <div class="form-tips">{{ $t('page.access.account.expire_tips') }}</div>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '460px' }" v-model="formData.remarks"></t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="addFormVisible = false">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 编辑：登录名不可改 -->
    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="700" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="editForm" :rules="editRules" @submit="onSubmitEdit" :labelWidth="120">
          <t-form-item :label="$t('page.access.account.label_name')">
            <t-input :style="{ width: '460px' }" :value="formEditData.account_name" disabled></t-input>
            <div class="form-tips">{{ $t('page.access.account.name_immutable_tips') }}</div>
          </t-form-item>
          <t-form-item :label="$t('page.access.account.label_nickname')" name="nick_name">
            <t-input :style="{ width: '460px' }" v-model="formEditData.nick_name"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.access.account.label_status')" name="status">
            <t-radio-group v-model="formEditData.status">
              <t-radio :value="1">{{ $t('page.access.account.status_enable') }}</t-radio>
              <t-radio :value="0">{{ $t('page.access.account.status_disable') }}</t-radio>
            </t-radio-group>
            <div class="form-tips">{{ $t('page.access.account.disable_kick_tips') }}</div>
          </t-form-item>
          <t-form-item :label="$t('page.access.account.label_force_otp')" name="force_otp">
            <t-radio-group v-model="formEditData.force_otp">
              <t-radio :value="0">{{ $t('page.access.mode_inherit') }}</t-radio>
              <t-radio :value="1">{{ $t('page.access.account.otp_force') }}</t-radio>
              <t-radio :value="2">{{ $t('page.access.account.otp_exempt') }}</t-radio>
            </t-radio-group>
          </t-form-item>
          <t-form-item :label="$t('page.access.account.label_allow_hosts')" name="allow_host_codes">
            <t-select :style="{ width: '460px' }" v-model="editAllowHosts" multiple filterable clearable
              :placeholder="$t('page.access.account.allow_hosts_placeholder')">
              <t-option v-for="h in hostOptions" :key="h.value" :value="h.value" :label="h.label"></t-option>
            </t-select>
            <div class="form-tips">{{ $t('page.access.account.allow_hosts_tips') }}</div>
          </t-form-item>
          <t-form-item :label="$t('page.access.account.label_expire')" name="expire_time">
            <t-date-picker :style="{ width: '460px' }" v-model="formEditData.expire_time" enable-time-picker clearable
              format="YYYY-MM-DD HH:mm:ss" value-type="YYYY-MM-DD HH:mm:ss"
              :placeholder="$t('page.access.account.expire_placeholder')"></t-date-picker>
            <div class="form-tips">{{ $t('page.access.account.expire_tips') }}</div>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '460px' }" v-model="formEditData.remarks"></t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="editFormVisible = false">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 重置密码 -->
    <t-dialog :header="$t('page.access.account.button_resetpwd')" :visible.sync="resetPwdVisible" :width="600" :footer="false">
      <div slot="body">
        <t-alert theme="warning" :message="$t('page.access.account.resetpwd_warning')"></t-alert>
        <t-form :data="resetPwdData" ref="resetForm" :rules="resetRules" @submit="onSubmitResetPwd" :labelWidth="120"
          autocomplete="off">
          <t-form-item :label="$t('page.access.account.label_new_password')" name="password">
            <t-input type="password" :style="{ width: '380px' }" v-model="resetPwdData.password"
              autocomplete="new-password"></t-input>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="resetPwdVisible = false">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 二次验证绑定 -->
    <t-dialog :header="$t('page.access.account.button_otp')" :visible.sync="otpVisible" :width="600" :footer="false">
      <div slot="body">
        <div v-if="currentAccount.otp_bound === 1">
          <t-alert theme="success" :message="$t('page.access.account.otp_already_bound')"></t-alert>
          <div style="text-align: right; margin-top: 16px">
            <t-button variant="outline" @click="otpVisible = false">{{ $t('common.close') }}</t-button>
            <t-button theme="danger" @click="onOtpUnbind">{{ $t('page.access.account.button_otp_unbind') }}</t-button>
          </div>
        </div>
        <div v-else>
          <t-alert theme="info" :message="$t('page.access.account.otp_bind_tips')"></t-alert>
          <div style="text-align: center; margin: 20px 0">
            <qrcode-vue v-if="otpData.url" :value="otpData.url" :size="200" level="H" />
          </div>
          <t-form :data="otpData" ref="otpForm" @submit="onOtpBind" :labelWidth="120">
            <t-form-item :label="$t('page.access.account.label_otp_secret')">
              <t-input :style="{ width: '380px' }" :value="otpData.secret" readonly></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.access.account.label_otp_code')" name="code">
              <t-input :style="{ width: '380px' }" v-model="otpData.code" maxlength="6" placeholder="000000"></t-input>
            </t-form-item>
            <t-form-item style="float: right">
              <t-button variant="outline" @click="otpVisible = false">{{ $t('common.close') }}</t-button>
              <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
            </t-form-item>
          </t-form>
        </div>
      </div>
    </t-dialog>

    <t-dialog :header="$t('common.confirm_delete')" :body="$t('page.access.account.delete_warning')"
      :visible.sync="delConfirmVisible" @confirm="onConfirmDelete"></t-dialog>

    <t-dialog :header="$t('page.access.account.button_kick')" :body="$t('page.access.account.kick_confirm')"
      :visible.sync="kickConfirmVisible" @confirm="onConfirmKick"></t-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { prefix } from '@/config/global';
import QrcodeVue from 'qrcode.vue';
import {
  wafAccessAccountListApi, wafAccessAccountAddApi, wafAccessAccountEditApi,
  wafAccessAccountDelApi, wafAccessAccountResetPwdApi,
  wafAccessAccountOtpInitApi, wafAccessAccountOtpBindApi, wafAccessAccountOtpUnbindApi,
  wafAccessSessionKickByAccountApi,
} from '@/apis/access';
import { allhost } from '@/apis/host';

// 授权站点在库里是「换行分隔的站点唯一码」，界面上必须是站点名的多选。
// 这两个函数是这层翻译的全部：拆行 → 数组，数组 → 拆行。
const splitHostCodes = (raw) => String(raw || '').split(/[\n,]/).map((x) => x.trim()).filter((x) => x !== '');
const joinHostCodes = (arr) => (arr || []).join('\n');

const INITIAL_ACCOUNT = {
  account_name: '',
  password: '',
  nick_name: '',
  status: 1,
  force_otp: 0,
  allow_host_codes: '',
  expire_time: '',
  remarks: '',
};

export default Vue.extend({
  name: 'WafAccessAccount',
  components: { QrcodeVue },
  data() {
    return {
      prefix,
      dataLoading: false,
      data: [],
      addFormVisible: false,
      editFormVisible: false,
      resetPwdVisible: false,
      otpVisible: false,
      delConfirmVisible: false,
      kickConfirmVisible: false,
      formData: { ...INITIAL_ACCOUNT },
      formEditData: { id: '', ...INITIAL_ACCOUNT },
      // 多选框绑数组，提交前再拼回换行串
      addAllowHosts: [],
      editAllowHosts: [],
      hostOptions: [],
      resetPwdData: { id: '', password: '' },
      otpData: { id: '', secret: '', url: '', code: '' },
      currentAccount: { id: '', account_name: '', otp_bound: 0 },
      // 新增与编辑各用一份规则：两个弹窗共用同一份时会互相串扰
      addRules: {
        account_name: [{ required: true, message: this.$t('common.placeholder') + this.$t('page.access.account.label_name'), type: 'error' }],
        password: [{ required: true, message: this.$t('common.placeholder') + this.$t('page.access.account.label_password'), type: 'error' }],
      },
      editRules: {},
      resetRules: {
        password: [{ required: true, message: this.$t('common.placeholder') + this.$t('page.access.account.label_new_password'), type: 'error' }],
      },
      columns: [
        { title: this.$t('page.access.account.label_name'), align: 'left', width: 160, ellipsis: true, colKey: 'account_name' },
        { title: this.$t('page.access.account.label_nickname'), width: 140, ellipsis: true, colKey: 'nick_name' },
        { title: this.$t('page.access.account.label_status'), width: 90, colKey: 'status' },
        { title: this.$t('page.access.account.col_otp'), width: 90, colKey: 'otp_bound' },
        { title: this.$t('page.access.account.label_allow_hosts'), width: 120, colKey: 'allow_host_codes' },
        { title: this.$t('page.access.account.col_last_login'), width: 170, ellipsis: true, colKey: 'last_login_time' },
        { title: this.$t('page.access.account.col_last_login_ip'), width: 140, ellipsis: true, colKey: 'last_login_ip' },
        { title: this.$t('common.remarks'), width: 160, ellipsis: true, colKey: 'remarks' },
        { align: 'left', width: 300, colKey: 'op', title: this.$t('common.op') },
      ],
      rowKey: 'id',
      verticalAlign: 'top',
      hover: true,
      pagination: { total: 0, current: 1, pageSize: 10 },
      searchformData: { account_name: '' },
      pendingId: '',
    };
  },
  computed: {
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    },
  },
  mounted() {
    this.getHostOptions();
    this.getList();
  },
  methods: {
    getContainer() {
      return document.querySelector('.tdesign-starter-layout');
    },
    getHostOptions() {
      const that = this;
      allhost().then((res) => {
        if (res.code === 0) {
          that.hostOptions = res.data ?? [];
        }
      }).catch(() => { /* 取不到站点列表时多选框为空，不影响其它字段 */ });
    },
    countLines(raw) {
      if (!raw) return '';
      const n = splitHostCodes(raw).length;
      return this.$t('page.access.account.limited_hosts').replace('{n}', n);
    },
    // 把库里的短码翻译成站点名给人看。站点被删时后端会同步摘掉短码，
    // 这里的兜底只是为了老数据不至于显示成一片空白。
    hostNames(raw) {
      return splitHostCodes(raw).map((code) => {
        const hit = this.hostOptions.find((h) => h.value === code);
        return hit ? hit.label : this.$t('page.access.account.host_deleted') + '(' + code + ')';
      }).join('\n');
    },
    getList() {
      const that = this;
      this.dataLoading = true;
      wafAccessAccountListApi({
        pageSize: this.pagination.pageSize,
        pageIndex: this.pagination.current,
        account_name: this.searchformData.account_name,
      }).then((res) => {
        if (res.code === 0) {
          that.data = res.data.list ?? [];
          that.pagination = { ...that.pagination, total: res.data.total };
        } else {
          that.$message.warning(res.msg);
        }
      }).catch((e) => console.log(e)).finally(() => {
        that.dataLoading = false;
      });
    },
    rehandlePageChange(curr) {
      this.pagination.current = curr.current;
      this.pagination.pageSize = curr.pageSize;
      this.getList();
    },
    handleAdd() {
      this.formData = { ...INITIAL_ACCOUNT };
      this.addAllowHosts = [];
      this.addFormVisible = true;
    },
    onSubmitAdd({ firstError }) {
      if (firstError) {
        this.$message.warning(firstError);
        return;
      }
      const that = this;
      wafAccessAccountAddApi({ ...this.formData, allow_host_codes: joinHostCodes(this.addAllowHosts) }).then((res) => {
        if (res.code === 0) {
          that.$message.success(res.msg);
          that.addFormVisible = false;
          that.getList();
        } else {
          that.$message.warning(res.msg);
        }
      });
    },
    handleEdit(row) {
      this.formEditData = {
        id: row.id,
        account_name: row.account_name,
        password: '',
        nick_name: row.nick_name,
        status: row.status,
        force_otp: row.force_otp ?? 0,
        allow_host_codes: row.allow_host_codes ?? '',
        // 后端返回的零值时间会是 0001-01-01 之类，回填成空串表示"永不过期"
        expire_time: this.normalizeTime(row.expire_time),
        remarks: row.remarks,
      };
      this.editAllowHosts = splitHostCodes(row.allow_host_codes);
      this.editFormVisible = true;
    },
    normalizeTime(v) {
      if (!v) return '';
      const s = String(v);
      if (s.startsWith('0001-') || s.startsWith('0000-')) return '';
      return s;
    },
    onSubmitEdit({ firstError }) {
      if (firstError) {
        this.$message.warning(firstError);
        return;
      }
      const that = this;
      wafAccessAccountEditApi({ ...this.formEditData, allow_host_codes: joinHostCodes(this.editAllowHosts) }).then((res) => {
        if (res.code === 0) {
          that.$message.success(res.msg);
          that.editFormVisible = false;
          that.getList();
        } else {
          that.$message.warning(res.msg);
        }
      });
    },
    handleResetPwd(row) {
      this.resetPwdData = { id: row.id, password: '' };
      this.resetPwdVisible = true;
    },
    onSubmitResetPwd({ firstError }) {
      if (firstError) {
        this.$message.warning(firstError);
        return;
      }
      const that = this;
      wafAccessAccountResetPwdApi({ ...this.resetPwdData }).then((res) => {
        if (res.code === 0) {
          that.$message.success(res.msg);
          that.resetPwdVisible = false;
        } else {
          that.$message.warning(res.msg);
        }
      });
    },
    handleOtp(row) {
      const that = this;
      this.currentAccount = { id: row.id, account_name: row.account_name, otp_bound: row.otp_bound };
      this.otpData = { id: row.id, secret: '', url: '', code: '' };
      if (row.otp_bound === 1) {
        this.otpVisible = true;
        return;
      }
      wafAccessAccountOtpInitApi({ id: row.id }).then((res) => {
        if (res.code === 0) {
          that.otpData = { id: row.id, secret: res.data.secret, url: res.data.url, code: '' };
          that.otpVisible = true;
        } else {
          that.$message.warning(res.msg);
        }
      });
    },
    onOtpBind() {
      const that = this;
      wafAccessAccountOtpBindApi({
        id: this.otpData.id, secret: this.otpData.secret, code: this.otpData.code,
      }).then((res) => {
        if (res.code === 0) {
          that.$message.success(res.msg);
          that.otpVisible = false;
          that.getList();
        } else {
          that.$message.warning(res.msg);
        }
      });
    },
    onOtpUnbind() {
      const that = this;
      wafAccessAccountOtpUnbindApi({ id: this.currentAccount.id }).then((res) => {
        if (res.code === 0) {
          that.$message.success(res.msg);
          that.otpVisible = false;
          that.getList();
        } else {
          that.$message.warning(res.msg);
        }
      });
    },
    handleKick(row) {
      this.pendingId = row.id;
      this.kickConfirmVisible = true;
    },
    onConfirmKick() {
      const that = this;
      wafAccessSessionKickByAccountApi({ account_id: this.pendingId }).then((res) => {
        if (res.code === 0) {
          that.$message.success(res.msg);
        } else {
          that.$message.warning(res.msg);
        }
        that.kickConfirmVisible = false;
      });
    },
    handleDelete(row) {
      this.pendingId = row.id;
      this.delConfirmVisible = true;
    },
    onConfirmDelete() {
      const that = this;
      wafAccessAccountDelApi({ id: this.pendingId }).then((res) => {
        if (res.code === 0) {
          that.$message.success(res.msg);
          that.getList();
        } else {
          that.$message.warning(res.msg);
        }
        that.delConfirmVisible = false;
      });
    },
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables';

.list-card-container {
  padding: @spacer-2 @spacer-3;

  :deep(.t-card__body) {
    padding: 0;
  }
}

.left-operation-container {
  padding: 0 0 @spacer-2 0;
  margin-bottom: @spacer;

  .t-button + .t-button {
    margin-left: @spacer;
  }
}

.search-input {
  width: 200px;
}

.form-tips {
  color: var(--td-text-color-placeholder);
  font-size: 12px;
  line-height: 20px;
  margin-top: 4px;
}
</style>
