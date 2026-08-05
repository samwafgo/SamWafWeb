<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAddGroup"> {{ $t('page.ipgroup.button_add') }} </t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="searchForm" :data="searchformData" :label-width="80" layout="inline" colon
            :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.ipgroup.label_name')" name="group_name">
              <t-input v-model="searchformData.group_name" class="search-input" clearable></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList()">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <t-alert theme="info" :message="$t('page.ipgroup.alert_message')" close>
        <!-- 手工维护之外还能定时批量导入，这里给个入口，否则用户不知道有这功能 -->
        <template #operation>
          <span class="link-text" @click="handleJumpBatchTask">{{ $t('page.ipgroup.goto_batch_task') }}</span>
        </template>
      </t-alert>
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="pagination" :loading="dataLoading" @page-change="rehandlePageChange"
          :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">
          <template #item_count="{ row }">
            <t-tag theme="primary" variant="light">{{ row.item_count }}</t-tag>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleManageItems(slotProps.row)">{{ $t('page.ipgroup.button_manage_ip') }}</a>
            <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
    </t-card>

    <!-- 新增 -->
    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="addForm" :rules="rules" @submit="onSubmit" :labelWidth="100">
          <t-form-item :label="$t('page.ipgroup.label_name')" name="group_name">
            <t-input :style="{ width: '480px' }" v-model="formData.group_name"></t-input>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formData.remarks" name="remarks"></t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 编辑：组短码不可改 -->
    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="editForm" :rules="editRules" @submit="onSubmitEdit" :labelWidth="100">
          <t-form-item :label="$t('page.ipgroup.label_name')" name="group_name">
            <t-input :style="{ width: '480px' }" v-model="formEditData.group_name"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.ipgroup.label_code')">
            <t-input :style="{ width: '480px' }" :value="formEditData.group_code" disabled></t-input>
            <div class="form-tips">{{ $t('page.ipgroup.code_immutable_tips') }}</div>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formEditData.remarks" name="remarks"></t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="editFormVisible = false">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 组内 IP 维护 -->
    <t-drawer :header="$t('page.ipgroup.drawer_title') + ' - ' + currentGroup.group_name"
      :visible.sync="itemDrawerVisible" size="860px" :footer="false" @close="onCloseDrawer">
      <div>
        <t-alert theme="info" :message="ruleUsageTips" close></t-alert>
        <t-row justify="space-between">
          <div class="left-operation-container">
            <t-button @click="handleAddItem">{{ $t('page.ipgroup.button_add_item') }}</t-button>
            <t-button variant="base" theme="default" @click="handleBatchAdd">{{ $t('page.ipgroup.button_batch_add') }}</t-button>
            <t-button theme="danger" variant="outline" :disabled="selectedItemKeys.length === 0"
              @click="handleBatchDelItems">{{ $t('page.ipgroup.button_batch_delete') }}</t-button>
            <t-button theme="danger" :disabled="itemData.length === 0" @click="clearItemsConfirmVisible = true">
              {{ $t('page.ipgroup.button_clear_items') }}
            </t-button>
            <!-- 一次性手工批量添加之外，还能建定时任务从文件/远程源自动同步 -->
            <a class="t-button-link" style="margin-left: 8px" @click="handleJumpBatchTask">
              {{ $t('page.ipgroup.goto_batch_task') }}
            </a>
          </div>
          <div class="right-operation-container">
            <t-form :data="itemSearchData" :label-width="40" layout="inline" colon :style="{ marginBottom: '8px' }">
              <t-form-item label="IP" name="ip">
                <t-input v-model="itemSearchData.ip" :style="{ width: '160px' }" clearable></t-input>
              </t-form-item>
              <t-form-item>
                <t-button theme="primary" @click="getItemList()">{{ $t('common.search') }}</t-button>
              </t-form-item>
            </t-form>
          </div>
        </t-row>
        <t-table :columns="itemColumns" :data="itemData" rowKey="id" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="itemPagination" :selected-row-keys="selectedItemKeys" :loading="itemLoading"
          @page-change="rehandleItemPageChange" @select-change="rehandleItemSelectChange">
          <template #op="slotProps">
            <a class="t-button-link" @click="handleEditItem(slotProps.row)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleDelItem(slotProps.row)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
    </t-drawer>

    <!-- 单条 IP 新增/编辑 -->
    <t-dialog :header="itemFormData.id ? $t('common.edit') : $t('common.new')" :visible.sync="itemFormVisible"
      :width="680" :footer="false">
      <div slot="body">
        <t-form :data="itemFormData" ref="itemForm" :rules="itemRules" @submit="onSubmitItem" :labelWidth="100">
          <t-form-item label="IP" name="ip">
            <t-input :style="{ width: '480px' }" v-model="itemFormData.ip"
              :placeholder="$t('page.ipgroup.ip_placeholder')"></t-input>
            <div class="form-tips">{{ $t('page.ipgroup.ip_pattern_tips') }}</div>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="itemFormData.remarks"></t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="itemFormVisible = false">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 批量粘贴录入 -->
    <t-dialog :header="$t('page.ipgroup.button_batch_add')" :visible.sync="batchAddVisible" :width="720"
      :confirm-btn="$t('common.confirm')" :cancel-btn="$t('common.close')" @confirm="onSubmitBatchAdd">
      <div slot="body">
        <t-textarea v-model="batchAddContent" :autosize="{ minRows: 12, maxRows: 20 }"
          :placeholder="$t('page.ipgroup.batch_add_placeholder')"></t-textarea>
        <div class="form-tips" style="margin-top:8px">{{ $t('page.ipgroup.ip_pattern_tips') }}</div>
      </div>
    </t-dialog>

    <!-- 批量录入结果。t-dialog 点确认只触发 @confirm、不会自动关闭，
         这里只有确认一个按钮，必须显式关掉，否则点了没反应 -->
    <t-dialog :header="$t('page.ipgroup.batch_add_result_title')" :visible.sync="batchResultVisible" :width="720"
      :cancel-btn="null" @confirm="batchResultVisible = false">
      <div slot="body">
        <p>{{ batchResultSummary }}</p>
        <t-table v-if="batchResult.fail_lines && batchResult.fail_lines.length" :data="batchResult.fail_lines"
          rowKey="line" size="small" :columns="[
            { title: $t('page.ipgroup.col_line'), colKey: 'line', width: 80 },
            { title: $t('page.ipgroup.col_text'), colKey: 'text', width: 200, ellipsis: true },
            { title: $t('page.ipgroup.col_reason'), colKey: 'reason', ellipsis: true },
          ]"></t-table>
      </div>
    </t-dialog>

    <!-- 删除组：有引用时必须显式勾选才允许级联 -->
    <t-dialog :header="$t('common.confirm_delete')" :visible.sync="delGroupVisible" :width="680"
      :confirm-btn="{ content: $t('common.confirm'), theme: 'danger', disabled: hasRefs && !forceDelete }"
      :cancel-btn="$t('common.close')" @confirm="onConfirmDeleteGroup">
      <div slot="body">
        <p v-if="!hasRefs">{{ $t('common.data_delete_warning') }}</p>
        <div v-else>
          <t-alert theme="warning" :message="refsWarning"></t-alert>
          <ul class="ref-host-list">
            <li v-for="h in refsData.hosts" :key="h.host_code">
              {{ h.host_name }}
              <span v-if="h.block"> — {{ $t('page.ipgroup.ref_block') }} {{ h.block }}</span>
              <span v-if="h.allow"> — {{ $t('page.ipgroup.ref_allow') }} {{ h.allow }}</span>
            </li>
          </ul>
          <t-checkbox v-model="forceDelete">{{ $t('page.ipgroup.delete_force_confirm') }}</t-checkbox>
        </div>
      </div>
    </t-dialog>

    <t-dialog :header="$t('page.ipgroup.button_clear_items')" :body="$t('page.ipgroup.confirm_clear_items')"
      :visible.sync="clearItemsConfirmVisible" @confirm="onConfirmClearItems"></t-dialog>

    <t-dialog :header="$t('common.confirm_delete')" :body="$t('common.data_delete_warning')"
      :visible.sync="delItemConfirmVisible" @confirm="onConfirmDelItem"></t-dialog>

    <t-dialog :header="$t('page.ipgroup.button_batch_delete')" :body="$t('common.data_delete_warning')"
      :visible.sync="batchDelItemsVisible" @confirm="onConfirmBatchDelItems"></t-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { prefix } from '@/config/global';
