<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAdd"> {{ $t('page.tamper_protection.button_add_tamper_protection') }} </t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="80" layout="inline" colon
            :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.tamper_protection.host_code')" name="host_code">
              <t-select v-model="searchformData.host_code" clearable filterable :style="{ width: '150px' }">
                <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                  {{ item }}
                </t-option>
              </t-select>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <t-alert theme="info" :message="$t('page.tamper_protection.alert_message')" close>
        <template #operation>
          <span @click="handleJumpOnlineUrl">{{ $t('common.online_document') }}</span>
        </template>
      </t-alert>
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
          @page-change="rehandlePageChange" @change="rehandleChange" @select-change="rehandleSelectChange"
          :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">

          <template #host_code="{ row }">
            <span> {{ host_dic[row.host_code] }}</span>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
            <a class="t-button-link" v-if="slotProps.row.is_baseline_completed === 0" @click="handleClickBaselineScan(slotProps)">{{ $t('page.tamper_protection.baseline_scan') }}</a>
            <a class="t-button-link" @click="handleClickViewLog(slotProps)">{{ $t('page.tamper_protection.view_log')
              }}</a>
            <a class="t-button-link" @click="handleClickViewFileHash(slotProps)">{{
              $t('page.tamper_protection.view_file_hash') }}</a>
          </template>
        </t-table>
      </div>
      <div>
        <router-view></router-view>
      </div>
    </t-card>


    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="100">




          <t-form-item :label="$t('page.tamper_protection.host_code')" name="host_code">
            <t-select v-model="formData.host_code" clearable filterable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.name')" name="name">
            <t-input :style="{ width: '480px' }" v-model="formData.name"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.protected_path')" name="protected_path">
            <t-input :style="{ width: '480px' }" v-model="formData.protected_path"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.backup_path')" name="backup_path">
            <t-input :style="{ width: '480px' }" v-model="formData.backup_path"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.monitor_mode')" name="monitor_mode">
            <t-input :style="{ width: '480px' }" v-model="formData.monitor_mode"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.scan_interval')" name="scan_interval">
            <t-input-number :style="{ width: '150px' }" v-model="formData.scan_interval"
              :placeholder="$t('common.placeholder')">
            </t-input-number>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.file_patterns')" name="file_patterns">
            <t-input :style="{ width: '480px' }" v-model="formData.file_patterns"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.exclude_patterns')" name="exclude_patterns">
            <t-input :style="{ width: '480px' }" v-model="formData.exclude_patterns"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.auto_backup')" name="auto_backup">
            <t-input-number :style="{ width: '150px' }" v-model="formData.auto_backup"
              :placeholder="$t('common.placeholder')">
            </t-input-number>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.auto_restore')" name="auto_restore">
            <t-input-number :style="{ width: '150px' }" v-model="formData.auto_restore"
              :placeholder="$t('common.placeholder')">
            </t-input-number>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.is_enable')" name="is_enable">
            <t-input-number :style="{ width: '150px' }" v-model="formData.is_enable"
              :placeholder="$t('common.placeholder')">
            </t-input-number>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.remarks')" name="remarks">
            <t-input :style="{ width: '480px' }" v-model="formData.remarks"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.is_baseline_completed')" name="is_baseline_completed">
            <t-input-number :style="{ width: '150px' }" v-model="formData.is_baseline_completed"
              :placeholder="$t('common.placeholder')">
            </t-input-number>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.total_files')" name="total_files">
            <t-input-number :style="{ width: '150px' }" v-model="formData.total_files"
              :placeholder="$t('common.placeholder')">
            </t-input-number>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.completed_files')" name="completed_files">
            <t-input-number :style="{ width: '150px' }" v-model="formData.completed_files"
              :placeholder="$t('common.placeholder')">
            </t-input-number>
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
        <t-form :data="formEditData" ref="form" :rules="rules" @submit="onSubmitEdit" :labelWidth="100">




          <t-form-item :label="$t('page.tamper_protection.host_code')" name="host_code">
            <t-select v-model="formEditData.host_code" clearable filterable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.name')" name="name">
            <t-input :style="{ width: '480px' }" v-model="formEditData.name"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.protected_path')" name="protected_path">
            <t-input :style="{ width: '480px' }" v-model="formEditData.protected_path"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.backup_path')" name="backup_path">
            <t-input :style="{ width: '480px' }" v-model="formEditData.backup_path"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.monitor_mode')" name="monitor_mode">
            <t-input :style="{ width: '480px' }" v-model="formEditData.monitor_mode"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.scan_interval')" name="scan_interval">
            <t-input-number :style="{ width: '150px' }" v-model="formEditData.scan_interval"
              :placeholder="$t('common.placeholder')">
            </t-input-number>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.file_patterns')" name="file_patterns">
            <t-input :style="{ width: '480px' }" v-model="formEditData.file_patterns"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.exclude_patterns')" name="exclude_patterns">
            <t-input :style="{ width: '480px' }" v-model="formEditData.exclude_patterns"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.auto_backup')" name="auto_backup">
            <t-input-number :style="{ width: '150px' }" v-model="formEditData.auto_backup"
              :placeholder="$t('common.placeholder')">
            </t-input-number>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.auto_restore')" name="auto_restore">
            <t-input-number :style="{ width: '150px' }" v-model="formEditData.auto_restore"
              :placeholder="$t('common.placeholder')">
            </t-input-number>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.is_enable')" name="is_enable">
            <t-input-number :style="{ width: '150px' }" v-model="formEditData.is_enable"
              :placeholder="$t('common.placeholder')">
            </t-input-number>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.remarks')" name="remarks">
            <t-input :style="{ width: '480px' }" v-model="formEditData.remarks"></t-input>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.is_baseline_completed')" name="is_baseline_completed">
            <t-input-number :style="{ width: '150px' }" v-model="formEditData.is_baseline_completed"
              :placeholder="$t('common.placeholder')">
            </t-input-number>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.total_files')" name="total_files">
            <t-input-number :style="{ width: '150px' }" v-model="formEditData.total_files"
              :placeholder="$t('common.placeholder')">
            </t-input-number>
          </t-form-item>

          <t-form-item :label="$t('page.tamper_protection.completed_files')" name="completed_files">
            <t-input-number :style="{ width: '150px' }" v-model="formEditData.completed_files"
              :placeholder="$t('common.placeholder')">
            </t-input-number>
          </t-form-item>

          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseEditBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <t-dialog :header="$t('common.confirm_delete')" :body="confirmBody" :visible.sync="confirmVisible"
      @confirm="onConfirmDelete" :onCancel="onCancel">
    </t-dialog>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import {
  SearchIcon
} from 'tdesign-icons-vue';
import Trend from '@/components/trend/index.vue';
import {
  prefix
} from '@/config/global';
import {
  allhost
} from '@/apis/host';

  import {
    wafTamperProtectionListApi, wafTamperProtectionDelApi, wafTamperProtectionEditApi, wafTamperProtectionAddApi, wafTamperProtectionDetailApi, wafTamperProtectionBaselineScanApi
  } from '@/apis/tamper_protection';

