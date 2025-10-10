-- 初始化数据库表结构

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. 联系人表
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

-- ==================== 初始数据 ====================

-- 插入默认管理员账号
-- 用户名: admin
-- 邮箱: admin@workwith.cn
-- 密码: Admin123456 (bcrypt加密后的哈希值)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin' OR email = 'admin@workwith.cn') THEN
    INSERT INTO users (username, email, hashed_password, is_active, is_admin, created_at, updated_at)
    VALUES (
      'admin',
      'admin@workwith.cn',
      '$2a$10$NH7Wmc8SCRgR6c1th.NeiuWu/SbvzxoGKKIKHPsvwF1KbUPagYjie',
      true,
      true,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
  END IF;
END $$;
