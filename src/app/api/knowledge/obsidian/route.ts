import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { embedText, chunkText } from '@/lib/rag'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const files = formData.getAll('files') as File[]
  const sourceId = formData.get('source_id') as string

  if (!files.length || !sourceId) {
    return NextResponse.json({ error: 'Missing files or source_id' }, { status: 400 })
  }

  let totalChunks = 0

  for (const file of files) {
    const text = await file.text()
    const chunks = await chunkText(text)

    for (const chunk of chunks) {
      const embedding = await embedText(chunk)
      await supabaseAdmin.from('knowledge_chunks').insert({
        source_id: sourceId,
        content: chunk,
        embedding,
        metadata: { filename: file.name },
      })
      totalChunks++
    }
  }

  // 更新同步时间
  await supabaseAdmin
    .from('knowledge_sources')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', sourceId)

  return NextResponse.json({ success: true, chunks: totalChunks })
}
