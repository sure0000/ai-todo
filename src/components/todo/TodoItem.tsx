'use client'

import { useState } from 'react'
import { Todo, Priority, TodoStatus } from '@/lib/types'
import { Check, Trash2, ChevronDown, Sparkles } from 'lucide-react'

interface TodoItemProps {
  todo: Todo
  onUpdate: (id: string, updates: Partial<Todo>) => void
  onDelete: (id: string) => void
}

const priorityColors: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
}

const priorityLabels: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

export function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)

  const isDone = todo.status === 'done'

  const toggleDone = () => {
    onUpdate(todo.id, { status: isDone ? 'todo' : 'done' })
  }

  const fetchSuggestion = async () => {
    setLoadingSuggestion(true)
    const res = await fetch('/api/ai/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todo_id: todo.id, user_id: todo.user_id }),
    })
    const data = await res.json()
    setSuggestion(data.suggestion)
    setLoadingSuggestion(false)
  }

  return (
    <div className={`group rounded-xl border bg-white p-4 shadow-sm transition-all ${isDone ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {/* 完成按钮 */}
        <button
          onClick={toggleDone}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            isDone ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 hover:border-indigo-400'
          }`}
        >
          {isDone && <Check size={12} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {todo.title}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[todo.priority]}`}>
              {priorityLabels[todo.priority]}
            </span>
            {todo.category && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: todo.category.color }}
              >
                {todo.category.name}
              </span>
            )}
            {todo.due_date && (
              <span className="text-xs text-gray-400">
                {new Date(todo.due_date).toLocaleDateString('zh-CN')}
              </span>
            )}
          </div>

          {todo.description && (
            <p className="mt-1 text-xs text-gray-500 truncate">{todo.description}</p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => { setExpanded(!expanded); if (!suggestion) fetchSuggestion() }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-500"
            title="AI 建议"
          >
            <Sparkles size={15} />
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <ChevronDown size={15} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* AI 建议展开区 */}
      {expanded && (
        <div className="mt-3 rounded-lg bg-indigo-50 p-3">
          {loadingSuggestion ? (
            <p className="text-xs text-indigo-400 animate-pulse">AI 正在分析...</p>
          ) : (
            <p className="text-xs text-indigo-700 whitespace-pre-wrap">{suggestion}</p>
          )}
        </div>
      )}
    </div>
  )
}
