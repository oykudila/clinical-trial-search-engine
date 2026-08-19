import httpx

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.database import Base, engine
from app.routers.trials import router as trials_router
from app.routers.favorites import router as favorites_router
from app.schemas.error import ApiError
from app.exceptions import (
    TrialNotFoundError,
    UpstreamDataError,
    UpstreamUnavailableError,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    async with httpx.AsyncClient() as client:
        app.state.http_client = client
        yield


app = FastAPI(lifespan=lifespan)

app.include_router(trials_router)
app.include_router(favorites_router)


@app.exception_handler(UpstreamUnavailableError)
async def handle_upstream_unavailable(request: Request, exc: UpstreamUnavailableError):
    return JSONResponse(
        status_code=502,
        content=ApiError(
            code="UPSTREAM_UNAVAILABLE", message="Cannot reach the server."
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
