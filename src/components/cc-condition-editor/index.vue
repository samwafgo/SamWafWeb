<template>
  <div class="cc-cond-editor">
    <div v-for="(cond, idx) in localConds" :key="idx" class="cc-cond-row">
      <span v-if="idx > 0" class="cc-cond-and">{{ $t('page.ccrule.cond_and') }}</span>
      <div class="cc-cond-body">
        <div class="cc-cond-line">
          <!-- 匹配目标 -->
          <t-select v-model="cond.field" :style="{ width: '170px' }" @change="onFieldChange(cond)">
            <t-option-group :label="$t('page.ccrule.field_group_request')">
              <t-option v-for="f in fieldsRequest" :key="f.value" :value="f.value" :label="f.label" />
            </t-option-group>
            <t-option-group :label="$t('page.ccrule.field_group_common_header')">
              <t-option v-for="f in fieldsCommonHeader" :key="f.value" :value="f.value" :label="f.label" />
            </t-option-group>
            <t-option-group :label="$t('page.ccrule.field_group_need_key')">
              <t-option v-for="f in fieldsNeedKey" :key="f.value" :value="f.value" :label="f.label" />
            </t-option-group>
            <t-option-group :label="$t('page.ccrule.field_group_client')">
              <t-option v-for="f in fieldsClient" :key="f.value" :value="f.value" :label="f.label" />
            </t-option-group>
            <t-option-group :label="$t('page.ccrule.field_group_response')">
              <t-option v-for="f in fieldsResponse" :key="f.value" :value="f.value" :label="f.label" />
            </t-option-group>
          </t-select>

          <!-- 字段名：只有请求头/Cookie/查询参数/请求体字段才需要 -->
          <t-input v-if="needKey(cond.field)" v-model="cond.key" :style="{ width: '160px' }"
            :placeholder="$t('page.ccrule.cond_key_placeholder')" />

          <!-- 判断方式 -->
          <t-select v-model="cond.op" :style="{ width: '150px' }" @change="onOpChange(cond)">
            <t-option v-for="o in availableOps(cond.field)" :key="o.value" :value="o.value" :label="o.label" />
          </t-select>

          <!-- 值控件：形态由判断方式决定 -->
          <div class="cc-cond-val">
            <span v-if="opArity(cond.op) === 0" class="cc-cond-novalue">
              {{ $t('page.ccrule.cond_no_value') }}
            </span>
            <template v-else-if="opArity(cond.op) === -1">
              <t-select v-if="usePreset(cond)" multiple filterable creatable :style="{ width: '100%' }"
                :value="cond.value" @change="(v) => setArr(cond, v)" @create="(v) => onCreatePreset(cond, v)"
                :placeholder="$t('page.ccrule.cond_preset_placeholder')">
                <t-option v-for="o in optionsFor(cond)" :key="o.value" :value="o.value" :label="o.label" />
              </t-select>
              <t-tag-input v-else :value="cond.value" @change="(v) => setArr(cond, v)"
                :style="{ width: '100%' }" :placeholder="$t('page.ccrule.cond_multi_placeholder')" clearable />
            </template>
            <div v-else-if="opArity(cond.op) === 2" class="cc-cond-between">
              <t-input :value="cond.value[0]" @change="(v) => setVal(cond, 0, v)" :style="{ width: '120px' }"
                :placeholder="$t('page.ccrule.cond_min')" />
              <span class="cc-cond-tilde">~</span>
              <t-input :value="cond.value[1]" @change="(v) => setVal(cond, 1, v)" :style="{ width: '120px' }"
                :placeholder="$t('page.ccrule.cond_max')" />
            </div>
            <t-select v-else-if="usePreset(cond)" filterable creatable :style="{ width: '100%' }"
              :value="cond.value[0]" @change="(v) => setVal(cond, 0, v)" @create="(v) => onCreatePreset(cond, v)"
              :placeholder="$t('page.ccrule.cond_preset_placeholder')">
              <t-option v-for="o in optionsFor(cond)" :key="o.value" :value="o.value" :label="o.label" />
            </t-select>
            <t-input v-else :value="cond.value[0]" @change="(v) => setVal(cond, 0, v)" :style="{ width: '100%' }"
              :placeholder="cond.op === 'regex' ? $t('page.ccrule.cond_regex_placeholder') : $t('page.ccrule.cond_value')" />
          </div>

          <t-button variant="outline" theme="danger" size="small" @click="removeCond(idx)">
            {{ $t('common.delete') }}
          </t-button>
        </div>

        <div v-if="needKey(cond.field)" class="cc-cond-hint">
          {{ $t('page.ccrule.cond_key_hint') }}
        </div>
      </div>
    </div>

    <t-button variant="outline" size="small" @click="addCond">
      + {{ $t('page.ccrule.cond_add') }}
    </t-button>
    <div class="cc-cond-hint cc-cond-hint-block">{{ $t('page.ccrule.cond_op_hint') }}</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

