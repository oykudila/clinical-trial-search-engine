from app.cursor import CursorPayload, encode_cursor, decode_cursor, resolve_ct_token


def test_encode_decode_round_trip():
    payload = CursorPayload(
        search_term="test", filters={"status": "COMPLETED"}, ct_token="token-test"
    )
    encoded = encode_cursor(payload)
    decoded = decode_cursor(encoded)

    assert decoded.search_term == "test"
    assert decoded.filters == {"status": "COMPLETED"}
    assert decoded.ct_token == "token-test"


def test_resolve_ct_token_returns_token_on_match():
    payload = CursorPayload(
        search_term="test", filters={"status": "COMPLETED"}, ct_token="token-test"
    )
    encoded = encode_cursor(payload)
    result = resolve_ct_token(
        encoded, current_search="test", current_filters={"status": "COMPLETED"}
    )

    assert result == "token-test"


def test_resolve_ct_token_returns_none_on_mismatch():
    payload = CursorPayload(
        search_term="test", filters={"status": "COMPLETED"}, ct_token="token-test"
    )
    encoded = encode_cursor(payload)
    result = resolve_ct_token(
        encoded, current_search="different", current_filters={"status": "COMPLETED"}
    )

    assert result is None
