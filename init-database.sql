-- 创建数据库
CREATE DATABASE IF NOT EXISTS token_plan_dashboard
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE token_plan_dashboard;

-- 创建账号表
CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(36) PRIMARY KEY COMMENT '账号ID (UUID)',
  name VARCHAR(255) NOT NULL COMMENT '账号名称',
  api_key VARCHAR(500) NOT NULL COMMENT 'API密钥',
  created_at BIGINT DEFAULT (UNIX_TIMESTAMP() * 1000) COMMENT '创建时间戳(毫秒)',
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账号表';

-- 初始化管理员账号 (可选)
-- INSERT INTO accounts (id, name, api_key) VALUES (UUID(), '管理员', 'your_api_key_here');
