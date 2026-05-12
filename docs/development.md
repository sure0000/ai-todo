# AItodo 开发指南

## 目录结构

```
src/
├── app/              # Next.js App Router — 路由、页面、API
├── agents/           # AI Agent 模块 — 可插拔设计
├── prompts/          # 结构化 Prompt — 集中配置
├── components/       # React 组件
└── lib/              # 工具库（类型、客户端、RAG）
```

## Agent 系统

### 设计原则

- **统一 LLM Router**：所有 LLM 调用通过 `src/agents/llm.ts`，支持切换 OpenAI / DeepSeek / Claude
- **模块化**：每个 Agent 独立文件，关注单一职责
- **可插拔**：Agent 之间通过接口通信，不直接依赖

### 添加新 Agent

1. 在 `src/agents/` 创建文件
2. 在 `src/prompts/index.ts` 添加 Prompt 模板
3. 通过 `callLLM` / `callLLMJSON` 调用 LLM
4. 在 API 路由中调用 Agent

### 切换 LLM 提供商

修改环境变量：

```env
# 切换到 OpenAI
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o
OPENAI_API_KEY=sk-...

# 切换到 DeepSeek（默认）
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
OPENAI_API_KEY=sk-...
```

## 数据库

Schema 定义在 `supabase/schema.sql`。核心表：

- `goals` — 用户目标
- `tasks` — 任务（关联目标）
- `knowledge` — 知识库（含向量索引）
- `memory` — 长期记忆
- `agent_executions` — Agent 执行日志

执行 `supabase/schema.sql` 初始化：

```bash
# 在 Supabase SQL Editor 中执行，或通过命令行
psql $DATABASE_URL -f supabase/schema.sql
```

## 前端组件

### 组件层级

```
GoalCreate      → 创建新目标（首页）
GoalCard        → 目标卡片（首页列表）
GoalDetail      → 目标详情页（含任务树 + AI 规划）
TaskTree        → 任务列表
TaskCard        → 单个任务（含执行按钮）
ChatPanel       → AI 对话侧栏
VoiceButton     → 语音输入按钮
```

### 状态处理

每个组件处理以下状态：

- **Loading**：骨架屏 / spinner
- **Empty**：空状态提示 + 引导操作
- **Error**：错误提示（API 调用失败时）
- **Edge case**：边界值（长文本、无数据等）

## 测试

```bash
npm run lint        # ESLint 检查
npm run build       # TypeScript 检查 + 构建
```

## 部署

项目已配置为 `standalone` 输出模式，支持 Vercel / Docker 部署。

```bash
npm run build
npm start           # 启动生产服务器
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

## 开发规范

### 代码风格

- TypeScript strict mode
- 使用 `@/` 路径别名引用 `src/`
- 同步函数用 `async/await`
- 错误处理：细化 API 路由的错误返回

### 提交规范

遵循常规提交格式：

```
feat: 新功能
fix: 修复
docs: 文档
refactor: 重构
chore: 构建/工具
```
