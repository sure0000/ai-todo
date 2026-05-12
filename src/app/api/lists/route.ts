import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const DEMO_USER_ID = 'demo-user'

// GET /api/lists — 获取所有清单
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id') ?? DEMO_USER_ID

  // 同时返回每个清单的任务计数
  const { data, error } = await supabaseAdmin
    .from('lists')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 附上每个清单的待办任务数
  const listsWithCount = await Promise.all(
    (data ?? []).map(async (list) => {
      const { count } = await supabaseAdmin
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', list.id)
        .in('status', ['pending', 'in_progress'])
      return { ...list, task_count: count ?? 0 }
    }),
  )

  return NextResponse.json(listsWithCount)
}

// POST /api/lists — 创建清单
export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('lists')
    .insert({
      user_id: body.user_id ?? DEMO_USER_ID,
      name: body.name,
      color: body.color ?? '#6366f1',
      icon: body.icon ?? 'list',
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/lists — 更新清单
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body

  const { data, error } = await supabaseAdmin
    .from('lists')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/lists — 删除清单
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  const { error } = await supabaseAdmin.from('lists').delete().eq('id', id!)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
