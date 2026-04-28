-- Token Plan Dashboard 数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS token_plan_dashboard
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE token_plan_dashboard;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY COMMENT '用户ID (UUID)',
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希 (SHA256)',
  is_admin BOOLEAN DEFAULT FALSE COMMENT '是否管理员',
  created_at BIGINT DEFAULT (UNIX_TIMESTAMP() * 1000) COMMENT '创建时间戳(毫秒)',
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 创建分组表
CREATE TABLE IF NOT EXISTS `groups` (
  id VARCHAR(36) PRIMARY KEY COMMENT '分组ID (UUID)',
  user_id VARCHAR(36) NOT NULL COMMENT '所属用户ID',
  name VARCHAR(100) NOT NULL COMMENT '分组名称',
  created_at BIGINT DEFAULT (UNIX_TIMESTAMP() * 1000) COMMENT '创建时间戳(毫秒)',
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分组表';

-- 创建账号表（支持多用户隔离）
CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(36) PRIMARY KEY COMMENT '账号ID (UUID)',
  user_id VARCHAR(36) COMMENT '所属用户ID',
  group_id VARCHAR(36) DEFAULT NULL COMMENT '所属分组ID',
  name VARCHAR(255) NOT NULL COMMENT '账号名称',
  api_key VARCHAR(500) NOT NULL COMMENT 'API密钥',
  created_at BIGINT DEFAULT (UNIX_TIMESTAMP() * 1000) COMMENT '创建时间戳(毫秒)',
  INDEX idx_created_at (created_at),
  INDEX idx_user_id (user_id),
  INDEX idx_group_id (group_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账号表';

-- 初始化管理员账号
-- 管理员用户名: admin
-- 管理员密码: admin123
-- 密码经过 SHA256 哈希
INSERT INTO users (id, username, password_hash, is_admin, created_at)
SELECT 'admin-uuid-placeholder', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', TRUE, UNIX_TIMESTAMP() * 1000
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
