<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="end" align="middle" :style="{ marginBottom: '12px' }">
        <div class="right-operation-container">
          <t-input
            v-model="keyword"
            class="config-search-input"
            :placeholder="$t('page.systemconfig.search_placeholder')"
            clearable
          >
            <template #prefix-icon>
              <search-icon />
            </template>
          </t-input>
        </div>
      </t-row>

      <t-loading :loading="dataLoading" size="small">
        <div class="config-layout">
          <!-- 左侧：分组导航 -->
          <div class="config-sidebar">
            <div
              class="config-cate"
              :class="{ active: selectedGroup === '__all__' }"
              @click="selectedGroup = '__all__'"
            >
              <span class="config-cate-title">{{ $t('common.all') }}</span>
              <t-tag size="small" variant="light" theme="default">{{ filteredData.length }}</t-tag>
            </div>
            <div
              v-for="cate in categories"
              :key="cate.key"
              class="config-cate"
              :class="{ active: selectedGroup === cate.key }"
              @click="selectedGroup = cate.key"
            >
              <span class="config-cate-title" :title="cate.title">{{ cate.title }}</span>
              <t-tag
                size="small"
                variant="light"
                :theme="selectedGroup === cate.key ? 'primary' : 'default'"
                >{{ cate.count }}</t-tag
              >
            </div>
          </div>

          <!-- 右侧：配置项明细 -->
          <div class="config-detail">
            <div v-if="rightItems.length === 0" class="config-empty">
              {{ $t('page.systemconfig.empty_result') }}
            </div>
            <div v-for="row in rightItems" :key="row.id" class="config-row">
              <div class="config-row-main">
                <div class="config-item-title">
                  {{ row.remarks || row.item }}
                  <t-tag
                    v-if="selectedGroup === '__all__' && row.item_class"
                    size="small"
                    variant="outline"
                    class="config-item-cate-tag"
                    >{{ cateTitle(row.item_class) }}</t-tag
                  >
                </div>
                <div class="config-item-ops">
                  <a class="t-button-link" @click="handleClickEditRow(row)">{{ $t('common.edit') }}</a>
                </div>
              </div>
              <div v-if="row.remarks" class="config-item-key" :title="row.item">{{ row.item }}</div>
              <!-- 密钥类配置后端不回显原文，只按 has_value 显示是否已配置 -->
              <div v-if="row.is_sensitive" class="config-item-value">
                <t-tag v-if="row.has_value" theme="success" variant="light" size="small">
                  {{ $t('page.systemconfig.secret_configured') }}
                </t-tag>
                <t-tag v-else theme="default" variant="light" size="small">
                  {{ $t('page.systemconfig.secret_empty') }}
                </t-tag>
              </div>
              <div v-else class="config-item-value">{{ row.value }}</div>
            </div>
          </div>
        </div>
      </t-loading>

      <div>
        <router-view></router-view>
      </div>
    </t-card>

    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="form" :rules="rules" @submit="onSubmitEdit" :labelWidth="150">
          <t-form-item :label="$t('page.systemconfig.label_configuration_item')" name="item">
            <t-input :style="{ width: '480px' }" v-model="formEditData.item" readonly></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.systemconfig.label_configuration_value')" name="value">
            <!-- 密钥类：不回显原文，密码框输入新值；留空=保持原值；清空需显式点按钮 -->
            <div v-if="formEditData.is_sensitive" :style="{ width: '480px' }">
              <t-input
                v-model="formEditData.value"
                type="password"
                autocomplete="new-password"
                :disabled="secretCleared"
                :placeholder="
                  secretCleared
                    ? $t('page.systemconfig.secret_will_clear')
                    : formEditData.has_value
                    ? $t('page.systemconfig.secret_set_placeholder')
                    : $t('page.systemconfig.secret_empty_placeholder')
                "
              ></t-input>
              <div class="config-secret-ops">
                <span class="config-secret-tip">{{ $t('page.systemconfig.secret_tip') }}</span>
                <a v-if="formEditData.has_value && !secretCleared" class="t-button-link" @click="onClickClearSecret">
                  {{ $t('page.systemconfig.secret_clear') }}
                </a>
                <a v-if="secretCleared" class="t-button-link" @click="onClickCancelClearSecret">
                  {{ $t('page.systemconfig.secret_cancel_clear') }}
                </a>
              </div>
            </div>
            <t-textarea
              v-else
              :style="{ width: '480px' }"
              :autosize="{ minRows: 1, maxRows: 12 }"
              v-model="formEditData.value"
            ></t-textarea>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formEditData.remarks" name="remarks">
            </t-textarea>
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
import { SearchIcon } from 'tdesign-icons-vue';
import { prefix } from '@/config/global';
import {
  system_config_list_api,
  get_detail_by_id_api,
  edit_system_config_api,
} from '@/apis/systemconfig';

