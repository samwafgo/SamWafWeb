<template>
  <div class="usage-doc">
    <t-alert v-if="loading" theme="info" :message="$t('common.loading')" />
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="md-content" v-html="html" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { owaspUsageDocApi } from '@/apis/owasp';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Very small Markdown -> HTML converter. Avoids pulling in a 3rd party dep for this static content.
function renderMarkdown(md: string): string {
  if (!md) return '';
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };

  const renderInline = (line: string) => {
    let s = escapeHtml(line);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
  };

  for (const raw of lines) {
    if (raw.startsWith('```')) {
      if (inCode) {
        out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(raw);
      continue;
    }
    if (/^#{1,6} /.test(raw)) {
      closeList();
      const m = raw.match(/^(#{1,6})\s+(.*)$/);
      if (m) {
        const level = m[1].length;
        out.push(`<h${level}>${renderInline(m[2])}</h${level}>`);
      }
      continue;
    }
    if (/^\s*[-*]\s+/.test(raw)) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${renderInline(raw.replace(/^\s*[-*]\s+/, ''))}</li>`);
      continue;
    }
    if (!raw.trim()) {
      closeList();
      out.push('');
      continue;
    }
    closeList();
    out.push(`<p>${renderInline(raw)}</p>`);
  }
  closeList();
  if (inCode) {
    out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
  }
  return out.join('\n');
}

export default Vue.extend({
  name: 'OwaspUsageTab',
  data() {
    return {
      loading: false,
      html: '',
    };
  },
  mounted() {
    this.load();
  },
  methods: {
    load() {
      this.loading = true;
      owaspUsageDocApi()
        .then((res) => {
          if (res.code === 0) {
            this.html = renderMarkdown(res.data.content || '');
          } else {
            this.$message.warning(res.msg);
          }
        })
        .finally(() => (this.loading = false));
    },
  },
});
</script>

<style lang="less" scoped>
.usage-doc {
  padding: 8px;
  max-height: 72vh;
  overflow: auto;
}
.md-content {
  line-height: 1.75;
}
.md-content ::v-deep h1,
.md-content ::v-deep h2,
.md-content ::v-deep h3,
.md-content ::v-deep h4 {
  margin-top: 18px;
  margin-bottom: 8px;
}
.md-content ::v-deep pre {
  background: var(--td-bg-color-container-hover);
  padding: 10px 12px;
  border-radius: 4px;
  overflow-x: auto;
}
.md-content ::v-deep code {
  background: var(--td-bg-color-container-hover);
  padding: 1px 4px;
  border-radius: 3px;
}
.md-content ::v-deep ul {
  padding-left: 20px;
}
</style>
