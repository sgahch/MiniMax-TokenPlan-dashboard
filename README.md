# Token Plan Dashboard

MiniMax API 多账号 Token 配额管理系统，支持用户认证和数据隔离。

## 功能特性

- **多账号管理** - 添加、编辑、删除多个 MiniMax API 账号
- **Token 配额可视化** - 显示每个模型的周期/周配额使用情况
- **用户认证** - JWT Token 登录，支持注册和修改密码
- **数据隔离** - 普通用户只能看到自己的账号，Admin 可管理所有账号
- **一键折叠** - 快速折叠/展开所有账号卡片
- **复制 API Key** - 一键复制 API Key（支持手机端）
- **深色模式** - 支持明暗主题切换
- **自动刷新** - 每 60 秒自动刷新数据

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Python Flask + PyMySQL + JWT
- **数据库**: MySQL

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/sgahch/MiniMax-TokenPlan-dashboard.git
cd token-plan-dashboard
```

### 2. 初始化数据库

```bash
mysql -u root -p < init-database.sql
```

### 3. 安装后端依赖

```bash
pip install pyjwt flask flask-cors pymysql requests
```

### 4. 启动后端

```bash
python backend.py
```

后端运行在 `http://localhost:5000`

### 5. 启动前端

```bash
npm install
npm run dev
```

前端运行在 `http://localhost:5173`

### 6. 登录账号

- **管理员账号**: `admin` / `admin123`
- 或注册新账号

## 部署

### 前端部署

```bash
npm run build
```

构建产物在 `dist/` 目录，可部署到 Nginx 等 Web 服务器。

### 后端部署

```bash
nohup python backend.py > backend.log 2>&1 &
```

确保 Nginx 配置了 `/api` 代理到 `http://127.0.0.1:5000`

## 项目结构

```
├── src/
│   ├── pages/          # 页面组件
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── ChangePasswordPage.tsx
│   ├── App.tsx          # 主应用
│   ├── useAccounts.ts   # 账号状态管理
│   ├── useAuth.ts       # 认证状态管理
│   ├── AccountCard.tsx  # 账号卡片
│   ├── ModelCard.tsx     # 模型配额卡片
│   └── AccountForm.tsx   # 账号表单
├── backend.py           # Flask 后端
├── init-database.sql   # 数据库初始化
└── vite.config.ts      # Vite 配置
```

## API 接口

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/change-password` | 修改密码 |
| GET | `/api/auth/me` | 获取当前用户 |
| GET | `/api/accounts` | 获取账号列表 |
| POST | `/api/accounts` | 添加账号 |
| PUT | `/api/accounts/:id` | 更新账号 |
| DELETE | `/api/accounts/:id` | 删除账号 |

## License

MIT
