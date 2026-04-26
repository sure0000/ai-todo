import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
})

export async function POST(req: NextRequest) {
  const { text } = await req.json()

  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  // DeepSeek 解析结构化任务（不支持 Whisper，语音转文字在前端处理）
  const parsed = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: `从用户输入中提取待办事项信息，返回 JSON 格式：
{
  "title": "任务标题",
  "due_date": "ISO日期字符串或null",
  "priority": "high|medium|low",
  "category_hint": "可能的分类名称或null",
  "description": "补充说明或null"
}
只返回 JSON，不要其他内容。`,
      },
      { role: 'user', content: text },
    ],
  })

  try {
    const content = parsed.choices[0].message.content!
    const json = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim())
    return NextResponse.json({ transcription: text, parsed: json })
  } catch {
    return NextResponse.json({ transcription: text, parsed: { title: text, priority: 'medium', due_date: null, category_hint: null, description: null } })
  }
}

