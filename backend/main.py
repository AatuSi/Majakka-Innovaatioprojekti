import os
from typing import Any

from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import JSONResponse
from psycopg import IntegrityError, connect
from psycopg.rows import dict_row
from pydantic import BaseModel

app = FastAPI()
url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/postgres")


class Account(BaseModel):
    username: str
    password_hash: str


class Result(BaseModel):
    account_id: int
    results: str


def query(sql: str, values: tuple[Any, ...] = (), many: bool = False):
    with connect(url, row_factory=dict_row) as db, db.cursor() as cursor:
        cursor.execute(sql, values)
        return cursor.fetchall() if many else cursor.fetchone()


def found(row):
    if row is None:
        raise HTTPException(404, "Not found")
    return row


@app.exception_handler(IntegrityError)
async def conflict(_, error):
    return JSONResponse({"detail": error.diag.message_primary}, 409)


@app.get("/accounts")
def list_accounts():
    return query("SELECT account_id,username,created_at,updated_at FROM account ORDER BY account_id", many=True)


@app.get("/accounts/{account_id}")
def get_account(account_id: int):
    return found(query("SELECT account_id,username,created_at,updated_at FROM account WHERE account_id=%s", (account_id,)))


@app.post("/accounts", status_code=201)
def create_account(account: Account):
    return query("INSERT INTO account(username,password_hash) VALUES(%s,%s) RETURNING account_id,username,created_at,updated_at", (account.username, account.password_hash))


@app.put("/accounts/{account_id}")
def update_account(account_id: int, account: Account):
    return found(query("UPDATE account SET username=%s,password_hash=%s,updated_at=now() WHERE account_id=%s RETURNING account_id,username,created_at,updated_at", (account.username, account.password_hash, account_id)))


@app.delete("/accounts/{account_id}", status_code=204)
def delete_account(account_id: int):
    found(query("DELETE FROM account WHERE account_id=%s RETURNING account_id", (account_id,)))
    return Response(status_code=204)


@app.get("/results")
def list_results():
    return query("SELECT result_id,account_id,results,recorded_at FROM result ORDER BY result_id", many=True)


@app.get("/results/{result_id}")
def get_result(result_id: int):
    return found(query("SELECT result_id,account_id,results,recorded_at FROM result WHERE result_id=%s", (result_id,)))


@app.post("/results", status_code=201)
def create_result(result: Result):
    return query("INSERT INTO result(account_id,results) VALUES(%s,%s) RETURNING result_id,account_id,results,recorded_at", (result.account_id, result.results))


@app.put("/results/{result_id}")
def update_result(result_id: int, result: Result):
    return found(query("UPDATE result SET account_id=%s,results=%s WHERE result_id=%s RETURNING result_id,account_id,results,recorded_at", (result.account_id, result.results, result_id)))


@app.delete("/results/{result_id}", status_code=204)
def delete_result(result_id: int):
    found(query("DELETE FROM result WHERE result_id=%s RETURNING result_id", (result_id,)))
    return Response(status_code=204)
