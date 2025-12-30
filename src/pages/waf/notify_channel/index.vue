<template>
  <div>
    <t-card class="list-card-container">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button @click="handleAdd">{{ $t('page.notify_channel.button_add') }}</t-button>
        </div>
        <div class="right-operation-container">
          <t-form ref="form" :data="searchformData" :label-width="80" layout="inline" colon :style="{ marginBottom: '8px' }">
            <t-form-item :label="$t('page.notify_channel.label_name')" name="name">
              <t-input v-model="searchformData.name" class="search-input" clearable></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.label_type')" name="type">
              <t-select v-model="searchformData.type" clearable :style="{ width: '150px' }">
                <t-option value="dingtalk" :label="$t('page.notify_channel.type_dingtalk')">
                  {{ $t('page.notify_channel.type_dingtalk') }}
                </t-option>
                <t-option value="feishu" :label="$t('page.notify_channel.type_feishu')">
                  {{ $t('page.notify_channel.type_feishu') }}
                </t-option>
                <t-option value="email" :label="$t('page.notify_channel.type_email')">
                  {{ $t('page.notify_channel.type_email') }}
                </t-option>
                <t-option value="serverchan" :label="$t('page.notify_channel.type_serverchan')">
                  {{ $t('page.notify_channel.type_serverchan') }}
                </t-option>
              </t-select>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" @click="getList">{{ $t('common.search') }}</t-button>
            </t-form-item>
          </t-form>
        </div>
      </t-row>
      <t-alert theme="info" :message="$t('page.notify_channel.alert_message')" close>
      </t-alert>
      <div class="table-container">
        <t-table :columns="columns" :data="data" :rowKey="rowKey" :verticalAlign="verticalAlign" :hover="hover"
          :pagination="pagination" :loading="dataLoading" @page-change="rehandlePageChange" @change="rehandleChange"
          :headerAffixedTop="true" :headerAffixProps="{ offsetTop: offsetTop, container: getContainer }">
          <template #type="{ row }">
            <t-tag v-if="row.type === 'dingtalk'" theme="primary">{{ $t('page.notify_channel.type_dingtalk') }}</t-tag>
            <t-tag v-else-if="row.type === 'feishu'" theme="success">{{ $t('page.notify_channel.type_feishu') }}</t-tag>
            <t-tag v-else-if="row.type === 'email'" theme="warning">{{ $t('page.notify_channel.type_email') }}</t-tag>
            <t-tag v-else-if="row.type === 'serverchan'" theme="danger">{{ $t('page.notify_channel.type_serverchan') }}</t-tag>
            <t-tag v-else theme="default">{{ row.type }}</t-tag>
          </template>
          <template #status="{ row }">
            <t-switch v-model="row.status" :customValue="[1, 0]" @change="handleStatusChange(row)"></t-switch>
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleTest(slotProps)">{{ $t('page.notify_channel.button_test') }}</a>
            <a class="t-button-link" @click="handleClickEdit(slotProps)">{{ $t('common.edit') }}</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">{{ $t('common.delete') }}</a>
          </template>
        </t-table>
      </div>
    </t-card>

    <!-- 添加对话框 -->
    <t-dialog :header="$t('common.new')" :visible.sync="addFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="120">
          <t-form-item :label="$t('page.notify_channel.label_name')" name="name">
            <t-input :style="{ width: '480px' }" v-model="formData.name" :placeholder="$t('page.notify_channel.name_placeholder')"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.notify_channel.label_type')" name="type">
            <t-select v-model="formData.type" :style="{ width: '480px' }" @change="handleTypeChange">
              <t-option value="dingtalk" :label="$t('page.notify_channel.type_dingtalk')"></t-option>
              <t-option value="feishu" :label="$t('page.notify_channel.type_feishu')"></t-option>
              <t-option value="email" :label="$t('page.notify_channel.type_email')"></t-option>
              <t-option value="serverchan" :label="$t('page.notify_channel.type_serverchan')"></t-option>
            </t-select>
          </t-form-item>
          
          <!-- 钉钉和飞书配置 -->
          <template v-if="formData.type === 'dingtalk' || formData.type === 'feishu'">
            <t-form-item :label="$t('page.notify_channel.label_webhook_url')" name="webhook_url">
              <t-input :style="{ width: '480px' }" v-model="formData.webhook_url" :placeholder="$t('page.notify_channel.webhook_placeholder')"></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.label_secret')" name="secret">
              <t-input :style="{ width: '480px' }" v-model="formData.secret" type="password" :placeholder="$t('page.notify_channel.secret_placeholder')"></t-input>
            </t-form-item>
          </template>
          
          <!-- Server酱配置 -->
          <template v-if="formData.type === 'serverchan'">
            <t-alert theme="info" :message="$t('page.notify_channel.serverchan_config_tip')" style="margin-bottom: 16px;"></t-alert>
            
            <t-form-item :label="$t('page.notify_channel.serverchan_sendkey')" name="access_token">
              <t-input :style="{ width: '480px' }" v-model="formData.access_token" :placeholder="$t('page.notify_channel.serverchan_sendkey_placeholder')"></t-input>
            </t-form-item>
            
            <t-alert theme="warning" style="margin-top: 12px;">
              <div style="line-height: 1.8;">
                <div style="font-weight: bold; margin-bottom: 8px;">📝 如何获取SendKey：</div>
                <div style="font-size: 12px; color: #666;">
                  <div>1. 访问 <a href="https://sct.ftqq.com/" target="_blank" style="color: #0052d9;">Server酱官网</a> 并使用微信扫码登录</div>
                  <div>2. 在控制台页面复制您的SendKey</div>
                  <div>3. 在"消息通道"页面配置接收通知的平台（微信、企业微信、钉钉等）</div>
                  <div style="margin-top: 8px; color: #e37318;">💡 提示：支持标准格式(SCT开头)和sctp私有部署格式</div>
                </div>
              </div>
            </t-alert>
          </template>
          
          <!-- 邮件配置 -->
          <template v-if="formData.type === 'email'">
            <t-alert theme="info" :message="$t('page.notify_channel.email_config_tip')" style="margin-bottom: 16px;"></t-alert>
            
            <!-- 常见邮箱配置参考 -->
            <t-collapse :default-value="[]" style="margin-bottom: 16px;">
              <t-collapse-panel :header="$t('page.notify_channel.email_common_config')" value="common">
                <div style="line-height: 1.8;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="padding: 10px; background: #f5f5f5; border-radius: 4px;">
                      <div style="color: #1976d2; font-weight: bold; margin-bottom: 4px;">⭐ QQ邮箱 (推荐)</div>
                      <div style="font-size: 12px; color: #666;">
                        <div>SMTP: <code>smtp.qq.com</code></div>
                        <div>端口: <code>465</code> | 加密: <strong>SSL/TLS</strong></div>
                        <div>密码: 授权码</div>
                      </div>
                    </div>
                    <div style="padding: 10px; background: #f5f5f5; border-radius: 4px;">
                      <div style="color: #1976d2; font-weight: bold; margin-bottom: 4px;">163邮箱</div>
                      <div style="font-size: 12px; color: #666;">
                        <div>SMTP: <code>smtp.163.com</code></div>
                        <div>端口: <code>465</code> | 加密: <strong>SSL/TLS</strong></div>
                        <div>密码: 授权码</div>
                      </div>
                    </div>
                    <div style="padding: 10px; background: #f5f5f5; border-radius: 4px;">
                      <div style="color: #1976d2; font-weight: bold; margin-bottom: 4px;">126邮箱</div>
                      <div style="font-size: 12px; color: #666;">
                        <div>SMTP: <code>smtp.126.com</code></div>
                        <div>端口: <code>465</code> | 加密: <strong>SSL/TLS</strong></div>
                        <div>密码: 授权码</div>
                      </div>
                    </div>
                    <div style="padding: 10px; background: #f5f5f5; border-radius: 4px;">
                      <div style="color: #1976d2; font-weight: bold; margin-bottom: 4px;">⭐ Gmail</div>
                      <div style="font-size: 12px; color: #666;">
                        <div>SMTP: <code>smtp.gmail.com</code></div>
                        <div>端口: <code>587</code> | 加密: <strong>STARTTLS</strong></div>
                        <div>密码: 应用专用密码</div>
                      </div>
                    </div>
                    <div style="padding: 10px; background: #f5f5f5; border-radius: 4px;">
                      <div style="color: #1976d2; font-weight: bold; margin-bottom: 4px;">Outlook/Hotmail</div>
                      <div style="font-size: 12px; color: #666;">
                        <div>SMTP: <code>smtp.office365.com</code></div>
                        <div>端口: <code>587</code> | 加密: <strong>STARTTLS</strong></div>
                      </div>
                    </div>
                    <div style="padding: 10px; background: #f5f5f5; border-radius: 4px;">
                      <div style="color: #1976d2; font-weight: bold; margin-bottom: 4px;">阿里云邮箱</div>
                      <div style="font-size: 12px; color: #666;">
                        <div>SMTP: <code>smtp.aliyun.com</code></div>
                        <div>端口: <code>465</code> | 加密: <strong>SSL/TLS</strong></div>
                      </div>
                    </div>
                  </div>
                  <div style="margin-top: 16px; padding: 10px; background: #fff3e0; border-left: 3px solid #ff9800; border-radius: 4px;">
                    <div style="color: #e65100; font-weight: bold; margin-bottom: 8px;">⚠️ 重要提示：</div>
                    <div style="color: #666; font-size: 12px; line-height: 1.8;">
                      <div>• 大多数邮箱需要先开启SMTP服务并生成<strong style="color: #d32f2f;">授权码</strong>（不是登录密码）</div>
                      <div>• <strong>QQ/163邮箱</strong>：网页版邮箱 → 设置 → 账户 → POP3/SMTP/IMAP → 开启服务 → 生成授权码</div>
                      <div>• <strong>Gmail</strong>：Google账户 → 安全性 → 两步验证（必须开启）→ 应用专用密码</div>
                      <div style="margin-top: 6px; color: #2196f3;">💡 推荐配置：<strong>端口465+SSL/TLS</strong> 或 <strong>端口587+STARTTLS</strong></div>
                    </div>
                  </div>
                </div>
              </t-collapse-panel>
            </t-collapse>
            
            <t-form-item :label="$t('page.notify_channel.email_smtp_host')" name="email_smtp_host">
              <t-input :style="{ width: '480px' }" v-model="formData.email_smtp_host" :placeholder="$t('page.notify_channel.email_smtp_host_placeholder')"></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.email_smtp_port')" name="email_smtp_port">
              <t-input :style="{ width: '480px' }" v-model="formData.email_smtp_port" :placeholder="$t('page.notify_channel.email_smtp_port_placeholder')"></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.email_username')" name="email_username">
              <t-input :style="{ width: '480px' }" v-model="formData.email_username" :placeholder="$t('page.notify_channel.email_username_placeholder')"></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.email_password')" name="email_password">
              <t-input :style="{ width: '480px' }" v-model="formData.email_password" type="password" :placeholder="$t('page.notify_channel.email_password_placeholder')"></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.email_from')" name="email_from">
              <t-input :style="{ width: '480px' }" v-model="formData.email_from" :placeholder="$t('page.notify_channel.email_from_placeholder')"></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.email_from_name')" name="email_from_name">
              <t-input :style="{ width: '480px' }" v-model="formData.email_from_name" :placeholder="$t('page.notify_channel.email_from_name_placeholder')"></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.email_to')" name="email_to">
              <t-input :style="{ width: '480px' }" v-model="formData.email_to" :placeholder="$t('page.notify_channel.email_to_placeholder')"></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.email_ssl_mode')" name="email_ssl_mode">
              <t-radio-group v-model="formData.email_ssl_mode">
                <t-radio value="none">{{ $t('page.notify_channel.email_ssl_none') }}</t-radio>
                <t-radio value="ssl">{{ $t('page.notify_channel.email_ssl_ssl') }}</t-radio>
                <t-radio value="starttls">{{ $t('page.notify_channel.email_ssl_starttls') }}</t-radio>
              </t-radio-group>
            </t-form-item>
          </template>
          <t-form-item :label="$t('page.notify_channel.label_status')" name="status">
            <t-radio-group v-model="formData.status">
              <t-radio :value="1">{{ $t('common.on') }}</t-radio>
              <t-radio :value="0">{{ $t('common.off') }}</t-radio>
            </t-radio-group>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formData.remarks" :rows="3"></t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 编辑对话框 -->
    <t-dialog :header="$t('common.edit')" :visible.sync="editFormVisible" :width="680" :footer="false">
      <div slot="body">
        <t-form :data="formEditData" ref="formEdit" :rules="rules" @submit="onSubmitEdit" :labelWidth="120">
          <t-form-item :label="$t('page.notify_channel.label_name')" name="name">
            <t-input :style="{ width: '480px' }" v-model="formEditData.name"></t-input>
          </t-form-item>
          <t-form-item :label="$t('page.notify_channel.label_type')" name="type">
            <t-select v-model="formEditData.type" :style="{ width: '480px' }" @change="handleEditTypeChange">
              <t-option value="dingtalk" :label="$t('page.notify_channel.type_dingtalk')"></t-option>
              <t-option value="feishu" :label="$t('page.notify_channel.type_feishu')"></t-option>
              <t-option value="email" :label="$t('page.notify_channel.type_email')"></t-option>
              <t-option value="serverchan" :label="$t('page.notify_channel.type_serverchan')"></t-option>
            </t-select>
          </t-form-item>
          
          <!-- 钉钉和飞书配置 -->
          <template v-if="formEditData.type === 'dingtalk' || formEditData.type === 'feishu'">
            <t-form-item :label="$t('page.notify_channel.label_webhook_url')" name="webhook_url">
              <t-input :style="{ width: '480px' }" v-model="formEditData.webhook_url"></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.label_secret')" name="secret">
              <t-input :style="{ width: '480px' }" v-model="formEditData.secret" type="password"></t-input>
            </t-form-item>
          </template>
          
          <!-- Server酱配置 -->
          <template v-if="formEditData.type === 'serverchan'">
            <t-alert theme="info" :message="$t('page.notify_channel.serverchan_config_tip')" style="margin-bottom: 16px;"></t-alert>
            
            <t-form-item :label="$t('page.notify_channel.serverchan_sendkey')" name="access_token">
              <t-input :style="{ width: '480px' }" v-model="formEditData.access_token" :placeholder="$t('page.notify_channel.serverchan_sendkey_placeholder')"></t-input>
            </t-form-item>
            
            <t-alert theme="warning" style="margin-top: 12px;">
              <div style="line-height: 1.8;">
                <div style="font-weight: bold; margin-bottom: 8px;">📝 如何获取SendKey：</div>
                <div style="font-size: 12px; color: #666;">
                  <div>1. 访问 <a href="https://sct.ftqq.com/" target="_blank" style="color: #0052d9;">Server酱官网</a> 并使用微信扫码登录</div>
                  <div>2. 在控制台页面复制您的SendKey</div>
                  <div>3. 在"消息通道"页面配置接收通知的平台（微信、企业微信、钉钉等）</div>
                  <div style="margin-top: 8px; color: #e37318;">💡 提示：支持标准格式(SCT开头)和sctp私有部署格式</div>
                </div>
              </div>
            </t-alert>
          </template>
          
          <!-- 邮件配置 -->
          <template v-if="formEditData.type === 'email'">
            <t-alert theme="info" :message="$t('page.notify_channel.email_config_tip')" style="margin-bottom: 16px;"></t-alert>
            
            <!-- 常见邮箱配置参考 -->
            <t-collapse :default-value="[]" style="margin-bottom: 16px;">
              <t-collapse-panel :header="$t('page.notify_channel.email_common_config')" value="common">
                <div style="line-height: 1.8;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="padding: 10px; background: #f5f5f5; border-radius: 4px;">
                      <div style="color: #1976d2; font-weight: bold; margin-bottom: 4px;">⭐ QQ邮箱 (推荐)</div>
                      <div style="font-size: 12px; color: #666;">
                        <div>SMTP: <code>smtp.qq.com</code></div>
                        <div>端口: <code>465</code> | 加密: <strong>SSL/TLS</strong></div>
                        <div>密码: 授权码</div>
                      </div>
                    </div>
                    <div style="padding: 10px; background: #f5f5f5; border-radius: 4px;">
                      <div style="color: #1976d2; font-weight: bold; margin-bottom: 4px;">163邮箱</div>
                      <div style="font-size: 12px; color: #666;">
                        <div>SMTP: <code>smtp.163.com</code></div>
                        <div>端口: <code>465</code> | 加密: <strong>SSL/TLS</strong></div>
                        <div>密码: 授权码</div>
                      </div>
                    </div>
                    <div style="padding: 10px; background: #f5f5f5; border-radius: 4px;">
                      <div style="color: #1976d2; font-weight: bold; margin-bottom: 4px;">126邮箱</div>
                      <div style="font-size: 12px; color: #666;">
                        <div>SMTP: <code>smtp.126.com</code></div>
                        <div>端口: <code>465</code> | 加密: <strong>SSL/TLS</strong></div>
                        <div>密码: 授权码</div>
                      </div>
                    </div>
                    <div style="padding: 10px; background: #f5f5f5; border-radius: 4px;">
                      <div style="color: #1976d2; font-weight: bold; margin-bottom: 4px;">⭐ Gmail</div>
                      <div style="font-size: 12px; color: #666;">
                        <div>SMTP: <code>smtp.gmail.com</code></div>
                        <div>端口: <code>587</code> | 加密: <strong>STARTTLS</strong></div>
                        <div>密码: 应用专用密码</div>
                      </div>
                    </div>
                    <div style="padding: 10px; background: #f5f5f5; border-radius: 4px;">
                      <div style="color: #1976d2; font-weight: bold; margin-bottom: 4px;">Outlook/Hotmail</div>
                      <div style="font-size: 12px; color: #666;">
                        <div>SMTP: <code>smtp.office365.com</code></div>
                        <div>端口: <code>587</code> | 加密: <strong>STARTTLS</strong></div>
                      </div>
                    </div>
                    <div style="padding: 10px; background: #f5f5f5; border-radius: 4px;">
                      <div style="color: #1976d2; font-weight: bold; margin-bottom: 4px;">阿里云邮箱</div>
                      <div style="font-size: 12px; color: #666;">
                        <div>SMTP: <code>smtp.aliyun.com</code></div>
                        <div>端口: <code>465</code> | 加密: <strong>SSL/TLS</strong></div>
                      </div>
                    </div>
                  </div>
                  <div style="margin-top: 16px; padding: 10px; background: #fff3e0; border-left: 3px solid #ff9800; border-radius: 4px;">
                    <div style="color: #e65100; font-weight: bold; margin-bottom: 8px;">⚠️ 重要提示：</div>
                    <div style="color: #666; font-size: 12px; line-height: 1.8;">
                      <div>• 大多数邮箱需要先开启SMTP服务并生成<strong style="color: #d32f2f;">授权码</strong>（不是登录密码）</div>
                      <div>• <strong>QQ/163邮箱</strong>：网页版邮箱 → 设置 → 账户 → POP3/SMTP/IMAP → 开启服务 → 生成授权码</div>
                      <div>• <strong>Gmail</strong>：Google账户 → 安全性 → 两步验证（必须开启）→ 应用专用密码</div>
                      <div style="margin-top: 6px; color: #2196f3;">💡 推荐配置：<strong>端口465+SSL/TLS</strong> 或 <strong>端口587+STARTTLS</strong></div>
                    </div>
                  </div>
                </div>
              </t-collapse-panel>
            </t-collapse>
            
            <t-form-item :label="$t('page.notify_channel.email_smtp_host')" name="email_smtp_host">
              <t-input :style="{ width: '480px' }" v-model="formEditData.email_smtp_host"></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.email_smtp_port')" name="email_smtp_port">
              <t-input :style="{ width: '480px' }" v-model="formEditData.email_smtp_port"></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.email_username')" name="email_username">
              <t-input :style="{ width: '480px' }" v-model="formEditData.email_username"></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.email_password')" name="email_password">
              <t-input :style="{ width: '480px' }" v-model="formEditData.email_password" type="password"></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.email_from')" name="email_from">
              <t-input :style="{ width: '480px' }" v-model="formEditData.email_from"></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.email_from_name')" name="email_from_name">
              <t-input :style="{ width: '480px' }" v-model="formEditData.email_from_name"></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.email_to')" name="email_to">
              <t-input :style="{ width: '480px' }" v-model="formEditData.email_to"></t-input>
            </t-form-item>
            <t-form-item :label="$t('page.notify_channel.email_ssl_mode')" name="email_ssl_mode">
              <t-radio-group v-model="formEditData.email_ssl_mode">
                <t-radio value="none">{{ $t('page.notify_channel.email_ssl_none') }}</t-radio>
                <t-radio value="ssl">{{ $t('page.notify_channel.email_ssl_ssl') }}</t-radio>
                <t-radio value="starttls">{{ $t('page.notify_channel.email_ssl_starttls') }}</t-radio>
              </t-radio-group>
            </t-form-item>
          </template>
          <t-form-item :label="$t('page.notify_channel.label_status')" name="status">
            <t-radio-group v-model="formEditData.status">
              <t-radio :value="1">{{ $t('common.on') }}</t-radio>
              <t-radio :value="0">{{ $t('common.off') }}</t-radio>
            </t-radio-group>
          </t-form-item>
          <t-form-item :label="$t('common.remarks')" name="remarks">
            <t-textarea :style="{ width: '480px' }" v-model="formEditData.remarks" :rows="3"></t-textarea>
          </t-form-item>
          <t-form-item style="float: right">
            <t-button variant="outline" @click="onClickCloseEditBtn">{{ $t('common.close') }}</t-button>
            <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 删除确认对话框 -->
    <t-dialog :header="$t('common.confirm_delete')" :body="confirmBody" :visible.sync="confirmVisible" @confirm="onConfirmDelete" :onCancel="onCancel">
    </t-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { MessagePlugin } from 'tdesign-vue';
