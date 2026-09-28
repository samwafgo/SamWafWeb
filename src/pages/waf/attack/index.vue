<template>
  <div>
    <help-block :summary="$t('page.visit_log.visit_log')" doc="guide/VisitLog">
      <template #actions><ip-lookup ref="ipLookup" /></template>
    </help-block>

    <!-- 日志配置区域 -->
    <t-card class="log-config-card" style="margin-bottom: 16px;">
      <div @click="toggleLogConfig" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center;">
          <t-icon :name="logConfigVisible ? 'chevron-down' : 'chevron-right'" style="margin-right: 8px;" />
          <span style="font-weight: 500; font-size: 14px;">日志配置</span>
        </div>
        <t-button theme="primary" size="small" @click.stop="saveLogConfig" :loading="logConfigSaving">
          保存配置
        </t-button>
      </div>
      
      <div v-show="logConfigVisible" style="margin-top: 16px;">
        <t-form :data="logConfig" :label-width="200" layout="inline">
          <t-row :gutter="16">
            <t-col :span="6">
              <t-form-item label="是否记录响应报文" name="record_resp">
                <t-select v-model="logConfig.record_resp" style="width: 100%;">
                  <t-option value="1" label="是" />
                  <t-option value="0" label="否" />
                </t-select>
              </t-form-item>
            </t-col>
            
            <t-col :span="6">
              <t-form-item label="记录原始请求BODY报文" name="record_all_src_byte_info">
                <t-select v-model="logConfig.record_all_src_byte_info" style="width: 100%;">
                  <t-option value="1" label="启动" />
                  <t-option value="0" label="关闭" />
                </t-select>
              </t-form-item>
            </t-col>
            
            <t-col :span="6">
              <t-form-item label="日志记录类型" name="record_log_type">
                <t-select v-model="logConfig.record_log_type" style="width: 100%;">
                  <t-option value="all" label="全部" />
                  <t-option value="abnormal" label="非正常" />
                </t-select>
              </t-form-item>
            </t-col>
            
            <t-col :span="6">
              <t-form-item label="记录请求最大报文(字节)" name="record_max_req_body_length">
                <t-input-number v-model="logConfig.record_max_req_body_length" style="width: 100%;" :min="0" />
              </t-form-item>
            </t-col>
          </t-row>
          
          <t-row :gutter="16">
            <t-col :span="6">
              <t-form-item label="记录响应最大报文(字节)" name="record_max_res_body_length">
                <t-input-number v-model="logConfig.record_max_res_body_length" style="width: 100%;" :min="0" />
              </t-form-item>
            </t-col>
            
            <t-col :span="6">
              <t-form-item label="删除历史日志(天)" name="delete_history_log_day">
                <t-input-number v-model="logConfig.delete_history_log_day" style="width: 100%;" :min="1" />
              </t-form-item>
            </t-col>
            
            <t-col :span="6">
              <t-form-item label="日志归档最大记录数" name="log_db_size">
                <t-input-number v-model="logConfig.log_db_size" style="width: 100%;" :min="0" />
              </t-form-item>
            </t-col>
            
            <t-col :span="6">
              <t-form-item label="日志归档最大文件(MB)" name="db_file_size">
                <t-input-number v-model="logConfig.db_file_size" style="width: 100%;" :min="0" />
              </t-form-item>
            </t-col>
          </t-row>
          
          <t-row :gutter="16">
            <t-col :span="6">
              <t-form-item label="是否开启日志持久化" name="log_persist_enable">
                <t-select v-model="logConfig.log_persist_enable" style="width: 100%;">
                  <t-option value="1" label="开启" />
                  <t-option value="0" label="关闭" />
                </t-select>
              </t-form-item>
            </t-col>
            
            <t-col :span="6">
              <t-form-item label="数据库批量插入数量" name="batch_insert">
                <t-input-number v-model="logConfig.batch_insert" style="width: 100%;" :min="1" />
              </t-form-item>
            </t-col>
            
            <t-col :span="6">
              <t-form-item label="IP Tag 存放位置" name="ip_tag_db">
                <t-select v-model="logConfig.ip_tag_db" style="width: 100%;">
                  <t-option value="0" label="主库" />
                  <t-option value="1" label="读取 stat库" />
                </t-select>
              </t-form-item>
            </t-col>
          </t-row>

          <t-row :gutter="16">
            <t-col :span="6">
              <t-form-item label="访问日志档位" name="access_log_mode">
                <t-select v-model="logConfig.access_log_mode" style="width: 100%;">
                  <t-option value="db" label="全部入库" />
                  <t-option value="sample" label="采样入库" />
                  <t-option value="off" label="仅安全事件" />
                </t-select>
                <div v-if="logConfig.access_log_mode !== 'db'" class="log-config-hint">
                  「仅安全事件」会失去 CC 阈值推荐、AI 训练负样本与异常 IP 的正常行为回溯
                </div>
              </t-form-item>
            </t-col>

            <t-col :span="6">
              <t-form-item label="访问日志保留天数" name="access_log_retention_days">
                <t-input-number v-model="logConfig.access_log_retention_days" style="width: 100%;" :min="1" />
              </t-form-item>
            </t-col>
          
          </t-row>

          <t-row :gutter="16">
            <t-col :span="12">
              <t-form-item label="全局排除记录日志的IP" name="exclude_ip_log">
                <t-textarea v-model="logConfig.exclude_ip_log" :placeholder="'单IP/CIDR/通配符/区间，或 group:组短码 引用IP组；逗号或换行分隔，#开头为注释。只静音正常请求，安全事件照常记录；站点级清单在网站编辑里'"
                            :autosize="{ minRows: 2, maxRows: 6 }" style="width: 100%;" />
              </t-form-item>
            </t-col>
          </t-row>
        </t-form>
      </div>
    </t-card>

    <t-card class="list-card-container">
      <t-row justify="space-between">
        <t-form ref="form" :data="searchformData" :label-width="150" colon layout="inline"
          :style="{ marginBottom: '8px' }">
          <t-form-item :label="$t('page.visit_log.website')" name="website">
            <t-select v-model="searchformData.host_code" clearable filterable :style="{ width: '150px' }">
              <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                {{ item }}
              </t-option>
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.visit_log.rule_name')" name="rule">
            <t-input v-model="searchformData.rule" class="form-item-content" type="search"
              :placeholder="$t('common.placeholder') + $t('page.visit_log.rule_name')" :style="{ minWidth: '134px' }" />
          </t-form-item>
          <t-form-item :label="$t('page.visit_log.req_uuid')" name="req_uuid">
            <t-input v-model="searchformData.req_uuid" class="form-item-content" type="search"
              :placeholder="$t('common.placeholder') + $t('page.visit_log.req_uuid')" :style="{ minWidth: '200px' }" />
          </t-form-item>
          <t-form-item :label="$t('page.visit_log.access_status')" name="action">
            <t-select v-model="searchformData.action" class="form-item-content`" :options="action_options"
              :placeholder="$t('common.select_placeholder') + $t('page.visit_log.access_status')"
              :style="{ width: '100px' }" />
          </t-form-item>
          <t-form-item :label="$t('page.visit_log.status_code')" name="status_code">
            <t-input v-model="searchformData.status_code" class="form-item-content"
              :placeholder="$t('common.placeholder') + $t('page.visit_log.status_code')"
              :style="{ minWidth: '100px' }" />
          </t-form-item>
          <t-form-item :label="$t('page.visit_log.source_ip')" name="src_ip">
            <t-input v-model="searchformData.src_ip" class="form-item-content"
              :placeholder="$t('common.placeholder') + $t('page.visit_log.source_ip')" :style="{ minWidth: '100px' }" />
          </t-form-item>
          <t-form-item :label="$t('page.visit_log.access_date')" name="unix_add_time" v-if="attack_ip == ''">
            <t-tooltip :content="$t('page.visit_log.date_disabled_tip')" :disabled="!isUuidLookup">
              <t-date-range-picker v-model="dateControl.range1" :presets="dateControl.presets" enable-time-picker
                :disabled="isUuidLookup" valueType="YYYY-MM-DD HH:mm:ss" />
            </t-tooltip>
          </t-form-item>
          <!-- 内嵌在风险日志 IP 明细里时没有日期控件，给一个时间范围快选，默认近 30 天 -->
          <t-form-item :label="$t('page.visit_log.access_date')" name="quick_range" v-else>
            <t-select v-model="quickRange" :disabled="isUuidLookup" :style="{ width: '130px' }"
                      @change="applyQuickRange">
              <t-option value="1" :label="$t('page.visit_log.date_range_today')" />
              <t-option value="7" :label="$t('page.visit_log.date_range_last_7_days')" />
              <t-option value="30" :label="$t('page.visit_log.range_last_30_days')" />
              <t-option value="0" :label="$t('page.visit_log.range_all')" />
            </t-select>
          </t-form-item>
          <t-form-item :label="$t('page.visit_log.access_method')" name="method">
            <t-select v-model="searchformData.method" class="form-item-content`" :options="method_options"
              :placeholder="$t('common.placeholder') + $t('page.visit_log.access_method')"
              :style="{ width: '100px' }" />
          </t-form-item>
          <t-form-item :label="$t('page.visit_log.log_archive_db')" name="sharedb">
            <t-tooltip :content="$t('page.visit_log.shard_disabled_tip')" :disabled="!isUuidLookup">
              <t-select v-model="searchformData.current_db_name" :disabled="isUuidLookup"
                        :style="{ width: '190px' }">
                <t-option value="auto" :label="$t('page.visit_log.shard_auto')">
                  <span :title="$t('page.visit_log.shard_auto_tip')">{{ $t('page.visit_log.shard_auto') }}</span>
                </t-option>
                <t-option-group v-for="g in shardGroups" :key="g.label" :label="g.label">
                  <t-option v-for="it in g.options" :key="it.value" :value="it.value" :label="it.label"
                            :disabled="it.disabled">
                    <span :title="it.value">{{ it.label }}</span>
                  </t-option>
                </t-option-group>
              </t-select>
            </t-tooltip>
          </t-form-item>
          <t-form-item>
            <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')"> {{ $t('common.search') }}
            </t-button>
            <t-button theme="primary" :style="{ marginLeft: '8px' }" v-if="attack_ip == '' && isFileBasedDb"
              @click="exportDbVisible = true">
              {{
                $t('common.export') }} </t-button>
          
            <t-button type="reset" variant="base" theme="default"> {{ $t('common.reset') }} </t-button>
            <t-button theme="primary" variant="outline" :style="{ marginLeft: '8px' }" @click="handleIPExtractIssue">
              {{ $t('page.visit_log.detail.ip_extract_issue') }}
            </t-button>
          </t-form-item>
        </t-form>
      </t-row>

      <div class="table-container">
        <!-- 查不到老数据时，最先该看的就是保留期：直接摆在列表上方，点一下就能去改 -->
        <div style="margin-bottom:8px;color:rgba(0,0,0,.6);font-size:12px">
          {{ $t('page.visit_log.retention_line', {
            d: logConfig.delete_history_log_day || '-',
            a: logConfig.access_log_retention_days || '-'
          }) }}
          <a class="t-button-link" @click="openRetentionSetting">{{ $t('page.visit_log.retention_setting') }}</a>
        </div>

        <!-- 查询超出后端预算：给出「能怎么办」，而不是让人对着不完整的数字猜 -->
        <t-alert v-if="queryMeta.partial" theme="warning" style="margin-bottom:12px">
          <template #message>
            {{ $t('page.visit_log.query_partial', { ms: queryMeta.took_ms }) }}
            <a class="t-button-link" style="margin-left:8px" @click="narrowRange">{{ $t('page.visit_log.query_partial_narrow') }}</a>
          </template>
        </t-alert>

        <!-- 分区登记还在、存储却不在了（或文件里一行都没有）：说清楚是哪个，给出处理入口 -->
        <t-alert v-if="queryMeta.issues && queryMeta.issues.length > 0" theme="warning" style="margin-bottom:12px">
          <template #message>
            <div>{{ $t('page.visit_log.shard_issue_title') }}</div>
            <div v-for="iss in queryMeta.issues" :key="iss.name" :title="iss.name" style="margin-top:2px">
              {{ shardTitle(iss.name) }}：{{ iss.kind === 'missing'
                ? $t('page.visit_log.shard_issue_missing', { n: iss.registered })
                : $t('page.visit_log.shard_issue_empty', { n: iss.registered }) }}
            </div>
            <a v-if="attack_ip == ''" class="t-button-link" @click="openShardManage">{{ $t('page.visit_log.shard_issue_manage') }}</a>
          </template>
        </t-alert>

        <!-- 这次查了哪些分区：自动模式下用户没选分区，界面得说明数据从哪来 -->
        <t-alert v-if="queryMeta.uuid_lookup && queryMeta.found_in" theme="success" style="margin-bottom:12px"
                 :message="$t('page.visit_log.uuid_found', { shard: shardTitle(queryMeta.found_in), n: queryMeta.scanned })" />
        <t-alert v-else-if="queryMeta.uuid_lookup" theme="warning" style="margin-bottom:12px">
          <template #message>
            <div>{{ $t('page.visit_log.uuid_miss', { n: queryMeta.scanned }) }}</div>
            <ul style="margin:6px 0 0 18px;padding:0">
              <li>{{ $t('page.visit_log.uuid_miss_r1') }}</li>
              <li>{{ $t('page.visit_log.uuid_miss_r2') }}</li>
              <li>{{ $t('page.visit_log.uuid_miss_r3') }}</li>
            </ul>
          </template>
        </t-alert>
        <t-alert v-else-if="queryMeta.shards && queryMeta.shards.length > 1" theme="info" style="margin-bottom:12px">
          <template #message>
            <!-- 分区多的时候全列出来就是一大堆，默认只给一行概括，要看再展开 -->
            {{ $t('page.visit_log.shard_cover', { n: queryMeta.shards.length }) }}
            <span style="color:rgba(0,0,0,.6)">{{ shardCoverSummary }}</span>
            <a class="t-button-link" @click="covExpanded = !covExpanded">
              {{ covExpanded ? $t('page.visit_log.shard_cover_fold') : $t('page.visit_log.shard_cover_detail') }}
            </a>
            <span v-if="queryMeta.sort_forced_time" style="color:rgba(0,0,0,.6)">
              {{ $t('page.visit_log.sort_forced_time') }}
            </span>
            <div v-show="covExpanded" style="margin-top:6px">
              <span v-for="sh in queryMeta.shards" :key="sh.name" :title="sh.name"
                    style="display:inline-block;margin:2px 6px 2px 0;padding:0 8px;background:#f3f3f3;border-radius:2px">
                {{ shardTitle(sh.name) }} · {{ sh.count }}
              </span>
            </div>
          </template>
        </t-alert>

        <!-- 自定义工具栏，将所有按钮放在一起 -->
        <div class="table-toolbar"
          style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div class="left-actions">
            <!-- 视图切换：访问日志=全量窄行（事件双写在内），安全事件=命中子集。
                 内嵌在风险日志详情里时，访问日志视图就是该 IP 的「全部行为」 -->
            <t-radio-group v-model="searchformData.view_type" variant="default-filled" size="small"
              @change="onViewTypeChange">
              <t-radio-button value="access">{{ accessViewLabel }}</t-radio-button>
              <t-radio-button value="event">{{ $t('page.visit_log.view_event') }}</t-radio-button>
            </t-radio-group>
          </div>
          <div class="right-actions">
            <t-space>
              <!-- 列配置按钮排在第一位 -->
              <t-button theme="default" variant="outline" size="small" @click="toggleColumnController">
                <template #icon>
                  <t-icon name="setting" />
                </template>
                {{ $t('common.column_config') }}
              </t-button> 
              <!-- 重置列配置按钮 -->
              <t-button theme="default" variant="outline" size="small" @click="resetColumnConfig">
                {{ $t('common.reset_column_config') }}
              </t-button>
              <!-- 分区管理：看每个分区还剩哪些层，并可主动删除腾空间 -->
              <t-button v-if="attack_ip == ''" theme="default" variant="outline" size="small"
                        @click="openShardManage">
                {{ $t('page.visit_log.shard_manage') }}
              </t-button>
            </t-space>
          </div>
        </div>
        <!-- 空态给线索：查不到日志最常见的原因就那么几条，别让人对着「暂无数据」猜 -->
        <template v-if="data.length === 0 && !queryMeta.uuid_lookup">
          <div class="empty-hint" style="padding:6px 0 10px;color:rgba(0,0,0,.6);font-size:12px">
            {{ $t('page.visit_log.empty_hint') }}
            <a class="t-button-link" @click="openIpLookupForHint">{{ $t('common.ip_lookup.title') }}</a>
          </div>
        </template>
        <t-table :columns="columns" :data="data" size="small" :rowKey="rowKey" :verticalAlign="verticalAlign"
          :displayColumns.sync="displayColumns"
          :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
          @page-change="rehandlePageChange" :sort="sorts" @change="rehandleChange" @select-change="rehandleSelectChange"
          @sort-change="onSortChange" @filter-change="onFilterChange"
          :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">


          <template #action="{ row }">
            <t-tag v-if="row.action === '放行'" shape="round" theme="success">{{ row.action }}</t-tag>
            <t-tag v-if="row.action === '阻止'" shape="round" theme="danger">{{ row.action }}</t-tag>
            <t-tag v-if="row.action === '禁止'" shape="round" theme="warning">{{ row.action }}</t-tag>

          </template>
          <template #rule="{ row }">
            <t-tag v-if="row.rule !== ''" shape="round" theme="primary" variant="outline">{{ row.rule }}</t-tag>
          </template>
          <template #log_only_mode="{ row }">
            <t-tag :theme="row.log_only_mode == '1' ? 'danger' : 'success'" variant="light-outline">
              {{ row.log_only_mode == '1' ? $t('page.visit_log.log_only_mode_on') : $t('page.visit_log.log_only_mode_off') }}
            </t-tag>
          </template>
          <template #ai_score="{ row }">
            <t-tag v-if="row.ai_score > 0"
              :theme="row.ai_score >= 0.9 ? 'danger' : (row.ai_score >= 0.6 ? 'warning' : 'primary')"
              variant="light">
              {{ Number(row.ai_score).toFixed(2) }}
            </t-tag>
            <span v-else>-</span>
          </template>
          <template #host_nickname="{ row }">
            <span>{{ host_nickname_dic[row.host_code] || '-' }}</span>
          </template>
          <template #src_ip="{ row }">
            <t-tooltip :content="$t('common.ip_lookup.click_tip')">
              <a class="ipl-link" @click="openIpLookup(row.src_ip)">{{ row.src_ip }}</a>
            </t-tooltip>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleClickIPDetail(slotProps)" v-if="attack_ip == ''">{{
              $t('common.search')
              + $t('page.visit_log.source_ip') }}</a>
            <a class="t-button-link" @click="handleClickDetail(slotProps)">{{ $t('common.details') }}</a>
            <a class="t-button-link" style="margin-left: 8px" @click="openAiMarkDialog(slotProps.row)">
              <t-tag v-if="aiMarkMap[slotProps.row.req_uuid] && aiMarkMap[slotProps.row.req_uuid].mark"
                :theme="aiMarkMap[slotProps.row.req_uuid].mark === 'attack' ? 'danger' : (aiMarkMap[slotProps.row.req_uuid].mark === 'normal' ? 'success' : 'default')"
                variant="light" size="small">
                {{ aiMarkText(aiMarkMap[slotProps.row.req_uuid]) }}
              </t-tag>
              <span v-else>{{ $t('page.visit_log.ai_mark') }}</span>
            </a>
          </template>
        </t-table>
      </div>
    </t-card>
    <!-- 分区管理 -->
    <t-dialog :header="$t('page.visit_log.shard_manage')" :visible.sync="shardManageVisible" width="820px"
      :footer="false" :onClose="() => { this.shardManageVisible = false }">
      <t-alert theme="info" :message="$t('page.visit_log.shard_manage_tip')" style="margin-bottom:12px" />
      <t-table :data="shardRows" :columns="shardManageColumns" row-key="file_name" size="small" max-height="420">
        <template #label="{ row }">
          <span :title="row.file_name">{{ shardTitle(row.file_name) }}</span>
        </template>
        <template #tiers="{ row }">
          <span v-if="row.is_current" style="color:rgba(0,0,0,.4)">—</span>
          <t-tag v-else-if="row.missing" size="small" theme="danger" variant="light">
            {{ $t('page.visit_log.shard_missing') }}
          </t-tag>
          <span v-else-if="!row.tiers || row.tiers.length === 0" style="color:rgba(0,0,0,.4)">
            {{ $t('page.visit_log.shard_tier_unknown') }}
          </span>
          <t-tag v-else v-for="t in row.tiers" :key="t" size="small" variant="light"
                 :theme="t === 'access_log' ? 'primary' : 'default'" style="margin-right:4px">
            {{ tierLabel(t) }}
          </t-tag>
        </template>
        <template #op="{ row }">
          <span v-if="row.is_current" style="color:rgba(0,0,0,.4)">{{ $t('page.visit_log.shard_live') }}</span>
          <a v-else class="t-button-link" style="color:#d54941" @click="confirmDeleteShard(row)">
            {{ $t('common.delete') }}
          </a>
        </template>
      </t-table>
    </t-dialog>

    <t-dialog :header="$t('page.visit_log.export_db_file_header')"
      :visible.sync="exportDbVisible" @confirm="handelExport" width="520px" :confirmOnEnter="true"
      :onClose="() => { this.exportDbVisible = false }">
      <t-alert theme="info" :message="$t('page.visit_log.export_db_file_content')" style="margin-bottom: 12px;" />
      <t-form :label-width="110">
        <t-form-item :label="$t('page.visit_log.export_time_range')">
          <t-date-range-picker v-model="exportForm.range" enable-time-picker clearable
            valueType="YYYY-MM-DD HH:mm:ss" style="width: 100%;" />
        </t-form-item>
        <t-form-item :label="$t('page.visit_log.export_tiers')">
          <t-checkbox-group v-model="exportForm.tiers">
            <t-checkbox value="access">{{ $t('page.visit_log.view_access') }}</t-checkbox>
            <t-checkbox value="event">{{ $t('page.visit_log.view_event') }}</t-checkbox>
            <t-checkbox value="payload">{{ $t('page.visit_log.export_tier_payload') }}</t-checkbox>
            <t-checkbox value="weblog">{{ $t('page.visit_log.export_tier_weblog') }}</t-checkbox>
          </t-checkbox-group>
        </t-form-item>
      </t-form>
    </t-dialog>


    <t-dialog :header="$t('page.visit_log.pop_detail_header')" :visible.sync="visitDetailVisible" width="80%"
      :confirmOnEnter="true" :onConfirm="() => { this.visitDetailVisible = false }"
      :onClose="() => { this.visitDetailVisible = false }">
      <visit-detail-page :prop_current_db="searchformData.current_db_name"
        :prop_req_uuid="visitDetailUid"></visit-detail-page>
    </t-dialog>

    <!-- AI 训练标记弹窗 -->
    <t-dialog :header="$t('page.visit_log.ai_mark_dialog_title')" :visible.sync="aiMarkDialogVisible" width="460px"
      :onClose="() => { this.aiMarkDialogVisible = false }">
      <t-form labelAlign="top">
        <t-form-item :label="$t('page.visit_log.ai_mark_verdict')">
          <t-radio-group v-model="aiMarkForm.verdict">
            <t-radio-button value="normal">{{ $t('page.visit_log.ai_mark_normal') }}</t-radio-button>
            <t-radio-button value="attack">{{ $t('page.visit_log.ai_mark_attack') }}</t-radio-button>
            <t-radio-button value="ignore">{{ $t('page.visit_log.ai_mark_ignore') }}</t-radio-button>
          </t-radio-group>
        </t-form-item>
        <t-form-item v-if="aiMarkForm.verdict === 'attack'" :label="$t('page.visit_log.ai_mark_category')">
          <t-select v-model="aiMarkForm.attackType" :options="aiCatSelectOptions" style="width: 240px" />
        </t-form-item>
      </t-form>
      <template #footer>
        <t-button v-if="aiMarkDialogRow && aiMarkMap[aiMarkDialogRow.req_uuid]" theme="danger" variant="outline"
          @click="confirmAiUnmark">{{ $t('page.visit_log.ai_mark_unmark') }}</t-button>
        <t-button theme="default" @click="aiMarkDialogVisible = false">{{ $t('common.cancel') }}</t-button>
        <t-button theme="primary" @click="confirmAiMark">{{ $t('common.confirm') }}</t-button>
      </template>
    </t-dialog>

    <!-- 列配置弹窗 -->
    <t-dialog :header="$t('common.column_config')" :visible.sync="columnControllerVisible" width="500px"
      @confirm="handleColumnControllerConfirm" @cancel="handleColumnControllerCancel">
      <div class="column-controller-content">
        <t-checkbox-group v-model="tempDisplayColumns" direction="vertical">
          <t-checkbox v-for="field in availableFields" :key="field.value" :value="field.value" :label="field.label" />
        </t-checkbox-group>
      </div>
    </t-dialog>

    <!-- IP提取问题对话框 -->
    <t-dialog :header="$t('page.visit_log.detail.ip_extract_issue')" :visible.sync="ipExtractDialogVisible" :width="800" :footer="false">
      <div slot="body">
        <!-- 这里改的是全局配置，站点里的「真实IP来源」会覆盖它；不写清楚用户会以为改了全局所有站点都变 -->
        <t-alert theme="warning" style="margin-bottom: 16px;">
          <div>
            <b>{{ $t('page.visit_log.detail.ip_extract_scope_title') }}</b>
            <div style="margin-top: 4px;">{{ $t('page.visit_log.detail.ip_extract_scope_desc') }}</div>
            <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <t-select v-model="ipExtractHostCode" clearable filterable :style="{ width: '220px' }"
                        :placeholder="$t('page.visit_log.detail.ip_extract_select_host')">
                <t-option v-for="item in realHostOptions" :value="item.value" :label="item.label" :key="item.value">{{ item.label }}</t-option>
              </t-select>
              <t-button size="small" :disabled="!ipExtractHostCode" @click="gotoHostIpSource">
                {{ $t('page.visit_log.detail.ip_extract_goto_host') }}
              </t-button>
              <t-button size="small" variant="outline" :disabled="!ipExtractHostCode" @click="openHostProbe">
                {{ $t('page.visit_log.detail.ip_extract_view_headers') }}
              </t-button>
            </div>
          </div>
        </t-alert>
        <p>{{ $t('page.visit_log.detail.ip_extract_issue_desc') }}</p>
        
        <!-- 视频教程链接 -->
        <t-alert theme="success" style="margin-bottom: 16px;">
          <template #icon>
            <span style="font-size: 20px;">📺</span>
          </template>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span>{{ $t('page.visit_log.detail.ip_extract_video_tutorial') }}</span>
            <t-button theme="primary" size="small" @click="openVideoTutorial">
              {{ $t('page.visit_log.detail.ip_extract_watch_tutorial') }}
            </t-button>
          </div>
        </t-alert>
        
        <!-- 常用头信息提示区域 -->
        <t-card :title="$t('page.visit_log.detail.ip_extract_common_headers')" style="margin-bottom: 20px;">
          <p style="margin-bottom: 12px; color: #666;">{{ $t('page.visit_log.detail.ip_extract_common_headers_desc') }}</p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
            <t-button size="small" variant="outline" @click="selectIPHeader('CF-Connecting-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.cloudflare') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('True-Client-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.cloudflare_enterprise') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('X-Forwarded-For')">
              {{ $t('page.visit_log.detail.ip_extract_headers.x_forwarded_for') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('X-Real-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.x_real_ip') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('X-Client-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.x_client_ip') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('Fastly-Client-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.fastly') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('Incap-Client-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.incapsula') }}
            </t-button>
            <t-button size="small" variant="outline" @click="selectIPHeader('CF-Connecting-IP,X-Forwarded-For,X-Real-IP')">
              {{ $t('page.visit_log.detail.ip_extract_headers.multiple') }}
            </t-button>
          </div>
          <t-alert theme="info" :message="$t('page.visit_log.detail.ip_extract_multiple_tips')" style="margin-top: 8px;" />
          <div style="margin-top: 8px; color: #999; font-size: 12px;">
            {{ $t('page.visit_log.detail.ip_extract_example') }}
          </div>
        </t-card>
        
        <t-form :data="ipExtractFormData" ref="ipExtractForm" :rules="ipExtractRules" @submit="onSubmitIPExtract" :labelWidth="150">
          <t-form-item :label="$t('page.systemconfig.label_configuration_item')" name="item">
            <t-input :style="{ width: '600px' }" v-model="ipExtractFormData.item" disabled></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.systemconfig.label_configuration_value')" name="value">
            <t-input :style="{ width: '600px' }" v-model="ipExtractFormData.value" :placeholder="$t('page.visit_log.detail.ip_extract_issue_tips')"></t-input>
            <div class="form-item-tips">{{ $t('page.visit_log.detail.ip_extract_issue_tips') }}</div>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="ipExtractDialogVisible = false">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>
    <!-- 某个站点单独看真实到达的请求头(与站点编辑页共用同一组件) -->
    <ip-source-probe-dialog :visible.sync="hostProbeVisible" :host-code="ipExtractHostCode"
                            :host-name="host_dic[ipExtractHostCode] || ''" />
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { SearchIcon } from 'tdesign-icons-vue';
import Trend from '@/components/trend/index.vue';
import { prefix } from '@/config/global';
import IpSourceProbeDialog from '@/pages/waf/host/components/IpSourceProbeDialog.vue';
import { allsharedblist, exportlog, delsharedb } from '@/apis/waflog/attacklog';
import { aiMarkLabelApi, aiUnmarkLabelApi, aiLabelByUuidsApi } from '@/apis/ai';
import VisitDetailPage from './detail/index.vue'

