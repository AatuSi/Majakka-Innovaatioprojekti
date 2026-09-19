# Building the API client for the frontend

The client is automatically generated via OpenAI, do not modify the frontend/src/client/*.
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