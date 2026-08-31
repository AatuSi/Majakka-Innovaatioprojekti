from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def root():
    return {"message": "testing"}


def main():
    print("works I guess")
