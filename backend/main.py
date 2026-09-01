from fastapi import FastAPI
from routers import accounts, results

app = FastAPI()

app.include_router(accounts.router)
app.include_router(results.router)
