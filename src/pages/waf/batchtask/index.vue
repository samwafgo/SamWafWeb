<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAdd" theme="success"> {{ $t('common.new') }} </t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="300" layout="inline" colon :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.batchtask.label_batch_task_name')" name="batch_task_name">
              <t-input v-model="searchformData.batch_task_name" class="search-input" clearable></t-input>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <help-block :summary="$t('page.batchtask.alert_message')" doc="guide/BatchTask" />
      <div class="table-container">
        <t-table :columns="columns" :data="data"  size="small" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
                 :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
                 @page-change="rehandlePageChange"
                 :headerAffixedTop="true" >
           <template #batch_host_code="{ row }">
            <!-- IP组任务不绑定网站，这一列改显示目标IP组，否则整列空白看不出导到哪 -->
            <t-tag v-if="row.batch_type === 'ipgroup'" theme="primary" variant="light">
              {{ groupLabelOfTask(row) }}
            </t-tag>
            <span v-else> {{host_dic[row.batch_host_code]}}</span>
          </template>

         <template #batch_type="{ row }">
            <p>
              {{
                batch_task_type.find(option => option.value === row.batch_type)?.label || row.batch_type
              }}
            </p>
          </template>
          <template #batch_source_type="{ row }">
            <p>
              {{
               batch_source_type.find(option => option.value === row.batch_source_type)?.label || row.batch_source_type
              }}
            </p>
          </template>
          <template #batch_execute_method="{ row }">
            <p>
              {{
                batch_execute_method.find(option => option.value === row.batch_execute_method)?.label || row.batch_execute_method
              }}
            </p>
          </template>
          <template #batch_trigger_type="{ row }">
            <p>
              {{
                batch_trigger_type.find(option => option.value === row.batch_trigger_type)?.label || row.batch_trigger_type
              }}
            </p>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleClickManual(slotProps)">{{ $t('page.batchtask.label_btn_manual') }}</a>
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
         <t-form-item :label="$t('page.batchtask.label_batch_task_name')" name="batch_task_name">
        <t-input v-model="formData.batch_task_name" :style="{ width: '480px' }"></t-input>
      </t-form-item>
      <t-form-item v-if="formData.batch_type !== 'ipgroup'" :label="$t('page.batchtask.label_website')" name="batch_host_code">
            <t-select v-model="formData.batch_host_code" clearable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item"
                :key="index">
                {{ item }}
              </t-option>
            </t-select>
      </t-form-item>
      <t-form-item :label="$t('page.batchtask.label_batch_type')" name="batch_type">
         <t-select v-model="formData.batch_type" :style="{ width: '480px' }" @change="onBatchTypeChange">
          <t-option v-for="item in batch_task_type" :value="item.value" :label="`${item.label}`"></t-option>
        </t-select>
      </t-form-item>
      <!-- IP组是租户级资源、不带网站，目标组通过额外配置里的 group_code 指定 -->
      <t-form-item v-if="formData.batch_type === 'ipgroup'" :label="$t('page.batchtask.label_ip_group')" name="ip_group_code">
        <div>
          <t-select v-model="formData.ip_group_code" clearable filterable :style="{ width: '480px' }">
            <t-option v-for="g in group_options" :key="g.group_code" :value="g.group_code"
              :label="g.group_name + ' (' + g.item_count + ')'"></t-option>
          </t-select>
          <a class="t-button-link" style="margin-left: 8px" @click="handleQuickAddGroup('add')">
            {{ $t('page.batchtask.ip_group_quick_add') }}
          </a>
          <a class="t-button-link" style="margin-left: 8px" @click="handleJumpIPGroup">
            {{ $t('page.batchtask.ip_group_goto_manage') }}
          </a>
          <div style="margin-top: 8px; font-size: 12px; color: #666;">
            {{ group_options.length ? $t('page.batchtask.ip_group_tips') : $t('page.batchtask.ip_group_empty_tips') }}
          </div>
        </div>
      </t-form-item>
      <t-form-item v-if="formData.batch_type !== 'ipgroup'" :label="$t('page.batchtask.label_batch_extra_config')" name="batch_extra_config">
            <div>
              <t-textarea 
                v-model="formData.batch_extra_config" 
                :style="{ width: '480px' }" 
                rows="6"
                :placeholder="$t('page.batchtask.batch_extra_config_placeholder')"
              ></t-textarea>
              <div style="margin-top: 8px; font-size: 12px; color: #666; white-space: pre-line;">
                {{ getCurrentConfigDescription('add') }}
              </div>
            </div>
          </t-form-item>
      <t-form-item :label="$t('page.batchtask.label_batch_source_type')" name="batch_source_type">
        <t-select v-model="formData.batch_source_type" :style="{ width: '480px' }">
          <t-option  v-for="item in batch_source_type" :value="item.value" :label="`${item.label}`" ></t-option>
        </t-select>
      </t-form-item>
      <t-form-item :label="$t('page.batchtask.label_batch_source')" name="batch_source">
        <t-input v-model="formData.batch_source" :style="{ width: '480px' }"></t-input>
      </t-form-item>
      <t-form-item :label="$t('page.batchtask.label_batch_execute_method')" name="batch_execute_method">
        <div>
          <t-select v-model="formData.batch_execute_method" :style="{ width: '480px' }">
            <t-option  v-for="item in batch_execute_method" :value="item.value" :label="`${item.label}`" ></t-option>
          </t-select>
          <div v-if="formData.batch_type === 'ipgroup' && formData.batch_execute_method === 'overwrite'"
            style="margin-top: 8px; font-size: 12px; color: #666;">
            {{ $t('page.batchtask.ip_group_overwrite_tips') }}
          </div>
        </div>
      </t-form-item>
      <t-form-item :label="$t('page.batchtask.label_batch_trigger_type')" name="batch_trigger_type">
        <t-select v-model="formData.batch_trigger_type" :style="{ width: '480px' }">
          <t-option  v-for="item in batch_trigger_type" :value="item.value" :label="`${item.label}`" ></t-option>
        </t-select>
      </t-form-item>
      <t-form-item :label="$t('page.batchtask.label_remark')" name="remark">
        <t-textarea v-model="formData.remark" :style="{ width: '480px' }" rows="4"></t-textarea>
      </t-form-item>
      <t-form-item style="float: right">
        <t-button variant="outline" @click="onClickCloseBtn">{{ $t('common.close') }}</t-button>
        <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
      </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="750" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="form" :rules="editRules" @submit="onSubmitEdit" :labelWidth="220">
          <t-form-item :label="$t('page.batchtask.label_batch_task_name')" name="batch_task_name">
            <t-input v-model="formEditData.batch_task_name" :style="{ width: '480px' }"></t-input>
          </t-form-item>
           <t-form-item v-if="formEditData.batch_type !== 'ipgroup'" :label="$t('page.batchtask.label_website')" name="batch_host_code">
            <t-select v-model="formEditData.batch_host_code" clearable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item"
                :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.batchtask.label_batch_type')" name="batch_type">
            <t-select v-model="formEditData.batch_type" :style="{ width: '480px' }" @change="onBatchTypeChangeEdit">
              <t-option v-for="item in batch_task_type" :value="item.value" :label="`${item.label}`"></t-option>
            </t-select>
          </t-form-item>
          <t-form-item v-if="formEditData.batch_type === 'ipgroup'" :label="$t('page.batchtask.label_ip_group')" name="ip_group_code">
            <div>
              <t-select v-model="formEditData.ip_group_code" clearable filterable :style="{ width: '480px' }">
                <t-option v-for="g in group_options" :key="g.group_code" :value="g.group_code"
                  :label="g.group_name + ' (' + g.item_count + ')'"></t-option>
              </t-select>
              <a class="t-button-link" style="margin-left: 8px" @click="handleQuickAddGroup('edit')">
                {{ $t('page.batchtask.ip_group_quick_add') }}
              </a>
              <a class="t-button-link" style="margin-left: 8px" @click="handleJumpIPGroup">
                {{ $t('page.batchtask.ip_group_goto_manage') }}
              </a>
              <div style="margin-top: 8px; font-size: 12px; color: #666;">
                {{ group_options.length ? $t('page.batchtask.ip_group_tips') : $t('page.batchtask.ip_group_empty_tips') }}
              </div>
            </div>
          </t-form-item>
          <t-form-item v-if="formEditData.batch_type !== 'ipgroup'" :label="$t('page.batchtask.label_batch_extra_config')" name="batch_extra_config">
            <div>
              <t-textarea 
                v-model="formEditData.batch_extra_config" 
                :style="{ width: '480px' }" 
                rows="6"
                :placeholder="$t('page.batchtask.batch_extra_config_placeholder')"
              ></t-textarea>
              <div style="margin-top: 8px; font-size: 12px; color: #666; white-space: pre-line;">
                {{ getCurrentConfigDescription('edit') }}
              </div>
            </div>
          </t-form-item>
          <t-form-item :label="$t('page.batchtask.label_batch_source_type')" name="batch_source_type">
               <t-select v-model="formEditData.batch_source_type" :style="{ width: '480px' }">
                <t-option  v-for="item in batch_source_type" :value="item.value" :label="`${item.label}`" ></t-option>
              </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.batchtask.label_batch_source')" name="batch_source">
            <t-input v-model="formEditData.batch_source" :style="{ width: '480px' }"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.batchtask.label_batch_execute_method')" name="batch_execute_method">
            <div>
              <t-select v-model="formEditData.batch_execute_method" :style="{ width: '480px' }">
                <t-option  v-for="item in batch_execute_method" :value="item.value" :label="`${item.label}`" ></t-option>
              </t-select>
              <div v-if="formEditData.batch_type === 'ipgroup' && formEditData.batch_execute_method === 'overwrite'"
                style="margin-top: 8px; font-size: 12px; color: #666;">
                {{ $t('page.batchtask.ip_group_overwrite_tips') }}
              </div>
            </div>
          </t-form-item>
          <t-form-item :label="$t('page.batchtask.label_batch_trigger_type')" name="batch_trigger_type">
            <t-select v-model="formEditData.batch_trigger_type" :style="{ width: '480px' }">
              <t-option  v-for="item in batch_trigger_type" :value="item.value" :label="`${item.label}`" ></t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.batchtask.label_remark')" name="remark">
            <t-textarea v-model="formEditData.remark" :style="{ width: '480px' }" rows="4"></t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseEditBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
      </t-form>

      </div>
    </t-dialog>

    <t-dialog :header="$t('common.confirm_delete')" :body="confirmBody" :visible.sync="confirmVisible" @confirm="onConfirmDelete"
              :onCancel="onCancel">
    </t-dialog>

    <!-- 就地新建IP组：不用离开当前表单，建完自动选中 -->
    <t-dialog :header="$t('page.batchtask.ip_group_quick_add')" :visible.sync="quickAddVisible" :width="600" :footer="false">
      <div slot="body">
        <t-form :data="quickAddData" ref="quickAddForm" :rules="quickAddRules" @submit="onSubmitQuickAdd" :labelWidth="100">
          <t-form-item :label="$t('page.ipgroup.label_name')" name="group_name">
            <t-input v-model="quickAddData.group_name" :style="{ width: '420px' }"></t-input>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea v-model="quickAddData.remarks" :style="{ width: '420px' }" rows="3"></t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="quickAddVisible = false">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
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
  batchTaskAddApi,batchTaskDelApi,batchTaskDetailApi,batchTaskEditApi,batchTaskListApi ,batchTaskManualApi
} from '@/apis/batchtask';
  import {
    allhost
  } from '@/apis/host';
  import {
    wafIPGroupOptionsApi, wafIPGroupAddApi
  } from '@/apis/ipgroup';
