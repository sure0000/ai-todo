// ============================================================
// AItodo 核心类型定义 — Personal AI Execution OS
// ============================================================

// --- 枚举常量 ---

export type GoalStatus = 'draft' | 'active' | 'completed' | 'archived'

export type TaskType = 'research' | 'write' | 'analyze' | 'summarize' | 'execute'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export type Priority = 'high' | 'medium' | 'low'

export type KnowledgeSourceType = 'web' | 'notion' | 'obsidian' | 'manual' | 'search'

export type MemoryType = 'preference' | 'context' | 'insight' | 'fact'

export type AgentType = 'planner' | 'research' | 'writer' | 'knowledge' | 'memory'

export type AgentExecutionStatus = 'running' | 'completed' | 'failed'

// --- 核心对象 ---

export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string
  status: GoalStatus
  created_at: string
  updated_at: string
  tasks?: Task[]
}

export interface List {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  sort_order: number
  created_at: string
}

export interface Task {
  id: string
  user_id?: string
  list_id?: string
  goal_id?: string
  parent_task_id?: string
  title: string
  task_type: TaskType
  status: TaskStatus
  priority: Priority
  due_date?: string
  tags: string[]
  result?: string
  sort_order: number
  created_at: string
  updated_at: string
  children?: Task[]
  executions?: AgentExecution[]
  list?: List
}

export interface Knowledge {
  id: string
  user_id: string
  source_type: KnowledgeSourceType
  source_url?: string
  title?: string
  content: string
  embedding?: number[]
  tags: string[]
  metadata: Record<string, unknown>
  created_at: string
}

export interface Memory {
  id: string
  user_id: string
  memory_type: MemoryType
  content: string
  importance_score: number
  tags: string[]
  created_at: string
  updated_at: string
}

export interface AgentExecution {
  id: string
  task_id: string
  agent_type: AgentType
  execution_log: Record<string, unknown>[]
  status: AgentExecutionStatus
  input?: string
  output?: string
  started_at: string
  completed_at?: string
}

// --- 请求/响应类型 ---

export interface CreateGoalInput {
  title: string
  description?: string
}

export interface PlanResult {
  tasks: Array<{
    title: string
    task_type: TaskType
    priority: Priority
  }>
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

// --- 旧类型（兼容旧组件，后续移除） ---

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon?: string
  knowledge_source_id?: string
  created_at: string
}

export interface Todo {
  id: string
  user_id: string
  category_id?: string
  title: string
  description?: string
  priority: Priority
  status: 'todo' | 'in_progress' | 'done'
  due_date?: string
  sort_order: number
  created_at: string
  updated_at: string
  category?: Category
}
