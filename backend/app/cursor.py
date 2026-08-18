import base64
from pydantic import BaseModel


class CursorPayload(BaseModel):
    search_term: str | None
    filters: dict
    ct_token: str


def encode_cursor(payload: CursorPayload) -> str:
    raw = payload.model_dump_json().encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8")


def decode_cursor(cursor: str) -> CursorPayload:
    raw = base64.urlsafe_b64decode(cursor.encode("utf-8"))
    return CursorPayload.model_validate_json(raw)


def resolve_ct_token(
    cursor: str | None, current_search: str | None, current_filters: dict
) -> str | None:
    if cursor is None:
        return None
    payload = decode_cursor(cursor)
    if payload.search_term != current_search:
        return None
    if payload.filters != current_filters:
        return None
    return payload.ct_token
