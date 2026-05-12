import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/agents/llm'
import { getMemoryContext, extractMemoryFromChat } from '@/agents/memory'
import { searchRelatedKnowledge } from '@/agents/knowledge'
import { prompts, buildPrompt } from '@/prompts'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/chat — AI 对话接口
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { user_id = 'demo-user', message, goal_id, history = [] } = body

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  try {
    // 获取上下文：长期记忆
    const memories = await getMemoryContext(user_id, 10)
    const memoryContext = memories.length > 0
      ? memories.map(m => `[${m.memory_type}] ${m.content}`).join('\n')
      : '暂无长期记忆'

    // 获取上下文：相关知识
    const relatedKnowledge = await searchRelatedKnowledge(message, { userId: user_id })
    const knowledgeContext = relatedKnowledge.length > 0
      ? relatedKnowledge.map(k => k.content).join('\n\n')
      : ''

    // 获取上下文：当前目标
    let goalContext = ''
    if (goal_id) {
      const { data: goal } = await supabaseAdmin
        .from('goals')
        .select('*, tasks(*)')
        .eq('id', goal_id)
        .single()
      if (goal) {
        const tasks = (goal.tasks as Array<{ title: string; status: string }> ?? [])
          .map(t => `  - ${t.title} [${t.status}]`).join('\n')
        goalContext = `当前目标：${goal.title}\n任务进度：\n${tasks}`
      }
    }

    const extraContext = [
      goalContext ? `## 当前项目\n${goalContext}` : '',
      `## 长期记忆\n${memoryContext}`,
      knowledgeContext ? `## 相关知识\n${knowledgeContext}` : '',
      `## 对话历史\n${history.slice(-6).map((m: { role: string; content: string }) => `[${m.role}] ${m.content}`).join('\n')}`,
    ].filter(Boolean).join('\n\n')

    const systemPrompt = buildPrompt(
      {
        role: prompts.chat.role,
        task: prompts.chat.task,
        outputFormat: prompts.chat.outputFormat,
        constraints: prompts.chat.constraints,
      },
      extraContext,
    )

    const response = await callLLM([
      { role: 'system', content: systemPrompt },
      ...history.slice(-6),
      { role: 'user', content: message },
    ])

    // 异步提取记忆
    extractMemoryFromChat(user_id, message, response)

    return NextResponse.json({ response })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chat failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
