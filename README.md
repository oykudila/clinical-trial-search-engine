# myTomorrows Assignment 2

## Steps for running the app

### **Backend** (from `backend/`):
1. `docker compose up -d`
2. `cp .env.example .env`, the defaults already match `docker-compose.yml`
3. `uv sync`
4. `uv run uvicorn app.main:app --reload --port 8000`

The API runs at `http://localhost:8000`, docs at `http://localhost:8000/docs`

### **Frontend** (from `frontend/`):
1. `npm install`
2. `npm start` (`ng serve`)

Runs at `http://localhost:4200`.

## Frontend state management

Trial list state lives in a single Angular service and acts as the single source of truth rather than duplicated across the trial list state and favorites components. This keeps favoriting in sync between the two views without a manual refresh. 

Search, filters, and infinite scroll are three independent inputs that all mutate the same result list but they don't behave the same way when they overlap. Hence, they are not flattened into one operator but rather different event sources that feed into one shared fetch mechanism.

- **Search term + filters** each with `debounceTime` and `distinctUntilChanged`, combined with  `combineLatest`, produce **reset events** that mean "abandon whatever is processing, clear the list and cursor, and fetch page 1 with these new parameters". In case of a **reset event**, the list gets replaced. Filters get the same `debounceTime` and `distinctUntilChanged` as search. There is an explicit comparator in `distinctUntilChanged` on the filters object to compare content rather than the default reference check, since two structurally identical `Filters` objects are still different instances. 

- **Scroll near bottom** produces **load-more events**, with a gate so that a new one is ignored when a fetch is already in progress. Otherwise, fast scrolling or constantly holding the bottom of the page would fire redundant requests for pages that are already being fetched. In case of a **load-more event**, the list gets appended to.  

- Both events are merged into one stream of "what to fetch", which goes through a single `switchMap` to actually make the HTTP call. Because both sources feed the same `switchMap`, if there is a reset event while a load-more request is still in flight, the reset event correctly cancels it. Load-more events cannot race each other, since the gate on scroll near bottom holds back redundant calls. This prevents stale search results arriving after newer ones as well as duplicate trials appearing in infinite scroll. The result of the pipeline is exposed to components with `toSignal()`, so templates read plain signals and do not manage subscriptions on their own. This is to keep complexity contained to state service.  

**Why not NgRx?** Shared state here is small in scope: one trial list, one filter/search state, one favorites list. A dedicated state library would mean maintaining its own set of concepts and adding an extra layer between something happening and the state actually changing, without a corresponding benefit at this scale. A single service already provides one enforced source of truth that's simple to trace. With more time, this state service would be a reasonable candidate to migrate into a Signal Store, mainly for its structured selector/`rxMethod` conventions.

## Bonus items delivered

- **i18n**: the "Loading..." message in `trial-list.html` is routed through `@angular/localize` rather than hardcoded.
- **a11y**: `aria-label`/`aria-pressed` on the favorite/remove buttons and filter inputs, `role="status"`/`role="alert"` on loading/error messages.
- **Optimistic UI**: favoriting updates `FavoritesState` immediately, and rolls back if the backend call fails.

## Trade-offs

- **Favorites are reference only**: `GET /favorites` re-fetches current details from CT.gov for each favorited trial rather than denormalizing display fields onto the favorite row. Considered implementing caching for fewer upstream calls and favorite pages that could still render something even if CT.gov is down, but did not go with it given the timeframe. Fields like `overallStatus` can change, and for a clinical trials platform, showing stale status for a trial would raise a real problem. With more time I'd add a short-TTL cache so the favorites page still renders something if CT.gov is down, without keeping stale data.
- **CORS is restricted to an explicit origin (`http://localhost:4200`) rather than `allow_origins=["*"]`**: since this app has no authentication, CORS is the only thing stopping an unrelated website's JS from calling the API and reading or writing the favorites list in the background. It's currently hardcoded in `main.py` rather than pulled from `Settings/.env`,  with more time I'd make it configurable per deployment instead of requiring a code change to add a new allowed origin 

- **The condition filter validation**: `query.cond` is an Essie-expression field, and CT.gov's own API documentation states `(head OR neck) AND pain` as an example, so a value with unbalanced parentheses would reach the upstream API as an incorrect query. Therefore, `trial-list.ts` rejects unbalanced parentheses and over-length strings before the value ever reaches `TrialsState`, and keeps the previous valid filter value in place rather than applying the broken one. It doesn't validate that the text is a real medical condition, since it is not regulated by syntax, and CT.gov handles that matching itself. 
- **`environment.ts` keeps its `apiBaseUrl` placeholder**: Only `environment.development.ts` is pointed at a real backend (`http://localhost:8000`). Since this assignment only runs locally, there's no deployed backend for a production build to target.

## Error handling

Every upstream or client failure below is mapped to a typed exception in `app/exceptions.py`, and caught by a global `@app.exception_handler` in `main.py`, so the frontend always gets a clean `{code, message}` `ApiError` body and a purposeful status code:

