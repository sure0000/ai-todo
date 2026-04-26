import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { embedText, chunkText } from '@/lib/rag'

// Step 1: 重定向到 Notion OAuth
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action === 'auth') {
    const url = new URL('https://api.notion.com/v1/oauth/authorize')
    url.searchParams.set('client_id', process.env.NOTION_CLIENT_ID!)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('owner', 'user')
    url.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/knowledge/notion`)
    return NextResponse.redirect(url.toString())
  }

  // Step 2: OAuth 回调，换取 access_token
  const code = searchParams.get('code')
  const userId = searchParams.get('state')
  if (!code) return NextResponse.json({ error: 'No code' }, { status: 400 })

  const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ grant_type: 'authorization_code', code, redirect_uri: `${process.env.NEXTAUTH_URL}/api/knowledge/notion` }),
  })
  const token = await tokenRes.json()

  const { data } = await supabaseAdmin.from('knowledge_sources').insert({
    user_id: userId,
    name: 'Notion',
    type: 'notion',
    config: { access_token: token.access_token, workspace_id: token.workspace_id },
  }).select().single()

  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings/knowledge?connected=notion&source_id=${data.id}`)
}

// Step 3: 同步指定页面内容
export async function POST(req: NextRequest) {
  const { source_id, page_id } = await req.json()

  const { data: source } = await supabaseAdmin
    .from('knowledge_sources').select('config').eq('id', source_id).single()
  const token = (source?.config as Record<string, string>)?.access_token

  // 递归获取页面内容
  async function fetchBlocks(blockId: string): Promise<string> {
    const res = await fetch(`https://api.notion.com/v1/blocks/${blockId}/children`, {
      headers: { Authorization: `Bearer ${token}`, 'Notion-Version': '2022-06-28' },
    })
    const data = await res.json()
    let text = ''
    for (const block of data.results || []) {
      const richText = block[block.type]?.rich_text || []
      text += richText.map((r: { plain_text: string }) => r.plain_text).join('') + '\n'
      if (block.has_children) text += await fetchBlocks(block.id)
    }
    return text
  }

  const content = await fetchBlocks(page_id)
  const chunks = await chunkText(content)

  // 删除旧 chunks，重新写入
  await supabaseAdmin.from('knowledge_chunks').delete().eq('source_id', source_id)
  for (const chunk of chunks) {
    const embedding = await embedText(chunk)
    await supabaseAdmin.from('knowledge_chunks').insert({
      source_id, content: chunk, embedding, metadata: { page_id },
    })
  }

  await supabaseAdmin.from('knowledge_sources')
    .update({ last_synced_at: new Date().toISOString() }).eq('id', source_id)

  return NextResponse.json({ success: true, chunks: chunks.length })
}
