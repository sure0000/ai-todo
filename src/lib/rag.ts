// ============================================================
// RAG 工具 — 向量化、文本分块、知识检索
// ============================================================

import { supabaseAdmin } from './supabase'

/**
 * 简单的伪向量化
 * DeepSeek 不支持 embedding API，生成 1536 维伪向量
 */
export async function embedText(text: string): Promise<number[]> {
  const vec = new Array(1536).fill(0)
  for (let i = 0; i < text.length; i++) {
    vec[i % 1536] += text.charCodeAt(i) / 1000
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1
  return vec.map(v => v / norm)
}

/**
 * 文本分块
 */
export async function chunkText(text: string, chunkSize = 500): Promise<string[]> {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '))
  }
  return chunks
}

/**
 * 检索相关知识库
 */
export async function searchKnowledge(
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
