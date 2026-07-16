<template>
  <div class="import-nginx">
    <!-- 步骤1：来源 -->
    <t-form :label-width="90" colon>
      <t-form-item :label="$t('page.one_key_mod.import_source')">
        <t-radio-group v-model="source">
          <t-radio value="text">{{ $t('page.one_key_mod.import_source_text') }}</t-radio>
          <t-radio value="scan">{{ $t('page.one_key_mod.import_source_scan') }}</t-radio>
        </t-radio-group>
      </t-form-item>

      <t-form-item v-if="source === 'text'" :label="$t('page.one_key_mod.import_content')">
        <t-textarea
          v-model="content"
          :autosize="{ minRows: 6, maxRows: 14 }"
          :placeholder="$t('page.one_key_mod.import_content_placeholder')"
          style="width: 100%; max-width: 900px;"
        />
      </t-form-item>

      <t-form-item v-else :label="$t('page.one_key_mod.import_dir')">
        <t-input v-model="scanPath" style="width: 480px;" :placeholder="$t('page.one_key_mod.import_dir_placeholder')" clearable />
      </t-form-item>

      <t-form-item>
        <t-button theme="primary" :loading="parsing" @click="handleParse">{{ $t('page.one_key_mod.import_btn_parse') }}</t-button>
      </t-form-item>
    </t-form>

    <t-alert theme="warning" :message="$t('page.one_key_mod.import_tip')" style="margin-bottom: 12px;" />

    <!-- 步骤2：批量修改条 -->
    <template v-if="rows.length > 0">
      <t-card :bordered="true" :title="$t('page.one_key_mod.import_batch_title')" style="margin-bottom: 12px;">
        <t-space break-line align="center">
          <t-checkbox :checked="allSelected" :indeterminate="indeterminate" @change="toggleSelectAll">
            {{ $t('page.one_key_mod.import_select_all') }}
          </t-checkbox>
          <span>{{ $t('page.one_key_mod.import_remote_ip') }}
            <t-input v-model="batch.remote_ip" style="width: 140px;" />
          </span>
          <span>{{ $t('page.one_key_mod.import_bind_ssl') }}
            <t-select v-model="batch.bind_ssl_id" :filterable="true" clearable style="width: 240px;"
              :placeholder="$t('page.one_key_mod.import_bind_ssl_ph')">
              <t-option v-for="item in sslConfigList" :key="item.id" :value="item.id"
                :label="`${item.domains} (${item.valid_to})`" />
            </t-select>
          </span>
          <span>{{ $t('page.one_key_mod.import_auto_https') }}
            <t-switch v-model="batch.auto_jump_https" :custom-value="[1, 0]" />
          </span>
          <span>{{ $t('page.one_key_mod.import_start_status') }}
            <t-switch v-model="batch.start_status" :custom-value="[0, 1]"
              :label="[$t('page.one_key_mod.import_start_on'), $t('page.one_key_mod.import_start_off')]" />
          </span>
          <span>{{ $t('page.one_key_mod.import_remarks') }}
            <t-input v-model="batch.remarks" style="width: 160px;" />
          </span>
          <t-button theme="default" @click="applyBatch">{{ $t('page.one_key_mod.import_apply_selected') }}</t-button>
        </t-space>
      </t-card>

      <!-- 候选表格 -->
      <t-table row-key="_rid" :data="rows" :columns="columns" :bordered="true" size="small" :max-height="480">
        <template #_sel="slotProps">
          <t-checkbox v-model="slotProps.row._selected" />
        </template>
        <template #host="slotProps">
          <t-input v-model="slotProps.row.host" size="small" />
        </template>
        <template #bind_more_host="slotProps">
          <t-input v-model="slotProps.row.bind_more_host" size="small"
            :placeholder="$t('page.one_key_mod.import_col_more_host_ph')" />
        </template>
        <template #ssl="slotProps">
          <t-switch v-model="slotProps.row.ssl" :custom-value="[1, 0]" size="small"
            @change="(v) => onSslChange(slotProps.row, v)" />
        </template>
        <template #public_port="slotProps">
          <t-input-number v-model="slotProps.row.public_port" size="small" theme="normal" :min="1" :max="65535" style="width: 100px;" />
        </template>
        <template #remote_ip="slotProps">
          <t-input v-model="slotProps.row.remote_ip" size="small" style="width: 120px;" />
        </template>
        <template #remote_port="slotProps">
          <t-input-number v-model="slotProps.row.remote_port" size="small" theme="normal" :min="1" :max="65535" style="width: 100px;" />
        </template>
        <template #status="slotProps">
          <t-tag v-if="slotProps.row._status === 'ok'" theme="success" variant="light">{{ $t('page.one_key_mod.import_status_ok') }}</t-tag>
          <t-tag v-else-if="slotProps.row._status" theme="danger" variant="light">{{ slotProps.row._statusMsg }}</t-tag>
          <span v-else>-</span>
        </template>
      </t-table>

      <div style="margin-top: 12px;">
        <t-button theme="danger" :loading="adding" @click="handleAdd">
          {{ $t('page.one_key_mod.import_btn_add') }}（{{ selectedCount }}）
        </t-button>
        <t-button v-if="added" theme="primary" variant="outline" style="margin-left: 8px;" @click="goHostList">
          {{ $t('page.one_key_mod.import_goto_host') }}
        </t-button>
        <span v-if="summary" style="margin-left: 12px;">{{ summary }}</span>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import { wafParseNginxApi } from '@/apis/onekeymod';
  import { addHost } from '@/apis/host';
  import { sslConfigListApi } from '@/apis/sslconfig';

  let ridSeq = 0;

  export default Vue.extend({
    name: 'ImportNginx',
    data() {
      return {
        source: 'text',
        content: '',
        scanPath: '/www/server/panel/vhost/nginx',
        parsing: false,
        adding: false,
        added: false,
        rows: [],
        sslConfigList: [],
        summary: '',
        batch: {
          remote_ip: '127.0.0.1',
          bind_ssl_id: '',
          auto_jump_https: 0,
          start_status: 0,
          remarks: '',
        },
        columns: [
          { colKey: '_sel', title: '', width: 50, align: 'center' },
          { colKey: 'host', title: this.$t('page.one_key_mod.import_col_host'), width: 200 },
          { colKey: 'bind_more_host', title: this.$t('page.one_key_mod.import_col_more_host'), width: 220 },
          { colKey: 'ssl', title: 'SSL', width: 80, align: 'center' },
          { colKey: 'public_port', title: this.$t('page.one_key_mod.import_col_public_port'), width: 110 },
          { colKey: 'remote_ip', title: this.$t('page.one_key_mod.import_col_remote_ip'), width: 140 },
          { colKey: 'remote_port', title: this.$t('page.one_key_mod.import_col_remote_port'), width: 110 },
          { colKey: 'root', title: 'root', width: 220, ellipsis: true },
          { colKey: 'source_file', title: this.$t('page.one_key_mod.import_col_source'), width: 140, ellipsis: true },
          { colKey: 'status', title: this.$t('page.one_key_mod.import_col_status'), width: 120 },
        ],
      };
    },
    computed: {
      selectedRows(): any[] {
        return this.rows.filter((r: any) => r._selected);
      },
      selectedCount(): number {
        return this.selectedRows.length;
      },
      allSelected(): boolean {
        return this.rows.length > 0 && this.selectedRows.length === this.rows.length;
      },
      indeterminate(): boolean {
        return this.selectedCount > 0 && this.selectedCount < this.rows.length;
      },
    },
    mounted() {
      this.loadSslList();
    },
    methods: {
      loadSslList() {
        sslConfigListApi({ pageSize: 10000, remarks: '', code: '' })
          .then((res) => {
            if (res.code === 0) {
              this.sslConfigList = res.data.list || [];
            }
          })
          .catch((e: Error) => console.log(e));
      },
      handleParse() {
        if (this.source === 'text' && !this.content.trim()) {
          this.$message.warning(this.$t('page.one_key_mod.import_msg_empty_content'));
          return;
        }
        this.parsing = true;
        this.summary = '';
        wafParseNginxApi({
          source: this.source,
          content: this.source === 'text' ? this.content : '',
          file_path: this.source === 'scan' ? this.scanPath : '',
        })
          .then((res) => {
            if (res.code === 0) {
              const list = res.data || [];
              this.rows = list.map((c: any) => this.toRow(c));
              if (this.rows.length === 0) {
                this.$message.warning(this.$t('page.one_key_mod.import_msg_no_result'));
              } else {
                this.$message.success(this.$t('page.one_key_mod.import_msg_parsed') + this.rows.length);
              }
            } else {
              this.$message.warning(res.msg);
            }
          })
          .catch((e: Error) => console.log(e))
          .finally(() => {
            this.parsing = false;
          });
      },
      toRow(c: any) {
        const domains = c.domains || [];
        const ssl = c.ssl ? 1 : 0;
        ridSeq += 1;
        return {
          _rid: ridSeq,
          _selected: true,
          _status: '',
          _statusMsg: '',
          host: (domains[0] || '').toLowerCase(),
          bind_more_host: domains.slice(1).join('\n'),
          ssl,
          public_port: ssl ? 443 : 80,
          remote_ip: '127.0.0.1',
          remote_port: c.port,
          bind_ssl_id: '',
          auto_jump_https: 0,
          start_status: 0,
          remarks: '',
          root: c.root || '',
          source_file: c.source_file || '',
        };
      },
      onSslChange(row: any, v: number) {
        // SSL 开关切换时，联动对外端口默认值（未手工改动的常见情况）
        if (v === 1 && (row.public_port === 80 || !row.public_port)) {
          row.public_port = 443;
        } else if (v === 0 && row.public_port === 443) {
          row.public_port = 80;
        }
      },
      toggleSelectAll(checked: boolean) {
        this.rows.forEach((r: any) => {
          r._selected = checked;
        });
      },
      applyBatch() {
        const targets = this.selectedRows;
        if (targets.length === 0) {
          this.$message.warning(this.$t('page.one_key_mod.import_msg_no_selected'));
          return;
        }
        targets.forEach((r: any) => {
          r.remote_ip = this.batch.remote_ip;
          r.bind_ssl_id = this.batch.bind_ssl_id;
          r.auto_jump_https = this.batch.auto_jump_https;
          r.start_status = this.batch.start_status;
          r.remarks = this.batch.remarks;
        });
        this.$message.success(this.$t('page.one_key_mod.import_msg_applied') + targets.length);
      },
      buildPayload(row: any) {
        const ssl = Number(row.ssl) || 0;
        const host = (row.host || '').toLowerCase();
        return {
          host,
          port: Number(row.public_port),
          ssl,
          remote_system: '宝塔',
          remote_host: (ssl ? 'https://' : 'http://') + host,
          remote_ip: row.remote_ip || '127.0.0.1',
          remote_port: Number(row.remote_port),
          bind_more_host: row.bind_more_host || '',
          bind_ssl_id: ssl ? (row.bind_ssl_id || '') : '',
          auto_jump_https: Number(row.auto_jump_https) || 0,
          insecure_skip_verify: ssl ? 1 : 0,
          start_status: Number(row.start_status) || 0,
          nickname: host,
          remarks: row.remarks || '',
          ip_mode: 'nic',
        };
      },
      async handleAdd() {
        const targets = this.selectedRows;
        if (targets.length === 0) {
          this.$message.warning(this.$t('page.one_key_mod.import_msg_no_selected'));
          return;
        }
        this.adding = true;
        let ok = 0;
        let fail = 0;
        for (const row of targets) {
          if (!row.host || !row.host.trim()) {
            row._status = 'fail';
            row._statusMsg = this.$t('page.one_key_mod.import_msg_host_empty');
            fail += 1;
            continue;
          }
          try {
            const res = await addHost(this.buildPayload(row));
            if (res.code === 0) {
              row._status = 'ok';
              row._statusMsg = '';
              ok += 1;
            } else {
              row._status = 'fail';
              row._statusMsg = res.msg || 'fail';
              fail += 1;
            }
          } catch (e) {
            row._status = 'fail';
            row._statusMsg = String(e);
            fail += 1;
          }
        }
        this.adding = false;
        this.added = true;
        this.summary = `${this.$t('page.one_key_mod.import_summary_ok')}${ok} / ${this.$t('page.one_key_mod.import_summary_fail')}${fail}`;
        if (ok > 0) {
          this.$message.success(this.summary);
        } else {
          this.$message.warning(this.summary);
        }
      },
      goHostList() {
        this.$router.push({ path: '/waf-host/wafhost' });
      },
    },
  });
</script>

<style lang="less" scoped>
  .import-nginx {
    padding: 4px 0;
  }
</style>
