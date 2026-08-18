import httpx
from typing import NamedTuple
from app.config import settings
from app.schemas.trial import Trial
from app.exceptions import UpstreamDataError, UpstreamUnavailableError


def _map_trial(raw: dict) -> Trial:
    protocol_section = raw.get("protocolSection", {})
    identification_module = protocol_section.get("identificationModule", {})
    status_module = protocol_section.get("statusModule", {})
    conditions_module = protocol_section.get("conditionsModule", {})
    design_module = protocol_section.get("designModule", {})
    arms_module = protocol_section.get("armsInterventionsModule", {})

    return Trial(
        nct_id=identification_module.get("nctId", ""),
        brief_title=identification_module.get("briefTitle", ""),
        overall_status=status_module.get("overallStatus", "UNKNOWN"),
        conditions=conditions_module.get("conditions", []),
        phases=design_module.get("phases", []),
        interventions=[
            intervention.get("name")
            for intervention in arms_module.get("interventions", [])
        ],
    )


async def fetch_trials(client: httpx.AsyncClient, params: dict) -> dict:
    # Upstream check
    try:
        response = await client.get(
            f"{settings.clinicaltrials_base_url}/studies", params=params
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise UpstreamUnavailableError(
            f"upstream returned {exc.response.status_code}"
        ) from exc
    except httpx.RequestError as exc:
        raise UpstreamUnavailableError("could not reach upstream") from exc

    # Sanity check
    try:
        data = response.json()
    except ValueError as exc:
        raise UpstreamDataError("upstream returned invalid JSON") from exc

    if "studies" not in data and "totalCount" not in data:
        raise UpstreamDataError("upstream response is missing expected fields")

    return data


class CollectedBatch(NamedTuple):
    trials: list[Trial]
    total: int
    next_token: str | None


def _process(raw: dict) -> CollectedBatch:
    trials = [_map_trial(study) for study in raw.get("studies", [])]
    return CollectedBatch(
        trials=trials,
        total=raw.get("totalCount", 0),
        next_token=raw.get("nextPageToken"),
    )
