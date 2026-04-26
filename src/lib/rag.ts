import OpenAI from 'openai'
import { supabaseAdmin } from './supabase'

// DeepSeek 不支持 embeddings，用简单的哈希向量作为降级方案
const deepseek = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
})

export async function embedText(text: string): Promise<number[]> {
  // DeepSeek 暂不支持 embedding API，生成伪向量（1536维）
  const vec = new Array(1536).fill(0)
  for (let i = 0; i < text.length; i++) {
    vec[i % 1536] += text.charCodeAt(i) / 1000
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1
  return vec.map(v => v / norm)
}

export async function searchKnowledge(query: string, sourceId: string, topK = 5) {
  const embedding = await embedText(query)
  const { data, error } = await supabaseAdmin.rpc('match_knowledge_chunks', {
    query_embedding: embedding,
    source_id: sourceId,
    match_count: topK,
  })
  if (error) throw error
  return data as Array<{ content: string; metadata: Record<string, unknown>; similarity: number }>
}

export async function chunkText(text: string, chunkSize = 500): Promise<string[]> {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '))
  }
  return chunks
}
