<template>
  <div class="tamper-config">
    <t-alert theme="info" :message="$t('page.host.tamper.intro')" style="margin-bottom: 16px;" />

    <!-- 站点级开关 -->
    <t-form-item :label="$t('page.host.tamper.is_enable')">
      <t-radio-group v-model="local.is_enable" @change="updateParent">
        <t-radio value="0">{{ $t('page.host.tamper.disable') }}</t-radio>
        <t-radio value="1">{{ $t('page.host.tamper.enable') }}</t-radio>
      </t-radio-group>
      <t-button size="small" variant="outline" style="margin-left: 12px;" @click="applyRecommended">
        {{ $t('page.host.tamper.recommended') }}
      </t-button>
    </t-form-item>
    <t-form-item :label="$t('page.host.tamper.action')">
      <t-tooltip class="placement top center" :content="$t('page.host.tamper.action_tips')" placement="top"
                 :overlay-style="{ width: '340px' }" show-arrow>
        <t-select v-model="local.action" :style="{ width: '280px' }" @change="updateParent">
          <t-option value="replace" :label="$t('page.host.tamper.action_replace')" />
          <t-option value="alert" :label="$t('page.host.tamper.action_alert')" />
        </t-select>
      </t-tooltip>
    </t-form-item>
    <t-form-item :label="$t('page.host.tamper.max_size_kb')">
      <t-tooltip class="placement top center" :content="$t('page.host.tamper.max_size_kb_tips')" placement="top"
                 :overlay-style="{ width: '320px' }" show-arrow>
        <t-input-number v-model="local.max_size_kb" :min="1" :style="{ width: '180px' }" @change="updateParent" />
      </t-tooltip>
    </t-form-item>

    <t-divider align="left">{{ $t('page.host.tamper.protected_urls') }}</t-divider>

    <template v-if="propHostCode">
      <div style="margin-bottom: 8px;">
        <t-button size="small" @click="handleAdd">{{ $t('page.host.tamper.add_url') }}</t-button>
        <t-button size="small" theme="primary" variant="outline" style="margin-left: 8px;" @click="openExtract">{{ $t('page.host.tamper.extract_urls') }}</t-button>
        <t-button size="small" variant="outline" style="margin-left: 8px;" :disabled="selectedRowKeys.length === 0" @click="handleRelearnBatch">{{ $t('page.host.tamper.relearn_selected') }}</t-button>
        <t-button size="small" variant="outline" style="margin-left: 8px;" @click="handleRelearnAll">{{ $t('page.host.tamper.relearn_all') }}</t-button>
        <t-button size="small" theme="danger" variant="outline" style="margin-left: 8px;" :disabled="selectedRowKeys.length === 0" @click="handleDelBatch">{{ $t('page.host.tamper.del_selected') }}</t-button>
        <t-button size="small" variant="outline" style="margin-left: 8px;" @click="getList">{{ $t('common.refresh') }}</t-button>
      </div>
      <t-table :columns="columns" :data="data" rowKey="id" :loading="dataLoading" size="small" :pagination="pagination"
               :max-height="360" :sort="sort" :filter-value="filterValue"
               :selected-row-keys="selectedRowKeys" @select-change="onSelectChange"
               @sort-change="onSortChange" @filter-change="onFilterChange" @page-change="onPageChange">
        <template #is_enable="{ row }">
          <t-tag :theme="row.is_enable === 1 ? 'success' : 'default'" variant="light">
            {{ row.is_enable === 1 ? $t('common.on') : $t('common.off') }}
          </t-tag>
        </template>
        <template #ignore_query="{ row }">
          <span>{{ row.ignore_query === 1 ? $t('common.yes') : $t('common.no') }}</span>
        </template>
        <template #baseline_status="{ row }">
          <t-tag :theme="statusTheme(row.baseline_status)" variant="light">{{ statusLabel(row.baseline_status) }}</t-tag>
        </template>
        <template #content_size="{ row }">
          <span>{{ formatSize(row.content_size) }}</span>
        </template>
        <template #op="slotProps">
          <a class="t-button-link" @click="handleViewBaseline(slotProps)">{{ $t('page.host.tamper.view_baseline') }}</a>
          <a class="t-button-link" @click="handleRelearn(slotProps)">{{ $t('page.host.tamper.relearn') }}</a>
          <a class="t-button-link" @click="handleEdit(slotProps)">{{ $t('common.edit') }}</a>
          <a class="t-button-link" @click="handleDelete(slotProps)">{{ $t('common.delete') }}</a>
        </template>
      </t-table>
    </template>
    <t-alert v-else theme="warning" :message="$t('page.host.tamper.save_host_first')" />

    <!-- 新增/编辑规则弹窗 -->
    <t-dialog :header="editMode ? $t('common.edit') : $t('common.new')" :visible.sync="formVisible" :width="640" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="ruleForm" :rules="rules" @submit="onSubmit" :labelWidth="120">
          <t-form-item :label="$t('page.host.tamper.url')" name="url">
            <t-input :style="{ width: '440px' }" v-model="formData.url" :placeholder="$t('page.host.tamper.url_placeholder')" />
            <div class="form-item-tips">{{ $t('page.host.tamper.url_tips') }}</div>
          </t-form-item>
          <t-form-item :label="$t('page.host.tamper.rule_name')" name="rule_name">
            <t-input :style="{ width: '440px' }" v-model="formData.rule_name" />
          </t-form-item>
          <t-form-item :label="$t('page.host.tamper.rule_enable')" name="is_enable">
            <t-radio-group v-model="formData.is_enable">
              <t-radio value="1">{{ $t('common.on') }}</t-radio>
              <t-radio value="0">{{ $t('common.off') }}</t-radio>
            </t-radio-group>
          </t-form-item>
          <t-form-item :label="$t('page.host.tamper.ignore_query')" name="ignore_query">
            <t-tooltip class="placement top center" :content="$t('page.host.tamper.ignore_query_tips')" placement="top"
                       :overlay-style="{ width: '340px' }" show-arrow>
              <t-radio-group v-model="formData.ignore_query">
                <t-radio value="1">{{ $t('common.yes') }}</t-radio>
                <t-radio value="0">{{ $t('common.no') }}</t-radio>
              </t-radio-group>
            </t-tooltip>
          </t-form-item>
          <t-form-item :label="$t('page.host.tamper.remarks')" name="remarks">
            <t-input :style="{ width: '440px' }" v-model="formData.remarks" />
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="formVisible = false">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 删除确认 -->
    <t-dialog :header="$t('common.confirm_delete')" :body="$t('common.data_delete_warning')"
              :visible.sync="confirmVisible" @confirm="onConfirmDelete" />

    <!-- 查看基线弹窗 -->
    <t-dialog :header="$t('page.host.tamper.baseline_detail')" :visible.sync="baselineVisible" :width="760" :footer="false">
      <div slot="body" v-if="baselineData">
        <t-descriptions :column="2" size="small" bordered style="margin-bottom: 12px;">
          <t-descriptions-item :label="$t('page.host.tamper.col_content_type')">{{ baselineData.content_type || '-' }}</t-descriptions-item>
          <t-descriptions-item :label="$t('page.host.tamper.col_size')">{{ formatSize(baselineData.content_size) }}</t-descriptions-item>
          <t-descriptions-item :label="$t('page.host.tamper.col_hash')"><span style="word-break: break-all;">{{ baselineData.baseline_hash || '-' }}</span></t-descriptions-item>
          <t-descriptions-item :label="$t('page.host.tamper.col_learn_time')">{{ baselineData.last_learn_time || '-' }}</t-descriptions-item>
        </t-descriptions>
        <div style="margin-bottom: 8px;">
          <t-button size="small" variant="outline" @click="downloadBaseline">{{ $t('page.host.tamper.download_baseline') }}</t-button>
        </div>
        <!-- 文本：小直显 / 大截断+展开 -->
        <template v-if="baselineData.is_text">
          <pre class="baseline-pre">{{ displayBaselineText }}</pre>
          <a v-if="baselineData.content && baselineData.content.length > 300" class="t-button-link" @click="baselineExpanded = !baselineExpanded">
            {{ baselineExpanded ? $t('page.host.tamper.collapse') : $t('page.host.tamper.expand') }}
          </a>
        </template>
        <!-- 图片：base64 渲染 -->
        <template v-else-if="isImage(baselineData.content_type) && baselineData.content_base64">
          <img :src="imageDataUrl" style="max-width: 100%; border: 1px solid #eee;" />
        </template>
        <t-alert v-else theme="info" :message="$t('page.host.tamper.binary_hint')" />
      </div>
    </t-dialog>

    <!-- 从页面提取URL弹窗 -->
    <t-dialog :header="$t('page.host.tamper.extract_title')" :visible.sync="extractVisible" :width="720" :footer="false">
      <div slot="body">
        <t-alert theme="info" :message="$t('page.host.tamper.extract_hint')" style="margin-bottom: 12px;" />
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <t-select v-model="extractDomain" :style="{ width: '220px' }" :placeholder="$t('page.host.tamper.extract_domain')">
            <t-option v-for="d in domainOptions" :key="d" :value="d" :label="d" />
          </t-select>
          <t-input v-model="extractPageUrl" :placeholder="$t('page.host.tamper.extract_placeholder')" style="flex: 1;" @enter="doExtract" />
          <t-button theme="primary" :loading="extractLoading" @click="doExtract">{{ $t('page.host.tamper.extract_btn') }}</t-button>
        </div>
        <template v-if="extractResult.length > 0">
          <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <span>{{ $t('page.host.tamper.extract_found', { n: extractResult.length }) }}</span>
            <t-checkbox v-model="extractIgnoreQuery">{{ $t('page.host.tamper.ignore_query') }}</t-checkbox>
            <t-button size="small" theme="primary" :disabled="extractSelected.length === 0" @click="doAddBatch">
              {{ $t('page.host.tamper.add_selected', { n: extractSelected.length }) }}
            </t-button>
          </div>
          <t-table :columns="extractColumns" :data="extractResult" rowKey="url" size="small" max-height="360"
                   :selected-row-keys="extractSelected" @select-change="onExtractSelectChange">
            <template #type="{ row }">
              <t-tag size="small" variant="light" :theme="typeTheme(row.type)">{{ row.type }}</t-tag>
            </template>
          </t-table>
        </template>
        <t-alert v-else-if="extractDone" theme="warning" :message="$t('page.host.tamper.extract_empty')" />
      </div>
    </t-dialog>
  </div>
