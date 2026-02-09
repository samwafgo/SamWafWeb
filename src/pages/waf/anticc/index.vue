<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAddAntiCC"> {{ $t('page.cc.new_cc_protection') }} </t-button>
          <t-button theme="success" @click="handleShowCCBanIPList"> {{ $t('page.cc.show_cc_ban_ip') }} </t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="150" layout="inline" colon
            :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.cc.website')" name="host_code">
              <t-select v-model="searchformData.host_code" clearable filterable :style="{ width: '250' }">
                <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                  {{ item }}
                </t-option>
              </t-select>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')"> {{ $t('common.search')
                }} </t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <t-alert theme="info" :message="$t('page.cc.samwaf_cc_protection')" close>
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

          <template #limit_mode="{ row }">
            <t-tag theme="primary" v-if="row.limit_mode === 'rate'">{{ $t('page.cc.limit_mode_rate') }}</t-tag>
            <t-tag theme="warning" v-else-if="row.limit_mode === 'window'">{{ $t('page.cc.limit_mode_window') }}</t-tag>
            <t-tag v-else>{{ $t('page.cc.limit_mode_unknown') }}</t-tag>
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

    <!-- New CC Protect Dialog -->
    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="700" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="150">
          <t-form-item :label="$t('page.cc.website')" name="host_code">
            <t-select v-model="formData.host_code" clearable filterable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.cc.rate')" name="rate">
            <t-input-number :style="{ width: '480px' }" v-model="formData.rate"
              :placeholder="$t('common.placeholder') + $t('page.cc.rate')"></t-input-number>
          </t-form-item>
          <t-form-item :label="$t('page.cc.limit')" name="limit">
            <t-input-number :style="{ width: '480px' }" v-model="formData.limit"
              :placeholder="$t('common.placeholder') + $t('page.cc.limit')"></t-input-number>
          </t-form-item>

          <t-form-item :label="$t('page.cc.limit_mode')" name="limit_mode">
            <t-radio-group v-model="formData.limit_mode">
              <t-radio value="rate">
                <div>
                  <div>{{ $t('page.cc.limit_mode_rate') }}</div>
                  <div class="limit-mode-desc">{{ $t('page.cc.limit_mode_rate_desc') }}</div>
                </div>
              </t-radio>
              <t-radio value="window">
                <div>
                  <div>{{ $t('page.cc.limit_mode_window') }}</div>
                  <div class="limit-mode-desc">{{ $t('page.cc.limit_mode_window_desc') }}</div>
                </div>
              </t-radio>
            </t-radio-group>
          </t-form-item>

          <!-- 添加效果提示 -->
          <t-form-item>
            <t-alert theme="info" :message="getLimitModeEffectTips(formData)" />
          </t-form-item>

          <!-- 新增：启用前置规则 -->
          <t-form-item :label="$t('page.cc.enable_rule')" name="is_enable_rule">
            <t-switch v-model="formData.is_enable_rule"></t-switch>
          </t-form-item>

          <!-- 新增：规则内容（启用时显示） -->
          <t-form-item v-if="formData.is_enable_rule" :label="$t('page.cc.rule_content')" name="rule_content">
            <t-textarea :style="{ width: '480px' }" v-model="formData.rule_content" :rows="10"
              :placeholder="$t('page.cc.rule_content_placeholder')">
            </t-textarea>
            <div class="limit-mode-desc">{{ $t('page.cc.rule_content_desc') }}</div>
            <t-button size="small" theme="warning" @click="openRuleGenerator">{{ $t('common.generate_rule') }}</t-button>

            <t-dialog :visible.sync="showRuleBuilderDialog" :header="$t('common.generate_rule')" width="900px" :destroyOnClose="true"
              :footer="false">
              <RuleBuilder :hostCode="formData.host_code" @confirm="onRuleBuilderConfirm"
                @cancel="showRuleBuilderDialog = false" />
            </t-dialog>
          </t-form-item>

          <t-form-item :label="$t('page.cc.lock_minutes')" name="lock_ip_minutes">
            <t-input-number :style="{ width: '480px' }" min="1" v-model="formData.lock_ip_minutes"
              :placeholder="$t('common.placeholder') + $t('page.cc.lock_minutes')"></t-input-number>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formData.remarks"
              :placeholder="$t('common.placeholder_content')" name="remarks">
            </t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- Edit CC Protect Dialog -->
    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="700" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="form" :rules="rules" @submit="onSubmitEdit" :labelWidth="150">
          <t-form-item :label="$t('page.cc.website')" name="host_code">
            <t-select v-model="formEditData.host_code" clearable filterable :style="{ width: '480px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.cc.rate')" name="rate">
            <t-input-number :style="{ width: '480px' }" v-model="formEditData.rate"
              :placeholder="$t('common.placeholder') + $t('page.cc.rate')"></t-input-number>
          </t-form-item>
          <t-form-item :label="$t('page.cc.limit')" name="limit">
            <t-input-number :style="{ width: '480px' }" v-model="formEditData.limit"
              :placeholder="$t('common.placeholder') + $t('page.cc.limit')"></t-input-number>
          </t-form-item>

          <t-form-item :label="$t('page.cc.limit_mode')" name="limit_mode">
            <t-radio-group v-model="formEditData.limit_mode">
              <t-radio value="rate">
                <div>
                  <div>{{ $t('page.cc.limit_mode_rate') }}</div>
                  <div class="limit-mode-desc">{{ $t('page.cc.limit_mode_rate_desc') }}</div>
                </div>
              </t-radio>
              <t-radio value="window">
                <div>
                  <div>{{ $t('page.cc.limit_mode_window') }}</div>
                  <div class="limit-mode-desc">{{ $t('page.cc.limit_mode_window_desc') }}</div>
                </div>
              </t-radio>
            </t-radio-group>
          </t-form-item>

          <!-- 添加效果提示 -->
          <t-form-item>
            <t-alert theme="info" :message="getLimitModeEffectTips(formEditData)" />
          </t-form-item>

          <t-form-item :label="$t('page.cc.enable_rule')" name="is_enable_rule">
            <t-switch v-model="formEditData.is_enable_rule"></t-switch>
          </t-form-item>

          <t-form-item v-if="formEditData.is_enable_rule" :label="$t('page.cc.rule_content')" name="rule_content">
            <t-textarea :style="{ width: '480px' }" v-model="formEditData.rule_content" :rows="10"
              :placeholder="$t('page.cc.rule_content_placeholder')">
            </t-textarea>
            <div class="limit-mode-desc">{{ $t('page.cc.rule_content_desc') }}</div>
            <t-button size="small" theme="warning" @click="openRuleGenerator">{{ $t('common.generate_rule') }}</t-button>
            <t-dialog :visible.sync="showRuleBuilderDialog" :header="$t('common.generate_rule')" width="900px" :destroyOnClose="true"
              :footer="false">
              <RuleBuilder :hostCode="formData.host_code" @confirm="onRuleBuilderConfirm"
                @cancel="showRuleBuilderDialog = false" />
            </t-dialog>
          </t-form-item>

          <t-form-item :label="$t('page.cc.lock_minutes')" name="lock_ip_minutes">
            <t-input-number :style="{ width: '480px' }" min="1" v-model="formEditData.lock_ip_minutes"
              :placeholder="$t('common.placeholder') + $t('page.cc.lock_minutes')"></t-input-number>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formEditData.remarks"
              :placeholder="$t('common.placeholder_content')" name="remarks">
            </t-textarea>
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
    <t-dialog :header="$t('page.cc.show_cc_ban_ip')" :width="800" :body="confirmBody" :visible.sync="banIPListVisible"
      @confirm="() => { banIPListVisible = false }" :onCancel="() => { banIPListVisible = false }">
      <ban-ip-list ref="banIpList"></ban-ip-list>
    </t-dialog>

  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import {
  SearchIcon
} from 'tdesign-icons-vue';
import Trend from '@/components/trend/index.vue';
import BanIpList from './component/baniplist/index.vue';
import RuleBuilder from '@/components/rule-builder/index.vue';

