'use client'

import { useState, useEffect } from 'react'
import { Todo, Category } from '@/lib/types'
import { TodoItem } from '@/components/todo/TodoItem'
import { CategorySidebar } from '@/components/category/CategorySidebar'
import { VoiceButton } from '@/components/todo/VoiceButton'
import { Plus } from 'lucide-react'

export default function DashboardPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)

  // 临时用户 ID（接入 NextAuth 后替换）
  const userId = 'demo-user'

  useEffect(() => {
    fetchData()
  }, [selectedCategory])

  async function fetchData() {
    setLoading(true)
    const [todosRes, catsRes] = await Promise.all([
      fetch(`/api/todos?user_id=${userId}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`),
      fetch(`/api/categories?user_id=${userId}`),
    ])
    setTodos(await todosRes.json())
    setCategories(await catsRes.json())
    setLoading(false)
  }

  async function addTodo() {
    if (!newTitle.trim()) return
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, title: newTitle, priority: 'medium' }),
    })
    const todo = await res.json()
    setTodos((prev) => [todo, ...prev])
    setNewTitle('')
  }

  async function updateTodo(id: string, updates: Partial<Todo>) {
    await fetch('/api/todos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }

  async function deleteTodo(id: string) {
    await fetch(`/api/todos?id=${id}`, { method: 'DELETE' })
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const todayTodos = selectedCategory === 'today'
    ? todos.filter((t) => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString())
    : todos

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 侧边栏 */}
      <div className="hidden md:block w-56 shrink-0 border-r bg-white p-4">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900">AI 待办</h1>
        </div>
        <CategorySidebar
          categories={categories}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
          onAdd={() => {}}
        />
      </div>

      {/* 主内容 */}
      <main className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedCategory === 'today' ? '今日待办' : selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : '全部待办'}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">{todayTodos.filter(t => t.status !== 'done').length} 项待完成</p>
        </div>

        {/* 快速添加 */}
        <div className="mb-4 flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="添加待办，按 Enter 确认..."
            className="flex-1 rounded-xl border bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            onClick={addTodo}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-600"
          >
            <Plus size={16} /> 添加
          </button>
        </div>

        {/* 待办列表 */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {todayTodos.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-sm">没有待办事项，点击右下角麦克风语音添加</p>
              </div>
            ) : (
              todayTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} onUpdate={updateTodo} onDelete={deleteTodo} />
              ))
            )}
          </div>
        )}
      </main>

      {/* 语音按钮 */}
      <VoiceButton
        onParsed={(parsed, transcription) => {
          setNewTitle(parsed.title)
        }}
      />
    </div>
  )
}
