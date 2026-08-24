import httpx
from fastapi import APIRouter, Depends, Path
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.clients.clinicaltrials import collect_trials, fetch_trial_by_id, fetch_trials
from app.database import get_db
from app.dependencies import get_http_client
from app.models import Favorite
from app.schemas.error import ApiError
from app.schemas.favorite import FavoriteCreate
from app.schemas.trial import Trial

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get(
    "",
    response_model=list[Trial],
    responses={
        502: {
            "model": ApiError,
            "description": "ClinicalTrials.gov is unavailable or returned invalid data",
        }
    },
)
async def get_favorites(
    db: Session = Depends(get_db),
    client: httpx.AsyncClient = Depends(get_http_client),
):
    favorites = db.query(Favorite).all()
    if not favorites:
        return []

    nct_ids = [favorite.nct_id for favorite in favorites]
    params = {"filter.ids": ",".join(nct_ids), "pageSize": len(nct_ids)}

    raw = await fetch_trials(client, params)
    batch = collect_trials(raw)

    return batch.trials


@router.post(
    "",
    status_code=201,
    responses={
        201: {"description": "Favourite created. No response body."},
        404: {"model": ApiError, "description": "The trial could not be found"},
        502: {
            "model": ApiError,
            "description": "ClinicalTrials.gov is unavailable or returned invalid data",
        },
    },
)
async def create_favorite(
    payload: FavoriteCreate,
    db: Session = Depends(get_db),
    client: httpx.AsyncClient = Depends(get_http_client),
):
    await fetch_trial_by_id(client, payload.nct_id)

    favorite = Favorite(nct_id=payload.nct_id)
    db.add(favorite)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()


@router.delete(
    "/{nct_id}",
    status_code=204,
    responses={
        204: {
            "description": "Favourite either removed or was already not favourited. No response body."
        }
    },
)
async def remove_favorite(
    nct_id: str = Path(..., min_length=11, max_length=11), db: Session = Depends(get_db)
):
    favorite = db.query(Favorite).filter(Favorite.nct_id == nct_id).first()
    if favorite:
        db.delete(favorite)
        db.commit()
