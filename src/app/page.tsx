'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Sidebar, type ViewFilter } from '@/components/layout/Sidebar'
import { QuickTaskInput } from '@/components/task/QuickTaskInput'
import { TaskRow } from '@/components/task/TaskRow'
import { GoalCreate } from '@/components/goal/GoalCreate'
import { GoalCard } from '@/components/goal/GoalCard'
import type { Task, List, Goal } from '@/lib/types'
import {
  Inbox, CalendarDays, Sparkles, Target,
  ChevronDown, ChevronRight, Search, X, ListTodo,
} from 'lucide-react'

const viewMeta: Record<string, { icon: typeof Inbox; title: string }> = {
  inbox: { icon: Inbox, title: '收集箱' },
  today: { icon: CalendarDays, title: '今天' },
  important: { icon: Sparkles, title: '重要' },
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewFilter>('inbox')
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [showGoals, setShowGoals] = useState(true)

  // Build URL based on current view
  const buildUrl = useCallback(() => {
    const p = new URLSearchParams({ user_id: 'demo-user' })

    if (view === 'today') {
      p.set('due_date', 'today')
      p.set('status', 'pending')
    } else if (view === 'important') {
      p.set('priority', 'high')
      p.set('status', 'pending')
    } else if (view === 'list' && activeListId) {
      p.set('list_id', activeListId)
    }
    return `/api/tasks?${p}`
  }, [view, activeListId])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [tasksRes, listsRes, goalsRes] = await Promise.all([
      fetch(buildUrl()),
      fetch('/api/lists?user_id=demo-user'),
      fetch('/api/goals?user_id=demo-user'),
    ])
    if (tasksRes.ok) setTasks(await tasksRes.json())
    if (listsRes.ok) setLists(await listsRes.json())
    if (goalsRes.ok) setGoals(await goalsRes.json())
    setLoading(false)
  }, [buildUrl])

  useEffect(() => { fetchData() }, [fetchData])

  const handleViewChange = (v: ViewFilter) => {
    setView(v)
    if (v !== 'list') setActiveListId(null)
  }

  // Current view info
  const meta = view === 'list' && activeListId
    ? { title: lists.find(l => l.id === activeListId)?.name ?? '清单', icon: Target as typeof Inbox }
    : viewMeta[view] ?? { title: '收集箱', icon: Inbox }

  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const Icon = meta.icon

  return (
    <div className="flex min-h-screen bg-[#f6f8fa]">
      {/* Sidebar */}
      <Sidebar
        lists={lists}
        activeView={view}
        activeListId={activeListId}
        onViewChange={handleViewChange}
        onListSelect={setActiveListId}
      />

      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-20 flex md:hidden items-center gap-3 border-b bg-white px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-xs">
          <span className="text-white text-xs font-bold">A</span>
        </div>
        <span className="text-sm font-bold text-gray-800">AItodo</span>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14">
        <div className="mx-auto max-w-3xl px-5 md:px-8 py-6 md:py-7">
          {/* Header row */}
          <div className="flex items-center gap-3 mb-5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              view === 'today' ? 'bg-blue-50'
              : view === 'important' ? 'bg-amber-50'
              : 'bg-gray-50'
            }`}>
              <Icon size={16} className={
                view === 'today' ? 'text-blue-500'
                : view === 'important' ? 'text-amber-500'
                : 'text-gray-500'
              } />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">{meta.title}</h1>
              {tasks.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {pendingTasks.length} 项待办
                  {completedCount > 0 && ` · ${completedCount} 已完成`}
                </p>
              )}
            </div>
          </div>

          {/* Quick add */}
          <div className="mb-4">
            <QuickTaskInput
              lists={lists}
              defaultListId={activeListId ?? undefined}
              onTaskCreated={fetchData}
            />
          </div>

          {/* Task list */}
          {loading ? (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden divide-y divide-gray-50">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 px-5 py-3">
                  <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-xl border shadow-sm py-16 text-center">
              <ListTodo size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-400">
                {view === 'today' ? '今天没有待办'
                : view === 'important' ? '没有重要任务'
                : '还没有任务'}
              </p>
              <p className="text-xs text-gray-300 mt-1">在上方添加新任务</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} onUpdate={fetchData} />
                ))}
              </div>
            </div>
          )}

          {/* Goals section (collapsible) — only on inbox view */}
          {view === 'inbox' && !activeListId && (
            <div className="mt-8 border-t pt-6">
              <button
                onClick={() => setShowGoals(!showGoals)}
                className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider"
              >
                {showGoals ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                研究目标 ({goals.length})
              </button>

              {showGoals && (
                <div className="space-y-3">
                  <GoalCreate />
                  {goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
