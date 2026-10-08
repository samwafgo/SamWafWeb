<template>
  <div>
    <!-- 站点态势总览：先给页面一个「重心」，关键指标集中呈现 -->
    <div class="host-overview">
      <t-loading :loading="statsLoading" show-overlay>
        <div class="ov-grid">
          <div v-for="card in kpiCards" :key="card.key" class="ov-card" :class="`ov-card--${card.theme}`">
            <div class="ov-head">
              <span class="ov-label">{{ card.label }}</span>
              <span class="ov-icon"><component :is="card.icon" /></span>
            </div>
            <div class="ov-value">{{ card.value }}</div>
            <div class="ov-sub" :title="card.sub">{{ card.sub }}</div>
          </div>
        </div>
      </t-loading>
    </div>

    <t-card class="list-card-container">
      <div class="host-toolbar">
        <div class="ht-left">
          <t-button theme="primary" @click="handleAddHost">＋ {{ $t('page.host.new_protection') }}</t-button>
          <t-dropdown :options="batchMenuOptions()" trigger="click" @click="onBatchMenuClick">
            <t-button variant="outline" theme="default">{{ $t('page.host.toolbar_batch') }} ▾</t-button>
          </t-dropdown>
          <t-dropdown :options="importExportMenuOptions()" trigger="click" @click="onImportExportMenuClick">
            <t-button variant="outline" theme="default">{{ $t('page.host.toolbar_import') }} ▾</t-button>
          </t-dropdown>
          <t-button variant="outline" theme="default" @click="handlePortOverview">{{ $t('page.host.port_listen.overview_title') }}</t-button>
        </div>
        <div class="ht-right">
          <t-form ref="form" :data="searchformData" :label-width="80" colon layout="inline">
            <t-form-item :label="$t('page.host.website')" name="code">
              <t-select v-model="searchformData.code" clearable filterable :style="{ width: '200px' }">
                <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                  {{ item }}
                </t-option>
              </t-select>
            </t-form-item>
            <t-form-item :label="$t('common.remarks')" name="remarks">
              <t-input v-model="searchformData.remarks" clearable :placeholder="$t('common.placeholder')"
                       :style="{ width: '160px' }" @enter="getList('all')" />
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" @click="getList('all')">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>
        </div>
      </div>

      <!-- 分组导航（轻量文本条）：放顶部而不是左栏——横向宽度已经卡死在「操作列点不到」的边缘，
           纵向多一行几乎无感。刻意去掉边框/底色、选中态只用主色文字+下划线，
           好让它明显低于上面那排动作按钮：分组是筛选维度，不是主操作 -->
      <div class="host-group-bar">
        <span class="hg-bar-label">{{ $t('page.host.group.title') }}</span>
        <span class="hg-gl" :class="{ on: currentGroup === 'all' }" @click="pickGroup('all')">
          <span class="hg-nm">{{ $t('page.host.group.all_hosts') }}</span><em>{{ groupAllCount }}</em>
        </span>
        <span class="hg-gl" :class="{ on: currentGroup === '__none__' }" @click="pickGroup('__none__')">
          <span class="hg-nm">{{ $t('page.host.group.ungrouped') }}</span><em>{{ groupNoneCount }}</em>
        </span>
        <span v-if="hostGroups.length" class="hg-gsep"></span>
        <span v-for="(g, gi) in hostGroups" :key="g.group_code" class="hg-gl"
              :class="{ on: currentGroup === g.group_code }" :title="g.group_name"
              @click="pickGroup(g.group_code)">
          <span class="hg-nm">{{ g.group_name }}</span><em>{{ g.host_count }}</em>
          <!-- click.native.stop 加在组件根元素上：阻止冒泡到「切换分组」，
               同时不影响 dropdown 自己挂在同一元素上的展开逻辑 -->
          <t-dropdown :options="groupMenuOptions(gi)" trigger="click"
                      @click="onGroupMenuClick($event, g, gi)" @click.native.stop>
            <span class="hg-more">⋮</span>
          </t-dropdown>
        </span>
        <span class="hg-gsep"></span>
        <!-- 「新建分组」「移动到分组」都是分组域内的动作，和分组标签放一起；
             主工具栏只留网站维度的动作，主次才不会又混在一起 -->
        <span class="hg-gl add" @click="openGroupForm(null)">＋ {{ $t('page.host.group.new_group') }}</span>
        <span class="hg-gl add" :class="{ disabled: selectedRowKeys.length === 0 }"
              :title="selectedRowKeys.length === 0 ? $t('page.host.group.move_need_select') : ''"
              @click="selectedRowKeys.length && openAssignGroup()">
          ⇄ {{ selectedRowKeys.length ? $t('page.host.group.move_to_group_n', { n: selectedRowKeys.length }) : $t('page.host.group.move_to_group') }}
        </span>
      </div>

      <div class="table-container">
        <help-block :summary="$t('page.host.core_features')" doc="guide/Host" />
        <t-table class="host-list-table" :columns="columns" size="small" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign"
                 :hover="hover" :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
                 :resizable="true" tableLayout="fixed"
                 @page-change="rehandlePageChange" @change="rehandleChange" @select-change="rehandleSelectChange"  @sort-change="onSortChange"
                 @filter-change="onFilterChange"
                 :expandedRow="expandedRow" :expandedRowKeys="expandedRowKeys" @expand-change="onExpandChange"
                 :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">
          <template #host="{ row }">
            <div class="host-cell">
              <!-- 第一行：域名（真实访问地址，可点开） -->
              <div class="hc-r1">
                <a v-if="row.global_host !== 1 && siteUrl(row)"
                   class="hc-host hc-host--link"
                   :href="siteUrl(row)" target="_blank" rel="noopener noreferrer"
                   :title="$t('page.host.open_site') + ': ' + siteUrl(row)">{{ row.host }}</a>
                <span v-else class="hc-host" :title="row.host">{{ row.host }}</span>
              </div>
              <!-- 第二行：昵称 + 绑定的其它域名 -->
              <div v-if="row.nickname || domains(row).length" class="hc-r2">
                <span v-if="row.nickname" class="hc-nick">{{ row.nickname }}</span>
                <a
                  v-for="(domain, i) in domains(row)"
                  :key="i"
                  class="hc-domain"
                  :href="domainUrl(row, domain)"
                  target="_blank" rel="noopener noreferrer"
                  :title="$t('page.host.open_site') + ': ' + domainUrl(row, domain)"
                >{{ domain }}</a>
              </div>
              <!-- 第三行：badge（SSL / 监听端口 / 分组） -->
              <div v-if="hasHostBadges(row)" class="hc-r3">
                <t-tag v-if="row.ssl === SSL_STATUS.SSL" theme="success" variant="light" size="small" :title="$t('page.host.ssl_yes')">SSL</t-tag>
                <t-tag
                  v-for="t in portTags(row)"
                  :key="t.key"
                  :theme="row.port_conflict ? 'danger' : (t.proto === 'https' ? 'success' : 'primary')"
                  variant="light"
                  size="small"
                  :title="t.title"
                >{{ t.label }}</t-tag>
                <t-tooltip v-if="row.port_conflict" :content="$t('page.host.port_listen.conflict_tip')" placement="top">
                  <t-tag theme="danger" size="small">{{ $t('page.host.port_listen.conflict') }}</t-tag>
                </t-tooltip>
                <span v-if="row.global_host === 1" class="hg-tag none">{{ $t('page.host.global_site') }}</span>
                <span v-else-if="row.group_code && !groupDict[row.group_code]" class="hg-tag unknown"
                      :title="$t('page.host.group.unknown_group_tip')">{{ $t('page.host.group.unknown_group') }}</span>
                <span v-else-if="row.group_code" class="hg-tag"
                      :style="{ background: hexToSoft(groupDict[row.group_code].color), color: groupDict[row.group_code].color }"
                      @click="pickGroup(row.group_code)">
                  <i class="hg-dot" :style="{ background: groupDict[row.group_code].color }"></i>{{ groupDict[row.group_code].group_name }}
                </span>
              </div>
            </div>
          </template>
          <template #data_stats="{ row }">
            <div class="stat-cell">
              <site-trend v-if="row.global_host !== 1 && row.code" :host-code="row.code" />
              <div class="stat-metrics">
                <div class="sm"><span class="sm-l">{{ $t('page.host.today_pv_short') }}</span><span class="sm-v">{{ row.today_pv_count || 0 }}</span></div>
                <div class="sm"><span class="sm-l">{{ $t('page.host.today_uv_short') }}</span><span class="sm-v">{{ row.today_uv_count || 0 }}</span></div>
                <div class="sm"><span class="sm-l">{{ $t('page.host.today_attack_short') }}</span><span class="sm-v danger">{{ row.today_attack_count || 0 }}</span></div>
                <div class="sm"><span class="sm-l">{{ $t('page.host.real_qps_short') }}</span><span class="sm-v">{{ row.real_time_qps }}</span></div>
                <div class="sm"><span class="sm-l">{{ $t('page.host.traffic_total_short') }}</span><span class="sm-v">{{ formatTrafficBytes((row.today_traffic_in || 0) + (row.today_traffic_out || 0)) }}</span></div>
              </div>
            </div>
          </template>
          <template #backend="{ row }">
            <div class="backend-cell">
              <!-- 第一行：后端地址（过长自动换行；IPv6 用 [] 包起来避免和端口混淆） -->
              <div class="be-line1">
                <span class="mono be-addr">{{ formatBackendAddr(row) }}</span>
                <t-tag v-if="row.is_enable_load_balance === '1' || row.is_enable_load_balance === 1" theme="primary" variant="light" size="small">LB</t-tag>
              </div>
              <!-- 第二行：健康状态（图标 + 文案 + 最近检测时间），从「运行状态」列挪来 -->
              <t-tooltip v-if="row.global_host !== 1" :content="healthTip(row)" placement="top">
                <div class="be-health" :class="`is-${healthState(row)}`">
                  <check-circle-filled-icon v-if="healthState(row) === 'ok'" class="bh-ico" />
                  <error-circle-filled-icon v-else-if="healthState(row) === 'bad'" class="bh-ico" />
                  <help-circle-filled-icon v-else class="bh-ico" />
                  <span class="bh-text">{{ healthText(row) }}</span>
                  <span v-if="healthCheckTime(row)" class="bh-time">{{ healthCheckTime(row) }}</span>
                </div>
              </t-tooltip>
            </div>
          </template>
          <template #status_switches="{ row }">
            <div class="run-status">
              <!-- 防护：这列的行高已经不矮，干脆把主开关做成一块可视化控件，
                   盾牌 + 状态文字 + 轨道一起表达，一眼看清防护开没开（点一下即切换） -->
              <div
                class="guard-ctl"
                :class="row.guard_status === 1 ? 'is-on' : 'is-off'"
                :title="$t('page.host.guard_status')"
                @click="changeGuardStatus(!(row.guard_status === 1), row)"
              >
                <secured-icon class="gc-shield" />
                <span class="gc-text">
                  {{ row.guard_status === 1 ? $t('page.host.guard_status_on') : $t('page.host.guard_status_off') }}
                </span>
                <span class="gc-track"><i class="gc-knob"></i></span>
              </div>
              <div class="rs-row">
                <span class="rs-k">{{ $t('page.host.start_status') }}</span>
                <t-switch size="small" :value="row.start_status === 0" @change="changeStartStatus($event, row)" />
              </div>
              <div v-if="row.global_host !== 1 && isStaticSiteEnabled(row)" class="rs-row">
                <span class="rs-k">{{ $t('page.host.static_service_label') }}</span>
                <t-tag theme="success" variant="light" size="small">{{ $t('page.host.static_service_label_on') }}</t-tag>
              </div>
            </div>
          </template>
          <template #op="slotProps">
            <!-- 高频的「编辑」「证书申请」保持文字直出，低频的「复制」「删除」收进「更多」：
                 4 个链接平铺会折成两行且长度参差，收敛后一行、整齐，以后再加操作项也只是往「更多」里塞 -->
            <div v-if="slotProps.row.global_host!==1" class="op-cell">
              <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
              <!-- 表格里用短标签，全称走 title：全称 8 个字，直出会把这一列重新撑破 -->
              <a class="t-button-link" :title="$t('page.host.ssl_auto_apply')"
                 @click="handleClickSSLApply(slotProps)">{{ $t('page.host.ssl_auto_apply_short') }}</a>
              <span class="op-vline"></span>
              <t-dropdown :options="rowMoreOptions()" trigger="click" @click="onRowMoreClick($event, slotProps)">
                <span class="op-more">{{ $t('page.host.group.more') }} ▾</span>
              </t-dropdown>
            </div>
          </template>
        </t-table>
      </div>
      <div>
        <router-view></router-view>
      </div>
    </t-card>

    <!-- 新建 / 编辑分组 -->
    <t-dialog :visible.sync="groupFormVisible" :header="groupForm.id ? $t('page.host.group.edit_group') : $t('page.host.group.new_group')"
              :width="480" :confirm-btn="$t('common.confirm')" :cancel-btn="$t('common.cancel')" @confirm="saveGroup">
      <t-form :label-width="90" colon>
        <t-form-item :label="$t('page.host.group.name')">
          <t-input v-model="groupForm.group_name" :maxlength="50" :placeholder="$t('page.host.group.name_placeholder')" />
        </t-form-item>
        <t-form-item :label="$t('page.host.group.color')">
          <div class="hg-color-picker">
            <i v-for="c in groupColors" :key="c" :class="{ on: groupForm.color === c }"
               :style="{ background: c }" @click="groupForm.color = c"></i>
          </div>
        </t-form-item>
        <t-form-item :label="$t('common.remarks')">
          <t-input v-model="groupForm.remarks" :maxlength="200" :placeholder="$t('common.placeholder')" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 端口占用总览（issue #955）：端口→协议→占用站点，冲突行标红 -->
    <t-dialog :visible.sync="portOverviewVisible" :header="$t('page.host.port_listen.overview_title')"
              :width="860" :footer="false">
      <p style="color: var(--td-text-color-secondary); font-size: 12px; margin: 0 0 10px;">
        {{ $t('page.host.port_listen.overview_desc') }}
      </p>
      <t-loading :loading="portOverviewLoading" show-overlay>
        <t-table row-key="port" :data="portOverviewRows" :columns="portOverviewColumns" size="small"
                 max-height="480" :row-class-name="portOverviewRowClass">
          <template #port="{ row }"><b>{{ row.port }}</b></template>
          <template #active="{ row }">
            <t-tag v-if="!row.online" theme="warning" variant="light" size="small">{{ $t('page.host.port_listen.status_offline') }}</t-tag>
            <t-tag v-else :theme="row.conflict ? 'danger' : (row.active_proto === 'https' ? 'success' : 'primary')" variant="light" size="small">
              {{ (row.active_proto || '').toUpperCase() }}<template v-if="row.active_ipv && row.active_ipv !== 'both'"> · {{ row.active_ipv }}</template>
            </t-tag>
          </template>
          <template #sites="{ row }">
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              <t-tag v-for="(s, si) in row.sites" :key="si" variant="light" size="small"
                     :theme="row.conflict ? 'danger' : 'default'"
                     :title="s.host + (s.nickname ? '（' + s.nickname + '）' : '')">
                {{ s.host }} · {{ s.proto.toUpperCase() }}<template v-if="s.is_main"> · {{ $t('page.host.port_listen.main_suffix') }}</template><template v-if="s.implied"> · {{ $t('page.host.port_listen.implied_suffix') }}</template>
              </t-tag>
            </div>
          </template>
          <template #status="{ row }">
            <t-tag v-if="row.conflict" theme="danger" size="small">{{ $t('page.host.port_listen.status_conflict') }}</t-tag>
            <t-tag v-else theme="success" variant="light" size="small">{{ $t('page.host.port_listen.status_ok') }}</t-tag>
          </template>
        </t-table>
      </t-loading>
    </t-dialog>

    <!-- 删除分组确认：必须写清楚有几个网站会回落到未分组 -->
    <t-dialog :visible.sync="groupDelVisible" :header="$t('page.host.group.del_confirm_title', { name: groupDelTarget.group_name })"
              :width="460" theme="warning" :confirm-btn="{ content: $t('common.confirm'), theme: 'danger' }"
              :cancel-btn="$t('common.cancel')" @confirm="doDelGroup">
      <p v-if="groupDelTarget.host_count > 0">{{ $t('page.host.group.del_confirm_body', { n: groupDelTarget.host_count }) }}</p>
      <p v-else>{{ $t('page.host.group.del_confirm_empty') }}</p>
      <p style="color: var(--td-text-color-secondary); font-size: 12px;">{{ $t('page.host.group.del_confirm_keep') }}</p>
    </t-dialog>

    <!-- 批量移动网站到分组 -->
    <t-dialog :visible.sync="assignVisible" :header="$t('page.host.group.move_to_group')" :width="480"
              :confirm-btn="$t('common.confirm')" :cancel-btn="$t('common.cancel')" @confirm="doAssignGroup">
      <p style="color: var(--td-text-color-secondary); font-size: 13px;">
        {{ $t('page.host.group.move_tip', { n: selectedRowKeys.length }) }}
        <span v-if="assignGlobalCount > 0">{{ $t('page.host.group.move_tip_global', { n: assignGlobalCount }) }}</span>
      </p>
      <!-- 分组之间是并列关系，不是层级关系：TDesign 的 radio 自带横向间距，
           竖排时会表现成逐条往右递进的缩进，这里统一清零把它拉平 -->
      <t-radio-group v-model="assignGroupCode" class="assign-group-list">
        <t-radio value="">{{ $t('page.host.group.move_out') }}</t-radio>
        <t-radio v-for="g in hostGroups" :key="g.group_code" :value="g.group_code">
          <i class="hg-dot" :style="{ background: g.color, marginRight: '6px' }"></i>{{ g.group_name }}
        </t-radio>
      </t-radio-group>
    </t-dialog>

    <!-- New WebSite Dialog -->
    <t-dialog :visible.sync="addFormVisible" :width="hostFormEffectiveWidth" :footer="false"
              :class="{ 'host-form-dialog-fullscreen': hostFormFullscreen }">
      <div slot="header">
        {{ $t('common.new') }}
        <t-link theme="primary" :href="hostAddUrl" target="_blank">
          <link-icon slot="prefix-icon"></link-icon>
          {{ $t('common.online_document') }}
        </t-link>
      </div>
      <div slot="body">
        <host-form
          :value="formData"
          :dialog-visible="addFormVisible"
          :select-can-filter="selectCanFilter"
          :host-groups="hostGroups"
          @group-changed="loadHostGroups"
          @close="onClickCloseBtn"
          @submit="onSubmit"
          @tab-placement-change="onHostTabPlacementChange"
          @fullscreen-change="onHostFullscreenChange"
        ></host-form>
      </div>
    </t-dialog>

    <!-- Edit WebSite Dialog -->
    <t-dialog :visible.sync="editFormVisible" :width="hostFormEffectiveWidth" :footer="false"
              :class="{ 'host-form-dialog-fullscreen': hostFormFullscreen }">
      <div slot="header">
        {{ $t('common.edit') }}
        <span v-if="editHostLabel" class="dialog-header-host">{{ editHostLabel }}</span>
      </div>
      <div slot="body">
        <host-form
        :value="formEditData"
        :dialog-visible="editFormVisible"
        :select-can-filter="selectCanFilter"
        :host-groups="hostGroups"
        @group-changed="loadHostGroups"
        :is-edit="true"
        :init-tab="editInitTab"
        @close="onClickCloseEditBtn"
        @submit="onSubmitEdit"
        @tab-placement-change="onHostTabPlacementChange"
          @fullscreen-change="onHostFullscreenChange"
        ></host-form>
      </div>
    </t-dialog>

    <t-dialog :header="$t('common.confirm_delete')" :body="confirmBody" :visible.sync="confirmVisible" @confirm="onConfirmDelete"
              :onCancel="onCancel">
    </t-dialog>

    <t-dialog :visible.sync="ImportXlsxVisible" @confirm="ImportXlsxVisible=false">
      <t-radio-group v-model="uploadParams.import_code_strategy">
        <t-radio value="0">{{$t('page.host.upload.import_auto_create_code')}}</t-radio>
        <t-radio value="1">{{$t('page.host.upload.import_remain_code')}}</t-radio>
      </t-radio-group>
      <t-upload :action="fileUploadUrl" :tips="tips" :headers="fileHeader" v-model="files" @fail="handleFail"
                :data="uploadParams" :before-upload="beforeUpload"
                @success="onSuccess" theme="file-input" :placeholder="$t('page.host.upload_tips')"></t-upload>
    </t-dialog>

    <t-dialog :header="$t('page.host.guard_status_confirm')" :visible.sync="guardConfirmVisible" @confirm="onGuardStatusConfirm"
              :onCancel="onGuardStatusCancel">
      <div slot="body">
        <div>{{$t('page.host.guard_status_confirm_content')}}</div>
      </div>
    </t-dialog>

    <t-dialog :header="$t('page.host.start_status_confirm')" :visible.sync="startConfirmVisible" @confirm="onStartStatusConfirm"
              :onCancel="onStartStatusCancel">
      <div>{{$t('page.host.start_status_confirm_content')}}</div>
    </t-dialog>



    <t-dialog :header="$t('page.host.ssl_auto_apply')" :visible.sync="sslAutoApplyVisible" :width="900" :footer="false">
      <div slot="body">
        <ssl-order-list :src-host-code="currentHostCode"></ssl-order-list>
      </div>
    </t-dialog>

    <t-dialog :header="$t('page.host.modify_all_guard_status')" :visible.sync="guardAllConfirmVisible" @confirm="onGuardAllStatusConfirm"
              :onCancel="onGuardAllStatusCancel">
      <div slot="body">
        <div>{{$t('page.host.confirm_modify_all_guard_status')}}</div>
        <t-radio-group v-model="guardAllStatus" style="margin-top: 16px;">
          <t-radio value="1">{{$t('page.host.guard_status_on')}}</t-radio>
          <t-radio value="0">{{$t('page.host.guard_status_off')}}</t-radio>
        </t-radio-group>
      </div>
    </t-dialog>

    <!-- 批量复制配置弹窗 -->
    <t-dialog 
      :header="$t('page.host.batch_copy.title')" 
      :visible.sync="batchCopyVisible" 
      :confirm-btn="{ content: $t('page.host.batch_copy.execute_copy'), loading: batchCopyLoading }"
      :cancel-btn="{ content: $t('common.cancel') }"
      @confirm="executeBatchCopy"
      @cancel="cancelBatchCopy"
      width="600px"
    >
      <div slot="body">
        <!-- 源站点选择 -->
        <div class="batch-copy-section">
          <label class="batch-copy-label">{{ $t('page.host.batch_copy.source_host') }}：</label>
          <t-select 
            v-model="batchCopyForm.sourceHost" 
            :placeholder="$t('page.host.batch_copy.select_source_host')"
            style="width: 100%;"
          >
            <t-option 
              v-for="(hostLabel, hostCode) in host_dic" 
              :key="hostCode" 
              :value="hostCode" 
              :label="hostLabel"
              v-if="hostLabel !== '全局网站:0'"
            >
              {{ hostLabel }}
            </t-option>
          </t-select>
        </div>

        <!-- 功能模块选择 -->
        <div class="batch-copy-section">
          <label class="batch-copy-label">{{ $t('page.host.batch_copy.copy_modules') }}：</label>
          <div class="module-checkboxes">
            <t-checkbox 
              v-for="module in availableModules" 
              :key="module.value"
              :checked="batchCopyForm.modules.includes(module.value)"
              @change="(checked) => handleModuleChange(module.value, checked)"
              class="module-checkbox"
            >
              {{ module.label }}
            </t-checkbox>
          </div>
        </div>

        <!-- 目标站点选择 -->
        <div class="batch-copy-section">
          <label class="batch-copy-label">{{ $t('page.host.batch_copy.target_hosts') }}：</label>
          <div class="target-hosts-container">
            <div class="select-all-container">
              <t-checkbox 
                :checked="isAllTargetsSelected"
                :indeterminate="batchCopyForm.targetHosts.length > 0 && !isAllTargetsSelected"
                @change="toggleSelectAllTargets"
              >
                {{ $t('page.host.batch_copy.select_all') }}
              </t-checkbox>
            </div>
            <div class="target-hosts-list">
              <t-checkbox 
                v-for="host in availableTargetHosts" 
                :key="host.code"
                :checked="batchCopyForm.targetHosts.includes(host.code)"
                @change="(checked) => handleTargetHostChange(host.code, checked)"
                class="target-host-checkbox"
              >
                {{ host.host }}
              </t-checkbox>
            </div>
          </div>
        </div>

        <!-- 选择统计 -->
        <div class="batch-copy-summary">
          <t-tag theme="primary" variant="light">
            {{ $t('page.host.batch_copy.selected_modules', { count: batchCopyForm.modules.length }) }}
          </t-tag>
          <t-tag theme="success" variant="light" style="margin-left: 8px;">
            {{ $t('page.host.batch_copy.selected_targets', { count: batchCopyForm.targetHosts.length }) }}
          </t-tag>
        </div>
      </div>
    </t-dialog>

    <!-- 批量复制进度弹窗 -->
    <t-dialog 
      :header="$t('page.host.batch_copy.progress_title')" 
      :visible.sync="batchCopyProgress.visible"
      :show-overlay="true"
      :close-on-overlay-click="false"
      :close-btn="false"
      width="500px"
    >
      <div slot="body">
        <div class="progress-container">
          <!-- 进度条 -->
          <t-progress 
            :percentage="Math.round((batchCopyProgress.current / batchCopyProgress.total) * 100)"
            :status="batchCopyProgress.status === 'error' ? 'warning' : 'active'"
            :show-info="true"
            style="margin-bottom: 16px;"
          />
          
          <!-- 进度信息 -->
          <div class="progress-info">
            <div class="progress-text">
              <span v-if="batchCopyProgress.status === 'processing'">
                {{ $t('page.host.batch_copy.copying_to') }} {{ batchCopyProgress.currentHost }}
              </span>
              <span v-else-if="batchCopyProgress.status === 'success'" class="success-text">
                {{ $t('page.host.batch_copy.copy_completed') }}
              </span>
              <span v-else-if="batchCopyProgress.status === 'error'" class="error-text">
                {{ $t('page.host.batch_copy.copy_error') }}
              </span>
            </div>
            <div class="progress-count">
              {{ batchCopyProgress.current }} / {{ batchCopyProgress.total }}
            </div>
          </div>
          
          <!-- 完成后的操作按钮 -->
          <div v-if="batchCopyProgress.status !== 'processing'" class="progress-actions">
            <t-button theme="primary" @click="closeBatchCopyProgress">
              {{ $t('common.close') }}
            </t-button>
          </div>
        </div>
      </div>
    </t-dialog>

  </div>
