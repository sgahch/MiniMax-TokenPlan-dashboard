# MiniMax Token Plan Agent

![Next.js](https://img.shields.io/badge/Next.js-16.2.1-000000?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

Badges by [Shields.io](https://shields.io/).

中文 | [English](#english)

## 中文

基于 MiniMax API 的多模态客户端，支持文本对话、语音合成、视频生成、图片生成、音乐生成。

### 功能

- 文本对话：多会话历史记录，消息本地持久化
- 语音合成：异步任务轮询，支持音色选择与音频播放
- 视频生成：异步任务轮询，支持结果预览
- 图片生成：返回图片并支持下载
- 音乐生成：支持纯音乐与含歌词模式
- 本地设置：API Key 存储在浏览器本地，不上传到项目服务器

### 可配置化

项目支持默认配置 + 配置文件覆盖：

- 默认配置在 `src/config/appConfig.ts`
- 可编辑配置文件为 `minimax.config.json`
- 可配置项包括：
  - API Base URL
  - 文本/语音/视频/图片/音乐模型
  - 语音与音乐音频参数
  - 音色列表、视频模型列表、图片比例列表

### 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:3000

### 开发命令

```bash
npm run lint
npm run typecheck
npm run build
```

### 安全与隐私建议

- 不要将真实 API Key 写入代码或提交到仓库
- 使用 `.env.local` 或设置面板输入 API Key
- 提交前检查是否包含 token、密钥、证书文件
- 仓库已配置常见敏感文件与本地文件忽略规则（见 `.gitignore`）

---

## English

A multimodal client built on MiniMax APIs, including chat, text-to-speech, video generation, image generation, and music generation.

### Features

- Chat with multi-session local history
- Async TTS generation with polling and playback
- Async video generation with polling and preview
- Image generation with downloadable output
- Music generation for instrumental or lyric mode
- Local settings storage, including API Key in browser storage

### Configuration

This project supports defaults plus file-based overrides:

- Default config: `src/config/appConfig.ts`
- Override file: `minimax.config.json`
- Configurable items:
  - API base URL
  - Model defaults/options for all modalities
  - Audio settings for voice/music
  - Voice options, video model options, image ratio options

### Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Scripts

```bash
npm run lint
npm run typecheck
npm run build
```

### Security Notes

- Never commit real API keys into the repository
- Prefer `.env.local` or UI settings for local secrets
- Scan commits for tokens/keys/certificates before push
- Common local and sensitive files are excluded in `.gitignore`
