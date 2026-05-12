'use client'

import { useState } from 'react'
import type { List } from '@/lib/types'
import {
  Inbox, CalendarDays, Sparkles, Plus, X, Check,
  Palette, ChevronRight, Hash,
} from 'lucide-react'

export type ViewFilter = 'inbox' | 'today' | 'important' | 'list'

interface SidebarProps {
  lists: List[]
  activeView: ViewFilter
  activeListId: string | null
  onViewChange: (view: ViewFilter) => void
  onListSelect: (listId: string) => void
}

const LIST_COLORS = [
  '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#84cc16',
  '#eab308', '#f97316', '#ef4444', '#ec4899', '#8b5cf6',
]

export function Sidebar({ lists, activeView, activeListId, onViewChange, onListSelect }: SidebarProps) {
  const [showAddList, setShowAddList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListColor, setNewListColor] = useState(LIST_COLORS[0])
  const [adding, setAdding] = useState(false)

  // Count tasks per view (passed from parent via list.task_count)
  const inboxCount = lists.reduce((sum, l) => sum + (l as any).task_count, 0)

  const addList = async () => {
    if (!newListName.trim() || adding) return
    setAdding(true)
    await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newListName.trim(), color: newListColor }),
    })
    setNewListName('')
    setNewListColor(LIST_COLORS[0])
    setShowAddList(false)
    setAdding(false)
    window.location.reload()
  }

  const navItems = [
    { key: 'inbox' as const, icon: Inbox, label: '收集箱' },
    { key: 'today' as const, icon: CalendarDays, label: '今天' },
    { key: 'important' as const, icon: Sparkles, label: '重要' },
  ]

  return (
    <aside className="hidden md:flex md:w-56 lg:w-60 flex-col border-r bg-white shrink-0 select-none">
      {/* App header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-xs">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="text-sm font-bold text-gray-800 tracking-tight">AItodo</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col px-2 pb-4 overflow-y-auto">
        {/* Smart lists */}
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.key && !activeListId
            return (
              <button
                key={item.key}
                onClick={() => { onViewChange(item.key) }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-indigo-500' : 'text-gray-400'} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.key === 'inbox' && inboxCount > 0 && (
                  <span className="text-xs text-gray-400 font-medium">{inboxCount}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Lists section */}
        <div className="mt-6 mb-2">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">清单</span>
            <button
              onClick={() => setShowAddList(!showAddList)}
              className="rounded p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Add list form */}
          {showAddList && (
            <div className="mx-2 mb-2 rounded-lg border bg-gray-50 p-2.5 space-y-2">
              <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addList()}
                placeholder="清单名称"
                className="w-full rounded-md border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-300"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {LIST_COLORS.slice(0, 6).map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewListColor(color)}
                      className={`h-5 w-5 rounded-full flex items-center justify-center transition-transform ${
                        newListColor === color ? 'scale-125 ring-2 ring-offset-1 ring-gray-300' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {newListColor === color && <Check size={10} className="text-white" />}
                    </button>
                  ))}
                </div>
                <button
                  onClick={addList}
                  disabled={!newListName.trim()}
                  className="rounded bg-indigo-500 px-2 py-1 text-[11px] text-white hover:bg-indigo-600 disabled:opacity-50"
                >
                  添加
                </button>
              </div>
            </div>
          )}

          {/* List items */}
          <div className="space-y-0.5">
            {lists.map((list) => {
              const isActive = activeListId === list.id
              const taskCount = (list as any).task_count ?? 0
              return (
                <button
                  key={list.id}
                  onClick={() => {
                    onViewChange('list')
                    onListSelect(list.id)
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: list.color }}
                  />
                  <span className="flex-1 text-left truncate">{list.name}</span>
                  {taskCount > 0 && (
                    <span className="text-xs text-gray-400">{taskCount}</span>
                  )}
                </button>
              )
            })}
            {lists.length === 0 && !showAddList && (
              <p className="px-3 text-xs text-gray-300 py-2">暂无清单，点击 + 创建</p>
            )}
          </div>
        </div>
      </nav>
    </aside>
  )
}
