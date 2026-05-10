# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from app.models.database import create_tables
# from app.services.rag_service import load_books_into_db
# from app.routes.interview import router as interview_router

# app = FastAPI(title="AI Interview System")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# @app.on_event("startup")
# async def startup_event():
#     create_tables()
#     load_books_into_db()
# app.include_router(interview_router)

# @app.get("/")
# def root():
#     return {"message": "AI Interview System is running!"}
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.models.database import create_tables
from app.services.rag_service import load_books_into_db
from app.routes.interview import router as interview_router
import traceback

app = FastAPI(title="AI Interview System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_detail = traceback.format_exc()
    print(f"ERROR: {error_detail}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": error_detail}
    )

@app.on_event("startup")
async def startup_event():
    create_tables()
    load_books_into_db()

app.include_router(interview_router)

@app.get("/")
def root():
    return {"message": "AI Interview System is running!"}