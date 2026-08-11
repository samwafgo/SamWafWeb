<template>
  <div class="help-block" :class="['help-block--' + resolvedMode, { 'is-open': expanded }]">
    <div class="hb-row">
      <info-circle-icon class="hb-ico" />
      <span class="hb-txt" :class="{ 'is-clamp': resolvedMode === 'inline' && !expanded }">{{ summary }}</span>

      <!-- 页面自己的动作入口（如「去批量任务」），排在说明入口左边 -->
      <span v-if="$slots.actions" class="hb-actions">
        <slot name="actions" />
      </span>

      <!-- 单行形态：没有详细说明，文档链接直接跟在摘要后面 -->
      <a
        v-if="resolvedMode === 'none' && mainDoc"
        class="hb-doclink"
        :href="mainDoc.url"
        target="_blank"
        rel="noopener noreferrer"
      >{{ mainDoc.label }}</a>

      <!-- 内联形态：原地展开 -->
      <button
        v-else-if="resolvedMode === 'inline'"
        type="button"
        class="hb-act"
        :aria-expanded="expanded ? 'true' : 'false'"
        @click="toggle"
      >
        <span>{{ expanded ? $t('common.help_block.collapse') : $t('common.help_block.detail') }}</span>
        <chevron-down-icon class="hb-caret" />
      </button>

      <!-- 抽屉形态：内容太长，顶部只留这一行 -->
      <button v-else-if="resolvedMode === 'drawer'" type="button" class="hb-act" @click="drawerVisible = true">
        <span>{{ $t('common.help_block.detail') }}</span>
        <chevron-right-icon class="hb-caret is-static" />
      </button>
    </div>

    <div v-if="resolvedMode === 'inline'" v-show="expanded" class="hb-panel">
      <help-detail v-bind="detailProps" :docs="docs" :docs-label="$t('common.help_block.docs')" />
    </div>

    <!-- 测量用影子节点：和真实面板同宽同样式，只是不可见 -->
    <div v-if="hasDetail" ref="ghost" class="hb-ghost" aria-hidden="true">
      <help-detail v-bind="detailProps" :docs="docs" :docs-label="$t('common.help_block.docs')" />
    </div>

    <t-drawer
      v-if="hasDetail"
      :visible.sync="drawerVisible"
      :header="drawerTitle"
      :footer="false"
      :close-btn="true"
      :close-on-overlay-click="true"
      :close-on-esc-keydown="true"
      placement="right"
      size="420px"
      class="help-block-drawer"
    >
      <help-detail v-bind="detailProps" :docs="[]" />
      <div v-if="docs.length" class="hb-drawer-docs">
        <span class="hb-docs-label">{{ $t('common.help_block.docs') }}</span>
        <a
          v-for="(d, i) in docs"
          :key="i"
          class="hb-doclink"
          :href="d.url"
          target="_blank"
          rel="noopener noreferrer"
        >{{ d.label }}</a>
      </div>
    </t-drawer>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { InfoCircleIcon, ChevronDownIcon, ChevronRightIcon } from 'tdesign-icons-vue';
import globalconfig from '@/utils/globalconfig';

const STORE_PREFIX = 'samwaf_helpblock_';

// 详细说明的内容体。内联面板、抽屉、影子节点三处共用同一份结构，
// 保证「量出来的高度」就是「真正会撑开的高度」。
const HelpDetail = Vue.extend({
  name: 'HelpDetail',
  props: {
    detail: { type: String, default: '' },
    items: { type: Array, default: () => [] as any[] },
    note: { type: String, default: '' },
    docs: { type: Array, default: () => [] as any[] },
    docsLabel: { type: String, default: '' },
  },
  render(h) {
    const kids = [];

    if (this.items && this.items.length) {
      kids.push(
        h(
          'div',
          { class: 'hb-grid' },
          (this.items as any[]).map((it) =>
            h('div', { class: 'hb-op' }, [
              h(
                'span',
                {
                  class: [
                    'hb-k',
                    it.tone === 'brand' ? 'is-brand' : '',
                    it.tone === 'danger' ? 'is-danger' : '',
                  ],
                },
                it.k,
              ),
              h('span', { class: 'hb-v' }, it.v),
            ]),
          ),
        ),
      );
    }

    if (this.detail) kids.push(h('div', { class: 'hb-body' }, this.detail));
    if (this.note) kids.push(h('div', { class: 'hb-note' }, this.note));

    if (this.docs && (this.docs as any[]).length) {
      kids.push(
        h('div', { class: 'hb-docs' }, [
          h('span', { class: 'hb-docs-label' }, this.docsLabel),
          ...(this.docs as any[]).map((d) =>
            h(
              'a',
              {
                class: 'hb-doclink',
                attrs: { href: d.url, target: '_blank', rel: 'noopener noreferrer' },
              },
              d.label,
            ),
          ),
        ]),
      );
    }

    return h('div', { class: 'hb-detail' }, kids);
  },
});

