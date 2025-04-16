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
  defense_json: '{"bot":1,"sqli":1,"xss":1,"scan":1,"rce":1,"sensitive":1,"traversal":1}',
  healthy_json: '{"is_enable_healthy":1,"fail_count":3,"success_count":3,"response_time":60,"check_method":"GET","check_path":"/","expected_codes":"200,"}',
  captcha_json: '{"is_enable_captcha":0,"exclude_urls":[],"expire_time":24,"ip_mode":"nic"}',
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
  response_time_out:"60",//响应超时时间单位秒
  insecure_skip_verify:"0",//是否跳过后端https证书有效性验证
  anti_leech_json: '{"is_enable_anti_leech":0,"file_types":"gif|jpg|jpeg|png|bmp|swf","valid_referers":"none;server_names","action":"block","redirect_url":""}', // 新增防盗链配置
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
};

// 防盗链配置初始化数据
export const INITIAL_ANTILEECH = {
  is_enable_anti_leech: '0',
  file_types: 'gif|jpg|jpeg|png|bmp|swf',
  valid_referers: 'none;server_names;',
  action: 'block',
  redirect_url: ''
};