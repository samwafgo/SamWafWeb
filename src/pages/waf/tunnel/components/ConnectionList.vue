<template>
  <div>
    <t-card class="list-card-container">
      <div class="right-operation-container">
          <t-form :label-width="300" layout="inline" colon
            :style="{ marginBottom: '8px' }">
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getConnectionData()">
                {{ $t('common.refresh') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
                 :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
                 @page-change="rehandlePageChange" @change="rehandleChange" @select-change="rehandleSelectChange"
                 @filter-change="onFilterChange"
                 :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">
        </t-table>
      </div>
    </t-card>

    <t-tabs v-model="activeTab">
      <t-tab-panel v-for="(portInfo, index) in portInfoList" :key="index" :value="portInfo.port.toString()" :label="`${$t('page.tunnel.port')} ${portInfo.port}`">
        <t-card>
          <template #header>
            <div class="port-info-header">
              <span>{{ $t('page.tunnel.tcp_source_count') }}: {{ portInfo.tcp_source_count }}</span>
              <span>{{ $t('page.tunnel.tcp_target_count') }}: {{ portInfo.tcp_target_count }}</span>
              <span v-if="portInfo.udp_source_count > 0">{{ $t('page.tunnel.udp_source_count') }}: {{ portInfo.udp_source_count }}</span>
              <span v-if="portInfo.udp_target_count > 0">{{ $t('page.tunnel.udp_target_count') }}: {{ portInfo.udp_target_count }}</span>
            </div>
          </template>

          <t-table :data="portInfo.tcp_source_ips" :columns="ipColumns" :pagination="{ pageSize: 10 }" :loading="dataLoading">
            <template #ip="{ row }">
              <span>{{ row.ip }}</span>
            </template>
            <template #region="{ row }">
              <span>{{ row.region }}</span>
            </template>
          </t-table>
        </t-card>
      </t-tab-panel>
    </t-tabs>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { prefix } from '@/config/global';
import { wafTunnelConnectionApi } from '@/apis/tunnel';

export default Vue.extend({
  name: 'ConnectionList',
  props: {
    tunnelCode: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      prefix,
      dataLoading: false,
      data: [], // 列表数据信息
      tunnelInfo: {}, // 隧道基本信息
      portInfoList: [], // 端口信息列表
      activeTab: '', // 当前激活的标签页
      selectedRowKeys: [],
      columns: [
        {
          title: this.$t('page.tunnel.port'),
          align: 'left',
          width: 100,
          ellipsis: true,
          colKey: 'port',
        },
        {
          title: this.$t('page.tunnel.tcp_source_count'),
          width: 150,
          ellipsis: true,
          colKey: 'tcp_source_count',
        },
        {
          title: this.$t('page.tunnel.tcp_target_count'),
          width: 150,
          ellipsis: true,
          colKey: 'tcp_target_count',
        },
        {
          title: this.$t('page.tunnel.udp_source_count'),
          width: 150,
          ellipsis: true,
          colKey: 'udp_source_count',
        },
        {
          title: this.$t('page.tunnel.udp_target_count'),
          width: 150,
          ellipsis: true,
          colKey: 'udp_target_count',
        }
      ],
      ipColumns: [
        {
          title: this.$t('page.tunnel.ip_address'),
          align: 'left',
          width: 200,
          ellipsis: true,
          colKey: 'ip',
          filter: {
            type: 'input',
            resetValue: '',
            confirmEvents: ['onEnter'],
            props: {
              placeholder: this.$t('common.placeholder'),
            },
            showConfirmAndReset: true,
          },
        },
        {
          title: this.$t('page.tunnel.region'),
          width: 200,
          ellipsis: true,
          colKey: 'region',
        }
      ],
      rowKey: 'port',
      tableLayout: 'auto',
      verticalAlign: 'top',
      hover: true,
      rowClassName: (rowKey: string) => `${rowKey}-class`,
      pagination: {
        total: 0,
        current: 1,
        pageSize: 10
      },
      searchformData: {}
    };
  },
  computed: {
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    },
  },
  watch: {
    tunnelCode: {
      handler(val) {
        if (val) {
          this.getConnectionData();
        }
      },
      immediate: true
    }
  },
  mounted() {
    if (this.tunnelCode) {
      this.getConnectionData();
    }
  },
  methods: {
    getConnectionData() {
      this.dataLoading = true;
      wafTunnelConnectionApi({
        id: this.tunnelCode
      })
        .then((res) => {
          if (res.code === 0) {
            this.tunnelInfo = res.data.tunnel_info || {};
            this.portInfoList = res.data.port_info || [];

            // 设置默认激活的标签页
            if (this.portInfoList.length > 0 && !this.activeTab) {
              this.activeTab = this.portInfoList[0].port.toString();
            }

            // 转换数据格式用于表格显示
            this.data = this.portInfoList.map(item => ({
              port: item.port,
              tcp_source_count: item.tcp_source_count,
              tcp_target_count: item.tcp_target_count,
              udp_source_count: item.udp_source_count,
              udp_target_count: item.udp_target_count
            }));
          } else {
            this.$message.error(res.msg || '获取连接数据失败');
          }
        })
        .catch((e) => {
          console.error(e);
          this.$message.error('获取连接数据失败');
        })
        .finally(() => {
          this.dataLoading = false;
        });
    },
    getContainer() {
      return document.querySelector('.tdesign-starter-layout');
    },
    rehandlePageChange(curr, pageInfo) {
      this.pagination.current = curr.current;
      if (this.pagination.pageSize != curr.pageSize) {
        this.pagination.current = 1;
        this.pagination.pageSize = curr.pageSize;
      }
    },
    rehandleSelectChange(selectedRowKeys) {
      this.selectedRowKeys = selectedRowKeys;
    },
    rehandleChange(changeParams, triggerAndData) {
      console.log('统一Change', changeParams, triggerAndData);
    },
    onFilterChange(e) {
      if (e.ip && this.activeTab) {
        const activePortInfo = this.portInfoList.find(item => item.port.toString() === this.activeTab);
        if (activePortInfo) {
          activePortInfo.tcp_source_ips = activePortInfo.tcp_source_ips.filter(item => item.ip.includes(e.ip));
        }
      } else {
        this.getConnectionData();
      }
    },
    refresh() {
      this.getConnectionData();
    }
  },
});
</script>

<style lang="less" scoped>
.port-info-header {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;

  span {
    font-weight: bold;
  }
}

.t-tabs {
  margin-top: 20px;
}
</style>