export default Vue.extend({
  name: 'HelpBlock',
  components: { HelpDetail, InfoCircleIcon, ChevronDownIcon, ChevronRightIcon },
  props: {
    // 一行摘要，任何形态下都显示
    summary: { type: String, required: true },
    // 详细说明段落
    detail: { type: String, default: '' },
    // 结构化操作说明 [{ k, v, tone }]，tone: brand | danger
    items: { type: Array, default: () => [] as any[] },
    // 底部注意事项
    note: { type: String, default: '' },
    // 在线文档相对路径，如 guide/ThreatIP、guide/Host#_2-新增网站；给完整 http(s) 地址也认
    doc: { type: String, default: '' },
    // 相关文档 [{ label, doc }]
    links: { type: Array, default: () => [] as any[] },
    // 抽屉标题，默认用当前路由的页面标题
    title: { type: String, default: '' },
    // 内联展开的高度上限(px)，超过就转抽屉
    threshold: { type: Number, default: 140 },
    // auto | inline | drawer，自动判定不合适时可钉死
    mode: { type: String, default: 'auto' },
    // 传了就记住展开/收起状态，跨刷新保留
    storageKey: { type: String, default: '' },
  },
  data() {
    return {
      expanded: false,
      drawerVisible: false,
      measured: 0,
      autoMode: 'inline',
      resizeTimer: 0,
    };
  },
  computed: {
    hasDetail(): boolean {
      return !!(this.detail || this.note || (this.items && (this.items as any[]).length));
    },
    // none=单行提示 / inline=原地折叠 / drawer=右侧抽屉
    resolvedMode(): string {
      if (!this.hasDetail) return 'none';
      if (this.mode === 'inline' || this.mode === 'drawer') return this.mode;
      return this.autoMode;
    },
    detailProps(): Record<string, any> {
      return { detail: this.detail, items: this.items, note: this.note };
    },
    isEn(): boolean {
      const lang = String((this.$i18n && this.$i18n.locale) || '').toLowerCase();
      return lang.indexOf('en') === 0;
    },
    docs(): Array<{ label: string; url: string }> {
      const list: Array<{ label: string; url: string }> = [];
      if (this.doc) {
        list.push({ label: this.$t('common.help_block.doc_main') as string, url: this.buildDocUrl(this.doc) });
      }
      (this.links as any[]).forEach((l) => {
        const path = l.doc || l.url;
        if (path) list.push({ label: l.label, url: this.buildDocUrl(path) });
      });
      return list;
    },
    mainDoc(): { label: string; url: string } | null {
      return this.docs.length ? this.docs[0] : null;
    },
    drawerTitle(): string {
      return this.title || (this.$t('common.help_block.title') as string);
    },
  },
  watch: {
    // 切语言后文案长度变了，重新量
    '$i18n.locale'() {
      this.$nextTick(this.measure);
    },
  },
  mounted() {
    this.restore();
    this.$nextTick(this.measure);
    window.addEventListener('resize', this.onResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
    clearTimeout(this.resizeTimer);
  },
  methods: {
    // 相对路径 → 带语言的完整文档地址。base 只有 globalconfig 一处，换域名改那里就行
    buildDocUrl(path: string): string {
      if (!path) return '';
      if (/^https?:\/\//i.test(path)) return path;

      let p = path;
      let hash = '';
      const i = p.indexOf('#');
      if (i >= 0) {
        hash = p.slice(i);
        p = p.slice(0, i);
      }
      p = p.replace(/^\/+/, '');
      if (p && !/\.html$/i.test(p) && !/\/$/.test(p)) p += '.html';

      const base = globalconfig.getOnlineUrl() + (this.isEn ? '/en' : '');
      return `${base}/${p}${hash}`;
    },
    // 把详细说明渲进影子节点量一次高度，决定内联还是抽屉。
    // 按字数判会在窄屏失准：同一段文案折行后能高出一倍。
    measure() {
      if (!this.hasDetail || this.mode !== 'auto') return;
      const ghost = this.$refs.ghost as HTMLElement;
      if (!ghost || !this.$el) return;

      const w = (this.$el as HTMLElement).clientWidth;
      if (!w) return;
      ghost.style.width = `${w}px`;

      const h = Math.round(ghost.getBoundingClientRect().height);
      this.measured = h;
      const next = h > this.threshold ? 'drawer' : 'inline';
      if (next !== this.autoMode) {
        this.autoMode = next;
        // 从内联翻成抽屉时，把展开态收掉，避免留下一块空面板
        if (next === 'drawer') this.expanded = false;
      }
    },
    onResize() {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(this.measure, 150);
    },
    toggle() {
      this.expanded = !this.expanded;
      if (this.storageKey) {
        try {
          localStorage.setItem(STORE_PREFIX + this.storageKey, this.expanded ? '1' : '0');
        } catch (e) {
          /* 隐私模式下 localStorage 可能不可写，说明区不该因此报错 */
        }
      }
    },
    restore() {
      if (!this.storageKey) return;
      try {
        this.expanded = localStorage.getItem(STORE_PREFIX + this.storageKey) === '1';
      } catch (e) {
        this.expanded = false;
      }
    },
  },
});
</script>

<style lang="less" scoped>
.help-block {
  position: relative;
  margin-bottom: 12px;
  border: 1px solid var(--td-brand-color-3);
  border-radius: var(--td-radius-default);
  background: var(--td-brand-color-1);
  overflow: hidden;
}

.hb-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--td-text-color-primary);
}

