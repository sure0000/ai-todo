// ============================================================
// Writer Agent — 输出报告、文章等结构化内容
// ============================================================

import { callLLM } from './llm'
import { prompts, buildPrompt } from '@/prompts'

/**
 * Writer Agent: 根据研究结果生成结构化输出
 */
export async function generateReport(
  taskTitle: string,
  researchResult: string,
  outputType: 'report' | 'article' | 'prd' = 'report',
): Promise<string> {
  const prompt = buildPrompt(
    {
      role: prompts.writer.role,
      task: `基于研究结果生成${outputType === 'report' ? '研究报告' : outputType === 'article' ? '文章' : '产品需求文档'}。`,
      outputFormat: prompts.writer.outputFormat,
      constraints: prompts.writer.constraints,
    },
    `任务主题：${taskTitle}\n\n研究结果：\n${researchResult}`,
  )

  const result = await callLLM([
    { role: 'system', content: prompt },
    {
      role: 'user',
      content: `请根据"${taskTitle}"的研究结果，生成一份结构化的${outputType === 'report' ? '研究报告' : outputType === 'article' ? '文章' : '产品需求文档'}。`,
    },
  ])

  return result
}
