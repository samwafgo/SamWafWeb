<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAdd">{{ $t('page.path_rule.button_add') }}</t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="searchForm" :data="searchformData" layout="inline" colon :style="{ marginBottom: '8px' }">
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <t-alert theme="info" :message="$t('page.path_rule.alert_message')" close />
      <div class="table-container">
        <t-table
          :columns="columns"
          :data="data"
          :rowKey="rowKey"
          :verticalAlign="verticalAlign"
          :hover="hover"
          :pagination="pagination"
          :loading="dataLoading"
          @page-change="rehandlePageChange"
          :headerAffixedTop="true"
          :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }"
        >
          <template #match_type="{ row }">
            <span>{{ matchTypeLabel(row.match_type) }}</span>
          </template>
          <template #target_type="{ row }">
            <t-tag :theme="targetTypeTheme(row.target_type)" variant="light">
              {{ targetTypeLabel(row.target_type) }}
            </t-tag>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
    </t-card>

    <!-- Add Dialog -->
    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="720" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="addForm" :rules="rules" @submit="onSubmit" :labelWidth="120">
          <t-form-item :label="$t('page.path_rule.host_code')" name="host_code">
            <t-select v-model="formData.host_code" clearable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">{{ item }}</t-option>
            </t-select>
          </t-form-item>

          <t-form-item :label="$t('page.path_rule.rule_name')" name="rule_name">
            <t-input :style="{ width: '480px' }" v-model="formData.rule_name" />
          </t-form-item>

          <t-form-item :label="$t('page.path_rule.path')" name="path">
            <t-input :style="{ width: '480px' }" v-model="formData.path" :placeholder="$t('page.path_rule.path_placeholder')" />
            <div class="form-item-tips">{{ $t('page.path_rule.path_tips') }}</div>
          </t-form-item>

          <t-form-item :label="$t('page.path_rule.match_type')" name="match_type">
            <t-select v-model="formData.match_type" clearable :style="{ width: '480px' }">
              <t-option v-for="item in match_type_options" :value="item.value" :label="item.label" :key="item.value" />
            </t-select>
          </t-form-item>

          <t-form-item :label="$t('page.path_rule.priority')" name="priority">
            <t-input-number :style="{ width: '150px' }" v-model="formData.priority" />
            <div class="form-item-tips">{{ $t('page.path_rule.priority_tips') }}</div>
          </t-form-item>

          <t-form-item :label="$t('page.path_rule.target_type')" name="target_type">
            <t-select v-model="formData.target_type" clearable :style="{ width: '480px' }">
              <t-option v-for="item in target_type_options" :value="item.value" :label="item.label" :key="item.value" />
            </t-select>
          </t-form-item>

          <!-- strip_prefix: 代理 or 静态文件时显示 -->
          <t-form-item :label="$t('page.path_rule.strip_prefix')" name="strip_prefix" v-if="formData.target_type === '1' || formData.target_type === '2'">
            <t-radio-group v-model="formData.strip_prefix">
              <t-radio value="0">{{ $t('common.no') }}</t-radio>
              <t-radio value="1">{{ $t('common.yes') }}</t-radio>
            </t-radio-group>
            <div class="form-item-tips">{{ $t('page.path_rule.strip_prefix_tips') }}</div>
          </t-form-item>

          <!-- target_type=1: 后端代理 -->
          <template v-if="formData.target_type === '1'">
            <t-form-item :label="$t('page.path_rule.remote_scheme')" name="remote_scheme">
              <t-select v-model="formData.remote_scheme" :style="{ width: '200px' }">
                <t-option v-for="item in scheme_options" :value="item.value" :label="item.label" :key="item.value" />
              </t-select>
              <div class="form-item-tips">{{ $t('page.path_rule.remote_scheme_tips') }}</div>
            </t-form-item>
            <t-form-item :label="$t('page.path_rule.remote_host')" name="remote_host">
              <t-input :style="{ width: '480px' }" v-model="formData.remote_host" :placeholder="$t('page.path_rule.remote_host_placeholder')" />
            </t-form-item>
            <t-form-item :label="$t('page.path_rule.remote_port')" name="remote_port">
              <t-input-number :style="{ width: '150px' }" v-model="formData.remote_port" />
            </t-form-item>
            <t-form-item :label="$t('page.path_rule.remote_ip')" name="remote_ip">
              <t-input :style="{ width: '480px' }" v-model="formData.remote_ip" :placeholder="$t('page.path_rule.remote_ip_placeholder')" />
              <div class="form-item-tips">{{ $t('page.path_rule.remote_ip_tips') }}</div>
            </t-form-item>
            <t-form-item :label="$t('page.path_rule.response_time_out')" name="response_time_out">
              <t-input-number :style="{ width: '150px' }" v-model="formData.response_time_out" :min="0" />
              <div class="form-item-tips">{{ $t('page.path_rule.response_time_out_tips') }}</div>
            </t-form-item>
            <t-form-item :label="$t('page.path_rule.record_access_log')" name="record_access_log">
              <t-radio-group v-model="formData.record_access_log">
                <t-radio value="0">{{ $t('common.off') }}</t-radio>
                <t-radio value="1">{{ $t('common.on') }}</t-radio>
              </t-radio-group>
              <div class="form-item-tips">{{ $t('page.path_rule.record_access_log_tips') }}</div>
            </t-form-item>
            <t-form-item :label="$t('page.path_rule.preview')">
              <t-alert theme="info">
                <template #message>
                  <div>{{ $t('page.path_rule.preview_client') }}：{{ addPreview.clientUrl }}</div>
                  <div>{{ $t('page.path_rule.preview_backend') }}：{{ addPreview.backendUrl }}{{ addPreview.stripNote }}</div>
                  <div v-if="addPreview.ipLine">{{ addPreview.ipLine }}</div>
                </template>
              </t-alert>
            </t-form-item>
          </template>

          <!-- target_type=2: 静态文件 -->
          <template v-if="formData.target_type === '2'">
            <t-form-item :label="$t('page.path_rule.static_root')" name="static_root">
              <t-input :style="{ width: '480px' }" v-model="formData.static_root" :placeholder="$t('page.path_rule.static_root_placeholder')" />
              <div class="form-item-tips">{{ $t('page.path_rule.static_root_tips') }}</div>
            </t-form-item>
            <t-form-item :label="$t('page.path_rule.spa_fallback')" name="spa_fallback">
              <t-radio-group v-model="formData.spa_fallback">
                <t-radio value="0">{{ $t('common.off') }}</t-radio>
                <t-radio value="1">{{ $t('common.on') }}</t-radio>
              </t-radio-group>
              <div class="form-item-tips">{{ $t('page.path_rule.spa_fallback_tips') }}</div>
            </t-form-item>
          </template>

          <!-- target_type=3: 重定向 -->
          <template v-if="formData.target_type === '3'">
            <t-form-item :label="$t('page.path_rule.redirect_url')" name="redirect_url">
              <t-input :style="{ width: '480px' }" v-model="formData.redirect_url" :placeholder="$t('page.path_rule.redirect_url_placeholder')" />
            </t-form-item>
            <t-form-item :label="$t('page.path_rule.redirect_code')" name="redirect_code">
              <t-select v-model="formData.redirect_code" :style="{ width: '200px' }">
                <t-option value="302" label="302 Found" />
                <t-option value="301" label="301 Moved Permanently" />
              </t-select>
            </t-form-item>
          </template>

          <t-form-item :label="$t('page.path_rule.remarks')" name="remarks">
            <t-input :style="{ width: '480px' }" v-model="formData.remarks" />
          </t-form-item>

          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- Edit Dialog -->
    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="720" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="editForm" :rules="rules" @submit="onSubmitEdit" :labelWidth="120">
          <t-form-item :label="$t('page.path_rule.host_code')" name="host_code">
            <t-select v-model="formEditData.host_code" clearable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">{{ item }}</t-option>
            </t-select>
          </t-form-item>

          <t-form-item :label="$t('page.path_rule.rule_name')" name="rule_name">
            <t-input :style="{ width: '480px' }" v-model="formEditData.rule_name" />
          </t-form-item>

          <t-form-item :label="$t('page.path_rule.path')" name="path">
            <t-input :style="{ width: '480px' }" v-model="formEditData.path" :placeholder="$t('page.path_rule.path_placeholder')" />
            <div class="form-item-tips">{{ $t('page.path_rule.path_tips') }}</div>
          </t-form-item>

          <t-form-item :label="$t('page.path_rule.match_type')" name="match_type">
            <t-select v-model="formEditData.match_type" clearable :style="{ width: '480px' }">
              <t-option v-for="item in match_type_options" :value="item.value" :label="item.label" :key="item.value" />
            </t-select>
          </t-form-item>

          <t-form-item :label="$t('page.path_rule.priority')" name="priority">
            <t-input-number :style="{ width: '150px' }" v-model="formEditData.priority" />
            <div class="form-item-tips">{{ $t('page.path_rule.priority_tips') }}</div>
          </t-form-item>

          <t-form-item :label="$t('page.path_rule.target_type')" name="target_type">
            <t-select v-model="formEditData.target_type" clearable :style="{ width: '480px' }">
              <t-option v-for="item in target_type_options" :value="item.value" :label="item.label" :key="item.value" />
            </t-select>
          </t-form-item>

          <t-form-item :label="$t('page.path_rule.strip_prefix')" name="strip_prefix" v-if="formEditData.target_type === '1' || formEditData.target_type === '2'">
            <t-radio-group v-model="formEditData.strip_prefix">
              <t-radio value="0">{{ $t('common.no') }}</t-radio>
              <t-radio value="1">{{ $t('common.yes') }}</t-radio>
            </t-radio-group>
            <div class="form-item-tips">{{ $t('page.path_rule.strip_prefix_tips') }}</div>
          </t-form-item>

          <template v-if="formEditData.target_type === '1'">
            <t-form-item :label="$t('page.path_rule.remote_scheme')" name="remote_scheme">
              <t-select v-model="formEditData.remote_scheme" :style="{ width: '200px' }">
                <t-option v-for="item in scheme_options" :value="item.value" :label="item.label" :key="item.value" />
              </t-select>
              <div class="form-item-tips">{{ $t('page.path_rule.remote_scheme_tips') }}</div>
            </t-form-item>
            <t-form-item :label="$t('page.path_rule.remote_host')" name="remote_host">
              <t-input :style="{ width: '480px' }" v-model="formEditData.remote_host" :placeholder="$t('page.path_rule.remote_host_placeholder')" />
            </t-form-item>
            <t-form-item :label="$t('page.path_rule.remote_port')" name="remote_port">
              <t-input-number :style="{ width: '150px' }" v-model="formEditData.remote_port" />
            </t-form-item>
            <t-form-item :label="$t('page.path_rule.remote_ip')" name="remote_ip">
              <t-input :style="{ width: '480px' }" v-model="formEditData.remote_ip" :placeholder="$t('page.path_rule.remote_ip_placeholder')" />
              <div class="form-item-tips">{{ $t('page.path_rule.remote_ip_tips') }}</div>
            </t-form-item>
            <t-form-item :label="$t('page.path_rule.response_time_out')" name="response_time_out">
              <t-input-number :style="{ width: '150px' }" v-model="formEditData.response_time_out" :min="0" />
              <div class="form-item-tips">{{ $t('page.path_rule.response_time_out_tips') }}</div>
            </t-form-item>
            <t-form-item :label="$t('page.path_rule.record_access_log')" name="record_access_log">
              <t-radio-group v-model="formEditData.record_access_log">
                <t-radio value="0">{{ $t('common.off') }}</t-radio>
                <t-radio value="1">{{ $t('common.on') }}</t-radio>
              </t-radio-group>
              <div class="form-item-tips">{{ $t('page.path_rule.record_access_log_tips') }}</div>
            </t-form-item>
            <t-form-item :label="$t('page.path_rule.preview')">
              <t-alert theme="info">
                <template #message>
                  <div>{{ $t('page.path_rule.preview_client') }}：{{ editPreview.clientUrl }}</div>
                  <div>{{ $t('page.path_rule.preview_backend') }}：{{ editPreview.backendUrl }}{{ editPreview.stripNote }}</div>
                  <div v-if="editPreview.ipLine">{{ editPreview.ipLine }}</div>
                </template>
              </t-alert>
            </t-form-item>
          </template>

          <template v-if="formEditData.target_type === '2'">
            <t-form-item :label="$t('page.path_rule.static_root')" name="static_root">
              <t-input :style="{ width: '480px' }" v-model="formEditData.static_root" :placeholder="$t('page.path_rule.static_root_placeholder')" />
              <div class="form-item-tips">{{ $t('page.path_rule.static_root_tips') }}</div>
            </t-form-item>
            <t-form-item :label="$t('page.path_rule.spa_fallback')" name="spa_fallback">
              <t-radio-group v-model="formEditData.spa_fallback">
                <t-radio value="0">{{ $t('common.off') }}</t-radio>
                <t-radio value="1">{{ $t('common.on') }}</t-radio>
              </t-radio-group>
              <div class="form-item-tips">{{ $t('page.path_rule.spa_fallback_tips') }}</div>
            </t-form-item>
          </template>

          <template v-if="formEditData.target_type === '3'">
            <t-form-item :label="$t('page.path_rule.redirect_url')" name="redirect_url">
              <t-input :style="{ width: '480px' }" v-model="formEditData.redirect_url" :placeholder="$t('page.path_rule.redirect_url_placeholder')" />
            </t-form-item>
            <t-form-item :label="$t('page.path_rule.redirect_code')" name="redirect_code">
              <t-select v-model="formEditData.redirect_code" :style="{ width: '200px' }">
                <t-option value="302" label="302 Found" />
                <t-option value="301" label="301 Moved Permanently" />
              </t-select>
            </t-form-item>
          </template>

          <t-form-item :label="$t('page.path_rule.remarks')" name="remarks">
            <t-input :style="{ width: '480px' }" v-model="formEditData.remarks" />
          </t-form-item>

          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseEditBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- Delete Confirm -->
    <t-dialog
      :header="$t('common.confirm_delete')"
      :body="$t('common.data_delete_warning')"
      :visible.sync="confirmVisible"
      @confirm="onConfirmDelete"
      :onCancel="onCancel"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { prefix } from '@/config/global';
