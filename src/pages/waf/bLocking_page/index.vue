<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAdd"> {{ $t('page.blocking_page.button_add_blocking_page') }} </t-button>
          <t-button variant="outline" @click="openUnmatchedDialog">{{ $t('page.blocking_page.unmatched.title') }}</t-button>
        </div>
        <div class="right-operation-container">
            <t-form ref="form" :data="searchformData" :label-width="300" layout="inline" colon :style="{ marginBottom: '8px' }">
                   <t-form-item>
                  <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')">
                            {{ $t('common.search') }}
                          </t-button>
                   </t-form-item>
             </t-form>
        </div>
      </t-row>
      <help-block :summary="$t('page.blocking_page.alert_message')" doc="guide/BlockingPage" />
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
          @page-change="rehandlePageChange" @change="rehandleChange" @select-change="rehandleSelectChange"
          :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">

          <template #host_code="{ row }">
            <span>{{ row.host_code === globalHostCode ? $t('page.blocking_page.global_website') : host_dic[row.host_code] }}</span>
          </template>
          <template #blocking_type="{ row }">
            <span>{{ getBlockingTypeLabel(row.blocking_type) }}</span>
          </template>
          <template #attack_type="{ row }">
            <span>{{ getAttackTypeLabel(row.attack_type) }}</span>
          </template>
          <template #content_priority="{ row }">
            <span>{{ getContentPriorityLabel(row.content_priority) }}</span>
          </template>
          <template #response_header="{ row }">
             <span v-for="header in JSON.parse(row.response_header)">{{ header.name }}={{ header.value }}  </span>
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


    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="780" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="180">
                    <t-form-item :label="$t('page.blocking_page.blocking_page_name')" name="blocking_page_name">
                         <t-input :style="{ width: '480px' }" v-model="formData.blocking_page_name" ></t-input>
                    </t-form-item>

