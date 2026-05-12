import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/goals/[id] — 获取目标详情（含任务树）
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const { data: goal, error: goalErr } = await supabaseAdmin
    .from('goals')
    .select('*')
    .eq('id', id)
    .single()

  if (goalErr) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

  const { data: tasks } = await supabaseAdmin
    .from('tasks')
    .select('*, executions:agent_executions(*)')
    .eq('goal_id', id)
    .order('sort_order', { ascending: true })

  return NextResponse.json({ ...goal, tasks: tasks ?? [] })
}

// PATCH /api/goals/[id] — 更新目标
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('goals')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
