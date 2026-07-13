<template>
  <div class="in-coder-panel">
    <textarea ref="mycode" v-model="code" class="text_cls" ></textarea>
  </div>
</template>

<script>

import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/hint/show-hint.css'
const CodeMirror = require('codemirror/lib/codemirror')
require('codemirror/addon/edit/matchbrackets')
require('codemirror/addon/selection/active-line')
require('codemirror/mode/sql/sql')
require('codemirror/addon/hint/show-hint')
require('codemirror/addon/hint/sql-hint')

// ============ SamWaf 规则自动补全词库（中英双语） ============
// 与规则编辑页的字段/函数保持一致，用户写规则时按 . 或 Ctrl+空格即可弹出提示，无需记忆
// 每一项: text=插入的代码；dispZh/dispEn=下拉显示名(缺省用 text)；zh/en=中英文解释
// 当前语言，由组件 mounted 时按 i18n locale 设置
let wafLang = 'zh_CN'

// MF.<字段> —— 当前请求的信息
const MF_FIELDS = [
  { text: 'HOST', zh: '请求域名', en: 'Request host' },
  { text: 'URL', zh: '请求地址(含路径)', en: 'Request URL (with path)' },
  { text: 'REFERER', zh: '来源页 Referer', en: 'Referer header' },
  { text: 'USER_AGENT', zh: '浏览器标识 UA', en: 'User-Agent' },
  { text: 'METHOD', zh: '请求方法 GET/POST...', en: 'HTTP method GET/POST...' },
  { text: 'COOKIES', zh: '请求 Cookie', en: 'Request cookies' },
  { text: 'BODY', zh: '请求体内容', en: 'Request body' },
  { text: 'PORT', zh: '访问端口(数值)', en: 'Port (number)' },
  { text: 'SRC_IP', zh: '访客来源IP', en: 'Client source IP' },
  { text: 'COUNTRY', zh: '国家(如 中国)', en: 'Country (e.g. 中国)' },
  { text: 'PROVINCE', zh: '省份', en: 'Province' },
  { text: 'CITY', zh: '城市', en: 'City' },
]
// MF 上的方法
const MF_METHODS = [
  { text: 'GetHeaderValue("")', dispZh: 'GetHeaderValue(头名)', dispEn: 'GetHeaderValue(name)', zh: '取指定请求头的值', en: 'Get a request header value' },
  { text: 'GetIPFailureCount(5)', dispZh: 'GetIPFailureCount(分钟)', dispEn: 'GetIPFailureCount(minutes)', zh: '近N分钟内该IP失败次数', en: 'IP failure count in last N minutes' },
  { text: 'IsSafeBot()', zh: '是否搜索引擎等安全爬虫', en: 'Is a known safe bot (search engine)' },
]
// 字符串字段(如 MF.URL)上的方法
const STR_METHODS = [
  { text: 'Contains("")', dispZh: 'Contains(子串)', dispEn: 'Contains(substr)', zh: '包含指定子串', en: 'Contains substring' },
  { text: 'HasPrefix("")', dispZh: 'HasPrefix(前缀)', dispEn: 'HasPrefix(prefix)', zh: '以指定前缀开头', en: 'Starts with prefix' },
  { text: 'HasSuffix("")', dispZh: 'HasSuffix(后缀)', dispEn: 'HasSuffix(suffix)', zh: '以指定后缀结尾', en: 'Ends with suffix' },
]
// RF.<函数> —— 规则函数与命中动作
const RF_FUNCS = [
  // 动作（用在 then 里，必须以分号结尾，grule 语法要求）
  { text: 'Deny();', dispZh: 'Deny()', dispEn: 'Deny()', zh: '动作：命中即拦截(默认)', en: 'Action: block on match (default)' },
  { text: 'Allow();', dispZh: 'Allow()', dispEn: 'Allow()', zh: '动作：放行(后续检测照常)', en: 'Action: allow (later checks still run)' },
  { text: 'Allow("CC");', dispZh: 'Allow(模块...)', dispEn: 'Allow(modules...)', zh: '动作：放行并跳过指定检测(CC/AI/SQLI...)', en: 'Action: allow and skip given checks' },
  { text: 'AllowAll();', dispZh: 'AllowAll()', dispEn: 'AllowAll()', zh: '动作：放行并跳过后续所有检测', en: 'Action: allow and skip all later checks' },
  { text: 'Log();', dispZh: 'Log()', dispEn: 'Log()', zh: '动作：仅记录不拦截', en: 'Action: log only, do not block' },
  // IP 函数
  { text: 'IPInRange(MF.SRC_IP, "", "")', dispZh: 'IPInRange(ip,起,止)', dispEn: 'IPInRange(ip,start,end)', zh: 'IP是否在起止区间内', en: 'IP within start-end range' },
  { text: 'IPInRanges(MF.SRC_IP, "")', dispZh: 'IPInRanges(ip,区间...)', dispEn: 'IPInRanges(ip,ranges...)', zh: 'IP是否在多个区间/CIDR之一', en: 'IP in any range/CIDR' },
  { text: 'IPInCIDR(MF.SRC_IP, "")', dispZh: 'IPInCIDR(ip,cidr)', dispEn: 'IPInCIDR(ip,cidr)', zh: 'IP是否在CIDR网段内', en: 'IP within CIDR' },
  { text: 'IPEquals(MF.SRC_IP, "")', dispZh: 'IPEquals(ip1,ip2)', dispEn: 'IPEquals(ip1,ip2)', zh: '两个IP是否相等', en: 'Two IPs equal' },
  // 字符串函数
  { text: 'In(MF.METHOD, "")', dispZh: 'In(值,列表...)', dispEn: 'In(value,list...)', zh: '值是否等于列表中任意一个', en: 'Value in list' },
  { text: 'InIgnoreCase(MF.METHOD, "")', dispZh: 'InIgnoreCase(值,列表...)', dispEn: 'InIgnoreCase(value,list...)', zh: '同 In，忽略大小写', en: 'In, case-insensitive' },
  { text: 'ContainsAny(MF.URL, "")', dispZh: 'ContainsAny(串,子串...)', dispEn: 'ContainsAny(str,subs...)', zh: '包含任意一个子串', en: 'Contains any substring' },
  { text: 'ContainsAnyIgnoreCase(MF.USER_AGENT, "")', dispZh: 'ContainsAnyIgnoreCase(串,子串...)', dispEn: 'ContainsAnyIgnoreCase(str,subs...)', zh: '包含任意一个(忽略大小写)', en: 'Contains any, case-insensitive' },
  { text: 'ContainsAll(MF.URL, "")', dispZh: 'ContainsAll(串,子串...)', dispEn: 'ContainsAll(str,subs...)', zh: '同时包含全部子串', en: 'Contains all substrings' },
  { text: 'StartsWithAny(MF.URL, "")', dispZh: 'StartsWithAny(串,前缀...)', dispEn: 'StartsWithAny(str,prefixes...)', zh: '以任意一个前缀开头', en: 'Starts with any prefix' },
  { text: 'EndsWithAny(MF.URL, "")', dispZh: 'EndsWithAny(串,后缀...)', dispEn: 'EndsWithAny(str,suffixes...)', zh: '以任意一个后缀结尾', en: 'Ends with any suffix' },
  // 数值函数
  { text: 'IntInRange(MF.PORT, 0, 0)', dispZh: 'IntInRange(数,min,max)', dispEn: 'IntInRange(n,min,max)', zh: '整数是否在区间内', en: 'Integer within range' },
  { text: 'IntIn(MF.PORT, 0)', dispZh: 'IntIn(数,列表...)', dispEn: 'IntIn(n,list...)', zh: '整数是否等于列表中任意一个', en: 'Integer in list' },
  // 逻辑辅助
  { text: 'Not()', zh: '逻辑取反', en: 'Logical NOT' },
  { text: 'IsEmpty()', zh: '字符串是否为空', en: 'String is empty' },
  { text: 'IsNotEmpty()', zh: '字符串是否非空', en: 'String is not empty' },
  { text: 'LengthBetween(MF.URL, 0, 0)', dispZh: 'LengthBetween(串,min,max)', dispEn: 'LengthBetween(str,min,max)', zh: '长度是否在区间内', en: 'Length within range' },
]
// 顶层关键字
const TOPLEVEL = [
  { text: 'rule R00000000 "规则描述" salience 10 {\n    when\n        \n    then\n        RF.Deny();\n}', dispZh: 'rule 规则骨架', dispEn: 'rule skeleton', zh: '插入一条完整规则模板', en: 'Insert a full rule template' },
  { text: 'when', zh: '条件开始', en: 'condition block' },
  { text: 'then', zh: '动作开始', en: 'action block' },
  { text: 'salience', zh: '优先级(数值越大越先命中)', en: 'priority (higher wins first)' },
  { text: 'MF.', zh: '当前请求信息(字段/方法)', en: 'current request (fields/methods)' },
  { text: 'RF.', zh: '规则函数与命中动作', en: 'rule functions & actions' },
]

