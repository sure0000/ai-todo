-- AItodo Schema v2 — Personal AI Execution OS
-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 核心对象模型
-- ============================================================

-- 用户表（兼容已有数据）
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 目标表
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('draft', 'active', 'completed', 'archived')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 清单/分类表（如滴答清单的 Lists）
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'list',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 任务表
-- goal_id 为 NULL 时表示独立任务（不绑定目标），用于日常任务管理
-- list_id 关联到清单分类
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  list_id UUID REFERENCES lists(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  task_type TEXT CHECK (task_type IN ('research', 'write', 'analyze', 'summarize', 'execute')) DEFAULT 'research',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'pending',
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  result TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 知识库索引
CREATE TABLE knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT CHECK (source_type IN ('web', 'notion', 'obsidian', 'manual', 'search')) NOT NULL,
  source_url TEXT,
  title TEXT,
  content TEXT NOT NULL,
  embedding vector(1536),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 长期记忆表
CREATE TABLE memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  memory_type TEXT CHECK (memory_type IN ('preference', 'context', 'insight', 'fact')) NOT NULL,
  content TEXT NOT NULL,
  importance_score FLOAT DEFAULT 0.5,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent 执行日志表
CREATE TABLE agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  execution_log JSONB DEFAULT '[]',
  status TEXT CHECK (status IN ('running', 'completed', 'failed')) DEFAULT 'running',
  input TEXT,
  output TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- 向量检索
-- ============================================================

CREATE INDEX ON knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  filter_user_id UUID DEFAULT NULL,
  filter_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  title TEXT,
  source_type TEXT,
  source_url TEXT,
  tags TEXT[],
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    k.id,
    k.content,
    k.title,
    k.source_type,
    k.source_url,
    k.tags,
    1 - (k.embedding <=> query_embedding) AS similarity
  FROM knowledge k
  WHERE (filter_user_id IS NULL OR k.user_id = filter_user_id)
    AND (filter_tags IS NULL OR k.tags && filter_tags)
  ORDER BY k.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- 自动更新触发器
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER memory_updated_at
  BEFORE UPDATE ON memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 兼容旧版数据（知识来源表，Notion/Obsidian 同步用）
-- ============================================================

CREATE TABLE IF NOT EXISTS knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('notion', 'feishu', 'obsidian')) NOT NULL,
  config JSONB,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 旧版知识块表迁移：将 knowledge_chunks 数据导入 knowledge 表（由迁移脚本处理）
-- 此处保留旧表兼容，新数据直接写入 knowledge 表