.hb-ico {
  flex: none;
  color: var(--td-brand-color);
  font-size: 16px;
}

.hb-txt {
  flex: 1;
  min-width: 0;
}

.hb-txt.is-clamp {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hb-actions {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--td-brand-color);
  cursor: pointer;
  white-space: nowrap;
}

.hb-act {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border: 0;
  background: none;
  font: inherit;
  font-size: 13px;
  color: var(--td-brand-color);
  cursor: pointer;
  white-space: nowrap;
}

.hb-act:hover {
  color: var(--td-brand-color-hover);
}

.hb-caret {
  font-size: 12px;
  transition: transform 0.18s ease;
}

.is-open .hb-caret:not(.is-static) {
  transform: rotate(180deg);
}

.hb-panel,
.hb-ghost {
  border-top: 1px solid var(--td-brand-color-3);
  background: var(--td-bg-color-container);
  padding: 14px 16px 16px;
}

// 影子节点：参与布局计算但不可见、不可点
.hb-ghost {
  position: absolute;
  left: -99999px;
  top: 0;
  visibility: hidden;
  pointer-events: none;
}

.hb-doclink {
  color: var(--td-brand-color);
  text-decoration: none;
  white-space: nowrap;
}

.hb-doclink:hover {
  color: var(--td-brand-color-hover);
  text-decoration: underline;
}

.hb-doclink::after {
  content: '↗';
  margin-left: 2px;
  font-size: 0.9em;
}

.hb-drawer-docs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 18px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--td-component-stroke);
  font-size: 13px;
}

.hb-docs-label {
  color: var(--td-text-color-placeholder);
  font-size: 12px;
}
</style>

<style lang="less">
// HelpDetail 用 render 函数生成，不带 scoped 的 data 属性，这里统一给样式
.hb-detail {
  font-size: 13px;
  line-height: 1.7;
  color: var(--td-text-color-secondary);
}

.hb-detail .hb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px 28px;
}

.hb-detail .hb-op {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.hb-detail .hb-k {
  font-size: 12px;
  line-height: 20px;
  text-align: center;
  border-radius: 2px;
  border: 1px solid var(--td-component-stroke);
  background: var(--td-bg-color-secondarycontainer);
  color: var(--td-text-color-primary);
}

.hb-detail .hb-k.is-brand {
  background: var(--td-brand-color-1);
  border-color: var(--td-brand-color-3);
  color: var(--td-brand-color);
}

.hb-detail .hb-k.is-danger {
  background: var(--td-warning-color-1);
  border-color: var(--td-warning-color-3);
  color: var(--td-warning-color-7);
}

.hb-detail .hb-body {
  white-space: pre-line;
}

.hb-detail .hb-grid + .hb-body {
  margin-top: 10px;
}

.hb-detail .hb-note {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--td-component-border);
  font-size: 12px;
}

.hb-detail .hb-docs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 18px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--td-component-border);
}
</style>
