<template>
  <div class="detail-base">
    <t-alert theme="info" :message="$t('page.rule.detail.recommend_message')" close>
      <template #operation>
        <span @click="handleJumpAttackLogOperation">{{ $t('page.rule.detail.jump_visit_log') }} </span>
        <span @click="handleJumpOnlineUrl"> {{ $t('page.rule.detail.jump_visit_log') }} </span>
      </template>
    </t-alert>
    <t-form :data="formData" @submit="onSubmit" :labelWidth="180">
      <!--Base Info Begin-->
      <t-card :title="$t('page.rule.detail.base_info')">
        <t-form-item :label="$t('page.rule.detail.rule_name')" name="rule_name">
          <t-input :placeholder="$t('common.placeholder')" v-model="formData.rule_base.rule_name" />
        </t-form-item>
        <t-form-item :label="$t('page.rule.detail.rule_domain_code')" name="rule_domain_code">
          <t-select v-model="formData.rule_base.rule_domain_code" clearable filterable :style="{ width: '480px' }">
            <t-option v-for="(item, index) in host_options" :value="item.value" :label="item.label" :key="index">
              {{ item.label }}
            </t-option>
          </t-select>
        </t-form-item>
        <t-form-item :label="$t('page.rule.detail.rule_salience')" name="salience">
          <t-input :placeholder="$t('common.placeholder')" v-model="formData.rule_base.salience" />
        </t-form-item>
        <t-form-item :label="$t('page.rule.detail.rule_manual')" name="is_manual_rule">
          <t-select :style="{ width: '480px' }" @change="changeManualRule" v-model="formData.is_manual_rule">
            <t-option v-for="(item, index) in rule_manual_option" :value="item.value" :label="item.label" :key="index">
              {{ item.label }}
            </t-option>
          </t-select>
        </t-form-item>
        <t-form-item :label="$t('page.rule.detail.rule_status')" name="rule_status">
          <t-select :style="{ width: '480px' }" v-model="formData.rule_status">
            <t-option v-for="(item, index) in rule_status_option" :value="item.value" :label="item.label" :key="index">
              {{ item.label }}
            </t-option>
          </t-select>
        </t-form-item>
      </t-card>
      <!--Base Info End-->

      <!--UI Rule -->
      <div v-if="formData.is_manual_rule == '0'">
        <!--规则编排 开始-->
        <t-card :title="$t('page.rule.detail.write_rule')">
          <t-button theme="primary" @click="ruleDynAdd('cond')">
            {{ $t('common.new') }}
          </t-button>
          <t-form-item :label="$t('page.rule.detail.relation')" name="relation_symbol"
            v-if="formData.rule_condition.relation_detail.length > 1">
            <t-select clearable :style="{ width: '480px' }" v-model="formData.rule_condition.relation_symbol" @change="onFormChange">
              <t-option v-for="(item, index) in relation_symbol_option" :value="item.value" :label="item.label"
                :key="index">
                {{ item.label }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-card :title="$t('page.rule.detail.condition')"
            v-for="(condition_item, condition_index) in formData.rule_condition.relation_detail">
            <t-row :gutter="{ xs: 8, sm: 12, md: 16, lg: 16, xl: 16, xxl: 16 }">
              <t-col :span="5">
                <div>
                  <t-form-item :label="$t('page.rule.detail.scope')" name="attr" :labelWidth="80">
                    <t-select clearable :style="{ width: '200px' }" v-model="condition_item.attr"
                      @change="onAttrChange(condition_item)">
                      <t-option
                        v-for="(item, index) in attr_option.filter(option => !option.value.toLowerCase().startsWith('get'))"
                        :value="item.value" :label="item.label" :key="index">
                        {{ item.label }}
                      </t-option>
                    </t-select>
                  </t-form-item>
                </div>
              </t-col>
              <t-col :span="5">
                <div>
                  <t-form-item :label="$t('page.rule.detail.judgment')" name="attr_judge" :labelWidth="80">
                    <t-select clearable :style="{ width: '200px' }" v-model="condition_item.attr_judge" @change="onAttrJudgeChange(condition_item)">
                      <t-option v-for="(item, index) in attr_judge_option" :value="item.value" :label="item.label" :key="index">
                        {{ item.label }}
                      </t-option>
                    </t-select>
                  </t-form-item>
                </div>
              </t-col>
              <t-col :span="5">
                <div>
                  <t-form-item :label="$t('page.rule.detail.value')" name="att_val" :labelWidth="80">
                    <t-input :style="{ width: '200px' }" placeholder="请输入内容" v-model="condition_item.attr_val" @change="onFormChange" />
                  </t-form-item>
                </div>
              </t-col>
              <t-col :span="3" v-if="(condition_item.attr_judge || '').startsWith('system.')">
                <div>
                  <t-form-item :label="$t('page.rule.detail.function_judgment_result')" name="att_val2" :labelWidth="80">
                    <t-select clearable :style="{ width: '160px' }" v-model="condition_item.attr_val2" @change="onFormChange">
                      <t-option value="true" label="true">true</t-option>
                      <t-option value="false" label="false">false</t-option>
                    </t-select>
                  </t-form-item>
                </div>
              </t-col>
              <t-col :span="1" style="text-align:right;">
                <t-button theme="danger" @click="ruleDynDel('cond', condition_index)">{{ $t('common.delete')
                  }}</t-button>
              </t-col>
            </t-row>

          </t-card>
        </t-card>
        <!--规则编排 结束-->

        <!-- 规则脚本内容预览（仅 UI 模式显示） -->
        <t-card :title="$t('page.rule.detail.rule_script_content')">
          <pre class="rule-example-code">{{ rulePreviewContent || ruleDetail.rule_content }}</pre>
        </t-card>

      </div>
      <!--UI Rule End-->

      <!--Manual Rule-->
      <div v-if="formData.is_manual_rule == '1'">
        <t-card :title="$t('page.rule.detail.write_rule')">
          <t-row>
            <!-- 左侧代码编辑区域 -->
            <t-col flex="auto">
              <div class="rule-example-header">
                <code-icon />
                <span class="rule-example-title">{{ $t('page.rule.detail.manual_code_rule_edit') }}</span>
              </div>
              <writeRule :valuecontent="formData.rule_content" @edtinput="edtinput"></writeRule>

              <div class="rule-example-container">
                <t-alert theme="info" :title="$t('page.rule.detail.example_code')">
                  <template #message>
                    <pre> rule R80798f795d7947419ba6f593708b40d9 "禁止来自中国以外的访客访问" salience 10 {
              when
                MF.COUNTRY != "中国"
              then
                Retract("R80798f795d7947419ba6f593708b40d9");
            }</pre>
                  </template>
                </t-alert>

                <t-alert theme="info" :title="$t('page.rule.detail.example_code')">
                  <template #message>
                    <pre> rule R80798f795d7947419ba6f593708b4012 "禁止满足条件的Header访客访问" salience 10 {
              when
                MF.GetHeaderValue("Accept").Contains("text/plain") == True
              then
                Retract("R80798f795d7947419ba6f593708b4012");
            }</pre>
                  </template>
                </t-alert>

                <t-alert theme="info" :title="$t('page.rule.detail.example_code')">
                  <template #message>
                    <pre> rule R80798f795d7947419ba6f593708b4013 "禁止5分钟内失败10次的IP访问" salience 10 {
              when
                MF.GetIPFailureCount(5) > 10
              then
                Retract("R80798f795d7947419ba6f593708b4013");
            }</pre>
                  </template>
                </t-alert>



                <t-link theme="danger" hover="color"
                  href="https://update.samwaf.com/airule/auto_jump_url.html?v20250311" target="_blank">
                  <jump-icon slot="suffixIcon" />
                  {{ $t('page.rule.detail.tutorial_online') }}
                </t-link>
              </div>
            </t-col>

            <!-- 右侧系统变量参考区域 -->
            <t-col flex="450px">
              {{ $t('page.rule.detail.system_variable') }}
              <t-table :data="attr_option" :columns="[
                { colKey: 'label', title: $t('page.rule.detail.variable_name') },
                { colKey: 'value', title: $t('page.rule.detail.variable_key') }
              ]" size="small" :pagination="{ pageSize: 10 }" rowKey="value" stripe hover />
              <br>
              {{ $t('page.rule.detail.system_judge_symbol') }}
              <t-table :data="attr_judge_option" :columns="[
                { colKey: 'label', title: $t('page.rule.detail.variable_name') },
                { colKey: 'value', title: $t('page.rule.detail.variable_key') }
              ]" size="small" :pagination="{ pageSize: 10 }" rowKey="value" stripe hover />
              <br>
              {{ $t('page.rule.detail.system_relation_symbol') }}
              <t-table :data="relation_symbol_option" :columns="[
                { colKey: 'label', title: $t('page.rule.detail.variable_name') },
                { colKey: 'value', title: $t('page.rule.detail.variable_key') }
              ]" size="small" :pagination="{ pageSize: 10 }" rowKey="value" stripe hover />
            </t-col>
          </t-row>
        </t-card>
      </div>

      <t-form-item style="margin-left: 100px">
        <t-space size="10px">
          <!-- type = submit，表单中的提交按钮，原生行为 -->
          <t-button theme="primary" type="submit">{{ $t('common.submit') }}</t-button>
          <t-button theme="primary" type="button" @click="backPage">{{ $t('common.return') }}</t-button>
        </t-space>
      </t-form-item>
    </t-form>

  </div>
