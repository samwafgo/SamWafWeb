<template>
  <div v-if="sortedTags.length" class="ip-tag-cell">
    <t-popup placement="bottom-left" :overlay-inner-style="{ padding: '0' }">
      <div class="ip-tag-cell__line">
        <!-- 单元格地方小，触发次数只在悬浮卡里给，这里不占位 -->
        <span class="ip-tag-chip" :class="'is-' + leadTag.cat" :title="leadTag.ip_tag">
          {{ leadTag.ip_tag }}
        </span>
        <span
          v-if="restCount > 0"
          class="ip-tag-cell__more"
          :title="$t('dashboard.ip_rank.tag_more', { count: restCount })"
        >+{{ restCount }}</span>
      </div>
      <template #content>
        <div class="ip-tag-pop">
          <div class="ip-tag-pop__head">
            <span class="ip-tag-pop__ip">{{ ip }}</span>
            <span class="ip-tag-pop__sum">
              {{ $t('dashboard.ip_rank.tag_summary', { count: sortedTags.length, total: formatNum(totalCnt) }) }}
            </span>
          </div>
          <div class="ip-tag-pop__body">
            <template v-for="group in groups">
              <div :key="group.key + '-h'" class="ip-tag-pop__group">
                <i class="ip-tag-dot" :class="'is-' + group.key"></i>
                {{ group.label }} · {{ group.items.length }}
              </div>
              <div
                v-for="(item, index) in group.items"
                :key="group.key + '-' + index"
                class="ip-tag-pop__row"
              >
                <span class="ip-tag-pop__name" :title="item.ip_tag">{{ item.ip_tag }}</span>
                <span class="ip-tag-pop__num">{{ formatNum(item.cnt) }}</span>
                <span class="ip-tag-pop__bar">
                  <i :class="'is-' + group.key" :style="{ width: barWidth(item) }"></i>
                </span>
              </div>
            </template>
          </div>
          <div class="ip-tag-pop__foot">
            <span class="ip-tag-pop__link" @click="$emit('view-log', ip)">
              {{ $t('dashboard.ip_rank.tag_view_log') }}
            </span>
          </div>
        </div>
      </template>
    </t-popup>
  </div>
</template>

<script lang="ts">
// 标签按类别归类：标签原文来自后端 weblog 的 RULE 字段（见 waftask/stat_collector.go），
// 命中不了任何前缀/关键字的（比如用户自定义规则的标题）统一落到「其他」。
const CATEGORY_ORDER = ['attack', 'owasp', 'list', 'other', 'pass'];

const ATTACK_KEYWORDS = [
  'SQL注入', 'XSS', 'RCE', '目录穿越', '敏感词检测', '扫描工具', 'CSRF',
  '防盗链', '插件拦截', '频次访问限制', '网页防篡改', '静态文件安全检查',
];
const PASS_KEYWORDS = ['验证通过', 'ACME证书校验'];

