#!/usr/bin/env bash
# Safe schema sync for production — pushes prisma/schema.prisma onto the
# live database WITHOUT wiping existing rows (no --force-reset).
#
# Use this after every version bump in CHANGELOG.md whose "Cập nhật dữ liệu"
# section says "chạy db-migrate.sh". Only use db-rebuild.sh instead when the
# changelog entry explicitly says a full reset is required (destructive).
#
# Why "db push" and not "prisma migrate deploy": migration history is
# missing a baseline for older tables (see EC2_DB_DEPLOY_NOTES.md), so
# `migrate deploy` fails on this database. `db push --accept-data-loss`
# (without --force-reset) diffs schema.prisma against the live schema and
# applies only the difference, in place — this is the same command already
# documented as the manual production process in EC2_DB_DEPLOY_NOTES.md.
#
# --accept-data-loss is still required by Prisma for certain diffs (e.g.
# narrowing a column, dropping a column) — read the CHANGELOG entry for
# this version before running, to know whether this specific schema change
# drops or narrows anything.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> db push (schema sync, existing data preserved)..."
docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm app npx prisma db push --accept-data-loss \
  --schema prisma/schema.prisma --skip-generate

if [ "${1:-}" = "--seed" ]; then
  echo "==> re-running seed (idempotent upserts only, safe on existing data)..."
  docker compose --env-file .env.production -f docker-compose.prod.yml \
    run --rm app npx ts-node --transpile-only \
    --compiler-options '{"module":"commonjs","moduleResolution":"node"}' \
    prisma/seed.ts
fi

echo "==> db-migrate done."
