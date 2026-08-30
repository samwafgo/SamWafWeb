<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAddHost"> {{ $t('page.host.new_protection') }}</t-button>
          <t-button variant="base" theme="default" @click="HandleExportExcel()"> {{ $t('page.host.export_data') }}</t-button>
          <t-button variant="base" theme="default" @click="HandleImportExcel()"> {{ $t('page.host.import_data') }}</t-button>
          <t-button variant="base" theme="warning" @click="handleModifyAllGuardStatus()"> {{ $t('page.host.modify_all_guard_status') }}</t-button>
          <t-button variant="base" theme="primary" @click="handleBatchCopyConfig()"> {{ $t('page.host.batch_copy_config') }}</t-button>
          <t-button variant="base" theme="success" @click="handleImportNginx()"> {{ $t('page.host.import_nginx') }}</t-button>
          <t-button variant="base" theme="default" @click="handlePortOverview()"> {{ $t('page.host.port_listen.overview_title') }}</t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="80" colon   layout="inline" :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.host.website')" name="code">
              <t-select v-model="searchformData.code" clearable filterable :style="{ width: '200px' }">
                <t-option v-for="(item, index) in host_dic" :value="index" :label="item" :key="index">
                  {{ item }}
                </t-option>
              </t-select>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" :style="{ marginLeft: '8px' }" @click="getList('all')">
                {{ $t('common.search') }}
              </t-button>
            </t-form-item>
          </t-form>

        </div>
      </t-row>

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
        <t-table :columns="columns" size="small" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign"
                 :hover="hover" :pagination="pagination" :selected-row-keys="selectedRowKeys" :loading="dataLoading"
                 @page-change="rehandlePageChange" @change="rehandleChange" @select-change="rehandleSelectChange"  @sort-change="onSortChange"
                 @filter-change="onFilterChange"
                 :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">
          <template #healthy_status="{ row }">
            <health-status
              v-if="row.global_host!==1"
              :healthyStatus="row.healthy_status"
              :isLoadBalance="row.is_enable_load_balance === '1' || row.is_enable_load_balance === 1"
            />
          </template>
          <template #host="{ row }">
            <div>
              <div v-if="row.nickname" style="color:#888;font-size:12px;margin-bottom:2px;">{{ row.nickname }}</div>
              <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;">
                <span :title="row.host" style="font-weight:500;">{{ row.host }}</span>
                <t-tag v-if="row.ssl === SSL_STATUS.SSL" theme="success" variant="light" size="small" :title="$t('page.host.ssl_yes')">SSL</t-tag>
              </div>
              <div v-if="row.bind_more_host && row.bind_more_host.trim()" style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;">
                <t-tag
                  v-for="(domain, i) in row.bind_more_host.split('\n').map(s=>s.trim()).filter(Boolean)"
                  :key="i"
                  theme="default"
                  variant="light"
                  size="small"
                  :title="domain"
                  style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                >{{ domain }}</t-tag>
              </div>
            </div>
          </template>
          <template #port="{ row }">
            <div style="display:flex;align-items:center;flex-wrap:wrap;gap:3px;">
              <!-- 有 resolved_listens 时按「端口·协议」展示（含冲突红标，issue #955），否则退回老展示 -->
              <template v-if="Array.isArray(row.resolved_listens) && row.resolved_listens.length > 0">
                <t-tag
                  v-for="(l, i) in row.resolved_listens.filter(x => !x.implied)"
                  :key="'rl' + i"
                  :theme="row.port_conflict ? 'danger' : (l.proto === 'https' ? 'success' : 'primary')"
                  variant="light"
                  size="small"
                  :title="l.port + ' · ' + l.proto.toUpperCase() + (l.ipv && l.ipv !== 'both' ? ' · ' + l.ipv : '')"
                >{{ l.port }}·{{ l.proto === 'https' ? 'HTTPS' : 'HTTP' }}</t-tag>
                <t-tooltip v-if="row.port_conflict" :content="$t('page.host.port_listen.conflict_tip')" placement="top">
                  <t-tag theme="danger" size="small">{{ $t('page.host.port_listen.conflict') }}</t-tag>
                </t-tooltip>
              </template>
              <template v-else>
                <span style="font-weight:500;min-width:36px;">{{ row.port }}</span>
                <template v-if="row.bind_more_port && row.bind_more_port.trim()">
                  <t-tag
                    v-for="(p, i) in row.bind_more_port.split(',').map(s=>s.trim()).filter(Boolean)"
                    :key="i"
                    theme="primary"
                    variant="light"
                    size="small"
                    :title="p"
                  >{{ p }}</t-tag>
                </template>
              </template>
            </div>
          </template>
          <template #group_code="{ row }">
            <!-- 全局网站不参与分组；组名/颜色由 hostgroup/all 的字典映射，映射不到即「未知分组」（跨实例导入的常见情形） -->
            <span v-if="row.global_host === 1" style="color: var(--td-text-color-placeholder);">—</span>
            <span v-else-if="!row.group_code" class="hg-tag none">{{ $t('page.host.group.ungrouped') }}</span>
            <span v-else-if="!groupDict[row.group_code]" class="hg-tag unknown"
                  :title="$t('page.host.group.unknown_group_tip')">{{ $t('page.host.group.unknown_group') }}</span>
            <span v-else class="hg-tag"
                  :style="{ background: hexToSoft(groupDict[row.group_code].color), color: groupDict[row.group_code].color }"
                  @click="pickGroup(row.group_code)">
              <i class="hg-dot" :style="{ background: groupDict[row.group_code].color }"></i>{{ groupDict[row.group_code].group_name }}
            </span>
          </template>
          <template #data_stats="{ row }">
            <div style="line-height: 1.8;">
              <div>
                <span>{{ $t('page.host.today_pv_short') }}: {{ row.today_pv_count || 0 }}</span>
                <span style="margin-left: 8px;">{{ $t('page.host.today_uv_short') }}: {{ row.today_uv_count || 0 }}</span>
                <span style="margin-left: 8px;">{{ $t('page.host.today_attack_short') }}: {{ row.today_attack_count || 0 }}</span>
              </div>
              <div>
                <span>{{ $t('page.host.today_traffic_in_short') }}: {{ formatTrafficBytes(row.today_traffic_in || 0) }}</span>
                <span style="margin-left: 8px;">{{ $t('page.host.today_traffic_out_short') }}: {{ formatTrafficBytes(row.today_traffic_out || 0) }}</span>
              </div>
              <div>
                <span :title="$t('page.host.real_qps')">{{ $t('page.host.real_qps_short') }}: {{ row.real_time_qps }}</span>
                <span :title="$t('page.host.real_active')" style="margin-left: 8px;">{{ $t('page.host.real_active_short') }}: {{ row.real_time_connect_cnt }}</span>
              </div>
            </div>
          </template>
          <template #status_switches="{ row }">
            <div style="display: flex; flex-direction: column; gap: 8px; justify-content: center;">
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span style="font-size: 12px; color: var(--td-text-color-secondary); margin-right: 8px;">{{ $t('page.host.healthy_status') }}:</span>
                <health-status
                  v-if="row.global_host!==1"
                  :healthyStatus="row.healthy_status"
                  :isLoadBalance="row.is_enable_load_balance === '1' || row.is_enable_load_balance === 1"
                />
                <span v-else style="font-size: 12px; color: var(--td-text-color-secondary);">-</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span style="font-size: 12px; color: var(--td-text-color-secondary); margin-right: 8px;">{{ $t('page.host.guard_status') }}:</span>
                <t-switch size="small" v-model="row.guard_status ===1" :label="[$t('page.host.guard_status_on'), $t('page.host.guard_status_off')]"
                          @change="changeGuardStatus($event,row)">
                </t-switch>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span style="font-size: 12px; color: var(--td-text-color-secondary); margin-right: 8px;">{{ $t('page.host.start_status') }}:</span>
                <t-switch size="small" v-model="row.start_status===0" :label="[$t('page.host.auto_start_on'), $t('page.host.auto_start_off')]"
                          @change="changeStartStatus($event,row)">
                </t-switch>
              </div>
              <div v-if="row.global_host!==1 && isStaticSiteEnabled(row)" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span style="font-size: 12px; color: var(--td-text-color-secondary); margin-right: 8px;">{{ $t('page.host.static_service_label') }}:</span>
                <t-tag theme="success" variant="light" size="small">{{ $t('page.host.static_service_label_on') }}</t-tag>
              </div>
              <div v-if="row.global_host!==1 && (row.unrestricted_port === 0 || row.unrestricted_port === '0')" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span style="font-size: 12px; color: var(--td-text-color-secondary); margin-right: 8px;">{{ $t('page.host.unrestricted_port.label_unrestricted_port_is_enable') }}:</span>
                <t-tag theme="success" variant="light" size="small">{{ $t('page.host.unrestricted_port.label_unrestricted_port_is_enable_on') }}</t-tag>
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
import {FileSafetyIcon, LinkIcon, SearchIcon} from 'tdesign-icons-vue';
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
import HealthStatus from "./components/health-status/HealthStatus.vue";
import HostForm from './components/HostForm.vue';

