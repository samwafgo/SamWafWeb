// 主机配置初始化数据
export const INITIAL_DATA = {
  host: 'www.baidu.com',
  port: 80,
  remote_host: 'http://www.baidu.com',
  remote_ip: '127.0.0.1',
  remote_port: 81,
  ssl: '0',
  remote_system: "默认",
  remote_app: "默认",
  guard_status: '',
  remarks: '',
  defense_json: '{"bot":1,"sqli":1,"xss":1,"scan":1,"rce":1,"sensitive":1,"traversal":1,"owaspset":0}',
  healthy_json: '{"is_enable_healthy":1,"fail_count":3,"success_count":3,"response_time":60,"check_method":"GET","check_path":"/","expected_codes":"200,"}',
  captcha_json: '{"is_enable_captcha":0,"exclude_urls":[],"expire_time":24,"ip_mode":"nic","engine_type":"traditional","cap_js_config":{"challengeCount":50,"challengeSize":32,"challengeDifficulty":4,"expiresMs":600000,"infoTitle":{"en":"","zh":""},"infoText":{"en":"","zh":""}}}',
  start_status: '0',
  exclude_url_log:'',
  is_enable_load_balance: '0',
  load_balance_stage: '1',
  unrestricted_port:'0',
  bind_ssl_id:'',
  auto_jump_https:'0',
  expiration_info:'',//仅对ssl前端处理
  bind_more_host:'',//多域名情况
  is_trans_back_domain:"0",//是否传递后端域名
  bind_more_port:'',//多端口情况
  is_enable_http_auth_base:"0",//是否激活Http Auth Base认证
  http_auth_base_type:"authorization",//认证类型 authorization(默认Basic Auth) custom(自定义页面)
  response_time_out:"60",//响应超时时间单位秒
  insecure_skip_verify:"0",//是否跳过后端https证书有效性验证
  anti_leech_json: '{"is_enable_anti_leech":0,"file_types":"gif|jpg|jpeg|png|bmp|swf","valid_referers":"none;server_names","action":"block","redirect_url":""}', // 新增防盗链配置
  cache_json: '{"is_enable_cache":0,"cache_location":"memory","cache_dir":"./data/cache","max_file_size_mb":0,"max_memory_size_mb":0}', // 新增缓存配置
  static_site_json: '{"is_enable_static_site":0,"static_site_path":"","static_site_prefix":"/","sensitive_paths":"/etc/passwd,/etc/shadow,/etc/group,/etc/gshadow,/etc/hosts,/etc/hostname,/etc/resolv.conf,/etc/ssh/,/var/log/,/.ssh/,/.bash_history,/.profile,/.bashrc,/etc/crontab,/var/spool/cron/,/etc/apache2/,/etc/nginx/,/etc/httpd/,/var/www/,/usr/share/,/var/tmp/,/var/run/,c:\\windows\\,c:\\program files\\,c:\\program files (x86)\\,c:\\users\\,c:\\documents and settings\\,c:\\windows\\system32\\,c:\\windows\\syswow64\\,c:\\boot.ini,c:\\autoexec.bat,c:\\config.sys,\\windows\\,\\program files\\,\\program files (x86)\\,\\users\\,\\documents and settings\\,\\windows\\system32\\,\\windows\\syswow64\\,boot.ini,autoexec.bat,config.sys,ntuser.dat,pagefile.sys,hiberfil.sys,swapfile.sys","sensitive_extensions":"key,.pem,.crt,.p12,.pfx,.jks,.bak,.backup,.old,.orig,.save,.sql,.db,.sqlite,.mdb,.env,.htaccess,.htpasswd,.git,.svn,.hg,.bzr,.DS_Store,Thumbs.db,desktop.ini,.tmp,.temp,.lock,.pid","allowed_extensions":".html,.htm,.css,.js,.json,.png,.jpg,.jpeg,.gif,.svg,.ico,.webp,.pdf,.txt,.md,.xml,.woff,.woff2,.ttf,.eot,.mp4,.webm,.ogg,.mp3,.wav,.zip,.tar,.gz,.rar","sensitive_patterns":"(?i)\\.git(/|\\\\),(?i)\\.svn(/|\\\\),(?i)\\.env,(?i)database\\.(php|xml|json|yaml|yml),(?i)(backup|dump|export)\\.(sql|db|tar|zip|gz),(?i)(id_rsa|id_dsa|id_ecdsa|id_ed25519),(?i)\\.ssh(/|\\\\).*,(?i)(access|error|debug)\\.log,(?i)web\\.config,(?i)phpinfo\\.php"}', // 新增静态网站配置
  default_encoding:"auto",//默认编码 utf-8 或者 gbk auto字符串自动选择 
  log_only_mode:"0",//仅记录模式 1 启动仅记录模式 0 关闭仅记录模式
  transport_json: '{"max_idle_conns":0,"max_idle_conns_per_host":0,"max_conns_per_host":0,"idle_conn_timeout":0,"tls_handshake_timeout":0,"expect_continue_timeout":0}', //Transport配置 json
};

