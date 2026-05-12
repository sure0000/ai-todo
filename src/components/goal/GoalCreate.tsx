'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Target } from 'lucide-react'

export function GoalCreate() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const createGoal = async () => {
    if (!title.trim()) return
    setLoading(true)

    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined }),
    })
    const goal = await res.json()
    setTitle('')
    setDescription('')
    setExpanded(false)
    setLoading(false)
    router.push(`/goals/${goal.id}`)
  }

  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white/50 hover:bg-white transition-all">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Plus size={16} className="text-gray-300" />
          <span>创建研究目标</span>
          <Target size={14} className="text-gray-200 ml-auto" />
        </button>
      ) : (
        <div className="p-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && createGoal()}
            placeholder="例如：分析 AI 数据治理市场..."
            className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-100 transition-all"
            disabled={loading}
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="补充背景信息（可选）..."
            rows={2}
            className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-100 transition-all resize-none"
            disabled={loading}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={createGoal}
              disabled={!title.trim() || loading}
              className="rounded-lg bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
            >
              {loading ? '创建中...' : '创建目标'}
            </button>
            <button
              onClick={() => { setExpanded(false); setTitle(''); setDescription('') }}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