const INITIAL_DATA = {
  batch_task_name: '',
  batch_host_code: '',
  batch_type: 'ipallow',
  batch_source_type: 'local',
  batch_source: '',
  batch_execute_method: 'append',
  batch_trigger_type: 'cron',
  batch_extra_config: '{}', // 新增字段
  // 仅表单内部使用：IP组任务的目标组，提交时序列化进 batch_extra_config.group_code
  ip_group_code: '',
  remark: '',
};

// 表单校验规则工厂。
// 新增与编辑是两份独立的表单数据，而「网站/目标IP组」的必填与否取决于各自的 batch_type，
// 所以要按表单分别生成一套规则——共用一套会拿新增表单的类型去校验编辑表单。
function buildRules(vm, getForm) {
  return {
    // IP组是租户级资源、不绑定网站，这类任务不校验网站
    batch_host_code: [
      {
        validator: (val) => getForm().batch_type === 'ipgroup' || !!val,
        message: vm.$t('common.select_placeholder') + vm.$t('page.batchtask.label_website'),
        type: 'error'
      }
    ],
    ip_group_code: [
      {
        validator: (val) => getForm().batch_type !== 'ipgroup' || !!val,
        message: vm.$t('common.select_placeholder') + vm.$t('page.batchtask.label_ip_group'),
        type: 'error'
      }
    ],
    batch_task_name: [
      {
        required: true,
        message: vm.$t('common.select_placeholder') + vm.$t('page.batchtask.label_batch_task_name'),
        type: 'error'
      }
    ],
    batch_type: [
      {
        required: true,
        message: vm.$t('common.select_placeholder') + vm.$t('page.batchtask.label_batch_type'),
        type: 'error'
      }
    ],
    batch_extra_config: [
      {
        required: false,
        message: vm.$t('common.select_placeholder') + vm.$t('page.batchtask.label_batch_extra_config'),
        type: 'error'
      },
      {
        validator: (val) => {
          if (!val) return true;
          try {
            JSON.parse(val);
            return true;
          } catch (e) {
            return false;
          }
        },
        message: '请输入有效的JSON格式',
        type: 'error'
      }
    ],
    batch_source_type: [
      {
        required: true,
        message: vm.$t('common.select_placeholder') + vm.$t('page.batchtask.label_batch_source_type'),
        type: 'error'
      }
    ],
    batch_source: [
      {
        required: true,
        message: vm.$t('common.select_placeholder') + vm.$t('page.batchtask.label_batch_source'),
        type: 'error'
      }
    ],
    batch_execute_method: [
      {
        required: true,
        message: vm.$t('common.select_placeholder') + vm.$t('page.batchtask.label_batch_execute_method'),
        type: 'error'
      }
    ],
    batch_trigger_type: [
      {
        required: true,
        message: vm.$t('common.select_placeholder') + vm.$t('page.batchtask.label_batch_trigger_type'),
        type: 'error'
      }
    ],
    remark: [
      {
        required: false,
        message: vm.$t('common.select_placeholder') + vm.$t('page.batchtask.label_remark'),
        type: 'error'
      }
    ]
  };
}

