// ============================================================
// AItodo 统一 LLM Router
// 所有 LLM 调用统一通过此模块
// ============================================================

import OpenAI from 'openai'

interface LLMConfig {
  model: string
  temperature?: number
  maxTokens?: number
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const DEFAULT_CONFIG: LLMConfig = {
  model: process.env.LLM_MODEL || 'deepseek-chat',
  temperature: 0.3,
  maxTokens: 2000,
}

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is required. Set it in your environment variables.',
      )
    }
    _client = new OpenAI({
      apiKey,
      baseURL: process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1',
    })
  }
  return _client
}

/**
 * 统一的 LLM 调用接口
 * 当前使用 DeepSeek，可切换为 OpenAI / Claude 等
 */
export async function callLLM(
  messages: ChatMessage[],
  config: Partial<LLMConfig> = {},
): Promise<string> {
  const merged = { ...DEFAULT_CONFIG, ...config }
  const client = getClient()

  const res = await client.chat.completions.create({
    model: merged.model,
    messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
    temperature: merged.temperature,
    max_tokens: merged.maxTokens,
  })

  return res.choices[0]?.message?.content ?? ''
}

/**
 * 带 JSON 模式强制解析的 LLM 调用
 */
export async function callLLMJSON<T>(
  messages: ChatMessage[],
  config: Partial<LLMConfig> = {},
): Promise<T> {
  const res = await callLLM(
    [
      ...messages,
      {
        role: 'system',
        content:
          '你必须只返回有效的 JSON 对象，不要包含 markdown 代码块标记，不要有其他文字。',
      },
    ],
    config,
  )

  // 清理可能的 markdown 包装
  const cleaned = res.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned) as T
}

export type { LLMConfig, ChatMessage }
