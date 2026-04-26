'use client'

import { useState } from 'react'
import { Category } from '@/lib/types'
import { Plus, Settings } from 'lucide-react'

interface CategorySidebarProps {
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onAdd: () => void
}

export function CategorySidebar({ categories, selectedId, onSelect, onAdd }: CategorySidebarProps) {
  return (
    <aside className="w-56 shrink-0 space-y-1">
      <button
        onClick={() => onSelect(null)}
        className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
          selectedId === null ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        全部待办
      </button>
      <button
        onClick={() => onSelect('today')}
        className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
          selectedId === 'today' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        今日
      </button>

      <div className="pt-3">
        <div className="flex items-center justify-between px-3 pb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">分类</span>
          <button onClick={onAdd} className="text-gray-400 hover:text-indigo-500">
            <Plus size={14} />
          </button>
        </div>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              selectedId === cat.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="truncate">{cat.name}</span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  )
}
