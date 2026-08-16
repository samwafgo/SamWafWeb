<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAddSslConfig" theme="success"> {{ $t('common.new') }} </t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="300" layout="inline" colon :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.ssl.label_domains')" name="domains">
              <t-input v-model="searchformData.domains" class="search-input" clearable></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <help-block :summary="$t('page.ssl.alert_message')" doc="guide/SSL" />
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
                 :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
                 @page-change="rehandlePageChange"
                 :headerAffixedTop="true" >

          <template #domain="{ row }">
            <span> {{ row.domain }}</span>
          </template>

          <template #op="slotProps">
            <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
      <div>
        <router-view></router-view>
      </div>
    </t-card>

    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="750" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="220">
          <t-form-item :label="$t('page.ssl.label_cert_content')" name="cert_content">
            <t-textarea v-model="formData.cert_content" :style="{ width: '480px' }" rows="4"></t-textarea>
            <t-button theme="default" size="small" @click="importCertFile('add')" :style="{ marginTop: '8px' }">
              {{ $t('page.ssl.import_cert_file') }}
            </t-button>
          </t-form-item>
          <t-form-item :label="$t('page.ssl.label_key_content')" name="key_content">
            <t-textarea v-model="formData.key_content" :style="{ width: '480px' }" rows="4"></t-textarea>
            <t-button theme="default" size="small" @click="importKeyFile('add')" :style="{ marginTop: '8px' }">
              {{ $t('page.ssl.import_key_file') }}
            </t-button>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="820" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="form" :rules="rules" @submit="onSubmitEdit" :labelWidth="220">
          <t-form-item :label="$t('page.ssl.label_valid_to')" name="valid_to">
            <span>{{formEditData.valid_to}} ({{formEditData.expiration_info}})</span>
          </t-form-item>
          <t-form-item :label="$t('page.ssl.label_bind_hosts')" name="bind_hosts" v-if="formEditData.bind_hosts && formEditData.bind_hosts.length > 0">
            <div>
              <div v-for="(host, index) in formEditData.bind_hosts" :key="index" style="margin-bottom: 4px;">
                {{ host }}
              </div>
            </div>
          </t-form-item>
          <t-form-item :label="$t('page.ssl.label_cert_content')" name="cert_content">
            <t-textarea v-model="formEditData.cert_content" :style="{ width: '480px' }" rows="4"></t-textarea>
            <t-button theme="default" size="small" @click="importCertFile('edit')" :style="{ marginTop: '8px' }">
              {{ $t('page.ssl.import_cert_file') }}
            </t-button>
          </t-form-item>
          <t-form-item :label="$t('page.ssl.label_key_content')" name="key_content">
            <t-textarea v-model="formEditData.key_content" :style="{ width: '480px' }" rows="4"></t-textarea>
            <t-button theme="default" size="small" @click="importKeyFile('edit')" :style="{ marginTop: '8px' }">
              {{ $t('page.ssl.import_key_file') }}
            </t-button>
          </t-form-item>
          <!-- 「入」：从磁盘读进来 -->
          <div class="cert-path-block cert-path-block--in">
            <div class="cert-path-block__header">
              <span class="cert-path-block__badge cert-path-block__badge--in">
                {{ $t('page.ssl.label_path_direction_in') }}
              </span>
              <span class="cert-path-block__desc">{{ $t('page.ssl.label_import_tip') }}</span>
            </div>
            <t-form-item :label="$t('page.ssl.label_auto_load_path_switch')" name="auto_load_path">
              <!-- 宽度写成内联样式：t-form-item 的内容区是 flex，类选择器会被框架规则盖掉，
                   导致开关被拉伸成整行、说明文字撑出边框 -->
              <div class="cert-path-block__field" :style="{ width: '480px' }">
                <t-switch v-model="formEditData.auto_load_path" :custom-value="[1, 0]"></t-switch>
                <div class="cert-path-block__tip">{{ $t('page.ssl.label_auto_load_path_tip') }}</div>
              </div>
            </t-form-item>
            <t-form-item :label="$t('page.ssl.label_auto_key_path')" name="key_path">
              <t-textarea v-model="formEditData.key_path" :style="{ width: '480px' }" rows="3"></t-textarea>
            </t-form-item>
            <t-form-item :label="$t('page.ssl.label_auto_crt_path')" name="cert_path">
              <t-textarea v-model="formEditData.cert_path" :style="{ width: '480px' }" rows="3"></t-textarea>
            </t-form-item>
          </div>

          <!-- 「出」：写到磁盘出去 -->
          <div class="cert-path-block cert-path-block--out">
            <div class="cert-path-block__header">
              <span class="cert-path-block__badge cert-path-block__badge--out">
                {{ $t('page.ssl.label_path_direction_out') }}
              </span>
              <span class="cert-path-block__desc">{{ $t('page.ssl.label_export_tip') }}</span>
            </div>
            <t-form-item :label="$t('page.ssl.label_export_crt_path')" name="export_cert_path">
              <t-input v-model="formEditData.export_cert_path" :style="{ width: '480px' }" clearable></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.ssl.label_export_key_path')" name="export_key_path">
              <div class="cert-path-block__field" :style="{ width: '480px' }">
                <t-input v-model="formEditData.export_key_path" clearable></t-input>
                <div class="cert-path-block__tip">{{ $t('page.ssl.label_export_path_tip') }}</div>
              </div>
            </t-form-item>
            <t-form-item :label="$t('page.ssl.label_export_status')" name="export_status" v-if="formEditData.export_status">
              <span class="cert-path-block__status">{{ formEditData.export_status }}</span>
            </t-form-item>
          </div>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseEditBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 隐藏的文件输入框 -->
    <input ref="certFileInput" type="file" accept=".crt" style="display: none" @change="handleCertFileChange" />
    <input ref="keyFileInput" type="file" accept=".key" style="display: none" @change="handleKeyFileChange" />

    <t-dialog :header="$t('common.confirm_delete')" :body="confirmBody" :visible.sync="confirmVisible" @confirm="onConfirmDelete"
              :onCancel="onCancel">
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
  sslConfigListApi, sslConfigDelApi, sslConfigEditApi, sslConfigAddApi, sslConfigDetailApi
} from '@/apis/sslconfig';

