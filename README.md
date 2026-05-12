# AItodo — Personal AI Execution OS

> 知识驱动的 AI 执行系统。输入目标，AI 自动拆解、研究、执行、输出结果。

## 产品定位

AItodo 不是传统 Todo 产品。用户输入目标后，系统自动完成：

1. **理解目标** — 分析用户意图
2. **拆解任务** — Planner Agent 生成任务树
3. **调用知识库** — 检索本地知识 + 网络搜索
4. **自动执行** — Research Agent 研究分析
5. **输出结果** — Writer Agent 生成结构化报告
6. **持续推进** — 长期记忆 + 对话追问

**核心用户群**：AI 创业者、独立开发者、内容创作者、行业研究者、技术研究人员。

## 系统架构

```
用户输入目标
  → Planner Agent （拆解任务）
  → Research Agent（搜索 + 分析）
  → Writer Agent  （输出报告）
  → Knowledge Engine（管理知识索引）
  → Memory System （长期记忆）
  → 持续对话（Chat + 追问）
```

### 核心模块

| 模块 | 技术 | 说明 |
|------|------|------|
| **Frontend** | Next.js 16 + Tailwind CSS v4 | 目标创建、任务树、结果展示、对话面板 |
| **API Gateway** | Next.js App Router | RESTful API 接口 |
| **Planner Agent** | DeepSeek (LLM) | 目标拆解、任务规划 |
| **Research Agent** | DeepSeek + Tavily | 网络搜索、资料分析 |
| **Writer Agent** | DeepSeek (LLM) | 结构化报告生成 |
| **Knowledge Engine** | Supabase + pgvector | 知识向量化存储与检索 |
| **Memory System** | Supabase + LLM | 长期记忆、上下文保持 |
| **LLM Router** | OpenAI SDK (兼容层) | 统一 LLM 调用，当前使用 DeepSeek |

## 技术栈

