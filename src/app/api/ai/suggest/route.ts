import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { searchKnowledge } from '@/lib/rag'
import { supabaseAdmin } from '@/lib/supabase'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
})

export async function POST(req: NextRequest) {
  const { todo_id, user_id } = await req.json()

  // 获取待办详情
  const { data: todo } = await supabaseAdmin
    .from('todos')
    .select('*, category:categories(*)')
    .eq('id', todo_id)
    .single()

  if (!todo) return NextResponse.json({ error: 'Todo not found' }, { status: 404 })

  let context = ''

  // 如果分类绑定了知识库，检索相关内容
  if (todo.category?.knowledge_source_id) {
    const chunks = await searchKnowledge(todo.title, todo.category.knowledge_source_id)
    context = chunks.map((c) => c.content).join('\n\n')
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `你是一个任务助手。根据待办事项和相关知识库内容，给出简洁实用的建议。
${context ? `\n相关知识库内容：\n${context}` : ''}`,
    },
    {
      role: 'user',
      content: `待办：${todo.title}\n${todo.description ? `说明：${todo.description}` : ''}
请给出：1) 执行建议 2) 可能遇到的问题 3) 相关资源（如有）`,
    },
  ]

  const res = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages,
    max_tokens: 500,
  })

  return NextResponse.json({ suggestion: res.choices[0].message.content })
}
