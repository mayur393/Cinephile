# Cinephile Lite - cheat sheet

(This file is documentation only. Delete it if you want strictly 5 files. `package.json`, `package-lock.json` and `node_modules` are NOT code you wrote: `npm` generates them when you install the MySQL driver.)

## 1. How to run
**Install MySQL**
- Linux (Fedora): `sudo dnf install mysql-server`, then `sudo systemctl start mysqld`. (Ubuntu: `sudo apt install mysql-server`, `sudo systemctl start mysql`.)
- Windows: download "MySQL Installer" from mysql.com, choose Server only, set a root password, tick "start as Windows service". Or install XAMPP and press Start next to MySQL.
- The server uses user `root` with an empty password by default. If yours has a password, run `DB_PASS=yourpass node server.js` (Windows cmd: `set DB_PASS=yourpass` then `node server.js`), or edit lines 7-8 of server.js.

**Run the project**
```
cd lite
npm install mysql2      # generates package.json + node_modules
node server.js
```
Open http://localhost:3000 . Database `cinephile` and both tables are created automatically. If port 3000 is busy: `PORT=3456 node server.js`.

## 2. What each file does
- `index.html` - home page, welcome text and links.
- `diary.html` - diary form + cards; JavaScript at the bottom talks to `/api/diary`.
- `watchlist.html` - watchlist form + cards; JavaScript talks to `/api/watchlist`.
- `style.css` - all colours and layout.
- `server.js` - Node `http` server, MySQL connection, API routes.

## 3. How it works
1. You open a page: the browser asks `server.js` for `/diary.html`; the server checks the whitelist (line 12) and sends the file.
2. The page's `<script>` runs `load()` which calls `fetch('/api/diary')`.
3. `http.createServer` (line 73) receives it, splits `req.url` into parts, sees `/api/diary` and calls `api()`.
4. Body is read with `req.on('data')` / `req.on('end')` (lines 77-78) and turned into an object with `JSON.parse`.
5. `api()` checks `req.method` (GET / POST / PUT / DELETE) and runs the matching SQL with `?` placeholders.
6. The result goes back as JSON with a status code (200, 201, 400, 500).
7. `load()` loops over the rows with `forEach`, builds cards with `createElement` + `textContent` and puts them in the page.
8. Add form: submit -> check -> `fetch` POST -> `load()` again. Edit: button fills the form and remembers `editId`; Save then sends PUT.

## 4. Teacher asks -> change this
| Change | Where |
|---|---|
| Page title (tab text) | `<title>` line 6 of each html file |
| Main heading | index.html:17, diary.html:15, watchlist.html:15 |
| Button text | diary.html:24 (Save), watchlist.html:21 (Add); Edit/Delete/Remove text in the `textContent` lines of diary.html ~60-75 / watchlist.html ~45 |
| Input placeholder | diary.html:19-23, watchlist.html:20 |
| Rating limits | diary.html:21 (`min`/`max`), diary.html:35 (`MIN_RATING`, `MAX_RATING`), server.js:41 |
| Validation message | diary.html:88, server.js:38-41 |
| Main colour / background | style.css:2 (`--main`, `--bg`) |
| Card size / columns | style.css:18 (`minmax(200px, 1fr)`), poster height style.css:20 |
| Layout direction | style.css:7 (`nav` flexbox), style.css:18 (grid) |
| Mobile breakpoint | style.css:23 (`600px`) |
| Hover effect | style.css:8 and 15 |
| Port | server.js:9 |
| DB user / password | server.js:7-8 |
| DB name / table | server.js:20, 22, 23, 26 |
| Placeholder poster | diary.html:36 |
| Add a new field (e.g. `genre`) | diary.html: new `<input>` (~line 23), fill it in the Edit handler (~line 68), add it to the `movie` object (~line 90), show it in the card (~line 58). server.js: column in CREATE TABLE (line 24), `check()` (line 37), `vals` (line 58), UPDATE (line 61), INSERT (line 65). Drop the old table or use `ALTER TABLE diary ADD genre VARCHAR(50)`. |

## 5. Practical -> file
No practical list was given, so mapped by topic:
| Topic | File |
|---|---|
| HTML structure, semantic tags | all html files (`header nav main section footer`) |
| Forms + validation | diary.html:17-27 (`required`, `min`, `max`), JS check line 88 |
| CSS, variables, flexbox, grid | style.css |
| Responsive design | style.css:23 + viewport meta tag |
| JavaScript / DOM | diary.html script (`createElement`, `textContent`) |
| Events | `addEventListener` (diary.html:63, 85) |
| fetch / JSON | diary.html:44, 92 |
| Node http server, routing | server.js:73-89 |
| MySQL connection + CRUD | server.js:18-28 (connect/create), 46-69 (CRUD) |

## 6. Viva Q&A
- **http module vs Express?** `http` is built into Node; we write routing ourselves with `if` on `req.url` and `req.method`. Express is a library that gives `app.get()` etc. We used plain `http` as required.
- **Request / response?** Browser sends a request (URL, method, body); server answers with a response (status code, headers, body). `req` and `res` in `createServer`.
- **Routing?** Looking at `req.url` and `req.method` to decide what to do (server.js:74-76, 47-66).
- **JSON body parsing?** Body comes in chunks: `req.on('data')` collects, `req.on('end')` runs `JSON.parse`. Bad JSON gives 400.
- **MySQL connection?** `mysql2` package; `createPool` with user, password, database (line 22).
- **CRUD SQL?** INSERT (create), SELECT (read), UPDATE, DELETE - lines 49, 53, 61, 65.
- **SQL injection?** Attacker types SQL into a field. We use `?` placeholders, so the driver sends values separately and they are never run as SQL.
- **fetch?** Browser function that makes an HTTP request and returns a Promise; `await` waits for it.
- **DOM?** Tree of the page; JS changes it with `createElement`, `append`. `textContent` instead of `innerHTML` stops XSS.
- **Events?** `addEventListener('click' / 'submit', fn)` runs a function when the user acts; `preventDefault` stops the page reload.
- **Responsive CSS?** viewport meta tag, `auto-fill/minmax` grid, and one `@media (max-width: 600px)` rule.
- **Status codes?** 200 ok, 201 created, 400 bad data, 404 not found, 500 server/database error.
- **Why no LocalStorage?** Data is kept in MySQL, so it is saved on the server for every browser.
