from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import Base, engine
from app.exceptions import (
    TrialNotFoundError,
    UpstreamDataError,
    UpstreamRateLimitedError,
    UpstreamUnavailableError,
)
from app.routers.favorites import router as favorites_router
from app.routers.trials import router as trials_router
from app.schemas.error import ApiError


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    async with httpx.AsyncClient() as client:
        app.state.http_client = client
        yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trials_router)
app.include_router(favorites_router)


@app.exception_handler(UpstreamUnavailableError)
async def handle_upstream_unavailable(request: Request, exc: UpstreamUnavailableError):
    return JSONResponse(
        status_code=502,
        content=ApiError(
            code="UPSTREAM_UNAVAILABLE", message="cannot reach the server."
        ).model_dump(by_alias=True),
    )


@app.exception_handler(UpstreamRateLimitedError)
async def handle_upstream_rate_limited(request: Request, exc: UpstreamRateLimitedError):
    return JSONResponse(
        status_code=503,
        content=ApiError(
            code="UPSTREAM_RATE_LIMITED",
            message="too many requests, please refresh the page and try again.",
        ).model_dump(by_alias=True),
    )


@app.exception_handler(UpstreamDataError)
async def handle_upstream_data_error(request: Request, exc: UpstreamDataError):
    return JSONResponse(
        status_code=502,
        content=ApiError(
            code="UPSTREAM_DATA_ERROR", message="Server returned invalid data."
        ).model_dump(by_alias=True),
    )


@app.exception_handler(TrialNotFoundError)
async def handle_trial_not_found(request: Request, exc: TrialNotFoundError):
    return JSONResponse(
        status_code=404,
        content=ApiError(
            code="TRIAL_NOT_FOUND", message="This trial cannot be found."
        ).model_dump(by_alias=True),
    )
