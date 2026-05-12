#!/bin/bash
# AItodo — 快速启动脚本

set -e

cd "$(dirname "$0")"

echo "🚀 AItodo — Personal AI Execution OS"
echo ""

# 检查环境变量
if [ ! -f .env.local ]; then
  if [ -f .env.example ]; then
    echo "📋 首次运行：从 .env.example 创建 .env.local"
    echo "   请编辑 .env.local 填入你的密钥后重新运行"
    cp -n .env.example .env.local 2>/dev/null || true
  fi

  echo "⚠️  未检测到 .env.local 文件"
  echo ""
  echo "   必需变量："
  echo "     NEXT_PUBLIC_SUPABASE_URL"
  echo "     NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "     SUPABASE_SERVICE_ROLE_KEY"
  echo "     OPENAI_API_KEY"
  echo ""
  echo "   可选变量："
  echo "     TAVILY_API_KEY  (网络搜索，不配置则降级为本地知识库)"
  echo ""
  read -rp "是否继续启动？(y/N) " answer
  if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
    exit 1
  fi
fi

# 安装依赖
if [ ! -d node_modules ]; then
  echo "📦 安装依赖..."
  npm install
fi

echo "🔧 启动开发服务器..."
echo ""
npm run dev
