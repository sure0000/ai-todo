'use client'

import { useState } from 'react'
import type { Task } from '@/lib/types'
import { Play, CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  pending: { label: '待执行', color: 'text-gray-400', dot: 'bg-gray-300' },
  in_progress: { label: '执行中', color: 'text-blue-500', dot: 'bg-blue-400' },
  completed: { label: '已完成', color: 'text-green-500', dot: 'bg-green-400' },
  failed: { label: '失败', color: 'text-red-500', dot: 'bg-red-400' },
}

const typeLabels: Record<string, string> = {
  research: '研究',
  write: '撰写',
  analyze: '分析',
  summarize: '总结',
  execute: '执行',
}

interface TaskCardProps {
  task: Task
  onTaskUpdated: () => void
}

export function TaskCard({ task, onTaskUpdated }: TaskCardProps) {
  const [executing, setExecuting] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const cfg = statusConfig[task.status]

  const executeTask = async () => {
    setExecuting(true)
    try {
      await fetch(`/api/tasks/${task.id}/execute`, { method: 'POST' })
      onTaskUpdated()
    } catch (err) {
      console.error(err)
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm transition-all">
      <div className="flex items-start gap-3">
        {/* Status dot */}
        <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${
              task.status === 'completed' ? 'line-through text-gray-300' : 'text-gray-800'
            }`}>
              {task.title}
            </span>
            <span className="rounded-md bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-400 font-medium border">
              {typeLabels[task.task_type] ?? task.task_type}
            </span>
            <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
          </div>

          {/* Result */}
          {task.result && expanded && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto border">
              {task.result}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {task.status === 'pending' && (
            <button
              onClick={executeTask}
              disabled={executing}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
            >
              {executing ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              {executing ? '执行中' : '执行'}
            </button>
          )}
          {task.result && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-lg p-1.5 text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors"
            >
              <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
