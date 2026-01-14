<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAdd"> {{ $t('page.tunnel.new_tunnel') }} </t-button>
         </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="300" layout="inline" colon
            :style="{ marginBottom: '8px' }">
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <t-alert theme="info" :message="$t('page.tunnel.alert_message')" close>
        <template #operation>
          <span @click="handleJumpOnlineUrl">{{ $t('common.online_document') }}</span>
        </template>
      </t-alert>
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
          @page-change="rehandlePageChange" @change="rehandleChange" @select-change="rehandleSelectChange"
          :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">

          <template #start_status="{ row }">
            <t-tag theme="success" v-if="row.start_status === '1' || row.start_status === 1">
              {{ $t('common.status_runtime_option.running') }}
            </t-tag>
            <t-tag theme="warning" v-else>
              {{ $t('common.status_runtime_option.stopped') }}
            </t-tag>
          </template>
          <template #ip_version="{ row }">
            <t-tag theme="primary" v-if="row.ip_version === 'ipv4'">
              {{ $t('page.tunnel.ip_version_ipv4') }}
            </t-tag>
            <t-tag theme="success" v-else-if="row.ip_version === 'ipv6'">
              {{ $t('page.tunnel.ip_version_ipv6') }}
            </t-tag>
            <t-tag theme="warning" v-else>
              {{ $t('page.tunnel.ip_version_both') }}
            </t-tag>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleClickShowConnections(slotProps)">{{ $t('page.tunnel.view_connections') }}</a> 
            <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
      <div>
        <router-view></router-view>
      </div>
    </t-card>


    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="720" :footer="false">
      <div slot="body">
        <tunnel-form :value="formData" @close="onClickCloseBtn" @submit="onSubmit"></tunnel-form>
      </div>
    </t-dialog>

    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="720" :footer="false">
      <div slot="body">
        <tunnel-form :value="formEditData" :is-edit="true" @close="onClickCloseEditBtn"
          @submit="onSubmitEdit"></tunnel-form>
      </div>
    </t-dialog>

    <t-dialog :header="$t('common.confirm_delete')" :body="confirmBody" :visible.sync="confirmVisible" @confirm="onConfirmDelete"
      :onCancel="onCancel">
    </t-dialog>
    
    <!-- 隧道连接数据对话框 -->
    <t-dialog :header="$t('page.tunnel.show_connections')" :width="900" :visible.sync="connectionsVisible" @confirm="()=>{connectionsVisible=false}"
              :onCancel="()=>{connectionsVisible=false}">
      <connection-list ref="connectionList" :key="selectedTunnelCode" :tunnel-code="selectedTunnelCode"></connection-list>
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
  wafTunnelListApi, wafTunnelDelApi, wafTunnelEditApi, wafTunnelAddApi, wafTunnelDetailApi
} from '@/apis/tunnel.ts';

