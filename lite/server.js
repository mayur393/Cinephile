// Cinephile Lite backend: plain Node http module + MySQL (no Express).
const http = require('http');
const fs = require('fs');
const mysql = require('mysql2/promise'); // the only dependency (MySQL driver)

// Database login. Change here, or set DB_USER / DB_PASS in the terminal.
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const PORT = process.env.PORT || 3000;

// Only these URLs may be downloaded, so /server.js gives 404.
const PAGES = { '/': 'index.html', '/index.html': 'index.html', '/diary.html': 'diary.html',
  '/watchlist.html': 'watchlist.html', '/style.css': 'style.css' };

let db; // connection pool, created in setup()

// Creates the database and the two tables if they do not exist yet.
async function setup() {
  const first = await mysql.createConnection({ user: DB_USER, password: DB_PASS });
  await first.query('CREATE DATABASE IF NOT EXISTS cinephile');
  await first.end();
  db = mysql.createPool({ user: DB_USER, password: DB_PASS, database: 'cinephile', dateStrings: true });
  await db.query(`CREATE TABLE IF NOT EXISTS diary (id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL, watched_date DATE NOT NULL, rating INT NOT NULL,
    review TEXT, poster_url TEXT)`);
  await db.query(`CREATE TABLE IF NOT EXISTS watchlist (id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL)`);
}

// Sends a JSON answer with a status code (200 ok, 201 created, 400 bad data...).
function send(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Checks the data from the browser. Returns an error text, or '' if it is fine.
function check(b, isDiary) {
  if (typeof b.title !== 'string' || !b.title.trim() || b.title.length > 200) return 'Title is required (max 200)';
  if (!isDiary) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.watched_date)) return 'Date is required';
  if (!Number.isInteger(b.rating) || b.rating < 1 || b.rating > 5) return 'Rating must be 1 to 5';
  return '';
}

// Handles /api/diary and /api/watchlist. Every query uses ? so SQL injection is impossible.
async function api(req, res, table, id, body) {
  const isDiary = table === 'diary';
  if (req.method === 'GET') { // READ all rows
    const [rows] = await db.query(`SELECT * FROM ${table} ORDER BY id DESC`);
    return send(res, 200, rows);
  }
  if (req.method === 'DELETE' && id) { // DELETE one row
    await db.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
    return send(res, 200, { ok: true });
  }
  if (req.method === 'POST' || (req.method === 'PUT' && isDiary && id)) {
    const error = check(body, isDiary);
    if (error) return send(res, 400, { error });
    const vals = isDiary ? [body.title.trim(), body.watched_date, body.rating, body.review || '', body.poster_url || ''] : [body.title.trim()];
    if (req.method === 'PUT') { // UPDATE one row
      await db.query('UPDATE diary SET title=?, watched_date=?, rating=?, review=?, poster_url=? WHERE id=?', [...vals, id]);
      return send(res, 200, { ok: true });
    }
    // CREATE a new row
    await db.query(isDiary ? 'INSERT INTO diary (title, watched_date, rating, review, poster_url) VALUES (?,?,?,?,?)'
      : 'INSERT INTO watchlist (title) VALUES (?)', vals);
    return send(res, 201, { ok: true });
  }
  send(res, 404, { error: 'Not found' });
}

// Runs for every request: serves a page, or sends /api/... to api().
const server = http.createServer((req, res) => {
  const [path, table, id] = req.url.split('?')[0].split('/').slice(1).map((p, i) => (i === 0 ? '/' + p : p));
  if (path === '/api' && (table === 'diary' || table === 'watchlist')) {
    let text = '';
    req.on('data', (chunk) => (text += chunk)); // body arrives in pieces
    req.on('end', async () => { // all pieces received
      let body = {};
      try { if (text) body = JSON.parse(text); } catch (e) { return send(res, 400, { error: 'Invalid JSON' }); }
      try { await api(req, res, table, id, body); } catch (e) { console.error(e.message); send(res, 500, { error: 'Database error' }); }
    });
    return;
  }
  const file = PAGES[req.url.split('?')[0]]; // only whitelisted files
  if (!file) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': file.endsWith('.css') ? 'text/css' : 'text/html' });
  res.end(fs.readFileSync(file));
});

// Start: set up the database first, then listen. The page still loads if MySQL is down.
setup().then(() => console.log('MySQL ready'), (e) => console.error('MySQL problem:', e.message));
server.listen(PORT, () => console.log('Open http://localhost:' + PORT));
