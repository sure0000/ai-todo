'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import type { Priority, List } from '@/lib/types'

interface QuickTaskInputProps {
  lists: List[]
  defaultListId?: string
  onTaskCreated: () => void
}

export function QuickTaskInput({ lists, defaultListId, onTaskCreated }: QuickTaskInputProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [listId, setListId] = useState(defaultListId ?? '')
  const [focused, setFocused] = useState(false)
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addTask = async () => {
    if (!title.trim() || adding) return
    setAdding(true)
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        priority,
        list_id: listId || null,
      }),
    })
    setTitle('')
    setAdding(false)
    onTaskCreated()
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addTask() }
    if (e.key === 'Escape') { setFocused(false); inputRef.current?.blur() }
  }

  return (
    <div className={`rounded-xl border bg-white transition-all ${
      focused ? 'border-indigo-200 shadow-sm' : 'border-gray-200 shadow-sm'
    }`}>
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Plus size={16} className={`shrink-0 transition-colors ${focused ? 'text-indigo-400' : 'text-gray-300'}`} />
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="添加任务"
          className="flex-1 text-sm outline-none placeholder:text-gray-300 bg-transparent"
        />
        {focused && (
          <div className="flex items-center gap-2">
            {/* Priority quick select */}
            <div className="flex gap-0.5">
              {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-all ${
                    priority === p
                      ? p === 'high' ? 'bg-red-50 text-red-500 ring-1 ring-red-200'
                        : p === 'medium' ? 'bg-blue-50 text-blue-500 ring-1 ring-blue-200'
                        : 'bg-gray-50 text-gray-400 ring-1 ring-gray-200'
                      : 'text-gray-300 hover:bg-gray-50'
                  }`}
                  title={p === 'high' ? '高优先级' : p === 'medium' ? '中优先级' : '低优先级'}
                >
                  {p === 'high' ? '!!!' : p === 'medium' ? '!!' : '!'}
                </button>
              ))}
            </div>

            {/* List select */}
            {lists.length > 0 && (
              <select
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className="text-xs text-gray-400 bg-transparent border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-indigo-300"
              >
                <option value="">无清单</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            )}

            <button
              onClick={addTask}
              disabled={!title.trim() || adding}
              className="rounded-lg bg-indigo-500 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
            >
              {adding ? '...' : '添加'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
