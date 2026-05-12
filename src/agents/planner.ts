// ============================================================
// Planner Agent — 目标拆解与任务规划
// ============================================================

import { callLLMJSON } from './llm'
import { prompts, buildPrompt } from '@/prompts'
import type { TaskType, Priority } from '@/lib/types'

export interface PlannedTask {
  title: string
  task_type: TaskType
  priority: Priority
  depends_on: string[]
}

export interface PlanResult {
  tasks: PlannedTask[]
}

/**
 * Planner Agent: 将用户目标拆解为可执行任务树
 */
export async function planGoal(
  goalTitle: string,
  goalDescription?: string,
): Promise<PlanResult> {
  const context = prompts.planner.buildContext(
    goalTitle,
    goalDescription,
  )

  const prompt = buildPrompt(
    {
      role: prompts.planner.role,
      task: prompts.planner.task,
      outputFormat: prompts.planner.outputFormat,
      constraints: prompts.planner.constraints,
    },
    context,
  )

  const result = await callLLMJSON<PlanResult>([
    { role: 'system', content: prompt },
    { role: 'user', content: goalTitle },
  ])

  return result
}

/**
 * 将任务列表保存到数据库
 */
export async function savePlanToDB(
  goalId: string,
  userId: string,
  tasks: PlannedTask[],
): Promise<void> {
  const { supabaseAdmin } = await import('@/lib/supabase')

  const inserts = tasks.map((t, i) => ({
    goal_id: goalId,
    user_id: userId,
    title: t.title,
    task_type: t.task_type,
    priority: t.priority,
    status: 'pending' as const,
    sort_order: i,
  }))

  const { error } = await supabaseAdmin.from('tasks').insert(inserts)
  if (error) throw new Error(`Failed to save plan: ${error.message}`)
}