// 需要指定字段名的匹配目标：光有「目标+判断+值」表达不了「取哪个头」
const NEED_KEY_FIELDS = ['header', 'cookie', 'query', 'body'];

// 判断方式需要几个值：0=不需要 1=一个 2=两个 -1=任意多个。
// 这张表决定右侧值控件的形态，与后端的校验规则一一对应。
const OP_ARITY = {
  eq: 1, ne: 1, contains: 1, not_contains: 1, prefix: 1, suffix: 1,
  regex: 1, gt: 1, lt: 1, in: -1, not_in: -1, between: 2,
  exists: 0, not_exists: 0,
};

// 常用取值预设：可点选，也能直接输入没列出的值（creatable）。
// 取值口径必须与后端 ccrule/matcher.go 的 fieldValues 完全一致，否则点出来的规则永远不命中：
//   ext  取的是 path.Ext()，**带点**且已转小写（.js 不是 js）
//   scheme 只有 http / https 两种
//   is_bot 是数字字符串 "0" / "1"
//   resp_content_type 是响应头原文，常带 "; charset=utf-8"，所以多用「前缀匹配 / 包含」而不是等于
const PRESET_VALUES = {
  method: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  scheme: ['http', 'https'],
  ext: [
    '.html', '.htm', '.php', '.asp', '.aspx', '.jsp', '.do', '.action',
    '.json', '.xml', '.js', '.css', '.png', '.jpg', '.jpeg', '.gif',
    '.webp', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.map',
    '.txt', '.pdf', '.zip',
  ],
  status_code: ['200', '204', '301', '302', '304', '400', '401', '403', '404',
    '405', '408', '429', '499', '500', '502', '503', '504'],
  resp_content_type: [
    'text/html', 'application/json', 'text/plain', 'text/css',
    'application/javascript', 'text/javascript', 'image/png', 'image/jpeg',
    'image/gif', 'image/svg+xml', 'application/octet-stream',
    'text/xml', 'application/xml', 'application/pdf',
  ],
  is_bot: ['1', '0'],
};

// 正则的值是用户自己写的表达式，给预设下拉没有意义
const NO_PRESET_OPS = ['regex'];

// 只能用于数值型目标的判断方式
const NUMERIC_ONLY_OPS = ['gt', 'lt', 'between'];
const NUMERIC_FIELDS = ['is_bot', 'body_length', 'status_code', 'resp_length', 'upstream_cost'];

