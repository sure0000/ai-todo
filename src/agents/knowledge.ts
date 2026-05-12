// ============================================================
// Knowledge Agent — 知识索引与管理
// ============================================================

import { supabaseAdmin } from '@/lib/supabase'
import { embedText, chunkText } from '@/lib/rag'
import type { KnowledgeSourceType } from '@/lib/types'

export interface ImportKnowledgeInput {
  user_id: string
  source_type: KnowledgeSourceType
  source_url?: string
  title?: string
  content: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

/**
 * Knowledge Agent: 导入知识并生成向量索引
 */
export async function importKnowledge(input: ImportKnowledgeInput): Promise<number> {
  const chunks = await chunkText(input.content, 500)
  const batchSize = 10
  let imported = 0

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)

    const rows = await Promise.all(
      batch.map(async (chunk) => {
        const embedding = await embedText(chunk)
        return {
          user_id: input.user_id,
          source_type: input.source_type,
          source_url: input.source_url,
          title: input.title,
          content: chunk,
          embedding,
          tags: input.tags ?? [],
          metadata: input.metadata ?? {},
        }
      }),
    )

    const { error } = await supabaseAdmin.from('knowledge').insert(rows)
    if (error) throw new Error(`Knowledge import failed: ${error.message}`)
    imported += rows.length
  }

  return imported
}

/**
 * Knowledge Agent: 检索相关知识
 */
export async function searchRelatedKnowledge(
  query: string,
  options?: {
    userId?: string
    tags?: string[]
    topK?: number
  },
) {
  const embedding = await embedText(query)
  const { data, error } = await supabaseAdmin.rpc('match_knowledge', {
    query_embedding: embedding,
    match_count: options?.topK ?? 5,
    filter_user_id: options?.userId ?? null,
    filter_tags: options?.tags ?? null,
  })

  if (error) throw error
  return data as Array<{
    id: string
    content: string
    title: string
    source_type: string
    source_url: string
    tags: string[]
    similarity: number
  }>
}