import {
  wafIPGroupListApi, wafIPGroupAddApi, wafIPGroupEditApi, wafIPGroupDelApi, wafIPGroupRefsApi,
  wafIPGroupItemListApi, wafIPGroupItemAddApi, wafIPGroupItemEditApi, wafIPGroupItemDelApi,
  wafIPGroupItemBatchAddApi, wafIPGroupItemBatchDelApi, wafIPGroupItemDelAllApi,
} from '@/apis/ipgroup';

// 组短码由后端自动生成，新建表单里不出现
const INITIAL_GROUP = {
  group_name: '',
  remarks: '',
};

export default Vue.extend({
  name: 'WafIpGroup',
  data() {
    return {
      prefix,
      dataLoading: false,
      data: [],
      addFormVisible: false,
      editFormVisible: false,
      formData: { ...INITIAL_GROUP },
      formEditData: { id: '', group_code: '', ...INITIAL_GROUP },
      rules: {
        group_name: [{
          required: true,
          message: this.$t('common.placeholder') + this.$t('page.ipgroup.label_name'),
          type: 'error',
        }],
      },
      // 新增与编辑各用一份规则：两个弹窗共用同一份时，条件校验会互相串扰
      editRules: {
        group_name: [{
          required: true,
          message: this.$t('common.placeholder') + this.$t('page.ipgroup.label_name'),
          type: 'error',
        }],
      },
      columns: [
        { title: this.$t('page.ipgroup.label_name'), align: 'left', width: 200, ellipsis: true, colKey: 'group_name' },
        { title: this.$t('page.ipgroup.label_code'), width: 240, ellipsis: true, colKey: 'group_code' },
        { title: this.$t('page.ipgroup.label_item_count'), width: 100, colKey: 'item_count' },
        { title: this.$t('common.remarks'), width: 200, ellipsis: true, colKey: 'remarks' },
        { title: this.$t('common.create_time'), width: 180, ellipsis: true, colKey: 'create_time' },
        { align: 'left', width: 220, colKey: 'op', title: this.$t('common.op') },
      ],
      rowKey: 'id',
      verticalAlign: 'top',
      hover: true,
      pagination: { total: 0, current: 1, pageSize: 10 },
      searchformData: { group_name: '' },
      deleteIdx: -1,

      // 删除确认
      delGroupVisible: false,
      forceDelete: false,
      refsData: { block_count: 0, allow_count: 0, hosts: [] },

      // 组内条目
      itemDrawerVisible: false,
      currentGroup: { group_name: '', group_code: '' },
      itemData: [],
      itemLoading: false,
      selectedItemKeys: [],
      itemPagination: { total: 0, current: 1, pageSize: 10 },
      itemSearchData: { ip: '' },
      itemColumns: [
        { colKey: 'row-select', type: 'multiple', width: 64, fixed: 'left' },
        { title: 'IP', align: 'left', width: 240, ellipsis: true, colKey: 'ip' },
        { title: this.$t('common.remarks'), width: 200, ellipsis: true, colKey: 'remarks' },
        { title: this.$t('common.create_time'), width: 180, ellipsis: true, colKey: 'create_time' },
        { align: 'left', width: 140, colKey: 'op', title: this.$t('common.op') },
      ],
      itemFormVisible: false,
      itemFormData: { id: '', ip: '', remarks: '' },
      itemRules: {
        ip: [{ required: true, message: this.$t('common.placeholder') + 'IP', type: 'error' }],
      },
      delItemConfirmVisible: false,
      pendingDelItemId: '',
      batchDelItemsVisible: false,
      clearItemsConfirmVisible: false,

      // 批量录入
      batchAddVisible: false,
      batchAddContent: '',
      batchResultVisible: false,
      batchResult: { success: 0, skipped: 0, fail: 0, total: 0, fail_lines: [] },
    };
  },
  computed: {
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    },
    hasRefs() {
      return (this.refsData.block_count || 0) + (this.refsData.allow_count || 0) > 0;
    },
    refsWarning() {
      return this.$t('page.ipgroup.delete_has_refs')
        .replace('{block}', this.refsData.block_count || 0)
        .replace('{allow}', this.refsData.allow_count || 0)
        .replace('{hosts}', (this.refsData.hosts || []).length);
    },
    ruleUsageTips() {
      return this.$t('page.ipgroup.rule_usage_tips').replace('{name}', this.currentGroup.group_name || '');
    },
    batchResultSummary() {
      return this.$t('page.ipgroup.batch_add_result')
        .replace('{success}', this.batchResult.success || 0)
        .replace('{skipped}', this.batchResult.skipped || 0)
        .replace('{fail}', this.batchResult.fail || 0);
    },
  },
  mounted() {
    this.getList();
  },
  methods: {
    getContainer() {
      return document.querySelector('.tdesign-starter-layout');
    },
    getList() {
      const that = this;
      that.dataLoading = true;
      wafIPGroupListApi({
        pageSize: that.pagination.pageSize,
        pageIndex: that.pagination.current,
        ...that.searchformData,
      })
        .then((res) => {
          if (res.code === 0) {
            that.data = res.data.list ?? [];
            that.pagination = { ...that.pagination, total: res.data.total };
          }
        })
        .catch((e: Error) => { console.log(e); })
        .finally(() => { that.dataLoading = false; });
    },
    rehandlePageChange(curr) {
      this.pagination.current = curr.current;
      if (this.pagination.pageSize !== curr.pageSize) {
        this.pagination.current = 1;
        this.pagination.pageSize = curr.pageSize;
      }
      this.getList();
    },
    handleAddGroup() {
      this.addFormVisible = true;
      this.formData = { ...INITIAL_GROUP };
    },
    onClickCloseBtn() {
      this.addFormVisible = false;
      this.formData = { ...INITIAL_GROUP };
    },
    onSubmit({ result, firstError }): void {
      const that = this;
      if (firstError) {
        that.$message.warning(firstError);
        return;
      }
      wafIPGroupAddApi({ ...that.formData })
        .then((res) => {
          if (res.code === 0) {
            that.$message.success(res.msg);
            that.addFormVisible = false;
            that.pagination.current = 1;
            that.getList();
          } else {
            that.$message.warning(res.msg);
          }
        })
        .catch((e: Error) => { console.log(e); });
    },
    handleClickEdit(e) {
      this.formEditData = { ...e.row };
      this.editFormVisible = true;
    },
    onSubmitEdit({ result, firstError }): void {
      const that = this;
      if (firstError) {
        that.$message.warning(firstError);
        return;
      }
      wafIPGroupEditApi({
        id: that.formEditData.id,
        group_name: that.formEditData.group_name,
        remarks: that.formEditData.remarks,
      })
        .then((res) => {
          if (res.code === 0) {
            that.$message.success(res.msg);
            that.editFormVisible = false;
            that.getList();
          } else {
            that.$message.warning(res.msg);
          }
        })
        .catch((e: Error) => { console.log(e); });
    },
    // 删除前先查引用：被黑/白名单引用时，级联会连带删掉那些条目，必须让用户看清楚再确认
    handleClickDelete(e) {
      const that = this;
      that.deleteIdx = e.rowIndex;
      that.forceDelete = false;
      that.refsData = { block_count: 0, allow_count: 0, hosts: [] };
      wafIPGroupRefsApi({ group_code: e.row.group_code })
        .then((res) => {
          if (res.code === 0) {
            that.refsData = res.data;
          }
        })
        .catch((err: Error) => { console.log(err); })
        .finally(() => { that.delGroupVisible = true; });
    },
    onConfirmDeleteGroup() {
      const that = this;
      const row = that.data[that.deleteIdx];
      if (!row) { return; }
      wafIPGroupDelApi({ id: row.id, force: that.forceDelete ? 1 : 0 })
        .then((res) => {
          if (res.code === 0) {
            that.$message.success(res.msg);
            that.getList();
          } else {
            that.$message.warning(res.msg);
          }
        })
        .catch((e: Error) => { console.log(e); })
        .finally(() => {
          that.delGroupVisible = false;
          that.deleteIdx = -1;
          that.forceDelete = false;
        });
    },

    // ---------- 组内条目 ----------
    handleManageItems(row) {
      this.currentGroup = { ...row };
      this.itemSearchData = { ip: '' };
      this.itemPagination = { total: 0, current: 1, pageSize: 10 };
      this.selectedItemKeys = [];
      this.itemDrawerVisible = true;
      this.getItemList();
    },
    onCloseDrawer() {
      // 组内条目变了，条目数要刷新
      this.getList();
    },
    getItemList() {
      const that = this;
      that.itemLoading = true;
      wafIPGroupItemListApi({
        pageSize: that.itemPagination.pageSize,
        pageIndex: that.itemPagination.current,
        group_code: that.currentGroup.group_code,
        ...that.itemSearchData,
      })
        .then((res) => {
          if (res.code === 0) {
            that.itemData = res.data.list ?? [];
            that.itemPagination = { ...that.itemPagination, total: res.data.total };
          }
        })
        .catch((e: Error) => { console.log(e); })
        .finally(() => { that.itemLoading = false; });
    },
    rehandleItemPageChange(curr) {
      this.itemPagination.current = curr.current;
      if (this.itemPagination.pageSize !== curr.pageSize) {
        this.itemPagination.current = 1;
        this.itemPagination.pageSize = curr.pageSize;
      }
      this.getItemList();
    },
    rehandleItemSelectChange(keys) {
      this.selectedItemKeys = keys;
    },
    // 跳到批量任务页；在某个组的抽屉里点的话把组带过去，直接预填成该组的导入任务
    handleJumpBatchTask() {
      const groupCode = this.itemDrawerVisible ? this.currentGroup.group_code : '';
      this.$router.push({
        name: 'WafBatchTaskList',
        query: groupCode ? { ip_group_code: groupCode } : {},
      });
    },
    handleAddItem() {
      this.itemFormData = { id: '', ip: '', remarks: '' };
      this.itemFormVisible = true;
    },
    handleEditItem(row) {
      this.itemFormData = { id: row.id, ip: row.ip, remarks: row.remarks };
      this.itemFormVisible = true;
    },
    onSubmitItem({ result, firstError }): void {
      const that = this;
      if (firstError) {
        that.$message.warning(firstError);
        return;
      }
      const isEdit = !!that.itemFormData.id;
      const api = isEdit ? wafIPGroupItemEditApi : wafIPGroupItemAddApi;
      const payload = isEdit
        ? { id: that.itemFormData.id, ip: that.itemFormData.ip, remarks: that.itemFormData.remarks }
        : { group_code: that.currentGroup.group_code, ip: that.itemFormData.ip, remarks: that.itemFormData.remarks };
      api(payload)
        .then((res) => {
          if (res.code === 0) {
            that.$message.success(res.msg);
            that.itemFormVisible = false;
            that.getItemList();
          } else {
            that.$message.warning(res.msg);
          }
        })
        .catch((e: Error) => { console.log(e); });
    },
    handleDelItem(row) {
      this.pendingDelItemId = row.id;
      this.delItemConfirmVisible = true;
    },
    onConfirmDelItem() {
      const that = this;
      that.delItemConfirmVisible = false;
      wafIPGroupItemDelApi({ id: that.pendingDelItemId })
        .then((res) => {
          if (res.code === 0) {
            that.$message.success(res.msg);
            that.getItemList();
          } else {
            that.$message.warning(res.msg);
          }
        })
        .catch((e: Error) => { console.log(e); })
        .finally(() => { that.pendingDelItemId = ''; });
    },
    handleBatchDelItems() {
      if (this.selectedItemKeys.length === 0) { return; }
      this.batchDelItemsVisible = true;
    },
    onConfirmBatchDelItems() {
      const that = this;
      that.batchDelItemsVisible = false;
      wafIPGroupItemBatchDelApi({ ids: that.selectedItemKeys })
        .then((res) => {
          if (res.code === 0) {
            that.$message.success(res.msg);
            that.selectedItemKeys = [];
            that.getItemList();
          } else {
            that.$message.warning(res.msg);
          }
        })
        .catch((e: Error) => { console.log(e); });
    },
    onConfirmClearItems() {
      const that = this;
      that.clearItemsConfirmVisible = false;
      wafIPGroupItemDelAllApi({ group_code: that.currentGroup.group_code })
        .then((res) => {
          if (res.code === 0) {
            that.$message.success(res.msg);
            that.selectedItemKeys = [];
            that.getItemList();
          } else {
            that.$message.warning(res.msg);
          }
        })
        .catch((e: Error) => { console.log(e); });
    },
    handleBatchAdd() {
      this.batchAddContent = '';
      this.batchAddVisible = true;
    },
    onSubmitBatchAdd() {
      const that = this;
      if (!that.batchAddContent.trim()) {
        that.$message.warning(that.$t('page.ipgroup.batch_add_empty'));
        return;
      }
      wafIPGroupItemBatchAddApi({
        group_code: that.currentGroup.group_code,
        content: that.batchAddContent,
      })
        .then((res) => {
          if (res.code === 0) {
            that.batchAddVisible = false;
            that.batchResult = res.data;
            that.batchResultVisible = true;
            that.getItemList();
          } else {
            that.$message.warning(res.msg);
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

.form-tips {
  margin-top: 4px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.ref-host-list {
  margin: 12px 0;
  padding-left: 20px;
  max-height: 200px;
  overflow-y: auto;

  li {
    line-height: 22px;
  }
}

.t-button+.t-button {
  margin-left: @spacer;
}

.link-text {
  cursor: pointer;
  color: var(--td-brand-color);
}
</style>
