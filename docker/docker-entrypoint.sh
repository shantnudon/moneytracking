#!/bin/sh

echo "Waiting for database..."

while ! nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done

echo "Database is up"

echo "Generating Prisma client..."
pnpm prisma generate

echo "Running migrations..."
pnpm prisma migrate deploy

echo "Starting server..."
exec "$@"
