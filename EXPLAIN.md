# Cinephile Lite – External Viva Cheat Sheet & Setup Guide

**Project**: Cinephile Lite – My Movie Diary  
**Class**: Third Year B.Tech Computer Engineering (Web Technology Lab)  
**Stack**: HTML, CSS, JavaScript, Node.js (built-in `http` module), MySQL (`mysql2` driver), MySQL Workbench.

---

## 1. Software Setup for Windows

### Required:
1. **Node.js LTS**: Download and install from [https://nodejs.org/](https://nodejs.org/).
2. **MySQL Server**: Download MySQL Community Server or install **XAMPP** (start MySQL in XAMPP control panel).

### Optional (Recommended for Viva Demo):
3. **MySQL Workbench**: Visual GUI to view tables and rows during exam.

---

## 2. How to Run in VS Code

1. Open this project folder in **VS Code**.
2. Open terminal (`Ctrl + ~`) and install dependency:
   ```cmd
   npm install
   ```
3. Run the server:
   - If MySQL has a password:
     ```cmd
     set DB_PASS=yourpassword
     node server.js
     ```
   - If MySQL has no password (common in XAMPP):
     ```cmd
     node server.js
     ```
4. Open browser at: **`http://localhost:3000`**
5. Database `cinephile_lite`, tables (`users`, `diary`, `watchlist`), and sample movies are created **automatically**!

---

## 3. Demo Credentials

- **Username**: `demo12345`
- **Password**: `demo12345`

Clicking "Fill Demo Credentials" on the landing page automatically types them in.

---

## 4. How to View in MySQL Workbench

Open **MySQL Workbench**, connect to `localhost:3306`, and run:
```sql
USE cinephile_lite;

-- View all 3 tables
SHOW TABLES;

-- View users
SELECT * FROM users;

-- View 5 seeded diary movies (Interstellar, Inception, Dark Knight, Spider-Man, Avengers)
SELECT * FROM diary;

-- View 4 seeded watchlist movies (Dune, Oppenheimer, Doctor Strange, Batman)
SELECT * FROM watchlist;
```

---

## 5. What Each File Does (Easy Viva Explanation)

1. **`server.js`** (~140 lines):
   - Plain Node.js built-in `http` module server (no Express).
   - Connects to MySQL using `mysql2/promise` pool.
   - `setup()`: Creates database `cinephile_lite` and 3 tables (`users`, `diary`, `watchlist`).
   - Checks `COUNT(*) == 0` so sample movies are seeded only on first run (no duplicates on restart).
   - `api()`: Handles REST routes (`/api/login`, `/api/register`, `/api/stats`, `/api/diary`, `/api/watchlist`).
   - Uses parameterized queries (`?`) to prevent SQL Injection.
   - Serves whitelisted HTML and CSS files.

2. **`index.html`** (~70 lines):
   - Landing page introducing the project.
   - Simple tabs for demo login and account creation.
   - When login succeeds, redirects directly to `dashboard.html`.
   - Zero `localStorage` or `sessionStorage` (data lives in MySQL).

3. **`dashboard.html`** (~60 lines):
   - Shows welcome banner.
   - Calls `GET /api/stats` to display real-time counters: Total Movies Watched & Total in Watchlist.
   - Quick navigation links to Diary, Watchlist, and Logout.

4. **`diary.html`** (~110 lines):
   - Movie diary interface with full CRUD (Create, Read, Update, Delete).
   - Form for title, watched date, rating (1–5), poster URL, and personal review.
   - `load()`: Calls `GET /api/diary` and builds cards.
   - "Edit" copies row into form and sends `PUT /api/diary/:id`.
   - "Delete" sends `DELETE /api/diary/:id`.

5. **`watchlist.html`** (~80 lines):
   - Movies to watch later.
   - Form for title, genre, poster URL, and description.
   - `load()`: Calls `GET /api/watchlist` and displays cards.
   - "Remove" sends `DELETE /api/watchlist/:id`.

6. **`style.css`** (~75 lines):
   - Clean, minimal light theme with soft off-white background (`#f8fafc`).
   - Card borders, soft pastel blue and amber accents, rounded corners.
   - Mobile responsive layout.

---

## 6. Short Viva Q&A for External Examiner

- **Q: Why use Node `http` instead of Express?**  
  *A:* `http` is built into Node.js. It shows how HTTP requests, URL routing, request chunks (`req.on('data')`), status codes, and headers work without relying on external frameworks.

- **Q: Why MySQL instead of LocalStorage?**  
  *A:* `localStorage` is purely client-side browser storage and cannot be queried or shared across devices. MySQL is a relational database management system (RDBMS) that provides persistent, central server-side storage.

- **Q: How is SQL Injection prevented?**  
  *A:* By using parameterized queries with `?` placeholders (e.g. `db.query('INSERT ... VALUES (?)', [data])`). The driver sends values separately from the SQL statement so input cannot be executed as code.

- **Q: How is XSS (Cross-Site Scripting) prevented?**  
  *A:* We use `textContent` instead of `innerHTML` when inserting user data into the webpage DOM, so input is rendered purely as text.

- **Q: What HTTP status codes are used?**  
  *A:* `200` (OK), `201` (Created), `400` (Bad Request), `401` (Unauthorized), `404` (Not Found), `500` (Server/Database Error).

- **Q: How are duplicate demo movies avoided on server restart?**  
  *A:* In `setup()`, the server runs `SELECT COUNT(*) AS count` on the tables. It only inserts demo data if `count === 0`.