export default Vue.extend({
  name: 'BatchTaskList',
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
      rules: buildRules(this, () => this.formData),
      editRules: buildRules(this, () => this.formEditData),
      dataLoading: false,
      data: [], // 列表数据信息
      selectedRowKeys: [],
      columns: [
       {
          title: this.$t('page.batchtask.label_website'),
          align: 'left',
          width: 250,
          ellipsis: true,
          colKey: 'batch_host_code',
          fixed: 'left',
        }, 
        {
          align: 'left',
          width: 300,
          colKey: 'op',
          fixed: 'left',
          title: this.$t('common.op'),
        },
        {
          title: this.$t('page.batchtask.label_batch_task_name'),
          align: 'left',
          width: 250,
          ellipsis: true,
          fixed: 'left',
          colKey: 'batch_task_name',
        },
        {
          title: this.$t('page.batchtask.label_batch_type'),
          align: 'left',
          width: 200,
          ellipsis: true,
          colKey: 'batch_type',
        },
        {
          title: this.$t('page.batchtask.label_batch_source_type'),
          width: 150,
          ellipsis: true,
          colKey: 'batch_source_type',
        },
        {
          title: this.$t('page.batchtask.label_batch_source'),
          width: 200,
          ellipsis: true,
          colKey: 'batch_source',
        },
        {
          title: this.$t('page.batchtask.label_batch_execute_method'),
          width: 150,
          ellipsis: true,
          colKey: 'batch_execute_method',
        },
        {
          title: this.$t('page.batchtask.label_batch_trigger_type'),
          width: 150,
          ellipsis: true,
          colKey: 'batch_trigger_type',
        },
        {
          title: this.$t('page.batchtask.label_remark'),
          width: 200,
          ellipsis: true,
          colKey: 'remark',
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
        batch_task_name: '',
      },
      deleteIdx: -1,
      // 任务类型配置模板
      batchTypeConfigs: {
        ipallow: {
          template: {
          },
          description: "无"
        },
        ipdeny: {
          template: {
          },
          description: "无"
        },
        ipgroup: {
          // 目标组由上方的「目标IP组」下拉维护，这里不给模板，避免覆盖已选中的组
          template: {
          },
          description: "无"
        },
        sensitive: {
          template: {
            "check_direction": "out",
            "action": "replace"
          },
          description: "敏感词检测配置\n- check_direction: 检测方向(in=入站, out=出站, all=双向)\n- action: 检测后动作(deny=拒绝, replace=替换)"
        }
      },
      //任务类型
      batch_task_type: [
        {
            label: this.$t('page.batchtask.batch_type.add_ipallow'),
            value: 'ipallow'
        },
        {
        label: this.$t('page.batchtask.batch_type.add_ipdeny'),
        value: 'ipdeny'
         },
        {
          label: this.$t('page.batchtask.batch_type.add_ipgroup'),
          value: 'ipgroup'
        },
        {
          label: this.$t('page.batchtask.batch_type.add_sensitive'),
          value: 'sensitive'
        }
      ],
      //来源类型
      batch_source_type: [
        {
            label: this.$t('page.batchtask.batch_source_type.local'),
            value: 'local'
       },{
            label: this.$t('page.batchtask.batch_source_type.remote'),
            value: 'remote'
       },
      ],
      //执行方式
      batch_execute_method: [
        {
            label: this.$t('page.batchtask.batch_execute_method.append'),
            value: 'append'
       },{
            label: this.$t('page.batchtask.batch_execute_method.overwrite'),
            value: 'overwrite'
       },
      ],
      //触发类型
      batch_trigger_type:[
        {
            label: this.$t('page.batchtask.batch_trigger_type.manual'),
            value: 'manual'
        },{
            label: this.$t('page.batchtask.batch_trigger_type.cron'),
            value:'cron'
        }
      ],
       //主机字典
      host_dic:{},
      //默认主机
      default_host_code:"",
      //IP组下拉选项
      group_options: [],
      //就地新建IP组
      quickAddVisible: false,
      quickAddTarget: 'add', //建完后把新组填回哪个表单
      quickAddData: { group_name: '', remarks: '' },
      quickAddRules: {
        group_name: [{
          required: true,
          message: this.$t('common.placeholder') + this.$t('page.ipgroup.label_name'),
          type: 'error',
        }],
      },
      //end data
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
    this.loadHostList().then(() => {
        this.getList("");
      });
    this.loadGroupOptions();
    // 从IP组页面「定时批量导入」跳过来时，直接打开新增弹窗并预选好目标组
    const presetGroup = this.$route.query.ip_group_code;
    if (presetGroup) {
      this.handleAdd();
      this.formData.batch_type = 'ipgroup';
      this.formData.ip_group_code = presetGroup;
    }
  },
  methods: {
    loadGroupOptions(onLoaded) {
      let that = this;
      wafIPGroupOptionsApi()
        .then((res) => {
          if (res.code === 0) {
            that.group_options = res.data ?? [];
          }
          if (onLoaded) {
            onLoaded();
          }
        })
        .catch((e: Error) => { console.log(e); });
    },
    // 列表里IP组任务显示「组名(条目数)」；组已被删时退回显示短码
    groupLabelOfTask(row) {
      const code = this.extractGroupCode(row.batch_extra_config);
      if (!code) {
        return '-';
      }
      const g = (this.group_options || []).find((x) => x.group_code === code);
      return g ? `${g.group_name} (${g.item_count})` : code;
    },
    // 从额外配置JSON里取出 group_code，配置非法时当作未配置
    extractGroupCode(extraConfig) {
      if (!extraConfig) {
        return '';
      }
      try {
        return JSON.parse(extraConfig).group_code || '';
      } catch (e) {
        return '';
      }
    },
    handleJumpIPGroup() {
      this.$router.push({ name: 'WafIpGroup' });
    },
    // 就地新建IP组：跳去IP组页面再跳回来会丢掉正在填的任务表单，所以直接在这里建
    handleQuickAddGroup(target) {
      this.quickAddTarget = target;
      this.quickAddData = { group_name: '', remarks: '' };
      this.quickAddVisible = true;
    },
    onSubmitQuickAdd({ firstError }) {
      if (firstError) {
        return;
      }
      let that = this;
      wafIPGroupAddApi({ ...this.quickAddData })
        .then((res) => {
          if (res.code !== 0) {
            that.$message.warning(res.msg);
            return;
          }
          that.$message.success('添加成功');
          that.quickAddVisible = false;
          // 刷新下拉后自动选中刚建的组，省掉用户再去下拉里找一遍
          const newCode = res.data?.group_code;
          that.loadGroupOptions(() => {
            if (!newCode) {
              return;
            }
            if (that.quickAddTarget === 'edit') {
              that.formEditData.ip_group_code = newCode;
            } else {
              that.formData.ip_group_code = newCode;
            }
          });
        });
    },
    // 当任务类型改变时，自动填充默认配置
    onBatchTypeChange(value) {
      const config = this.batchTypeConfigs[value];
      if (config) {
        this.formData.batch_extra_config = JSON.stringify(config.template, null, 2);
      }
    },

    onBatchTypeChangeEdit(value) {
      const config = this.batchTypeConfigs[value];
      if (config) {
        this.formEditData.batch_extra_config = JSON.stringify(config.template, null, 2);
      }
    },

    // 获取当前选中类型的配置说明
    getCurrentConfigDescription(formType = 'add') {
      const currentType = formType === 'add' ? this.formData.batch_type : this.formEditData.batch_type;
      const config = this.batchTypeConfigs[currentType];
      return config ? config.description : '';
    },
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
                if(host_options.length>0){
                 this.default_host_code = host_options[0].value;
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
      batchTaskListApi({
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
    handleAdd() {
      this.addFormVisible = true;
      this.formData = {
        ...INITIAL_DATA
      };
      this.formData.batch_host_code = this.default_host_code
    },
    // 把表单内部的 ip_group_code 落成后端认识的 batch_extra_config.group_code，
    // 并去掉只在前端存在的字段；IP组任务不绑定网站，顺手把网站清空避免误导。
    buildSubmitData(form) {
      const payload = { ...form };
      if (payload.batch_type === 'ipgroup') {
        payload.batch_extra_config = JSON.stringify({ group_code: payload.ip_group_code || '' });
        payload.batch_host_code = '';
      }
      delete payload.ip_group_code;
      return payload;
    },
    onSubmit({
               result,
               firstError
             }): void {
      let that = this;
      if (!firstError) {
        batchTaskAddApi(this.buildSubmitData(this.formData))
          .then((res) => {
            if (res.code === 0) {
              that.getList('');
              that.$message.success('添加成功');
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
        ...row,
        // 回填目标IP组：库里存的是 batch_extra_config 里的 group_code
        ip_group_code: this.extractGroupCode(row.batch_extra_config),
      };
      this.editFormVisible = true;
    },
    onSubmitEdit({
                   result,
                   firstError
                 }): void {
      let that = this;
      if (!firstError) {
        batchTaskEditApi(this.buildSubmitData(this.formEditData))
          .then((res) => {
            if (res.code === 0) {
              that.getList('');
              that.$message.success('编辑成功');
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
      batchTaskDelApi({
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
    /**
     * 手工触发
     * @param slotProps
     */
    handleClickManual(slotProps) {
      console.log("slotProps",slotProps)
      const {
        id
      } = slotProps.row;
      let that = this;
      const confirmDialog = that.$dialog.confirm({
      body: this.$t('page.batchtask.label_confirm_message'),
      confirmBtn: this.$t('common.confirm'),
      cancelBtn: this.$t('common.cancel'),
      theme: 'warning',
      onConfirm: () => {
          batchTaskManualApi({
          id: id
        })
          .then((res) => {
            if (res.code === 0) {
              that.$message.success('执行成功');

            }
          });
          // 请求成功后，销毁弹框
          confirmDialog.destroy();
      },
      onCancel: () => {
        console.log('操作取消');
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
</style>
