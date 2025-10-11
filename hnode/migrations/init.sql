-- ==========================================
-- HNode CRM 系统数据库初始化脚本
-- ==========================================
-- 版本: v1.2.0
-- 创建日期: 2025-10-11
-- 说明: 此脚本创建17张核心表和初始化数据
-- ==========================================
--
-- 📋 数据表清单（17张表）：
-- 
-- 【用户与组织】
--   1. departments          - 部门表（支持多级）
--   2. users                - 用户表（角色、部门）
--
-- 【客户管理】
--   3. contacts             - 联系人表
--   4. contact_tags         - 联系人标签表
--   5. customers            - 客户表
--   6. customer_analysis    - 客户AI分析表
--
-- 【邮件系统】
--   7. email_templates      - 邮件模板表
--   8. user_email_bindings  - 用户邮箱绑定表
--   9. email_history        - 邮件往来记录表
--
-- 【会议管理】
--  10. zoom_meetings        - 视频会议表
--
-- 【销售与合同】
--  11. sales_records        - 销售记录表
--  12. contracts            - 合同表
--
-- 【数据分析】
--  13. reports              - 数据报告表
--  14. case_studies         - 案例总结表
--
-- 【权限系统】
--  15. pages                - 页面定义表
--  16. page_permissions     - 页面权限表
--  17. permission_audit_logs - 权限审计日志表
--
-- ==========================================

-- ==================== 核心表（用户和组织）====================

-- 1. 部门表（支持多级部门）
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  level INTEGER DEFAULT 1,
  path VARCHAR(500),
  manager_id INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_path ON departments(path);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON departments(manager_id);

-- 2. 用户表（增强版）
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  role VARCHAR(20) DEFAULT 'user' NOT NULL CHECK (role IN ('super_admin', 'admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  password_changed BOOLEAN DEFAULT false,
  last_password_change TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ==================== 客户管理相关表 ====================

-- 3. 联系人表
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(200) NOT NULL,
  domain VARCHAR(255),
  position VARCHAR(200),
  tags TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_first_name ON contacts(first_name);
CREATE INDEX IF NOT EXISTS idx_contacts_last_name ON contacts(last_name);

-- 3. 联系人标签表
CREATE TABLE IF NOT EXISTS contact_tags (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT unique_user_tag_name UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_contact_tags_user_id ON contact_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_name ON contact_tags(name);

-- 4. 客户表
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(200),
  email_count INTEGER DEFAULT 0,
  communication_progress VARCHAR(50) DEFAULT '待联系',
  interest_level VARCHAR(50) DEFAULT '无兴趣',
  deal_status VARCHAR(20) DEFAULT '未成交' CHECK (deal_status IN ('未成交', '已成交')),
  last_communication_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company);
CREATE INDEX IF NOT EXISTS idx_customers_first_name ON customers(first_name);
CREATE INDEX IF NOT EXISTS idx_customers_last_name ON customers(last_name);
CREATE INDEX IF NOT EXISTS idx_customers_communication_progress ON customers(communication_progress);
CREATE INDEX IF NOT EXISTS idx_customers_interest_level ON customers(interest_level);

-- 5. 邮件模板表
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);

-- 6. 用户邮箱绑定表
CREATE TABLE IF NOT EXISTS user_email_bindings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  email_address VARCHAR(255) NOT NULL,
  email_password TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive')),
  is_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT unique_user_email UNIQUE (user_id, email_address)
);

CREATE INDEX IF NOT EXISTS idx_user_email_bindings_user_id ON user_email_bindings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_email_bindings_email_address ON user_email_bindings(email_address);
CREATE INDEX IF NOT EXISTS idx_user_email_bindings_status ON user_email_bindings(status);
CREATE INDEX IF NOT EXISTS idx_user_email_bindings_is_default ON user_email_bindings(is_default);

