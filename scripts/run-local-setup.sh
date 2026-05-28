#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Kloudbean SEO — setup ==="
npm run setup

echo ""
echo "=== Seeding articles (if empty) ==="
node --input-type=module -e "
import { loadProjectEnv } from './src/lib/load-env.ts';
" 2>/dev/null || true

# Seed via HTTP after dev starts — setup only for now
echo ""
echo "=== Starting dev server ==="
echo "After it starts: open http://127.0.0.1:3000 → Idea Raffle → Seed 59 ideas"
npm run dev -- --host 127.0.0.1