import { allhost } from '@/apis/host';
import {
  wafPathRuleListApi,
  wafPathRuleDelApi,
  wafPathRuleEditApi,
  wafPathRuleAddApi,
  wafPathRuleDetailApi,
} from '@/apis/path_rule.ts';

const INITIAL_DATA = {
  host_code: '',
  rule_name: '',
  path: '',
  match_type: '1',
  priority: '100',
  target_type: '1',
  strip_prefix: '0',
  remote_host: '',
  remote_port: '80',
  remote_ip: '',
  remote_scheme: 'auto',
  record_access_log: '0',
  response_time_out: '0',
  static_root: '',
  spa_fallback: '0',
  redirect_url: '',
  redirect_code: '302',
  remarks: '',
};

export default Vue.extend({
  name: 'PathRuleBase',
  props: {
    propHostCode: String,
  },
  data() {
    return {
      addFormVisible: false,
      editFormVisible: false,
      confirmVisible: false,
      formData: { ...INITIAL_DATA },
      formEditData: { ...INITIAL_DATA },
      rules: {
        host_code: [{ required: true, message: this.$t('common.placeholder') + this.$t('page.path_rule.host_code'), type: 'error' }],
        rule_name: [{ required: true, message: this.$t('common.placeholder') + this.$t('page.path_rule.rule_name'), type: 'error' }],
        path:      [{ required: true, message: this.$t('common.placeholder') + this.$t('page.path_rule.path'), type: 'error' }],
        match_type:[{ required: true, message: this.$t('common.placeholder') + this.$t('page.path_rule.match_type'), type: 'error' }],
        target_type:[{ required: true, message: this.$t('common.placeholder') + this.$t('page.path_rule.target_type'), type: 'error' }],
      },
      prefix,
      dataLoading: false,
      data: [],
      deleteIdx: -1,
      host_dic: {},
      searchformData: { host_code: '' },
      pagination: { total: 0, current: 1, pageSize: 10 },
      rowKey: 'id',
      verticalAlign: 'top',
      hover: true,
      columns: [
        { title: this.$t('page.path_rule.rule_name'), colKey: 'rule_name', width: 160, ellipsis: true },
        { title: this.$t('page.path_rule.path'),      colKey: 'path',      width: 200, ellipsis: true },
        { title: this.$t('page.path_rule.match_type'),colKey: 'match_type',width: 110 },
        { title: this.$t('page.path_rule.target_type'),colKey: 'target_type',width: 110 },
        { title: this.$t('page.path_rule.priority'),  colKey: 'priority',  width: 80 },
        { align: 'left', fixed: 'right', width: 160,  colKey: 'op', title: this.$t('common.op') },
      ],
      match_type_options: [
        { label: this.$t('page.path_rule.match_type_prefix'), value: '1' },
        { label: this.$t('page.path_rule.match_type_exact'),  value: '2' },
        { label: this.$t('page.path_rule.match_type_regex'),  value: '3' },
      ],
      target_type_options: [
        { label: this.$t('page.path_rule.target_type_proxy'),  value: '1' },
        { label: this.$t('page.path_rule.target_type_static'), value: '2' },
        { label: this.$t('page.path_rule.target_type_redirect'),value: '3' },
      ],
      scheme_options: [
        { label: this.$t('page.path_rule.scheme_auto'), value: 'auto' },
        { label: 'HTTP',  value: 'http' },
        { label: 'HTTPS', value: 'https' },
      ],
    };
  },
  watch: {
    propHostCode(newVal) {
      this.searchformData.host_code = newVal;
      this.getList();
    },
  },
  computed: {
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    },
    addPreview() {
      return this.buildPreview(this.formData);
    },
    editPreview() {
      return this.buildPreview(this.formEditData);
    },
  },
  created() {
    this.searchformData.host_code = this.propHostCode;
  },
  mounted() {
    this.loadHostList().then(() => this.getList());
  },
  methods: {
    matchTypeLabel(val) {
      const map = { 1: this.$t('page.path_rule.match_type_prefix'), 2: this.$t('page.path_rule.match_type_exact'), 3: this.$t('page.path_rule.match_type_regex') };
      return map[val] || val;
    },
    targetTypeLabel(val) {
      const map = { 1: this.$t('page.path_rule.target_type_proxy'), 2: this.$t('page.path_rule.target_type_static'), 3: this.$t('page.path_rule.target_type_redirect') };
      return map[val] || val;
    },
    targetTypeTheme(val) {
      const map = { 1: 'primary', 2: 'success', 3: 'warning' };
      return map[val] || 'default';
    },
    loadHostList() {
      return new Promise((resolve, reject) => {
        allhost()
          .then((res) => {
            if (res.code === 0) {
              res.data.forEach((item) => { this.host_dic[item.value] = item.label; });
            }
            resolve(null);
          })
          .catch((e) => { console.log(e); reject(e); });
      });
    },
    getList() {
      this.dataLoading = true;
      wafPathRuleListApi({
        pageSize: this.pagination.pageSize,
        pageIndex: this.pagination.current,
        ...this.searchformData,
      })
        .then((res) => {
          if (res.code === 0) {
            this.data = res.data.list ?? [];
            this.pagination = { ...this.pagination, total: res.data.total };
          }
        })
        .catch((e) => console.log(e))
        .finally(() => { this.dataLoading = false; });
    },
    getContainer() {
      return document.querySelector('.tdesign-starter-layout');
    },
    rehandlePageChange(curr) {
      this.pagination.current = curr.current;
      if (this.pagination.pageSize !== curr.pageSize) {
        this.pagination.current = 1;
        this.pagination.pageSize = curr.pageSize;
      }
      this.getList();
    },
    handleAdd() {
      this.formData = { ...INITIAL_DATA };
      this.formData.host_code = this.propHostCode || '';
      this.addFormVisible = true;
    },
    handleClickEdit(e) {
      this.editFormVisible = true;
      this.getDetail(e.row.id);
    },
    handleClickDelete(row) {
      this.deleteIdx = row.rowIndex;
      this.confirmVisible = true;
    },
    onSubmit({ firstError }) {
      if (firstError) { this.$message.warning(firstError); return; }
      const postdata = this.buildPostData(this.formData);
      wafPathRuleAddApi(postdata)
        .then((res) => {
          if (res.code === 0) {
            this.$message.success(res.msg);
            this.addFormVisible = false;
            this.pagination.current = 1;
            this.getList();
          } else {
            this.$message.warning(res.msg);
          }
        })
        .catch((e) => console.log(e));
    },
    onSubmitEdit({ firstError }) {
      if (firstError) { this.$message.warning(firstError); return; }
      const postdata = this.buildPostData(this.formEditData);
      wafPathRuleEditApi(postdata)
        .then((res) => {
          if (res.code === 0) {
            this.$message.success(res.msg);
            this.editFormVisible = false;
            this.getList();
          } else {
            this.$message.warning(res.msg);
          }
        })
        .catch((e) => console.log(e));
    },
    buildPostData(src) {
      const d = { ...src };
      d['match_type']   = Number(d['match_type']);
      d['priority']     = Number(d['priority']);
      d['target_type']  = Number(d['target_type']);
      d['strip_prefix'] = Number(d['strip_prefix']);
      d['spa_fallback'] = Number(d['spa_fallback']);
      d['remote_port']  = Number(d['remote_port']);
      d['redirect_code']= Number(d['redirect_code']);
      d['record_access_log'] = Number(d['record_access_log']);
      d['response_time_out'] = Number(d['response_time_out']);
      return d;
    },
    // 实时预览：根据表单拼出「客户端请求」与「实际转发到」两行示例，纯前端展示转发效果
    buildPreview(form) {
      const domain = this.host_dic[form.host_code] || this.$t('page.path_rule.preview_your_domain');
      const p = form.path || '/';
      const sampleUrl = p.endsWith('/') ? `${p}foo` : `${p}/foo`;
      const clientUrl = `http(s)://${domain}${sampleUrl}`;
      // 后端协议：auto=跟随客户端，否则用显式协议
      let schemeText;
      if (form.remote_scheme === 'http') schemeText = 'http';
      else if (form.remote_scheme === 'https') schemeText = 'https';
      else schemeText = this.$t('page.path_rule.preview_follow_client');
      // 去前缀后的后端路径
      let backendPath = sampleUrl;
      if (String(form.strip_prefix) === '1' && sampleUrl.startsWith(p)) {
        backendPath = sampleUrl.slice(p.length);
        if (!backendPath.startsWith('/')) backendPath = `/${backendPath}`;
      }
      const host = form.remote_host || 'backend';
      const port = form.remote_port ? `:${form.remote_port}` : '';
      const backendUrl = `${schemeText}://${host}${port}${backendPath}`;
      const stripNote = String(form.strip_prefix) === '1' ? `　（${this.$t('page.path_rule.preview_stripped')}${p}）` : '';
      const ipLine = form.remote_ip
        ? `${this.$t('page.path_rule.preview_ip')}${form.remote_ip}${port}`
        : '';
      return { clientUrl, backendUrl, stripNote, ipLine };
    },
    onClickCloseBtn() { this.addFormVisible = false; },
    onClickCloseEditBtn() { this.editFormVisible = false; },
    onConfirmDelete() {
      this.confirmVisible = false;
      const { id } = this.data[this.deleteIdx];
      wafPathRuleDelApi({ id })
        .then((res) => {
          if (res.code === 0) { this.$message.success(res.msg); this.getList(); }
          else { this.$message.warning(res.msg); }
        })
        .catch((e) => console.log(e));
      this.deleteIdx = -1;
    },
    onCancel() { this.deleteIdx = -1; },
    getDetail(id) {
      wafPathRuleDetailApi({ id })
        .then((res) => {
          if (res.code === 0) {
            const d = res.data;
            // convert number fields to string for form selects/radios
            ['match_type','priority','target_type','strip_prefix','spa_fallback','remote_port','redirect_code','record_access_log','response_time_out'].forEach((k) => {
              if (d[k] !== undefined && d[k] !== null) d[k] = d[k].toString();
            });
            // 存量规则 remote_scheme 为空串，归一为 auto（跟随客户端）
            if (!d['remote_scheme']) d['remote_scheme'] = 'auto';
            this.formEditData = { ...INITIAL_DATA, ...d };
          }
        })
        .catch((e) => console.log(e));
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

.t-button + .t-button {
  margin-left: @spacer;
}

.form-item-tips {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.5;
}
</style>