// 取当前语言的显示名/解释
function wafDisp(it) {
  const en = String(wafLang).toLowerCase().indexOf('en') === 0
  return (en ? it.dispEn : it.dispZh) || it.displayText || it.text
}
function wafDesc(it) {
  const en = String(wafLang).toLowerCase().indexOf('en') === 0
  return (en ? it.en : it.zh) || ''
}

// 提示项渲染：名称 + 灰色解释
function renderWafHint(el, self, data) {
  const name = document.createElement('span')
  name.className = 'waf-hint-name'
  name.textContent = data.displayText || data.text
  const desc = document.createElement('span')
  desc.className = 'waf-hint-desc'
  desc.textContent = data.desc || ''
  el.appendChild(name)
  el.appendChild(desc)
}

// 自定义补全逻辑：按 . 之前的上下文给出对应的字段/方法/函数
function wafHint(cm) {
  const cur = cm.getCursor()
  const line = cm.getLine(cur.line)
  const end = cur.ch
  let start = end
  while (start > 0 && /[\w.]/.test(line.charAt(start - 1))) start--
  const token = line.slice(start, end)

  let items
  let fromCh
  if (/MF\.\w+\.\w*$/.test(token)) {
    // MF.<字段>.  → 字符串方法
    items = STR_METHODS
    fromCh = start + token.lastIndexOf('.') + 1
  } else if (/MF\.\w*$/.test(token)) {
    // MF.  → 字段 + MF 方法
    items = MF_FIELDS.concat(MF_METHODS)
    fromCh = start + token.lastIndexOf('.') + 1
  } else if (/RF\.\w*$/.test(token)) {
    // RF.  → 函数与动作
    items = RF_FUNCS
    fromCh = start + token.lastIndexOf('.') + 1
  } else {
    items = TOPLEVEL
    fromCh = start
  }

  const prefix = line.slice(fromCh, end).toLowerCase()
  let matched = items.filter((it) => {
    return it.text.toLowerCase().indexOf(prefix) === 0 || wafDisp(it).toLowerCase().indexOf(prefix) === 0
  })
  if (!matched.length) matched = items
  const list = matched.map((it) => ({
    text: it.text,
    displayText: wafDisp(it),
    desc: wafDesc(it),
    render: renderWafHint,
  }))

  return {
    list,
    from: CodeMirror.Pos(cur.line, fromCh),
    to: CodeMirror.Pos(cur.line, end),
  }
}

