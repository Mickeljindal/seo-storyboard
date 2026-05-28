#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=========================================="
echo " Kloudbean SEO — setup + full test"
echo "=========================================="
echo ""

echo ">>> 1/4 Database setup + migrations"
npm run setup || { echo "Setup failed — check DATABASE_URL and Kloudbean firewall"; exit 1; }

echo ""
echo ">>> 2/4 Integration checks"
node scripts/test-all.mjs || exit 1

echo ""
echo ">>> 3/4 Production build"
npm run build

echo ""
echo ">>> 4/4 Dev server smoke (optional — skip if already running)"
PORT="${PORT:-3000}"
if curl -sf "http://127.0.0.1:${PORT}/" -o /dev/null 2>/dev/null; then
  echo "✓ App responds on http://127.0.0.1:${PORT}/"
else
  echo "Start dev server: npm run dev -- --host 127.0.0.1"
  echo "Then open Dashboard → Seed 59 ideas → Idea Raffle → Spin"
fi

echo ""
echo "=========================================="
echo " All automated tests passed."
echo " Open http://127.0.0.1:${PORT}/raffle and click Seed 59 ideas if pool is empty."
echo "=========================================="