- **Favoriting a well-formed but nonexistent `nct_id`**: `create_favorite` calls `fetch_trial_by_id` before inserting, CT.gov 404 raises `TrialNotFoundError` => `404 TRIAL_NOT_FOUND`. Ghost favorites are never stored.
- **Favoriting a trial that's already favorited**: the database's `unique=True` constraint on `nct_id` raises `IntegrityError`, which is caught and rolled back. It gets treated as an idempotent success with (`201`, no error) rather than a `409`.
- **CT.gov down, timing out, or rate-limiting**: `httpx.RequestError` or non-2xx responses map to `UpstreamUnavailableError` => `502`, a `429` error maps to `UpstreamRateLimitedError` => `503 UPSTREAM_RATE_LIMITED`.
- **Deleting a favorite that no longer exists**: `remove_favorite` looks it up and only deletes if found, either way it returns `204`, and treats "already deleted" as success.
- **CT.gov returns broken/unexpected JSON**: `fetch_trials` and `fetch_trial_by_id` validate the response shape before parsing (`UpstreamDataError` => `502`), and `map_trial` catches the Pydantic `ValidationError` that would be raised if a study contains a value outside the hardcoded `OverallStatus` and `Phase` enums, converting it into the same `502 UPSTREAM_DATA_ERROR`.
- **Invalid frontend request**: rejected by FastAPI or Pydantic at the boundary with a `422`, which the frontend's `errorInterceptor` normalizes to `VALIDATION_ERROR`.

`/docs` declares the `404`/`502`/`503` response shapes alongside the `200` shape for each route so that frontend devs can see the error contract without asking.

## Bug Hall of Fame

- **Runaway infinite-scroll retry loop.**: `scan`'s append created a brand new array reference even when `result.trials` was empty, a failed load-more, and Angular signals treat a new array reference as "changed" regardless of content. Because `effect()` re-runs on any signal change, and `trials()` had just changed to an equivalent but new array, the effect  recreated the IntersectionObserver on the sentinel. Since the sentinel element was still in the viewport, the fresh observer immediately called `loadMore()` again, which caused a loop of retrying with the same cursor, failing, and repeating. Fixed it by returning the same `accumulated` reference unchanged when there is nothing new to append.
- **`_map_trial` crash**: `.get(key, default)` only substitutes the default when a key is absent. However, if a key is present with an explicit `null`, it passes `None` through into a `list[str]` field. This crashed with an unhandled Pydantic `ValidationError` before reaching any custom exception handler. Fixed it by switching every site to `.get(key) or default`, which catches both missing and explicitly null.

## Tests coverage

**Backend** (`backend/tests/`, `uv run pytest`):
- `map_trial` field extraction and missing-module defaulting.
- The cursor `encode`/`decode` round-trip and `resolve_ct_token`'s search/filter-mismatch handling.
- The `Favorite.nct_id` uniqueness constraint raising `IntegrityError` on a duplicate insert.

**Frontend** (`frontend/src/app/**/*.spec.ts`, `ng test`):
- `TrialsState`'s RxJS composition with search debouncing, reset vs append,`scan` behaviour, loadMore gate, and ignore when there's no next page.
- `FavoritesState`'s optimistic add/remove and rollback on failure.
- `TrialsApi`'s query/parameter serialization, asserting the actual request.
- `errorInterceptor`'s response-shape branches.
- `TrialList`/`Favorites` render the component and assert on the actual DOM. Typing an unbalanced parentheses condition shows the `role="alert"` message and never calls `setFilters`, a valid value does apply, and clicking the favorite/remove buttons calls `toggleFavorite` and flips `aria-pressed`.

For the DOM-level assertions in the `TrialList`/`Favorites` specs, I used Claude to accelerate test development and get more coverage.

## With more time

- **Sign the pagination cursor.** The cursor is base64-encoded, which makes it opaque to the frontend but not impossible to tamper. It is possible to decode, edit the embedded search, filters, or token, and re-encode a forged cursor that would pass validation. A production version would sign the payload so any tampering invalidates the cursor.
- **Throttle/pace auto-triggered infinite-scroll loads.** The scroll sentinel currently gets re-checked after every successful fetch. On a short page, this means the app keeps auto-fetching consecutive pages with no delay to fill the page until the sentinel scrolls out of view. This is not good practice against a free public API. A production version would throttle consecutive auto-loads or require a minimum user scroll gesture between them, rather than firing as fast as each request resolves.
- **Request only the fields we need.** CT.gov returns each study's entire nested record by default, and the `fields` parameter lets us request just the subsets we actually use, which triggers smaller and faster responses. Implementing this requires a second mapping, and would introduce extra complexity for a performance optimization, not a correctness requirement, so I didn't get into it given the timeframe.
- **Checkboxes for phase/status filters, matching CT.gov's UI.** `GET /trials` currently accepts one `phase`/`status` value per request, and the frontend's `Filters` model mirrors that. Implementing checkboxes for these fields would require the backend to accept and translate a list of values into CT.gov's advanced filter query syntax. To keep the backend work lighter, I used dropdowns.
- **`total_count` in the UI**: `GET /trials` returns `totalCount`, but CT.gov only provides it on the first page of a search and `GET /trials` only requests it when there's no incoming cursor. However, the frontend never reads it, and the value is discarded on every request. With more time I would show it as a "N results" line above the list.
- **More tests**: on the backend, endpoint-level tests are not yet covered, with more time I would add tests that cover the actual routing and exception handler wiring. On the frontend, the loading/error status-message branches in `trial-list.html` aren't covered, and there's no end to end layer, so cross-page navigation such as favoriting on the list and seeing it reflected on `/favorites`, is only verified structurally.