export default {
  props: {
    // 外部传入的内容 
    valuecontent:{
      type:String,

    } ,
    // 外部传入的语法类型
    language: {
      type: String,
      default: null,
    },
  },
  watch: {
    valuecontent(newVal) {
      console.log('valuecontent',newVal)
       this.editor.setValue(newVal)
    },
  },
  data() {
    return {
      code: '',
      editor: null,
      content: '',
   	}
  },
  mounted() {
    // 同步当前界面语言，让补全提示的解释跟随中英文切换
    try {
      wafLang = (this.$i18n && this.$i18n.locale) || localStorage.getItem('lang') || 'zh_CN'
    } catch (e) {
      wafLang = 'zh_CN'
    }
    // 初始化
    this._initialize()
    let that = this
    that.$bus.$on('showcodeedit', (e) => {
       console.log('消息总线 来自父组件e', e)
       that.code = e
       that.editor.setValue(that.code)
    })
  },
  methods: {
    send_msg_to_parent () {


       console.log(this.$parent)
       //this.$parent.edtinput("asdfadf")
    	//this.$emit('edtinput',"sdsdsd" )
       console.log("ssss")
    },
  	//父组件调用清空的方法
    resetData() {
      this.editor.setValue('')
    },
    // 初始化
    _initialize() {
      const mime = 'text/x-mariadb'
      // let theme = 'ambiance'//设置主题，不设置的会使用默认主题
      this.editor = CodeMirror.fromTextArea(this.$refs.mycode, {
     	// 选择对应代码编辑器的语言，我这边选的是数据库，根据个人情况自行设置即可
        mode: mime,
        indentWithTabs: true,
        smartIndent: true,
        lineNumbers: true,
        matchBrackets: true,
        extraKeys: {
          // Ctrl+空格 手动触发提示
          'Ctrl-Space': (cm) => cm.showHint({ hint: wafHint, completeSingle: false }),
        },
        hintOptions: {
          hint: wafHint,
          completeSingle: false, // 只有一项时不自动补全，交给用户确认
        },
      })
      this.editor.setValue(this.value || this.code)
      // 支持双向绑定
      let that =  this
      this.editor.on('change', (coder) => {
        this.code = coder.getValue()
        if (this.$emit) {
          // 通过监听Input事件可以拿到动态改变的code值
          //this.$emit('edtinput', this.code)
          console.log('在子组件里面edtinput', this.code)
          //this.$emit('update:valuecontent', this.code)
         /* setTimeout(() => {

          }, 0) */
          console.log(that.$parent)
          that.$bus.$emit("codeedit",this.code)
        }
      })
      // 输入字母或 . 时自动弹出提示，用户不用记字段名
      this.editor.on('inputRead', (cm, change) => {
        if (!change || !change.text || !change.text.length) return
        const ch = change.text[0]
        if (/[\w.]/.test(ch)) {
          cm.showHint({ hint: wafHint, completeSingle: false })
        }
      })
    },
  },
}
</script>

