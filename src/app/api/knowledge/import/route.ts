import { NextRequest, NextResponse } from 'next/server'
import { importKnowledge } from '@/agents/knowledge'

// POST /api/knowledge/import — 导入知识
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { user_id, source_type, source_url, title, content, tags } = body

  if (!user_id || !source_type || !content) {
    return NextResponse.json(
      { error: 'Missing required fields: user_id, source_type, content' },
      { status: 400 },
    )
  }

  try {
    const chunks = await importKnowledge({
      user_id,
      source_type,
      source_url,
      title,
      content,
      tags,
    })

    return NextResponse.json({ success: true, chunks })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Import failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
