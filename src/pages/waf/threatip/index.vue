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
      <t-alert theme="info" :message="$t('page.threatip.alert_message')" close />
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
          <template #last_sync_at="{ row }">
            <span>{{ formatTs(row.last_sync_at) }}</span>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleSync(slotProps)">{{ $t('page.threatip.sync') }}</a>
            <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
    </t-card>

    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="120">
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
        columns: [
          { title: this.$t('page.threatip.label_name'), align: 'left', width: 160, ellipsis: true, colKey: 'name' },
          { title: this.$t('page.threatip.label_code'), width: 120, ellipsis: true, colKey: 'code' },
          { title: this.$t('page.threatip.label_parser'), width: 120, colKey: 'parser_type' },
          { title: this.$t('page.threatip.label_land'), width: 110, colKey: 'land_target' },
          { title: this.$t('page.threatip.label_enable'), width: 90, colKey: 'enable' },
          { title: this.$t('page.threatip.last_count'), width: 100, colKey: 'last_count' },
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
      };
    },
    computed: {
      offsetTop() {
        return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
      },
    },
    mounted() {
      this.getList('');
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
      getList() {
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
            }
          })
          .catch((e: Error) => { console.log(e); })
          .finally(() => { this.dataLoading = false; });
        this.dataLoading = true;
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
            } else {
              that.$message.warning(res.msg);
            }
            that.getList('');
          })
          .catch((e: Error) => { console.log(e); });
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
</style>
