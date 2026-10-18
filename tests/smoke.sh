#!/usr/bin/env bash
# End-to-end auth + security smoke check against a running server with the database imported.
# Usage: tests/smoke.sh http://localhost/Cinephile
set -u
BASE="${1:-http://127.0.0.1:8099}/backend"
JAR="$(mktemp)"; trap 'rm -f "$JAR"' EXIT
USER="smoke_$RANDOM$RANDOM"
FAILS=0

# Send one request with the session cookie jar; extra curl args are passed through.
req() { curl -s -b "$JAR" -c "$JAR" "$@"; }
# POST JSON the way app.js does (with the CSRF header).
post() { req -X POST -H 'X-Requested-With: fetch' -H 'Content-Type: application/json' -d "$2" "$BASE/$1"; }
# Fail loudly when a response does not contain the expected text.
expect() { if grep -q -- "$2" <<<"$3"; then echo "ok   $1"; else echo "FAIL $1 -> $3"; FAILS=$((FAILS + 1)); fi; }

expect "guest blocked from watchlist" '"success":false' "$(req "$BASE/watchlist.php?action=list")"
expect "register" '"success":true' "$(post 'auth.php?action=register' "{\"username\":\"$USER\",\"email\":\"$USER@example.com\",\"password\":\"password123\"}")"
expect "duplicate register rejected" 'already registered' "$(post 'auth.php?action=register' "{\"username\":\"$USER\",\"email\":\"$USER@example.com\",\"password\":\"password123\"}")"
expect "73-byte password rejected" 'Password must be' "$(post 'auth.php?action=register' "{\"username\":\"x$USER\",\"email\":\"x$USER@example.com\",\"password\":\"$(printf 'a%.0s' {1..73})\"}")"
post 'auth.php?action=logout' '{}' >/dev/null
expect "wrong password rejected" 'did not match' "$(post 'auth.php?action=login' "{\"login\":\"$USER\",\"password\":\"wrongpass1\"}")"
expect "login" '"success":true' "$(post 'auth.php?action=login' "{\"login\":\"$USER\",\"password\":\"password123\"}")"
expect "CSRF form post blocked while logged in" 'Request blocked' "$(req -X POST -d movie_id=1 "$BASE/watchlist.php?action=add")"
expect "GET logout refused" 'requires a POST' "$(req "$BASE/auth.php?action=logout")"
expect "rating saved" '"success":true' "$(post 'ratings.php?action=save' '{"movie_id":1,"stars":4}')"
expect "rating 6 rejected" '1 to 5' "$(post 'ratings.php?action=save' '{"movie_id":1,"stars":6}')"
expect "future diary date rejected" 'valid watched date' "$(post 'diary.php?action=add' '{"movie_id":1,"watched_date":"2999-01-01"}')"
expect "diary added" '"success":true' "$(post 'diary.php?action=add' "{\"movie_id\":1,\"watched_date\":\"$(date -u +%F)\"}")"
expect "profile stats" '"watched_count":1' "$(req "$BASE/auth.php?action=profile")"
expect "logout" '"success":true' "$(post 'auth.php?action=logout' '{}')"
expect "profile blocked after logout" 'Please log in' "$(req "$BASE/auth.php?action=profile")"

echo "$FAILS failure(s); test user: $USER"
exit "$FAILS"
