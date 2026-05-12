'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Goal, List } from '@/lib/types'
import { Sidebar } from '@/components/layout/Sidebar'
import { TaskTree } from '@/components/task/TaskTree'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { Sparkles, MessageCircle, ChevronLeft, Loader2, Target } from 'lucide-react'

export function GoalDetail() {
  const params = useParams()
  const router = useRouter()
  const goalId = params.id as string

  const [goal, setGoal] = useState<Goal | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [planning, setPlanning] = useState(false)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    if (goalId) {
      fetchGoal()
      fetchGoals()
      fetchLists()
    }
  }, [goalId])

  async function fetchGoal() {
    setLoading(true)
    const res = await fetch(`/api/goals/${goalId}`)
    if (res.ok) setGoal(await res.json())
    setLoading(false)
  }

  async function fetchGoals() {
    const res = await fetch('/api/goals?user_id=demo-user')
    if (res.ok) setGoals(await res.json())
  }

  async function fetchLists() {
    const res = await fetch('/api/lists?user_id=demo-user')
    if (res.ok) setLists(await res.json())
  }

  const triggerPlan = async () => {
    if (!goal) return
    setPlanning(true)
    try {
      const res = await fetch(`/api/goals/${goal.id}/plan`, { method: 'POST' })
      if (!res.ok) throw new Error('Planning failed')
      await fetchGoal()
    } catch (err) {
      console.error(err)
    } finally {
      setPlanning(false)
    }
  }

  const onTaskUpdated = async () => { await fetchGoal() }

  if (loading && !goal) {
    return (
      <div className="min-h-screen bg-[#f6f8fa] flex items-center justify-center">
        <Loader2 size={28} className="text-gray-300 animate-spin" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="min-h-screen bg-[#f6f8fa] flex flex-col items-center justify-center gap-3">
        <Target size={36} className="text-gray-200" />
        <p className="text-sm text-gray-400">目标未找到</p>
        <button onClick={() => router.push('/')} className="text-sm text-indigo-500 hover:text-indigo-600">返回首页</button>
      </div>
    )
  }

  const completedTasks = goal.tasks?.filter(t => t.status === 'completed').length ?? 0
  const totalTasks = goal.tasks?.length ?? 0

  return (
    <div className="flex min-h-screen bg-[#f6f8fa]">
      <Sidebar
        lists={lists}
        activeView="inbox"
        activeListId={null}
        onViewChange={() => {}}
        onListSelect={() => {}}
      />

      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-3xl px-5 md:px-8 py-6 md:py-7">
          {/* Back */}
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-5 transition-colors"
          >
            <ChevronLeft size={14} /> 返回
          </button>

          {/* Goal header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <Target size={16} className="text-indigo-500" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">{goal.title}</h1>
                {goal.description && <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>}
              </div>
            </div>

            <button
              onClick={triggerPlan}
              disabled={planning}
              className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors shrink-0 shadow-sm"
            >
              {planning ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {planning ? '规划中...' : 'AI 规划'}
            </button>
          </div>

          {/* Progress */}
          {totalTasks > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                <span>进度</span>
                <span>{completedTasks}/{totalTasks}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500 transition-all duration-500"
                  style={{ width: `${(completedTasks / totalTasks) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Tasks */}
          {totalTasks > 0 ? (
            <TaskTree tasks={goal.tasks!} onTaskUpdated={onTaskUpdated} />
          ) : (
            <div className="bg-white rounded-xl border shadow-sm py-16 text-center">
              <Sparkles size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-400 mb-1">点击「AI 规划」拆解任务</p>
              <p className="text-xs text-gray-300">AI 将自动生成可执行的任务树</p>
            </div>
          )}
        </div>
      </main>

      {/* Chat */}
      {showChat && <ChatPanel goalId={goal.id} onClose={() => setShowChat(false)} />}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg hover:bg-indigo-600 hover:shadow-xl transition-all"
        >
          <MessageCircle size={20} />
        </button>
      )}
    </div>
  )
}