</template>
<script lang="ts">
import {
  prefix
} from '@/config/global';
import { JumpIcon, CodeIcon } from 'tdesign-icons-vue';

import {
  RULE, RULE_RELATION_DETAIL, RULE_DO_ASSIGNMENT, RULE_DO_METHOD, RULE_DO_METHOD_PARM
} from '@/service/service-rule';
import { copyObj } from '@/utils/usuallytool';
import writeRule from "@/components/write-rule/index.vue";
import {
  allhost
} from '@/apis/host';
import { wafRuleListApi, wafRuleDelApi, wafRuleEditApi, wafRuleAddApi, wafRuleDetailApi, wafRuleFormatApi } from '@/apis/rules';
import { v4 as uuidv4 } from 'uuid';

export default {
  name: 'WafRuleEdit',
  components: {
    writeRule,
    JumpIcon,
    CodeIcon,
  },
  data() {
    return {
      op_type: "add",
      op_rule_no: "",//规则识别号
      prefix,
      detail_data: {},
      rule_manual_option: [{
        label: this.$t('page.rule.detail.ui_rule_edit'),
        value: '0'
      }, {
        label: this.$t('page.rule.detail.manual_code_rule_edit'),
        value: '1'
      },],
      rule_status_option: [{
        label: this.$t('page.rule.rule_on'),
        value: 1
      }, {
        label: this.$t('page.rule.rule_off'),
        value: 0
      },],
      rules: {
        rule_name: [{ required: true, message: this.$t('common.placeholder') + this.$t('page.rule.detail.rule_name'), type: 'error' }],
      },
      fact_option: [{
        label: this.$t('page.rule.detail.mf_option_default'),
        value: 'MF'
      },],
      method_option: [{
        label: this.$t('page.rule.detail.method_option'),
        value: 'DoSomeThing'
      },],
      attr_option: [{
        label: this.$t('page.rule.detail.inner_option_host'),
        value: 'HOST'
      },
      {
        label: this.$t('page.rule.detail.inner_option_url'),
        value: 'URL'
      },
      {
        label: this.$t('page.rule.detail.inner_option_referrer'),
        value: 'REFERER'
      },
      {
        label: this.$t('page.rule.detail.inner_option_user_agent'),
        value: 'USER_AGENT'
      },
      {
        label: this.$t('page.rule.detail.inner_option_method'),
        value: 'METHOD'
      },
      {
        label: this.$t('page.rule.detail.inner_option_cookies'),
        value: 'COOKIES'
      },
      {
        label: this.$t('page.rule.detail.inner_option_body'),
        value: 'BODY'
      },
      {
        label: this.$t('page.rule.detail.inner_option_port'),
        value: 'PORT'
      },
      {
        label: this.$t('page.rule.detail.inner_option_src_ip'),
        value: 'SRC_IP'
      },
      {
        label: this.$t('page.rule.detail.inner_option_country'),
        value: 'COUNTRY'
      },
      {
        label: this.$t('page.rule.detail.inner_option_province'),
        value: 'PROVINCE'
      }, {
        label: this.$t('page.rule.detail.inner_option_city'),
        value: 'CITY'
      },       {
        label: this.$t('page.rule.detail.inner_option_getheadervalue'),
        value: 'GetHeaderValue("HeaderKeyName")'
      },
      {
        label: this.$t('page.rule.detail.inner_option_getipfailurecount'),
        value: 'GetIPFailureCount(5)'
      },
      {
        label: this.$t('page.rule.detail.inner_option_issafebot'),
        value: 'IsSafeBot()'
      }

      ],
      attr_type_option: [{
        label: this.$t('page.rule.detail.attr_type_text'),
        value: 'string'
      },
      {
        label: this.$t('page.rule.detail.attr_type_int'),
        value: 'int'
      },
      ],
      attr_judge_option: [
        {
          label: this.$t('page.rule.detail.judge_equal'),
          value: '=='
        },
        {
          label: this.$t('page.rule.detail.judge_not_equal'),
          value: '!='
        },
        {
          label: this.$t('page.rule.detail.judge_greater_than'),
          value: '>'
        },
        {
          label: this.$t('page.rule.detail.judge_less_than'),
          value: '<'
        },
        {
          label: this.$t('page.rule.detail.judge_greater_than_equal'),
          value: '>='
        },
        {
          label: this.$t('page.rule.detail.judge_less_than_equal'),
          value: '<='
        },
        {
          label: this.$t('page.rule.detail.judge_contain'),
          value: 'system.Contains'
        },
        {
          label: this.$t('page.rule.detail.judge_has_prefix'),
          value: 'system.HasPrefix'
        },
        {
          label: this.$t('page.rule.detail.judge_has_suffix'),
          value: 'system.HasSuffix'
        },
      ],
      relation_symbol_option: [{
        label: this.$t('page.rule.detail.judge_logic_and'),
        value: '&&'
      },
      {
        label: this.$t('page.rule.detail.judge_logic_or'),
        value: '||'
      },
      ],
      formData: {
        ...copyObj(RULE),
      },
      formCodemirrorContent: '',//代码传入值
      //主机列表
      host_options: [],
      //uuid标识
      ruleuuid: "",
      //来源日志的字符串
      fromLogContentStr: "",
      //来源的字段
      fromSourcePoint: "",
      //获取的detail的值
      ruleDetail: {},
      rulePreviewContent: "",//规则预览内容
    };
  },
  beforeRouteUpdate(to, from) {
    console.log('beforeRouteUpdate')
  },
  mounted() {
    let that = this

    this.loadHostList()
    console.log('----mounted----')
    console.log(RULE)
    this.$bus.$on('codeedit', (e) => {
      console.log('消息总线 来自子组件e', e)
      this.formCodemirrorContent = e
    })
    //console.log(this.$route.params.req_uuid);
    if (this.$route.query.code != undefined) {

      this.op_rule_no = this.$route.query.code
      this.getDetail(this.op_rule_no);
    }
    if (this.$route.query.type != undefined) {

      this.op_type = this.$route.query.type

      if (this.op_type == "add" && this.$route.query.sourcePoint != undefined) {
        this.formData.is_manual_rule = this.$route.query.is_manual_rule
        this.fromLogContentStr = this.$route.query.contentstr
        this.formData.rule_base.rule_domain_code = this.$route.query.host_code
        this.fromSourcePoint = this.$route.query.sourcePoint
        this.setRuleContentByMode()
      } else if (this.op_type == "add" && this.$route.query.sourcePoint == undefined) {
        this.fromSourcePoint = "url"
        this.setRuleContentByMode()
      }
    }
  },
  beforeCreate() {
    console.log('----beforeCreate----')
  },
  created() {
    console.log('----created----')
    this.ruleuuid = this.genUuidv4()
    console.log(this.ruleuuid)
  },
  beforeMount() {
    console.log('----beforeMount----')
  },
  beforeUpdate() {
    console.log('----beforeUpdate----')
  },
  updated() {
    console.log('----updated----')
  },
  watch: {
    '$route.query.type'(newVal, oldVal) {
      console.log('route.query.type changed', newVal, oldVal)
      this.op_type = newVal
    },
    '$route.query.code'(newVal, oldVal) {
      console.log('route.query.code changed', newVal, oldVal)
      this.op_rule_no = newVal
      this.getDetail(newVal)
    },
  },
  methods: {
    // 重置表单数据
    resetFormData() {
      console.log('重置表单数据')
      // 重新生成UUID
      this.ruleuuid = this.genUuidv4()

      console.log("重置表单数据 before", this.formData)
      // 重置表单数据为初始状态
      this.formData = {
        ...copyObj(RULE)
      }
      console.log("重置表单数据 after", this.formData)

      console.log("重置表单数据 rule", RULE)
      // 重置代码编辑器内容
      this.formCodemirrorContent = ''
      // 重置其他相关数据
      this.fromLogContentStr = ""
      this.fromSourcePoint = ""
      // 清空操作规则号
      this.op_rule_no = ""
    },
    backPage() {
      history.go(-1)
    },
    loadHostList() {
      let that = this;
      allhost().then((res) => {
        let resdata = res
        console.log(resdata)
        if (resdata.code === 0) {
          that.host_options = resdata.data;
        }
      })
        .catch((e: Error) => {
          console.log(e);
        })
    },
    getDetail(id) {
      let that = this
      wafRuleDetailApi(
        {
          CODE: id
        })
        .then((res) => {
          let resdata = res
          console.log("rule detail",resdata)
          if (resdata.code === 0) {

            //const { list = [] } = resdata.data;

            that.formData = JSON.parse(resdata.data.rule_content_json);
            that.formData.rule_status = resdata.data.rule_status
            that.ruleDetail = resdata.data

            console.log('返回的', that.formData)
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => { });
    },
    onSubmit({ result, firstError }): void {
      let that = this
      if (!firstError) {
        let postdata = {}
        let url = ''
        if (that.op_type == "add") {
          that.formData.rule_base.salience = parseInt(that.formData.rule_base.salience)
          that.formData.rule_content = that.formCodemirrorContent
          // 使用正则替换rule_content中的salience值
          that.formData.rule_content = that.formData.rule_content.replace(
            /salience\s+\d+/g,
            `salience ${that.formData.rule_base.salience}`
          )
          url = '/wafhost/rule/add'
          postdata = {
            rule_json: JSON.stringify(that.formData),
            is_manual_rule: parseInt(that.formData.is_manual_rule),
            rule_content: that.formCodemirrorContent,
            rule_code: that.ruleuuid,
            rule_status: that.formData.rule_status
          }
          console.log("rule add postdata",postdata);


          wafRuleAddApi(postdata)
            .then((res) => {
              let resdata = res
              console.log(resdata)
              if (resdata.code === 0) {
                that.$message.success(resdata.msg);
                that.resetFormData()
                this.$router.push(
                  {
                    path: '/waf-host/wafrule',
                  },
                );

              } else {
                that.$message.warning(resdata.msg);
              }
            })
            .catch((e: Error) => {
              console.log(e);
            })
        } else {
          url = '/wafhost/rule/edit'
          that.formData.rule_content = that.formCodemirrorContent
          that.formData.rule_base.salience = parseInt(that.formData.rule_base.salience)
          // 使用正则替换rule_content中的salience值
          that.formData.rule_content = that.formData.rule_content.replace(
            /salience\s+\d+/g,
            `salience ${that.formData.rule_base.salience}`
          )
          postdata = {
            code: that.op_rule_no,
            rule_json: JSON.stringify(that.formData),
            is_manual_rule: parseInt(that.formData.is_manual_rule),
            rule_content: that.formCodemirrorContent,
            rule_status: that.formData.rule_status
          }
          console.log("formCodemirrorContent", that.formCodemirrorContent)
          console.log('edit postdata', postdata)
          wafRuleEditApi(postdata)
            .then((res) => {
              let resdata = res
              console.log(resdata)
              if (resdata.code === 0) {
                that.$message.success(resdata.msg);
                that.resetFormData()
                this.$router.push(
                  {
                    path: '/waf-host/wafrule',
                  },
                );

              } else {
                that.$message.warning(resdata.msg);
              }
            })
            .catch((e: Error) => {
              console.log(e);
            })
        }
      } else {
        console.log('Errors: ', result);
        that.$message.warning(firstError);
      }
    },
    ruleDynAdd(add_type, parent_index) {
      console.log(add_type)
      console.log(parent_index)
      console.log(this.formData)
      switch (add_type) {
        case "cond":
          this.formData.rule_condition.relation_detail.push(copyObj(RULE_RELATION_DETAIL))
          break;
        case "assignment":
          this.formData.rule_do_assignment.push(copyObj(RULE_DO_ASSIGNMENT))
          break;
        case "method":
          console.log(RULE_DO_METHOD)
          this.formData.rule_do_method.push(copyObj(RULE_DO_METHOD))
          break;
        case "parms":
          console.log(RULE_DO_METHOD_PARM)
          console.log(this.formData.rule_do_method[parent_index])
          this.formData.rule_do_method[parent_index].parms.push(copyObj(RULE_DO_METHOD_PARM))
          break;
        default:
          break;
      }
    },
    ruleDynDel(del_type, index, parent_index) {
      console.log(del_type)
      console.log(index)
      console.log(this.formData)
      switch (del_type) {
        case "cond":
          this.formData.rule_condition.relation_detail.splice(index, 1)
          break;
        case "assignment":
          this.formData.rule_do_assignment.splice(index, 1)
          break;
        case "method":
          this.formData.rule_do_method.splice(index, 1)
          break;
        case "parms":
          this.formData.rule_do_method[parent_index].parms.splice(index, 1)
          break;
        default:
          break;
      }
    },
    edtinput(e) {
      console.log('来子组件', e)
    },
    getinfoClick(e) {
      console.log(e)

      console.log(this.$refs.changeSql)
    },
    //切换模式触发
    changeManualRule(e) {
      console.log("changeManualRule", e, this.formData.rule_content)

      /*if(this.formData.rule_content!=""){
        return
      }*/
      console.log("changeManualRule", e)

      //手工编排
      if (e == "1") {
        this.setRuleContentByMode()
      }else{
        // 触发规则预览
        this.onFormChange()
      }
    },
    setRuleContentByMode() {
      let that = this
      let rulename = this.ruleuuid.replace(/-/g, "")// 这个全局替换查找到的字符
      let ruleremark = this.formData.rule_base.rule_name
      let rule_salience = parseInt(this.formData.rule_base.salience)
      let bean = "USER_AGENT";
      switch (this.fromSourcePoint) {
        case "url": bean = "URL"; break
        case "header": bean = "HEADER"; break
        case "user_agent": bean = "USER_AGENT"; break
        case "cookies": bean = "COOKIES"; break
        case "body": bean = "BODY"; break
      }
      let rule_condition = "MF." + bean + ".Contains(\"" + that.fromLogContentStr + "\")==true"
      let rule_action = ""
      let str = `rule R${rulename} "${ruleremark}" salience ${rule_salience} {
            when
                ${rule_condition}
            then
                ${rule_action}
        		Retract("R${rulename}");
        } `;
      this.$nextTick(() => {
        that.$bus.$emit("showcodeedit", str)
      });
    },
    //跳转界面
    handleJumpOnlineUrl() {
      window.open(this.samwafglobalconfig.getOnlineUrl() + "/guide/Rule.html#_1-脚本编辑");
    },
    //引导创建网站
    handleJumpAttackLogOperation() {
      this.$router.push(
        {
          path: '/waf/wafattacklog',
          query: {
            sourcePage: "AddRule",
          },
        },
      );
    },
    //end method
    onAttrChange(item) {
      // 依据选择的范围，自动调整值类型
      if ((item.attr || '').toUpperCase() === 'PORT') {
        item.attr_type = 'int'
      } else {
        item.attr_type = 'string'
      }
      // 触发规则预览
      this.onFormChange()
    },
    onFormChange() {
      // 编排模式下任意字段变更后，刷新预览
      this.fetchRulePreview()
    },
    buildPreviewPayload() {
      // 统一构造 RuleJson（与后端 RuleInfo JSON结构一致）
      const ruleJsonObj = {
        is_manual_rule: this.formData.is_manual_rule,
        rule_content: this.formData.rule_content,
        rule_base: this.formData.rule_base,
        rule_condition: this.formData.rule_condition,
        rule_do_assignment: this.formData.rule_do_assignment,
        rule_do_method: this.formData.rule_do_method,
      }
      let ruleCode = "";
      console.log("buildPreviewPayload this.ruledetail",this.ruleDetail)
      //如果是编辑的情况下 需要把code也传进去
      if(this.ruleDetail && this.ruleDetail.rule_code){
          ruleCode = this.ruleDetail.rule_code
      }else{
          ruleCode = this.ruleuuid.replace(/-/g, "")// 这个全局替换查找到的字符
      }
      return {
        rule_code: ruleCode,
        rule_json: JSON.stringify(ruleJsonObj),
        is_manual_rule: Number(this.formData.is_manual_rule),
        rule_content: this.formData.rule_content || '',
      }
    },
    async fetchRulePreview() {
      try {
        const payload = this.buildPreviewPayload()
        console.log("fetchRulePreview",payload)
        const res = await wafRuleFormatApi(payload)
        const resdata = res
        if (resdata.code === 0) {
          this.rulePreviewContent = (resdata.data && resdata.data.rule_content) ? resdata.data.rule_content : ''
        } else {
          this.$message.warning(resdata.msg || '预览格式化失败')
        }
      } catch (e) {
        console.log(e)
        this.$message.error('预览请求异常')
      }
    },
     onAttrJudgeChange(item) {
      const isFunc = (item.attr_judge || '').startsWith('system.')
      if (!isFunc) {
        item.attr_val2 = ''
      } else {
        // 切换为函数时，默认置为 true（仅在为空或非 true/false 时）
        if (item.attr_val2 !== 'true' && item.attr_val2 !== 'false') {
          item.attr_val2 = 'true'
        }
      }
      if (typeof this.onFormChange === 'function') {
        this.onFormChange()
      }
    },
    genUuidv4(){ 
      let uuid = uuidv4()
      console.log("genUuidv4",uuid);
      return uuid
    },
    //end method
  },
};
</script>
<style lang="less" scoped>
@import './index';

.rule-example-container {
  margin-top: 16px;
  border: 1px solid #e7e7e7;
  border-radius: 6px;
  overflow: hidden;
}

.rule-example-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e7e7e7;

  .t-icon {
    margin-right: 8px;
    color: #0052d9;
  }
}

.rule-example-title {
  font-weight: 500;
  color: #333;
}

.rule-example-code {
  margin: 0;
  padding: 12px;
  background-color: #fafafa;
  font-family: Consolas, Monaco, 'Andale Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre;
  overflow-x: auto;
}
</style>
