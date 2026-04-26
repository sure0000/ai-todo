import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const audio = formData.get('audio') as File

  if (!audio) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

  // 1. Whisper 语音转文字
  const transcription = await openai.audio.transcriptions.create({
    file: audio,
    model: 'whisper-1',
    language: 'zh',
  })

  // 2. GPT 解析结构化任务
  const parsed = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `从用户语音中提取待办事项信息，返回 JSON 格式：
{
  "title": "任务标题",
  "due_date": "ISO日期字符串或null",
  "priority": "high|medium|low",
  "category_hint": "可能的分类名称或null",
  "description": "补充说明或null"
}`,
      },
      { role: 'user', content: transcription.text },
    ],
    response_format: { type: 'json_object' },
  })

  return NextResponse.json({
    transcription: transcription.text,
    parsed: JSON.parse(parsed.choices[0].message.content!),
  })
}