// 导入初始化常量
import { INITIAL_DATA,  INITIAL_HEALTHY, INITIAL_CAPTCHA } from './constants';

export default Vue.extend({
  name: 'ListBase',
  components: {
    SearchIcon,
    FileSafetyIcon,
    LinkIcon,
    SslOrderList,
    LoadBalance,
    HttpAuthBase,
    HealthStatus,
    HostForm,
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
          width: 180,
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
          title: this.$t('page.host.port'),
          width: 140,
          colKey: 'port',
          cell: 'port',
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
          title: this.$t('page.host.group.column'),
          width: 100,
          ellipsis: true,
          colKey: 'group_code',
          cell: 'group_code'
        },
        {
          title: this.$t('page.host.stats_info'),
          colKey: 'data_stats',
          width: 260,
          cell: 'data_stats'
        },
        {
          title: this.$t('common.status'),
          colKey: 'status_switches',
          width: 150,
          cell: 'status_switches'
        },
        {
          title: this.$t('page.host.remote_ip'),
          width: 100,
          ellipsis: true,
          colKey: 'remote_ip',
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
          title: this.$t('page.host.remote_port'),
          width: 100,
          ellipsis: true,
          colKey: 'remote_port',
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
          title: this.$t('common.remarks'),
          width: 100,
          ellipsis: true,
          colKey: 'remarks',
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
          title: this.$t('common.create_time'),
          width: 200,
          ellipsis: true,
          colKey: 'create_time',
          sorter: true
        },
        {
          align: 'left',
          width: 180,
          colKey: 'op',
          title: this.$t('common.op'),
          // 吸附右侧：表格总列宽 ~1600px，窄屏必然横向滚动，
          // 不固定的话操作列会被推出可视区，得先把表格拖到底才点得到
          fixed: 'right',
        },
      ],
      rowKey: 'code',
      tableLayout: 'auto',
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
    // 从访问日志「IP提取有问题?」跳过来：直接打开该站点编辑弹窗，并定位到「其他配置」
    if (this.$route.query && this.$route.query.editcode) {
      const editCode = String(this.$route.query.editcode);
      this.editInitTab = this.$route.query.tab === 'ipsource' ? 4 : 1;
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
      hostlist({
        pageSize: that.pagination.pageSize,
        pageIndex: that.pagination.current,
        sort_by: that.sorts.sortBy,
        sort_descending,
        filter_by:that.filters.filter_by,
        filter_value:that.filters.filter_value,
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
     * 筛选结果
     */
    onFilterChange(e){
      const filters = [];


      if (e.host) {
        filters.push({ by: "host", value: e.host });
      }
      if (e.port) {
        filters.push({ by: "port", value: e.port });
      }

      if (e.remote_ip) {
        filters.push({ by: "remote_ip", value: e.remote_ip });
      }
      if (e.remote_port) {
        filters.push({ by: "remote_port", value: e.remote_port });
      }
      if (e.remarks) {
        filters.push({ by: "remarks", value: e.remarks });
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

.hg-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px;
  border-radius: 11px;
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