// SSL配置初始化数据
export const INITIAL_SSL_DATA = {
  cert_content: '',
  key_content: '',
  cert_path: '',
  key_path: '',
};

// 健康检测配置初始化数据
export const INITIAL_HEALTHY = {
  is_enable_healthy: "1",
  fail_count: "3",
  success_count: "3",
  response_time: "5",
  check_method: 'GET',
  check_path: '/',
  expected_codes: '200,',
};

// 验证码配置初始化数据
export const INITIAL_CAPTCHA = {
  is_enable_captcha: '0',
  exclude_urls: "",
  expire_time: 24,
  ip_mode: 'nic',
  engine_type: 'traditional', // 新增：验证码引擎类型
  cap_js_config: { // 新增：capJS工作量证明配置
    challengeCount: 50,
    challengeSize: 32,
    challengeDifficulty: 4,
    expiresMs: 600000,
    infoTitle: {
      en: "",
      zh: ""
    },
    infoText: {
      en: "",
      zh: ""
    }
  }
};

// 防盗链配置初始化数据
export const INITIAL_ANTILEECH = {
  is_enable_anti_leech: '0',
  file_types: 'gif|jpg|jpeg|png|bmp|swf',
  valid_referers: 'none;server_names;',
  action: 'block',
  redirect_url: ''
};
// 缓存配置初始化数据
export const INITIAL_CACHE = {
  is_enable_cache: "0",
  cache_location: "memory",
  cache_dir: "./data/cache",
  max_file_size_mb: "0",
  max_memory_size_mb: "0"
};

// 静态网站配置初始化数据
export const INITIAL_STATIC_SITE = {
  is_enable_static_site: "0",
  static_site_path: "",
  static_site_prefix: "/",
  sensitive_paths: "/etc/passwd,/etc/shadow,/etc/group,/etc/gshadow,/etc/hosts,/etc/hostname,/etc/resolv.conf,/etc/ssh/,/var/log/,/.ssh/,/.bash_history,/.profile,/.bashrc,/etc/crontab,/var/spool/cron/,/etc/apache2/,/etc/nginx/,/etc/httpd/,/var/www/,/usr/share/,/var/tmp/,/var/run/,c:\\windows\\,c:\\program files\\,c:\\program files (x86)\\,c:\\users\\,c:\\documents and settings\\,c:\\windows\\system32\\,c:\\windows\\syswow64\\,c:\\boot.ini,c:\\autoexec.bat,c:\\config.sys,\\windows\\,\\program files\\,\\program files (x86)\\,\\users\\,\\documents and settings\\,\\windows\\system32\\,\\windows\\syswow64\\,boot.ini,autoexec.bat,config.sys,ntuser.dat,pagefile.sys,hiberfil.sys,swapfile.sys",
  sensitive_extensions: ".key,.pem,.crt,.p12,.pfx,.jks,.bak,.backup,.old,.orig,.save,.sql,.db,.sqlite,.mdb,.env,.htaccess,.htpasswd,.git,.svn,.hg,.bzr,.DS_Store,Thumbs.db,desktop.ini,.tmp,.temp,.lock,.pid",
  allowed_extensions: ".html,.htm,.css,.js,.json,.png,.jpg,.jpeg,.gif,.svg,.ico,.webp,.pdf,.txt,.md,.xml,.woff,.woff2,.ttf,.eot,.mp4,.webm,.ogg,.mp3,.wav,.zip,.tar,.gz,.rar",
  sensitive_patterns: "(?i)\\.git(/|\\\\),(?i)\\.svn(/|\\\\),(?i)\\.env,(?i)database\\.(php|xml|json|yaml|yml),(?i)(backup|dump|export)\\.(sql|db|tar|zip|gz),(?i)(id_rsa|id_dsa|id_ecdsa|id_ed25519),(?i)\\.ssh(/|\\\\).*,(?i)(access|error|debug)\\.log,(?i)web\\.config,(?i)phpinfo\\.php"
};
// Transport配置初始化数据
export const INITIAL_TRANSPORT = {
  max_idle_conns: "0",
  max_idle_conns_per_host: "0",
  max_conns_per_host: "0",
  idle_conn_timeout: "0",
  tls_handshake_timeout: "0",
  expect_continue_timeout: "0",
};