export default {
  name: 'IpTagCell',
  props: {
    ip: { type: String, default: '' },
    tags: { type: Array, default: () => [] },
  },
  computed: {
    // 按触发次数倒序，次数相同的按标签名稳定排序
    sortedTags() {
      return (this.tags || [])
        .filter((item) => item && item.ip_tag)
        .map((item) => ({
          ip_tag: item.ip_tag,
          cnt: Number(item.cnt) || 0,
          cat: this.categoryOf(item.ip_tag),
        }))
        .sort((a, b) => b.cnt - a.cnt || a.ip_tag.localeCompare(b.ip_tag));
    },
    // 主标签优先取「非放行」里次数最多的，否则一个正常访问多的攻击 IP 会顶着「正常」上榜
    leadTag() {
      return this.sortedTags.find((item) => item.cat !== 'pass') || this.sortedTags[0];
    },
    restCount() {
      return Math.max(0, this.sortedTags.length - 1);
    },
    totalCnt() {
      return this.sortedTags.reduce((sum, item) => sum + item.cnt, 0);
    },
    maxCnt() {
      return this.sortedTags.reduce((max, item) => Math.max(max, item.cnt), 0);
    },
    groups() {
      const bucket = {};
      this.sortedTags.forEach((item) => {
        if (!bucket[item.cat]) bucket[item.cat] = [];
        bucket[item.cat].push(item);
      });
      return CATEGORY_ORDER.filter((key) => bucket[key]).map((key) => ({
        key,
        label: this.$t(`dashboard.ip_rank.tag_cat_${key}`),
        items: bucket[key],
      }));
    },
  },
  methods: {
    categoryOf(tag) {
      if (tag === '正常' || tag.indexOf('自定义规则放行') === 0) return 'pass';
      if (PASS_KEYWORDS.some((word) => tag.indexOf(word) >= 0)) return 'pass';
      if (tag.indexOf('OWASP:') === 0) return 'owasp';
      if (tag.indexOf('黑名单') >= 0 || tag.indexOf('白名单') >= 0 || tag.indexOf('威胁情报IP') >= 0) return 'list';
      if (ATTACK_KEYWORDS.some((word) => tag.indexOf(word) >= 0)) return 'attack';
      return 'other';
    },
    barWidth(item) {
      if (!this.maxCnt) return '0%';
      return `${Math.max(4, Math.round((item.cnt / this.maxCnt) * 100))}%`;
    },
    formatNum(num) {
      return String(num || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
  },
};
</script>

<style lang="less" scoped>
.ip-tag-cell {
  display: flex;
  width: 100%;
  min-width: 0;
}

.ip-tag-cell__line {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  cursor: default;
}

.ip-tag-chip {
  /* min-width:0 必须给：flex 子项默认 min-width:auto 不肯收缩，
     标签一长就把后面的 +N 顶出单元格，被表格裁掉看不见 */
  flex: 0 1 auto;
  min-width: 0;
  max-width: 190px;
  height: 22px;
  padding: 0 8px;
  border-radius: 3px;
  font-size: 12px;
  line-height: 22px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ip-tag-cell__more {
  flex: none;
  height: 22px;
  padding: 0 7px;
  border-radius: 3px;
  border: 1px dashed var(--td-component-border);
  color: var(--td-text-color-secondary);
  font-size: 11px;
  line-height: 20px;
  font-variant-numeric: tabular-nums;
  cursor: default;
}

.ip-tag-cell__line:hover .ip-tag-cell__more {
  border-style: solid;
  border-color: var(--td-brand-color);
  color: var(--td-brand-color);
}

/* 类别配色：走 TDesign 语义色，暗色主题自动跟随 */
.is-attack { background: var(--td-error-color-1); color: var(--td-error-color); }
.is-owasp { background: var(--td-brand-color-1); color: var(--td-brand-color); }
.is-list { background: var(--td-warning-color-1); color: var(--td-warning-color); }
.is-pass { background: var(--td-success-color-1); color: var(--td-success-color); }
.is-other { background: var(--td-bg-color-component); color: var(--td-text-color-secondary); }

.ip-tag-pop {
  display: flex;
  flex-direction: column;
  width: 330px;
  max-height: 340px;
}

.ip-tag-pop__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--td-component-stroke);
}

.ip-tag-pop__ip {
  font-size: 13px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.ip-tag-pop__sum {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  white-space: nowrap;
}

.ip-tag-pop__body {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}

.ip-tag-pop__group {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--td-text-color-placeholder);
}

.ip-tag-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;

  &.is-attack { background: var(--td-error-color); }
  &.is-owasp { background: var(--td-brand-color); }
  &.is-list { background: var(--td-warning-color); }
  &.is-pass { background: var(--td-success-color); }
  &.is-other { background: var(--td-text-color-placeholder); }
}

.ip-tag-pop__row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 4px 10px;
  padding: 4px 12px 6px;
}

.ip-tag-pop__name {
  font-size: 12.5px;
  color: var(--td-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-tag-pop__num {
  font-size: 11.5px;
  color: var(--td-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.ip-tag-pop__bar {
  grid-column: 1 / -1;
  height: 3px;
  border-radius: 2px;
  background: var(--td-bg-color-component);
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    border-radius: 2px;
  }

  i.is-attack { background: var(--td-error-color); }
  i.is-owasp { background: var(--td-brand-color); }
  i.is-list { background: var(--td-warning-color); }
  i.is-pass { background: var(--td-success-color); }
  i.is-other { background: var(--td-text-color-placeholder); }
}

.ip-tag-pop__foot {
  padding: 8px 12px;
  border-top: 1px solid var(--td-component-stroke);
}

.ip-tag-pop__link {
  font-size: 12px;
  font-weight: 600;
  color: var(--td-brand-color);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}
</style>
