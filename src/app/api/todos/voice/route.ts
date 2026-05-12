import { NextRequest, NextResponse } from 'next/server'
import { callLLMJSON } from '@/agents/llm'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/todos/voice — 语音输入，解析并创建目标
export async function POST(req: NextRequest) {
  const { text } = await req.json()

  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  // DeepSeek 解析语音输入为结构化目标
  const parsed = await callLLMJSON<{ title: string; description: string | null }>(
    [
      {
        role: 'system',
        content: `从用户语音输入中提取目标信息，返回 JSON：
{
  "title": "目标标题（简洁）",
  "description": "补充说明或null"
}
只返回 JSON，不要其他内容。`,
      },
      { role: 'user', content: text },
    ],
  )

  // 自动创建目标
  const { data: goal } = await supabaseAdmin
    .from('goals')
    .insert({
      user_id: 'demo-user',
      title: parsed.title,
      description: parsed.description,
      status: 'active',
    })
    .select()
    .single()

  return NextResponse.json({ transcription: text, goal })
}
