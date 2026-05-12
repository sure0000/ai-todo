import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

function getUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('supabaseUrl is required. Set NEXT_PUBLIC_SUPABASE_URL env var.')
  return url
}

function getAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('supabaseAnonKey is required. Set NEXT_PUBLIC_SUPABASE_ANON_KEY env var.')
  return key
}

function getServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('supabaseServiceKey is required. Set SUPABASE_SERVICE_ROLE_KEY env var.')
  return key
}

/** 公开客户端（匿名权限） */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabase) {
      _supabase = createClient(getUrl(), getAnonKey())
    }
    return Reflect.get(_supabase, prop)
  },
})

/** 管理员客户端（service role，跳过 RLS） */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createClient(getUrl(), getServiceKey())
    }
    return Reflect.get(_supabaseAdmin, prop)
  },
})