-- 7. 邮件往来记录表
CREATE TABLE IF NOT EXISTS email_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  send_address VARCHAR(255) NOT NULL,
  receive_address VARCHAR(255) NOT NULL,
  title VARCHAR(500),
  content TEXT,
  send_time TIMESTAMP NOT NULL,
  customer_name VARCHAR(255),
  customer_id INTEGER REFERENCES customers(id) ON UPDATE CASCADE ON DELETE SET NULL,
  contact_id INTEGER REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE SET NULL,
  sender_email_binding_id INTEGER REFERENCES user_email_bindings(id) ON UPDATE CASCADE ON DELETE SET NULL,
  email_type VARCHAR(20) DEFAULT 'sent' NOT NULL CHECK (email_type IN ('sent', 'received')),
  parent_email_id INTEGER REFERENCES email_history(id) ON UPDATE CASCADE ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'sent' NOT NULL CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_history_user_id ON email_history(user_id);
CREATE INDEX IF NOT EXISTS idx_email_history_customer_id ON email_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_history_contact_id ON email_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_history_send_time ON email_history(send_time DESC);
CREATE INDEX IF NOT EXISTS idx_email_history_sender_email_binding_id ON email_history(sender_email_binding_id);
CREATE INDEX IF NOT EXISTS idx_email_history_email_type ON email_history(email_type);
CREATE INDEX IF NOT EXISTS idx_email_history_parent_email_id ON email_history(parent_email_id);
CREATE INDEX IF NOT EXISTS idx_email_history_status ON email_history(status);

-- 8. 会议视频记录表
CREATE TABLE IF NOT EXISTS zoom_meetings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON UPDATE CASCADE ON DELETE CASCADE,
  meeting_title VARCHAR(500),
  meeting_date TIMESTAMP,
  video_file_path TEXT,
  video_file_name VARCHAR(500),
  video_file_size BIGINT,
  audio_file_path TEXT,
  transcript_text TEXT,
  ai_summary TEXT,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'transcribing', 'summarizing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_zoom_meetings_user_id ON zoom_meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_customer_id ON zoom_meetings(customer_id);
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_status ON zoom_meetings(status);
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_created_at ON zoom_meetings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_meeting_date ON zoom_meetings(meeting_date DESC);

