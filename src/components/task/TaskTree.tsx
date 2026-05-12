'use client'

import type { Task } from '@/lib/types'
import { TaskCard } from './TaskCard'
import { Target } from 'lucide-react'

interface TaskTreeProps {
  tasks: Task[]
  onTaskUpdated: () => void
}

export function TaskTree({ tasks, onTaskUpdated }: TaskTreeProps) {
  const sorted = [...tasks].sort((a, b) => a.sort_order - b.sort_order)
  const completed = sorted.filter(t => t.status === 'completed').length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-gray-400" />
          <h3 className="text-sm font-medium text-gray-500">任务 ({sorted.length})</h3>
        </div>
        <span className="text-xs text-gray-400">{completed} 已完成</span>
      </div>

      <div className="space-y-2">
        {sorted.map((task) => (
          <TaskCard key={task.id} task={task} onTaskUpdated={onTaskUpdated} />
        ))}
      </div>
    </div>
  )
}