<!--                      <t-form-item :label="$t('page.blocking_page.blocking_type')" name="blocking_type">
                        <t-select v-model="formData.blocking_type" clearable :style="{ width: '480px' }">
                          <t-option v-for="item in blocking_type" :value="item.value" :label="`${item.label}`">
                          </t-option>
                        </t-select>
                    </t-form-item>-->

                      <t-form-item :label="$t('page.blocking_page.host_code')" name="host_code">
                        <t-select v-model="formData.host_code" clearable :style="{ width: '480px' }">
                          <t-option v-for="(item, index) in host_dic" :value="index" :label="item"
                                    :key="index">
                            {{ item }}
                          </t-option>
                        </t-select>

                    </t-form-item>

                      <t-form-item :label="$t('page.blocking_page.attack_type')" name="attack_type">
                        <t-select v-model="formData.attack_type" clearable :style="{ width: '480px' }">
                          <t-option v-for="item in attack_type_options" :value="item.value" :label="item.label" :key="item.value">
                            {{ item.label }}
                          </t-option>
                        </t-select>
                    </t-form-item>

                      <t-form-item :label="$t('page.blocking_page.response_code')" name="response_code">
                        <t-input :style="{ width: '480px' }" v-model="formData.response_code" ></t-input>
                    </t-form-item>

                      <t-form-item :label="$t('page.blocking_page.content_priority')" name="content_priority">
                        <div :style="{ width: '480px' }">
                          <t-radio-group v-model="formData.content_priority">
                            <t-radio-button v-for="item in content_priority_options" :value="item.value" :key="item.value">
                              {{ item.label }}
                            </t-radio-button>
                          </t-radio-group>
                          <div class="priority-tip">
                            <div>{{ $t('page.blocking_page.content_priority_desc.samwaf') }}</div>
                            <div>{{ $t('page.blocking_page.content_priority_desc.backend') }}</div>
                            <div class="priority-tip-note">{{ $t('page.blocking_page.content_priority_desc.note') }}</div>
                          </div>
                        </div>
                    </t-form-item>

                    <t-form-item :label="$t('page.blocking_page.response_content')" name="response_content">
                      <div style="width: 100%;">
                        <t-radio-group v-model="previewModeAdd" variant="default-filled" size="small" style="margin-bottom: 8px;">
                          <t-radio-button value="code">{{ $t('page.blocking_page.editor_mode.code') }}</t-radio-button>
                          <t-radio-button value="preview">{{ $t('page.blocking_page.editor_mode.preview') }}</t-radio-button>
                        </t-radio-group>
                        <div class="priority-tip">{{ $t('page.blocking_page.template_variables') }}</div>
                        <t-textarea
                          v-show="previewModeAdd === 'code'"
                          v-model="formData.response_content"
                          name="response_content"
                          :autosize="{minRows: 10,maxRows: 11}"
                        />
                        <!-- sandbox 置空：预览框内不允许执行脚本、不同源，避免模板里的 JS 在管理端被执行 -->
                        <iframe
                          v-show="previewModeAdd === 'preview'"
                          class="preview-frame"
                          sandbox=""
                          :srcdoc="previewHtmlAdd"
                        ></iframe>
                      </div>
                    </t-form-item>
                    <t-form-item :label="$t('page.blocking_page.response_header')" name="response_header">
                    <div style="width: 100%; margin-top: 10px;">
                      <t-button variant="outline" @click="addResponseHeader" style="width: 100%;">{{ $t('common.add') }}</t-button>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                      <div v-for="(header, index) in response_header_list" :key="index" style="display: flex; gap: 10px;">
                        <t-input v-model="header.name" :style="{ width: '220px' }" :placeholder="$t('common.http_header.name')" />
                        <t-input v-model="header.value" :style="{ width: '220px' }" :placeholder="$t('common.http_header.value')" />
                      </div>
                    </div>
                  </t-form-item>


                  <t-form-item style="float: right">
                    <t-button variant="outline" @click="onClickCloseBtn">{{ $t('common.close') }}</t-button>
                    <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
                  </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="780" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="form" :rules="rules" @submit="onSubmitEdit" :labelWidth="180">
                       <t-form-item :label="$t('page.blocking_page.blocking_page_name')" name="blocking_page_name">
                           <t-input :style="{ width: '480px' }" v-model="formEditData.blocking_page_name" ></t-input>
                      </t-form-item>
