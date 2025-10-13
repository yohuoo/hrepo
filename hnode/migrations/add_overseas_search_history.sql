-- 创建海外客户搜索历史记录表
CREATE TABLE IF NOT EXISTS overseas_search_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 搜索参数
  search_query TEXT NOT NULL,
  industry VARCHAR(200),
  country VARCHAR(100),
  company_size VARCHAR(50),
  
  -- 搜索结果
  company_name VARCHAR(255) NOT NULL,
  company_domain VARCHAR(255),
  company_description TEXT,
  company_location VARCHAR(255),
  company_size_result VARCHAR(50),
  company_industry VARCHAR(200),
  
  -- 联系信息
  contact_email VARCHAR(255),
  contact_phone VARCHAR(100),
  company_website VARCHAR(500),
  
  -- 额外信息
  ai_summary TEXT,
  search_source VARCHAR(50) DEFAULT 'openai',
  
  -- 状态标记
  is_contacted BOOLEAN DEFAULT FALSE,
  is_customer BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 唯一约束：同一用户不能有相同的公司名称和域名组合
  CONSTRAINT unique_user_company UNIQUE(user_id, company_name, company_domain)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_overseas_history_user ON overseas_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_overseas_history_created ON overseas_search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_overseas_history_company ON overseas_search_history(company_name);
CREATE INDEX IF NOT EXISTS idx_overseas_history_domain ON overseas_search_history(company_domain);

-- 添加注释
COMMENT ON TABLE overseas_search_history IS '海外客户搜索历史记录表';
COMMENT ON COLUMN overseas_search_history.user_id IS '用户ID';
COMMENT ON COLUMN overseas_search_history.search_query IS '搜索关键词';
COMMENT ON COLUMN overseas_search_history.company_name IS '公司名称';
COMMENT ON COLUMN overseas_search_history.is_contacted IS '是否已联系';
COMMENT ON COLUMN overseas_search_history.is_customer IS '是否已成为客户';

