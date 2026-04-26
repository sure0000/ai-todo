export type Priority = 'high' | 'medium' | 'low'
export type TodoStatus = 'todo' | 'in_progress' | 'done'
export type KnowledgeSourceType = 'notion' | 'feishu' | 'obsidian'

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
}

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
  status: TodoStatus
  due_date?: string
  sort_order: number
  created_at: string
  updated_at: string
  category?: Category
}

export interface KnowledgeSource {
  id: string
  user_id: string
  name: string
  type: KnowledgeSourceType
  config?: Record<string, unknown>
  last_synced_at?: string
  created_at: string
}
