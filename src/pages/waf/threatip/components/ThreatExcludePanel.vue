<template>
  <span>
    <t-button variant="outline" size="small" @click="open">{{ $t('page.threatip.exclude.entry_btn') }}</t-button>

    <t-dialog
      :header="$t('page.threatip.exclude.title')"
      :visible.sync="visible"
      :width="900"
      :footer="false"
      @closed="onClosed"
    >
      <div slot="body">
        <t-alert theme="info" size="small" :style="{ marginBottom: '12px' }">
          <template #message>
            <div>{{ $t('page.threatip.exclude.intro') }}</div>
            <div class="tie-note">{{ $t('page.threatip.exclude.intro_direction') }}</div>
          </template>
        </t-alert>

        <t-tabs v-model="tab">
          <!-- 排除名单 -->
          <t-tab-panel value="list" :label="$t('page.threatip.exclude.tab_list')">
            <div class="tie-bar">
              <t-input
                v-model="form.entry"
                :style="{ width: '220px' }"
                :placeholder="$t('page.threatip.exclude.entry_placeholder')"
                clearable
                @change="onEntryChange"
              />
              <t-input
                v-model="form.remarks"
                :style="{ width: '280px' }"
                :placeholder="$t('page.threatip.exclude.remarks_placeholder')"
                clearable
              />
              <t-button theme="primary" :loading="adding" @click="onAdd">{{ $t('common.new') }}</t-button>
              <span class="tie-spacer"></span>
              <t-select v-model="query.source" :style="{ width: '140px' }" clearable
                        :placeholder="$t('page.threatip.exclude.filter_source')" @change="reload">
                <t-option value="manual" :label="$t('page.threatip.exclude.source_manual')" />
                <t-option value="auto" :label="$t('page.threatip.exclude.source_auto')" />
              </t-select>
            </div>

            <!-- 试算结果：加之前就告诉用户会不会生效。
                 最容易踩的坑是排除 1.2.3.4 而快照里其实是 1.2.3.0/24——小的排不掉大的 -->
            <t-alert v-if="preview" :theme="previewTheme" size="small" :style="{ marginBottom: '10px' }">
              <template #message>{{ previewText }}</template>
            </t-alert>

            <t-table
              :columns="columns"
              :data="rows"
              rowKey="id"
              size="small"
              :loading="loading"
              :pagination="pagination"
              @page-change="onPageChange"
            >
              <template #source="{ row }">
                <t-tag v-if="row.source === 'auto'" theme="warning" variant="light" size="small">
                  {{ $t('page.threatip.exclude.source_auto') }}
                </t-tag>
                <t-tag v-else theme="primary" variant="light" size="small">
                  {{ $t('page.threatip.exclude.source_manual') }}
                </t-tag>
                <span v-if="row.reason" class="tie-reason">{{ row.reason }}</span>
              </template>
              <template #hit_count="{ row }">
                <span v-if="row.hit_count > 0">{{ row.hit_count }}</span>
                <!-- hit_count=0 是最有价值的一列：说明这条排除写了但没匹配到任何情报条目 -->
                <t-tooltip v-else :content="$t('page.threatip.exclude.no_hit_tip')">
                  <t-tag theme="default" variant="light" size="small">{{ $t('page.threatip.exclude.no_hit') }}</t-tag>
                </t-tooltip>
              </template>
              <template #enable="{ row }">
                <t-switch :value="row.enable" :custom-value="[1, 0]" size="small" @change="(v) => onToggle(row, v)" />
              </template>
              <template #op="{ row }">
                <a class="t-button-link" @click="onDel(row)">{{ $t('common.delete') }}</a>
              </template>
            </t-table>
          </t-tab-panel>

          <!-- 内置排除规则：不落库，但确实在生效。
               不列出来的话，用户会看到"已排除6条"却在排除名单里一条也找不到 -->
          <t-tab-panel value="builtin" :label="$t('page.threatip.exclude.tab_builtin')">
            <div class="tie-note" :style="{ margin: '10px 0' }">{{ $t('page.threatip.exclude.builtin_note') }}</div>
            <t-table :columns="builtinColumns" :data="builtinRows" rowKey="entry" size="small" :loading="builtinLoading">
              <template #entry="{ row }">
                <code class="tie-code">{{ row.entry }}</code>
              </template>
              <template #reason="{ row }">
                <t-tag theme="warning" variant="light" size="small">{{ row.reason }}</t-tag>
              </template>
            </t-table>
          </t-tab-panel>

          <!-- 操作审计 -->
          <t-tab-panel value="audit" :label="$t('page.threatip.exclude.tab_audit')">
            <div class="tie-note" :style="{ marginBottom: '8px' }">{{ $t('page.threatip.exclude.audit_note') }}</div>
            <t-table
              :columns="auditColumns"
              :data="auditRows"
              rowKey="id"
              size="small"
              :loading="auditLoading"
              :pagination="auditPagination"
              @page-change="onAuditPageChange"
            >
              <template #action="{ row }">
                <t-tag :theme="actionTheme(row.action)" variant="light" size="small">{{ actionText(row.action) }}</t-tag>
              </template>
              <template #create_time="{ row }">
                <span>{{ row.create_time }}</span>
              </template>
            </t-table>
          </t-tab-panel>
        </t-tabs>
      </div>
    </t-dialog>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  wafThreatIPExcludeListApi,
  wafThreatIPExcludeAddApi,
  wafThreatIPExcludeEditApi,
  wafThreatIPExcludeDelApi,
  wafThreatIPExcludePreviewApi,
  wafThreatIPExcludeAuditApi,
  wafThreatIPExcludeBuiltinApi,
} from '@/apis/threatip';

