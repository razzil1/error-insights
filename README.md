# Error Insights Dashboard

MVP that ingests frontend error events, stores raw data in MongoDB, indexes searchable docs in Elasticsearch, exposes REST APIs via NestJS with Redis caching, and displays results in an Angular dashboard.

## Quickstart

```bash
cp .env.example .env
docker compose up --build
```

Open UI: http://localhost:4200

Seed some events:

```bash
curl -X POST http://localhost:3000/events/ingest -H 'Content-Type: application/json' -d @backend/src/events/ingest/sample-events.json
```

## Services
- MongoDB (raw events)
- Elasticsearch (indexed/searchable)
- Redis (cache for search/stats)
- Backend (NestJS, TypeScript)
- Frontend (Angular)