import {
  INITIAL_DATA
} from './constants';
import TunnelForm from './components/TunnelForm.vue';
import ConnectionList from './components/ConnectionList.vue'; 
import { v4 as uuidv4 } from 'uuid';
export default Vue.extend({
  name: 'TunnelBase',
  components: {
    SearchIcon,
    Trend,
    TunnelForm,
    ConnectionList
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
          message: this.$t('common.placeholder') + this.$t('page.tunnel.name'),
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
        {
          title: this.$t('page.tunnel.name'),
          width: 200,
          ellipsis: true,
          colKey: 'name',
        },  
        {
          title: this.$t('page.tunnel.protocol'),
          width: 100,
          ellipsis: true,
          colKey: 'protocol',
        }, 
        {
          title: this.$t('page.tunnel.port'),
          width: 200,
          ellipsis: true,
          colKey: 'port',
        }, 
        {
          title: this.$t('page.tunnel.start_status'),
          width: 100,
          ellipsis: true,
          colKey: 'start_status',
        },
        {
          title: this.$t('page.tunnel.remote_port'),
          width: 100,
          ellipsis: true,
          colKey: 'remote_port',
        },


        {
          title: this.$t('page.tunnel.remote_ip'),
          width: 100,
          ellipsis: true,
          colKey: 'remote_ip',
        },


        {
          title: this.$t('page.tunnel.allow_ip'),
          width: 200,
          ellipsis: true,
          colKey: 'allow_ip',
        },


        {
          title: this.$t('page.tunnel.deny_ip'),
          width: 200,
          ellipsis: true,
          colKey: 'deny_ip',
        },


        {
          title: this.$t('page.tunnel.allowed_time_ranges'),
          width: 200,
          ellipsis: true,
          colKey: 'allowed_time_ranges',
        },
        {
          title: this.$t('page.tunnel.ip_version'),
          width: 120,
          ellipsis: true,
          colKey: 'ip_version',
        },
        {
          title: this.$t('page.tunnel.conn_timeout'),

          width: 100,
          ellipsis: true,
          colKey: 'conn_timeout',
        }, 


        {
          title: this.$t('page.tunnel.remark'),
          width: 200,
          ellipsis: true,
          colKey: 'remark',
        },

        {
          align: 'left',
          fixed: 'right',
          width: 200,
          colKey: 'op',
          title: this.$t('common.op'),
        },
      ],
      rowKey: 'code',
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

      },
      //索引区域
      deleteIdx: -1,
      guardStatusIdx: -1,
      //主机字典
      host_dic: {},
      // 连接数据对话框
      connectionsVisible: false,
      selectedTunnelCode: '',
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
    handleShowConnections() {
      // 如果没有选中隧道，显示提示
      if (this.selectedRowKeys.length === 0) {
        this.$message.warning('请先选择一个隧道');
        return;
      }
      
      // 获取选中的隧道代码
      const selectedIndex = this.selectedRowKeys[0];
      const selectedTunnel = this.data.find(item => item.id === selectedIndex);
      
      if (selectedTunnel) {
        this.selectedTunnelCode = selectedTunnel.code;
        this.connectionsVisible = true;
      }
    },
    
    handleClickShowConnections(slotProps) {
      const { code } = slotProps.row;
      this.selectedTunnelCode = code;
      console.log("handleClickShowConnections",slotProps.row,this.selectedTunnelCode);
      this.connectionsVisible = true;
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
      wafTunnelListApi({
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
      this.formData.code = uuidv4()
      this.formData = { ...INITIAL_DATA };
    },
    onSubmit(data): void {
      let that = this
      console.log('onSubmit', data)
      wafTunnelAddApi({ ...data.result })
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
    },
    onSubmitEdit(data): void {
      let that = this
      console.log('onSubmitEdit', data) 
      wafTunnelEditApi({ ...data.result })
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
    onConfirmDelete() {
      this.confirmVisible = false;
      console.log('delete', this.data)
      console.log('delete', this.data[this.deleteIdx])
      let {
        id
      } = this.data[this.deleteIdx]
      let that = this
      wafTunnelDelApi({
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
      wafTunnelDetailApi({
        id: id
      })
        .then((res) => {
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {
            that.detail_data = resdata.data;
            that.detail_data.remote_port = that.detail_data.remote_port.toString()
            that.detail_data.start_status = that.detail_data.start_status.toString()
            that.detail_data.conn_timeout = that.detail_data.conn_timeout.toString()
            that.detail_data.read_timeout = that.detail_data.read_timeout.toString()
            that.detail_data.write_timeout = that.detail_data.write_timeout.toString()
            that.detail_data.max_in_connect = that.detail_data.max_in_connect.toString()
            that.detail_data.max_out_connect = that.detail_data.max_out_connect.toString()
            // 处理 allowed_time_ranges 字段，确保不是 null 或 undefined
            that.detail_data.allowed_time_ranges = that.detail_data.allowed_time_ranges || ''
            // 处理 ip_version 字段，确保不是 null 或 undefined，默认为 both
            that.detail_data.ip_version = that.detail_data.ip_version || 'both'





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
      window.open(this.samwafglobalconfig.getOnlineUrl() + "/guide/Tunnel.html");
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
