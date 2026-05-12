# AItodo — Personal AI Execution OS

## Architecture Overview

```
Goal → Planner Agent → Task Tree → Research Agent → Knowledge Base → Writer Agent → Output
                                                                          ↓
                                                                   Memory System
                                                                          ↓
                                                                   Chat / Follow-up
```

## Key Principles

- **Agent System**: 5 agents (Planner, Research, Writer, Knowledge, Memory) — modular, pluggable
- **Unified LLM Router**: All calls via `src/agents/llm.ts` — swappable between DeepSeek/OpenAI/Claude
- **Configurable Prompts**: All agent prompts in `src/prompts/index.ts`
- **Phase 1 Scope**: Goal → Task → AI Research → Knowledge Base

## File Structure

```
src/agents/     — Agent implementations
src/prompts/    — Structured prompt templates
src/lib/        — Shared utilities (Supabase, RAG, types)
src/app/api/    — REST API routes
src/components/ — React UI components
```

## Tech Stack

Next.js 16 + Supabase (pgvector) + DeepSeek + Tailwind CSS v4
