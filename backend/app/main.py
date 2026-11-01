from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models import (
    FormIdentificationRequest,
    FormIdentificationResponse,
    FormExplanationRequest,
    FormExplanationResponse,
)
from app.services.form_intelligence import (
    FormIntelligenceService,
    ModelConfigurationError,
    form_intelligence,
)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
)

# For production, configure exact extension origins rather than a wildcard.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.app_name,
    }


@app.post(
    "/api/forms/identify",
    response_model=FormIdentificationResponse,
)
async def identify_form(
    request: FormIdentificationRequest,
) -> FormIdentificationResponse:
    try:
        return await form_intelligence.identify_form(request)
    except ModelConfigurationError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail="Unable to identify the form at this time.",
        ) from error


@app.post(
    "/api/forms/explain",
    response_model=FormExplanationResponse,
)
async def explain_form(
    request: FormExplanationRequest,
) -> FormExplanationResponse:
    try:
        return await form_intelligence.explain_form(request)
    except ModelConfigurationError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail="Unable to explain the form at this time.",
        ) from error
