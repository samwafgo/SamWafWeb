/**
 *  SamWaf 中文语言包
 *
 * common 放置一些公共字段
 * menu  左侧菜单
 * page 里面放置对应功能页面的字段
 */
export default {
  common:{
    confirm:"确认",
    cancel:"取消",
    close:"关闭",
    search:"查询",
    refresh:"刷新",
    all:"全部",
    details: "详情",
    new: "新建",
    copy: "复制",
    edit: "编辑",
    delete: "删除",
    reset: "重置",
    submit: "提交",
    export: "导出",
    return: "返回",
    status: "状态",
    remarks: "备注",
    renew:"续期",
    select_placeholder: "请选择",
    placeholder: "请输入",
    placeholder_content: "请输入内容",
    debug:'调试',
    confirm_delete: "确认删除当前所选数据?",
    data_delete_warning: "删除后，数据将被删除，且无法恢复",
    create_time: "创建时间",
    update_time: "更新时间",
    op: "操作内容",
    date:"日期",
    online_document:"在线文档",
    defense_status:{
      all:"全部",
      stop:"阻止",
      pass:"放行",
      forbid:"禁止",
    },
    on:"开启",
    off:"关闭",
  },
  login:{
    login_title:"登录",
    login_sub_title:"SamWaf网站防火墙后台",
    login_has_question:"遇到问题？",
    login_online_document:"SamWaf在线文档",
    input_account_placeholder:"请输入账号：",
    input_password_placeholder:"请输入登录密码：",
    login_btn_title:"登录",
    rule:{
      phone:"手机号必填",
      account:"账号必填",
      password:"密码必填",
      verifyCode:"验证码必填"
    },
    login_success:"登录成功",
  },
  topNav:{
    update:{
      has_new_version:"有新版本啦",
    },
    contract:"联系SamWaf",
    help_document:"帮助文档",
    current_server:"当前 服务器",
    system_config:"系统设置",
    dropdown_person_center:"个人中心",
    dropdown_update:"升级",
    dropdown_reboot_waf:"重启WAF",
    dropdown_logout:"退出",
  },
  dashboard:{
    tip_create_website_title:"您当前未创建需要防护的网站，点击进行创建",
    tip_create_website_link:"马上创建",
    tip_modify_pwd_title:"您当前还是使用默认帐号和密码请尽快修改",
    tip_modify_pwd_link:"马上修改",
    counter:{
      today_of_attack_count:"今日攻击数",
      all_visit_count:"今天总访问量",
      not_normal_visit_count:"今天异常IP（个）",
      qps:"当前QPS",
    },
    cycle_title:"周期攻击与正常对比情况",
    cycle_subtitle:"(次)",
    cycle_normal_count:"本周期正常数",
    cycle_attack_count:"本周期攻击数",
    cycle_percent_title:"正常攻击占比",
    cycle_percent_subtitle:"周期内",
    ip_rank:{
      normal_title:"IP正常访问排名",
      attack_title:"IP攻击访问排名",
      ip:"IP",
      counter:"访问次数",
      rank:"排名",
      tag:"标签",
      ip_belong:"归属地",
      day:"今日",
      week:"本周",
    }
  },
  menu:{
    dashboard: {
      parent_title:"仪表盘",
      dashboard_title:"概览仪表盘",
    },
    host:{
      parent_title:"网站防护",
      host_title:"网站防护",
      host_detail:"主机防护详情",
      host_protect_rule:"防御规则",
      host_protect_rule_edit:"防御规则编辑",
      allow_ip:"IP白名单",
      allow_url:"Url白名单",
      deny_ip:"IP黑名单",
      deny_url:"URL黑名单",
      ldp_url:"隐私保护Url",
      cc:"cc防御",
      sensitive:"敏感词",
      sslconfig:"证书夹",
      batchtask:"批量任务",
      sslorder:"证书申请记录",
      ssl_expire:"证书过期批量检测",
    },
    analysis:{
      parent_title:"数据分析",
      analysis_title:"数据分析",
    },
    visit_log:{
      parent_title:"防护日志",
      visit_title:"防护日志",
      visit_detail_title:"防护详情",
    },
    account:{
      parent_title:"账号管理",
      account_list_title:"账号列表",
      account_log_title:"账号日志",
    },
    system:{
      parent_title:"系统设置",
      system_log_title:"系统日志",
      system_config_title:"参数设置",
      system_runtime_title:"运行参数",
      system_one_key_modify_title:"一键修改",
    },
    pc:{
      parent_title:"设备管理",
      pc_list_title:"设备列表",
    }
  },
  page:{
    account: {
      create_account: "新建账号",
      login_account_label: "登录帐号",
      reset_password: "重置密码",
      role: "角色",
      role_super_admin: "超级管理员",
      role_admin: "管理员",
      login_password: "登录密码",
      super_admin_password: "超级管理员密码",
      new_password: "新密码",
      confirm_password: "确认密码",
      password_mismatch_warning: "两次输入的密码不相同，请检查",
      admin_delete_warning: "默认管理帐号不允许删除",
    },
    account_log:{
      export_logs: "导出日志",
      view_log_dialog_title: "查看日志",
      operation_account: "操作账号",
      operation_type: "操作类型",
      operation_content: "操作内容",
      cancel: "取消",
      operation_time: "添加时间"
    },
    analysis:{

    },
    cc:{
      new_cc_protection: "新建CC防护",
      selected_count: "已选 {count} 项",
      website: "网站",
      url: "URL",
      rate: "速率",
      limit: "限制访问次数",
      lock_minutes:"封禁时间(分钟)",
      samwaf_cc_protection: "SamWaf防护墙抵御CC攻击",
      input_url_placeholder: "输入URL（可不填）",
      show_cc_ban_ip: "显示CC封禁IP",
      ban_ip:"封禁IP",
      ban_remain_time:"封禁剩余时间",
      ban_ip_belong:"IP归属地",
      remove_ban_ip:"移除封禁IP",
    },
    visit_log:{
      visit_log: "防御日志",
      online_document: "在线文档",
      website: "网站",
      rule_name: "规则名称",
      access_status: "访问状态",
      response_code: "响应码",
      access_ip: "访问IP",
      access_date: "访问日期",
      access_method: "访问方法",
      log_archive_db: "日志归档库",
      guest_identity: "访客身份",
      time_spent: "耗时(ms)",
      risk_level: "危害程度",
      trigger_rule: "触发规则",
      time: "时间",
      domain: "域名",
      request: "请求",
      source_ip: "来源IP",
      country: "国家",
      province: "省份",
      city: "城市",
      access_url: "访问url",
      header: "Header",
      status_code: "响应码",
      search_placeholder: "请输入规则名称",
      select_placeholder: "请选择防御状态",
      input_placeholder: "请输入访问方法",
      date_range_today: "今天",
      date_range_last_3_days: "最近3天",
      date_range_last_7_days: "最近7天",
      date_range_last_300_days: "最近300天",
      export_db_file_header:"导出当前选择的日志文件(SQLITE)",
      export_db_file_content:"历史文件可能很大，为避免影响带宽，请在闲时进行数据导出",
      detail:{
        defense_status: "防御情况",
        visit_time: "访问",
        detection_time: "检测",
        defense_status_step: "防御状态",
        response_status: "响应状态",
        request_identifier: "请求标识",
        request_time: "请求时间",
        request_domain: "请求域名",
        request_method: "请求方法",
        request_content_size: "请求内容大小",
        visitor_ip: "访问者IP",
        add_to_deny_list: "加入不允许访问",
        visitor_port: "访问者端口",
        request_region: "请求地区",
        response_code: "响应编码",
        more_info:"更多信息",
        request_path: "请求路径",
        request_header: "请求头",
        request_user_browser: "请求用户浏览器",
        request_cookies: "请求cookies",
        request_body: "请求BODY",
        request_form: "请求Form",
        response_data: "响应数据",
        quick_add_rule: "快捷加入规则",
        open: "开",
        close: "关",
        add_to_deny_list_confirm_header: "加入不允许访问的IP列表",
        add_to_deny_list_confirm_body: "你确定要加入不允许访问的IP?",
        website_not_exist_warning: "当前网站不存在",
        back: "返回",
        mouse_select_tooltip: "鼠标选中想要添加的内容后,点击页面空白即可",
        http_copy_mask:"误报?",
        http_copy_mask_tip:"遇到误报情况，请复制下面文本信息到邮箱 samwafgo@gmail.com。内容已经屏蔽常见的敏感信息：header:Authorization, Token,Api-Key, Secret, Access-Token,X-Api-Key,X-Access-Token, X-Secret,Session-Key, Set-Cookie  cookies:sessionid|auth|token|key|secret ，如果有其他字段请自行屏蔽，或者欢迎提交issue",      }
    },
    center:{
      switch_local: "切换本机（不进行远程访问）",
      server_switch_button: "切换服务器",
      recent_visit_time: "最近访问时间",
      client_server_name: "客户端名称",
      client_system_type: "操作系统类型",
      client_ip: "IP",
      client_port: "端口",
      client_new_version: "版本号",
      client_new_version_desc: "版本",
      last_visit_time: "最近访问时间",
    },
    host:{
      new_protection: "新建防护",
      website_protection: "网站防御",
      export_data: "导出数据",
      import_data: "导入数据",
      website: "网站 ",
      url: "URL ",
      ssl_auto_apply: "SSL证书自动申请",
      search_placeholder: "请输入",
      search_button: "查询",
      core_features: "SamWaf核心功能，所有网站信息，防护功能开启等",
      host: "网站",
      host_tips: "输入您需要防护的网站域名:如 www.samwaf.com ,*.samwaf.com",
      host_validation: "请输入有效的主机名或 IP 地址,如 www.samwaf.com ,8.8.8.8",
      host_placeholder: "请输入网站的网址",
      port: "主端口",
      port_placeholder: "请输入网站的端口一般是80/443",
      port_tips: "输入您需要防护的网站端口 1. http是80 https 是 443 2.如果已经安装了宝塔，Nginx，IIS等 您需要手工改动端口成非80，或者非443端口",
      bind_more_port: " 绑定多个端口(可选):",
      bind_more_port_placeholder: "英文逗号隔开，如 80,8080",
      bind_more_port_tips: "适合情况:1. 如主端口443 有证书，需要用80做自动化证书申请(文件验证方式) 2.适合同一个网站多个端口同时服务非SSL情况",
      ssl: "加密证书",
      ssl_folder: "证书夹",
      ssl_tips: "如果是https需要选择加密证书，80端口不需要",
      ssl_yes:"是",
      ssl_no:"否",
      add_new_ssl:"添加新证书",
      edit_ssl:"编辑新证书",
      bind_empty_ssl_tips:"当前未绑定SSL",
      ssl_not_found_tips:"未找到关联的证书信息",
      ssl_option_yes:"加密证书（需上传证书）",
      ssl_option_no:"非加密",
      guard_status_on: "已防护",
      guard_status_off: "未防护",
      auto_start_on: "自动启动",
      auto_start_off: "手工启动",
      tab_base:"基础内容",
      tab_engine:"引擎自带防护",
      tab_other:"其他配置",
      tab_more_domain:"绑定多个域名",
      tab_password:"网站密码访问",
      more_domain:"同时绑定多个域名",
      more_domain_tips:"填写多个域名回车换行,不要加端口",
      start_status: "启动状态",
      guard_status: "防御状态",
      start_status_content: "该功能是选择是否直接启动。",
      keyfile: "密钥串",
      keyfile_content: "通常文件名：*.key 内容格式如下：-----BEGIN RSA PRIVATE KEY----- 全选复制填写进来",
      certfile: "证书串",
      certfile_content: "通常文件名：*.crt 内容格式如下：-----BEGIN CERTIFICATE----- 全选复制填写进来",
      remote_host: "后端域名",
      remote_host_content: "后端域名通常同第一项网站域名相同（一定要加上协议 http:// 或 https://）",
      remote_host_validation: "必须以 http:// 或 https:// 开头，并且不能包含端口号",
      is_trans_back_domain: "是否传递后端域名",
      is_trans_back_domain_content: "默认关闭，如果开启适用于防护域名和后端不一致情况",
      remote_ip: "后端IP(动态域名)",
      remote_ip_content: "如SamWaf同网站在同一台服务器 填写127.0.0.1 如果是不同服务器请填写实际IP或者动态域名",
      remote_port: "后端端口",
      remote_port_content: "情况1，在SamWaf和网站在同一台服务器，那么端口需要写成81等其他端口  情况2：如果不在同一台服务器，那么此处可以原来端口",
      remarks: "备注",
      exclude_url_log: "记录日志时排除URL",
      exclude_url_log_tips: "记录日志时排除URL开头的数据",
      bot_detection: "Bot检测",
      bot_detection_tips: "检测搜索引擎是否是伪装的",
      sql_injection_detection: "Sql注入检测",
      sql_injection_detection_tips: "检测是否存在sql注入",
      xss_detection: "XSS检测",
      xss_detection_tips: "检测是否存在xss攻击",
      scan_detection: "扫描工具检测",
      scan_detection_tips: "是否检测扫描工具",
      rce_detection: "RCE检测",
      rce_detection_tips: "RCE远程攻击检测",
      sensitive_detection: "敏感词检测",
      sensitive_detection_tips: "敏感词检测",
      engine_protection: "引擎自带防护",
      other_config: "其他配置",
      guard_status_confirm: "防护状态提示",
      guard_status_confirm_content: "防护状态【开启】，该网站进行实时防护。防护状态【关闭】，该网站会关闭实时防护。",
      start_status_confirm: "启动状态提示",
      start_status_confirm_content:"启动状态【开启】会正常接收用户请求。 启动状态【关闭】会停止用户请求",
      import_file: "导入文件",
      upload_file: "上传文件",
      upload_file_limit_size: "上传文件大小在 5M 以内",
      upload_tips: "未选择文件",
      file_upload_success: "文件上传成功",
      file_upload_fail: "文件上传失败",
      file_safety: "文件安全",
      back_system_type_baota:"宝塔",
      back_system_type_phpstudy:"小皮面板(phpstudy)",
      back_system_type_phpnow:"PHPnow",
      back_system_type_default:"默认",
      back_system_biz_website:"纯网站",
      back_system_biz_api:"API业务系统",
      back_system_biz_mange:"业务加管理",
      back_system_biz_default:"默认",
      delete_confirm_clear_relation:"删除后，该网站信息和规则将被清空，且无法恢复",
      forbid_for_global_site:"全局网站不能操作",
      forbid_for_global_site_only_change_guard_status:"全局网站只能配置保护状态",
      host_rule_msg:"主机请不要填写http和https 直接写域名即可",
      real_time:"实时数据",
      real_qps:"实时QPS",
      real_active:"实时连接",
      loadbalance:{
        label_loadbalance_is_enable: "是否启用负载",
        label_loadbalance_type: "负载均衡类型",
        label_loadbalance_type_weight_round_robin: "权重轮询(WRR)",
        label_loadbalance_type_least_connections: "最少连接",
        label_loadbalance_type_ip_hash: "IP Hash",
        label_loadbalance_type_source_hash: "源地址 Hash",
        label_loadbalance_type_url_hash: "URL Hash",
        label_loadbalance_type_least_time: "最小响应时间",
        label_is_enable_load_balance_on: "启动负载",
        label_is_enable_load_balance_off: "关闭负载",
        label_add_loadbalance:"添加负载",
        website: "网站",
        remote_ip: "远端ip",
        remote_port: "远端端口",
        weight:"权重",
      },
      unrestricted_port:{
        label_unrestricted_port_is_enable: "来源严格端口",
        label_unrestricted_port_is_enable_on: "启用",
        label_unrestricted_port_is_enable_off: "关闭",
        unrestricted_port_tip:"如果关闭，适合外层有CDN,Nginx情况，只匹配被保护域名，不匹配来源端口"
      },
      auto_jump_https:{
        label_autu_jump_https: "强制80跳转HTTPS",
        label_autu_jump_https_on: "启用",
        label_autu_jump_https_off: "关闭",
        autu_jump_https_tip:"如果启用，那么SamWaf将强制自动跳转到https，如果关闭，那么SamWaf将不会自动跳转"
      },
      is_enable_http_auth_base:"网站密码访问",
    },
    one_key_mod:{
      one_key_placeholder: "由于单台服务器只能一个程序使用Web(80端口，443端口)，所以如果需要让Waf变为前置，那么此处需要将80=》81 ，443=》444。\n" +
        "          SamWaf为了方便用户部署，新增一键修改宝塔Web端口。仅在Linux下可使用。",
      baota_placeholder:"宝塔Nginx配置默认路径",
      button_one_key_modify: "一键修改",
      modify_logs: "SamWaf一键修改记录",
      title_file_path: "文件路径",
      title_create_time: "添加时间",
      label_op_system: "系统类型",
      label_file_path: "文件路径",
      label_before_content: "原始内容",
      label_after_content: "修改后内容",
      confirm_delete: "确认要删除吗",
      success_modify_message: "操作成功",
      warning_modify_message: "操作警告"
    },
    ipallow:{
      button_add_ip: "新建白名单IP",
      label_website: "网站",
      label_ip: "Ip",
      alert_message: "SamWaf防护墙会忽略在白名单内的IP/网段",
    },
    ipblock:{
      button_add_ip: "新建黑名单IP",
      label_website: "网站",
      label_ip: "Ip",
      alert_message: "SamWaf防护墙会阻止在黑名单内的IP/网段的访问",
    },
    ldpurl:{
      new_privacy_url: "新建隐私保护Url",
      label_website: "网站",
      label_url: "URL",
      label_compare_type: "匹配方式",
      alert_message: "SamWaf用户在访问指定的url返回的敏感数据脱敏处理，如手机号会隐藏部分",
      compare_type_option_equal:"等于",
      compare_type_option_pre:"前缀匹配",
      compare_type_option_end:"后缀匹配",
      compare_type_option_contain:"包含匹配",
    },
    urlallow:{
      button_add_url: "新建白名单URL",
      label_website: "网站",
      label_url: "URL",
      label_compare_type: "匹配方式",
      alert_message: "SamWaf防护墙防护时候会忽略在白名单内的URL",
      compare_type_option_equal:"等于",
      compare_type_option_pre:"前缀匹配",
      compare_type_option_end:"后缀匹配",
      compare_type_option_contain:"包含匹配",
    },
    urlblock:{
      button_add_url: "新建黑名单URL",
      label_website: "网站",
      label_url: "URL",
      label_compare_type: "匹配方式",
      alert_message: "SamWaf防护墙会阻止访问在限制访问内的URL",
      compare_type_option_equal:"等于",
      compare_type_option_pre:"前缀匹配",
      compare_type_option_end:"后缀匹配",
      compare_type_option_contain:"包含匹配",
    },
    sensitive:{
      button_add_sensitive: "新建敏感词",
      label_type: "类型",
      label_content: "内容",
      alert_message: "SamWaf防护墙会阻止敏感词内容",
      type_option_0:"未选择",
      type_option_1:"类型1",
      type_option_2:"类型2",
      type_option_3:"类型3",
    },
    systemconfig:{
      new_system_configuration: "新建系统配置",
      label_configuration_item: "配置项",
      label_configuration_value: "配置值",
    },
    ssl:{
      alert_message:"SamWaf 管理所有证书信息",
      label_cert_content: "证书文件内容(.crt文件)",
      label_key_content: "密钥文件内容(.key文件)",
      button_submit: "提交",
      alert_success: "提交成功！",
      alert_error: "提交失败！",
      label_serial_no: "证书序列号",
      label_subject: "证书主题",
      label_issuer: "颁发者",
      label_valid_from: "证书有效期开始时间",
      label_valid_to: "证书有效期结束时间",
      label_expire_time: "到期时间",
      label_domains: "证书适用的域名",
      label_auto_tip:"SamWaf每天凌晨3点会自动提取下面对应ssl文件存放路径的证书信息，并备份当前证书",
      label_auto_path: "自动提取证书路径",
      label_auto_key_path: "key文件路径",
      label_auto_crt_path: "crt文件路径",
    },
    batchtask:{
      alert_message:"自动执行一些批量化操作,每日5点依次执行",
      label_batch_task_name: "任务名称",
      label_website: "网站",
      label_batch_type: "任务类型",
      label_batch_source_type: "来源类型",
      label_batch_source: "来源值",
      label_batch_execute_method: "执行方式",
      label_remark: "备注",
      label_btn_manual: "手工触发",
      label_confirm_message: "确认要手工触发吗？",
      batch_type:{
        add_ipallow: "添加白名单IP",
      },
      batch_source_type:{
          local: "本地路径",
          remote: "远端URL",
      },
      batch_execute_method:{
        append: "添加",
        overwrite: "覆盖",
      },
    },
    sslorder:{
      alert_message:"申请免费证书，证书有效期是90天，到期前默认30天，进行自动续签,也可以进行手工发起续期",
      label_website:"主机",
      label_apply_status:"申请状态",
      label_result_error:"错误信息",
      label_apply_platform:"申请平台",
      label_apply_method:"申请方式",
      label_apply_domain:"申请域名",
      label_apply_email:"申请邮箱",
      sslorder_status_type:{
        submitted: "已提交",
        applying: "申请中",
        fail:"已失败",
        success: "已成功",
        renewed:"已续签",
        expired:"已过期",
      },
      sslorder_platform_type:{
        letsencrypt: "Let's Encrypt",
      },
      sslorder_apply_method_type:{
        http01: "文件验证方式",
      },
      error_domain_not_match_method: "文件选择方式下不能是泛域名",
    },
    ssl_expire:{
      alert_message: "SamWaf 域名证书检测到期情况，每天凌晨定时检测一次全部的域名",
      button_add_ssl_expire: "新建",
      button_check:"检测",
      button_sync_host:"同步已存在的主机信息",
      domain: "域名",
      port: "端口",
      visit_log: "访问记录",
      valid_to:"过期时间",
      status: "状态",
    },
    http_auth_base:{
      alert_message: "开启网站密码后，请使用密码访问",
      button_add_http_auth_base: "新建",
      host_code: "网站",
      user_name: "用户名",
      password: "密码",
      password_validation:"密码不合法"
    },
    syslog:{
      syslog:"系统日志",
      label_op_type:"操作类型",
      label_op_content:"操作内容",
    },
    rule:{
      button_add_rule:"新建规则",
      label_website: "网站",
      label_rule_name: "规则名",
      label_rule_version: "规则版本",
      label_rule_status: "规则状态",
      alert_message: "SamWaf防御规则,可进行脚本(首选)，界面编辑",
      rule_online_document: "规则编辑在线文档",
      rule_on: "生效",
      rule_off: "未生效",
      detail:{
        recommend_message:"推荐从(日志详情)里面一键选择特征值自动编辑防御脚本",
        jump_visit_log:"跳转到日志列表",
        jump_online_document:"防御规则在线文档Online",
        base_info: "基本信息",
        rule_name: "规则名称",
        rule_domain_code: "防护网站",
        rule_salience: "防护级别",
        rule_manual: "防护编排方式",
        rule_dyn_add: "新建",
        relation: "关系",
        condition:"条件",
        built_in_entity_name: "内置实体名称",
        scope: "作用域",
        value_type: "值类型",
        judgment: "判断",
        value: "值",
        function_judgment_result: "函数判断结果",
        assignment: "赋值",
        assignment_area: "赋值区域",
        assignment_detail: "赋值明细",
        method_execution: "方法执行",
        method_execution_area: "方法执行区域",
        method_details: "方法明细",
        inner_method: "内置方法",
        parameter: "传参",
        write_rule: "规则编排",
        system_variable: "系统变量",
        ui_rule_edit:"界面编排",
        manual_code_rule_edit:"手工代码编排",
        //options
        mf_option_default:"默认",
        method_option:"做动作",
        //options header
        inner_option_host:"主机",
        inner_option_url:"URL",
        inner_option_referrer:"网站来路(referrer)",
        inner_option_user_agent:"用户代理(User-Agent)",
        inner_option_method:"METHOD",
        inner_option_cookies:"访问COOKIES",
        inner_option_body:"访问BODY",
        inner_option_port:"请求端口",
        inner_option_src_ip:"访客IP",
        inner_option_country:"访客归属国家",
        inner_option_province:"访客归属省份",
        inner_option_city:"访客归属城市",
        //options attr
        attr_type_text:"文本",
        attr_type_int:"数字",
        //options judge
        judge_equal:"判断是否等于",
        judge_not_equal:"判断是否不等于",
        judge_greater_than:"判断是否大于",
        judge_less_than:"判断是否小于",
        judge_greater_than_equal:"判断是否大于等于",
        judge_less_than_equal:"判断是否小于等于",
        judge_contain:"判断包含(函数)",
        judge_has_prefix:"判断开头(函数)",
        judge_has_suffix:"判断结尾(函数)",
        //options logic relation
        judge_logic_and:"并且",
        judge_logic_or:"或者",
      }
    },
    notice:{
      notice_title:"通知",
      clear:"清空",
      set_read:"设为已读",
      empty:"暂无通知",
      all:"查看全部",
    },
    right_setting:{
      page_setting: "页面配置",
      theme_mode: "主题模式",
      theme_color: "主题色",
      navigation_layout: "导航布局",
      element_switches: "元素开关",
      fix_header: "固定 Header",
      fix_sidebar: "固定 Sidebar",
      show_header: "显示 Header",
      show_breadcrumb: "显示 Breadcrumbs",
      show_footer: "显示 Footer",
      use_tabs_router: "使用 多标签Tab页",
      footer_position: "footer 内收",
      split_menu: "分割菜单（混合模式下有效）",
      theme_mode_color_light:"明亮",
      theme_mode_color_dark:"暗黑",
      theme_mode_color_auto:"跟随系统",
    },
  }
};
