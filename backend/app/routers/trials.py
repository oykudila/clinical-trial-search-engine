import httpx
from fastapi import APIRouter, Query, Depends


from app.dependencies import get_http_client
from app.schemas.trial import PaginatedTrials, OverallStatus, Phases
from app.clients.clinicaltrials import collect_trials, fetch_trials
from app.cursor import resolve_ct_token, CursorPayload, encode_cursor

router = APIRouter(prefix="/trials", tags=["trials"])


@router.get("", response_model=PaginatedTrials)
async def list_trials(
    search: str | None = Query(None),
    condition: str | None = Query(None),
    status: OverallStatus | None = Query(None),
    phase: Phases | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(10, ge=1, le=1000),
    client: httpx.AsyncClient = Depends(get_http_client),
):
    filters = {
        "condition": condition,
        "status": status.value if status else None,
        "phase": phase.value if phase else None,
    }
    ct_token = resolve_ct_token(cursor, search, filters)

    params = {"pageSize": limit}
    if search:
        params["query.term"] = search
    if condition:
        params["query.cond"] = condition
    if status:
        params["filter.overallStatus"] = status.value
    if phase:
        params["filter.advanced"] = f"AREA[Phase]{phase.value}"
    if ct_token:
        params["pageToken"] = ct_token
    if ct_token is None:
        params["countTotal"] = True

    raw = await fetch_trials(client, params)
    batch = collect_trials(raw)

    next_cursor = None
    if batch.next_token:
        payload = CursorPayload(
            search_term=search, filters=filters, ct_token=batch.next_token
        )
        next_cursor = encode_cursor(payload)

    return PaginatedTrials(
        trials=batch.trials, next_cursor=next_cursor, total_count=batch.total
    )
