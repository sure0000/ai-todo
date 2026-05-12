import { NextRequest, NextResponse } from 'next/server'
import { planGoal, savePlanToDB } from '@/agents/planner'
import { supabaseAdmin } from '@/lib/supabase'
import { saveMemory } from '@/agents/memory'

// POST /api/goals/[id]/plan — AI 自动拆解目标为任务
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // 获取目标
  const { data: goal, error } = await supabaseAdmin
    .from('goals')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !goal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  }

  try {
    // Planner Agent 拆解
    const plan = await planGoal(goal.title, goal.description)

    // 保存到数据库
    await savePlanToDB(id, goal.user_id, plan.tasks)

    // 保存记忆
    await saveMemory({
      user_id: goal.user_id,
      memory_type: 'context',
      content: `为目标"${goal.title}"生成了 ${plan.tasks.length} 个子任务：${plan.tasks.map(t => t.title).join('、')}`,
      importance_score: 0.7,
      tags: ['plan', goal.title],
    })

    return NextResponse.json({ tasks: plan.tasks, total: plan.tasks.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Planning failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