import {
  prefix
} from '@/config/global';
import {
  allhost
} from '@/apis/host';

import {
  wafAntiCCListApi, wafAntiCCDelApi, wafAntiCCEditApi, wafAntiCCAddApi, wafAntiCCDetailApi
} from '@/apis/anticc';

const INITIAL_DATA = {
  host_code: '',
  url: '',
  rate: 10,
  limit: 250,
  limit_mode: 'window',
  lock_ip_minutes: 10,
  remarks: '',
  // 新增：是否启用前置规则 + 规则内容
  is_enable_rule: false,
  rule_content: '',
};
export default Vue.extend({
  name: 'ListBase',
  components: {
    SearchIcon,
    Trend,
    BanIpList,
    RuleBuilder,
  },
  data() {
    return {
      addFormVisible: false,
      editFormVisible: false,
      guardVisible: false,
      confirmVisible: false,
      banIPListVisible: false,
      showRuleBuilderDialog: false,
      formData: {
        ...INITIAL_DATA
      },
      formEditData: {
        ...INITIAL_DATA
      },
      rules: {
        host_code: [{
          required: true,
          message: this.$t('page.cc.website'),
          type: 'error'
        }],
        rate: [{
          required: true,
          message: this.$t('page.cc.rate'),
          type: 'error'
        }],
        limit: [{
          required: true,
          message: this.$t('page.cc.limit'),
          type: 'error'
        }],
        lock_ip_minutes: [{
          required: true,
          message: this.$t('page.cc.lock_minutes'),
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
          title: this.$t('page.cc.website'),
          align: 'left',
          width: 250,
          ellipsis: true,
          colKey: 'host_code',
        },
        {
          title: this.$t('page.cc.rate'),
          width: 200,
          ellipsis: true,
          colKey: 'rate',
        },
        {
          title: this.$t('page.cc.limit'),
          width: 200,
          ellipsis: true,
          colKey: 'limit',
        },
        {
          title: this.$t('page.cc.limit_mode'),
          width: 200,
          ellipsis: true,
          colKey: 'limit_mode',
        },
        {
          title: this.$t('common.create_time'),
          width: 200,
          ellipsis: true,
          colKey: 'create_time',
        },

        {
          align: 'left',
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
          url
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
    // 根据限流模式和参数计算效果提示
    getLimitModeEffectTips(formData) {
      if (!formData.rate || !formData.limit) {
        return this.$t('page.cc.limit_mode_effect_incomplete');
      }

      if (formData.limit_mode === 'window') {
        return this.$t('page.cc.limit_mode_window_effect', {
          rate: formData.rate,
          limit: formData.limit
        });
      } else {
        const ratePerSecond = (formData.limit / formData.rate).toFixed(2);
        return this.$t('page.cc.limit_mode_rate_effect', {
          rate: formData.rate,
          limit: formData.limit,
          ratePerSecond: ratePerSecond
        });
      }
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
      wafAntiCCListApi({
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
      console.log('分页变化', curr, pageInfo);
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
      console.log('统一Change', changeParams, triggerAndData);
    },
    handleClickEdit(e) {
      const {
        id
      } = e.row
      console.log(id)
      this.editFormVisible = true
      this.getDetail(id)
    },
    handleAddAntiCC() {
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
        wafAntiCCAddApi({
          ...postdata
        })
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
        console.log('edit cc ', postdata)
        wafAntiCCEditApi({
          ...postdata
        })
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
    onConfirmDelete() {
      this.confirmVisible = false;
      console.log('delete', this.data)
      console.log('delete', this.data[this.deleteIdx])
      let {
        id
      } = this.data[this.deleteIdx]
      let that = this
      wafAntiCCDelApi({
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
      wafAntiCCDetailApi({
        id: id
      })
        .then((res) => {
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {
            that.detail_data = resdata.data;
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
    handleShowCCBanIPList() {
      this.$refs.banIpList.getList("");
      this.banIPListVisible = true
    },
    //跳转界面
    handleJumpOnlineUrl() {
      window.open(this.samwafglobalconfig.getOnlineUrl() + "/guide/CC.html");
    },
    openRuleGenerator() {
      this.showRuleBuilderDialog = true;
    },
    onRuleBuilderConfirm(content: string) {
      if (this.addFormVisible) {
        // 新增弹窗打开时，写入新增表单
        this.formData.rule_content = content;
      } else if (this.editFormVisible) {
        // 编辑弹窗打开时，写入编辑表单
        this.formEditData.rule_content = content;
      } else {
        // 兜底：默认写入新增表单
        this.formData.rule_content = content;
      }
      this.showRuleBuilderDialog = false;
    },
    //end method
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables';

.payment-col {
  display: flex;

  .trend-container {
    display: flex;
    align-items: center;
    margin-left: 8px;
  }
}

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

.limit-mode-desc {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  margin-top: 4px;
}
</style>