export default Vue.extend({
  name: 'CcConditionEditor',
  props: {
    value: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      localConds: [],
      // 用户自己输入的、不在预设里的取值。放组件级而不是挂在 cond 上：
      // 挂上去会被 v-model 一起 emit 出去，而 normalize 又会把它抹掉，
      // 两边内容对不上就会一直重建，正好把刚修好的回环再点着。
      customOpts: {},
    };
  },
  computed: {
    fieldsRequest() {
      return [
        { value: 'uri', label: this.$t('page.ccrule.field_uri') },
        { value: 'query_str', label: this.$t('page.ccrule.field_query_str') },
        { value: 'method', label: this.$t('page.ccrule.field_method') },
        { value: 'host', label: this.$t('page.ccrule.field_host') },
        { value: 'ext', label: this.$t('page.ccrule.field_ext') },
        { value: 'scheme', label: this.$t('page.ccrule.field_scheme') },
        { value: 'body_length', label: this.$t('page.ccrule.field_body_length') },
      ];
    },
    fieldsCommonHeader() {
      return [
        { value: 'user_agent', label: 'User-Agent' },
        { value: 'referer', label: 'Referer' },
      ];
    },
    fieldsNeedKey() {
      return [
        { value: 'header', label: this.$t('page.ccrule.field_header') },
        { value: 'cookie', label: this.$t('page.ccrule.field_cookie') },
        { value: 'query', label: this.$t('page.ccrule.field_query') },
        { value: 'body', label: this.$t('page.ccrule.field_body') },
      ];
    },
    fieldsClient() {
      return [
        { value: 'client_ip', label: this.$t('page.ccrule.field_client_ip') },
        { value: 'country', label: this.$t('page.ccrule.field_country') },
        { value: 'province', label: this.$t('page.ccrule.field_province') },
        { value: 'city', label: this.$t('page.ccrule.field_city') },
        { value: 'is_bot', label: this.$t('page.ccrule.field_is_bot') },
      ];
    },
    fieldsResponse() {
      return [
        { value: 'resp_content_type', label: this.$t('page.ccrule.field_resp_content_type') },
        { value: 'status_code', label: this.$t('page.ccrule.field_status_code') },
        { value: 'resp_length', label: this.$t('page.ccrule.field_resp_length') },
        { value: 'upstream_cost', label: this.$t('page.ccrule.field_upstream_cost') },
      ];
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(val) {
        // 只有外部真的换了一份数据才重建本地副本。
        // 少了这道判断就会形成回环：本地一改 → emit 出去 → 父级 v-model 回填 value →
        // 这里 normalize 重建出新数组 → deep 监听又触发 emit …… 切换判断方式时
        // onOpChange 会给 cond.value 赋新数组，正好把这个回环点着，页面直接卡死。
        if (this.sameAsLocal(val)) return;
        this.localConds = this.normalize(val);
      },
    },
    localConds: {
      deep: true,
      handler(val) {
        this.$emit('input', val);
        this.$emit('change', val);
      },
    },
  },
  methods: {
    // 两边都过一遍 normalize 再比，避免"外部少个 key 字段"这类差异被当成真的变了
    sameAsLocal(val) {
      try {
        return JSON.stringify(this.normalize(val)) === JSON.stringify(this.localConds);
      } catch (e) {
        return false;
      }
    },
    // 后端存的 value 统一是数组；界面按判断方式取用其中的第 0/1 项
    normalize(list) {
      if (!Array.isArray(list) || list.length === 0) {
        return [this.blankCond()];
      }
      return list.map((c) => ({
        field: c.field || 'uri',
        key: c.key || '',
        op: c.op || 'prefix',
        value: Array.isArray(c.value) ? [...c.value] : (c.value ? [c.value] : ['']),
      }));
    },
    blankCond() {
      return { field: 'uri', key: '', op: 'prefix', value: [''] };
    },
    // Vue2 里给数组下标直接赋值不是响应式的，必须走 $set，否则输入的值不会进入监听链
    setVal(cond, idx, v) {
      const next = Array.isArray(cond.value) ? [...cond.value] : [];
      while (next.length <= idx) next.push('');
      next[idx] = v;
      this.$set(cond, 'value', next);
    },
    // 有预设可点选：正则除外（那是用户自己写的表达式），无值/区间两类也用不上
    usePreset(cond) {
      if (!PRESET_VALUES[cond.field]) return false;
      if (NO_PRESET_OPS.indexOf(cond.op) >= 0) return false;
      const arity = this.opArity(cond.op);
      return arity === 1 || arity === -1;
    },
    // 预设 + 用户自建 + 当前已选中的值（编辑旧规则时值可能不在预设里，也要能显示出来）
    optionsFor(cond) {
      const seen = {};
      const out = [];
      const push = (v) => {
        const val = String(v);
        if (val === '' || seen[val]) return;
        seen[val] = true;
        out.push({ value: val, label: val });
      };
      (PRESET_VALUES[cond.field] || []).forEach(push);
      (this.customOpts[cond.field] || []).forEach(push);
      (Array.isArray(cond.value) ? cond.value : []).forEach(push);
      if (cond.field === 'is_bot') {
        return out.map((o) => ({
          value: o.value,
          label: o.value === '1' ? this.$t('page.ccrule.cond_yes') : this.$t('page.ccrule.cond_no'),
        }));
      }
      return out;
    },
    // 用户输入了预设之外的值：记下来，让它在下拉里也能显示与再次选中
    onCreatePreset(cond, v) {
      const val = String(v || '').trim();
      if (!val) return;
      const cur = this.customOpts[cond.field] || [];
      if (cur.indexOf(val) < 0) this.$set(this.customOpts, cond.field, [...cur, val]);
      if (this.opArity(cond.op) === -1) {
        const vals = Array.isArray(cond.value) ? cond.value : [];
        if (vals.indexOf(val) < 0) this.$set(cond, 'value', [...vals, val]);
      } else {
        this.setVal(cond, 0, val);
      }
    },
    setArr(cond, v) {
      this.$set(cond, 'value', Array.isArray(v) ? v : []);
    },
    needKey(field) {
      return NEED_KEY_FIELDS.indexOf(field) >= 0;
    },
    opArity(op) {
      return OP_ARITY[op] === undefined ? 1 : OP_ARITY[op];
    },
    availableOps(field) {
      const numeric = NUMERIC_FIELDS.indexOf(field) >= 0;
      const all = [
        { value: 'eq', label: this.$t('page.ccrule.op_eq') },
        { value: 'ne', label: this.$t('page.ccrule.op_ne') },
        { value: 'contains', label: this.$t('page.ccrule.op_contains') },
        { value: 'not_contains', label: this.$t('page.ccrule.op_not_contains') },
        { value: 'prefix', label: this.$t('page.ccrule.op_prefix') },
        { value: 'suffix', label: this.$t('page.ccrule.op_suffix') },
        { value: 'regex', label: this.$t('page.ccrule.op_regex') },
        { value: 'in', label: this.$t('page.ccrule.op_in') },
        { value: 'not_in', label: this.$t('page.ccrule.op_not_in') },
        { value: 'gt', label: this.$t('page.ccrule.op_gt') },
        { value: 'lt', label: this.$t('page.ccrule.op_lt') },
        { value: 'between', label: this.$t('page.ccrule.op_between') },
        { value: 'exists', label: this.$t('page.ccrule.op_exists') },
        { value: 'not_exists', label: this.$t('page.ccrule.op_not_exists') },
      ];
      // 非数值目标不给大小比较，避免配出永远不成立的条件
      return numeric ? all : all.filter((o) => NUMERIC_ONLY_OPS.indexOf(o.value) < 0);
    },
    onFieldChange(cond) {
      if (!this.needKey(cond.field)) {
        cond.key = '';
      }
      // 目标换成非数值型后，原来的大小比较不再适用
      if (NUMERIC_ONLY_OPS.indexOf(cond.op) >= 0 && NUMERIC_FIELDS.indexOf(cond.field) < 0) {
        cond.op = 'eq';
        this.onOpChange(cond);
        return;
      }
      // 换到取值可枚举的目标时，把默认的「前缀匹配」调成「等于」——只在还是默认值时调整，
      // 用户显式选过的判断方式不动。响应 Content-Type 例外：它的值常带 "; charset=utf-8"，
      // 等于几乎不会成立，仍保持前缀匹配。
      if (cond.op === 'prefix' && PRESET_VALUES[cond.field] && cond.field !== 'resp_content_type') {
        cond.op = 'eq';
        this.onOpChange(cond);
      }
    },
    // 切换判断方式时保留能保留的值，其余丢弃：
    // 从多选切到单值只留第一个，切到无值类则清空，避免把界面残留值提交到后端
    onOpChange(cond) {
      const arity = this.opArity(cond.op);
      const cur = Array.isArray(cond.value) ? cond.value.filter((v) => v !== '' && v !== null) : [];
      if (arity === 0) {
        cond.value = [];
      } else if (arity === -1) {
        cond.value = cur;
      } else if (arity === 2) {
        cond.value = [cur[0] || '', cur[1] || ''];
      } else {
        cond.value = [cur[0] || ''];
      }
    },
    addCond() {
      this.localConds.push(this.blankCond());
    },
    removeCond(idx) {
      this.localConds.splice(idx, 1);
      if (this.localConds.length === 0) {
        this.localConds.push(this.blankCond());
      }
    },
    // 供父组件在提交前取规范化结果
    getConditions() {
      return this.localConds.map((c) => {
        const arity = this.opArity(c.op);
        const item = { field: c.field, op: c.op, value: [] };
        if (this.needKey(c.field)) {
          item.key = (c.key || '').trim();
        }
        if (arity !== 0) {
          item.value = (c.value || []).filter((v) => v !== '' && v !== null && v !== undefined);
        }
        return item;
      });
    },
  },
});
</script>

<style lang="less" scoped>
/* 编辑器整体是表单行里的一个 flex 项，不撑满就会被同行元素挤窄 */
.cc-cond-editor {
  width: 100%;
}

.cc-cond-row {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
}

.cc-cond-and {
  position: absolute;
  left: -46px;
  top: 8px;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  border: 1px solid var(--td-component-border);
  border-radius: 2px;
  padding: 0 6px;
  background: var(--td-bg-color-container);
}

.cc-cond-body {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-default);
  padding: 12px;
  background: var(--td-bg-color-container-hover);
}

.cc-cond-line {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.cc-cond-val {
  flex: 1;
  min-width: 0;
}

.cc-cond-between {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cc-cond-tilde {
  color: var(--td-text-color-placeholder);
}

.cc-cond-novalue {
  display: inline-block;
  line-height: 32px;
  font-size: 13px;
  color: var(--td-text-color-placeholder);
}

.cc-cond-hint {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  margin-top: 6px;
}

.cc-cond-hint-block {
  margin-top: 8px;
}
</style>
