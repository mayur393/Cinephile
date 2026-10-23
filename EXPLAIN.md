# Cinephile Lite - cheat sheet

(Documentation only. Delete it if you want strictly 5 files. `package.json`, `package-lock.json` and `node_modules` are NOT code you wrote: `npm` generates them when installing the MySQL driver.)

## 1. How to run
**Install MySQL**
- Linux (Fedora): `sudo dnf install mysql-server`, then `sudo systemctl start mysqld`. (Ubuntu: `sudo apt install mysql-server`, `sudo systemctl start mysql`.)
- Windows: download "MySQL Installer" from mysql.com (Server only), set a root password, tick "start as Windows service". Or install XAMPP and press Start next to MySQL.

**Run the project** (from the project folder)
```
npm install
DB_PASS=yourpassword node server.js
```
Windows cmd: `set DB_PASS=yourpassword` then `node server.js`. Empty root password: just `node server.js`. Open http://localhost:3000 (busy port: `PORT=3456 node server.js`). The database `cinephile` and both tables are created automatically.

## 2. What each file does
- `index.html` - home page: hero with two buttons.
- `diary.html` - diary form + poster cards; its script talks to `/api/diary`.
- `watchlist.html` - watchlist pill form + rows; its script talks to `/api/watchlist`.
- `style.css` - all colours and layout.
- `server.js` - Node `http` server, MySQL connection, API routes.

## 3. How it works
1. You open a page: the browser asks `server.js` for `/diary.html`; it is only sent if it is in the whitelist (server.js:13).
2. The page script runs `load()`, which calls `fetch('/api/diary')`.
3. `http.createServer` (server.js:74) splits the URL into `parts` (line 76) and sees `api` + `diary`.
4. The body is read with `req.on('data')` / `req.on('end')` (lines 81-82) and parsed with `JSON.parse` (line 84).
5. `api()` (line 47) checks `req.method` (GET / POST / PUT / DELETE) and runs the matching SQL with `?` placeholders.
6. The answer goes back as JSON with a status code (200, 201, 400, 500).
7. `load()` loops with `forEach`, builds cards with `createElement` + `textContent`, and puts them in the page.
8. Add: submit -> check -> `fetch` POST -> `load()`. Edit: button fills the form and remembers `editId`; Save then sends PUT.

## 4. Teacher asks -> change this
| Change | Where |
|---|---|
| Page title (tab text) | `<title>` line 6 of each html file |
| Main heading | index.html:18, diary.html:16, watchlist.html:16 |
| Logo text | line 13 of each html file (`<strong>`) |
| Button text | diary.html:25 (Save), watchlist.html:21 (Add), index.html:20 (hero buttons); Edit/Delete/Remove text in the `textContent` lines near diary.html:76-88 / watchlist.html:44 |
| Input placeholder | diary.html:20-24, watchlist.html:20 |
| Rating limits | diary.html:22 (`min`/`max`), diary.html:36 (`MIN_RATING`, `MAX_RATING`), server.js:42 |
| Validation message | diary.html:103, server.js:39-42 |
| Main (gold) colour / background | style.css:3 (`--gold`), style.css:2 (`--ink`) |
| Card size / columns | style.css:28 (`minmax(220px, 1fr)`); poster height style.css:36 (`280px`) |
| Layout direction | style.css:10 (`nav` flexbox), style.css:28 (grid) |
| Mobile breakpoint | style.css:45 (`600px`) |
| Hover effect | style.css:13 and 22 (colour only) |
| Sticky nav | style.css:9 (`position: sticky`) |
| Active link highlight | `class="active"` in the nav of each html file; style.css:14 |
| Port | server.js:10 |
| DB user / password | server.js:8-9 |
| DB name / table | server.js:21, 23, 24, 27 |
| Poster placeholder emoji | diary.html:46 |
| Add a new field (e.g. `genre`) | diary.html: new `<input>` (~line 24), fill it in the Edit handler (~line 83), add it to the `movie` object (~line 105), show it on the card (~line 71). server.js: column in CREATE TABLE (line 25), `check()` (line 38), `vals` (line 59), UPDATE (line 62), INSERT (line 66). On an existing DB also run `ALTER TABLE diary ADD genre VARCHAR(50)`. |

## 5. Practical -> file
No practical list was given, so it is mapped by topic:
| Topic | File |
|---|---|
| HTML structure, semantic tags | all html files (`header nav main section footer`) |
| Forms + validation | diary.html:19-27 (`required`, `min`, `max`), JS check line 103 |
| CSS, variables, flexbox, grid | style.css |
| Responsive design | style.css:45 + viewport meta tag |
| JavaScript / DOM | diary.html script (`createElement`, `textContent`) |
| Events | `addEventListener` (diary.html:78, 100) |
| fetch / JSON | diary.html:59, 107 |
| Node http server, routing | server.js:74-93 |
| MySQL connection + CRUD | server.js:19-29 (connect/create), 47-70 (CRUD) |

## 6. Viva Q&A
- **http module vs Express?** `http` is built into Node; we write routing ourselves with `if` on the URL and `req.method`. Express is a library giving `app.get()`. We used plain `http` as required.
- **Request / response?** Browser sends a request (URL, method, body); server answers with a response (status code, headers, body): `req` and `res`.
- **Routing?** Splitting `req.url` into parts and checking the method to decide what to do (server.js:76-78, 47-67).
- **JSON body parsing?** Body comes in chunks: `req.on('data')` collects, `req.on('end')` runs `JSON.parse`. Bad JSON gives 400.
- **MySQL connection?** `mysql2` package; `createPool` with user, password, database (line 23).
- **CRUD SQL?** INSERT (create), SELECT (read), UPDATE, DELETE: lines 50, 54, 62, 66.
- **SQL injection?** An attacker types SQL into a field. We use `?` placeholders, so values are sent separately and never run as SQL.
- **fetch?** Browser function that makes an HTTP request and returns a Promise; `await` waits for it.
- **DOM?** The tree of the page; JS changes it with `createElement` and `append`. `textContent` instead of `innerHTML` stops XSS.
- **Events?** `addEventListener('click' / 'submit', fn)` runs a function when the user acts; `preventDefault` stops the page reload.
- **Responsive CSS?** viewport meta tag, `auto-fill/minmax` grid, one `@media (max-width: 600px)` rule.
- **Status codes?** 200 ok, 201 created, 400 bad data, 404 not found, 500 server/database error.
- **Why no LocalStorage?** Data lives in MySQL, so it is saved on the server for every browser.
- **Why `__dirname`?** It is the folder of server.js, so pages load even if you start the server from another folder.
