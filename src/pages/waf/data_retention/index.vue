<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-tag theme="warning" variant="light">{{ $t('page.data_retention.tip_readonly') }}</t-tag>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" layout="inline" :style="{ marginBottom: '8px' }">
            <t-form-item>
              <t-button theme="primary" @click="getList">{{ $t('common.search') }}</t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>

      <t-alert theme="info" :message="$t('page.data_retention.alert_message')" close />

      <div class="table-container">
        <t-table
          :columns="columns"
          :data="data"
          rowKey="id"
          :verticalAlign="verticalAlign"
          :hover="hover"
          :loading="dataLoading"
          :headerAffixedTop="true"
          :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }"
        >
          <template #clean_enabled="{ row }">
            <t-tag :theme="row.clean_enabled === 1 ? 'success' : 'default'" variant="light">
              {{ row.clean_enabled === 1 ? $t('page.data_retention.enabled') : $t('page.data_retention.disabled') }}
            </t-tag>
          </template>

          <template #op="slotProps">
            <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
          </template>
        </t-table>
      </div>
    </t-card>

    <!-- 编辑对话框 -->
    <t-dialog
      :header="$t('common.edit')"
      :visible.sync="editFormVisible"
      :width="580"
      :footer="false"
    >
      <div slot="body">
        <t-form :data="formEditData" ref="editForm" :rules="rules" @submit="onSubmitEdit" :labelWidth="120">

          <t-form-item :label="$t('page.data_retention.table_name')" name="table_name">
            <t-input :style="{ width: '380px' }" v-model="formEditData.table_name" disabled />
          </t-form-item>

          <t-form-item :label="$t('page.data_retention.db_type')" name="db_type">
            <t-tag theme="primary" variant="light">{{ formEditData.db_type || 'stats' }}</t-tag>
          </t-form-item>

          <t-form-item :label="$t('page.data_retention.retain_days')" name="retain_days">
            <t-input-number
              :style="{ width: '200px' }"
              v-model="formEditData.retain_days"
              :min="0"
              :step="1"
            />
            <span style="margin-left:8px;color:var(--td-text-color-secondary)">{{ $t('page.data_retention.days_unit') }}</span>
          </t-form-item>

          <t-form-item :label="$t('page.data_retention.retain_rows')" name="retain_rows">
            <t-input-number
              :style="{ width: '200px' }"
              v-model="formEditData.retain_rows"
              :min="0"
              :step="10000"
            />
            <span style="margin-left:8px;color:var(--td-text-color-secondary)">{{ $t('page.data_retention.rows_unit') }}</span>
          </t-form-item>

          <t-form-item :label="$t('page.data_retention.clean_enabled')" name="clean_enabled">
            <t-switch
              v-model="cleanEnabledBool"
              :label="[$t('page.data_retention.enabled'), $t('page.data_retention.disabled')]"
              @change="onCleanEnabledChange"
            />
          </t-form-item>

          <t-form-item :label="$t('page.data_retention.remarks')" name="remarks">
            <t-input :style="{ width: '380px' }" v-model="formEditData.remarks" />
          </t-form-item>

          <!-- 只读信息 -->
          <t-form-item :label="$t('page.data_retention.last_clean_time')">
            <span style="color:var(--td-text-color-secondary)">
              {{ formEditData.last_clean_time || $t('page.data_retention.never_cleaned') }}
            </span>
          </t-form-item>

          <t-form-item :label="$t('page.data_retention.last_clean_rows')">
            <span style="color:var(--td-text-color-secondary)">{{ formEditData.last_clean_rows }}</span>
          </t-form-item>

          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseEditBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { prefix } from '@/config/global';
import {
  wafDataRetentionListApi,
  wafDataRetentionDetailApi,
  wafDataRetentionEditApi,
} from '@/apis/data_retention.ts';