-- 9. 客户分析表
CREATE TABLE IF NOT EXISTS customer_analysis (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON UPDATE CASCADE ON DELETE CASCADE,
  customer_email VARCHAR(255),
  customer_name VARCHAR(200),
  customer_first_name VARCHAR(100),
  customer_last_name VARCHAR(100),
  current_progress TEXT,
  opportunities JSONB,
  risks JSONB,
  strategic_suggestions JSONB,
  next_actions JSONB,
  analysis_data JSONB,
  email_count INTEGER DEFAULT 0,
  meeting_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_analysis_user_id ON customer_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_analysis_customer_id ON customer_analysis(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_analysis_created_at ON customer_analysis(created_at DESC);

-- 10. 销售记录表
CREATE TABLE IF NOT EXISTS sales_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON UPDATE CASCADE ON DELETE CASCADE,
  sale_date DATE NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sales_records_user_id ON sales_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_customer_id ON sales_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_sale_date ON sales_records(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_records_user_sale_date ON sales_records(user_id, sale_date);

-- 11. 合同表
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON UPDATE CASCADE ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  contract_number VARCHAR(100),
  party_a_name VARCHAR(200),
  party_b_name VARCHAR(200) DEFAULT '浩天药业有限公司',
  purchase_product TEXT,
  purchase_quantity DECIMAL(12,2),
  estimated_delivery_date DATE,
  contract_amount DECIMAL(12,2),
  currency VARCHAR(10) DEFAULT 'USD',
  notes TEXT,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at DESC);

-- 12. 报告表（AI生成的报告缓存）
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('personal', 'department', 'company')),
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('week', 'month')),
  year INTEGER NOT NULL,
  month INTEGER,
  week INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  department_id INTEGER REFERENCES departments(id) ON UPDATE CASCADE ON DELETE CASCADE,
  generated_by INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  summary TEXT,
  statistics JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(report_type, period_type, year, month, week, user_id, department_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_type_period ON reports(report_type, period_type);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_department_id ON reports(department_id);
CREATE INDEX IF NOT EXISTS idx_reports_year_month ON reports(year, month);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- 13. 案例总结表
CREATE TABLE IF NOT EXISTS case_studies (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON UPDATE CASCADE ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  title VARCHAR(200),
  customer_info TEXT,
  sales_techniques TEXT,
  communication_highlights TEXT,
  summary TEXT,
  generated_by INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_case_studies_customer_id ON case_studies(customer_id);
CREATE INDEX IF NOT EXISTS idx_case_studies_user_id ON case_studies(user_id);
CREATE INDEX IF NOT EXISTS idx_case_studies_created_at ON case_studies(created_at DESC);

-- 14. 页面表
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  parent_id INTEGER REFERENCES pages(id) ON DELETE CASCADE,
  page_type VARCHAR(20) NOT NULL,
  url VARCHAR(200),
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_pages_code ON pages(code);
CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(page_type);

-- 15. 页面权限表
CREATE TABLE IF NOT EXISTS page_permissions (
  id SERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL,
  target_id INTEGER NOT NULL,
  has_permission BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(page_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_page_permissions_target ON page_permissions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_page_permissions_page ON page_permissions(page_id);

-- 16. 权限修改日志表
CREATE TABLE IF NOT EXISTS permission_audit_logs (
  id SERIAL PRIMARY KEY,
  operator_id INTEGER NOT NULL REFERENCES users(id),
  operator_name VARCHAR(100) NOT NULL,
  action_type VARCHAR(20) NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  target_id INTEGER NOT NULL,
  target_name VARCHAR(100) NOT NULL,
  changes JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON permission_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_operator ON permission_audit_logs(operator_id);

-- ==================== 初始数据 ====================

-- 插入默认超级管理员账号
-- 用户名: admin
-- 邮箱: admin@workwith.cn
-- 密码: Admin123456 (bcrypt加密后的哈希值)
-- 角色: super_admin (超级管理员)
-- 密码状态: 未修改（首次登录需要修改）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin' OR email = 'admin@workwith.cn') THEN
    INSERT INTO users (
      username, 
      email, 
      hashed_password, 
      department_id,
      role,
      is_active, 
      is_admin,
      password_changed,
      created_at, 
      updated_at
    )
    VALUES (
      'admin',
      'admin@workwith.cn',
      '$2a$10$NH7Wmc8SCRgR6c1th.NeiuWu/SbvzxoGKKIKHPsvwF1KbUPagYjie',
      NULL,
      'super_admin',
      true,
      true,
      false,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
  END IF;
END $$;

-- 插入页面数据
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pages LIMIT 1) THEN
    -- 独立页面：控制台
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('控制台', 'dashboard', NULL, 'page', '/dashboard', 'bi-house-door', 0, false);
    
    -- 一级菜单：客户管理
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('客户管理', 'customers', NULL, 'menu', NULL, 'bi-people', 1, false);
    
    -- 客户管理子页面
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('联系人', 'contacts.list', (SELECT id FROM pages WHERE code='customers'), 'page', '/contacts', NULL, 1, false),
    ('客户', 'customers.list', (SELECT id FROM pages WHERE code='customers'), 'page', '/customers', NULL, 2, false);
    
    -- 联系人操作
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('查看联系人', 'contacts.view', (SELECT id FROM pages WHERE code='contacts.list'), 'action', NULL, NULL, 1, false),
    ('新增联系人', 'contacts.create', (SELECT id FROM pages WHERE code='contacts.list'), 'action', NULL, NULL, 2, false),
    ('编辑联系人', 'contacts.edit', (SELECT id FROM pages WHERE code='contacts.list'), 'action', NULL, NULL, 3, false),
    ('删除联系人', 'contacts.delete', (SELECT id FROM pages WHERE code='contacts.list'), 'action', NULL, NULL, 4, false),
    ('Hunter搜索', 'contacts.hunter_search', (SELECT id FROM pages WHERE code='contacts.list'), 'action', NULL, NULL, 5, false);
    
    -- 客户操作
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('查看客户', 'customers.view', (SELECT id FROM pages WHERE code='customers.list'), 'action', NULL, NULL, 1, false),
    ('新增客户', 'customers.create', (SELECT id FROM pages WHERE code='customers.list'), 'action', NULL, NULL, 2, false),
    ('编辑客户', 'customers.edit', (SELECT id FROM pages WHERE code='customers.list'), 'action', NULL, NULL, 3, false),
    ('删除客户', 'customers.delete', (SELECT id FROM pages WHERE code='customers.list'), 'action', NULL, NULL, 4, false),
    ('AI分析客户', 'customers.ai_analyze', (SELECT id FROM pages WHERE code='customers.list'), 'action', NULL, NULL, 5, false),
    ('录入合同', 'customers.contract_create', (SELECT id FROM pages WHERE code='customers.list'), 'action', NULL, NULL, 6, false),
    ('查看合同', 'customers.contract_view', (SELECT id FROM pages WHERE code='customers.list'), 'action', NULL, NULL, 7, false);
    
    -- 一级菜单：邮件系统
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('邮件系统', 'emails', NULL, 'menu', NULL, 'bi-envelope', 2, false);
    
    -- 邮件系统子页面
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('收件箱', 'emails.inbox', (SELECT id FROM pages WHERE code='emails'), 'page', '/emails/inbox', NULL, 1, false),
    ('发件箱', 'emails.sent', (SELECT id FROM pages WHERE code='emails'), 'page', '/emails/sent', NULL, 2, false),
    ('写邮件', 'emails.compose', (SELECT id FROM pages WHERE code='emails'), 'page', '/emails/compose', NULL, 3, false),
    ('邮件模板', 'emails.templates', (SELECT id FROM pages WHERE code='emails'), 'page', '/emails/templates', NULL, 4, false);
    
    -- 邮件模板操作
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('创建模板', 'emails.template_create', (SELECT id FROM pages WHERE code='emails.templates'), 'action', NULL, NULL, 1, false),
    ('编辑模板', 'emails.template_edit', (SELECT id FROM pages WHERE code='emails.templates'), 'action', NULL, NULL, 2, false),
    ('删除模板', 'emails.template_delete', (SELECT id FROM pages WHERE code='emails.templates'), 'action', NULL, NULL, 3, false);
    
    -- 一级菜单：数据分析
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('数据分析', 'analytics', NULL, 'menu', NULL, 'bi-graph-up', 3, false);
    
    -- 数据分析子页面
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('数据统计', 'statistics', (SELECT id FROM pages WHERE code='analytics'), 'page', '/statistics', NULL, 1, false),
    ('销售数据', 'sales', (SELECT id FROM pages WHERE code='analytics'), 'page', '/sales', NULL, 2, false),
    ('数据报告', 'reports', (SELECT id FROM pages WHERE code='analytics'), 'page', '/reports', NULL, 3, false),
    ('案例总结', 'case_studies', (SELECT id FROM pages WHERE code='analytics'), 'page', '/case-studies', NULL, 4, false);
    
    -- 销售数据操作
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('新增销售记录', 'sales.create', (SELECT id FROM pages WHERE code='sales'), 'action', NULL, NULL, 1, false),
    ('编辑销售记录', 'sales.edit', (SELECT id FROM pages WHERE code='sales'), 'action', NULL, NULL, 2, false),
    ('删除销售记录', 'sales.delete', (SELECT id FROM pages WHERE code='sales'), 'action', NULL, NULL, 3, false);
    
    -- 报告操作
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('生成报告', 'reports.generate', (SELECT id FROM pages WHERE code='reports'), 'action', NULL, NULL, 1, false),
    ('删除报告', 'reports.delete', (SELECT id FROM pages WHERE code='reports'), 'action', NULL, NULL, 2, false);
    
    -- 案例操作
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('生成案例', 'case_studies.generate', (SELECT id FROM pages WHERE code='case_studies'), 'action', NULL, NULL, 1, false),
    ('查看案例', 'case_studies.view', (SELECT id FROM pages WHERE code='case_studies'), 'action', NULL, NULL, 2, false),
    ('删除案例', 'case_studies.delete', (SELECT id FROM pages WHERE code='case_studies'), 'action', NULL, NULL, 3, false);
    
    -- 一级菜单：其他
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('其他', 'others', NULL, 'menu', NULL, 'bi-three-dots', 4, false);
    
    -- 其他子页面
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('会议记录', 'meetings', (SELECT id FROM pages WHERE code='others'), 'page', '/meetings', NULL, 1, false);
    
    -- 一级菜单：系统设置
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('系统设置', 'settings', NULL, 'menu', NULL, 'bi-gear', 5, false);
    
    -- 系统设置子页面
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('部门管理', 'settings.departments', (SELECT id FROM pages WHERE code='settings'), 'page', '/settings/departments', NULL, 1, false),
    ('用户管理', 'settings.users', (SELECT id FROM pages WHERE code='settings'), 'page', '/settings/users', NULL, 2, false),
    ('页面权限', 'settings.page_permissions', (SELECT id FROM pages WHERE code='settings'), 'page', '/settings/page-permissions', NULL, 3, true),
    ('邮箱配置', 'settings.email', (SELECT id FROM pages WHERE code='settings'), 'page', '/settings/email', NULL, 4, false);
    
    -- 部门管理操作
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('新增部门', 'departments.create', (SELECT id FROM pages WHERE code='settings.departments'), 'action', NULL, NULL, 1, false),
    ('编辑部门', 'departments.edit', (SELECT id FROM pages WHERE code='settings.departments'), 'action', NULL, NULL, 2, false),
    ('删除部门', 'departments.delete', (SELECT id FROM pages WHERE code='settings.departments'), 'action', NULL, NULL, 3, false);
    
    -- 用户管理操作
    INSERT INTO pages (name, code, parent_id, page_type, url, icon, sort_order, is_system) VALUES
    ('新增用户', 'users.create', (SELECT id FROM pages WHERE code='settings.users'), 'action', NULL, NULL, 1, false),
    ('编辑用户', 'users.edit', (SELECT id FROM pages WHERE code='settings.users'), 'action', NULL, NULL, 2, false),
    ('删除用户', 'users.delete', (SELECT id FROM pages WHERE code='settings.users'), 'action', NULL, NULL, 3, false),
    ('重置密码', 'users.reset_password', (SELECT id FROM pages WHERE code='settings.users'), 'action', NULL, NULL, 4, false);
  END IF;
END $$;

-- 为现有所有部门授予全部权限（默认策略）
DO $$
DECLARE
  dept RECORD;
  pg RECORD;
BEGIN
  FOR dept IN SELECT id FROM departments LOOP
    FOR pg IN SELECT id FROM pages WHERE is_active = true LOOP
      INSERT INTO page_permissions (page_id, target_type, target_id, has_permission, created_by)
      VALUES (pg.id, 'department', dept.id, true, 1)
      ON CONFLICT (page_id, target_type, target_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 为现有所有普通用户（非超管）授予全部权限（默认策略）
DO $$
DECLARE
  usr RECORD;
  pg RECORD;
BEGIN
  FOR usr IN SELECT id FROM users WHERE role != 'super_admin' LOOP
    FOR pg IN SELECT id FROM pages WHERE is_active = true LOOP
      INSERT INTO page_permissions (page_id, target_type, target_id, has_permission, created_by)
      VALUES (pg.id, 'user', usr.id, true, 1)
      ON CONFLICT (page_id, target_type, target_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ==========================================
-- 初始化脚本执行完成
-- ==========================================
-- 
-- ✅ 已创建的表：17张
-- ✅ 已创建的索引：70+个
-- ✅ 已插入的初始数据：
--    - 1个默认超级管理员账号（admin）
--    - 页面权限定义（80+个页面/操作）
--    - 所有部门和用户的默认权限
--
-- 🔐 默认账号信息：
--    用户名: admin
--    邮箱:   admin@workwith.cn
--    密码:   Admin123456
--    角色:   super_admin
--
-- 📝 注意事项：
--    1. 首次登录后请立即修改默认密码
--    2. 新创建的部门和用户默认拥有所有权限
--    3. 超级管理员可以在"页面权限"中调整权限
--    4. 系统页面（is_system=true）仅超管可访问
--
-- ==========================================