import {
  getNotifyChannelList,
  addNotifyChannel,
  editNotifyChannel,
  deleteNotifyChannel,
  testNotifyChannel,
} from '@/apis/notify_channel';

const INITIAL_DATA = {
  name: '',
  type: 'dingtalk',
  webhook_url: '',
  secret: '',
  access_token: '',
  config_json: '',
  status: 1,
  remarks: '',
  // 邮件配置字段
  email_smtp_host: '',
  email_smtp_port: '25',
  email_username: '',
  email_password: '',
  email_from: '',
  email_from_name: '',
  email_to: '',
  email_ssl_mode: 'none',
};

export default Vue.extend({
  name: 'NotifyChannel',
  data() {
    return {
      data: [],
      dataLoading: false,
      value: 'first',
      columns: [
        { colKey: 'row-select', type: 'multiple', width: 50, fixed: 'left' },
        { title: this.$t('page.notify_channel.label_name'), colKey: 'name', width: 150 },
        { title: this.$t('page.notify_channel.label_type'), colKey: 'type', width: 120 },
        { title: this.$t('page.notify_channel.label_webhook_url'), colKey: 'webhook_url', ellipsis: true },
        { title: this.$t('page.notify_channel.label_status'), colKey: 'status', width: 100 },
        { title: this.$t('common.remarks'), colKey: 'remarks', ellipsis: true, width: 200 },
        { title: this.$t('common.create_time'), colKey: 'create_time', width: 180 },
        {
          align: 'left',
          fixed: 'right',
          width: 200,
          colKey: 'op',
          title: this.$t('common.op'),
        },
      ],
      rowKey: 'id',
      verticalAlign: 'top',
      hover: true,
      pagination: {
        pageSize: 20,
        total: 0,
        current: 1,
      },
      searchformData: {
        pageIndex: 1,
        pageSize: 20,
        name: '',
        type: '',
      },
      formData: { ...INITIAL_DATA },
      formEditData: { ...INITIAL_DATA },
      rules: {
        name: [{ required: true, message: this.$t('common.required'), type: 'error' }],
        type: [{ required: true, message: this.$t('common.required'), type: 'error' }],
        webhook_url: [{ required: true, message: this.$t('common.required'), type: 'error' }],
      },
      addFormVisible: false,
      editFormVisible: false,
      confirmVisible: false,
      confirmBody: '',
      offsetTop: 0,
    };
  },
  computed: {},
  mounted() {
    this.getList();
  },
  methods: {
    getContainer() {
      return document.querySelector('.tdesign-starter-main');
    },
    async getList() {
      this.dataLoading = true;
      try {
        const res = await getNotifyChannelList(this.searchformData);
        if (res.code === 0) {
          this.data = res.data.list || [];
          this.pagination.total = res.data.total;
          this.pagination.current = this.searchformData.pageIndex;
          this.pagination.pageSize = this.searchformData.pageSize;
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.dataLoading = false;
      }
    },
    rehandlePageChange(pageInfo: any) {
      this.searchformData.pageIndex = pageInfo.current;
      this.searchformData.pageSize = pageInfo.pageSize;
      this.getList();
    },
    rehandleChange(changeParams: any, triggerAndData: any) {
      console.log('统一Change', changeParams, triggerAndData);
    },
    handleAdd() {
      this.formData = { ...INITIAL_DATA };
      this.addFormVisible = true;
    },
    handleClickEdit(e: any) {
      const row = { ...e.row };
      // 如果是邮件类型，解析config_json
      if (row.type === 'email' && row.config_json) {
        try {
          const config = JSON.parse(row.config_json);
          row.email_smtp_host = config.smtp_host || '';
          row.email_smtp_port = config.smtp_port || '25';
          row.email_username = config.username || '';
          row.email_password = config.password || '';
          row.email_from = config.from_email || '';
          row.email_from_name = config.from_name || '';
          row.email_to = (config.to_emails || []).join(',');
          row.email_ssl_mode = config.enable_ssl ? 'ssl' : (config.enable_starttls ? 'starttls' : 'none');
        } catch (e) {
          console.error('解析邮件配置失败', e);
        }
      }
      this.formEditData = row;
      this.editFormVisible = true;
    },
    handleClickDelete(e: any) {
      this.formEditData = { ...e.row };
      this.confirmBody = this.$t('page.notify_channel.delete_confirm');
      this.confirmVisible = true;
    },
    async handleTest(e: any) {
      try {
        const res = await testNotifyChannel({ id: e.row.id });
        if (res.code === 0) {
          MessagePlugin.success(this.$t('page.notify_channel.test_success'));
        } else {
          MessagePlugin.error(this.$t('page.notify_channel.test_failed') + ': ' + res.msg);
        }
      } catch (error) {
        MessagePlugin.error(this.$t('page.notify_channel.test_failed'));
      }
    },
    async handleStatusChange(row: any) {
      try {
        const res = await editNotifyChannel(row);
        if (res.code === 0) {
          MessagePlugin.success(this.$t('common.tips.save_success'));
        } else {
          row.status = row.status === 1 ? 0 : 1;
          MessagePlugin.error(this.$t('common.tips.save_failed'));
        }
      } catch (error) {
        row.status = row.status === 1 ? 0 : 1;
        MessagePlugin.error(this.$t('common.tips.save_failed'));
      }
    },
    async onSubmit({ validateResult, firstError }: any) {
      if (validateResult === true) {
        try {
          const submitData = { ...this.formData };
          // 如果是邮件类型，构建config_json
          if (submitData.type === 'email') {
            const emailConfig = {
              smtp_host: submitData.email_smtp_host,
              smtp_port: submitData.email_smtp_port,
              username: submitData.email_username,
              password: submitData.email_password,
              from_email: submitData.email_from,
              from_name: submitData.email_from_name,
              to_emails: submitData.email_to.split(',').map((email: string) => email.trim()),
              enable_ssl: submitData.email_ssl_mode === 'ssl',
              enable_starttls: submitData.email_ssl_mode === 'starttls',
            };
            submitData.config_json = JSON.stringify(emailConfig);
            // 清空webhook_url和secret字段
            submitData.webhook_url = '';
            submitData.secret = '';
          } else if (submitData.type === 'serverchan') {
            // Server酱使用access_token存储SendKey
            // 清空webhook_url和secret字段
            submitData.webhook_url = '';
            submitData.secret = '';
            submitData.config_json = '';
          }
          const res = await addNotifyChannel(submitData);
          if (res.code === 0) {
            MessagePlugin.success(this.$t('page.notify_channel.add_success'));
            this.addFormVisible = false;
            this.getList();
          } else {
            MessagePlugin.error(res.msg || this.$t('page.notify_channel.add_failed'));
          }
        } catch (error) {
          MessagePlugin.error(this.$t('page.notify_channel.add_failed'));
        }
      } else {
        MessagePlugin.warning(firstError);
      }
    },
    async onSubmitEdit({ validateResult, firstError }: any) {
      if (validateResult === true) {
        try {
          const submitData = { ...this.formEditData };
          // 如果是邮件类型，构建config_json
          if (submitData.type === 'email') {
            const emailConfig = {
              smtp_host: submitData.email_smtp_host,
              smtp_port: submitData.email_smtp_port,
              username: submitData.email_username,
              password: submitData.email_password,
              from_email: submitData.email_from,
              from_name: submitData.email_from_name,
              to_emails: submitData.email_to.split(',').map((email: string) => email.trim()),
              enable_ssl: submitData.email_ssl_mode === 'ssl',
              enable_starttls: submitData.email_ssl_mode === 'starttls',
            };
            submitData.config_json = JSON.stringify(emailConfig);
            // 清空webhook_url和secret字段
            submitData.webhook_url = '';
            submitData.secret = '';
          } else if (submitData.type === 'serverchan') {
            // Server酱使用access_token存储SendKey
            // 清空webhook_url和secret字段
            submitData.webhook_url = '';
            submitData.secret = '';
            submitData.config_json = '';
          }
          const res = await editNotifyChannel(submitData);
          if (res.code === 0) {
            MessagePlugin.success(this.$t('page.notify_channel.edit_success'));
            this.editFormVisible = false;
            this.getList();
          } else {
            MessagePlugin.error(res.msg || this.$t('page.notify_channel.edit_failed'));
          }
        } catch (error) {
          MessagePlugin.error(this.$t('page.notify_channel.edit_failed'));
        }
      } else {
        MessagePlugin.warning(firstError);
      }
    },
    async onConfirmDelete() {
      try {
        const res = await deleteNotifyChannel({ id: this.formEditData.id });
        if (res.code === 0) {
          MessagePlugin.success(this.$t('page.notify_channel.delete_success'));
          this.confirmVisible = false;
          this.getList();
        } else {
          MessagePlugin.error(res.msg || this.$t('page.notify_channel.delete_failed'));
        }
      } catch (error) {
        MessagePlugin.error(this.$t('page.notify_channel.delete_failed'));
      }
    },
    onCancel() {
      this.confirmVisible = false;
    },
    onClickCloseBtn() {
      this.addFormVisible = false;
    },
    onClickCloseEditBtn() {
      this.editFormVisible = false;
    },
    handleTypeChange(value: string) {
      // 切换类型时清空相关字段
      if (value === 'email') {
        this.formData.webhook_url = '';
        this.formData.secret = '';
        this.formData.access_token = '';
      } else if (value === 'serverchan') {
        this.formData.webhook_url = '';
        this.formData.secret = '';
        this.formData.email_smtp_host = '';
        this.formData.email_smtp_port = '25';
        this.formData.email_username = '';
        this.formData.email_password = '';
        this.formData.email_from = '';
        this.formData.email_from_name = '';
        this.formData.email_to = '';
        this.formData.email_ssl_mode = 'none';
      } else {
        this.formData.access_token = '';
        this.formData.email_smtp_host = '';
        this.formData.email_smtp_port = '25';
        this.formData.email_username = '';
        this.formData.email_password = '';
        this.formData.email_from = '';
        this.formData.email_from_name = '';
        this.formData.email_to = '';
        this.formData.email_ssl_mode = 'none';
      }
    },
    handleEditTypeChange(value: string) {
      // 切换类型时清空相关字段
      if (value === 'email') {
        this.formEditData.webhook_url = '';
        this.formEditData.secret = '';
        this.formEditData.access_token = '';
      } else if (value === 'serverchan') {
        this.formEditData.webhook_url = '';
        this.formEditData.secret = '';
        this.formEditData.email_smtp_host = '';
        this.formEditData.email_smtp_port = '25';
        this.formEditData.email_username = '';
        this.formEditData.email_password = '';
        this.formEditData.email_from = '';
        this.formEditData.email_from_name = '';
        this.formEditData.email_to = '';
        this.formEditData.email_ssl_mode = 'none';
      } else {
        this.formEditData.access_token = '';
        this.formEditData.email_smtp_host = '';
        this.formEditData.email_smtp_port = '25';
        this.formEditData.email_username = '';
        this.formEditData.email_password = '';
        this.formEditData.email_from = '';
        this.formEditData.email_from_name = '';
        this.formEditData.email_to = '';
        this.formEditData.email_ssl_mode = 'none';
      }
    },
  },
});
</script>

<style lang="less" scoped>
.list-card-container {
  padding: 16px;
}

.table-container {
  margin-top: 16px;
}

.search-input {
  width: 200px;
}

.left-operation-container {
  .t-button {
    margin-right: 8px;
  }
}
</style>