</template>
<script lang="ts">
import {getBaseUrl} from '@/utils/usuallytool';
import {decryptIncoming} from '@/utils/seccrypto';
import Vue from 'vue';
import {
  FileSafetyIcon, LinkIcon, SearchIcon,
  ViewListIcon, SecuredIcon, ErrorCircleIcon, CloseCircleIcon, ChartLineIcon, CloudUploadIcon, ThunderIcon,
  CheckCircleFilledIcon, ErrorCircleFilledIcon, HelpCircleFilledIcon,
} from 'tdesign-icons-vue';
import {prefix} from '@/config/global';

import {export_api} from '@/apis/common';
import {allhost, changeGuardStatus, changeStartStatus, hostlist,getHostDetail,delHost,addHost,editHost,modifyAllGuardStatus,batchCopyConfig,getPortOverview} from '@/apis/host';
import {allHostGroup, addHostGroup, editHostGroup, delHostGroup, sortHostGroup, assignHostGroup} from '@/apis/hostgroup';

import SslOrderList from "@/pages/waf/sslorder/index.vue";
import { v4 as uuidv4 } from 'uuid';
import {
  GUARD_STATUS,
  SSL_STATUS,
  START_STATUS
} from '@/constants';
import LoadBalance from "../loadbalance/index.vue";
import HttpAuthBase from "../http_auth_base/index.vue"
import HostForm from './components/HostForm.vue';
import SiteTrend from './components/SiteTrend.vue';

