#!/bin/sh
set -e

echo "[entrypoint] DATABASE_URL=${DATABASE_URL:-file:./dev.db}"

echo "[entrypoint] applying migrations..."
npx prisma migrate deploy

echo "[entrypoint] seeding initial trends (no-op if already seeded)..."
npm run seed

echo "[entrypoint] starting server..."
exec npm start