const INITIAL_DATA = {
  cert_content: '',
  key_content: '',
  cert_path: '',
  key_path: '',
  auto_load_path: 1,
  export_cert_path: '',
  export_key_path: '',
};

export default Vue.extend({
  name: 'SslConfigList',
  components: {
    SearchIcon,
    Trend,
  },
  data() {
    return {
      addFormVisible: false,
      editFormVisible: false,
      confirmVisible: false,
      formData: {
        ...INITIAL_DATA
      },
      formEditData: {
        ...INITIAL_DATA
      },
      rules: {
        cert_content: [
          {
            required: true,
            message: this.$t('common.select_placeholder') + this.$t('page.ssl.label_cert_content'),
            type: 'error'
          }
        ],
        key_content: [
          {
            required: true,
            message: this.$t('common.select_placeholder') + this.$t('page.ssl.label_key_content'),
            type: 'error'
          }
        ]
      },
      dataLoading: false,
      data: [], // 列表数据信息
      selectedRowKeys: [],
      columns: [
        {
          align: 'left',
          width: 200,
          colKey: 'op',
          title: this.$t('common.op'),
        },
        {
          title: this.$t('page.ssl.label_bind_hosts'),
          align: 'left',
          width: 300,
          ellipsis: true,
          colKey: 'bind_hosts',
          cell: (h, { row }) => {
            if (row.bind_hosts && row.bind_hosts.length > 0) {
              return row.bind_hosts.join(', ');
            }
            return '-';
          },
        },
        {
          title: this.$t('page.ssl.label_valid_from'),
          width: 200,
          ellipsis: true,
          colKey: 'valid_from',
        },
        {
          title: this.$t('page.ssl.label_valid_to'),
          width: 200,
          ellipsis: true,
          colKey: 'valid_to',
        },
        {
          title: this.$t('page.ssl.label_expire_time'),
          width: 200,
          ellipsis: true,
          colKey: 'expiration_info',
        },
        {
          title: this.$t('page.ssl.label_domains'),
          width: 250,
          ellipsis: true,
          colKey: 'domains',
        },
        {
          title: this.$t('page.ssl.label_subject'),
          align: 'left',
          width: 250,
          ellipsis: true,
          colKey: 'subject',
        },
        {
          title: this.$t('page.ssl.label_issuer'),
          align: 'left',
          width: 250,
          ellipsis: true,
          colKey: 'issuer',
        },
        {
          title: this.$t('page.ssl.label_serial_no'),
          align: 'left',
          width: 250,
          ellipsis: true,
          colKey: 'serial_no',
        },
        {
          title: "id",
          align: 'left',
          width: 250,
          ellipsis: true,
          colKey: 'id',
        },
      ],
      rowKey: 'id',
      tableLayout: 'auto',
      verticalAlign: 'top',
      hover: true,
      pagination: {
        total: 0,
        current: 1,
        pageSize: 10
      },
      searchformData: {
        domains: '',
      },
      deleteIdx: -1,
      currentImportMode: '', // 'add' 或 'edit'
      currentImportType: '', // 'cert' 或 'key'
    };
  },
  computed: {
    confirmBody() {
      if (this.deleteIdx > -1) {
        return this.$t('common.confirm_delete');
      }
      return '';
    },
  },
  mounted() {
    this.getList("")
  },
  methods: {
    rehandlePageChange(curr, pageInfo) {
      this.pagination.current = curr.current
      if (this.pagination.pageSize != curr.pageSize) {
        this.pagination.current = 1
        this.pagination.pageSize = curr.pageSize
      }
      this.getList("")
    },
    getList(keyword) {
      let that = this;
      sslConfigListApi({
        pageSize: that.pagination.pageSize,
        pageIndex: that.pagination.current,
        ...that.searchformData
      })
        .then((res) => {
          let resdata = res;
          if (resdata.code === 0) {
            this.data = resdata.data.list??[];
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
    handleAddSslConfig() {
      this.addFormVisible = true;
      this.formData = {
        domain: '',
        cert_serial: '',
        remarks: '',
      };
    },
    onSubmit({
               result,
               firstError
             }): void {
      let that = this;
      if (!firstError) {
        sslConfigAddApi({
          ...this.formData,
        })
          .then((res) => {
            if (res.code === 0) {
              that.getList('');
              // 后端会把证书导出的结果拼在消息里（成功路径/失败原因），原样展示
              that.$message.success(res.msg || '添加成功');
              that.addFormVisible = false;
            }else{
              that.$message.warning(res.msg);
            }
          });
      }
    },
    handleClickEdit(slotProps) {
      const {
        row
      } = slotProps;
      this.formEditData = {
        auto_load_path: 1,
        ...row
      };
      // 老数据这两列可能是 null，统一成空串，避免 t-input 的 v-model 拿到 null
      this.formEditData.export_cert_path = row.export_cert_path || '';
      this.formEditData.export_key_path = row.export_key_path || '';
      this.editFormVisible = true;
    },
    onSubmitEdit({
                   result,
                   firstError
                 }): void {
      let that = this;
      if (!firstError) {
        sslConfigEditApi({
          ...this.formEditData,
        })
          .then((res) => {
            if (res.code === 0) {
              that.getList('');
              // 后端会把证书导出的结果拼在消息里（成功路径/失败原因），原样展示
              that.$message.success(res.msg || '编辑成功');
              that.editFormVisible = false;
            }else{
              that.$message.warning(res.msg);
            }
          });
      }
    },
    handleClickDelete(slotProps) {
      const {
        row
      } = slotProps;
      this.deleteIdx = row.id;
      this.confirmVisible = true;
    },
    onConfirmDelete() {
      let that = this;
      sslConfigDelApi({
        id: this.deleteIdx
      })
        .then((res) => {
          if (res.code === 0) {
            that.getList('');
            that.$message.success('删除成功');
            that.confirmVisible = false;
            that.deleteIdx = -1;
          }
        });
    },
    onCancel() {
      this.confirmVisible = false;
      this.deleteIdx = -1;
    },
    onClickCloseBtn() {
      this.addFormVisible = false;
    },
    onClickCloseEditBtn() {
      this.editFormVisible = false;
    },
    // 导入证书文件
    importCertFile(mode) {
      this.currentImportMode = mode;
      this.currentImportType = 'cert';
      this.$refs.certFileInput.click();
    },
    // 导入密钥文件
    importKeyFile(mode) {
      this.currentImportMode = mode;
      this.currentImportType = 'key';
      this.$refs.keyFileInput.click();
    },
    // 处理证书文件变化
    handleCertFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          console.log("file:",content,"this.currentImportMode：",this.currentImportMode)
          if (this.currentImportMode === 'add') {
            console.log("file:add ",content)
            this.$set(this.formData, 'cert_content', content);
          } else {
            this.$set(this.formEditData, 'cert_content', content);
          }
          this.$message.success(this.$t('page.ssl.import_cert_success'));
        };
        reader.readAsText(file);
      }
      // 清空文件输入框
      event.target.value = '';
    },
    // 处理密钥文件变化
    handleKeyFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          if (this.currentImportMode === 'add') {
            this.$set(this.formData, 'key_content', content);
          } else {
            this.$set(this.formEditData, 'key_content', content);
          }
          this.$message.success(this.$t('page.ssl.import_key_success'));
        };
        reader.readAsText(file);
      }
      // 清空文件输入框
      event.target.value = '';
    },
  },
});
</script>

