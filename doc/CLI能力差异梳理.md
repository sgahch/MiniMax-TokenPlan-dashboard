# MiniMax CLI 对标差异梳理

## 1. 对比范围

- 目标工程：`E:\java\workspace_open\cli`（官方 CLI）
- 当前工程：`E:\java\workspace_own\MiniMax-TokenPlan-Agent`
- 对标目标：以 `mmx` 命令体系为目标补齐能力

## 2. 已具备能力（当前工程）

- 文本、图片、视频、语音、音乐五类核心 API 调用链路已具备
- 语音/视频已具备异步任务查询与文件下载 URL 获取逻辑
- 已具备统一配置（`minimax.config.json`）与基础 API 客户端封装
- 已具备 Token Plan 额度查询能力

## 3. 核心不足（对比官方 CLI）

### 3.1 命令入口与分组体系不足

- 缺少可直接在终端执行的 `mmx` 命令入口
- 缺少 `auth/config/quota/update` 等管理命令
- 缺少 `text chat`、`image generate`、`video task get` 等子命令分组结构

### 3.2 认证与配置能力不足

- 缺少 `auth login/status/logout`
- 缺少 `~/.mmx/config.json` 持久化配置能力
- 缺少 `config show/set/export-schema`

### 3.3 能力覆盖不足

- 缺少 `search`（Web 搜索）命令
- 缺少 `vision describe`（图像理解）命令
- 缺少终端侧 `speech voices` 查询
- 缺少文件落盘下载能力（`--out`、`--download`）

### 3.4 CLI 体验不足

- 缺少统一帮助信息与标准用法示例
- 缺少跨命令通用参数处理（`--api-key`、`--base-url`）

## 4. 本次补全范围

- 新增终端入口 `bin/mmx`，实现 `mmx` 命令主流程
- 补齐 `auth`、`config`、`quota` 管理命令
- 补齐 `text/image/video/speech/music/search/vision/update` 命令能力
- 补齐视频/语音异步任务轮询与下载落盘
- 补齐 README 与需求文档中的 CLI 说明

## 5. 仍需持续演进项

- OAuth 浏览器登录与刷新令牌能力
- 文本流式输出与 SSE 增量渲染
- 文件上传/列表/删除命令
- 更完整的错误码、重试策略与单元测试体系
