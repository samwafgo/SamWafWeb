/**
 * 通用 Webhook 渠道的平台预设（issue #693）
 *
 * 只是「一键把报文模板填进表单」，不代表 SamWaf 会主动访问这些平台：
 * URL 必须由用户自己填写，预设里给的是格式示例。
 */

export const WEBHOOK_MAX_HEADERS = 20; // 与后端 wafnotify/webhook.MaxHeaders 保持一致

export interface WebhookPreset {
  value: string;
  labelKey: string;
  method: string;
  contentType: string;
  headers: Array<{ key: string; value: string }>;
  bodyTemplate: string;
  urlPlaceholder?: string;
  hintKey?: string;
}

export const WEBHOOK_PRESETS: WebhookPreset[] = [
  {
    value: 'custom',
    labelKey: 'page.notify_channel.webhook_preset_custom',
    method: 'POST',
    contentType: 'application/json',
    headers: [],
    bodyTemplate: '',
  },
  {
    value: 'json',
    labelKey: 'page.notify_channel.webhook_preset_json',
    method: 'POST',
    contentType: 'application/json',
    headers: [],
    bodyTemplate:
      '{\n  "title": "{{.Title}}",\n  "content": "{{.Content}}",\n  "time": "{{.Time}}",\n  "severity": "{{.Severity}}",\n  "message_type": "{{.MessageType}}",\n  "server_name": "{{.ServerName}}"\n}',
  },
  {
    value: 'slack',
    labelKey: 'page.notify_channel.webhook_preset_slack',
    method: 'POST',
    contentType: 'application/json',
    headers: [],
    bodyTemplate: '{\n  "text": "*{{.Title}}*\\n{{.Content}}"\n}',
    urlPlaceholder: 'https://hooks.slack.com/services/XXX/YYY/ZZZ',
    hintKey: 'page.notify_channel.webhook_hint_slack',
  },
  {
    value: 'discord',
    labelKey: 'page.notify_channel.webhook_preset_discord',
    method: 'POST',
    contentType: 'application/json',
    headers: [],
    bodyTemplate: '{\n  "content": "**{{.Title}}**\\n{{.Content}}"\n}',
    urlPlaceholder: 'https://discord.com/api/webhooks/XXX/YYY',
    hintKey: 'page.notify_channel.webhook_hint_discord',
  },
  {
    value: 'telegram',
    labelKey: 'page.notify_channel.webhook_preset_telegram',
    method: 'POST',
    contentType: 'application/json',
    headers: [],
    bodyTemplate: '{\n  "chat_id": "替换为你的ChatID",\n  "text": "{{.Title}}\\n\\n{{.Content}}"\n}',
    urlPlaceholder: 'https://api.telegram.org/bot<BotToken>/sendMessage',
    hintKey: 'page.notify_channel.webhook_hint_telegram',
  },
  {
    value: 'bark',
    labelKey: 'page.notify_channel.webhook_preset_bark',
    method: 'POST',
    contentType: 'application/json',
    headers: [],
    bodyTemplate: '{\n  "title": "{{.Title}}",\n  "body": "{{.Content}}",\n  "group": "SamWaf"\n}',
    urlPlaceholder: 'https://api.day.app/<你的Key>',
    hintKey: 'page.notify_channel.webhook_hint_bark',
  },
  {
    value: 'ntfy',
    labelKey: 'page.notify_channel.webhook_preset_ntfy',
    method: 'POST',
    contentType: 'text/plain',
    headers: [
      { key: 'X-Title', value: 'SamWaf Alert' },
      { key: 'X-Priority', value: '4' },
    ],
    bodyTemplate: '{{.Title}}\n\n{{.Content}}',
    urlPlaceholder: 'https://ntfy.sh/<你的主题>',
    hintKey: 'page.notify_channel.webhook_hint_ntfy',
  },
  {
    value: 'gotify',
    labelKey: 'page.notify_channel.webhook_preset_gotify',
    method: 'POST',
    contentType: 'application/json',
    headers: [],
    bodyTemplate: '{\n  "title": "{{.Title}}",\n  "message": "{{.Content}}",\n  "priority": 5\n}',
    urlPlaceholder: 'https://gotify.example.com/message?token=<AppToken>',
    hintKey: 'page.notify_channel.webhook_hint_gotify',
  },
];