<style lang="less">
.CodeMirror {
  height: 180px !important;
}
.in-coder-panel {
  border-radius: 5px;
  flex-grow: 1;
  display: flex;
  position: relative;
  .text_cls {
  }
  .cm-variable {
    font-size: 18px;
  }
}
.CodeMirror {
  flex-grow: 1;
  z-index: 1;
}
.CodeMirror-code {
  line-height: 19px;
}

.code-mode-select {
  position: absolute;
  z-index: 2;
  right: 10px;
  top: 10px;
  max-width: 130px;
}

/* 规则自动补全下拉：名称 + 灰色解释 */
.CodeMirror-hints {
  z-index: 9999;
  max-height: 320px;
  font-family: Consolas, Monaco, 'Andale Mono', monospace;
}
.CodeMirror-hint {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  max-width: 460px;
}
.waf-hint-name {
  color: #0052d9;
  font-weight: 500;
}
.waf-hint-desc {
  color: #999;
  font-size: 12px;
  flex-shrink: 0;
}
li.CodeMirror-hint-active .waf-hint-name,
li.CodeMirror-hint-active .waf-hint-desc {
  color: #fff;
}

/* 暗黑模式下 CodeMirror 编辑器颜色随主题变化 */
:root[theme-mode='dark'] .in-coder-panel {
  .CodeMirror {
    background: var(--td-bg-color-component);
    color: var(--td-text-color-primary);
  }
  .CodeMirror-gutters {
    background: var(--td-bg-color-container);
    border-right-color: var(--td-component-border);
  }
  .CodeMirror-linenumber {
    color: var(--td-text-color-placeholder);
  }
  .CodeMirror-scrollbar-filler,
  .CodeMirror-gutter-filler {
    background-color: var(--td-bg-color-component);
  }
  .CodeMirror-cursor {
    border-left-color: var(--td-text-color-primary);
  }
  .CodeMirror-activeline-background {
    background: var(--td-bg-color-container);
  }
  .CodeMirror-ruler {
    border-left-color: var(--td-component-border);
  }
}
</style>
