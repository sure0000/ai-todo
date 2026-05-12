import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const DEMO_USER_ID = 'demo-user'

// GET /api/tasks — 获取任务列表（支持过滤）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id') ?? DEMO_USER_ID
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const listId = searchParams.get('list_id')
  const goalId = searchParams.get('goal_id')
  const dueDate = searchParams.get('due_date')
  const search = searchParams.get('search')

  // 默认只取独立任务（goal_id IS NULL）
  // 除非显式传了 goal_id
  const isStandalone = goalId === undefined

  let query = supabaseAdmin
    .from('tasks')
    .select('*, list:lists(*)')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (isStandalone) {
    query = query.is('goal_id', null).eq('user_id', userId)
  } else if (goalId) {
    query = query.eq('goal_id', goalId)
  }

  if (listId) query = query.eq('list_id', listId)
  if (status) {
    if (status === 'pending') query = query.in('status', ['pending', 'in_progress'])
    else query = query.eq('status', status)
  }
  if (priority) query = query.eq('priority', priority)
  if (dueDate === 'today') {
    const today = new Date().toISOString().slice(0, 10)
    query = query.gte('due_date', today).lt('due_date', new Date(Date.now() + 86400000).toISOString().slice(0, 10))
  }
  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/tasks — 创建独立任务
export async function POST(req: NextRequest) {
  const body = await req.json()
  const userId = body.user_id ?? DEMO_USER_ID

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .insert({
      user_id: userId,
      list_id: body.list_id ?? null,
      title: body.title,
      task_type: 'execute',
      priority: body.priority ?? 'medium',
      due_date: body.due_date ?? null,
      tags: body.tags ?? [],
      status: 'pending',
      sort_order: body.sort_order ?? 0,
    })
    .select('*, list:lists(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/tasks — 更新任务
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select('*, list:lists(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/tasks — 删除任务
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id!)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