export default Vue.extend({
  name: 'ThreatExcludePanel',
  data() {
    return {
      visible: false,
      tab: 'list',
      loading: false,
      adding: false,
      rows: [],
      pagination: { total: 0, current: 1, pageSize: 10 },
      query: { source: '' },
      form: { entry: '', remarks: '' },
      preview: null,
      auditLoading: false,
      auditRows: [],
      auditPagination: { total: 0, current: 1, pageSize: 10 },
      builtinLoading: false,
      builtinRows: [],
      builtinColumns: [
        { title: this.$t('page.threatip.exclude.col_entry'), colKey: 'entry', width: 220 },
        { title: this.$t('page.threatip.exclude.col_builtin_reason'), colKey: 'reason' },
      ],
      columns: [
        { title: this.$t('page.threatip.exclude.col_entry'), colKey: 'entry', width: 160, ellipsis: true },
        { title: this.$t('page.threatip.exclude.col_source'), colKey: 'source', width: 170 },
        { title: this.$t('page.threatip.exclude.col_hit'), colKey: 'hit_count', width: 110 },
        { title: this.$t('common.remarks'), colKey: 'remarks', ellipsis: true },
        { title: this.$t('page.threatip.exclude.col_enable'), colKey: 'enable', width: 80 },
        { title: this.$t('common.op'), colKey: 'op', width: 80 },
      ],
      auditColumns: [
        { title: this.$t('page.threatip.exclude.col_action'), colKey: 'action', width: 90 },
        { title: this.$t('page.threatip.exclude.col_entry'), colKey: 'entry', width: 150, ellipsis: true },
        { title: this.$t('page.threatip.exclude.col_operator'), colKey: 'operator', width: 110, ellipsis: true },
        { title: this.$t('page.threatip.exclude.col_operator_ip'), colKey: 'operator_ip', width: 130, ellipsis: true },
        { title: this.$t('page.threatip.exclude.col_affected'), colKey: 'affected_items', width: 90 },
        { title: this.$t('page.threatip.exclude.col_time'), colKey: 'create_time', width: 165 },
        { title: this.$t('common.remarks'), colKey: 'remarks', ellipsis: true },
      ],
    };
  },
  computed: {
    previewTheme() {
      if (!this.preview) return 'info';
      return this.preview.affected_items > 0 ? 'success' : 'warning';
    },
    previewText() {
      if (!this.preview) return '';
      const p = this.preview;
      if (p.affected_items > 0) {
        return this.$t('page.threatip.exclude.preview_hit', {
          chans: p.affected_chans,
          items: p.affected_items,
          names: (p.channel_names || []).join('、'),
        });
      }
      // 没匹配到时把「你其实该排哪个段」直接说出来，光说"未匹配"用户不知道下一步怎么办
      if (p.covering_entry) {
        return this.$t('page.threatip.exclude.preview_covering', { seg: p.covering_entry });
      }
      return this.$t('page.threatip.exclude.preview_none');
    },
  },
  methods: {
    open() {
      this.visible = true;
      this.reload();
      this.loadAudit();
      this.loadBuiltin();
    },
    loadBuiltin() {
      this.builtinLoading = true;
      wafThreatIPExcludeBuiltinApi()
        .then((res) => {
          if (res.code === 0) this.builtinRows = res.data ?? [];
        })
        .finally(() => {
          this.builtinLoading = false;
        });
    },
    onClosed() {
      this.preview = null;
      this.form = { entry: '', remarks: '' };
      // 排除会改动防火墙落地，关掉面板后让父页刷新一次条数
      this.$emit('changed');
    },
    // 从 IP 归属查询「排除此项」跳过来时用：带着实际命中的那条原文预填
    openWith(entry, remarks) {
      this.form = { entry: entry || '', remarks: remarks || '' };
      this.visible = true;
      this.tab = 'list';
      this.reload();
      this.loadAudit();
      if (this.form.entry) this.onEntryChange();
    },
    reload() {
      this.loading = true;
      wafThreatIPExcludeListApi({
        pageIndex: this.pagination.current,
        pageSize: this.pagination.pageSize,
        source: this.query.source || '',
        entry: '',
      })
        .then((res) => {
          if (res.code === 0) {
            this.rows = res.data.list ?? [];
            this.pagination = { ...this.pagination, total: res.data.total };
          }
        })
        .finally(() => {
          this.loading = false;
        });
    },
    loadAudit() {
      this.auditLoading = true;
      wafThreatIPExcludeAuditApi({
        pageIndex: this.auditPagination.current,
        pageSize: this.auditPagination.pageSize,
        entry: '',
        action: '',
      })
        .then((res) => {
          if (res.code === 0) {
            this.auditRows = res.data.list ?? [];
            this.auditPagination = { ...this.auditPagination, total: res.data.total };
          }
        })
        .finally(() => {
          this.auditLoading = false;
        });
    },
    onPageChange(pageInfo) {
      this.pagination = { ...this.pagination, current: pageInfo.current, pageSize: pageInfo.pageSize };
      this.reload();
    },
    onAuditPageChange(pageInfo) {
      this.auditPagination = { ...this.auditPagination, current: pageInfo.current, pageSize: pageInfo.pageSize };
      this.loadAudit();
    },
    // 输完就试算，用户在点「新增」之前就知道这条会不会生效
    onEntryChange() {
      const entry = (this.form.entry || '').trim();
      this.preview = null;
      if (!entry) return;
      wafThreatIPExcludePreviewApi({ entry }).then((res) => {
        if (res.code === 0) this.preview = res.data;
      });
    },
    onAdd() {
      const entry = (this.form.entry || '').trim();
      if (!entry) {
        this.$message.warning(this.$t('page.threatip.exclude.entry_required'));
        return;
      }
      this.adding = true;
      wafThreatIPExcludeAddApi({ entry, remarks: this.form.remarks || '' })
        .then((res) => {
          if (res.code === 0) {
            this.$message.success(res.msg);
            this.form = { entry: '', remarks: '' };
            this.preview = null;
            this.reload();
            this.loadAudit();
            this.$emit('changed');
          } else {
            this.$message.error(res.msg);
          }
        })
        .finally(() => {
          this.adding = false;
        });
    },
    onToggle(row, v) {
      wafThreatIPExcludeEditApi({ id: row.id, remarks: row.remarks || '', enable: v }).then((res) => {
        if (res.code === 0) {
          this.$message.success(res.msg);
        } else {
          this.$message.error(res.msg);
        }
        this.reload();
        this.loadAudit();
        this.$emit('changed');
      });
    },
    onDel(row) {
      // 删除等于把这个地址交还给威胁情报，必须让用户明确知道后果
      const confirmDia = this.$dialog.confirm({
        header: this.$t('common.confirm_delete'),
        body: this.$t('page.threatip.exclude.del_warning', { entry: row.entry }),
        onConfirm: () => {
          wafThreatIPExcludeDelApi({ id: row.id }).then((res) => {
            if (res.code === 0) {
              this.$message.success(res.msg);
            } else {
              this.$message.error(res.msg);
            }
            confirmDia.hide();
            this.reload();
            this.loadAudit();
            this.$emit('changed');
          });
        },
        onClose: () => {
          confirmDia.hide();
        },
      });
    },
    actionText(a) {
      return this.$t('page.threatip.exclude.action_' + a) || a;
    },
    actionTheme(a) {
      if (a === 'add' || a === 'enable') return 'success';
      if (a === 'del' || a === 'disable') return 'danger';
      return 'default';
    },
  },
});
</script>

<style lang="less" scoped>
.tie-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
}
.tie-spacer {
  flex: 1;
}
.tie-note {
  color: var(--td-text-color-placeholder);
  font-size: 12px;
  line-height: 1.7;
}
.tie-reason {
  margin-left: 6px;
  color: var(--td-text-color-placeholder);
  font-size: 12px;
}
.tie-code {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  padding: 1px 6px;
  border-radius: 2px;
  background: var(--td-bg-color-secondarycontainer);
  color: var(--td-text-color-secondary);
}
</style>