<!--                      <t-form-item :label="$t('page.blocking_page.blocking_type')" name="blocking_type">
                        <t-select v-model="formEditData.blocking_type" clearable :style="{ width: '480px' }">
                          <t-option v-for="item in blocking_type" :value="item.value" :label="`${item.label}`">
                          </t-option>
                        </t-select>
                      </t-form-item>-->
                        <t-form-item :label="$t('page.blocking_page.host_code')" name="host_code">
                          <t-select v-model="formEditData.host_code" clearable :style="{ width: '480px' }">
                            <t-option v-for="(item, index) in host_dic" :value="index" :label="item"
                                      :key="index">
                              {{ item }}
                            </t-option>
                          </t-select>
                      </t-form-item>

                        <t-form-item :label="$t('page.blocking_page.attack_type')" name="attack_type">
                          <t-select v-model="formEditData.attack_type" clearable :style="{ width: '480px' }">
                            <t-option v-for="item in attack_type_options" :value="item.value" :label="item.label" :key="item.value">
                              {{ item.label }}
                            </t-option>
                          </t-select>
                        </t-form-item>

                        <t-form-item :label="$t('page.blocking_page.response_code')" name="response_code">
                          <t-input :style="{ width: '480px' }" v-model="formEditData.response_code" ></t-input>
                        </t-form-item>

                        <t-form-item :label="$t('page.blocking_page.content_priority')" name="content_priority">
                          <div :style="{ width: '480px' }">
                            <t-radio-group v-model="formEditData.content_priority">
                              <t-radio-button v-for="item in content_priority_options" :value="item.value" :key="item.value">
                                {{ item.label }}
                              </t-radio-button>
                            </t-radio-group>
                            <div class="priority-tip">
                              <div>{{ $t('page.blocking_page.content_priority_desc.samwaf') }}</div>
                              <div>{{ $t('page.blocking_page.content_priority_desc.backend') }}</div>
                              <div class="priority-tip-note">{{ $t('page.blocking_page.content_priority_desc.note') }}</div>
                            </div>
                          </div>
                        </t-form-item>

                        <t-form-item :label="$t('page.blocking_page.response_content')" name="response_content">
                          <div style="width: 100%;">
                            <t-radio-group v-model="previewModeEdit" variant="default-filled" size="small" style="margin-bottom: 8px;">
                              <t-radio-button value="code">{{ $t('page.blocking_page.editor_mode.code') }}</t-radio-button>
                              <t-radio-button value="preview">{{ $t('page.blocking_page.editor_mode.preview') }}</t-radio-button>
                            </t-radio-group>
                            <div class="priority-tip">{{ $t('page.blocking_page.template_variables') }}</div>
                            <t-textarea
                              v-show="previewModeEdit === 'code'"
                              v-model="formEditData.response_content"
                              name="response_content"
                              :autosize="{minRows: 10,maxRows: 11}"
                            />
                            <!-- sandbox 置空：预览框内不允许执行脚本、不同源，避免模板里的 JS 在管理端被执行 -->
                            <iframe
                              v-show="previewModeEdit === 'preview'"
                              class="preview-frame"
                              sandbox=""
                              :srcdoc="previewHtmlEdit"
                            ></iframe>
                          </div>
                      </t-form-item>

                        <t-form-item :label="$t('page.blocking_page.response_header')" name="response_header">

                          <div style="width: 100%; margin-top: 10px;">
                            <t-button variant="outline" @click="addResponseHeader" style="width: 100%;">{{ $t('common.add') }}</t-button>
                          </div>
                          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                            <div v-for="(header, index) in response_header_list" :key="index" style="display: flex; gap: 10px;">
                              <t-input v-model="header.name" :style="{ width: '220px' }" :placeholder="$t('common.http_header.name')" />
                              <t-input v-model="header.value" :style="{ width: '220px' }" :placeholder="$t('common.http_header.value')" />
                            </div>
                          </div>

                         </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseEditBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <t-dialog :header="$t('page.blocking_page.unmatched.title')" :visible.sync="unmatchedVisible" :width="780" :footer="false"
      :closeOnOverlayClick="!unmatchedSaving" :closeOnEscKeydown="!unmatchedSaving" :closeBtn="!unmatchedSaving">
      <div slot="body">
        <p>{{ $t('page.blocking_page.unmatched.description') }}</p>
        <div style="width: 100%;">
          <t-radio-group v-model="unmatchedActiveTab" variant="default-filled" size="small" style="margin-bottom: 8px;">
            <t-radio-button value="edit">{{ $t('page.blocking_page.editor_mode.code') }}</t-radio-button>
            <t-radio-button value="preview">{{ $t('page.blocking_page.editor_mode.preview') }}</t-radio-button>
          </t-radio-group>
          <div class="priority-tip">{{ $t('page.blocking_page.unmatched.builtin_tip') }}</div>
          <div class="priority-tip">{{ $t('page.blocking_page.unmatched.variable_tip') }}</div>
          <p v-if="unmatchedLoadError" role="alert">{{ $t('page.blocking_page.unmatched.load_failed') }}</p>
          <p v-else-if="builtinLoadError" class="priority-tip" role="alert">{{ $t('page.blocking_page.unmatched.preview_builtin_failed') }}</p>
          <t-textarea v-show="unmatchedActiveTab === 'edit'"
            v-model="unmatchedData.response_content" :disabled="unmatchedLoading || unmatchedLoadError || unmatchedSaving"
            :placeholder="$t('page.blocking_page.unmatched.placeholder')" :autosize="{ minRows: 12, maxRows: 20 }" />
          <!-- sandbox 置空：预览框内不允许执行脚本、不同源，避免模板里的 JS 在管理端被执行 -->
          <iframe v-show="unmatchedActiveTab === 'preview'" class="unmatched-preview-frame" sandbox=""
            :srcdoc="unmatchedPreviewHtml"></iframe>
        </div>
        <div class="unmatched-actions">
          <t-button variant="outline" :disabled="unmatchedLoading || unmatchedLoadError || unmatchedSaving || !builtinUnmatchedHtml"
            @click="unmatchedData.response_content = builtinUnmatchedHtml">{{ $t('page.blocking_page.unmatched.clear') }}</t-button>
          <t-button variant="outline" :disabled="unmatchedSaving" @click="unmatchedVisible = false">{{ $t('common.close') }}</t-button>
          <t-button theme="primary" :loading="unmatchedSaving" :disabled="!unmatchedLoaded || unmatchedLoading || unmatchedLoadError || unmatchedSaving"
            @click="saveUnmatchedResponse">{{ $t('common.confirm') }}</t-button>
        </div>
      </div>
    </t-dialog>

    <t-dialog :header="$t('common.confirm_delete')" :body="confirmBody" :visible.sync="confirmVisible" @confirm="onConfirmDelete"
      :onCancel="onCancel">
    </t-dialog>
  </div>