const INITIAL_DATA = {



  host_code: '',
  name: '',
  protected_path: '',
  backup_path: '',
  monitor_mode: '',
  scan_interval: '',
  file_patterns: '',
  exclude_patterns: '',
  auto_backup: '',
  auto_restore: '',
  is_enable: '',
  remarks: '',
  is_baseline_completed: '',
  total_files: '',
  completed_files: '',

};
export default Vue.extend({
  name: 'TamperProtectionBase',
  components: {
    SearchIcon,
    Trend,
  },
  data() {
    return {
      addFormVisible: false,
      editFormVisible: false,
      guardVisible: false,
      confirmVisible: false,
      formData: {
        ...INITIAL_DATA
      },
      formEditData: {
        ...INITIAL_DATA
      },
      rules: {

        name: [{
          required: true,
          message: this.$t('common.placeholder') + this.$t('page.tamper_protection.name'),
          type: 'error'
        }],

        host_code: [{
          required: true,
          message: this.$t('common.placeholder') + this.$t('page.tamper_protection.host_code'),
          type: 'error'
        }],

      },
      textareaValue: '',
      prefix,
      dataLoading: false,
      data: [], //列表数据信息
      detail_data: [], //加载详情信息用于编辑
      selectedRowKeys: [],
      value: 'first',
      columns: [
        { colKey: 'row-select', type: 'multiple', width: 64, fixed: 'left' },





        {
          title: this.$t('page.tamper_protection.host_code'),
          width: 200,
          ellipsis: true,
          colKey: 'host_code',
        },


        {
          title: this.$t('page.tamper_protection.name'),
          width: 200,
          ellipsis: true,
          colKey: 'name',
        },


        {
          title: this.$t('page.tamper_protection.protected_path'),
          width: 200,
          ellipsis: true,
          colKey: 'protected_path',
        },


        {
          title: this.$t('page.tamper_protection.backup_path'),
          width: 200,
          ellipsis: true,
          colKey: 'backup_path',
        },


        {
          title: this.$t('page.tamper_protection.monitor_mode'),
          width: 200,
          ellipsis: true,
          colKey: 'monitor_mode',
        },


        {
          title: this.$t('page.tamper_protection.scan_interval'),
          width: 200,
          ellipsis: true,
          colKey: 'scan_interval',
        },


        {
          title: this.$t('page.tamper_protection.file_patterns'),
          width: 200,
          ellipsis: true,
          colKey: 'file_patterns',
        },


        {
          title: this.$t('page.tamper_protection.exclude_patterns'),
          width: 200,
          ellipsis: true,
          colKey: 'exclude_patterns',
        },


        {
          title: this.$t('page.tamper_protection.auto_backup'),
          width: 200,
          ellipsis: true,
          colKey: 'auto_backup',
        },


        {
          title: this.$t('page.tamper_protection.auto_restore'),
          width: 200,
          ellipsis: true,
          colKey: 'auto_restore',
        },


        {
          title: this.$t('page.tamper_protection.is_enable'),
          width: 200,
          ellipsis: true,
          colKey: 'is_enable',
        },


        {
          title: this.$t('page.tamper_protection.remarks'),
          width: 200,
          ellipsis: true,
          colKey: 'remarks',
        },


        {
          title: this.$t('page.tamper_protection.is_baseline_completed'),
          width: 200,
          ellipsis: true,
          colKey: 'is_baseline_completed',
        },


        {
          title: this.$t('page.tamper_protection.total_files'),
          width: 200,
          ellipsis: true,
          colKey: 'total_files',
        },


        {
          title: this.$t('page.tamper_protection.completed_files'),
          width: 200,
          ellipsis: true,
          colKey: 'completed_files',
        },

        {
          align: 'left',
          fixed: 'right',
          width: 200,
          colKey: 'op',
          title: this.$t('common.op'),
        },
      ],
      rowKey: 'id',
      tableLayout: 'auto',
      verticalAlign: 'top',
      hover: true,
      rowClassName: (rowKey: string) => `${rowKey}-class`,
      // 与pagination对齐
      pagination: {
        total: 0,
        current: 1,
        pageSize: 10
      },
      //顶部搜索
      searchformData: {
        host_code: ""
      },
      //索引区域
      deleteIdx: -1,
      guardStatusIdx: -1,
      //主机字典
      host_dic: {}
    };
  },
  computed: {
    confirmBody() {
      if (this.deleteIdx > -1) {
        const {
          host
        } = this.data?.[this.deleteIdx];
        return this.$t('common.data_delete_warning');
      }
      return '';
    },
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    },
  },
  mounted() {
    this.loadHostList().then(() => {
      this.getList("");
    });
  },

  methods: {
    loadHostList() {
      return new Promise((resolve, reject) => {
        allhost()
          .then((res) => {
            let resdata = res;
            console.log(resdata);
            if (resdata.code === 0) {
              let host_options = resdata.data;
              for (let i = 0; i < host_options.length; i++) {
                this.host_dic[host_options[i].value] = host_options[i].label;
              }
            }
            resolve(); // 调用 resolve 表示加载完成
          })
          .catch((e: Error) => {
            console.log(e);
            reject(e); // 调用 reject 表示加载失败
          });
      });
    },
    getList(keyword) {
      let that = this
      wafTamperProtectionListApi({
        pageSize: that.pagination.pageSize,
        pageIndex: that.pagination.current,
        ...that.searchformData
      })
        .then((res) => {
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {

            this.data = resdata.data.list ?? [];
            this.data_attach = []
            console.log('getList', this.data)
            this.pagination = {
              ...this.pagination,
              total: resdata.data.total,
            };
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
          this.dataLoading = false;
        });
      this.dataLoading = true;
    },
    getContainer() {
      return document.querySelector('.tdesign-starter-layout');
    },
    rehandlePageChange(curr, pageInfo) {
      this.pagination.current = curr.current
      if (this.pagination.pageSize != curr.pageSize) {
        this.pagination.current = 1
        this.pagination.pageSize = curr.pageSize
      }
      this.getList("")
    },
    rehandleSelectChange(selectedRowKeys: number[]) {
      this.selectedRowKeys = selectedRowKeys;
    },
    rehandleChange(changeParams, triggerAndData) {
    },
    handleClickEdit(e) {
      console.log(e)
      const {
        id
      } = e.row
      console.log(id)
      this.editFormVisible = true
      this.getDetail(id)
    },
    handleAdd() {
      this.addFormVisible = true
      this.formData = { ...INITIAL_DATA };
    },
    onSubmit({
      result,
      firstError
    }): void {
      let that = this
      if (!firstError) {

        let postdata = {
          ...that.formData
        }














        postdata['scan_interval'] = Number(postdata['scan_interval'])







        postdata['auto_backup'] = Number(postdata['auto_backup'])



        postdata['auto_restore'] = Number(postdata['auto_restore'])



        postdata['is_enable'] = Number(postdata['is_enable'])



        postdata['is_baseline_completed'] = Number(postdata['is_baseline_completed'])



        postdata['total_files'] = Number(postdata['total_files'])



        postdata['completed_files'] = Number(postdata['completed_files'])



        wafTamperProtectionAddApi({ ...postdata })
          .then((res) => {
            let resdata = res
            console.log(resdata)
            if (resdata.code === 0) {
              that.$message.success(resdata.msg);
              that.addFormVisible = false;
              that.pagination.current = 1
              that.getList("")
            } else {
              that.$message.warning(resdata.msg);
            }
          })
          .catch((e: Error) => {
            console.log(e);
          })
          .finally(() => { });
      } else {
        console.log('Errors: ', result);
        that.$message.warning(firstError);
      }
    },
    onSubmitEdit({
      result,
      firstError
    }): void {
      let that = this
      if (!firstError) {

        let postdata = {
          ...that.formEditData
        }














        postdata['scan_interval'] = Number(postdata['scan_interval'])







        postdata['auto_backup'] = Number(postdata['auto_backup'])



        postdata['auto_restore'] = Number(postdata['auto_restore'])



        postdata['is_enable'] = Number(postdata['is_enable'])



        postdata['is_baseline_completed'] = Number(postdata['is_baseline_completed'])



        postdata['total_files'] = Number(postdata['total_files'])



        postdata['completed_files'] = Number(postdata['completed_files'])



        wafTamperProtectionEditApi({ ...postdata })
          .then((res) => {
            let resdata = res
            console.log(resdata)
            if (resdata.code === 0) {
              that.$message.success(resdata.msg);
              that.editFormVisible = false;
              that.getList("")
            } else {
              that.$message.warning(resdata.msg);
            }
          })
          .catch((e: Error) => {
            console.log(e);
          })
          .finally(() => { });
      } else {
        console.log('Errors: ', result);
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
    handleClickDelete(row) {
      console.log(row)
      this.deleteIdx = row.rowIndex;
      this.confirmVisible = true;
    },
    handleClickViewLog(e) {
      const {
        id
      } = e.row
      this.$router.push({
        name: 'WafTamperProtectionLog',
        query: {
          config_id: id
        }
      })
    },
      handleClickViewFileHash(e) {
        const {
          id
        } = e.row
        this.$router.push({
          name: 'WafTamperProtectionFileHash',
          query: {
            config_id: id
          }
        })
      },
      handleClickBaselineScan(e) {
        const {
          id
        } = e.row
        let that = this
        wafTamperProtectionBaselineScanApi({
              id: id
          })
          .then((res) => {
            let resdata = res
            console.log(resdata)
            if (resdata.code === 0) {
              that.$message.success(resdata.msg);
              that.getList("")
            } else {
              that.$message.warning(resdata.msg);
            }
          })
          .catch((e: Error) => {
            console.log(e);
            that.$message.error("基线扫描失败");
          })
          .finally(() => {});
      },
    onConfirmDelete() {
      this.confirmVisible = false;
      console.log('delete', this.data)
      console.log('delete', this.data[this.deleteIdx])
      let {
        id
      } = this.data[this.deleteIdx]
      let that = this
      wafTamperProtectionDelApi({
        id: id
      })
        .then((res) => {
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {

            that.getList("")
            that.$message.success(resdata.msg);
          } else {
            that.$message.warning(resdata.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => { });


      this.resetIdx();
    },
    onCancel() {
      this.resetIdx();
    },
    resetIdx() {
      this.deleteIdx = -1;
    },
    getDetail(id) {
      let that = this
      wafTamperProtectionDetailApi({
        id: id
      })
        .then((res) => {
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {
            that.detail_data = resdata.data;















            that.detail_data.scan_interval = that.detail_data.scan_interval.toString()







            that.detail_data.auto_backup = that.detail_data.auto_backup.toString()



            that.detail_data.auto_restore = that.detail_data.auto_restore.toString()



            that.detail_data.is_enable = that.detail_data.is_enable.toString()



            that.detail_data.is_baseline_completed = that.detail_data.is_baseline_completed.toString()



            that.detail_data.total_files = that.detail_data.total_files.toString()



            that.detail_data.completed_files = that.detail_data.completed_files.toString()



            that.formEditData = {
              ...that.detail_data
            }
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => { });
    },
    handleJumpOnlineUrl() {
      window.open(this.samwafglobalconfig.getOnlineUrl() + "/guide/TamperProtection.html");
    },
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables';

.left-operation-container {
  padding: 0 0 6px 0;
  margin-bottom: 16px;

  .selected-count {
    display: inline-block;
    margin-left: 8px;
    color: var(--td-text-color-secondary);
  }
}

.search-input {
  width: 360px;
}

.t-button+.t-button {
  margin-left: @spacer;
}
</style>
