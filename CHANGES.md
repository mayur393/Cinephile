# Changes since initial commit (`ba40a0a`)

Security and correctness hardening for auth, CSRF, and the diary. No schema changes, no new dependencies.

## Security

### CSRF protection for every write endpoint
- **`backend/db.php`** — new `requireWriteRequest()`: rejects anything that is not `POST` (405) or lacks the `X-Requested-With: fetch` header (403). A cross-site form or `<img>` can't set custom headers, and a cross-origin `fetch()` with one triggers a CORS preflight the server never approves.
- `requestData()` now calls `requireWriteRequest()` first, so every endpoint that reads a body (register, login, ratings, reviews, watchlist add/remove, diary add/remove) is covered automatically.
- **`backend/auth.php`** — `logout` reads no body, so it calls `requireWriteRequest()` directly. `GET ?action=logout` no longer logs you out.
- **`assets/js/app.js`** — `api()` always sends `X-Requested-With: fetch`, merged with any caller headers.

### Session fixation
- `startUserSession()` sets `session.use_strict_mode=1`, so PHP refuses session IDs it never issued. (Login and register already called `session_regenerate_id(true)`.)

### Open redirect on `?next=`
- New `safeNextPage()` in `app.js` only follows `?next=` when it points to one of our own pages (`name.html` with an optional simple query string). External URLs, `//evil.com`, and `javascript:` fall back to the default page. Used after login/register and when an already-logged-in user opens an auth page.

### bcrypt 72-byte truncation
- bcrypt ignores everything past 72 bytes, so two passwords with the same first 72 bytes would both work. Register now rejects passwords over 72 bytes (server) / 72 characters (client). The hint in `register.html` now says "8–72 characters".

## Correctness

- **Duplicate sign-up race** (`auth.php`): two requests that both pass the duplicate check used to make the second `INSERT` throw an uncaught `PDOException` (blank 500). SQLSTATE `23000` is now caught and returned as the normal 409 "already registered".
- **Global exception handler** (`db.php`): any uncaught exception is logged with `error_log` and returned as a JSON 500 (`success:false`) instead of an empty page that `api()` reports as "unreadable response". Nothing internal is sent to the client.
- **Future diary dates**:
  - Server (`diary.php`) rejects dates more than 1 day ahead of UTC today. The one day of slack lets users east of UTC log tonight's film.
  - Client: the date input uses the browser's **local** date (`toLocaleDateString('en-CA')`) as both default and `max`. It used to default to the UTC date, so users west of UTC got tomorrow's date in the evening.

## Tests

- **`tests/smoke.sh`** — new end-to-end curl script against a running server with the DB imported. It covers guest blocking, register, duplicate register, 73-byte password, wrong password, login, CSRF form post blocked, GET logout refused, rating save and range check, future diary date, diary add, profile stats, logout, and profile blocked after logout.

  ```bash
  tests/smoke.sh http://localhost/Cinephile   # exits with the failure count
  ```

## Known limitations (not fixed)

- Password length: the client counts UTF-16 characters, the server counts bytes. A non-ASCII password under 72 characters can pass the browser check and still be rejected by the server. The server's message is shown, so nothing breaks.
- The diary check is date-only with ±1 day of slack. Someone could log "tomorrow" in some timezones.
- There is no rate limiting on login/register yet.