// 导入初始化常量
import { INITIAL_DATA,  INITIAL_HEALTHY, INITIAL_CAPTCHA } from './constants';

export default Vue.extend({
  name: 'ListBase',
  components: {
    SearchIcon,
    FileSafetyIcon,
    LinkIcon,
    // 态势总览 KPI 图标
    ViewListIcon,
    SecuredIcon,
    ErrorCircleIcon,
    CloseCircleIcon,
    ChartLineIcon,
    CloudUploadIcon,
    ThunderIcon,
    // 后端服务列的健康图标
    CheckCircleFilledIcon,
    ErrorCircleFilledIcon,
    HelpCircleFilledIcon,
    SslOrderList,
    LoadBalance,
    HttpAuthBase,
    HostForm,
    SiteTrend,
  },
  data() {
    return {
      // 网站表单弹窗宽度：Tab 竖向布局(left)需要更宽，横向(top)保持 750
      hostFormDialogWidth: localStorage.getItem('samwaf_host_tab_placement') === 'top' ? 750 : 920,
      hostFormFullscreen: localStorage.getItem('samwaf_host_form_fullscreen') === '1',
      // 端口占用总览（issue #955）
      portOverviewVisible: false,
      portOverviewLoading: false,
      portOverviewRows: [],
      // 批量复制配置相关数据
      batchCopyVisible: false,
      batchCopyLoading: false,
      batchCopyProgress: {
        visible: false,
        current: 0,
        total: 0,
        currentHost: '',
        status: 'processing' // processing, success, error
      },
      batchCopyHosts: [],
      batchCopyForm: {
        sourceHost: '',
        modules: ['cache'], // 默认选中缓存模块
        targetHosts: []
      },
      // 可选的功能模块
      availableModules: [
        { value: 'cache', label: this.$t('page.host.batch_copy.module_cache') },
        { value: 'response_compress', label: this.$t('page.host.batch_copy.module_response_compress') }
      ],
      uploadParams:{
        import_code_strategy: '0',// 编码导入策略 0 新增自动生成 1 保留原有
        import_table:"hosts",// 导入到哪个表
      },
      files: [],
      tips: this.$t('page.host.upload_file_limit_size'),
      baseUrl: "",
      fileUploadUrl: "",
      fileHeader: {},
      addFormVisible: false,
      editFormVisible: false,
      editInitTab: 1, //编辑弹窗打开时定位的Tab(从访问日志"IP提取有问题?"跳来时定位到"其他配置")
      guardVisible: false,
      confirmVisible: false,
      sslAutoApplyVisible: false,
      ImportXlsxVisible: false,
      formData: {
        ...INITIAL_DATA
      },
      formEditData: {
        ...INITIAL_DATA
      },
      remote_system_options: [{
        label: this.$t('page.host.back_system_type_baota'),
        value: '1'
      },
      {
        label: this.$t('page.host.back_system_type_phpstudy'),
        value: '2'
      },
      {
        label: this.$t('page.host.back_system_type_phpnow'),
        value: '3'
      },
      {
        label: this.$t('page.host.back_system_type_default'),
        value: '4'
      },
      ],
      remote_app_options: [{
        label: this.$t('page.host.back_system_biz_website'),
        value: '1'
      },
      {
        label: this.$t('page.host.back_system_biz_api'),
        value: '2'
      },
      {
        label: this.$t('page.host.back_system_biz_mange'),
        value: '3'
      },
      {
        label: this.$t('page.host.back_system_biz_default'),
        value: '4'
      },
      ],
      GUARD_STATUS,
      SSL_STATUS,
      START_STATUS,
      prefix,
      dataLoading: false,
      data: [], // 列表数据信息
      detail_data: [], // 加载详情信息用于编辑
      selectedRowKeys: [],
      value: 'first',
      columns: [
        // 多选列：目前唯一的使用方是「移动到分组」。
        // 全局网站不参与分组（它不是真实站点），直接禁选，省得用户勾了却没生效。
        {
          colKey: 'row-select',
          type: 'multiple',
          width: 46,
          fixed: 'left',
          disabled: ({ row }) => row.global_host === 1,
        },
        {
          title: this.$t('page.host.host'),
          align: 'left',
          width: 340,
          ellipsis: true,
          colKey: 'host',
          cell: 'host',
          filter: {
            type: 'input',
            resetValue: '',
            confirmEvents: ['onEnter'],
            props: {
              placeholder: this.$t('page.host.host_filter_placeholder'),
            },
            showConfirmAndReset: true,
          },
        },
        {
          title: this.$t('page.host.run_status'),
          colKey: 'status_switches',
          width: 180,
          cell: 'status_switches'
        },
        {
          title: this.$t('page.host.stats_info'),
          colKey: 'data_stats',
          width: 360,
          minWidth: 340,
          cell: 'data_stats'
        },
        {
          title: this.$t('page.host.backend_service'),
          width: 170,
          colKey: 'backend',
          cell: 'backend',
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
          width: 160,
          colKey: 'op',
          title: this.$t('common.op'),
          // 吸附右侧：表格总列宽 ~1600px，窄屏必然横向滚动，
          // 不固定的话操作列会被推出可视区，得先把表格拖到底才点得到
          fixed: 'right',
        },
      ],
      rowKey: 'code',
      verticalAlign: 'top',
      hover: true,
      rowClassName: (rowKey: string) => `${rowKey}-class`,
      pagination: {
        total: 0,
        current: 1,
        pageSize: 10
      },
      // 顶部搜索（group_code 一并随请求发出：走后端精确匹配，不进 filter_by 的 like 通道）
      searchformData: {
        remarks: "",
        code: "",
        group_code: ""
      },

      // ---------- 网站分组 ----------
      hostGroups: [],          // hostgroup/all 返回的分组列表
      groupAllCount: 0,        // 全部网站数（不含全局网站）
      groupNoneCount: 0,       // 未分组网站数
      currentGroup: 'all',     // 左栏当前选中：all / __none__ / 分组短码
      groupColors: ['#0052D9', '#2BA471', '#E37318', '#D54941', '#834EC2', '#0594FA', '#8B8B8B', '#D4A017'],
      groupFormVisible: false,
      groupForm: { id: '', group_name: '', color: '#0052D9', remarks: '' },
      groupDelVisible: false,
      groupDelTarget: { id: '', group_name: '', host_count: 0 },
      assignVisible: false,
      assignGroupCode: '',
      assignGlobalCount: 0,
      // 排序字段
      sorts: {
        sortBy:"create_time",
        descending:true,
      },
      // 筛选字段
      filters:{
        filter_by:"",
        filter_value:"",
      },
      // 索引区域
      deleteIdx: -1,
      guardStatusIdx: -1,
      startStatusIdx: -1,

      // 来源页面
      sourcePage: "",
      hostAddUrl: `${this.samwafglobalconfig.getOnlineUrl()  }/guide/Host.html#_2-新增可被防火墙保护的网站`,
      // 主机字典
      host_dic: {},

      // 弹窗确认
      guardConfirmVisible: false,// 更改防护状态的弹窗控制
      startConfirmVisible: false,// 更改启动状态的弹窗控制

      // 负载列表
      loadBalanceColumns: [
        {
          title: this.$t('page.host.host'),
          align: 'left',
          width: 200,
          ellipsis: true,
          colKey: 'remote_ip',
        },
        {
          title: this.$t('page.host.port'),
          width: 100,
          ellipsis: true,
          colKey: 'remote_port',
        },
        {
          title: this.$t('common.remarks'),
          width: 200,
          ellipsis: true,
          colKey: 'remarks',
        },
        {
          align: 'left',
          width: 200,
          colKey: 'op',
          title: this.$t('common.op'),
        },
      ],
      // 下拉框是否可以筛选
      selectCanFilter:true,
      // 当前选择的主机
      currentHostCode:"",
      guardAllConfirmVisible: false, // 一键修改所有主机防护状态的确认对话框
      guardAllStatus: "1", // 默认选择开启

      // ---------- 站点态势总览（KPI） ----------
      statsLoading: false,
      // 由一次独立的全量拉取计算，不随当前分页 / 筛选变化
      hostStats: {
        total: 0, protected: 0, abnormal: 0,
        attack: 0, pv: 0, uv: 0,
        trafficIn: 0, trafficOut: 0,
        qps: 0, conn: 0, lbSites: 0, globalCount: 0,
        firstAbnormal: '',
      },
      // 展开行：承载备注 / 创建时间等次要信息，保持主行聚焦
      expandedRowKeys: [],

      // 首次拿到数据后按内容自适应一次列宽，之后交给用户拖拽
      autoFitDone: false,
    };
  },
  computed: {
    // 网站表单弹窗实际宽度：全屏时铺满视口，否则用 Tab 布局对应的固定宽度
    hostFormEffectiveWidth() {
      return this.hostFormFullscreen ? '96%' : this.hostFormDialogWidth;
    },
    // 端口占用总览表列（issue #955）
    portOverviewColumns() {
      return [
        { colKey: 'port', title: this.$t('page.host.port_listen.col_port'), width: 90, cell: 'port' },
        { colKey: 'active', title: this.$t('page.host.port_listen.col_active'), width: 130, cell: 'active' },
        { colKey: 'sites', title: this.$t('page.host.port_listen.col_sites'), cell: 'sites' },
        { colKey: 'status', title: this.$t('page.host.port_listen.col_status'), width: 110, cell: 'status' },
      ];
    },
    /**
     * group_code -> 分组对象 的字典，供表格「分组」列渲染。
     * 后端不做 join，组名与颜色都在前端映射；映射不到就是「未知分组」（跨实例导入没带 host_group 表的情形）。
     */
    groupDict() {
      const dict = {};
      (this.hostGroups || []).forEach((g) => { dict[g.group_code] = g; });
      return dict;
    },
    /**
     * 顶部站点态势总览卡片。数据来自 hostStats（一次全量拉取），
     * 让页面在进入时先看到整体防护态势，而不是直接陷入列表。
     */
    kpiCards() {
      const s = this.hostStats;
      const fmt = (v) => (Number(v) || 0).toLocaleString('en-US');
      const ratio = s.total > 0 ? Math.round((s.protected / s.total) * 1000) / 10 : 0;
      const traffic = (Number(s.trafficIn) || 0) + (Number(s.trafficOut) || 0);
      return [
        {
          key: 'sites', theme: 'brand', icon: ViewListIcon,
          label: this.$t('page.host.overview_sites'), value: fmt(s.total),
          sub: s.globalCount > 0
            ? this.$t('page.host.overview_sub_global', { n: s.globalCount })
            : this.$t('page.host.overview_sub_groups', { n: (this.hostGroups || []).length }),
        },
        {
          key: 'guard', theme: 'success', icon: SecuredIcon,
          label: this.$t('page.host.overview_guard'), value: `${s.protected}/${s.total}`,
          sub: this.$t('page.host.overview_ratio', { n: ratio }),
        },
        {
          key: 'abnormal', theme: 'error', icon: ErrorCircleIcon,
          label: this.$t('page.host.overview_abnormal'), value: fmt(s.abnormal),
          sub: s.firstAbnormal || this.$t('page.host.overview_all_sites'),
        },
        {
          key: 'attack', theme: 'error', icon: CloseCircleIcon,
          label: this.$t('page.host.overview_attack'), value: fmt(s.attack),
          sub: this.$t('page.host.overview_all_sites'),
        },
        {
          key: 'pv', theme: 'cyan', icon: ChartLineIcon,
          label: this.$t('page.host.overview_pv'), value: fmt(s.pv),
          sub: this.$t('page.host.overview_pv_sub', { n: fmt(s.uv) }),
        },
        {
          key: 'traffic', theme: 'purple', icon: CloudUploadIcon,
          label: this.$t('page.host.overview_traffic'), value: this.formatTrafficBytes(traffic),
          sub: this.$t('page.host.overview_traffic_sub', {
            in: this.formatTrafficBytes(s.trafficIn),
            out: this.formatTrafficBytes(s.trafficOut),
          }),
        },
        {
          key: 'qps', theme: 'warning', icon: ThunderIcon,
          label: this.$t('page.host.overview_qps'), value: fmt(s.qps),
          sub: this.$t('page.host.overview_all_sites'),
        },
        {
          key: 'conn', theme: 'success', icon: LinkIcon,
          label: this.$t('page.host.overview_conn'), value: fmt(s.conn),
          sub: this.$t('page.host.overview_lb_sites', { n: s.lbSites }),
        },
      ];
    },
    confirmBody() {
      if (this.deleteIdx > -1) {
        const {
          host
        } = this.data?.[this.deleteIdx];
        return this.$t('page.host.delete_confirm_clear_relation');
      }
      return '';
    },
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
    },
    /**
     * 编辑弹窗标题上显示的站点信息，格式与顶部站点下拉一致：域名:端口(昵称,SSL,备注)
     */
    editHostLabel() {
      const data = this.formEditData || {};
      if (!data.host) {
        return '';
      }
      const bracketContent = [];
      if (data.nickname) {
        bracketContent.push(data.nickname);
      }
      if (Number(data.ssl) === 1) {
        bracketContent.push('SSL');
      }
      if (data.remarks) {
        bracketContent.push(data.remarks);
      }
      const baseLabel = `${data.host}:${data.port}`;
      return bracketContent.length > 0 ? `${baseLabel}(${bracketContent.join(',')})` : baseLabel;
    },
    /**
     * 可用的目标主机列表（排除源主机）
     */
    availableTargetHosts() {
      // 从host_dic获取所有可用站点，转换为数组格式
      const allHosts = Object.keys(this.host_dic).map(code => ({
        code,
        host: this.host_dic[code]
      }));
      
      // 过滤掉全局网站（通过host名称判断）
      const nonGlobalHosts = allHosts.filter(host => host.host !== '全局网站:0');
      
      // 只有在选择了源主机时才排除，否则显示所有非全局主机
      if (this.batchCopyForm.sourceHost) {
        return nonGlobalHosts.filter(host => host.code !== this.batchCopyForm.sourceHost);
      }
      return nonGlobalHosts;
    },
    /**
     * 是否全选了所有目标站点
     */
    isAllTargetsSelected() {
      return this.batchCopyForm.targetHosts.length === this.availableTargetHosts.length && this.availableTargetHosts.length > 0;
    }
  },
  mounted() {
    this.loadHostGroups();
    this.loadHostList().then(() => {
      this.getList("");
      this.loadStats(); // 首次进入拉一次全站汇总（之后只在增删改 / 开关变更后刷新）
    });
    this.baseUrl = getBaseUrl()
    this.fileUploadUrl = `${this.baseUrl  }/import`
    this.fileHeader['X-Token'] = localStorage.getItem("access_token") ? localStorage.getItem("access_token") : ""
    console.log(this.baseUrl)
    if (this.$route.query != null && this.$route.query.sourcePage != "") {
      this.sourcePage = this.$route.query.sourcePage;
      if (this.sourcePage == "HomeFrist") {
        this.addFormVisible = true
      }
    }
    // 别处（访问日志「IP提取有问题?」、CC 规则「去设置」）跳过来：直接打开该站点编辑弹窗并定位到对应页签
    if (this.$route.query && this.$route.query.editcode) {
      const editCode = String(this.$route.query.editcode);
      // tab 用名字传，避免调用方去记面板编号
      const tabMap = { ipsource: 4, captcha: 7 };
      this.editInitTab = tabMap[String(this.$route.query.tab || '')] || 1;
      this.formEditData = { code: '' };
      this.editFormVisible = true;
      this.getDetail(editCode);
    }
  },

  methods: {
    // ==================== 网站分组 ====================
    /**
     * 拉取全部分组 + 未分组/全部计数（左栏与表格「分组」列共用一份数据）
     */
    loadHostGroups() {
      return allHostGroup({}).then((res) => {
        if (res.code === 0 && res.data) {
          this.hostGroups = res.data.list || [];
          this.groupNoneCount = res.data.none_count || 0;
          this.groupAllCount = res.data.all_count || 0;
          // 当前选中的分组被别处删掉了，退回「全部网站」，免得一直查一个不存在的组
          if (this.currentGroup !== 'all' && this.currentGroup !== '__none__'
              && !this.hostGroups.some((g) => g.group_code === this.currentGroup)) {
            this.currentGroup = 'all';
            this.searchformData.group_code = '';
          }
        }
      }).catch((e: Error) => {
        console.log(e);
      });
    },
    /**
     * 切换左栏分组：分页必须重置到第 1 页，
     * 否则停在第 3 页切到只有 1 页的组会显示空列表，看着像数据丢了。
     */
    pickGroup(code) {
      this.currentGroup = code;
      this.searchformData.group_code = code === 'all' ? '' : code;
      this.pagination.current = 1;
      this.selectedRowKeys = [];
      this.getList('');
    },
    /**
     * 预设色 -> 浅色底，用于分组标签背景（颜色本身来自后端白名单，不是任意字符串）
     */
    hexToSoft(hex) {
      if (!hex || hex.length !== 7) {
        return '#f3f3f3';
      }
      const r = parseInt(hex.substr(1, 2), 16);
      const g = parseInt(hex.substr(3, 2), 16);
      const b = parseInt(hex.substr(5, 2), 16);
      return `rgba(${r}, ${g}, ${b}, 0.1)`;
    },
    /**
     * 行内「更多」里的低频操作。高频的「编辑」「证书申请」在单元格里直出，不进这里。
     */
    rowMoreOptions() {
      return [
        { content: this.$t('common.copy'), value: 'copy' },
        { content: this.$t('common.delete'), value: 'del', theme: 'error' },
      ];
    },
    onRowMoreClick(data, slotProps) {
      const act = data && data.value ? data.value : data;
      if (act === 'copy') {
        this.handleClickCopy(slotProps);
      } else if (act === 'del') {
        this.handleClickDelete(slotProps);
      }
    },
    groupMenuOptions(idx) {
      return [
        { content: this.$t('page.host.group.rename'), value: 'edit' },
        { content: this.$t('page.host.group.move_left'), value: 'up', disabled: idx === 0 },
        { content: this.$t('page.host.group.move_right'), value: 'down', disabled: idx === this.hostGroups.length - 1 },
        { content: this.$t('common.delete'), value: 'del', theme: 'error' },
      ];
    },
    onGroupMenuClick(data, group, idx) {
      const act = data && data.value ? data.value : data;
      if (act === 'edit') {
        this.openGroupForm(group);
      } else if (act === 'up') {
        this.moveGroup(idx, -1);
      } else if (act === 'down') {
        this.moveGroup(idx, 1);
      } else if (act === 'del') {
        this.askDelGroup(group);
      }
    },
    openGroupForm(group) {
      if (group) {
        this.groupForm = {
          id: group.id,
          group_name: group.group_name,
          color: group.color || this.groupColors[0],
          remarks: group.remarks || '',
        };
      } else {
        this.groupForm = { id: '', group_name: '', color: this.groupColors[0], remarks: '' };
      }
      this.groupFormVisible = true;
    },
    saveGroup() {
      const name = (this.groupForm.group_name || '').trim();
      if (!name) {
        this.$message.warning(this.$t('page.host.group.name_required'));
        return;
      }
      const body = { group_name: name, color: this.groupForm.color, remarks: this.groupForm.remarks };
      const req = this.groupForm.id
        ? editHostGroup({ ...body, id: this.groupForm.id })
        : addHostGroup(body);
      req.then((res) => {
        if (res.code === 0) {
          this.$message.success(res.msg || this.$t('common.success'));
          this.groupFormVisible = false;
          this.loadHostGroups();
          this.getList('');
        } else {
          this.$message.error(res.msg || this.$t('common.failed'));
        }
      }).catch((e: Error) => {
        console.log(e);
      });
    },
    askDelGroup(group) {
      this.groupDelTarget = {
        id: group.id,
        group_name: group.group_name,
        host_count: group.host_count || 0,
      };
      this.groupDelVisible = true;
    },
    doDelGroup() {
      delHostGroup({ id: this.groupDelTarget.id }).then((res) => {
        if (res.code === 0) {
          this.$message.success(res.msg || this.$t('common.success'));
          this.groupDelVisible = false;
          // 被删的组正好是当前筛选条件时退回「全部网站」
          this.loadHostGroups().then(() => {
            this.pickGroup(this.currentGroup === 'all' ? 'all' : this.currentGroup);
          });
        } else {
          this.$message.error(res.msg || this.$t('common.failed'));
        }
      }).catch((e: Error) => {
        console.log(e);
      });
    },
    moveGroup(idx, delta) {
      const target = idx + delta;
      if (target < 0 || target >= this.hostGroups.length) {
        return;
      }
      const arr = this.hostGroups.slice();
      const tmp = arr[idx];
      arr[idx] = arr[target];
      arr[target] = tmp;
      sortHostGroup({ ids: arr.map((g) => g.id) }).then((res) => {
        if (res.code === 0) {
          this.hostGroups = arr;
        } else {
          this.$message.error(res.msg || this.$t('common.failed'));
        }
      }).catch((e: Error) => {
        console.log(e);
      });
    },
    openAssignGroup() {
      if (this.selectedRowKeys.length === 0) {
        return;
      }
      // 全局网站不参与分组，后端也会剔除；这里只是先把数量告诉用户
      this.assignGlobalCount = (this.data || []).filter(
        (row) => this.selectedRowKeys.indexOf(row.code) > -1 && row.global_host === 1,
      ).length;
      this.assignGroupCode = '';
      this.assignVisible = true;
    },
    doAssignGroup() {
      assignHostGroup({ host_codes: this.selectedRowKeys, group_code: this.assignGroupCode }).then((res) => {
        if (res.code === 0) {
          this.$message.success(res.msg || this.$t('common.success'));
          this.assignVisible = false;
          this.selectedRowKeys = [];
          this.loadHostGroups();
          this.getList('');
        } else {
          this.$message.error(res.msg || this.$t('common.failed'));
          // 目标组可能刚被别处删掉，刷新左栏让用户看到最新的组
          this.loadHostGroups();
        }
      }).catch((e: Error) => {
        console.log(e);
      });
    },
    // HostForm 内切换 Tab 布局时联动调整弹窗宽度
    onHostTabPlacementChange(placement: string) {
      this.hostFormDialogWidth = placement === 'top' ? 750 : 920;
    },
    formatTrafficBytes(bytes) {
      if (!bytes || bytes === 0) return '0 B';
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let size = bytes;
      let unitIndex = 0;
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
    },

    // ==================== 站点访问地址 / 监听端口 ====================
    /**
     * 站点主访问地址：优先用主监听（resolved_listens 里 is_main 的那条）的协议+端口拼，
     * 没有监听表时退回 ssl + port。默认端口（80/443）不写进 URL。
     */
    siteUrl(row) {
      if (!row || !row.host || Number(row.global_host) === 1) return '';
      const listens = Array.isArray(row.resolved_listens)
        ? row.resolved_listens.filter((l) => l && !l.implied)
        : [];
      const main = listens.find((l) => l.is_main) || listens[0];
      const proto = (main && main.proto) || (row.ssl === SSL_STATUS.SSL ? 'https' : 'http');
      const port = Number((main && main.port) || row.port) || 0;
      const isDefault = (proto === 'https' && port === 443) || (proto === 'http' && port === 80);
      return `${proto}://${row.host}${isDefault || !port ? '' : `:${port}`}`;
    },
    /** 同站点的其它绑定域名 → 复用主地址的协议与端口 */
    domainUrl(row, domain) {
      const base = this.siteUrl(row);
      if (!base || !domain) return '';
      try {
        const u = new URL(base);
        return `${u.protocol}//${domain}${u.port ? `:${u.port}` : ''}`;
      } catch (e) {
        return '';
      }
    },
    /** 绑定域名列表（bind_more_host 按行） */
    domains(row) {
      if (!row || !row.bind_more_host) return [];
      return String(row.bind_more_host).split('\n').map((s) => s.trim()).filter(Boolean);
    },
    /** 「监听端口」并入站点列后的标签；无 resolved_listens 时回退 port / bind_more_port */
    portTags(row) {
      if (!row) return [];
      const listens = Array.isArray(row.resolved_listens)
        ? row.resolved_listens.filter((l) => l && !l.implied)
        : [];
      if (listens.length > 0) {
        return listens.map((l, i) => {
          const proto = String(l.proto || '').toLowerCase();
          return {
            key: `rl-${l.port}-${proto}-${i}`,
            proto,
            label: `${l.port}·${proto.toUpperCase()}`,
            title: `${l.port} · ${proto.toUpperCase()}${l.ipv && l.ipv !== 'both' ? ` · ${l.ipv}` : ''}`,
          };
        });
      }
      const out = [];
      if (row.port) {
        const proto = row.ssl === SSL_STATUS.SSL ? 'https' : 'http';
        out.push({
          key: `p-${row.port}`,
          proto,
          label: `${row.port}·${proto.toUpperCase()}`,
          title: `${row.port} · ${proto.toUpperCase()}`,
        });
      }
      String(row.bind_more_port || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((p, i) => out.push({ key: `m-${i}-${p}`, proto: '', label: p, title: p }));
      return out;
    },
    /** 站点列是否有 badge 行（SSL / 监听端口 / 分组） */
    hasHostBadges(row) {
      if (!row) return false;
      return row.ssl === SSL_STATUS.SSL
        || this.portTags(row).length > 0
        || Number(row.global_host) === 1
        || !!row.group_code;
    },
    /** 健康三态：ok 正常 / bad 异常 / unknown 未知；全局站点返回 none（不展示） */
    healthState(row) {
      if (!row || Number(row.global_host) === 1) return 'none';
      const hs = row.healthy_status;
      if (!Array.isArray(hs) || hs.length === 0) return 'unknown';
      return hs.some((h) => h && h.IsHealthy === false) ? 'bad' : 'ok';
    },
    /** 后端地址：IPv6 用 [] 包起来，否则会看成「地址:端口」连在一起 */
    formatBackendAddr(row) {
      if (!row) return '';
      const ip = row.remote_ip || '';
      const host = ip.indexOf(':') >= 0 ? `[${ip}]` : ip;
      return row.remote_port ? `${host}:${row.remote_port}` : host;
    },
    /**
     * 按内容自适应列宽：离屏克隆一份表格、放开 fixed 布局量出每列自然宽度，
     * 再写回 columns[].width（也就是 resizable 的拖拽基线）。首次拿到数据后跑一次。
     */
    autoFitColumns() {
      try {
        const table = this.$el && this.$el.querySelector('.t-table__content table');
        if (!table || !table.querySelector('tbody tr')) return false;

        const holder = document.createElement('div');
        holder.style.cssText = 'position:fixed;left:-99999px;top:-99999px;visibility:hidden;pointer-events:none;';
        const clone = table.cloneNode(true);
        clone.style.tableLayout = 'auto';
        clone.style.width = 'auto';
        // resizable 会把当前列宽写成 <col style="width:...">，auto 布局下这些宽度仍是「下限」，
        // 不清掉就只能量出≈当前配置宽度，域名短的场景永远收不回去
        clone.querySelectorAll('col').forEach((col) => {
          col.removeAttribute('width');
          col.style.width = '';
          col.style.minWidth = '';
        });
        holder.appendChild(clone);
        document.body.appendChild(holder);

        const measure = (key) => {
          const th = clone.querySelector(`.t-table__th-${key}`);
          return th ? Math.ceil(th.getBoundingClientRect().width) : 0;
        };
        const got = {
          host: measure('host'),
          run: measure('status_switches'),
          stats: measure('data_stats'),
          backend: measure('backend'),
          op: measure('op'),
        };
        document.body.removeChild(holder);

        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, (v || 0) + 4));
        this.columns = this.columns.map((c) => {
          if (c.colKey === 'host') return { ...c, width: clamp(got.host, 300, 520) };
          if (c.colKey === 'status_switches') return { ...c, width: clamp(got.run, 176, 220) };
          if (c.colKey === 'data_stats') return { ...c, width: clamp(got.stats, 340, 560) };
          if (c.colKey === 'backend') return { ...c, width: clamp(got.backend, 170, 320) };
          if (c.colKey === 'op') return { ...c, width: clamp(got.op, 150, 220) };
          return c;
        });
        return true;
      } catch (e) {
        console.log(e);
        return false;
      }
    },
    /** 健康状态文案：正常 / 异常 / 未知 */
    healthText(row) {
      const st = this.healthState(row);
      if (st === 'ok') return this.$t('page.host.healthy_status_normal');
      if (st === 'bad') return this.$t('page.host.healthy_status_abnormal');
      return this.$t('page.host.healthy_status_unknown');
    },
    /** 最近检测时间：列里只放 时:分:秒，完整时间放 tooltip */
    healthCheckTime(row) {
      const hs = Array.isArray(row && row.healthy_status) ? row.healthy_status : [];
      const entry = hs.find((h) => h && h.IsHealthy === false) || hs[0] || {};
      const raw = entry.LastCheckTime;
      if (!raw) return '';
      const d = new Date(Number(raw) || raw);
      if (Number.isNaN(d.getTime())) return '';
      const p = (n) => String(n).padStart(2, '0');
      return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    },
    /** 健康状态 tooltip：状态 + 完整检测时间 + 失败次数与原因（信息量比只有一个图标大） */
    healthTip(row) {
      const st = this.healthState(row);
      const hs = Array.isArray(row && row.healthy_status) ? row.healthy_status : [];
      const entry = hs.find((h) => h && h.IsHealthy === false) || hs[0] || {};
      const parts = [this.healthText(row)];
      if (entry.LastCheckTime) {
        const d = new Date(Number(entry.LastCheckTime) || entry.LastCheckTime);
        if (!Number.isNaN(d.getTime())) {
          parts.push(`${this.$t('page.host.healthy_status_detail.check_time')} ${d.toLocaleString()}`);
        }
      }
      if (st === 'bad') {
        if (entry.FailCount) parts.push(`${this.$t('page.host.healthy_status_detail.failure_cnt')} ${entry.FailCount}`);
        if (entry.LastErrorReason) parts.push(entry.LastErrorReason);
      }
      return parts.join(' · ');
    },

    // ==================== 站点态势总览（KPI） ====================
    /**
     * 拉取全量站点用于计算顶部态势总览。独立于列表分页/筛选：
     * 列表是「当前作用域」，总览始终是「全站」。
     * 站点超过单页上限时分页拉全，保证汇总与「站点总数」同一口径——
     * 否则 >1000 站点时总数显示真实值、其余指标只算前 1000 条，相邻卡片互相矛盾。
     */
    async loadStats() {
      this.statsLoading = true;
      try {
        const pageSize = 1000;
        const rows = [];
        let total = 0;
        let pageIndex = 1;
        let gotAny = false;
        for (;;) {
          // 分页只能串行：下一翻要靠上一页返回的 total 判断是否已经拉完
          // eslint-disable-next-line no-await-in-loop
          const res = await hostlist({ pageSize, pageIndex, sort_by: 'create_time', sort_descending: 'desc' });
          if (!res || res.code !== 0) break;
          gotAny = true;
          const list = (res.data && res.data.list) || [];
          total = Number((res.data && res.data.total) || 0) || list.length;
          rows.push(...list);
          // 拉完 / 空页即停；用 rows >= total 兜底，防止服务端 total 与实际可翻页数不一致时死循环
          if (list.length === 0 || rows.length >= total) break;
          pageIndex += 1;
        }
        // 一页都没拿到时保留上一次汇总，避免请求失败把整排 KPI 清零
        if (!gotAny) return;
        const s = {
          total: total || rows.length,
          protected: 0, abnormal: 0,
          attack: 0, pv: 0, uv: 0,
          trafficIn: 0, trafficOut: 0,
          qps: 0, conn: 0, lbSites: 0, globalCount: 0,
          firstAbnormal: '',
        };
        rows.forEach((r) => {
          if (Number(r.guard_status) === 1) s.protected += 1;
          if (Number(r.global_host) === 1) s.globalCount += 1;
          if (Number(r.is_enable_load_balance) === 1) s.lbSites += 1;
          s.attack += Number(r.today_attack_count) || 0;
          s.pv += Number(r.today_pv_count) || 0;
          s.uv += Number(r.today_uv_count) || 0;
          s.trafficIn += Number(r.today_traffic_in) || 0;
          s.trafficOut += Number(r.today_traffic_out) || 0;
          s.qps += Number(r.real_time_qps) || 0;
          s.conn += Number(r.real_time_connect_cnt) || 0;
          if (this.isHostAbnormal(r)) {
            s.abnormal += 1;
            if (!s.firstAbnormal) s.firstAbnormal = r.nickname || r.host;
          }
        });
        this.hostStats = s;
      } catch (e) {
        console.log(e);
      } finally {
        this.statsLoading = false;
      }
    },
    /** 单站点是否健康异常：全局站点不计；无健康数据视为「未知」不算异常 */
    isHostAbnormal(row) {
      if (!row || Number(row.global_host) === 1) return false;
      const hs = row.healthy_status;
      if (!Array.isArray(hs) || hs.length === 0) return false;
      return hs.some((h) => h && h.IsHealthy === false);
    },
    onExpandChange(value) {
      this.expandedRowKeys = value;
    },
    /** 展开行：承载备注 / 创建时间 / 多域名等次要信息，主行不再堆叠 */
    expandedRow(h, { row }) {
      const items = [
        { k: this.$t('common.remarks'), v: row.remarks || '—' },
        { k: this.$t('common.create_time'), v: row.create_time || '—' },
        { k: this.$t('page.host.remote_ip'), v: this.formatBackendAddr(row) || '—' },
      ];
      // 「来源严格端口」是安全相关的工作模式，旧列表页每行会标出来；
      // 改版后主行不放次要标记，就在这里补上（只在开启时显示，与旧版一致）
      if (Number(row.global_host) !== 1 && (row.unrestricted_port === 0 || row.unrestricted_port === '0')) {
        items.push({
          k: this.$t('page.host.unrestricted_port.label_unrestricted_port_is_enable'),
          v: this.$t('page.host.unrestricted_port.label_unrestricted_port_is_enable_on'),
        });
      }
      if (row.bind_more_host && String(row.bind_more_host).trim()) {
        items.push({
          k: this.$t('page.host.bind_domains'),
          v: String(row.bind_more_host).split('\n').map((x) => x.trim()).filter(Boolean).join(' / '),
        });
      }
      // 说明：expandedRow 是运行时 h() 生成的 VNode，拿不到 scoped 的 data-v 作用域，
      // 因此这里用内联样式而不是 class，避免展开后没有样式。
      return h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px 28px;padding:2px 0;' },
        items.map((it) => h('div', { style: 'display:flex;gap:8px;font-size:12.5px;' }, [
          h('span', { style: 'color:var(--td-text-color-placeholder);' }, it.k),
          h('span', { style: 'color:var(--td-text-color-primary);' }, it.v),
        ])));
    },
    // ==================== 工具栏分组下拉 ====================
    batchMenuOptions() {
      return [
        { content: this.$t('page.host.modify_all_guard_status'), value: 'guardAll' },
        { content: this.$t('page.host.batch_copy_config'), value: 'batchCopy' },
      ];
    },
    onBatchMenuClick(data) {
      const act = data && data.value ? data.value : data;
      if (act === 'guardAll') {
        this.handleModifyAllGuardStatus();
      } else if (act === 'batchCopy') {
        this.handleBatchCopyConfig();
      }
    },
    importExportMenuOptions() {
      return [
        { content: this.$t('page.host.export_data'), value: 'export' },
        { content: this.$t('page.host.import_data'), value: 'import' },
        { content: this.$t('page.host.import_nginx'), value: 'nginx' },
      ];
    },
    onImportExportMenuClick(data) {
      const act = data && data.value ? data.value : data;
      if (act === 'export') {
        this.HandleExportExcel();
      } else if (act === 'import') {
        this.HandleImportExcel();
      } else if (act === 'nginx') {
        this.handleImportNginx();
      }
    },

    // 一键修改所有主机防护状态
    handleModifyAllGuardStatus() {
      this.guardAllConfirmVisible = true;
    },

    // 确认修改所有主机防护状态
    onGuardAllStatusConfirm() {
      this.modifyAllGuardStatus(this.guardAllStatus);
      this.guardAllConfirmVisible = false;
    },

    // 取消修改所有主机防护状态
    onGuardAllStatusCancel() {
      this.guardAllConfirmVisible = false;
    },

    // 调用API修改所有主机防护状态
    modifyAllGuardStatus(status) {
      const loading = this.$loading({
        fullscreen: true,
        text: this.$t('common.loading'),
      });

      modifyAllGuardStatus({ guard_status: parseInt(status)})
        .then(response => {
          if (response.code === 0) {
            this.$message.success(this.$t('common.success'));
            this.getList('all'); // 刷新列表
            this.loadStats(); // 批量开关会影响「防护开启」等汇总
          } else {
            this.$message.error(response.msg || this.$t('common.failed'));
          }
        })
        .catch(() => {
          this.$message.error(this.$t('common.failed'));
        })
        .finally(() => {
          loading.hide();
        });
    },
    loadHostList() {
      return new Promise((resolve, reject) => {
        allhost()
          .then((res) => {
            const resdata = res;
            console.log(resdata);
            if (resdata.code === 0) {
              const host_options = resdata.data;
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
      const that = this
      const sort_descending =that.sorts.descending?"desc":"asc"
      const filterParams = this.composeFilterParams();
      hostlist({
        pageSize: that.pagination.pageSize,
        pageIndex: that.pagination.current,
        sort_by: that.sorts.sortBy,
        sort_descending,
        filter_by: filterParams.filter_by,
        filter_value: filterParams.filter_value,
        ...that.searchformData
      }).then((res) => {
        const resdata = res
        console.log(resdata)
        if (resdata.code === 0) {

          // const { list = [] } = resdata.data.list;

          this.data = resdata.data.list??[];
          this.data_attach = []
          for (let i = 0; i < this.data.length; i++) {
            this.data[i].guard_status_visiable = false // 可扩充
          }
          console.log('getList', this.data)
          this.pagination = {
            ...this.pagination,
            total: resdata.data.total,
          };
          // 首次拿到数据后按内容自适应一次列宽（之后列宽交给用户拖拽）
          if (!this.autoFitDone) {
            this.$nextTick(() => {
              setTimeout(() => {
                if (this.autoFitColumns()) {
                  this.autoFitDone = true;
                }
              }, 0);
            });
          }
        }
      })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
          this.dataLoading = false;
        });
      this.dataLoading = true;
      // 顶部态势总览不在这里刷新：翻页 / 筛选不改变汇总数字，
      // 只在增删改 / 防护开关成功后由各回调显式调用 loadStats()（否则每翻一页都全量重拉 1000 行）
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
      console.log(e)
      const {
        code
      } = e.row
      console.log('hostlist', code)
      this.$router.push({
        path: '/waf-host/wafhostdetail',
        query: {
          code,
        },
      },);
    },
    handleClickCopy(e) {

      console.log(e)
      const {
        code, global_host
      } = e.row
      if (global_host === 1) {
        this.$message.warning(this.$t('page.host.forbid_for_global_site'));
        return
      }
      console.log(code)
      this.addFormVisible = true
      const that = this
      getHostDetail({
        CODE: code,
      })
        .then((res) => {
          const resdata = res
          console.log(resdata)
          if (resdata.code === 0) {
            const detail_data_tmp = resdata.data;
            that.formData= {
              ...detail_data_tmp
            }
            that.$set(that.formData, 'code', uuidv4());
            // 清空SSL证书相关信息和绑定关系
            that.$set(that.formData, 'bind_ssl_id', '');
            that.$set(that.formData, 'auto_jump_https', 0);
            that.$set(that.formData, 'certfile', '');
            that.$set(that.formData, 'keyfile', '');
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
        });
    },
    handleClickEdit(e) {
      this.editInitTab = 1;
      console.log(e)
      const {
        code, global_host
      } = e.row
      if (global_host === 1) {
        this.$message.warning(this.$t('page.host.forbid_for_global_site_only_change_guard_status'));
        return
      }
      console.log(code)
      // 先清空，避免详情返回前弹窗标题上还显示上一个站点信息
      this.formEditData = {
        code: ''
      }
      this.editFormVisible = true
      this.getDetail(code)
    },
    handleAddHost() {
      this.$set(this.formData, 'code', uuidv4());
      console.log("新增主机code信息", this.formData.code)
      this.addFormVisible = true
    },
    // 端口占用总览（issue #955）
    handlePortOverview() {
      this.portOverviewVisible = true;
      this.portOverviewLoading = true;
      // 响应拦截器返回的是整个报文 {code,msg,data}，列表在 data 里
      getPortOverview({}).then((res) => {
        if (res && res.code === 0) {
          this.portOverviewRows = Array.isArray(res.data) ? res.data : [];
        } else {
          this.portOverviewRows = [];
          if (res && res.msg) this.$message.error(res.msg);
        }
      }).catch((e) => {
        this.$message.error((e && e.message) ? e.message : String(e));
      }).finally(() => {
        this.portOverviewLoading = false;
      });
    },
    onHostFullscreenChange(val) {
      this.hostFormFullscreen = val;
    },
    portOverviewRowClass({ row }) {
      return row && row.conflict ? 'port-overview-conflict-row' : '';
    },
    // 跳转到一键修改页的“批量导入网址”标签
    handleImportNginx() {
      this.$router.push({
        name: 'OneKeyMod',
        query: { tab: 'import' },
      });
    },
    onSubmit(data ): void {
      console.log(data)
      const that = this
      addHost( {
        ...data.result
      }).then((res) => {
        const resdata = res
        console.log(resdata)
        if (resdata.code === 0) {
          that.$message.success(resdata.msg);


          console.log("submit host data",data)
          if(data.result.ssl_config_mode === "auto_apply"){
            that.loadHostList().then(() => {
              that.sslAutoApplyVisible = true;
              that.currentHostCode = resdata.data
              console.log("auto_apply code", resdata.data)
            });
          }

          that.addFormVisible = false;
          that.pagination.current = 1

          that.formData = { ...INITIAL_DATA };
          that.loadHostGroups();
          that.getList("")
          that.loadStats();
        } else {
          that.$message.warning(resdata.msg);
        }
      })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
        });
    },
    onSubmitEdit(data): void {
      const that = this
      console.log('editHost',data)
      editHost( {
        ...data.result
      })
        .then((res) => {
          const resdata = res
          console.log(resdata)
          if (resdata.code === 0) {
            that.$message.success(resdata.msg);
            that.editFormVisible = false;
            that.loadHostGroups();
            that.getList("")
            that.loadStats();
          } else {
            that.$message.warning(resdata.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
        });
    },
    onClickCloseBtn(): void {
      this.addFormVisible = false;
      this.formData = {};
      this.hostDefenseData = {
        bot: "1",
        sqli: "1",
        xss: "1",
        scan: "1",
        rce: "1",
        sensitive: "1",
        traversal: "1",
        owaspset: "0"
      }
      this.healthyConfigData = {
        ...INITIAL_HEALTHY
      }
      this.captchaConfigData = {
        ...INITIAL_CAPTCHA
      }
    },
    onClickCloseEditBtn(): void {
      this.editFormVisible = false;
      this.formEditData = {
        code: ''
      };
      this.hostDefenseData = {
        bot: "1",
        sqli: "1",
        xss: "1",
        scan: "1",
        rce: "1",
        sensitive: "1",
        traversal: "1",
        owaspset:"0"
      }
      this.healthyConfigData = {
        ...INITIAL_HEALTHY
      }
      this.captchaConfigData = {
        ...INITIAL_CAPTCHA
      }
    },
    handleClickDelete(row) {
      const {
        code, global_host
      } = row.row
      if (global_host === 1) {
        this.$message.warning("全局网站只能配置保护状态");
        // return
      }
      console.log(row)
      this.deleteIdx = row.rowIndex;
      this.confirmVisible = true;
    },
    // SSL申请
    handleClickSSLApply(row){
      const {
        code, global_host
      } = row.row
      if (global_host === 1) {
        this.$message.warning("全局网站不能申请");
      }
      this.loadHostList().then(() => {
        this.sslAutoApplyVisible = true;
        this.currentHostCode = code
        console.log("code,global_host",code,global_host)
      });

    },
    onConfirmDelete() {
      this.confirmVisible = false;
      console.log('delete', this.data)
      console.log('delete', this.data[this.deleteIdx])
      const {
        code
      } = this.data[this.deleteIdx]
      const that = this
      delHost({
        CODE: code,
      })
        .then((res) => {
          const resdata = res
          console.log(resdata)
          if (resdata.code === 0) {

            that.loadHostGroups();
            that.getList("")
            that.loadStats();
            that.$message.success(resdata.msg);
          } else {
            that.$message.warning(resdata.msg);
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
        });


      this.resetIdx();
    },
    onCancel() {
      this.resetIdx();
    },
    resetIdx() {
      this.deleteIdx = -1;
    },
    getDetail(id) {
      const that = this
      getHostDetail({
        CODE: id,
      })
        .then((res) => {
          const resdata = res
          console.log(resdata)
          if (resdata.code === 0) {
            that.detail_data = resdata.data;
            that.formEditData = {
              ...that.detail_data
            }
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
        });
    },
    /**
     * 导出Excel数据
     */
    HandleExportExcel() {
      const that = this
      // window.open('https:\\www.baidu.com','_blank')
      //
      export_api({table_name: "hosts"}).then((res) => {
        const resdata = res
        console.log(resdata)
        const blob = new Blob([res], {type: "application/force-download"}) // Blob 对象表示一个不可变、原始数据的类文件对象
        console.log(blob);
        const fileReader = new FileReader()   // FileReader 对象允许Web应用程序异步读取存储在用户计算机上的文件的内容
        fileReader.readAsDataURL(blob)
        // 开始读取指定的Blob中的内容。一旦完成，result属性中将包含一个data: URL格式的Base64字符串以表示所读取文件的内容
        fileReader.onload = (e) => {
          const a = document.createElement('a')
          a.download = `hosts.xlsx`
          a.href = e.target.result
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }
      })
        .catch((e: Error) => {
          console.log(e);
        })
    },
    /**
     * 导入Excel数据
     */
    HandleImportExcel() {
      this.ImportXlsxVisible = true
      this.tips = ""
      this.files= []
    },
    changeGuardStatus(e, row) {

      console.log(e, row)
      const {code} = row
      const rowIndex = this.data.findIndex((value, index, arr) => {
        console.log("findIndex", value, index, arr)
        return value.code == code
      })
      console.log("rowIndex", rowIndex)
      this.guardStatusIdx = rowIndex
      console.log(e)
      this.guardConfirmVisible = true
    },
    changeStartStatus(e, row) {

      console.log(e, row)
      const {code} = row
      const rowIndex = this.data.findIndex((value, index, arr) => {
        console.log("findIndex", value, index, arr)
        return value.code == code
      })
      console.log("rowIndex", rowIndex)
      this.startStatusIdx = rowIndex
      console.log(e)
      this.startConfirmVisible = true
    },
    isStaticSiteEnabled(row) {
      if (!row || !row.static_site_json) return false;
      try {
        const cfg = typeof row.static_site_json === 'string' ? JSON.parse(row.static_site_json) : row.static_site_json;
        return cfg.is_enable_static_site === 1 || cfg.is_enable_static_site === '1';
      } catch {
        return false;
      }
    },
    handleFail({file}) {
      this.$message.error(`文件 ${file.name} 上传失败`);
    },
    beforeUpload() {
      this.fileHeader['X-Request-Time'] = Math.floor(Date.now() / 1000).toString()
      this.fileHeader['X-Request-Id'] = uuidv4()
      return true
    },
    onSuccess(e) {

      const data = JSON.parse(decryptIncoming(e.response.data))
      console.log('host upload', data)
      let lastMsg = `成功数量 :${  data.SuccessInt}`;
      if (data.FailInt > 0) {
        lastMsg += `失败数量 :${  data.FailInt  } 错误原因:${  data.Msg}`;
      }

      this.tips = lastMsg;
      this.getList("")
      this.loadStats();
    },
    // 跳转界面
    // 更改teatarea
    updateTextareaEdit(event) {
      // this.formEditData = event.target.value;

    },
    // 更改teatarea
    updateTextareaAdd(event) {
      // this.formAddData = event.target.value;

    },

    // 弹窗部分代码
    onGuardStatusConfirm(){

      const that = this
      console.log("this.guardStatusIdx", this.guardStatusIdx)
      if (this.guardStatusIdx == -1) {
        return
      }

      console.log("this.data", this.data[that.guardStatusIdx])
      const {
        code, guard_status
      } = this.data[this.guardStatusIdx]
      changeGuardStatus({
        CODE: code,
        GUARD_STATUS: guard_status == 1 ? 0 : 1,
      })
        .then((res) => {
          const resdata = res
          console.log(resdata)
          if (resdata.code === 0) {
            that.getList("")
            that.loadStats();
            that.$message.success(resdata.msg)
            that.guardStatusIdx = -1;
            this.guardConfirmVisible = false
          } else {
            that.$message.warning(resdata.msg);
            this.guardStatusIdx = -1;
            this.guardConfirmVisible = false

          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
        });
    },
    onGuardStatusCancel(){
      this.guardConfirmVisible = false
      this.guardStatusIdx = -1;
    },
    onStartStatusConfirm() {
      const that = this
      this.startConfirmVisible = false

      const {
        code, start_status
      } = this.data[this.startStatusIdx]
      console.log("code,start_status", code, start_status)
      changeStartStatus({
        CODE: code,
        START_STATUS: start_status === 1 ? 0 : 1,
      }
      )
        .then((res) => {
          const resdata = res
          console.log(resdata)
          if (resdata.code === 0) {
            that.getList("")
            that.loadStats();
            that.$message.success(resdata.msg)
            this.startStatusIdx = -1;
          } else {
            that.$message.warning(resdata.msg);
            this.startStatusIdx = -1;
          }
        })
        .catch((e: Error) => {
          console.log(e);
        })
        .finally(() => {
        });
    },
    onStartStatusCancel() {
      this.startConfirmVisible = false
      this.startStatusIdx = -1;
    },
    /**
     * 组合筛选参数：表格列筛选（filters）+ 顶部「备注」搜索框。
     * 备注列改版后挪进了展开行、没有独立列了，但后端支持 remarks 的 like 查询，
     * 这里统一并入 filter_by / filter_value 通道，两种条件可叠加。
     */
    composeFilterParams() {
      let by = this.filters.filter_by;
      let value = this.filters.filter_value;
      const remarks = String(this.searchformData.remarks || '').trim();
      if (remarks) {
        by = by ? `${by}|remarks` : 'remarks';
        value = value ? `${value}|${remarks}` : remarks;
      }
      return { filter_by: by, filter_value: value };
    },
    /**
     * 筛选结果
     */
    onFilterChange(e){
      const filters = [];


      if (e.host) {
        // 站点列现在同时展示域名和监听端口：纯数字按端口查，其余按域名/昵称查
        const v = String(e.host).trim();
        filters.push({ by: /^\d+$/.test(v) ? "port" : "host", value: v });
      }

      if (e.backend) {
        // 「后端」列显示的是 formatBackendAddr 拼出的完整地址，而库里 remote_ip 只存 IP：
        // 整串（如 192.168.100.14:80）直接 like remote_ip 永远查不到，剥掉端口只按 IP 查；
        // IPv6 一并去掉展示用的方括号。纯数字视为端口，走 remote_port 等值查。
        // 注：这里刻意不追加 remote_port 条件——存量后端对整型列 like 过滤匹配不到任何行，
        // 「只按 IP 查」在新旧后端都能查到人，宁可多带出同 IP 的站点也不要查空。
        const raw = String(e.backend).trim();
        if (/^\d+$/.test(raw)) {
          filters.push({ by: "remote_port", value: raw });
        } else {
          let ip = raw;
          if (ip.startsWith("[")) {
            const close = ip.indexOf("]");
            if (close > -1) {
              ip = ip.slice(1, close);
            }
          } else {
            const colon = ip.lastIndexOf(":");
            if (colon > -1 && ip.indexOf(":") === colon) {
              ip = ip.slice(0, colon);
            }
          }
          filters.push({ by: "remote_ip", value: ip });
        }
      }

      // 将 filters 数组中的 by 和 value 属性分别拼接到 filter_by 和 filter_value 字符串中
      this.filters.filter_by = filters.map(f => f.by).join("|");
      this.filters.filter_value = filters.map(f => f.value).join("|");

      this.getList("");
    },
    onSortChange(sorter){
      const that = this

      if (sorter != undefined){
        this.sorts.sortBy= sorter.sortBy
        that.sorts.descending= sorter.descending
      }else{
        that.sorts.sortBy="create_time"
        that.sorts.descending= true
      }
      this.getList("")
    },
    /**
     * 处理目标站点选择变化
     */
    handleTargetHostChange(hostCode, checked) {
      if (checked) {
        if (!this.batchCopyForm.targetHosts.includes(hostCode)) {
          this.batchCopyForm.targetHosts.push(hostCode);
        }
      } else {
        const index = this.batchCopyForm.targetHosts.indexOf(hostCode);
        if (index > -1) {
          this.batchCopyForm.targetHosts.splice(index, 1);
        }
      }
    },
    /**
     * 处理模块选择变化
     */
    handleModuleChange(moduleValue, checked) {
      if (checked) {
        if (!this.batchCopyForm.modules.includes(moduleValue)) {
          this.batchCopyForm.modules.push(moduleValue);
        }
      } else {
        const index = this.batchCopyForm.modules.indexOf(moduleValue);
        if (index > -1) {
          this.batchCopyForm.modules.splice(index, 1);
        }
      }
    },
    /**
     * 批量复制配置
     */
    handleBatchCopyConfig() {
      this.batchCopyVisible = true;
      this.loadHostsForBatchCopy();
    },
    /**
     * 加载用于批量复制的主机列表
     */
    loadHostsForBatchCopy() {
      // 直接使用已经加载的host_dic数据，无需重新获取
      // host_dic在mounted时已经通过loadHostList()加载
    },
    /**
     * 执行批量复制配置
     */
    executeBatchCopy() {
      if (!this.batchCopyForm.sourceHost) {
        this.$message.warning(this.$t('page.host.batch_copy.select_source_host'));
        return;
      }
      if (this.batchCopyForm.modules.length === 0) {
        this.$message.warning(this.$t('page.host.batch_copy.select_modules'));
        return;
      }
      if (this.batchCopyForm.targetHosts.length === 0) {
        this.$message.warning(this.$t('page.host.batch_copy.select_target_hosts'));
        return;
      }

      this.batchCopyLoading = true;
      this.batchCopyProgress.visible = true;
      this.batchCopyProgress.current = 0;
      this.batchCopyProgress.total = this.batchCopyForm.targetHosts.length;
      this.batchCopyProgress.status = 'processing';
      
      // 执行批量复制
      this.performBatchCopy();
    },
    /**
     * 执行批量复制操作
     */
    async performBatchCopy() {
      const copyData = {
        sourceHost: this.batchCopyForm.sourceHost,
        modules: this.batchCopyForm.modules,
        targetHosts: this.batchCopyForm.targetHosts
      };
      
      console.log('执行批量复制:', copyData);
      
      try {
        // 逐个处理目标站点
        for (let i = 0; i < copyData.targetHosts.length; i++) {
          const targetHost = copyData.targetHosts[i];
          this.batchCopyProgress.currentHost = this.getHostDisplayName(targetHost);
          
          // 调用实际的API进行单个主机配置复制
          await this.copyConfigToHost(copyData.sourceHost, targetHost, copyData.modules);
          
          this.batchCopyProgress.current = i + 1;
          
          // 添加短暂延迟以显示进度效果
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        this.batchCopyProgress.status = 'success';
        this.$message.success(this.$t('page.host.batch_copy.copy_success'));
        
        // 2秒后关闭进度弹窗
        setTimeout(() => {
          this.closeBatchCopyProgress();
        }, 2000);
        
      } catch (error) {
        this.batchCopyProgress.status = 'error';
        this.$message.error(this.$t('page.host.batch_copy.copy_failed'));
        console.error('批量复制失败:', error);
      } finally {
        this.batchCopyLoading = false;
      }
    },
    /**
     * 复制配置到指定主机
     */
    async copyConfigToHost(sourceHost, targetHost, modules) {
      // 一次性复制所有模块到目标主机
      const requestData = {
        source_host_code: sourceHost,
        target_host_code: targetHost, // 单个目标主机
        modules              // 多个模块
      };
      
      try {
        const response = await batchCopyConfig(requestData);
        if (response.code !== 0) {
          throw new Error(response.msg || '复制失败');
        }
      } catch (error) {
        throw error;
      }
    },
    /**
     * 获取主机显示名称
     */
    getHostDisplayName(hostCode) { 
      const hostName = this.host_dic[hostCode] || "无"; 
      return hostName;
    },
    /**
     * 关闭批量复制进度弹窗
     */
    closeBatchCopyProgress() {
      this.batchCopyProgress.visible = false;
      this.batchCopyVisible = false;
      this.resetBatchCopyForm();
    }, 
    /**
     * 重置批量复制表单
     */
    resetBatchCopyForm() {
      this.batchCopyForm = {
        sourceHost: '',
        modules: ['cache'], // 重置时也要默认选中缓存模块
        targetHosts: []
      };
    },
    /**
     * 取消批量复制
     */
    cancelBatchCopy() {
      this.batchCopyVisible = false;
      this.resetBatchCopyForm();
    },
    /**
     * 全选/取消全选目标站点
     */
    toggleSelectAllTargets() {
      if (this.batchCopyForm.targetHosts.length === this.availableTargetHosts.length) {
        this.batchCopyForm.targetHosts = [];
      } else {
        this.batchCopyForm.targetHosts = [...this.availableTargetHosts.map(host => host.code)];
      }
    },
    // end method 
  }
});
</script>

<style lang="less" scoped>
@import '@/style/variables';

.payment-col {
  display: flex;

  .trend-container {
    display: flex;
    align-items: center;
    margin-left: 8px;
  }

}

.left-operation-container {
  padding: 0 0 6px 0;
  margin-bottom: 16px;

  .selected-count {
    display: inline-block;
    margin-left: 8px;
    color: var(--td-text-color-secondary);
  }

}

/* ==================== 站点态势总览（KPI） ==================== */
.host-overview {
  margin-bottom: 14px;
}

.ov-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.ov-card {
  position: relative;
  padding: 12px 14px 13px;
  overflow: hidden;
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-stroke);
  border-radius: var(--td-radius-medium, 6px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--td-brand-color);
    opacity: 0.9;
  }
}

.ov-card--success::before { background: var(--td-success-color); }
.ov-card--error::before { background: var(--td-error-color); }
.ov-card--warning::before { background: var(--td-warning-color); }
.ov-card--cyan::before { background: #0594fa; }
.ov-card--purple::before { background: #7a4bd4; }

.ov-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ov-label {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.ov-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  font-size: 14px;
  color: var(--td-brand-color);
  background: var(--td-brand-color-light);
}

.ov-card--success .ov-icon { color: var(--td-success-color); background: rgba(43, 164, 113, 0.12); }
.ov-card--error .ov-icon { color: var(--td-error-color); background: rgba(213, 73, 65, 0.12); }
.ov-card--warning .ov-icon { color: var(--td-warning-color); background: rgba(227, 115, 24, 0.12); }
.ov-card--cyan .ov-icon { color: #0594fa; background: rgba(5, 148, 250, 0.12); }
.ov-card--purple .ov-icon { color: #7a4bd4; background: rgba(122, 75, 212, 0.12); }

.ov-value {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.15;
  color: var(--td-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.ov-sub {
  margin-top: 5px;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==================== 工具栏 ==================== */
.host-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.ht-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ht-right {
  display: flex;
  align-items: center;
  margin-left: auto;
}

/* 内联表单每个 item 自带 margin-right(xxl) 和 min-width:200px：
   最后一个 item 会把「查询」按钮右边顶出一大块空白，这里两个都要清掉 */
.ht-right ::v-deep .t-form-inline .t-form__item:last-of-type {
  margin-right: 0;
  min-width: 0;
}

/* ==================== 站点单元格 ==================== */
.host-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.hc-nick {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

/* 站点列固定三行：域名 / 昵称+绑定域名 / badge */
.hc-r1,
.hc-r2,
.hc-r3 {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}

.hc-host {
  font-weight: 500;
}

/* 域名可点：默认不加下划线，hover 才提示可跳转 */
.hc-host--link {
  color: var(--td-brand-color);
  text-decoration: none;
}

.hc-host--link:hover {
  text-decoration: underline;
}

.hc-domain {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 4px;
  border-radius: 3px;
  font-size: 11px;
  color: var(--td-text-color-secondary);
  background: var(--td-bg-color-secondarycontainer, #f3f3f3);
  text-decoration: none;
}

.hc-domain:hover {
  color: var(--td-brand-color);
  text-decoration: underline;
}

/* ==================== 后端服务 ==================== */
.backend-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}

.be-line1 {
  display: flex;
  align-items: center;
  /* 地址（尤其 IPv6）过长时换行显示，而不是省略号截断 */
  flex-wrap: wrap;
  gap: 5px;
  word-break: break-all;
  white-space: normal;
}

.be-addr {
  min-width: 0;
}

/* 健康行（第二行）：图标 + 文案 + 最近检测时间 */
.be-health {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  white-space: nowrap;
}

.be-health .bh-ico {
  flex: none;
  font-size: 14px;
}

.be-health.is-ok .bh-ico,
.be-health.is-ok .bh-text {
  color: var(--td-success-color);
}

.be-health.is-bad .bh-ico,
.be-health.is-bad .bh-text {
  color: var(--td-error-color);
}

.be-health.is-unknown .bh-ico,
.be-health.is-unknown .bh-text {
  color: var(--td-text-color-placeholder);
}

.be-health .bh-time {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.mono {
  font-family: "SFMono-Regular", "Menlo", "Consolas", monospace;
  font-size: 12px;
}

/* ==================== 今日态势：迷你指标 ==================== */
.stat-cell {
  display: flex;
  flex-direction: column;
  gap: 5px;
  /* 关键：所有行都用整列宽度，指标列才会「跨行对齐」（像合并表头下的子列）。
     用 fit-content 会让每行按自身内容算宽，行与行之间列位置就会错开。 */
  width: 100%;
}

.stat-metrics {
  display: grid;
  /* 五列等宽：PV / UV / 拦截 / QPS / 流量 表头与数值上下对齐，且跨行严格对齐 */
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px 12px;
}

.sm {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}

.sm-l {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  white-space: nowrap;
}

.sm-v {
  font-size: 13px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.sm-v.danger {
  color: var(--td-error-color);
}

/* ==================== 运行状态 ==================== */
.run-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 防护主开关：盾牌 + 状态文字 + 轨道合成一块可视化控件（点一下即切换）。
   这列行高已经不矮，把主开关做大反而成了视觉重心。 */
.guard-ctl {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid var(--td-component-stroke);
  border-radius: 6px;
  background: var(--td-bg-color-container);
  cursor: pointer;
  user-select: none;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}

.guard-ctl:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.guard-ctl .gc-shield {
  flex: none;
  font-size: 18px;
  color: var(--td-text-color-placeholder);
}

.guard-ctl .gc-text {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--td-text-color-placeholder);
}

.guard-ctl .gc-track {
  position: relative;
  flex: none;
  width: 34px;
  height: 18px;
  border-radius: 9px;
  background: var(--td-bg-color-component, #d9d9d9);
  transition: background 0.2s;
}

.guard-ctl .gc-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: left 0.2s;
}

.guard-ctl.is-on {
  border-color: var(--td-success-color);
  background: rgba(43, 164, 113, 0.08);
}

.guard-ctl.is-on .gc-shield,
.guard-ctl.is-on .gc-text {
  color: var(--td-success-color);
}

.guard-ctl.is-on .gc-track {
  background: var(--td-success-color);
}

.guard-ctl.is-on .gc-knob {
  left: 18px;
}

.rs-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rs-k {
  min-width: 26px;
  flex: none;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.rs-dash {
  color: var(--td-text-color-placeholder);
}

/* ==================== 表格行首：收紧「展开 / 勾选」单元格 ====================
   t-table 的展开图标列默认 64px，且表格拉伸后会按比例放大到 90px+，
   和勾选框之间空出一大块，显得很散。这里把两列的基础宽度压小并让图标居中。 */
/* 注意：t-table 会为「吸顶表头」单独渲染一张 table，
   只覆盖 .t-table__content 会造成吸顶表头与内容列错位，所以选择器要覆盖整个 .t-table；
   但必须再限定到列表表格（.host-list-table）上：组件里还有「端口占用总览」等弹窗表格
   是就地渲染在本组件子树里的，不收窄的话它们的列也会被下面两条列宽规则压扁 */
::v-deep .host-list-table colgroup col:nth-child(1) {
  width: 30px !important;
}

::v-deep .host-list-table colgroup col:nth-child(2) {
  width: 36px !important;
}

::v-deep .host-list-table .t-table__expandable-icon-cell {
  padding: 0 !important;
}

::v-deep .host-list-table .t-table__expand-box {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ==================== 网站分组：顶部轻量文本条 ==================== */
/* 刻意不给边框和底色：上面那排动作按钮才是主，分组只是筛选维度。
   选中态用「主色文字 + 2px 下划线」而不是实心块，避免比主按钮还抢眼。 */
.host-group-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
  margin: 2px 0 6px;
}

.hg-bar-label {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  margin-right: 8px;
}

.hg-gl {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  /* 组名最长 50 字，不限宽会把「＋新建分组」「移动到分组」整个顶出可视区。
     flex: none 保证它只换行不被压缩，超出部分交给 .hg-nm 省略号，全称走 title */
  flex: none;
  max-width: 220px;
  min-width: 0;
  padding: 5px 10px 6px;
  font-size: 13px;
  color: var(--td-text-color-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;

  &:hover {
    color: var(--td-brand-color);
  }

  &.on {
    color: var(--td-brand-color);
    font-weight: 600;
    border-bottom-color: var(--td-brand-color);
  }

  .hg-nm {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  em {
    font-style: normal;
    font-size: 12px;
    color: var(--td-text-color-placeholder);
    flex: none;
  }

  &.on em {
    color: var(--td-brand-color);
  }

  &.add {
    color: var(--td-brand-color);
  }

  &.disabled {
    color: var(--td-text-color-disabled);
    cursor: not-allowed;
  }

  &:hover .hg-more {
    opacity: 0.5;
  }
}

.hg-gsep {
  width: 1px;
  height: 12px;
  background: var(--td-component-stroke);
  margin: 0 6px;
}

.hg-more {
  font-weight: 700;
  opacity: 0;
  padding: 0 2px;
  flex: none;

  &:hover {
    opacity: 1 !important;
  }
}

/* 「移动到分组」列表：并列关系，逐条左对齐 */
.assign-group-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin-top: 8px;

  ::v-deep .t-radio {
    margin: 0 !important;
  }
}

/* ==================== 操作列：编辑 / 证书申请 + 更多 ==================== */
.op-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;

  /* reset.less 给全局 a / .t-button-link 加了 margin-right，
     叠在 flex gap 上会把「更多」挤出列宽，这里必须清掉 */
  .t-button-link {
    margin-right: 0;
  }
}

.op-vline {
  width: 1px;
  height: 11px;
  background: var(--td-component-stroke);
  flex: none;
}

.op-more {
  color: var(--td-brand-color);
  cursor: pointer;
  white-space: nowrap;
}

.hg-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
  display: inline-block;
}

/* 统一所有小标签圆角：分组标签是 pill、SSL/端口/健康用的是 t-tag 默认直角，混在一起不齐 */
::v-deep .t-tag {
  border-radius: 4px;
}

.hg-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid transparent;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    border-color: currentColor;
  }

  &.none {
    background: var(--td-bg-color-component);
    color: var(--td-text-color-placeholder);
    cursor: default;

    &:hover {
      border-color: transparent;
    }
  }

  &.unknown {
    background: var(--td-bg-color-component);
    color: var(--td-text-color-placeholder);
    border: 1px dashed var(--td-component-stroke);
    cursor: default;
  }
}

.hg-color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  height: 32px;

  i {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid transparent;
    display: inline-block;

    &.on {
      border-color: var(--td-text-color-primary);
    }
  }
}

.search-input {
  width: 360px;
}

.t-button + .t-button {
  margin-left: @spacer;
}

/* 批量复制配置弹窗样式 */
.batch-copy-section {
  margin-bottom: 20px;
}

.dialog-header-host {
  margin-left: 8px;
  font-size: 14px;
  font-weight: normal;
  color: var(--td-text-color-secondary);
  word-break: break-all;
}

.batch-copy-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.module-checkboxes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.module-checkbox {
  margin: 0;
}

.target-hosts-container {
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 6px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.select-all-container {
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--td-border-level-1-color);
}

.target-hosts-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.target-host-checkbox {
  margin: 0;
}

.batch-copy-summary {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--td-border-level-1-color);
}

/* 批量复制进度弹窗样式 */
.progress-container {
  text-align: center;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-text {
  font-size: 14px;
  color: var(--td-text-color-primary);
}

.success-text {
  color: var(--td-success-color);
}

.error-text {
  color: var(--td-error-color);
}

.progress-count {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.progress-actions {
  margin-top: 16px;
}
</style>

<style lang="less">
/* 网站表单全屏：t-dialog 挂到 body 上，scoped 选择器够不着，必须写在非 scoped 块里。
   两条规则都由 .host-form-dialog-fullscreen 限定，不会影响其它弹窗。 */
.host-form-dialog-fullscreen .t-dialog {
  top: 2vh !important;
  margin-bottom: 2vh;
}
.host-form-dialog-fullscreen .t-dialog__body {
  max-height: calc(96vh - 92px) !important;
}
/* 端口占用总览：冲突端口整行标红（issue #955） */
.port-overview-conflict-row td {
  background: var(--td-error-color-1, #fdecee) !important;
}
</style>