<style scoped>
.list-card-container {
  padding: 20px;
}
.table-container {
  margin-top: 20px;
}
.search-input {
  width: 200px;
}

/* 证书路径的两个方向：入(从磁盘读进来) / 出(写到磁盘出去)，用边框和色条分开，避免混淆 */
.cert-path-block {
  border: 1px solid #dcdcdc;
  border-radius: 6px;
  padding: 16px 16px 0;
  margin-bottom: 16px;
}
.cert-path-block--in {
  border-color: #bcd4ff;
  background-color: #f7faff;
}
.cert-path-block--out {
  border-color: #b5e2c8;
  background-color: #f6fdf9;
}
.cert-path-block__header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 14px;
}
.cert-path-block__badge {
  flex: none;
  margin-right: 10px;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  line-height: 20px;
  color: #fff;
  white-space: nowrap;
}
.cert-path-block__badge--in {
  background-color: #0052d9;
}
.cert-path-block__badge--out {
  background-color: #00a870;
}
.cert-path-block__desc {
  font-size: 13px;
  line-height: 1.6;
  color: #444;
}
/* 输入框和它的说明文字必须竖排：直接并排放在 form-item 里会被 flex 挤窄输入框。
   这里用普通块级容器而不是 flex 列——flex 的 align stretch 会把开关拉成整行。
   宽度写在模板的内联样式里，避免被框架规则覆盖。 */
.cert-path-block__field {
  display: block;
}
.cert-path-block__tip {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}
.cert-path-block__status {
  max-width: 480px;
  word-break: break-all;
}
</style>
