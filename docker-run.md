Create network
docker network create moneytracker-network

Postgres
docker run -d \
  --name moneytracker-postgres \
  --network moneytracker-network \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=moneytracker \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:18-alpine

PgBouncer
docker run -d \
  --name moneytracker-pgbouncer \
  --network moneytracker-network \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_USER=user \
  -e DB_PASSWORD=password \
  -e DB_NAME=moneytracker \
  -e POOL_MODE=transaction \
  -p 6432:6432 \
  edoburu/pgbouncer:1.22.1

Backend
docker run -d \
  --name moneytracker-backend \
  --network moneytracker-network \
  -e DATABASE_URL="postgresql://user:password@pgbouncer:6432/moneytracker?schema=public&pgbouncer=true" \
  -e PRISMA_CLIENT_ENGINE_TYPE=binary \
  -e BACKEND_PORT=3010 \
  -p 3010:3010 \
  moneytracker-backend-image

Frontend
docker run -d \
  --name moneytracker-frontend \
  --network moneytracker-network \
  -e INTERNAL_API_URL=http://backend:3001/api \
  -e NEXT_PUBLIC_API_URL=http://localhost:3001/api \
  -p 3000:3000 \
  moneytracker-frontend-image