// ============================================================
// Research Agent — 资料搜索与分析
// ============================================================

import { callLLMJSON } from './llm'
import { prompts, buildPrompt } from '@/prompts'
import { supabaseAdmin } from '@/lib/supabase'
import { embedText } from '@/lib/rag'

export interface ResearchFinding {
  finding: string
  source: string
  confidence: 'high' | 'medium' | 'low'
}

export interface ResearchResult {
  summary: string
  key_findings: string[]
  insights: string[]
  sources: string[]
  confidence: 'high' | 'medium' | 'low'
}

/**
 * 网络搜索（使用 Tavily）
 * 如果未配置 TAVILY_API_KEY，降级为知识库检索
 */
async function webSearch(query: string): Promise<string[]> {
  const apiKey = process.env.TAVILY_API_KEY

  if (!apiKey) {
    console.warn('[Research] TAVILY_API_KEY not set, falling back to knowledge base')
    return knowledgeSearch(query)
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        max_results: 5,
        include_answer: true,
      }),
    })

    if (!res.ok) throw new Error(`Tavily error: ${res.status}`)

    const data = await res.json()
    const snippets = data.results?.map((r: { title?: string; content?: string; url?: string }) =>
      `[${r.title ?? 'Untitled'}](${r.url ?? ''}): ${r.content ?? ''}`
    ) ?? []

    if (data.answer) {
      snippets.unshift(`AI Answer: ${data.answer}`)
    }

    return snippets
  } catch (err) {
    console.error('[Research] Search failed:', err)
    return knowledgeSearch(query)
  }
}

/**
 * 本地知识库检索
 */
async function knowledgeSearch(query: string): Promise<string[]> {
  const embedding = await embedText(query)
  const { data } = await supabaseAdmin.rpc('match_knowledge', {
    query_embedding: embedding,
    match_count: 5,
  })
  return (data as Array<{ content: string; title?: string }>)?.map(
    (d) => `[Knowledge] ${d.title ?? ''}: ${d.content}`,
  ) ?? []
}

/**
 * Research Agent: 对单个任务进行研究和分析
 */
export async function executeResearch(
  taskTitle: string,
  goalContext: string,
): Promise<ResearchResult> {
  // Step 1: 搜索资料
  const searchResults = await webSearch(`${taskTitle} ${goalContext}`)
  const searchText = searchResults.join('\n\n')

  // Step 2: 搜索本地知识库补充
  const knowledgeResults = await knowledgeSearch(taskTitle)
  const allContext = [searchText, ...knowledgeResults].join('\n\n')

  // Step 3: LLM 分析
  const prompt = buildPrompt(
    {
      role: prompts.research.role,
      task: `${prompts.research.task}\n\n研究主题：${taskTitle}\n项目背景：${goalContext}`,
      outputFormat: prompts.research.outputFormat,
      constraints: prompts.research.constraints,
    },
    `已收集的资料：\n${allContext}`,
  )

  const result = await callLLMJSON<ResearchResult>([
    { role: 'system', content: prompt },
    { role: 'user', content: `请分析"${taskTitle}"的相关资料并输出研究结果。` },
  ])

  return result
}