// 与后端 waf_service.ConfigClearSentinel 约定：密钥类配置留空=保持原值，
// 需要清空必须显式提交这个哨兵值。
const SECRET_CLEAR_SENTINEL = '__SAMWAF_CLEAR__';

const INITIAL_DATA = {
  item_class: 'system',
  item: '',
  value: '',
  item_type: 'string',
  options: '',
  remarks: '',
  is_sensitive: false,
  has_value: false,
};

export default Vue.extend({
  name: 'ListBase',
  components: {
    SearchIcon,
  },
  data() {
    return {
      editFormVisible: false,
      formEditData: { ...INITIAL_DATA },
      secretCleared: false, // 密钥类配置：本次编辑是否点了"清空"
      rules: {},
      prefix,
      dataLoading: false,
      allData: [], // 全量配置数据（一次拉取，前端分组+过滤）
      detail_data: [],
      keyword: '', // 实时搜索关键字
      selectedGroup: '__all__', // 左侧选中的分组，默认全部
    };
  },
  computed: {
    // 关键字过滤后的数据（作用于全量）
    filteredData() {
      const kw = (this.keyword || '').trim().toLowerCase();
      if (!kw) return this.allData;
      return this.allData.filter((row) => (
        String(row.item || '').toLowerCase().includes(kw) ||
        String(row.value || '').toLowerCase().includes(kw) ||
        String(row.remarks || '').toLowerCase().includes(kw)
      ));
    },
    // 左侧分组列表（含每组数量，随搜索联动）
    categories() {
      const map = {};
      const order = [];
      this.filteredData.forEach((row) => {
        const cls = row.item_class || '__uncategorized__';
        if (map[cls] === undefined) {
          map[cls] = 0;
          order.push(cls);
        }
        map[cls] += 1;
      });
      return order.map((cls) => ({
        key: cls,
        title: this.cateTitle(cls),
        count: map[cls],
      }));
    },
    // 右侧展示的配置项：全部 或 选中分组
    rightItems() {
      if (this.selectedGroup === '__all__') return this.filteredData;
      return this.filteredData.filter(
        (row) => (row.item_class || '__uncategorized__') === this.selectedGroup,
      );
    },
  },
  watch: {
    // 搜索或数据变化后，若选中分组已无数据则回退到“全部”
    categories(list) {
      if (
        this.selectedGroup !== '__all__' &&
        !list.some((c) => c.key === this.selectedGroup)
      ) {
        this.selectedGroup = '__all__';
      }
    },
  },
  mounted() {
    this.getList();
  },
  methods: {
    // 分组 key 转多语言名称，缺失时回退原始值
    cateTitle(cls) {
      if (!cls || cls === '__uncategorized__') {
        return this.$t('page.systemconfig.category_uncategorized');
      }
      const key = `page.systemconfig.category.${cls}`;
      return this.$te(key) ? this.$t(key) : cls;
    },
    getList() {
      this.dataLoading = true;
      system_config_list_api({
        pageSize: 1000,
        pageIndex: 1,
      })
        .then((res) => {
          const resdata = res;
          if (resdata.code === 0) {
            this.allData = resdata.data.list ?? [];
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
          this.dataLoading = false;
        });
    },
    handleClickEditRow(row) {
      this.secretCleared = false;
      this.editFormVisible = true;
      this.getDetail(row.id);
    },
    onClickClearSecret(): void {
      this.secretCleared = true;
      this.formEditData.value = '';
    },
    onClickCancelClearSecret(): void {
      this.secretCleared = false;
      this.formEditData.value = '';
    },
    onSubmitEdit({ firstError }): void {
      if (!firstError) {
        const postdata = { ...this.formEditData };
        // 密钥类三态：点了"清空"发哨兵值；留空=后端保持原值；填了新值=更新
        if (postdata.is_sensitive && this.secretCleared) {
          postdata.value = SECRET_CLEAR_SENTINEL;
        }
        edit_system_config_api({ ...postdata })
          .then((res) => {
            const resdata = res;
            if (resdata.code === 0) {
              this.$message.success(resdata.msg);
              this.editFormVisible = false;
              this.getList();
            } else {
              this.$message.warning(resdata.msg);
            }
          })
          .catch((e: Error) => {
            console.log(e);
          });
      } else {
        this.$message.warning(firstError);
      }
    },
    onClickCloseEditBtn(): void {
      this.editFormVisible = false;
      this.secretCleared = false;
      this.formEditData = { ...INITIAL_DATA };
    },
    getDetail(id) {
      get_detail_by_id_api({ id })
        .then((res) => {
          const resdata = res;
          if (resdata.code === 0) {
            this.detail_data = resdata.data;
            this.formEditData = { ...this.detail_data };
            // 密钥类：后端返回的 value 已是空串，这里再显式清一次，
            // 确保输入框永远从空开始（避免任何残留被当成新值提交）
            if (this.formEditData.is_sensitive) {
              this.formEditData.value = '';
            }
          }
        })
        .catch((e: Error) => {
          console.log(e);
        });
    },
  },
});
</script>

<style lang="less" scoped>
  @import '@/style/variables';

  .right-operation-container {
    display: flex;
    align-items: center;
  }

  .config-search-input {
    width: 360px;
  }

  /* 左右布局 */
  .config-layout {
    display: flex;
    align-items: stretch;
    gap: 16px;
    min-height: 420px;
  }

  .config-sidebar {
    flex: 0 0 200px;
    width: 200px;
    padding: 8px;
    border: 1px solid var(--td-component-stroke);
    border-radius: var(--td-radius-medium);
    background: var(--td-bg-color-container);
    max-height: calc(100vh - 220px);
    overflow-y: auto;
  }

  .config-cate {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    margin-bottom: 4px;
    border-radius: var(--td-radius-default);
    cursor: pointer;
    color: var(--td-text-color-primary);
    transition: background 0.2s;

    &:hover {
      background: var(--td-bg-color-container-hover);
    }

    &.active {
      background: var(--td-brand-color-light);
      color: var(--td-brand-color);
      font-weight: 600;
    }
  }

  .config-cate-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .config-detail {
    flex: 1;
    min-width: 0;
    padding: 4px 8px;
    max-height: calc(100vh - 220px);
    overflow-y: auto;
  }

  .config-empty {
    padding: 48px 0;
    text-align: center;
    color: var(--td-text-color-placeholder);
  }

  .config-row {
    padding: 10px 4px;
    border-bottom: 1px solid var(--td-component-stroke);

    &:last-child {
      border-bottom: none;
    }
  }

  .config-row-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .config-item-title {
    font-weight: 600;
    font-size: 14px;
    color: var(--td-text-color-primary);
    word-break: break-all;
  }

  .config-item-key {
    margin-top: 2px;
    font-family: var(--td-font-family-medium, monospace);
    font-size: 12px;
    color: var(--td-text-color-placeholder);
    word-break: break-all;
  }

  .config-item-cate-tag {
    margin-left: 8px;
    font-weight: 400;
  }

  .config-item-ops {
    flex-shrink: 0;
    white-space: nowrap;
  }

  .config-item-value {
    margin-top: 4px;
    padding: 6px 8px;
    background: var(--td-bg-color-container-hover);
    border-radius: var(--td-radius-small);
    font-family: var(--td-font-family-medium, monospace);
    font-size: 13px;
    color: var(--td-text-color-secondary);
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
    overflow: auto;
  }
</style>

<style lang="less">
.config-secret-ops {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
}

.config-secret-tip {
  flex: 1;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  line-height: 1.5;
}
</style>
