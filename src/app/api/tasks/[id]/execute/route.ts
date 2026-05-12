import { NextRequest, NextResponse } from 'next/server'
import { executeResearch } from '@/agents/research'
import { generateReport } from '@/agents/writer'
import { importKnowledge } from '@/agents/knowledge'
import { saveMemory } from '@/agents/memory'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/tasks/[id]/execute — 执行任务
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // 获取任务
  const { data: task, error: taskErr } = await supabaseAdmin
    .from('tasks')
    .select('*, goal:goals(*)')
    .eq('id', id)
    .single()

  if (taskErr || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  // 创建执行记录
  const { data: execution, error: execErr } = await supabaseAdmin
    .from('agent_executions')
    .insert({
      task_id: id,
      agent_type: task.task_type === 'write' ? 'writer' : 'research',
      status: 'running',
      input: JSON.stringify({ task_title: task.title, goal: task.goal?.title }),
    })
    .select()
    .single()

  if (execErr) {
    return NextResponse.json({ error: execErr.message }, { status: 500 })
  }

  try {
    const goalTitle = task.goal?.title ?? ''
    let output: string

    // 更新任务状态
    await supabaseAdmin.from('tasks').update({ status: 'in_progress' }).eq('id', id)

    if (task.task_type === 'write') {
      // Writer Agent — 生成报告
      const research = await executeResearch(task.title, goalTitle)
      output = await generateReport(task.title, JSON.stringify(research, null, 2))
    } else {
      // Research Agent — 研究与分析
      const result = await executeResearch(task.title, goalTitle)
      output = JSON.stringify(result, null, 2)

      // 自动将研究结果导入知识库
      await importKnowledge({
        user_id: task.goal?.user_id ?? 'demo-user',
        source_type: 'web',
        title: `${task.title} - 研究结果`,
        content: output,
        tags: [goalTitle, task.title, 'research'],
        metadata: { task_id: id, goal_id: task.goal_id },
      })
    }

    // 更新任务结果
    await supabaseAdmin.from('tasks').update({
      status: 'completed',
      result: output,
    }).eq('id', id)

    // 更新执行记录
    await supabaseAdmin.from('agent_executions').update({
      status: 'completed',
      output,
      completed_at: new Date().toISOString(),
    }).eq('id', execution.id)

    // 保存记忆
    await saveMemory({
      user_id: task.goal?.user_id ?? 'demo-user',
      memory_type: 'context',
      content: `完成了任务"${task.title}"（${task.task_type}），结果已保存`,
      importance_score: 0.6,
      tags: ['execution', goalTitle, task.title],
    })

    return NextResponse.json({ task_id: id, output, agent_type: task.task_type })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Execution failed'

    await supabaseAdmin.from('tasks').update({
      status: 'failed',
      result: message,
    }).eq('id', id)

    await supabaseAdmin.from('agent_executions').update({
      status: 'failed',
      output: message,
      completed_at: new Date().toISOString(),
    }).eq('id', execution.id)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
