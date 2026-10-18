# Cinephile Lite — Implementation Plan

## Product scope
Cinephile Lite is a small, explainable movie discovery and personal tracking site for a third-year Web Technology Lab project. It provides public movie discovery plus authenticated ratings, reviews, a watchlist, a diary, and profile statistics. The core interface is exactly eight HTML pages; PHP is used only for JSON backend endpoints and session/database work.

## Implementation approach
- **Frontend:** Eight semantic HTML documents share the same navigation shell, page sections, accessible form labels, and content placeholders. `assets/css/style.css` owns all visual styling. `assets/js/app.js` detects the current page, calls PHP endpoints with `fetch()`, renders cards/states, and wires forms/actions with small beginner-friendly functions.
- **Backend:** PHP 8 endpoints return a consistent `{success, message, data}` JSON shape. `backend/db.php` centralizes PDO creation, safe JSON output, input helpers, and database errors. `backend/auth.php` handles registration, login, logout, session status, and profile information. The remaining endpoint files keep one focused resource each.
- **Database:** `sql/cinephile_simple.sql` creates the separate `cinephile_simple` database and exactly six application tables with InnoDB, utf8mb4, foreign keys, composite keys where requested, and 12 starter movies. No demo password is seeded.
- **Local run:** The project is served through Apache/XAMPP for the documented setup. Preview uses PHP's built-in server on the managed port so both `.html` pages and PHP endpoints are available without a Node build system.
- **Fallback content:** The frontend has a small local starter catalog fallback for public presentation when a local database has not yet been imported. All user-specific actions remain database-backed and report a clear setup/login message when unavailable.

## Design direction
Three possible styles were considered: **Neo-noir editorial** (0.07), **Golden-age cinema lounge** (0.05), **Minimal streaming dashboard** (0.03). The selected direction is **Neo-noir editorial**.

- **Design Movement:** Neo-noir editorial, combining arthouse film-program typography with a restrained streaming-library interface.
- **Core Principles:** high-contrast hierarchy, warm human accents over a dark field, generous breathing room, and content-first cards.
- **Color Philosophy:** near-black charcoal makes posters and type feel projected; amber is reserved for ratings, primary actions, and focus moments so it feels like light leaking from a theater marquee.
- **Layout Paradigm:** asymmetric magazine-like sections with a wide hero, offset content rail, and compact metadata bands instead of a uniform centered grid everywhere.
- **Signature Elements:** a small amber “aperture” mark in the wordmark, thin gold rules like film leader marks, and pill-shaped metadata chips.
- **Interaction Philosophy:** actions should feel deliberate and legible: hover lifts cards slightly, buttons provide immediate state feedback, and forms explain what happened instead of silently failing.
- **Animation:** use short opacity/translate transitions for page sections and cards; avoid looping motion and respect reduced-motion preferences.
- **Typography System:** use system sans for UI and a serif display face (`Georgia`, `Times New Roman` fallback) for cinematic headlines; uppercase eyebrow labels provide editorial rhythm.
- **Brand Essence:** a personal film journal for curious students who want discovery and memory in one calm place; personality: observant, warm, quietly cinematic.
- **Brand Voice:** headlines sound like a film note, CTAs sound like an invitation. Example lines: “Find the next film worth remembering.” and “Keep this one in your reel.”
- **Wordmark & Logo:** `CINEPHILE` in spaced capitals with a small amber aperture-dot mark, plus `LITE` as a compact outlined label.
- **Signature Brand Color:** Marquee Amber `#e9b44c`.

## Project structure
- `index.html`, `movies.html`, `movie.html`, `login.html`, `register.html`, `watchlist.html`, `diary.html`, `profile.html`: the only main UI pages.
- `backend/db.php`: PDO connection and shared response/input helpers.
- `backend/auth.php`: session-based authentication and profile actions.
- `backend/movies.php`, `ratings.php`, `reviews.php`, `watchlist.php`, `diary.php`: focused JSON API resources with server-side authorization.
- `assets/css/style.css`: one responsive design system and component stylesheet.
- `assets/js/app.js`: page-aware vanilla JavaScript controller.
- `sql/cinephile_simple.sql`: fresh six-table schema and starter movies.
- `README.md`: local setup, architecture, database notes, viva preparation, and demonstration script.
- `manus-routes.json`: complete UI route manifest for Preview.

## Build workflow
Create the files in a clean initialized project, run PHP syntax checks and static structure checks, start the PHP development server on port 3000, verify `/manus-routes.json`, the eight HTML pages, and representative JSON endpoints, then commit and push the finished project to the canonical remote for a checkpoint. Preview will be delivered unless a separate publication is explicitly requested and confirmed by the platform.