import { NowDate, ConvertStringToUnix, ConvertDateToString, ConvertUnixToDate } from '@/utils/date';
import {
  allhost
} from '@/apis/host';
import {
  get_detail_by_item_api,
  edit_system_config_api
} from '@/apis/systemconfig';
import {
  get_ui_preference_api,
  save_ui_preference_api
} from '@/apis/uipreference';

import { CONTRACT_STATUS, CONTRACT_STATUS_OPTIONS, CONTRACT_TYPES, CONTRACT_PAYMENT_TYPES } from '@/constants';

const staticColumn = ['action', 'op'];

// 默认不显示的可选列：新增后不会被"新列自动加入"逻辑塞进已有用户的可见列，需用户主动勾选
const OPT_OUT_NEW_COLUMNS = ['host_nickname', 'ai_score', 'user_agent', 'referer'];

// 列配置持久化：服务端（按登录账号）为准，localStorage 只作首屏秒开缓存 + 接口不可用兜底。
// v2 起把"可见列"与"用户已见过的列基线"合并到同一个 key，
// 避免 401 清缓存时只保留其中一个，导致列配置被重置（issue #893）
const COLUMN_CONFIG_KEY = 'attack_table_display_columns';
const LEGACY_KNOWN_COLUMNS_KEY = 'attack_table_known_columns'; // v1 遗留，迁移后删除
const COLUMN_CONFIG_VERSION = 2;
const COLUMN_PREF_NAME = 'visit_log_columns'; // 服务端偏好名（后端白名单内）

