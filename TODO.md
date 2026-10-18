# Cinephile Lite — Delivery Outcomes

## Eight-page cinematic frontend
- [x] Deliver exactly eight main HTML UI pages: `index.html`, `movies.html`, `movie.html`, `login.html`, `register.html`, `watchlist.html`, `diary.html`, and `profile.html`.
- [x] Keep a consistent responsive navigation bar on all pages, showing Home, Browse, Log In, and Sign Up publicly, and Home, Browse, Watchlist, Diary, Profile, and Logout for authenticated users.
- [x] Use a near-black/charcoal cinematic visual system with warm amber/gold accents, accessible light text, poster cards, responsive layouts, rounded surfaces, and restrained hover/transition effects.
- [x] Provide a home hero with the tagline “Every film you watch, remembered.”, featured movies, recommendations, browse CTA, and footer.
- [x] Provide browse search by title, a practical genre filter, loading/empty/error states, and links to `movie.html?id=...`.
- [x] Provide movie details with poster, title, release year, genre, runtime, overview, average rating, logged-in 1–5 rating, review form/list, watchlist controls, and watched-date diary control on the same page.
- [x] Provide login and registration forms with client and backend validation, helpful success/error messages, and correct redirects.
- [x] Provide authenticated watchlist, diary, and profile pages with useful empty states, links/actions, and database-derived profile statistics.

## PHP/PDO backend and security
- [x] Implement `backend/db.php`, `auth.php`, `movies.php`, `ratings.php`, `reviews.php`, `watchlist.php`, and `diary.php` as JSON endpoints using PDO prepared statements.
- [x] Implement registration, email/username login, session status/current user, logout with session destruction/cookie cleanup, password hashing/verification, session ID regeneration, and duplicate handling.
- [x] Implement movie listing/search/genre filtering/detail retrieval/average ratings and graceful invalid IDs.
- [x] Implement authenticated 1–5 rating create/update/current-rating/average retrieval with server-side range validation.
- [x] Implement authenticated review submission with non-empty and maximum-length validation, reviewer username, and dates.
- [x] Implement authenticated watchlist list/add/remove with movie existence checks and duplicate prevention.
- [x] Implement authenticated diary list/add/remove, user ownership checks, movie checks, and valid watched dates.
- [x] Return consistent JSON with HTTP status, success indicator, and helpful messages; do not expose raw SQL errors or passwords.

## Database and documentation
- [x] Create `sql/cinephile_simple.sql` for a separate `cinephile_simple` database with exactly six application tables: `users`, `movies`, `ratings`, `reviews`, `watchlist`, and `diary`.
- [x] Use InnoDB/utf8mb4, required fields, foreign keys/cascades, indexes, composite primary keys on ratings/watchlist, comments, and 12 requested starter movies without an unverifiable demo password.
- [x] Create beginner-friendly `README.md` with XAMPP/Linux setup, architecture/request flow, six-table schema/ER diagram, code walkthrough, approximately 20 accurate viva questions, demonstration script, abstract/objectives/methodology/modules/conclusion, and limitations.
- [x] Add `.gitignore` and `manus-routes.json`, and keep comments above each JS/PHP function plus important query/CSS/SQL explanations.

## Verification and handoff
- [x] Run PHP syntax checks for all backend files when PHP is installed.
- [x] Check SQL table count, starter movie names, foreign-key references, no destructive drop of the original `cinephile` database, and backend rating validation.
- [x] Check all eight HTML files, shared CSS/JS paths, internal links, route manifest, and representative API responses.
- [x] Run the live HTTPS feature flow with a disposable account: registration, movie detail, rating, review, watchlist, diary, profile statistics, logout, protected-route rejection, and cleanup.
- [x] Verify Preview serves the public pages and route manifest. XAMPP/Apache was not run directly in this sandbox; the README documents the exact next local test.
