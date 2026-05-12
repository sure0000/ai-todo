'use client'

import { useState } from 'react'
import type { Task } from '@/lib/types'
import { Check, Trash2, Calendar } from 'lucide-react'

const priorityStyles = {
  high: { color: '#ef4444', label: '高' },
  medium: { color: '#3b82f6', label: '中' },
  low: { color: '#9ca3af', label: '低' },
}

interface TaskRowProps {
  task: Task
  onUpdate: () => void
}

export function TaskRow({ task, onUpdate }: TaskRowProps) {
  const [updating, setUpdating] = useState(false)
  const isDone = task.status === 'completed'
  const pStyle = priorityStyles[task.priority]

  const toggleDone = async () => {
    setUpdating(true)
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, status: isDone ? 'pending' : 'completed' }),
    })
    setUpdating(false)
    onUpdate()
  }

  const deleteTask = async () => {
    await fetch(`/api/tasks?id=${task.id}`, { method: 'DELETE' })
    onUpdate()
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    const today = new Date()
    const tomorrow = new Date(Date.now() + 86400000)
    if (date.toDateString() === today.toDateString()) return '今天'
    if (date.toDateString() === tomorrow.toDateString()) return '明天'
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date(new Date().toDateString()) && !isDone

  return (
    <div className={`group flex items-center gap-2.5 px-5 py-2.5 transition-colors hover:bg-gray-50 ${
      isDone ? 'opacity-40' : ''
    }`}>
      {/* Priority indicator - left edge colored dot (TickTick style) */}
      {!isDone && (
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: pStyle.color }}
        />
      )}
      {isDone && <span className="w-2 shrink-0" />}

      {/* Checkbox */}
      <button
        onClick={toggleDone}
        disabled={updating}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          isDone
            ? 'border-green-500 bg-green-500'
            : 'border-gray-300 hover:border-green-400'
        }`}
      >
        {isDone && <Check size={11} className="text-white stroke-[3]" />}
      </button>

      {/* Title */}
      <span className={`flex-1 text-sm min-w-0 truncate ${
        isDone ? 'line-through text-gray-300' : 'text-gray-800'
      }`}>
        {task.title}
      </span>

      {/* List badge */}
      {task.list && !isDone && (
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium"
          style={{
            backgroundColor: task.list.color + '18',
            color: task.list.color,
          }}
        >
          {task.list.name}
        </span>
      )}

      {/* Goal badge */}
      {task.goal_id && !isDone && (
        <span className="shrink-0 rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] text-indigo-500 font-medium">
          目标
        </span>
      )}

      {/* Due date */}
      {task.due_date && (
        <span className={`flex items-center gap-1 shrink-0 text-xs ${
          isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'
        }`}>
          <Calendar size={12} />
          {formatDate(task.due_date)}
        </span>
      )}

      {/* Actions - visible on hover */}
      <button
        onClick={deleteTask}
        className="shrink-0 rounded-lg p-1 text-gray-200 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-50 transition-all"
        title="删除"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
