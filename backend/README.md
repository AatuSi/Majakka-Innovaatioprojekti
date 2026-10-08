# Initializing the database and starting the backend

To initialize the database, run:

```
python init_db.py
```

To start the backend, run:

```
python -m uvicorn main:app --env-file .env --reload --host 127.0.0.1 --port 8000
```

## Checking the connection

`GET /health` needs no login. It answers `{"status": "ok", "database": "ok"}`, or status 503 with `"database": "unavailable"` when the database cannot be reached.

## Deployment notes

The backend reads its settings from environment variables, see `.env-template`. `DATABASE_URL` and `JWT_SECRET` must be set. If `DATABASE_URL` is missing, the backend does not fail but falls back to a local database at `localhost:5432`. `CORS_ORIGINS` must include the address of the deployed frontend, otherwise the browser blocks the API calls. The frontend finds the API through `VITE_API_URL`, which is set when the frontend is built.

`init_db.py` runs `schema.sql`, which drops all tables and creates them again with the seed data. Run it only once on a new database, never on one that has real data in it. There are no migrations yet, so later changes to the schema have to be applied by hand.

`init_db.py` also runs `CREATE EXTENSION IF NOT EXISTS pgcrypto`, so the database user needs permission to create extensions. On a managed database this may have to be allowed separately.

`GET /health` can be used for uptime checks and load balancer health checks. It returns 503 when the database is down.