const INITIAL_EDIT_DATA = {
  id: '',
  table_name: '',
  retain_days: 90,
  retain_rows: 100000,
  day_field: '',
  day_field_type: '',
  row_order_field: '',
  row_order_dir: '',
  clean_enabled: 1,
  last_clean_time: '',
  last_clean_rows: 0,
  remarks: '',
};

export default Vue.extend({
  name: 'DataRetentionBase',
  data() {
    return {
      editFormVisible: false,
      formEditData: { ...INITIAL_EDIT_DATA },
      cleanEnabledBool: true,
      rules: {
        retain_days: [{ required: true, type: 'error', message: this.$t('common.placeholder') + this.$t('page.data_retention.retain_days') }],
        retain_rows: [{ required: true, type: 'error', message: this.$t('common.placeholder') + this.$t('page.data_retention.retain_rows') }],
      },
      prefix,
      dataLoading: false,
      data: [],
      searchformData: {},
      verticalAlign: 'top',
      hover: true,
      columns: [
        {
          title: this.$t('page.data_retention.table_name'),
          colKey: 'table_name',
          width: 180,
          ellipsis: true,
        },
        {
          title: this.$t('page.data_retention.db_type'),
          colKey: 'db_type',
          width: 90,
        },
        {
          title: this.$t('page.data_retention.retain_days'),
          colKey: 'retain_days',
          width: 110,
        },
        {
          title: this.$t('page.data_retention.retain_rows'),
          colKey: 'retain_rows',
          width: 120,
        },
        {
          title: this.$t('page.data_retention.day_field'),
          colKey: 'day_field',
          width: 130,
          ellipsis: true,
        },
        {
          title: this.$t('page.data_retention.clean_enabled'),
          colKey: 'clean_enabled',
          width: 100,
        },
        {
          title: this.$t('page.data_retention.last_clean_time'),
          colKey: 'last_clean_time',
          width: 180,
          ellipsis: true,
        },
        {
          title: this.$t('page.data_retention.last_clean_rows'),
          colKey: 'last_clean_rows',
          width: 120,
        },
        {
          title: this.$t('page.data_retention.remarks'),
          colKey: 'remarks',
          ellipsis: true,
        },
        {
          align: 'left',
          fixed: 'right',
          width: 80,
          colKey: 'op',
          title: this.$t('common.op'),
        },
      ],
    };
  },
  computed: {
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    },
  },
  mounted() {
    this.getList();
  },
  methods: {
    getList() {
      this.dataLoading = true;
      wafDataRetentionListApi({ pageSize: 20, pageIndex: 1 })
        .then((res) => {
          const resdata = res;
          if (resdata.code === 0) {
            this.data = resdata.data.list ?? [];
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
          this.dataLoading = false;
        });
    },
    getContainer() {
      return document.querySelector('.tdesign-starter-layout');
    },
    handleClickEdit(e) {
      const { id } = e.row;
      this.editFormVisible = true;
      this.getDetail(id);
    },
    getDetail(id) {
      wafDataRetentionDetailApi({ id })
        .then((res) => {
          const resdata = res;
          if (resdata.code === 0) {
            this.formEditData = { ...resdata.data };
            this.cleanEnabledBool = this.formEditData.clean_enabled === 1;
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
    },
    onCleanEnabledChange(val: boolean) {
      this.formEditData.clean_enabled = val ? 1 : 0;
    },
    onSubmitEdit({ firstError }) {
      const that = this;
      if (!firstError) {
        wafDataRetentionEditApi({ ...that.formEditData })
          .then((res) => {
            const resdata = res;
            if (resdata.code === 0) {
              that.$message.success(resdata.msg);
              that.editFormVisible = false;
              that.getList();
            } else {
              that.$message.warning(resdata.msg);
            }
          })
          .catch((e: Error) => {
            console.log(e);
          });
      } else {
        that.$message.warning(firstError);
      }
    },
    onClickCloseEditBtn() {
      this.editFormVisible = false;
      this.formEditData = { ...INITIAL_EDIT_DATA };
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
</style>
