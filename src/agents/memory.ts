// ============================================================
// Memory Agent — 长期记忆管理
// ============================================================

import { supabaseAdmin } from '@/lib/supabase'
import { callLLMJSON } from './llm'
import type { MemoryType } from '@/lib/types'

export interface MemoryInput {
  user_id: string
  memory_type: MemoryType
  content: string
  importance_score?: number
  tags?: string[]
}

/**
 * Memory Agent: 保存新的记忆
 */
export async function saveMemory(input: MemoryInput): Promise<void> {
  const { error } = await supabaseAdmin.from('memory').insert({
    user_id: input.user_id,
    memory_type: input.memory_type,
    content: input.content,
    importance_score: input.importance_score ?? 0.5,
    tags: input.tags ?? [],
  })

  if (error) throw new Error(`Failed to save memory: ${error.message}`)
}

/**
 * Memory Agent: 获取用户长期记忆
 */
export async function getMemoryContext(
  userId: string,
  limit = 20,
): Promise<Array<{
  id: string
  memory_type: MemoryType
  content: string
  importance_score: number
  tags: string[]
  created_at: string
}>> {
  const { data, error } = await supabaseAdmin
    .from('memory')
    .select('id, memory_type, content, importance_score, tags, created_at')
    .eq('user_id', userId)
    .order('importance_score', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to get memory: ${error.message}`)
  return data ?? []
}

/**
 * Memory Agent: 从对话中提取值得记住的信息
 * 使用 LLM 判断重要性并结构化存储
 */
export async function extractMemoryFromChat(
  userId: string,
  userMessage: string,
  aiResponse: string,
): Promise<void> {
  const extractionPrompt = `从以下对话中提取值得长期记住的信息（如果存在）。

用户：${userMessage}
AI：${aiResponse}

判断标准：
- 用户表达的个人偏好、工作习惯
- 重要的项目背景和决策
- 用户提到的关键事实

如果没有任何值得记住的信息，返回 {"memories": []}`

  interface ExtractionResult {
    memories: Array<{
      type: MemoryType
      content: string
      importance: number
      tags: string[]
    }>
  }

  try {
    const result = await callLLMJSON<ExtractionResult>([
      {
        role: 'system',
        content: extractionPrompt,
      },
      { role: 'user', content: '请提取值得长期记忆的信息。' },
    ])

    for (const mem of result.memories ?? []) {
      await saveMemory({
        user_id: userId,
        memory_type: mem.type,
        content: mem.content,
        importance_score: mem.importance,
        tags: mem.tags,
      })
    }
  } catch (err) {
    console.error('[Memory] Extraction failed:', err)
  }
}
