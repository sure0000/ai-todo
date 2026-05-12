'use client'

import Link from 'next/link'
import type { Goal } from '@/lib/types'
import { ChevronRight, Target } from 'lucide-react'

interface GoalCardProps {
  goal: Goal
}

export function GoalCard({ goal }: GoalCardProps) {
  const tasks = (goal.tasks as Array<{ status: string }> | undefined) ?? []
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const totalTasks = tasks.length
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="group block rounded-xl border bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          progress === 1 && totalTasks > 0
            ? 'bg-green-50'
            : 'bg-indigo-50'
        }`}>
          <Target size={16} className={progress === 1 && totalTasks > 0 ? 'text-green-500' : 'text-indigo-500'} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">{goal.title}</span>
            {goal.description && (
              <span className="text-xs text-gray-400 truncate hidden sm:inline">· {goal.description}</span>
            )}
          </div>

          {totalTasks > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 max-w-32 h-1 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500 transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-gray-400">
                {completedTasks}/{totalTasks}
              </span>
            </div>
          )}

          {totalTasks === 0 && (
            <p className="text-[11px] text-gray-300 mt-1">点击 AI 规划拆解任务</p>
          )}
        </div>

        <ChevronRight size={15} className="text-gray-200 group-hover:text-indigo-300 shrink-0 transition-colors" />
      </div>
    </Link>
  )
}
