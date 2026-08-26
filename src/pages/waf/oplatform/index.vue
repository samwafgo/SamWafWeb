<template>
  <div>
    <t-card class="list-card-container">
      <!-- 开放平台总开关。默认是关的，而"调不通"的头号原因就是这个开关没开——
           以前它藏在「参数配置」里，用户在这页建完 Key 直接去调，然后来问为什么 401。
           放在整页最上面靠右，进页面第一眼就能看到当前是开还是关 -->
      <div class="op-master">
        <t-tooltip :content="openPlatformEnabled ? $t('page.oplatform.master_on_tips') : $t('page.oplatform.master_off_tips')">
          <div class="op-master__box">
            <t-switch v-model="openPlatformEnabled" :loading="masterLoading" @change="handleToggleMaster" />
            <span class="op-master__t">{{ $t('page.oplatform.master_switch') }}</span>
            <t-tag v-if="openPlatformEnabled" theme="success" variant="light">{{ $t('page.oplatform.master_on') }}</t-tag>
            <t-tag v-else theme="warning" variant="light">{{ $t('page.oplatform.master_off') }}</t-tag>
          </div>
        </t-tooltip>
      </div>

      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAdd">{{ $t('page.oplatform.new_key') }}</t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="searchForm" :data="searchformData" layout="inline" colon :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.oplatform.key_name')" name="key_name">
              <t-input v-model="searchformData.key_name" style="width:200px" clearable />
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>

      <help-block
        :summary="$t('page.oplatform.help_summary')"
        :items="helpItems"
        :note="$t('page.oplatform.help_note')"
        :title="$t('page.oplatform.help_title')"
        doc="https://doc.samwaf.com/api/"
        storage-key="oplatform-key"
      />

      <div class="table-container">
        <t-table
          :columns="columns"
          :data="data"
          rowKey="id"
          :hover="true"
          :pagination="pagination"
          :loading="dataLoading"
          @page-change="rehandlePageChange"
        >
          <template #api_key="slotProps">
            <span>{{ slotProps.row.api_key }}</span>
          </template>
          <template #status="slotProps">
            <t-tag :theme="slotProps.row.status === 1 ? 'success' : 'danger'">
              {{ slotProps.row.status === 1 ? $t('page.oplatform.status_enabled') : $t('page.oplatform.status_disabled') }}
            </t-tag>
          </template>
          <template #rate_limit="slotProps">
            {{ slotProps.row.rate_limit > 0 ? slotProps.row.rate_limit + ' ' + $t('page.oplatform.per_minute') : $t('page.oplatform.no_limit') }}
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleEdit(slotProps)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleToggleStatus(slotProps)">
              {{ slotProps.row.status === 1 ? $t('page.oplatform.disable') : $t('page.oplatform.enable') }}
            </a>
            <a class="t-button-link" @click="handleResetSecret(slotProps)">{{ $t('page.oplatform.reset_key') }}</a>
            <a class="t-button-link" style="color: #e34d59" @click="handleDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
    </t-card>

    <!-- 新增 Key 对话框 -->
    <t-dialog
      :header="$t('page.oplatform.new_key')"
      :visible.sync="addFormVisible"
      :width="580"
      :footer="false"
    >
      <div slot="body">
        <t-form :data="formData" ref="addForm" :rules="rules" @submit="onSubmitAdd" :labelWidth="120">
          <t-form-item :label="$t('page.oplatform.key_name')" name="key_name">
            <t-input :style="{ width: '380px' }" v-model="formData.key_name" :placeholder="$t('page.oplatform.key_name_placeholder')" />
          </t-form-item>
          <t-form-item :label="$t('page.oplatform.rate_limit')" name="rate_limit">
            <t-input-number :style="{ width: '380px' }" v-model="formData.rate_limit" :min="0" :placeholder="$t('page.oplatform.rate_limit_tip')" />
          </t-form-item>
          <t-form-item :label="$t('page.oplatform.ip_whitelist')" name="ip_whitelist">
            <t-input :style="{ width: '380px' }" v-model="formData.ip_whitelist" :placeholder="$t('page.oplatform.ip_whitelist_placeholder')" />
          </t-form-item>
          <t-form-item :label="$t('page.oplatform.expire_time')" name="expire_time">
            <t-input :style="{ width: '380px' }" v-model="formData.expire_time" :placeholder="$t('page.oplatform.expire_time_placeholder')" />
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remark">
            <t-textarea :style="{ width: '380px' }" v-model="formData.remark" />
          </t-form-item>
          <t-form-item style="float:right">
            <t-button variant="outline" @click="addFormVisible = false">{{ $t('common.cancel') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 编辑 Key 对话框 -->
    <t-dialog
      :header="$t('common.edit')"
      :visible.sync="editFormVisible"
      :width="580"
      :footer="false"
    >
      <div slot="body">
        <t-form :data="formEditData" ref="editForm" :rules="rules" @submit="onSubmitEdit" :labelWidth="120">
          <t-form-item :label="$t('page.oplatform.key_name')" name="key_name">
            <t-input :style="{ width: '380px' }" v-model="formEditData.key_name" />
          </t-form-item>
          <t-form-item :label="$t('page.oplatform.status')" name="status">
            <t-radio-group v-model="formEditData.status">
              <t-radio :value="1">{{ $t('page.oplatform.status_enabled') }}</t-radio>
              <t-radio :value="0">{{ $t('page.oplatform.status_disabled') }}</t-radio>
            </t-radio-group>
          </t-form-item>
          <t-form-item :label="$t('page.oplatform.rate_limit')" name="rate_limit">
            <t-input-number :style="{ width: '380px' }" v-model="formEditData.rate_limit" :min="0" />
          </t-form-item>
          <t-form-item :label="$t('page.oplatform.ip_whitelist')" name="ip_whitelist">
            <t-input :style="{ width: '380px' }" v-model="formEditData.ip_whitelist" :placeholder="$t('page.oplatform.ip_whitelist_placeholder')" />
          </t-form-item>
          <t-form-item :label="$t('page.oplatform.expire_time')" name="expire_time">
            <t-input :style="{ width: '380px' }" v-model="formEditData.expire_time" :placeholder="$t('page.oplatform.expire_time_placeholder')" />
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remark">
            <t-textarea :style="{ width: '380px' }" v-model="formEditData.remark" />
          </t-form-item>
          <t-form-item style="float:right">
            <t-button variant="outline" @click="editFormVisible = false">{{ $t('common.cancel') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 新建/重置 Key 结果对话框 -->
    <t-dialog
      :header="secretDialogTitle"
      :visible.sync="secretDialogVisible"
      :width="520"
      :cancel-btn="null"
      @confirm="secretDialogVisible = false"
    >
      <div slot="body">
        <t-alert theme="warning" :message="$t('page.oplatform.key_once_warning')" style="margin-bottom:16px" />
        <t-form :labelWidth="120">
          <t-form-item label="API Key">
            <t-input v-model="newSecret" readonly :style="{ width: '300px' }">
              <template #suffix>
                <t-button size="small" variant="text" @click="copyText(newSecret)">{{ $t('page.oplatform.copy') }}</t-button>
              </template>
            </t-input>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 删除确认对话框 -->
    <t-dialog
      :header="$t('common.delete')"
      :visible.sync="confirmVisible"
      :width="400"
      @confirm="onConfirmDelete"
      @cancel="confirmVisible = false"
    >
      <div slot="body">{{ $t('page.oplatform.delete_confirm') }}</div>
    </t-dialog>
  </div>
</template>

<script>
import {
  oplatform_key_list_api,
  oplatform_key_add_api,
  oplatform_key_edit_api,
  oplatform_key_del_api,
  oplatform_key_reset_secret_api,
  oplatform_key_detail_api
} from '@/apis/oplatform'
import { get_detail_by_item_api, edit_system_config_by_item_api } from '@/apis/systemconfig'
import { MessagePlugin } from 'tdesign-vue'

// 开放平台总开关在「参数配置」里的键名。它是个普通的系统配置项，
// 后端 editByItem 改完会立刻 TaskLoadSetting，不需要重启。
const MASTER_ITEM = 'open_platform_enabled'

export default {
  name: 'OPlatformKey',
  data() {
    return {
      dataLoading: false,
      openPlatformEnabled: false,
      masterLoading: false,
      data: [],
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0
      },
      searchformData: {
        key_name: ''
      },
      columns: [
        { colKey: 'key_name', title: this.$t('page.oplatform.key_name'), width: 150 },
        { colKey: 'api_key', title: 'API Key', width: 240 },
        { colKey: 'status', title: this.$t('page.oplatform.status'), width: 100 },
        { colKey: 'rate_limit', title: this.$t('page.oplatform.rate_limit'), width: 120 },
        { colKey: 'ip_whitelist', title: this.$t('page.oplatform.ip_whitelist'), width: 160, ellipsis: true },
        { colKey: 'call_count', title: this.$t('page.oplatform.call_count'), width: 100 },
        { colKey: 'last_use_time', title: this.$t('page.oplatform.last_use_time'), width: 160 },
        { colKey: 'expire_time', title: this.$t('page.oplatform.expire_time'), width: 150 },
        { colKey: 'op', title: this.$t('common.operation'), width: 260, fixed: 'right' }
      ],
      addFormVisible: false,
      editFormVisible: false,
      secretDialogVisible: false,
      confirmVisible: false,
      confirmDeleteId: '',
      newSecret: '',
      secretDialogTitle: '',
      formData: {
        key_name: '',
        remark: '',
        rate_limit: 0,
        ip_whitelist: '',
        expire_time: ''
      },
      formEditData: {
        id: '',
        key_name: '',
        status: 1,
        remark: '',
        rate_limit: 0,
        ip_whitelist: '',
        expire_time: ''
      },
      rules: {
        key_name: [{ required: true, message: this.$t('page.oplatform.key_name_required'), type: 'error' }]
      }
    }
  },
  computed: {
    // 说明条目挑的是实际会被问到的：开关没开、请求头怎么带、为什么返回不是密文、
    // 哪些接口用 Key 调不了。不是把 API 文档抄一遍。
    helpItems() {
      return [
        { k: this.$t('page.oplatform.help_k_switch'), v: this.$t('page.oplatform.help_v_switch'), tone: 'brand' },
        { k: this.$t('page.oplatform.help_k_header'), v: this.$t('page.oplatform.help_v_header'), tone: 'brand' },
        { k: this.$t('page.oplatform.help_k_limit'), v: this.$t('page.oplatform.help_v_limit') },
        { k: this.$t('page.oplatform.help_k_plain'), v: this.$t('page.oplatform.help_v_plain') },
        { k: this.$t('page.oplatform.help_k_forbid'), v: this.$t('page.oplatform.help_v_forbid'), tone: 'danger' },
      ]
    }
  },
  mounted() {
    this.getList()
    this.fetchMasterSwitch()
  },
  methods: {
    fetchMasterSwitch() {
      get_detail_by_item_api({ item: MASTER_ITEM })
        .then((res) => {
          if (res.code === 0) {
            this.openPlatformEnabled = String(res.data && res.data.value) === '1'
          }
        })
        .catch((error) => {
          // 取不到不影响建 Key，静默即可；开关维持关闭的保守显示
          console.error('获取开放平台开关失败:', error)
        })
    },
    handleToggleMaster(value) {
      this.masterLoading = true
      edit_system_config_by_item_api({ item: MASTER_ITEM, value: value ? '1' : '0' })
        .then((res) => {
          if (res.code === 0) {
            MessagePlugin.success(this.$t('common.tips.save_success'))
          } else {
            MessagePlugin.error(res.msg || this.$t('common.tips.save_failed'))
            this.openPlatformEnabled = !value
          }
        })
        .catch((error) => {
          console.error('更新开放平台开关失败:', error)
          MessagePlugin.error(this.$t('common.tips.save_failed'))
          this.openPlatformEnabled = !value
        })
        .finally(() => {
          this.masterLoading = false
        })
    },
    getList() {
      this.dataLoading = true
      oplatform_key_list_api({
        pageIndex: this.pagination.current,
        pageSize: this.pagination.pageSize,
        key_name: this.searchformData.key_name
      }).then((res) => {
        this.dataLoading = false
        if (res && res.code === 0) {
          this.data = res.data.list || []
          this.pagination.total = res.data.total
        }
      }).catch(() => { this.dataLoading = false })
    },
    handleAdd() {
      this.formData = { key_name: '', remark: '', rate_limit: 0, ip_whitelist: '', expire_time: '' }
      this.addFormVisible = true
    },
    onSubmitAdd({ validateResult }) {
      if (validateResult !== true) return
      oplatform_key_add_api(this.formData).then((res) => {
        if (res && res.code === 0) {
          this.addFormVisible = false
          this.newSecret = res.data.api_key
          this.secretDialogTitle = this.$t('page.oplatform.new_key_created')
          this.secretDialogVisible = true
          this.getList()
        } else {
          MessagePlugin.error(res ? res.msg : this.$t('page.oplatform.add_fail'))
        }
      })
    },
    handleEdit(slotProps) {
      const row = slotProps.row
      oplatform_key_detail_api({ id: row.id }).then((res) => {
        if (res && res.code === 0) {
          const d = res.data
          this.formEditData = {
            id: d.id,
            key_name: d.key_name,
            status: d.status,
            remark: d.remark,
            rate_limit: d.rate_limit,
            ip_whitelist: d.ip_whitelist,
            expire_time: d.expire_time
          }
          this.editFormVisible = true
        }
      })
    },
    onSubmitEdit({ validateResult }) {
      if (validateResult !== true) return
      oplatform_key_edit_api(this.formEditData).then((res) => {
        if (res && res.code === 0) {
          MessagePlugin.success(this.$t('page.oplatform.edit_success'))
          this.editFormVisible = false
          this.getList()
        } else {
          MessagePlugin.error(res ? res.msg : this.$t('page.oplatform.edit_fail'))
        }
      })
    },
    handleToggleStatus(slotProps) {
      const row = slotProps.row
      const newStatus = row.status === 1 ? 0 : 1
      oplatform_key_edit_api({
        id: row.id,
        key_name: row.key_name,
        status: newStatus,
        remark: row.remark,
        rate_limit: row.rate_limit,
        ip_whitelist: row.ip_whitelist,
        expire_time: row.expire_time
      }).then((res) => {
        if (res && res.code === 0) {
          MessagePlugin.success(newStatus === 1 ? this.$t('page.oplatform.enable_success') : this.$t('page.oplatform.disable_success'))
          this.getList()
        }
      })
    },
    handleResetSecret(slotProps) {
      oplatform_key_reset_secret_api({ id: slotProps.row.id }).then((res) => {
        if (res && res.code === 0) {
          this.newSecret = res.data.api_key
          this.secretDialogTitle = this.$t('page.oplatform.reset_key')
          this.secretDialogVisible = true
          this.getList()
        }
      })
    },
    handleDelete(slotProps) {
      this.confirmDeleteId = slotProps.row.id
      this.confirmVisible = true
    },
    onConfirmDelete() {
      this.confirmVisible = false
      oplatform_key_del_api({ id: this.confirmDeleteId }).then((res) => {
        if (res && res.code === 0) {
          MessagePlugin.success(this.$t('page.oplatform.delete_success'))
          this.getList()
        }
      })
    },
    rehandlePageChange(pagination) {
      this.pagination.current = pagination.current
      this.pagination.pageSize = pagination.pageSize
      this.getList()
    },
    copyText(text) {
      navigator.clipboard.writeText(text).then(() => {
        MessagePlugin.success(this.$t('page.oplatform.copy_success'))
      }).catch(() => {
        // fallback
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        MessagePlugin.success(this.$t('page.oplatform.copy_success'))
      })
    }
  }
}
</script>

<style scoped>
.list-card-container {
  padding: 16px;
}
.op-master {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
.op-master__box {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  border: 1px solid var(--td-component-stroke, #e7e7e7);
  border-radius: var(--td-radius-medium, 3px);
  background: var(--td-bg-color-container-hover, #fafafa);
}
.op-master__t {
  font-weight: 500;
}
.left-operation-container {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.right-operation-container {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
</style>
