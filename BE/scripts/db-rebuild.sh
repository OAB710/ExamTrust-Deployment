#!/usr/bin/env bash
# Equivalent of local "npm run db:rebuild" (BE/package.json):
#   prisma db push --force-reset --accept-data-loss --schema prisma/schema.prisma && npm run seed:all
# Adapted for the Dockerized production setup on EC2 (image is npm-pruned,
# so seed must run via ts-node --transpile-only inside the container).
#
# WARNING: --force-reset WIPES the entire database before reseeding demo data.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> db push --force-reset (wiping and recreating schema)..."
docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm app npx prisma db push --force-reset --accept-data-loss \
  --schema prisma/schema.prisma --skip-generate

echo "==> seeding demo data (seed-master: full baseline dataset)..."
docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm app npx ts-node --transpile-only \
  --compiler-options '{"module":"commonjs","moduleResolution":"node"}' \
  prisma/seed-master.ts

echo "==> db:rebuild done."