// 可由外部路由 query 预设的筛选字段（必须是 searchformData 的合法键，防止任意 query 注入）。
// 不含 unix_add_time_begin/end（由日期控件驱动）和 current_db_name（由 loadShareDbList 异步定值）
const ROUTE_FILTER_QUERY_KEYS = ['action', 'src_ip', 'host_code', 'rule', 'req_uuid', 'status_code', 'method', 'log_only_mode', 'view_type'];
// 外部页面可用这两个 query 指定日期区间（形如 2026-07-01 00:00:00），不传则用"今天"
const ROUTE_DATE_QUERY_KEYS = ['date_begin', 'date_end'];

const GROUP_COLUMNS = [
  {
    label: '正常维度',
    value: 'index',
    columns: ['action', 'rule', 'create_time'],
  },
  {
    label: '次要维度',
    value: 'secondary',
    columns: ['action', 'rule', 'create_time'],
  },
  {
    label: '数据维度',
    value: 'data',
    columns: ['action', 'rule', 'create_time'],
  },
];

export default Vue.extend({
  name: 'WebLogList',
  components: {
    IpSourceProbeDialog,
    SearchIcon,
    Trend,
    VisitDetailPage
  },
  props: {
    attack_ip: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      // 这次查询覆盖了哪些分区（后端给）：自动模式与识别码直查都靠它向用户解释数据来源
      queryMeta: { shards: [], found_in: "", scanned: 0, uuid_lookup: false, sort_forced_time: false, partial: false, took_ms: 0, issues: [] },
      shardGroups: [],
      covExpanded: false,
      shardManageVisible: false,
      shardRows: [],
      quickRange: "30",
      dateControl: {
        presets: {
          最近300天: [ConvertDateToString(new Date(+new Date() - 86400000 * 299)) + " 00:00:00", ConvertDateToString(new Date()) + " 23:59:59"],
          最近7天: [ConvertDateToString(new Date(+new Date() - 86400000 * 6)) + " 00:00:00", ConvertDateToString(new Date()) + " 23:59:59"],
          最近3天: [ConvertDateToString(new Date(+new Date() - 86400000 * 2)) + " 00:00:00", ConvertDateToString(new Date()) + " 23:59:59"],
          今天: [ConvertDateToString(new Date()) + " 00:00:00", ConvertDateToString(new Date()) + " 23:59:59"],
        },
        range1: ['2023-11-01 00:00:00', '2023-11-16 23:59:59'],
      },
      action_options: [
        {
          label: this.$t('common.defense_status.all'),
          value: ''
        },
        {
          label: this.$t('common.defense_status.stop'),
          value: '阻止'
        },
        {
          label: this.$t('common.defense_status.pass'),
          value: '放行'
        },
        {
          label: this.$t('common.defense_status.forbid'),
          value: '禁止'
        },
      ],
      method_options: [
        {
          label: this.$t('common.all'),
          value: ''
        },
        {
          label: 'POST',
          value: 'POST'
        },
        {
          label: 'GET',
          value: 'GET'
        },
        {
          label: 'CONNECT',
          value: 'CONNECT'
        }
        ,
        {
          label: 'HEAD',
          value: 'HEAD'
        },
        {
          label: 'OPTIONS',
          value: 'OPTIONS'
        },
        {
          label: 'PRI',
          value: 'PRI'
        }
      ],
      CONTRACT_STATUS,
      CONTRACT_STATUS_OPTIONS,
      CONTRACT_TYPES,
      CONTRACT_PAYMENT_TYPES,
      prefix,
      dataLoading: false,
      data: [],
      aiMarkMap: {}, // req_uuid -> { mark, attack_type }，AI训练标签人工修正状态
      aiMarkDialogVisible: false,
      aiMarkDialogRow: null,
      aiMarkForm: { verdict: 'attack', attackType: '' },
      selectedRowKeys: [],
      value: 'first',
      customText: false,
      columnControllerVisible: false, // 控制列配置弹窗显示
      tempDisplayColumns: [], // 临时存储列配置
      // 默认显示的列配置
      defaultDisplayColumns: staticColumn.concat(['guest_identification', 'time_spent', 'create_time', 'host', 'method', 'url', 'src_ip', 'country','log_only_mode','req_uuid']),
      displayColumns: staticColumn.concat(['guest_identification', 'time_spent', 'create_time', 'host', 'method', 'url', 'src_ip', 'country', 'log_only_mode' ]),
      // 全部列定义（访问日志视图由 computed columns 摘掉 header 列——报文已搬进报文表，窄行没有这一列）
      allColumns: [
        {
          title: this.$t('page.visit_log.guest_identity'),
          width: 100,
          ellipsis: true,
          colKey: 'guest_identification',
          filter: {
            type: 'input',
            resetValue: '',
            // 按下 Enter 键时也触发确认搜索
            confirmEvents: ['onEnter'],
            props: {
              placeholder: this.$t('common.placeholder'),
            },
            // 是否显示重置取消按钮，一般情况不需要显示
            showConfirmAndReset: true,
          },
        },
        {
          title: this.$t('page.visit_log.time_spent'),
          width: 100,
          ellipsis: true,
          colKey: 'time_spent',
          sorter: true
        },
        {
          title: this.$t('page.visit_log.risk_level'),
          width: 60,
          ellipsis: true,
          colKey: 'risk_level',
        },
        {
          title: this.$t('common.status'),
          width: 60,
          ellipsis: true,
          colKey: 'action',
        },
        {
          title: this.$t('page.visit_log.log_only_mode'),
          width: 120,
          ellipsis: true,
          colKey: 'log_only_mode',
        },
        {
          title: this.$t('page.visit_log.ai_score'),
          width: 90,
          ellipsis: true,
          colKey: 'ai_score',
          sorter: true,
        },
        {
          title: this.$t('page.visit_log.trigger_rule'),
          align: 'left',
          width: 150,
          ellipsis: true,
          colKey: 'rule',
        },
        {
          title: this.$t('page.visit_log.time'),
          width: 170,
          ellipsis: true,
          colKey: 'create_time',
          sorter: true
        },
        {
          title: this.$t('page.visit_log.domain'),
          align: 'left',
          width: 150,
          ellipsis: true,
          colKey: 'host',
        },
        {
          //网站昵称：非 web_logs 真实列，由 host_code 在前端换取，故不支持排序/过滤
          title: this.$t('page.visit_log.host_nickname'),
          align: 'left',
          width: 130,
          ellipsis: true,
          colKey: 'host_nickname',
          cell: 'host_nickname',
        },

        {
          title: this.$t('page.visit_log.request'),
          width: 70,
          ellipsis: true,
          colKey: 'method',
        },
        {
          title: this.$t('page.visit_log.source_ip'),
          width: 200,
          ellipsis: true,
          colKey: 'src_ip',
          cell: 'src_ip',
        },
        {
          title: this.$t('page.visit_log.country'),
          width: 100,
          ellipsis: true,
          colKey: 'country',
        },
        {
          title: this.$t('page.visit_log.province'),
          width: 100,
          ellipsis: true,
          colKey: 'province',
        }, {
          title: this.$t('page.visit_log.city'),
          width: 100,
          ellipsis: true,
          colKey: 'city',
        },
        { 
          title: this.$t('page.visit_log.req_uuid'),
          width: 160,
          ellipsis: true,
          colKey: 'req_uuid',
          filter: {
            type: 'input',
            resetValue: '',
            // 按下 Enter 键时也触发确认搜索
            confirmEvents: ['onEnter'],
            props: {
              placeholder: this.$t('common.placeholder'),
            },
            // 是否显示重置取消按钮，一般情况不需要显示
            showConfirmAndReset: true,
          },
        }, 
        {
          title: this.$t('page.visit_log.access_url'),
          width: 160,
          ellipsis: true,
          colKey: 'url',
        },
        {
          title: 'Header',
          width: 300,
          ellipsis: true,
          colKey: 'header',
          filter: {
            type: 'input',
            resetValue: '',
            // 按下 Enter 键时也触发确认搜索
            confirmEvents: ['onEnter'],
            props: {
              placeholder: this.$t('common.placeholder'),
            },
            // 是否显示重置取消按钮，一般情况不需要显示
            showConfirmAndReset: true,
          },
        },
        {
          title: 'status',
          width: 100,
          ellipsis: true,
          colKey: 'status',
        },
        {
          // UA / Referer：窄行上的列，两个视图都可筛选；访问日志视图靠它们替代「请求」全文筛选
          title: this.$t('page.visit_log.user_agent'),
          width: 200,
          ellipsis: true,
          colKey: 'user_agent',
          filter: {
            type: 'input',
            resetValue: '',
            confirmEvents: ['onEnter'],
            props: {
              placeholder: this.$t('common.placeholder'),
            },
            showConfirmAndReset: true,
          },
        },
        {
          title: this.$t('page.visit_log.referer'),
          width: 200,
          ellipsis: true,
          colKey: 'referer',
          filter: {
            type: 'input',
            resetValue: '',
            confirmEvents: ['onEnter'],
            props: {
              placeholder: this.$t('common.placeholder'),
            },
            showConfirmAndReset: true,
          },
        },
        {
          align: 'left',
          width: 120,
          colKey: 'op',
          title: this.$t('common.op'),
        },
      ],
      rowKey: 'REQ_UUID',
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
      searchValue: '',
      confirmVisible: false,
      deleteIdx: -1,
      //顶部搜索
      searchformData: {
        rule: "",
        req_uuid: "",
        action: "",
        src_ip: "",
        host_code: "",
        status_code: "",
        method: "",
        unix_add_time_begin: "",
        unix_add_time_end: "",
        current_db_name: "auto",
        log_only_mode: "",
        view_type: "access", // access=访问日志(全量窄行) event=安全事件
      },
      //table 字段
      table: {
        multipleSort: true
      },
      //排序字段
      sorts: {
        sortBy: "unix_add_time",
        descending: true,
      },
      //筛选字段
      filters: {
        filter_by: "",
        filter_value: "",
      },
      //主机字典
      host_dic: {},
      ipExtractHostCode: "", //IP提取弹窗里选中的站点(用于直达站点配置/查看该站点真实请求头)
      hostProbeVisible: false,
      //「IP提取有问题?」里选站点用的列表：只含真实站点("全局网站"不是站点，没有自己的真实IP来源配置)。
      //必须整体赋值成数组，不能在模板里现算 host_dic —— Vue2 对新增 key 不响应，会渲染成空
      realHostOptions: [],
      //主机昵称字典 host_code -> 纯昵称
      host_nickname_dic: {},
      //日志存档字典
      share_db_dic: {},
      //当前是否为文件型数据库(SQLite)：仅 SQLite 支持日志文件导出，MySQL 隐藏导出按钮
      isFileBasedDb: true,
      //export db
      exportDbVisible: false,
      // 导出物=「按时间段导出选定层」的新 SQLite 文件（不再是整库备份）
      exportForm: { range: [], tiers: ['access', 'event', 'payload', 'weblog'] },
      visitDetailVisible: false,//访问详情弹窗
      visitDetailUid: "",//访问详情id
      
      // 日志配置相关
      logConfigVisible: false, // 日志配置区域是否展开
      logConfigSaving: false, // 保存配置按钮加载状态
      logConfig: {
        record_log_type: 'all',
        record_max_req_body_length: '0',
        record_max_res_body_length: '0',
        record_resp: '0',
        record_all_src_byte_info: '0',
        delete_history_log_day: '7',
        log_db_size: '0',
        db_file_size: '0',
        log_persist_enable: '0',
        batch_insert: '0',
        ip_tag_db: '0',
        access_log_mode: 'db',
        access_log_retention_days: '30',
      },
      logConfigItems: {}, // 存储配置项的完整信息（包含ID等）
      
      // IP提取配置相关
      ipExtractDialogVisible: false,
      ipExtractFormData: {
        item: 'gwaf_proxy_header',
        value: '',
        remarks: '获取访客IP头信息（按照顺序）'
      },
      ipExtractRules: {
        item: [{ required: true, message: '', type: 'error' }],
        value: [{ required: false, message: '', type: 'error' }]
      }
    };
  },
  computed: {
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    },
    // 当前视图可见的列：访问日志视图没有 header 列（报文已搬进报文表，UA/Referer 顶替它的筛选位）
    columns() {
      if (this.searchformData.view_type !== 'access') {
        return this.allColumns;
      }
      return this.allColumns.filter((c) => c.colKey !== 'header');
    },
    // 内嵌在风险日志详情里时，访问日志视图展示的是该 IP 的全部行为
    shardManageColumns() {
      return [
        { colKey: 'label', title: this.$t('page.visit_log.log_archive_db'), width: 230 },
        { colKey: 'cnt', title: this.$t('page.visit_log.shard_rows'), width: 110 },
        { colKey: 'tiers', title: this.$t('page.visit_log.shard_tiers'), width: 280 },
        { colKey: 'op', title: this.$t('common.operation'), width: 90 },
      ];
    },
    // 覆盖概括：分区一多就不该把它们全铺在提示条里，先给「跨度 + 总条数」
    shardCoverSummary() {
      const list = this.queryMeta.shards || [];
      if (list.length < 2) return '';
      let total = 0;
      list.forEach((x) => { total += Number(x.count) || 0; });
      // shards 由后端按时间从新到旧给出
      const newest = this.shardTitle(list[0].name).split(' ·')[0];
      const oldest = this.shardTitle(list[list.length - 1].name).split(' ·')[0];
      return ' · ' + oldest + ' ~ ' + newest + (total ? this.fmtCnt(total) : '');
    },
    // 填了访问识别码 = 点查，时间与分区都不该再要求用户选
    isUuidLookup() {
      return !!(this.searchformData.req_uuid && this.searchformData.req_uuid.trim());
    },
    accessViewLabel() {
      return this.attack_ip !== '' ? this.$t('page.visit_log.view_access_all') : this.$t('page.visit_log.view_access');
    },
    // 确认攻击时的类别下拉选项（空=默认自动判定）
    aiCatSelectOptions() {
      return [
        { label: this.$t('page.visit_log.ai_cat_auto'), value: '' },
        { label: this.$t('page.visit_log.ai_cat_sqli'), value: 'sqli' },
        { label: this.$t('page.visit_log.ai_cat_xss'), value: 'xss' },
        { label: this.$t('page.visit_log.ai_cat_rce'), value: 'rce' },
        { label: this.$t('page.visit_log.ai_cat_traversal'), value: 'traversal' },
        { label: this.$t('page.visit_log.ai_cat_inject'), value: 'inject' },
        { label: this.$t('page.visit_log.ai_cat_scan'), value: 'scan' },
        { label: this.$t('page.visit_log.ai_cat_other'), value: 'other' },
      ];
    },
    // 攻击类别 code -> 显示名
    aiCatLabels() {
      return {
        sqli: this.$t('page.visit_log.ai_cat_sqli'),
        xss: this.$t('page.visit_log.ai_cat_xss'),
        rce: this.$t('page.visit_log.ai_cat_rce'),
        traversal: this.$t('page.visit_log.ai_cat_traversal'),
        inject: this.$t('page.visit_log.ai_cat_inject'),
        scan: this.$t('page.visit_log.ai_cat_scan'),
        owasp: 'OWASP',
        other: this.$t('page.visit_log.ai_cat_other'),
      };
    },
    // 可用字段列表
    availableFields() {
      return [
        { value: 'action', label: this.$t('common.status') },
        { value: 'rule', label: this.$t('page.visit_log.trigger_rule') },
        { value: 'create_time', label: this.$t('common.create_time') },
        { value: 'host', label: this.$t('page.visit_log.domain') },
        { value: 'host_nickname', label: this.$t('page.visit_log.host_nickname') },
        { value: 'method', label: this.$t('page.visit_log.access_method') },
        { value: 'url', label: this.$t('page.visit_log.access_url') },
        { value: 'header', label: this.$t('page.visit_log.request') },
        { value: 'user_agent', label: this.$t('page.visit_log.user_agent') },
        { value: 'referer', label: this.$t('page.visit_log.referer') },
        { value: 'country', label: this.$t('page.visit_log.country') },
        { value: 'province', label: this.$t('page.visit_log.province') },
        { value: 'city', label: this.$t('page.visit_log.city') },
        { value: 'status', label: this.$t('page.visit_log.response_code') },
        { value: 'risk_level', label: this.$t('page.visit_log.risk_level') },
        { value: 'guest_identification', label: this.$t('page.visit_log.guest_identity') },
        { value: 'time_spent', label: this.$t('page.visit_log.time_spent') },
        { value: 'log_only_mode', label: this.$t('page.visit_log.log_only_mode') },
        { value: 'req_uuid',label:this.$t('page.visit_log.req_uuid')},
        { value: 'ai_score', label: this.$t('page.visit_log.ai_score') }

      ];
    }
  },
  created() {
    console.log(NowDate)
    this.dateControl.range1[0] = NowDate + " 00:00:00"
    this.dateControl.range1[1] = NowDate + " 23:59:59"
    this.searchformData.unix_add_time_begin = ConvertStringToUnix(this.dateControl.range1[0]).toString()
    this.searchformData.unix_add_time_end = ConvertStringToUnix(this.dateControl.range1[1]).toString()
    console.log(this.range1)


  },
  mounted() {
    console.log("attack list mounted ");
    // 先用本地缓存的列配置渲染首屏
    this.loadColumnConfig();
    // 加载日志配置
    this.loadLogConfig();

    // 作为弹窗子组件内嵌时（风险日志 / IP失败页），$route 是宿主页面的路由，不参与列配置同步与 query 预设
    const isOwnRoute = this.$route.name === 'WafvisitLog';
    if (isOwnRoute) {
      // 服务端为准，异步覆盖本地缓存结果
      this.loadColumnConfigFromServer();
    }

    const routeFilter = isOwnRoute ? this.collectRouteFilterQuery() : {};
    if (Object.keys(routeFilter).length > 0) {
      // 【issue #893 问题2】外部页面（首页卡片 / IP排行）带着筛选条件跳进来时必须以 query 为准：
      // 跳过 vuex 里上次离开时的搜索条件恢复，否则 searchformData 会被整体覆盖，
      // 预设筛选丢失（表现为"刷新一次才生效"）
      this.applyRouteFilterQuery(routeFilter);
      // 换了筛选条件，停在第 N 页没有意义；只沿用用户的每页条数偏好
      this.pagination.current = 1;
      const cached = this.$store.state.attacklog.msgData;
      if (cached && cached.pagesize) {
        this.pagination.pageSize = cached.pagesize;
      }
      // 日期区间保持 created() 里设置的"今天"，与首页卡片的"今日"口径一致
    } else if (this.$store.state.attacklog.msgData) {
      // 判断 vuex 中是否有保存的搜索参数
      const attack = this.$store.state.attacklog;
      this.pagination.current = attack.msgData.currentpage;
      this.pagination.pageSize = attack.msgData.pagesize;
      // 浅拷贝 + 当前默认对象打底：直接引用 store 里的对象会让后续表单编辑绕过 mutation 改 state，
      // 也会让弹窗内嵌实例把 src_ip 写脏主列表页缓存；历史缓存可能缺字段，打底避免 v-model 绑到 undefined
      this.searchformData = { ...this.searchformData, ...attack.msgData.searchData };
      console.log('daysrc', attack.msgData.searchData)
      let newrange = Array()
      newrange[0] = ConvertUnixToDate(parseInt(attack.msgData.searchData.unix_add_time_begin))
      newrange[1] = ConvertUnixToDate(parseInt(attack.msgData.searchData.unix_add_time_end))
      //console.log(this.dateControl.range1)
      this.$set(this.dateControl, "range1", newrange)
    }

    this.loadShareDbList()
    this.loadHostList().then(() => {
      this.getList("");
    });
  },
  watch: {
    // 同一路由内 query 变化（浏览器前进/后退等）；首次进入由 mounted 处理，此处不触发
    '$route.query': {
      deep: true,
      handler(newQuery, oldQuery) {
        if (this.$route.name !== 'WafvisitLog') return;
        if (JSON.stringify(newQuery) === JSON.stringify(oldQuery)) return;
        const picked = this.collectRouteFilterQuery();
        // 未在 query 中出现的筛选字段一律清空，避免上一次的筛选残留；
        // query 全空（如从带筛选的 URL 点侧边栏菜单回来）同样按"清空重查"处理
        ROUTE_FILTER_QUERY_KEYS.forEach((key) => {
          this.$set(this.searchformData, key, Object.prototype.hasOwnProperty.call(picked, key) ? picked[key] : '');
        });
        // 日期区间与分页复位，口径与 mounted 分支一致
        this.applyRouteDateQuery(picked);
        this.pagination.current = 1;
        this.getList("");
      },
    },
    attack_ip(newVal) {
      if (newVal !== "") {
        this.updateSearchFormAttackPage();  // 当 attack_ip 变化时，更新表单数据
      }
    }
  },
  beforeRouteLeave(to, from, next) {
    console.log("attack list beforeRouteLeave ");
    // vuex 存储操作
    this.$store.dispatch("attacklog/setAttackMsgData", {
      //query: this.queryParam,
      pagesize: this.pagination.pageSize,
      currentpage: this.pagination.current,
      searchData: { ...this.searchformData },  // 存快照，避免 store 持有活引用被后续编辑写脏
    })
    next(); // 继续后续的导航解析过程
  },
  methods: {
    // 点日志里的 IP 直接开归属查询弹窗，省得用户复制粘贴
    openIpLookup(ip) {
      if (!ip) return;
      this.$refs.ipLookup && this.$refs.ipLookup.open(ip);
    },
    // 收集路由 query 中的显式筛选意图。
    // 用 hasOwnProperty 判定"存在"：?action= 得到 ''、?action 得到 null，
    // 这两种都属于"调用方明确要求把该字段设成空"，用 != null 判定会漏掉后者
    collectRouteFilterQuery() {
      const query = (this.$route && this.$route.query) || {};
      const picked = {};
      ROUTE_FILTER_QUERY_KEYS.concat(ROUTE_DATE_QUERY_KEYS).forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(query, key)) return;
        const v = query[key];
        // vue-router 对重复 key 会给数组，取第一个；null（?key 无值）归一成空串
        picked[key] = Array.isArray(v) ? (v[0] == null ? '' : String(v[0])) : (v == null ? '' : String(v));
      });
      return picked;
    },

    // 把 query 预设应用到当前（created 已初始化为今天）的搜索表单上
    applyRouteFilterQuery(picked) {
      Object.keys(picked).forEach((key) => {
        if (ROUTE_DATE_QUERY_KEYS.includes(key)) return; // 日期区间单独处理
        this.$set(this.searchformData, key, picked[key]);
      });
      this.applyRouteDateQuery(picked);
    },

    // 应用路由带来的日期区间；未指定则复位成"今天"，与首页"今日"类入口口径一致
    applyRouteDateQuery(picked) {
      const begin = picked.date_begin;
      const end = picked.date_end;
      const newRange = (begin && end)
        ? [begin, end]
        : [NowDate + " 00:00:00", NowDate + " 23:59:59"];
      this.$set(this.dateControl, "range1", newRange);
      this.searchformData.unix_add_time_begin = ConvertStringToUnix(newRange[0]).toString();
      this.searchformData.unix_add_time_end = ConvertStringToUnix(newRange[1]).toString();
    },

    // 切换列配置弹窗
    toggleColumnController() {
      this.tempDisplayColumns = [...this.displayColumns];
      this.columnControllerVisible = true;
    },
    // 确认列配置
    handleColumnControllerConfirm() {
      this.displayColumns = [...this.tempDisplayColumns];
      this.columnControllerVisible = false;
      // 触发列配置变化回调
      this.handleDisplayColumnsChange(this.displayColumns);
    },
    // 取消列配置
    handleColumnControllerCancel() {
      this.columnControllerVisible = false;
      this.tempDisplayColumns = [];
    },
    // 全部可选列（列配置弹窗里能勾选的字段）
    allColumnFieldKeys() {
      return this.availableFields.map((f) => f.value);
    },

    // 读取 v1 遗留的 known 基线（仅迁移期使用）。无记录/损坏返回 null，以区别于"空数组"
    readLegacyKnownColumns() {
      try {
        const raw = localStorage.getItem(LEGACY_KNOWN_COLUMNS_KEY);
        if (!raw) return null;
        const arr = JSON.parse(raw);
        return Array.isArray(arr) && arr.length > 0 ? arr : null;
      } catch (e) {
        return null;
      }
    },

    // 统一落盘本地缓存：columns 与 known 必须成对写入，杜绝两者脱节。
    // 写成功后才删除 v1 遗留 key，避免写失败（配额/无痕模式）时基线丢失
    persistColumnConfigLocal(columns, knownKeys) {
      const payload = {
        v: COLUMN_CONFIG_VERSION,
        account: localStorage.getItem('current_account') || '',
        columns: Array.from(new Set(columns)),
        known: (knownKeys && knownKeys.length) ? Array.from(new Set(knownKeys)) : this.allColumnFieldKeys(),
      };
      localStorage.setItem(COLUMN_CONFIG_KEY, JSON.stringify(payload)); // 异常交由调用方处理
      try {
        localStorage.removeItem(LEGACY_KNOWN_COLUMNS_KEY);
      } catch (e) { /* ignore */ }
    },

    // 合并列配置：known 为空则一次性按默认列补齐；否则只补"用户从未见过的新列"
    mergeColumnConfig(columns, known) {
      const allFieldKeys = this.allColumnFieldKeys();
      const merged = [...columns];
      if (!known || known.length === 0) {
        // 兼容旧缓存（无 known 记录）：仅此一次按默认列补齐，之后以 known 记录为准
        this.defaultDisplayColumns.forEach((col) => {
          if (!merged.includes(col)) merged.push(col);
        });
      } else {
        // 仅自动加入"用户从未见过的新功能列"（如新增的 ai_score），
        // 用户主动取消勾选的列刷新后不再被强行加回
        allFieldKeys.forEach((col) => {
          // 默认不显示的新列（需用户主动在列配置里勾选），不参与"新列自动加入"
          if (OPT_OUT_NEW_COLUMNS.includes(col)) return;
          if (!known.includes(col) && !merged.includes(col)) merged.push(col);
        });
      }
      return merged;
    },

    // 落盘本地缓存但不让写失败影响界面（无痕模式/配额满时只告警）
    persistColumnConfigLocalSafe(columns, knownKeys) {
      try {
        this.persistColumnConfigLocal(columns, knownKeys);
      } catch (e) {
        console.warn('写入本地列配置缓存失败（不影响使用）:', e);
      }
    },

    // 加载本地缓存的列配置（同步，首屏立即渲染，避免闪一下默认列）
    loadColumnConfig() {
      const allFieldKeys = this.allColumnFieldKeys();
      let columns = null;
      let known = null; // null = 无基线记录
      try {
        const raw = localStorage.getItem(COLUMN_CONFIG_KEY);
        // 全新用户：以当前默认可见列为准并立刻写下基线，
        // 否则下次挂载会因 known 缺失而走"旧缓存兼容"分支强行补齐默认列
        if (!raw) {
          this.persistColumnConfigLocalSafe(this.displayColumns, allFieldKeys);
          return;
        }

        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // v1 旧格式：纯数组，基线只能来自遗留 key（必须读，否则用户主动取消的默认列会被加回来）
          columns = parsed;
          known = this.readLegacyKnownColumns();
        } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.columns)) {
          // v2 格式；账号不一致时忽略缓存（多账号切换不把 A 的配置显示给 B），
          // 先落到默认配置，等服务端返回本账号的真实配置
          const currentAccount = localStorage.getItem('current_account') || '';
          if (parsed.account && currentAccount && parsed.account !== currentAccount) {
            this.displayColumns = [...this.defaultDisplayColumns];
            return;
          }
          columns = parsed.columns;
          known = Array.isArray(parsed.known) && parsed.known.length > 0 ? parsed.known : null;
        }
      } catch (error) {
        console.error(this.$t('common.column_config_load_failed'), error);
        // 解析失败：内存里用默认配置，但不覆盖 localStorage，避免一次解析异常永久丢配置
        this.displayColumns = [...this.defaultDisplayColumns];
        return;
      }

      if (!columns || columns.length === 0) {
        // 空/损坏：回退默认并重建基线，保证下次挂载稳定
        this.displayColumns = [...this.defaultDisplayColumns];
        this.persistColumnConfigLocalSafe(this.displayColumns, allFieldKeys);
        return;
      }

      const merged = this.mergeColumnConfig(columns, known);
      this.displayColumns = merged;
      // 关键：合并结果 + 最新基线一起落盘，让加载幂等（旧实现只回写 known 不回写 columns，
      // 导致"本次挂载合并出 A、下次挂载读出 B"的不对称，正是 #893 的根因）。
      // 落盘失败不能影响已经算对的界面配置，所以走 Safe 版本
      this.persistColumnConfigLocalSafe(merged, allFieldKeys);
    },

    // 从服务端加载列配置（异步，服务端为准，覆盖本地缓存结果）
    loadColumnConfigFromServer() {
      get_ui_preference_api({ pref_name: COLUMN_PREF_NAME })
        .then((res) => {
          if (res.code !== 0) {
            console.warn('获取服务端列配置失败:', res.msg);
            return;
          }
          if (res.data && res.data.id && res.data.pref_json) {
            const payload = JSON.parse(res.data.pref_json);
            if (payload && Array.isArray(payload.columns) && payload.columns.length > 0) {
              const known = Array.isArray(payload.known) && payload.known.length > 0 ? payload.known : null;
              const merged = this.mergeColumnConfig(payload.columns, known);
              this.displayColumns = merged;
              this.persistColumnConfigLocalSafe(merged, this.allColumnFieldKeys());
              return;
            }
          }
          // 服务端还没有记录：把当前（本地缓存/默认）配置同步上去一次，
          // 让存量用户的 localStorage 配置无感迁移到服务端
          this.syncColumnConfigToServer().catch(() => { });
        })
        .catch((err) => {
          // 接口不可用（如后端为老版本）时保持本地缓存结果，不打扰用户
          console.warn('获取服务端列配置异常:', err);
        });
    },

    // 把当前列配置同步到服务端
    syncColumnConfigToServer() {
      const payload = {
        v: COLUMN_CONFIG_VERSION,
        columns: Array.from(new Set(this.displayColumns)),
        known: this.allColumnFieldKeys(),
      };
      return save_ui_preference_api({
        pref_name: COLUMN_PREF_NAME,
        pref_json: JSON.stringify(payload),
      }).then((res) => {
        if (res.code !== 0) {
          return Promise.reject(new Error(res.msg || 'save failed'));
        }
        return res;
      });
    },

    // 保存列配置（本地缓存 + 服务端）
    saveColumnConfig(successMsgKey) {
      // known 更新为全量：用户此刻正看着列配置弹窗里的全部字段，等价于"全部已见过"，
      // 这保证他主动取消的列（含 OPT_OUT_NEW_COLUMNS 里的列）之后不会被"新列自动加入"逻辑加回
      this.persistColumnConfigLocalSafe(this.displayColumns, this.allColumnFieldKeys());
      // 成功提示等服务端返回后再弹，避免与调用方的提示重复/乱序
      const successKey = successMsgKey || 'common.column_config_saved';
      this.syncColumnConfigToServer()
        .then(() => {
          this.$message.success(this.$t(successKey));
        })
        .catch((error) => {
          console.warn('同步列配置到服务端失败:', error);
          this.$message.warning(this.$t('common.column_config_sync_failed'));
        });
    },

    // 重置列配置为默认值
    resetColumnConfig() {
      if (confirm(this.$t('common.column_config_reset_confirm'))) {
        this.displayColumns = [...this.defaultDisplayColumns];
        this.saveColumnConfig('common.column_config_reset_success');
      }
    },

    // 处理列配置变化
    handleDisplayColumnsChange(columns) {
      this.displayColumns = columns;
      this.saveColumnConfig();
    },
    updateSearchFormAttackPage() {
      console.log("updateSearchFormAttackPage")
      if (this.attack_ip != "") {
        console.log("attack ip index", this.attack_ip)
        this.searchformData.src_ip = this.attack_ip
        // 风险详情默认落在安全事件视图（命中明细）；旁边的「全部行为」页签是该 IP 的访问日志视图
        this.searchformData.view_type = 'event'
        this.dateControl.range1[0] = "2022-01-01 00:00:00"
        this.dateControl.range1[1] = NowDate + " 23:59:59"
        this.searchformData.unix_add_time_begin = ConvertStringToUnix(this.dateControl.range1[0]).toString()
        this.searchformData.unix_add_time_end = ConvertStringToUnix(this.dateControl.range1[1]).toString()
        this.pagination.current = 1
        this.getList("")
      }

    },
    // 条数写成人能读的样子：13.5 万条 而不是 135140
    fmtCnt(n) {
      if (n === undefined || n === null || n === '') return '';
      const v = Number(n);
      if (isNaN(v)) return '';
      if (v >= 10000) return ' · ' + (v / 10000).toFixed(1) + ' 万条';
      return ' · ' + v + ' 条';
    },
    // 归档分片的显示名：实时单独标出，按月分区显示「年-月」，
    // 旧分片显示起止时间——同一天切了好几个时必须带上时分，否则七条长得一模一样。
    shardLabel(item) {
      const cnt = this.fmtCnt(item.cnt);
      if (item.is_current) {
        return this.$t('page.visit_log.shard_live') + cnt;
      }
      // 按层过期之后，窄行那一层可能已经被回收，只剩安全事件与报文——
      // 下拉里得标出来，否则选中它再切到访问日志视图只会得到一句生硬的报错
      // 登记还在、存储已不在：照样列出来（好让人知道有这么个分区、去分区管理删登记），但选不了
      const note = item.missing
        ? ' · ' + this.$t('page.visit_log.shard_missing')
        : (item.tiers && item.tiers.length > 0 && item.tiers.indexOf('access_log') < 0)
          ? ' · ' + this.$t('page.visit_log.shard_only_event')
          : '';
      if (item.period_key && item.period_key.length >= 6) {
        return item.period_key.substring(0, 4) + '-' + item.period_key.substring(4, 6) + cnt + note;
      }
      const day = (v) => (v ? String(v).substring(0, 10) : '');
      const hm = (v) => (v ? String(v).substring(11, 16) : '');
      const from = day(item.start_time);
      const to = day(item.end_time);
      if (from && from === to) {
        // 同一天内切出来的：带时分才分得清
        const a = hm(item.start_time);
        const b = hm(item.end_time);
        return (a || b ? from + ' ' + a + '~' + b : from) + cnt + note;
      }
      if (from || to) {
        return from + ' ~ ' + to + cnt + note;
      }
      // 时间信息都缺（脏数据）：退回显示原始标识，至少还能对上库里的东西
      return item.file_name + cnt + note;
    },
    // 识别码直查模式：填了访问识别码就忽略时间与分区，后端按主键跨分区找
    applyQuickRange() {
      const d = (t) => {
        const p = (n) => (n < 10 ? '0' + n : '' + n);
        return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate());
      };
      const days = parseInt(this.quickRange, 10);
      const end = d(new Date()) + ' 23:59:59';
      const start = days > 0
        ? d(new Date(+new Date() - 86400000 * (days - 1))) + ' 00:00:00'
        : '1970-01-02 00:00:00';
      this.dateControl.range1 = [start, end];
    },
    // 分区管理：打开前刷一次，免得删完别处看到的还是旧列表
    openShardManage() {
      this.loadShareDbList();
      this.shardManageVisible = true;
    },
    tierLabel(t) {
      const m = {
        access_log: this.$t('page.visit_log.view_access'),
        security_event: this.$t('page.visit_log.view_event'),
        event_payload: this.$t('page.visit_log.export_tier_payload'),
        web_logs: this.$t('page.visit_log.export_tier_weblog'),
      };
      return m[t] || t;
    },
    confirmDeleteShard(row) {
      const that = this;
      const name = this.shardTitle(row.file_name);
      const confirmDia = this.$dialog.confirm({
        header: this.$t('page.visit_log.shard_del_title'),
        body: this.$t('page.visit_log.shard_del_body', { name: name, raw: row.file_name }),
        theme: 'warning',
        confirmBtn: { content: this.$t('common.delete'), theme: 'danger' },
        onConfirm: ({ e }) => {
          delsharedb({ file_name: row.file_name })
            .then((res) => {
              if (res.code === 0) {
                confirmDia.destroy();
                that.$message.success(res.msg || that.$t('page.visit_log.shard_del_done'));
                that.loadShareDbList();
                // 删掉的可能正好是当前锁定的分区，回到自动模式免得查了个不存在的东西
                if (that.searchformData.current_db_name === row.file_name) {
                  that.searchformData.current_db_name = 'auto';
                }
                that.getList('all');
              } else {
                confirmDia.hide();
                that.$message.error(res.msg || that.$t('page.visit_log.shard_del_fail'));
              }
            })
            .catch(() => {
              confirmDia.hide();
              that.$message.error(that.$t('page.visit_log.shard_del_fail'));
            });
        },
      });
    },
    // 空态里点「IP归属查询」：带上当前筛的来源IP，直接看它是不是被排除清单命中了
    openIpLookupForHint() {
      const ip = (this.searchformData.src_ip || '').trim();
      this.openIpLookup(ip);
    },
    // 展开「日志配置」卡并滚到顶：保留天数就在那里改
    openRetentionSetting() {
      this.logConfigVisible = true;
      this.$nextTick(() => {
        const el = document.querySelector('.log-config-card');
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
    // 超预算时的一键补救：把时间范围收到最近 7 天再查
    narrowRange() {
      this.quickRange = "7";
      this.applyQuickRange();
      this.getList('all');
    },
    // 分区的显示名：优先用下拉里已经算好的标签，取不到就退回原始标识
    shardTitle(name) {
      if (!name) return '';
      return this.share_db_dic[name] || name;
    },
    loadShareDbList() {
      let that = this;
      allsharedblist("").then((res) => {
        let resdata = res
        console.log("loadShareDbList", resdata)
        if (resdata.code === 0) {
          let share_options = resdata.data;
          let currentName = "";
          that.shardRows = share_options;
          const gLive = { label: that.$t('page.visit_log.shard_group_live'), options: [] };
          const gPeriod = { label: that.$t('page.visit_log.shard_group_period'), options: [] };
          const gLegacy = { label: that.$t('page.visit_log.shard_group_legacy'), options: [] };
          for (let i = 0; i < share_options.length; i++) {
            const it = share_options[i];
            // 下拉里显示「时间段」而不是文件名/表名：归档分区按月切，用户要找的是某段时间的日志
            const label = that.shardLabel(it);
            that.share_db_dic[it.file_name] = label;
            const opt = { value: it.file_name, label: label, disabled: !!it.missing };
            // 后端按驱动标记当前(实时)分片：SQLite=local_log.db，MySQL=web_logs
            if (it.is_current) {
              currentName = it.file_name;
              gLive.options.push(opt);
            } else if (it.period_key) {
              gPeriod.options.push(opt);
            } else {
              gLegacy.options.push(opt);
            }
          }
          that.shardGroups = [gLive, gPeriod, gLegacy].filter((g) => g.options.length > 0);
          // 默认停在「自动（按时间范围）」：分区由时间算出来，不再让用户自己猜
          // （旧默认是实时分片，会出现「日期选了上个月、分区停在实时 → 0 条」）
          // 文件型(SQLite)实时分片名以 .db 结尾；MySQL 为 web_logs(无后缀)。据此决定是否显示导出按钮
          that.isFileBasedDb = currentName === "" || currentName.endsWith(".db");
        }
      })
        .catch((e: Error) => {
          console.log(e);
        })
    },
    loadHostList() {
      return new Promise((resolve, reject) => {
        allhost()
          .then((res) => {
            let resdata = res;
            console.log(resdata);
            if (resdata.code === 0) {
              let host_options = resdata.data;
              //昵称字典整体替换赋值，保证表格列能重新渲染(Vue2 对新增 key 不响应)
              const nicknameDic = {};
              const realHosts = [];
              for (let i = 0; i < host_options.length; i++) {
                this.host_dic[host_options[i].value] = host_options[i].label;
                nicknameDic[host_options[i].value] = host_options[i].nickname || '';
                if (host_options[i].global_host !== 1) {
                  realHosts.push({ value: host_options[i].value, label: host_options[i].label });
                }
              }
              this.host_nickname_dic = nicknameDic;
              this.realHostOptions = realHosts;
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
      console.log("getList")
      let that = this
      if (keyword != undefined && keyword == "all") {
        that.pagination.current = 1
      }
      that.searchformData.unix_add_time_begin = ConvertStringToUnix(this.dateControl.range1[0]).toString()
      that.searchformData.unix_add_time_end = ConvertStringToUnix(this.dateControl.range1[1]).toString()

      console.log("getList searchformData", that.searchformData)
      let sort_descending = that.sorts.descending ? "desc" : "asc"

      this.$request
        .post('/waflog/attack/list', {
          pageSize: that.pagination.pageSize,
          pageIndex: that.pagination.current,
          sort_by: that.sorts.sortBy,
          sort_descending: sort_descending,
          filter_by: that.filters.filter_by,
          filter_value: that.filters.filter_value,
          unix_add_time_begin: ConvertStringToUnix(this.dateControl.range1[0]).toString(),
          unix_add_time_end: ConvertStringToUnix(this.dateControl.range1[1]).toString(),
          ...that.getFilteredSearchData()
        },
        )
        .then((res) => {
          let resdata = res
          console.log(resdata)
          if (resdata.code === 0) {

            //const { list = [] } = resdata.data.list;

            this.data = resdata.data.list ?? [];
            // 这次查了哪些分区 / 识别码在哪找到的：自动模式下用户没选分区，界面要能解释
            this.queryMeta = {
              shards: resdata.data.shards || [],
              found_in: resdata.data.found_in || "",
              scanned: resdata.data.scanned || 0,
              uuid_lookup: !!resdata.data.uuid_lookup,
              sort_forced_time: !!resdata.data.sort_forced_time,
              partial: !!resdata.data.partial,
              took_ms: resdata.data.took_ms || 0,
              issues: resdata.data.issues || [],
            };
            this.pagination = {
              ...this.pagination,
              total: resdata.data.total,
            };
            this.loadAiMarks();
          } else {
            that.$message.warning(resdata.msg);
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
    // 加载当前页日志的 AI 训练标签修正状态
    loadAiMarks() {
      const uuids = (this.data || []).map((r) => r.req_uuid).filter((u) => !!u);
      if (uuids.length === 0) {
        this.aiMarkMap = {};
        return;
      }
      aiLabelByUuidsApi({ req_uuids: uuids })
        .then((res) => {
          if (res.code === 0) {
            this.aiMarkMap = res.data || {};
          }
        })
        .catch(() => {});
    },
    // info: { mark, attack_type }
    aiMarkText(info) {
      if (!info || !info.mark) return '';
      if (info.mark === 'normal') return this.$t('page.visit_log.ai_mark_normal');
      if (info.mark === 'ignore') return this.$t('page.visit_log.ai_mark_ignore');
      if (info.mark === 'attack') {
        const cat = info.attack_type ? this.aiCatLabels[info.attack_type] || info.attack_type : '';
        return cat ? `${this.$t('page.visit_log.ai_mark_attack')}:${cat}` : this.$t('page.visit_log.ai_mark_attack');
      }
      return '';
    },
    // 打开标记弹窗，预填已有标记
    openAiMarkDialog(row) {
      this.aiMarkDialogRow = row;
      const existing = this.aiMarkMap[row.req_uuid];
      this.aiMarkForm = {
        verdict: existing && existing.mark ? existing.mark : 'attack',
        attackType: existing && existing.attack_type ? existing.attack_type : '',
      };
      this.aiMarkDialogVisible = true;
    },
    // 弹窗确定：按判定提交标记
    confirmAiMark() {
      if (!this.aiMarkDialogRow) return;
      const v = this.aiMarkForm.verdict;
      const value = v === 'attack' ? `attack|${this.aiMarkForm.attackType || ''}` : v;
      this.handleAiMark(this.aiMarkDialogRow, value);
      this.aiMarkDialogVisible = false;
    },
    // 弹窗取消标记
    confirmAiUnmark() {
      if (!this.aiMarkDialogRow) return;
      this.handleAiMark(this.aiMarkDialogRow, 'unmark');
      this.aiMarkDialogVisible = false;
    },
    // 标记/取消标记某条日志的训练标签；value 形如 normal/ignore/unmark 或 attack|<type>
    handleAiMark(row, value) {
      if (value === 'unmark') {
        aiUnmarkLabelApi({ req_uuid: row.req_uuid })
          .then((res) => {
            if (res.code === 0) {
              delete this.aiMarkMap[row.req_uuid];
              this.aiMarkMap = { ...this.aiMarkMap };
              this.$message.success(this.$t('page.visit_log.ai_mark_unmarked'));
            } else {
              this.$message.error(res.msg);
            }
          })
          .catch(() => {});
        return;
      }
      let mark = value;
      let attackType = '';
      if (value.indexOf('attack') === 0) {
        mark = 'attack';
        attackType = value.split('|')[1] || '';
      }
      aiMarkLabelApi({
        req_uuid: row.req_uuid,
        host_code: row.host_code,
        mark,
        attack_type: attackType,
        rule: row.rule,
        src_ip: row.src_ip,
        url: row.url,
      })
        .then((res) => {
          if (res.code === 0) {
            this.$set(this.aiMarkMap, row.req_uuid, { mark, attack_type: attackType });
            this.$message.success(this.$t('page.visit_log.ai_mark_success'));
          } else {
            this.$message.error(res.msg);
          }
        })
        .catch(() => {});
    },
    handelExport(keyword) {

      let that = this
      if (keyword != undefined && keyword == "all") {
        that.pagination.current = 1
      }
      that.searchformData.unix_add_time_begin = ConvertStringToUnix(this.dateControl.range1[0]).toString()
      that.searchformData.unix_add_time_end = ConvertStringToUnix(this.dateControl.range1[1]).toString()

      let sort_descending = that.sorts.descending ? "desc" : "asc"

      if (that.exportForm.tiers.length === 0) {
        that.$message.warning(that.$t('page.visit_log.export_tiers'));
        return;
      }
      exportlog({
        start_time: (that.exportForm.range && that.exportForm.range[0]) || '',
        end_time: (that.exportForm.range && that.exportForm.range[1]) || '',
        tiers: that.exportForm.tiers.join(','),
      }
      ).then((res) => {
        if (res.code === 0) {
          that.$message.success(that.$t('page.visit_log.export_started') || '导出已开始，完成后请到下载中心获取');
        } else {
          that.$message.error(res.msg || '导出失败');
        }
      })
        .catch((e: Error) => {
          console.log(e);
        })
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
    handleClickDetail(e) {
      const { req_uuid } = e.row
      // 行自带来源分区（扇出时后端回填）：带上它详情就能直达，不必再逐个分区找
      const shard = e.row.shard_name || this.searchformData.current_db_name;

      if (this.attack_ip == "") {
        this.$router.push(
          {
            path: '/waf/wafattacklogdetail',
            query: {
              req_uuid: req_uuid + "#" + shard,
            },
          },
        );
      } else {
        this.visitDetailUid = req_uuid
        this.visitDetailVisible = true
      }

    },
    handleClickIPDetail(e) {
      console.log(e)
      const { src_ip } = e.row
      this.searchformData.src_ip = src_ip
      this.getList("")

    },
    handleClickDelete(row: { rowIndex: any }) {
      this.deleteIdx = row.rowIndex;
      this.confirmVisible = true;
    },
    onConfirmDelete() {
      this.data.splice(this.deleteIdx, 1);
      this.pagination.total = this.data.length;
      const selectedIdx = this.selectedRowKeys.indexOf(this.deleteIdx);
      if (selectedIdx > -1) {
        this.selectedRowKeys.splice(selectedIdx, 1);
      }
      this.confirmVisible = false;
      this.$message.success('删除成功');
      this.resetIdx();
    },
    onCancel() {
      this.resetIdx();
    },
    resetIdx() {
      this.deleteIdx = -1;
    },
    //Jump Url
    /**
     * table 排序
     */
    onSortChange(sorter) {
      let that = this

      if (sorter != undefined) {
        this.sorts.sortBy = sorter.sortBy
        that.sorts.descending = sorter.descending

      } else {
        that.sorts.sortBy = "unix_add_time"
        that.sorts.descending = true
      }
      this.getList("")
    },
    /**
     * 访客身份筛选
     */
    filterGuestChange(e) {
    },
    // 切换访问日志/安全事件视图。「请求」全文筛选只在安全事件视图有，切走时摘掉，否则后端会拒
    onViewTypeChange() {
      if (this.searchformData.view_type !== 'event' && this.filters.filter_by.indexOf('header') >= 0) {
        this.filters.filter_by = "";
        this.filters.filter_value = "";
      }
      this.pagination.current = 1;
      this.getList("");
    },
    /**
     * 筛选结果
     */
    onFilterChange(e) {
      this.filters.filter_by = "";
      this.filters.filter_value = "";
      //访客身份
      if (e.guest_identification != undefined && e.guest_identification != "") {
        this.filters.filter_by = "guest_identification";
        this.filters.filter_value = e.guest_identification;
      }
      //请求ID
      if (e.req_uuid != undefined && e.req_uuid != "") {
        if (this.filters.filter_by == "") {
          this.filters.filter_by = "req_uuid";
          this.filters.filter_value = e.req_uuid;
        } else {
          this.filters.filter_by = this.filters.filter_by + "|req_uuid";
          this.filters.filter_value = this.filters.filter_value + "|" + e.req_uuid;
        }
      }
      //header
      if (e.header != undefined && e.header != "") {
        if (this.filters.filter_by == "") {
          this.filters.filter_by = "header";
          this.filters.filter_value = e.header;
        } else {
          this.filters.filter_by = this.filters.filter_by + "|header";
          this.filters.filter_value = this.filters.filter_value + "|" + e.header;
        }
      }
      //User-Agent / Referer（窄行列，两个视图都可用）
      if (e.user_agent != undefined && e.user_agent != "") {
        if (this.filters.filter_by == "") {
          this.filters.filter_by = "user_agent";
          this.filters.filter_value = e.user_agent;
        } else {
          this.filters.filter_by = this.filters.filter_by + "|user_agent";
          this.filters.filter_value = this.filters.filter_value + "|" + e.user_agent;
        }
      }
      if (e.referer != undefined && e.referer != "") {
        if (this.filters.filter_by == "") {
          this.filters.filter_by = "referer";
          this.filters.filter_value = e.referer;
        } else {
          this.filters.filter_by = this.filters.filter_by + "|referer";
          this.filters.filter_value = this.filters.filter_value + "|" + e.referer;
        }
      }

      this.getList("")
    },
    resetState() {
      console.log("来自上级得状态清理")
      this.$refs.form.reset()
      this.dateControl.range1[0] = NowDate + " 00:00:00"
      this.dateControl.range1[1] = NowDate + " 23:59:59"
      this.searchformData.unix_add_time_begin = ConvertStringToUnix(this.dateControl.range1[0]).toString()
      this.searchformData.unix_add_time_end = ConvertStringToUnix(this.dateControl.range1[1]).toString()
    },

    // 获取过滤后的搜索数据
    getFilteredSearchData() {
      const filteredData = {};
      Object.keys(this.searchformData).forEach(key => {
        const value = this.searchformData[key];
        if (typeof value === 'string') {
          filteredData[key] = value.trim();
        } else {
          filteredData[key] = value;
        }
      });
      return filteredData;
    },

    // 切换日志配置区域显示/隐藏
    toggleLogConfig() {
      this.logConfigVisible = !this.logConfigVisible;
    },

    // 加载日志配置
    loadLogConfig() {
      const configKeys = [
        'record_log_type',
        'record_max_req_body_length',
        'record_max_res_body_length',
        'record_resp',
        'record_all_src_byte_info',
        'delete_history_log_day',
        'log_db_size',
        'db_file_size',
        'log_persist_enable',
        'batch_insert',
        'ip_tag_db',
        'access_log_mode',
        'access_log_retention_days',
        'exclude_ip_log',
      ];

      // 使用 Promise.all 并行获取所有配置项
      const promises = configKeys.map(key => {
        return get_detail_by_item_api({ item: key })
          .then(res => {
            if (res.code === 0 && res.data) {
              this.logConfigItems[key] = res.data;
              // 直接使用原始值，不做类型转换
              this.logConfig[key] = res.data.value;
            }
            return { key, success: true };
          })
          .catch(err => {
            console.error(`加载配置项 ${key} 失败:`, err);
            return { key, success: false };
          });
      });
      
      Promise.all(promises).then(results => {
        const failedItems = results.filter(r => !r.success);
        if (failedItems.length === 0) {
          console.log('日志配置加载成功', this.logConfig);
        } else {
          console.warn('部分配置项加载失败:', failedItems);
        }
      });
    },

    // 保存日志配置
    saveLogConfig() {
      this.logConfigSaving = true;
      
      const configKeys = [
        'record_log_type',
        'record_max_req_body_length',
        'record_max_res_body_length',
        'record_resp',
        'record_all_src_byte_info',
        'delete_history_log_day',
        'log_db_size',
        'db_file_size',
        'log_persist_enable',
        'batch_insert',
        'ip_tag_db',
        'access_log_mode',
        'access_log_retention_days',
        'exclude_ip_log',
      ];

      const savePromises = configKeys.map(key => {
        const item = this.logConfigItems[key];
        if (item) {
          return edit_system_config_api({
            id: item.id,
            category: item.category,
            item: item.item,
            value: String(this.logConfig[key]),
            type: item.type,
            title: item.title,
            options: item.options || '',
          }).catch(err => {
            console.error(`保存配置项 ${key} 失败:`, err);
            throw err;
          });
        }
        return Promise.resolve();
      });
      
      Promise.all(savePromises)
        .then(() => {
          this.$message.success(this.$t('common.tips.save_success'));
          // 重新加载日志列表以应用新配置
          this.getList("");
        })
        .catch((e) => {
          console.error('保存日志配置失败', e);
          this.$message.error(this.$t('common.tips.save_failed'));
        })
        .finally(() => {
          this.logConfigSaving = false;
        });
    },

    // 处理IP提取问题
    handleIPExtractIssue() {
      this.ipExtractDialogVisible = true;
      // 获取当前配置
      get_detail_by_item_api({ item: 'gwaf_proxy_header' }).then(res => {
        if (res.code === 0 && res.data) {
          this.ipExtractFormData = res.data;
        }
      }).catch(err => {
        console.error('获取IP提取配置失败:', err);
      });
    },

    // 跳到该站点的「真实IP来源」配置(网站防护列表页会自动打开编辑弹窗的"其他配置")
    gotoHostIpSource() {
      if (!this.ipExtractHostCode) return;
      this.ipExtractDialogVisible = false;
      this.$router.push({ name: 'WafHost', query: { editcode: this.ipExtractHostCode, tab: 'ipsource' } });
    },
    // 就地查看该站点最近真实到达的请求头
    openHostProbe() {
      if (!this.ipExtractHostCode) return;
      this.hostProbeVisible = true;
    },
    // 快捷选择IP头信息
    selectIPHeader(headerValue) {
      this.ipExtractFormData.value = headerValue;
      this.$message.success('已选择: ' + headerValue);
    },

    // 打开视频教程
    openVideoTutorial() {
      window.open('https://www.bilibili.com/video/BV1pn8Ez2ELQ/', '_blank');
    },

    // 提交IP提取配置
    onSubmitIPExtract({ validateResult }) {
      if (validateResult === true) {
        edit_system_config_api(this.ipExtractFormData).then(res => {
          if (res.code === 0) {
            this.$message.success(res.msg);
            this.ipExtractDialogVisible = false;
          } else {
            this.$message.error(res.msg);
          }
        }).catch(err => {
          this.$message.error(err.message);
        });
      }
    },
    //end meathod
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables';

.t-button+.t-button {
  margin-left: @spacer;
}

.ipl-link {
  color: var(--td-brand-color);
  cursor: pointer;
}

.ipl-link:hover {
  color: var(--td-brand-color-hover);
  text-decoration: underline;
}

.log-config-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--td-warning-color);
  line-height: 1.4;
}
</style>