</template>
<script lang="ts">
  import Vue from 'vue';
  import { purifyHtml } from '@/utils/purify';
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
    wafBlockingPageListApi,wafBlockingPageDelApi,wafBlockingPageEditApi,wafBlockingPageAddApi,wafBlockingPageDetailApi,wafBlockingPageUnmatchedBuiltinApi
  } from '@/apis/blocking_page.ts';

  const INITIAL_DATA = {
    blocking_page_name:'',
    blocking_type:'other_block',
    attack_type:'',
    host_code:'',
    response_code:'403',
    response_header:'',
    response_content:'',
    content_priority:'samwaf',

  };
  const INITIAL_UNMATCHED_DATA = {
    ...INITIAL_DATA,
    id: '',
    host_code: '',
    blocking_type: 'not_match_website',
    response_header: '[]',
  };
  // 预览时用来替换模板占位符的演示数据（后端模板分隔符是 [[ ]]，变量形如 [[.SAMWAF_REQ_UUID]]）
  const PREVIEW_PLACEHOLDER_VALUES = {
    SAMWAF_REQ_UUID: 'PREVIEW-0000-0000-0000',
    SAMWAF_IP: '203.0.113.10',
    SAMWAF_BACKEND_STATUS: '403 Forbidden',
    SAMWAF_BACKEND_CODE: '403',
    SAMWAF_HOST: 'notfound.example.com',
    SAMWAF_BACKEND_BODY: '{"code":403,"message":"forbidden"}',
  };
  export default Vue.extend({
    name: 'BlockingPageBase',
    components: {
      SearchIcon,
      Trend,
    },
    data() {
      return {
        addFormVisible: false,
        editFormVisible: false,
        unmatchedVisible: false,
        unmatchedActiveTab: 'edit',
        unmatchedLoading: false,
        unmatchedLoaded: false,
        unmatchedLoadError: false,
        unmatchedSaving: false,
        unmatchedLoadSequence: 0,
        builtinUnmatchedHtml: '',
        builtinLoadError: false,
        unmatchedData: { ...INITIAL_UNMATCHED_DATA },
        guardVisible: false,
        confirmVisible: false,
        formData: {
          ...INITIAL_DATA
        },
        formEditData: {
          ...INITIAL_DATA
        },
        rules: {
           blocking_page_name: [{
                  required: true,
                  message: this.$t('common.placeholder')+this.$t('page.blocking_page.blocking_page_name'),
                  type: 'error'
            }],
           blocking_type: [{
                  required: true,
                  message: this.$t('common.placeholder')+this.$t('page.blocking_page.blocking_type'),
                  type: 'error'
            }],
           host_code: [{
                  required: true,
                  message: this.$t('common.placeholder')+this.$t('page.blocking_page.host_code'),
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
            { title: this.$t('page.blocking_page.blocking_page_name'),
                    width: 200,
                    ellipsis: true,
                    colKey: 'blocking_page_name',
             },


            { title: this.$t('page.blocking_page.blocking_type'),
                    width: 200,
                    ellipsis: true,
                    colKey: 'blocking_type',
             },

            { title: this.$t('page.blocking_page.host_code'),
                    width: 200,
                    ellipsis: true,
                    colKey: 'host_code',
             },

            { title: this.$t('page.blocking_page.attack_type'),
                    width: 150,
                    ellipsis: true,
                    colKey: 'attack_type',
             },

            { title: this.$t('page.blocking_page.response_code'),
                    width: 200,
                    ellipsis: true,
                    colKey: 'response_code',
             },

            { title: this.$t('page.blocking_page.content_priority'),
                    width: 180,
                    ellipsis: true,
                    colKey: 'content_priority',
             },
            { title: this.$t('page.blocking_page.response_header'),
                    width: 200,
                    ellipsis: true,
                    colKey: 'response_header',
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
        guardStatusIdx :-1,
        //主机字典
        host_dic:{},
        globalHostCode: '',
        //阻止类型
        blocking_type: [
          {
            label: this.$t('page.blocking_page.blocking_type.other_block'),
            value: 'other_block'
          },
        ],
       /* //响应码
        blocking_response_code: [
          {
            label: this.$t('page.blocking_page.blocking_response_code.resp_code_403'),
            value: '403'
          },
        ],*/
        //攻击类型选项
        attack_type_options: [
          { label: this.$t('page.blocking_page.attack_type_option.default'), value: '' },
          { label: this.$t('page.blocking_page.attack_type_option.cc_attack'), value: 'cc_attack' },
          { label: this.$t('page.blocking_page.attack_type_option.sql_injection'), value: 'sql_injection' },
          { label: this.$t('page.blocking_page.attack_type_option.xss_attack'), value: 'xss_attack' },
          { label: this.$t('page.blocking_page.attack_type_option.scan_tool'), value: 'scan_tool' },
          { label: this.$t('page.blocking_page.attack_type_option.rce_attack'), value: 'rce_attack' },
          { label: this.$t('page.blocking_page.attack_type_option.dir_traversal'), value: 'dir_traversal' },
          { label: this.$t('page.blocking_page.attack_type_option.bot_attack'), value: 'bot_attack' },
          { label: this.$t('page.blocking_page.attack_type_option.sensitive_word'), value: 'sensitive_word' },
          { label: this.$t('page.blocking_page.attack_type_option.ip_blocked'), value: 'ip_blocked' },
          { label: this.$t('page.blocking_page.attack_type_option.url_blocked'), value: 'url_blocked' },
          { label: this.$t('page.blocking_page.attack_type_option.anti_leech'), value: 'anti_leech' },
          { label: this.$t('page.blocking_page.attack_type_option.custom_rule'), value: 'custom_rule' },
          { label: this.$t('page.blocking_page.attack_type_option.owasp_rule'), value: 'owasp_rule' },
          { label: this.$t('page.blocking_page.attack_type_option.plugin_block'), value: 'plugin_block' },
        ],
        //内容优先级选项
        content_priority_options: [
          { label: this.$t('page.blocking_page.content_priority_option.samwaf'), value: 'samwaf' },
          { label: this.$t('page.blocking_page.content_priority_option.backend'), value: 'backend' },
        ],
        //响应内容编辑区模式：code=HTML代码(默认) preview=样式预览
        previewModeAdd: 'code',
        previewModeEdit: 'code',
        //响应header
        response_header_list:[
          {
            name:"Content-Type",
            value:"text/html"
          }
        ]
      };
    },
    computed: {
      confirmBody() {
        if (this.deleteIdx > -1) {
          const {
            host
          } = this.data?. [this.deleteIdx];
          return this.$t('common.data_delete_warning');
        }
        return '';
      },
      offsetTop() {
        return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
      },
      previewHtmlAdd() {
        return this.buildPreviewHtml(this.formData.response_content);
      },
      previewHtmlEdit() {
        return this.buildPreviewHtml(this.formEditData.response_content);
      },
      unmatchedPreviewHtml() {
        if (!(this.unmatchedData.response_content || '').trim()) {
          if (!this.builtinUnmatchedHtml) return '';
          const demo = { SAMWAF_HOST: PREVIEW_PLACEHOLDER_VALUES.SAMWAF_HOST };
          return purifyHtml(this.builtinUnmatchedHtml.replace(/\[\[\s*\.([A-Za-z0-9_]+)\s*\]\]/g, (match, key) =>
            Object.prototype.hasOwnProperty.call(demo, key) ? demo[key] : match,
          ));
        }
        return this.buildPreviewHtml(this.unmatchedData.response_content);
      },
    },
    mounted() {
      this.loadHostList().then(() => {
        this.getList("");
      });
    },

    methods: {
      loadBuiltinUnmatched(sequence) {
        wafBlockingPageUnmatchedBuiltinApi().then((res) => {
          if (sequence !== this.unmatchedLoadSequence || !this.unmatchedVisible) return;
          if (res.code === 0 && typeof res.data === 'string') {
            this.builtinUnmatchedHtml = res.data;
            // 无自定义记录时，编辑区预填内置页面，保证编辑与预览内容一致
            if (this.unmatchedVisible && !(this.unmatchedData.response_content || '').trim()) {
              this.unmatchedData.response_content = res.data;
            }
          } else {
            this.builtinLoadError = true;
          }
        }).catch(() => {
          if (sequence === this.unmatchedLoadSequence) this.builtinLoadError = true;
        });
      },
      findGlobalHostCode(hosts) {
        const marked = hosts.filter(host => Number(host.global_host) === 1);
        const candidates = marked.length ? marked : hosts.filter(host =>
          host.pre_host === 'global:80' || host.label === 'global:80' || host.label === 'global',
        );
        return candidates.length === 1 && typeof candidates[0].value === 'string'
          ? candidates[0].value : '';
      },
      getBlockingTypeLabel(blockingType) {
        if (blockingType === 'not_match_website') {
          return this.$t('page.blocking_page.unmatched.title');
        }
        return blockingType === 'other_block' || !blockingType
          ? this.$t('page.blocking_page.regular_response') : blockingType;
      },
      async openUnmatchedDialog() {
        if (this.unmatchedSaving) return;
        const sequence = ++this.unmatchedLoadSequence;
        this.unmatchedVisible = true;
        this.unmatchedActiveTab = 'edit';
        this.unmatchedLoading = true;
        this.unmatchedLoaded = false;
        this.unmatchedLoadError = false;
        this.builtinUnmatchedHtml = '';
        this.builtinLoadError = false;
        this.loadBuiltinUnmatched(sequence);
        this.unmatchedData = {
          ...INITIAL_UNMATCHED_DATA,
          blocking_page_name: String(this.$t('page.blocking_page.unmatched.title')),
        };
        try {
          const hosts = await allhost();
          if (sequence !== this.unmatchedLoadSequence || !this.unmatchedVisible) return;
          if (hosts.code !== 0 || !Array.isArray(hosts.data)) throw new Error('Unable to load websites');
          const globalHostCode = this.findGlobalHostCode(hosts.data);
          if (!globalHostCode) throw new Error('Global website is unavailable');
          this.globalHostCode = globalHostCode;
          this.unmatchedData.host_code = globalHostCode;
          const res = await wafBlockingPageListApi({
            host_code: globalHostCode,
            blocking_type: 'not_match_website',
            pageIndex: 1,
            pageSize: 1,
          });
          if (sequence !== this.unmatchedLoadSequence || !this.unmatchedVisible) return;
          if (res.code !== 0 || !res.data || !(Array.isArray(res.data.list) || (res.data.list === null && res.data.total === 0))) {
            throw new Error('Unable to load response');
          }
          const record = (res.data.list || [])[0];
          if (record) {
            if (!record.id || record.host_code !== globalHostCode || record.blocking_type !== 'not_match_website') {
              throw new Error('Unexpected response record');
            }
            const savedContent = record.response_content || '';
            this.unmatchedData = {
              ...this.unmatchedData,
              ...record,
              // 已存内容为空表示按内置页面生效；保留编辑区已有内容（内置预填或空），避免被空串覆盖
              response_content: savedContent.trim() ? savedContent : this.unmatchedData.response_content,
              response_header: record.response_header ?? '[]',
            };
          }
          this.unmatchedLoaded = true;
        } catch (e) {
          if (sequence !== this.unmatchedLoadSequence || !this.unmatchedVisible) return;
          this.unmatchedLoadError = true;
        } finally {
          if (sequence === this.unmatchedLoadSequence) this.unmatchedLoading = false;
        }
      },
      async saveUnmatchedResponse() {
        if (!this.unmatchedLoaded || this.unmatchedLoading || this.unmatchedLoadError || this.unmatchedSaving || !this.unmatchedData.host_code) return;
        this.unmatchedSaving = true;
        const custom = (this.unmatchedData.response_content || '').trim();
        const builtin = (this.builtinUnmatchedHtml || '').trim();
        const payload = {
          ...this.unmatchedData,
          host_code: this.unmatchedData.host_code,
          blocking_type: 'not_match_website',
          // 与内置页面一致或为空都按内置语义保存，避免无改动保存冻结模板
          response_content: custom && custom !== builtin ? this.unmatchedData.response_content : '',
          response_code: '403',
          attack_type: '',
          content_priority: 'samwaf',
        };
        try {
          const res = await (payload.id ? wafBlockingPageEditApi(payload) : wafBlockingPageAddApi(payload));
          if (res.code !== 0) {
            this.$message.warning(res.msg || this.$t('page.blocking_page.unmatched.save_failed'));
            return;
          }
          this.$message.success(res.msg);
          this.unmatchedVisible = false;
          this.pagination.current = 1;
          this.getList('');
        } catch (e) {
          this.$message.warning(this.$t('page.blocking_page.unmatched.save_failed'));
        } finally {
          this.unmatchedSaving = false;
        }
      },
      // 把模板占位符替换成演示数据后给预览用；空值一律按默认的 samwaf 处理
      buildPreviewHtml(content) {
        if (!content) {
          return '';
        }
        const demo = {
          ...PREVIEW_PLACEHOLDER_VALUES,
          SAMWAF_BLOCK_INFO: this.$t('page.blocking_page.preview_demo_block_info'),
        };
        return purifyHtml(content.replace(/\[\[\s*\.([A-Za-z0-9_]+)\s*\]\]/g, (match, key) =>
          Object.prototype.hasOwnProperty.call(demo, key) ? demo[key] : match,
        ));
      },
      getContentPriorityLabel(contentPriority) {
        const option = this.content_priority_options.find(opt => opt.value === (contentPriority || 'samwaf'));
        return option ? option.label : contentPriority;
      },
      getAttackTypeLabel(attackType) {
        // 如果 attack_type 为空或 undefined，显示"通用"
        if (!attackType || attackType === '') {
          return this.$t('page.blocking_page.attack_type_option.default');
        }
        // 根据 attack_type 值查找对应的标签
        const option = this.attack_type_options.find(opt => opt.value === attackType);
        return option ? option.label : attackType;
      },
      addResponseHeader() {
        this.response_header_list.push( {name:"",
          value:""});
      },
      loadHostList() {
        return new Promise((resolve, reject) => {
          allhost()
            .then((res) => {
              let resdata = res;
              console.log(resdata);
              if (resdata.code === 0) {
                let host_options = resdata.data;
                this.globalHostCode = this.findGlobalHostCode(host_options);
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
        wafBlockingPageListApi( {
              pageSize: that.pagination.pageSize,
              pageIndex: that.pagination.current,
              ...that.searchformData
          })
          .then((res) => {
            let resdata = res
            console.log(resdata)
            if (resdata.code === 0) {

              this.data = resdata.data.list??[];
              this.data_attach = []
              console.log('getList',this.data)
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
        if (e.row.blocking_type === 'not_match_website') {
          this.openUnmatchedDialog();
          return;
        }
        console.log(e)
        const {
          id,response_header
        } = e.row
        console.log(id)
        this.editFormVisible = true
        this.previewModeEdit = 'code'
        this.response_header_list = JSON.parse(response_header);

        this.getDetail(id)
      },
      handleAdd() {
        this.addFormVisible = true
        this.previewModeAdd = 'code'
        this.formData = { ...INITIAL_DATA };
        this.response_header_list = [{
          name:"Content-Type",
          value:"text/html"
        }]
      },
      onSubmit({
        result,
        firstError
      }): void {
        let that = this
        if (!firstError) {
          this.response_header_list = this.response_header_list.filter(header => header.name.trim() !== '');
          if (this.response_header_list.length <=0) {
            that.$message.warning("Header没有填写");
            return
          }
          that.formData.response_header = JSON.stringify(this.response_header_list);
          let postdata = {
            ...that.formData
          }
          wafBlockingPageAddApi({...postdata})
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
            .finally(() => {});
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

          this.response_header_list = this.response_header_list.filter(header => header.name.trim() !== '');
          if (this.response_header_list.length <=0) {
            that.$message.warning("Header没有填写");
            return
          }
          that.formEditData.response_header = JSON.stringify(this.response_header_list);
          let postdata = {
            ...that.formEditData
          }
          wafBlockingPageEditApi({...postdata})
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
            .finally(() => {});
        } else {
          console.log('Errors: ', result);
          that.$message.warning(firstError);
        }
      },
      onClickCloseBtn(): void {
        this.addFormVisible = false;
        this.formData = {...INITIAL_DATA};
      },
      onClickCloseEditBtn(): void {
        this.editFormVisible = false;
        this.formEditData = {...INITIAL_DATA};
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
        wafBlockingPageDelApi({
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
          .finally(() => {});


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
        wafBlockingPageDetailApi({
              id: id
          })
          .then((res) => {
            let resdata = res
            console.log(resdata)
            if (resdata.code === 0) {
              that.detail_data = resdata.data;
              that.formEditData = {
                ...that.detail_data,
                // 确保 attack_type 为空值时显示为空字符串，匹配"通用"选项
                attack_type: that.detail_data.attack_type || '',
                // 老数据没有该字段，按默认的"优先使用SamWaf自定义模版"回填
                content_priority: that.detail_data.content_priority || 'samwaf'
              }
            }
          })
          .catch((e: Error) => {
            console.log(e);
          })
          .finally(() => {});
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

  .priority-tip {
    margin-top: 8px;
    font-size: 12px;
    line-height: 20px;
    color: var(--td-text-color-secondary);

    .priority-tip-note {
      margin-top: 4px;
      color: var(--td-text-color-placeholder);
    }
  }

  .unmatched-actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    margin-top: 16px;

    .t-button + .t-button {
      margin-left: 0;
    }
  }

  .preview-frame {
    width: 100%;
    height: 320px;
    border: 1px solid var(--td-component-border);
    border-radius: var(--td-radius-default);
    background-color: #fff;
  }

  .unmatched-preview-frame {
    width: 100%;
    height: 440px;
    border: 1px solid var(--td-component-border);
    border-radius: var(--td-radius-default);
    background-color: #fff;
  }

  .t-button+.t-button {
    margin-left: @spacer;
  }
</style>