</template>

<script lang="ts">
import {
  wafTamperRuleListApi,
  wafTamperRuleAddApi,
  wafTamperRuleEditApi,
  wafTamperRuleDelApi,
  wafTamperRuleDetailApi,
  wafTamperRuleRelearnApi,
  wafTamperRuleBaselineApi,
  wafTamperRuleRelearnBatchApi,
  wafTamperRuleExtractApi,
  wafTamperRuleAddBatchApi,
  wafTamperRuleDelBatchApi,
} from '@/apis/tamper_rule';

const INITIAL_RULE = {
  id: '',
  host_code: '',
  url: '',
  rule_name: '',
  is_enable: '1',
  ignore_query: '1',
  remarks: '',
};

export default {
  name: 'TamperConfig',
  props: {
    tamperConfig: { type: Object, required: true },
    propHostCode: { type: String, default: '' },
    propHost: { type: String, default: '' },
    propBindMoreHost: { type: String, default: '' },
  },
  data() {
    return {
      local: JSON.parse(JSON.stringify(this.tamperConfig)),
      // rule table
      data: [],
      dataLoading: false,
      pagination: { total: 0, current: 1, pageSize: 10 },
      sort: undefined,
      filterValue: {},
      formVisible: false,
      editMode: false,
      formData: { ...INITIAL_RULE },
      confirmVisible: false,
      deleteIdx: -1,
      rules: {
        url: [{ required: true, message: this.$t('page.host.tamper.url_placeholder'), type: 'error' }],
      },
      // baseline viewer
      baselineVisible: false,
      baselineData: null,
      baselineExpanded: false,
      // 提取URL弹窗
      selectedRowKeys: [],
      extractVisible: false,
      extractDomain: '',
      extractPageUrl: '/',
      extractLoading: false,
      extractDone: false,
      extractResult: [],
      extractSelected: [],
      extractIgnoreQuery: true,
      extractColumns: [
        { colKey: 'row-select', type: 'multiple', width: 40 },
        { title: this.$t('page.host.tamper.url'), colKey: 'url', ellipsis: true },
        { title: this.$t('page.host.tamper.col_type'), colKey: 'type', width: 90 },
      ],
      columns: [
        { colKey: 'row-select', type: 'multiple', width: 40 },
        { title: this.$t('page.host.tamper.url'), colKey: 'url', width: 200, ellipsis: true, sorter: true, filter: { type: 'input' } },
        { title: this.$t('page.host.tamper.rule_name'), colKey: 'rule_name', width: 130, ellipsis: true, sorter: true, filter: { type: 'input' } },
        {
          title: this.$t('page.host.tamper.rule_enable'), colKey: 'is_enable', width: 90, sorter: true,
          filter: { type: 'single', list: [{ label: this.$t('common.on'), value: 1 }, { label: this.$t('common.off'), value: 0 }] },
        },
        {
          title: this.$t('page.host.tamper.ignore_query'), colKey: 'ignore_query', width: 100, sorter: true,
          filter: { type: 'single', list: [{ label: this.$t('common.yes'), value: 1 }, { label: this.$t('common.no'), value: 0 }] },
        },
        {
          title: this.$t('page.host.tamper.baseline_status'), colKey: 'baseline_status', width: 110, sorter: true,
          filter: { type: 'single', list: [{ label: this.$t('page.host.tamper.status_unlearned'), value: 0 }, { label: this.$t('page.host.tamper.status_learned'), value: 1 }, { label: this.$t('page.host.tamper.status_failed'), value: 2 }] },
        },
        { title: this.$t('page.host.tamper.col_size'), colKey: 'content_size', width: 90, sorter: true },
        { title: this.$t('page.host.tamper.tamper_count'), colKey: 'tamper_count', width: 90, sorter: true },
        { align: 'left', fixed: 'right', width: 220, colKey: 'op', title: this.$t('common.op') },
      ],
    };
  },
  computed: {
    domainOptions() {
      const list = [];
      if (this.propHost) list.push(this.propHost.trim());
      (this.propBindMoreHost || '').split('\n').forEach((line) => {
        const d = line.trim();
        if (d && !list.includes(d)) list.push(d);
      });
      return list;
    },
    displayBaselineText() {
      const c = (this.baselineData && this.baselineData.content) || '';
      if (this.baselineExpanded || c.length <= 300) return c;
      return c.substring(0, 300) + ' ...';
    },
    imageDataUrl() {
      if (!this.baselineData) return '';
      return 'data:' + (this.baselineData.content_type || 'image/png') + ';base64,' + this.baselineData.content_base64;
    },
  },
  watch: {
    tamperConfig: {
      handler(newVal) { this.local = JSON.parse(JSON.stringify(newVal)); },
      deep: true,
    },
    propHostCode(newVal) {
      if (newVal) this.getList();
    },
  },
  mounted() {
    if (this.propHostCode) this.getList();
  },
  methods: {
    updateParent() {
      this.$emit('update', { ...this.local });
    },
    applyRecommended() {
      this.local = { is_enable: '1', action: 'replace', max_size_kb: 1024 };
      this.updateParent();
    },
    statusLabel(s) {
      const map = { 0: this.$t('page.host.tamper.status_unlearned'), 1: this.$t('page.host.tamper.status_learned'), 2: this.$t('page.host.tamper.status_failed') };
      return map[s] || s;
    },
    statusTheme(s) {
      const map = { 0: 'warning', 1: 'success', 2: 'danger' };
      return map[s] || 'default';
    },
    isImage(ct) {
      return typeof ct === 'string' && ct.toLowerCase().indexOf('image/') === 0;
    },
    formatSize(n) {
      const v = Number(n) || 0;
      if (v < 1024) return v + ' B';
      if (v < 1024 * 1024) return (v / 1024).toFixed(1) + ' KB';
      return (v / 1024 / 1024).toFixed(2) + ' MB';
    },
    buildListParams() {
      const params = {
        pageSize: this.pagination.pageSize,
        pageIndex: this.pagination.current,
        host_code: this.propHostCode,
      };
      if (this.sort && this.sort.sortBy) {
        params.order_key = this.sort.sortBy;
        params.order_dir = this.sort.descending ? 'desc' : 'asc';
      }
      const f = this.filterValue || {};
      if (f.url) params.url = f.url;
      if (f.rule_name) params.rule_name = f.rule_name;
      if (typeof f.is_enable === 'number') params.is_enable = f.is_enable;
      if (typeof f.ignore_query === 'number') params.ignore_query = f.ignore_query;
      if (typeof f.baseline_status === 'number') params.baseline_status = f.baseline_status;
      return params;
    },
    onSortChange(sort) {
      this.sort = sort;
      this.pagination.current = 1;
      this.getList();
    },
    onFilterChange(filters) {
      this.filterValue = filters || {};
      this.pagination.current = 1;
      this.getList();
    },
    getList() {
      if (!this.propHostCode) return;
      this.dataLoading = true;
      wafTamperRuleListApi(this.buildListParams())
        .then((res) => {
          if (res.code === 0) {
            this.data = res.data.list ?? [];
            this.pagination = { ...this.pagination, total: res.data.total };
          }
        })
        .catch((e) => console.log(e))
        .finally(() => { this.dataLoading = false; });
    },
    onPageChange(curr) {
      this.pagination.current = curr.current;
      if (this.pagination.pageSize !== curr.pageSize) {
        this.pagination.current = 1;
        this.pagination.pageSize = curr.pageSize;
      }
      this.getList();
    },
    handleAdd() {
      this.editMode = false;
      this.formData = { ...INITIAL_RULE, host_code: this.propHostCode };
      this.formVisible = true;
    },
    handleEdit(e) {
      this.editMode = true;
      wafTamperRuleDetailApi({ id: e.row.id }).then((res) => {
        if (res.code === 0) {
          const d = res.data;
          this.formData = {
            id: d.id,
            host_code: d.host_code,
            url: d.url,
            rule_name: d.rule_name,
            is_enable: String(d.is_enable),
            ignore_query: String(d.ignore_query),
            remarks: d.remarks,
          };
          this.formVisible = true;
        }
      });
    },
    buildPost(src) {
      return {
        ...src,
        host_code: this.propHostCode,
        is_enable: Number(src.is_enable),
        ignore_query: Number(src.ignore_query),
      };
    },
    onSubmit({ firstError }) {
      if (firstError) { this.$message.warning(firstError); return; }
      const post = this.buildPost(this.formData);
      const api = this.editMode ? wafTamperRuleEditApi : wafTamperRuleAddApi;
      api(post).then((res) => {
        if (res.code === 0) {
          this.$message.success(res.msg);
          this.formVisible = false;
          this.getList();
        } else {
          this.$message.warning(res.msg);
        }
      }).catch((e) => console.log(e));
    },
    handleRelearn(e) {
      wafTamperRuleRelearnApi({ id: e.row.id }).then((res) => {
        if (res.code === 0) { this.$message.success(res.msg); this.getList(); }
        else { this.$message.warning(res.msg); }
      }).catch((e) => console.log(e));
    },
    onSelectChange(value) {
      this.selectedRowKeys = value;
    },
    handleRelearnBatch() {
      if (this.selectedRowKeys.length === 0) return;
      wafTamperRuleRelearnBatchApi({ host_code: this.propHostCode, ids: this.selectedRowKeys }).then((res) => {
        if (res.code === 0) { this.$message.success(res.msg); this.selectedRowKeys = []; this.getList(); }
        else { this.$message.warning(res.msg); }
      }).catch((e) => console.log(e));
    },
    handleRelearnAll() {
      const confirmDia = this.$dialog.confirm({
        header: this.$t('page.host.tamper.relearn_all'),
        body: this.$t('page.host.tamper.relearn_all_confirm'),
        onConfirm: () => {
          wafTamperRuleRelearnBatchApi({ host_code: this.propHostCode, ids: [] }).then((res) => {
            if (res.code === 0) { this.$message.success(res.msg); this.selectedRowKeys = []; this.getList(); }
            else { this.$message.warning(res.msg); }
          }).catch((e) => console.log(e));
          confirmDia.hide();
        },
        onClose: () => confirmDia.hide(),
      });
    },
    handleDelBatch() {
      if (this.selectedRowKeys.length === 0) return;
      const confirmDia = this.$dialog.confirm({
        header: this.$t('page.host.tamper.del_selected'),
        body: this.$t('common.data_delete_warning'),
        theme: 'warning',
        onConfirm: () => {
          wafTamperRuleDelBatchApi({ host_code: this.propHostCode, ids: this.selectedRowKeys }).then((res) => {
            if (res.code === 0) { this.$message.success(res.msg); this.selectedRowKeys = []; this.getList(); }
            else { this.$message.warning(res.msg); }
          }).catch((e) => console.log(e));
          confirmDia.hide();
        },
        onClose: () => confirmDia.hide(),
      });
    },
    openExtract() {
      this.extractDomain = this.domainOptions[0] || '';
      this.extractPageUrl = '/';
      this.extractResult = [];
      this.extractSelected = [];
      this.extractDone = false;
      this.extractIgnoreQuery = true;
      this.extractVisible = true;
    },
    doExtract() {
      this.extractLoading = true;
      this.extractDone = false;
      wafTamperRuleExtractApi({ host_code: this.propHostCode, domain: this.extractDomain, page_url: this.extractPageUrl }).then((res) => {
        if (res.code === 0) {
          this.extractResult = res.data.list ?? [];
          // 默认勾选全部候选
          this.extractSelected = this.extractResult.map((r) => r.url);
        } else {
          this.extractResult = [];
          this.extractSelected = [];
          this.$message.warning(res.msg);
        }
        this.extractDone = true;
      }).catch((e) => { console.log(e); this.extractDone = true; }).finally(() => { this.extractLoading = false; });
    },
    onExtractSelectChange(value) {
      this.extractSelected = value;
    },
    doAddBatch() {
      if (this.extractSelected.length === 0) return;
      wafTamperRuleAddBatchApi({
        host_code: this.propHostCode,
        urls: this.extractSelected,
        is_enable: 1,
        ignore_query: this.extractIgnoreQuery ? 1 : 0,
      }).then((res) => {
        if (res.code === 0) {
          this.$message.success(res.msg);
          this.extractVisible = false;
          this.getList();
        } else {
          this.$message.warning(res.msg);
        }
      }).catch((e) => console.log(e));
    },
    typeTheme(type) {
      const map = { js: 'primary', css: 'success', html: 'warning', img: 'default' };
      return map[type] || 'default';
    },
    handleDelete(row) {
      this.deleteIdx = row.rowIndex;
      this.confirmVisible = true;
    },
    onConfirmDelete() {
      this.confirmVisible = false;
      const { id } = this.data[this.deleteIdx];
      wafTamperRuleDelApi({ id }).then((res) => {
        if (res.code === 0) { this.$message.success(res.msg); this.getList(); }
        else { this.$message.warning(res.msg); }
      }).catch((e) => console.log(e));
      this.deleteIdx = -1;
    },
    handleViewBaseline(e) {
      this.baselineExpanded = false;
      this.baselineData = null;
      wafTamperRuleBaselineApi({ id: e.row.id }).then((res) => {
        if (res.code === 0) {
          this.baselineData = res.data;
          this.baselineVisible = true;
        } else {
          this.$message.warning(res.msg);
        }
      }).catch((err) => console.log(err));
    },
    downloadBaseline() {
      if (!this.baselineData) return;
      let blob;
      if (this.baselineData.is_text) {
        blob = new Blob([this.baselineData.content || ''], { type: this.baselineData.content_type || 'text/plain' });
      } else if (this.baselineData.content_base64) {
        const bin = atob(this.baselineData.content_base64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
        blob = new Blob([arr], { type: this.baselineData.content_type || 'application/octet-stream' });
      } else {
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'baseline';
      a.click();
      URL.revokeObjectURL(url);
    },
  },
};
</script>

<style scoped>
.form-item-tips {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}
.baseline-pre {
  max-height: 360px;
  overflow: auto;
  background: #f7f7f7;
  padding: 8px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
}
.t-button-link + .t-button-link {
  margin-left: 8px;
}
</style>
