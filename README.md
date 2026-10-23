# Building the API client for the frontend

The client is automatically generated via @hey-api/openapi-ts; do not modify the frontend/src/client/*.
To generate the latest client of the backend, you should run:
```
cd backend
python export_openapi.py
```
Then do:
```
cd ../frontend
npm run generate-client
```
Once done, the client should be automatically up to latest, just remember to commit both.

# Testing the API connection

Start the backend first (see backend/README.md), then run:
```
cd frontend
npm run test:api
```
It checks, through the generated client: `/health`, CORS for the frontend origin, registering, logging in, the bearer token, and how 401/404/409/422 responses, an unreachable server, a timeout and a database outage are reported. It creates one throwaway user and deletes it again, so run it only against a development or test backend.

Needs Node 22.18 or newer. `API_URL` (default `http://localhost:8000`) chooses the backend and `FRONTEND_ORIGIN` (default `http://localhost:3000`) the origin CORS must allow.

The frontend finds the API through `VITE_API_URL`; see `frontend/.env.example`. In development the browser console warns once when the API cannot be reached.
