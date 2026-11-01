from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from app.config import settings
from app.schemas import AnalyzeRequest, AnalyzeResponse
from app.model_service import analyze_form

limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.rate_limit_per_minute}/minute"])
app = FastAPI(title=settings.app_name, version="1.0.0")
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=r"^(chrome-extension|moz-extension)://[a-zA-Z0-9_-]+$",
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})

@app.get("/")
async def root():
    return {"service": settings.app_name, "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy", "model_configured": bool(settings.model_base_url and settings.model_name)}

@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def analyze(request: Request, body: AnalyzeRequest):
    try:
        return await analyze_form(body)
    except Exception as exc:
        # Keep upstream model details and prompts out of public error responses.
        raise HTTPException(status_code=502, detail="Model inference failed. Check model endpoint configuration.") from exc
