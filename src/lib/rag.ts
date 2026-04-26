import OpenAI from 'openai'
import { supabaseAdmin } from './supabase'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function embedText(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return res.data[0].embedding
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
