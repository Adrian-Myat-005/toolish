# src/api/main.py
from fastapi import FastAPI
from src.api.routers import translate # Import the new translate router

app = FastAPI()

app.include_router(translate.router, prefix="/api/v1") # Include the translate router

@app.get("/")
async def root():
    return {"message": "Toolish Backend (Minimal)"}

# Add CORS middleware to allow frontend access
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost",
    "http://localhost:3000", # Default Next.js port
    "http://localhost:3782", # Frontend port from start_web.py config
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)