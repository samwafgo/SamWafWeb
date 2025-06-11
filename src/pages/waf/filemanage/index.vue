<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="300" layout="inline" colon :style="{ marginBottom: '8px' }">
         
            <t-form-item>
              <t-button @click="getList('refresh')" theme="primary"> {{ $t('common.refresh') }} </t-button>
              <t-button theme="default" :style="{ marginLeft: '8px' }" @click="handleReset">
                {{ $t('common.reset') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      
      <t-alert theme="info" :message="$t('page.filemanage.alert_message')" close>
      </t-alert>
      
      <div class="table-container">
        <t-table 
          :columns="columns" 
          :data="filteredAndSortedData" 
          :rowKey="rowKey" 
          :verticalAlign="verticalAlign" 
          :hover="hover"
          :selected-row-keys="selectedRowKeys" 
          :loading="dataLoading"
          @page-change="rehandlePageChange"
          @sort-change="handleSortChange"
          @filter-change="handleFilterChange"
          :sort="sortInfo" 
          :pagination="pagination">

          <template #name="{ row }">
            <t-icon v-if="row.is_dir" name="folder" style="margin-right: 8px;"></t-icon>
            <t-icon v-else name="file" style="margin-right: 8px;"></t-icon>
            <span>{{ row.name }}</span>
          </template>

          <template #size="{ row }">
            <span v-if="!row.is_dir">{{ row.size }}</span>
            <span v-else>-</span>
          </template>

          <template #can_delete="{ row }">
            <t-tag v-if="row.can_delete" theme="success">{{ $t('page.filemanage.can_delete') }}</t-tag>
            <t-tag v-else theme="danger">{{ $t('page.filemanage.cannot_delete') }}</t-tag>
          </template>

          <template #op="slotProps">
            <a v-if="slotProps.row.can_delete" class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
            <span v-else class="t-button-link disabled">{{ $t('common.delete') }}</span>
          </template>
        </t-table>
      </div>
    </t-card>

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
import {
  prefix
} from '@/config/global';
import {
  fileManageListApi, fileManageDelApi
} from '@/apis/filemanage';

export default Vue.extend({
  name: 'FileManageList',
  components: {
    SearchIcon,
  },
  data() {
    return {
      confirmVisible: false,
      dataLoading: false,
      data: [], // 原始列表数据
      originalData: [], // 备份原始数据用于搜索和排序
      selectedRowKeys: [],
      searchformData: {
        name: '',
      },
      // 排序状态 - 默认按文件大小倒序
      sortInfo: {
        sortBy: 'size_bytes',
        descending: true
      },
      // 过滤状态
      filterValue: {},
      columns: [
        {
          align: 'left',
          width: 100,
          colKey: 'op',
          title: this.$t('common.op'),
        },
        {
          title: this.$t('page.filemanage.label_name'),
          align: 'left',
          width: 300,
          ellipsis: true,
          colKey: 'name',
          sortable: true,
          filter: {
            type: 'input',
            resetValue: '',
            props: {
              placeholder: this.$t('page.filemanage.filter_name_placeholder')
            }
          }
        },
        {
          title: this.$t('page.filemanage.label_path'),
          align: 'left',
          width: 400,
          ellipsis: true,
          colKey: 'path',
          sortable: true,
          filter: {
            type: 'input',
            resetValue: '',
            props: {
              placeholder: this.$t('page.filemanage.filter_path_placeholder')
            }
          }
        },
        {
          title: this.$t('page.filemanage.label_size'),
          width: 120,
          ellipsis: true,
          colKey: 'size',
          sortable: true,
        },
        {
          title: this.$t('page.filemanage.label_size_bytes'),
          width: 150,
          ellipsis: true,
          colKey: 'size_bytes',
          sortable: true,
          sorter: (a, b) => {
            const aNum = parseInt(a.size_bytes) || 0;
            const bNum = parseInt(b.size_bytes) || 0;
            return aNum - bNum;
          }
        },
        {
          title: this.$t('page.filemanage.label_description'),
          align: 'left',
          width: 300,
          ellipsis: true,
          colKey: 'description',
          sortable: true,
          filter: {
            type: 'input',
            resetValue: '',
            props: {
              placeholder: this.$t('page.filemanage.filter_description_placeholder')
            }
          }
        },
        {
          title: this.$t('page.filemanage.label_can_delete'),
          width: 120,
          ellipsis: true,
          colKey: 'can_delete',
          filter: {
            type: 'single',
            list: [
              { label: this.$t('page.filemanage.can_delete'), value: true },
              { label: this.$t('page.filemanage.cannot_delete'), value: false }
            ],
            resetValue: ''
          }
        },
        {
          title: this.$t('page.filemanage.label_mod_time'),
          width: 180,
          ellipsis: true,
          colKey: 'mod_time',
          sortable: true,
        },
       
      ],
      rowKey: 'path',
      verticalAlign: 'top',
      hover: true,
      pagination: {
        total: 0,
        current: 1,
        pageSize: 20
      },
      deleteId: '', // 改为存储ID字符串而不是索引
    };
  },
  computed: {
    confirmBody() {
      if (this.deleteId) {
        // 根据ID查找对应的文件信息
        const fileItem = this.originalData.find(item => item.id === this.deleteId);
        if (fileItem) {
          return '【'+fileItem.path +'】';
        }
      }
      return '';
    },
    // 计算过滤和排序后的数据
    filteredAndSortedData() {
      let result = [...this.originalData];
       
      
      // 应用表头过滤
      Object.keys(this.filterValue).forEach(key => {
        const filterVal = this.filterValue[key];
        if (filterVal !== undefined && filterVal !== '' && filterVal !== null) {
          if (key === 'can_delete') {
            result = result.filter(item => item[key] === filterVal);
          } else if (typeof filterVal === 'string') {
            const filterTerm = filterVal.toLowerCase();
            result = result.filter(item => 
              item[key] && item[key].toString().toLowerCase().includes(filterTerm)
            );
          }
        }
      });
      
      // 应用排序
      if (this.sortInfo.sortBy) {
        result.sort((a, b) => {
          const aVal = a[this.sortInfo.sortBy];
          const bVal = b[this.sortInfo.sortBy];
          
          // 处理数字类型排序
          if (this.sortInfo.sortBy === 'size_bytes') {
            const aNum = parseInt(aVal) || 0;
            const bNum = parseInt(bVal) || 0;
            return this.sortInfo.descending ? bNum - aNum : aNum - bNum;
          }
          
          // 处理日期类型排序
          if (this.sortInfo.sortBy === 'mod_time') {
            const aDate = new Date(aVal).getTime() || 0;
            const bDate = new Date(bVal).getTime() || 0;
            return this.sortInfo.descending ? bDate - aDate : aDate - bDate;
          }
          
          // 处理字符串类型排序
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            const comparison = aVal.localeCompare(bVal);
            return this.sortInfo.descending ? -comparison : comparison;
          }
          
          // 处理其他类型
          if (aVal < bVal) return this.sortInfo.descending ? 1 : -1;
          if (aVal > bVal) return this.sortInfo.descending ? -1 : 1;
          return 0;
        });
      }
      
      // 更新分页总数
      //this.pagination.total = result.length;
      
      // 应用分页
      const start = (this.pagination.current - 1) * this.pagination.pageSize;
      const end = start + this.pagination.pageSize;
      return result.slice(start, end);
    }
  },
  mounted() {
    this.getList('all');
  },
  methods: {
    async getList(type) {
      this.dataLoading = true;
      try {
        const params = {
          is_force:false 
        };
        
        // 如果是刷新操作，添加 is_force 参数
        if (type === 'refresh') {
          params.is_force = true;
        }
        
        const { data } = await fileManageListApi(params);
        console.log("getList", data);
        this.originalData = data.files || [];
        this.pagination.total = data.total;
        this.data = [...this.originalData];
      } catch (e) {
        console.log(e);
      } finally {
        this.dataLoading = false;
      }
    },
    // 处理搜索
    handleSearch() {
      this.pagination.current = 1; // 重置到第一页
    },
    // 重置搜索
    handleReset() {
      this.searchformData.name = '';
      this.filterValue = {};
      this.sortInfo = {
        sortBy: '',
        descending: false
      };
      this.pagination.current = 1;
    },
    // 处理排序变化
    handleSortChange(sortInfo) {
      this.sortInfo = {
        sortBy: sortInfo.sortBy,
        descending: sortInfo.descending
      };
      this.pagination.current = 1; // 重置到第一页
    },
    // 处理过滤变化
    handleFilterChange(filterValue) {
      this.filterValue = filterValue;
      this.pagination.current = 1; // 重置到第一页
    },
    rehandlePageChange(curr) {
      this.pagination.current = curr.current;
      this.pagination.pageSize = curr.pageSize;
    },
    handleClickDelete({ row }) {
      // 直接存储ID字符串
      this.deleteId = row.id;
      this.confirmVisible = true;
      console.log("deleteId", this.deleteId, row);
    },
    onConfirmDelete() {
      if (this.deleteId) {
        console.log("id delete", this.deleteId);
        this.deleteFile(this.deleteId);
        this.confirmVisible = false;
      }
    },
    async deleteFile(id) {
      try {
        await fileManageDelApi({ id });
        this.$message.success(this.$t('page.filemanage.delete_success'));
        this.getList('all');
      } catch (e) {
        console.log(e);
        this.$message.error(this.$t('page.filemanage.delete_failed'));
      }
    },
    onCancel() {
      this.confirmVisible = false;
      this.deleteId = ''; // 清空ID
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

.disabled {
  color: #ccc;
  cursor: not-allowed;
}
</style>