| 层 | 技术 |
|------|------|
| 框架 | [Next.js 16](https://nextjs.org) (App Router) |
| 语言 | TypeScript |
| 数据库 | [Supabase](https://supabase.com) (PostgreSQL + pgvector) |
| LLM | [DeepSeek](https://deepseek.com) (通过 OpenAI SDK 兼容层) |
| 搜索 | [Tavily](https://tavily.com)（可选，不配置则降级为本地知识库） |
| 样式 | [Tailwind CSS v4](https://tailwindcss.com) |
| 图标 | [Lucide React](https://lucide.dev) |
| UI 组件 | Radix UI (Dialog, DropdownMenu, Select) |

## 快速开始

### 前置要求

- Node.js 20+
- Supabase 项目（含 pgvector 扩展）

### 环境变量

复制 `.env.example` 为 `.env.local` 并填入配置：

```bash
cp .env.example .env.local
```

核心变量：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 |
| `OPENAI_API_KEY` | DeepSeek / OpenAI API 密钥 |
| `TAVILY_API_KEY` | Tavily 搜索 API 密钥（可选） |

### 数据库初始化

在 Supabase SQL Editor 中执行 `supabase/schema.sql`，创建所需的表和函数。

### 安装与运行

```bash
npm install
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

## 项目结构

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # 首页 - 目标列表
│   │   ├── layout.tsx          # 根布局
│   │   ├── goals/[id]/
│   │   │   └── page.tsx        # 目标详情页
│   │   └── api/
│   │       ├── goals/          # 目标 CRUD
│   │       │   ├── route.ts
│   │       │   └── [id]/       # 单个目标
│   │       │       ├── route.ts
│   │       │       └── plan/   # AI 规划
│   │       ├── tasks/[id]/
│   │       │   └── execute/    # 执行任务
│   │       ├── chat/           # AI 对话
│   │       ├── knowledge/
│   │       │   ├── import/     # 导入知识
│   │       │   ├── notion/     # Notion 同步
│   │       │   └── obsidian/   # Obsidian 上传
│   │       └── memory/
│   │           └── context/    # 长期记忆
│   ├── agents/                 # Agent 系统
│   │   ├── llm.ts              # 统一 LLM Router
│   │   ├── planner.ts          # Planner Agent
│   │   ├── research.ts         # Research Agent
│   │   ├── writer.ts           # Writer Agent
│   │   ├── knowledge.ts        # Knowledge Agent
│   │   └── memory.ts           # Memory Agent
│   ├── prompts/                # 结构化 Prompt 配置
│   │   └── index.ts
│   ├── components/
│   │   ├── goal/               # 目标组件
│   │   ├── task/               # 任务组件
│   │   ├── chat/               # 对话组件
│   │   └── todo/
│   │       └── VoiceButton.tsx # 语音输入
│   └── lib/
│       ├── types.ts            # 核心类型
│       ├── supabase.ts         # Supabase 客户端
│       └── rag.ts              # RAG 工具
├── supabase/
│   └── schema.sql              # 数据库 Schema
└── .env.example                # 环境变量模板
```

## API 参考

### 目标 Goals

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/goals` | 获取目标列表 |
| `POST` | `/api/goals` | 创建目标 |
| `PATCH` | `/api/goals` | 更新目标 |
| `DELETE` | `/api/goals?id=` | 删除目标 |
| `GET` | `/api/goals/[id]` | 获取目标详情（含任务树） |
| `POST` | `/api/goals/[id]/plan` | AI 自动拆解任务 |

### 任务 Tasks

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/tasks` | 获取任务列表（支持 status/priority/due_date/search 过滤） |
| `POST` | `/api/tasks` | 创建独立任务 |
| `PATCH` | `/api/tasks` | 更新任务（状态、优先级、截止日期等） |
| `DELETE` | `/api/tasks?id=` | 删除任务 |
| `POST` | `/api/tasks/[id]/execute` | 执行研究任务（仅限目标子任务） |

### 知识 Knowledge

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/knowledge/import` | 导入知识 |
| `GET` | `/api/knowledge/notion?action=auth` | Notion OAuth |
| `POST` | `/api/knowledge/obsidian` | Obsidian 上传 |

### 记忆 Memory

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/memory/context` | 获取长期记忆 |
| `POST` | `/api/memory/context` | 保存记忆 |

### 对话 Chat

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/chat` | AI 对话接口 |

## Agent 设计

### Planner Agent

拆解用户目标为可执行任务树，包含任务类型（research/write/analyze/summarize/execute）和优先级。

### Research Agent

执行网络搜索（Tavily）和知识库检索，使用 LLM 分析资料并提取洞察。

### Writer Agent

基于研究结果生成结构化报告（支持 report/article/prd 三种输出类型）。

### Knowledge Agent

管理知识导入、分块、向量化和检索。

### Memory Agent

管理长期记忆，包括偏好、上下文、洞察、事实四种类型。自动从对话中提取值得记住的信息。

### Prompt 规范

所有 Agent 使用结构化 Prompt，包含 Role / Task / Context / Output Format / Constraints 五个部分。

## 开发规则

- 所有代码必须模块化
- 所有 Agent 必须可插拔
- 所有 Prompt 必须配置化
- 所有 LLM 调用必须统一封装
- 所有任务必须支持异步执行
- 所有知识必须支持向量检索
- 所有上下文必须支持长期记忆

## MVP 成功标准

1. 用户输入一个研究目标
2. AI 能自动拆任务
3. AI 能自动搜索资料
4. AI 能生成可读分析结果
5. 用户能持续追问
6. 项目上下文不会丢失

## 技术路线

- **Phase 1** （当前）：Goal、Task、AI Research、Knowledge Base
- **Phase 2**：长期记忆、自动追踪、Agent Workflow
- **Phase 3**：Browser Agent、自动执行、多 Agent 协作
- **Phase 4**：企业知识库、团队协作、SaaS 商业化
