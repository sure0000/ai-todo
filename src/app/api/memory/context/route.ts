import { NextRequest, NextResponse } from 'next/server'
import { getMemoryContext, saveMemory } from '@/agents/memory'

// GET /api/memory/context — 获取用户长期记忆
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id') ?? 'demo-user'
  const limit = parseInt(searchParams.get('limit') ?? '20')

  try {
    const memories = await getMemoryContext(userId, limit)
    return NextResponse.json({ memories })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get memory'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/memory/context — 保存记忆
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { user_id, memory_type, content, importance_score, tags } = body

  if (!user_id || !memory_type || !content) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    )
  }

  try {
    await saveMemory({ user_id, memory_type, content, importance_score, tags })
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save memory'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
