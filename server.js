// Cinephile Lite backend: plain Node.js http module + MySQL (no Express)
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Simple .env reader (zero external npm dependencies)
if (fs.existsSync(path.join(__dirname, '.env'))) {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
    .split('\n')
    .forEach((line) => {
      const [k, ...v] = line.split('=');
      if (k && v.length) process.env[k.trim()] = v.join('=').trim();
    });
}

const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const TMDB_KEY = process.env.TMDB_KEY || ''; // Read from .env or environment
const PORT = process.env.PORT || 3000;

// Allowed static files (prevents directory traversal)
const PAGES = {
  '/': 'index.html', '/index.html': 'index.html',
  '/dashboard.html': 'dashboard.html', '/browse.html': 'browse.html',
  '/diary.html': 'diary.html', '/watchlist.html': 'watchlist.html',
  '/style.css': 'style.css'
};

let db; // MySQL connection pool

// 5 Sample Diary Movies & 4 Watchlist Movies (High-reliability Amazon IMDb CDN links)
const DEMO_DIARY = [
  ['Interstellar', '2024-01-15', 5, 'Magnificent journey through space and time with Hans Zimmer score.', 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg', 157336],
  ['Inception', '2024-02-10', 5, 'Mind-bending dream heist with incredible visuals and direction.', 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_FMjpg_UX1000_.jpg', 27205],
  ['The Dark Knight', '2024-03-05', 5, 'Legendary film. Heath Ledger Joker sets the gold standard.', 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX1000_.jpg', 155],
  ['Spider-Man: No Way Home', '2024-04-18', 4, 'Emotional multiverse adventure uniting three generations of heroes.', 'https://m.media-amazon.com/images/M/MV5BMmFiZGZjMmEtMTA0Ni00MzA2LTljMTQtZDOTZTA1ZDU4ZTVhXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg', 634649],
  ['The Avengers', '2024-05-22', 4, 'The iconic superhero team-up that defined modern blockbuster cinema.', 'https://m.media-amazon.com/images/M/MV5BNGE0YTVjNzUtNzJjOS00NGNlLTgxMzctZTBhYzY5HpZjg4XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg', 24428]
];

const DEMO_WATCHLIST = [
  ['Dune', 'https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg', '2021', 'Paul Atreides fights for the desert planet Arrakis.', 438631],
  ['Oppenheimer', 'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg', '2023', 'The story of J. Robert Oppenheimer and the atomic bomb.', 872585],
  ['Doctor Strange', 'https://m.media-amazon.com/images/M/MV5BNjgwNzAzNjk1Nl5BMl5BanBnXkFtZTgwMzQ2NjI1OTE@._V1_FMjpg_UX1000_.jpg', '2016', 'A neurosurgeon discovers mystic arts after a tragic injury.', 284052],
  ['The Batman', 'https://m.media-amazon.com/images/M/MV5BMDdmMTBiNTYtMGMzYS00ODAzLWEzNDUtMDQxCEjYTM4Nl5BMl5BanBnXkFtZTgwNTU1ODg4NjE@._V1_FMjpg_UX1000_.jpg', '2022', 'Batman investigates Gotham underworld following cryptic riddles.', 414906]
];

// Offline fallback: ensures preview works even if MySQL server is not yet started
function fallbackDb() {
  let u = [{ id: 1, username: 'demo12345', password: 'demo12345' }];
  let d = DEMO_DIARY.map((m, i) => ({ id: i + 1, title: m[0], watched_date: m[1], rating: m[2], review: m[3], poster_url: m[4], tmdb_id: m[5] }));
  let w = DEMO_WATCHLIST.map((m, i) => ({ id: i + 1, title: m[0], poster_url: m[1], genre: m[2], description: m[3], tmdb_id: m[4] }));
  return {
    async query(sql, params = []) {
      const q = sql.toUpperCase();
      if (q.includes('FROM USERS')) return [u.filter(x => !params.length || (x.username === params[0] && x.password === params[1]))];
      if (q.includes('INSERT INTO USERS')) { u.push({ id: u.length + 1, username: params[0], password: params[1] }); return [{ insertId: u.length }]; }
      if (q.includes('COUNT(*) AS TOTALDIARY') || q.includes('TOTALDIARY')) return [[{ totalDiary: d.length, totalWatchlist: w.length }]];
      if (q.includes('COUNT(*) AS TOTALWATCHLIST')) return [[{ totalWatchlist: w.length }]];
      if (q.includes('FROM DIARY')) {
        if (params.length && q.includes('WHERE')) {
          const match = d.filter(x => (params[0] && x.tmdb_id == params[0]) || (x.title.toLowerCase() === (params[1] || '').toLowerCase()));
          return [match];
        }
        return [d];
      }
      if (q.includes('INSERT INTO DIARY')) {
        d.unshift({ id: Date.now(), title: params[0], watched_date: params[1], rating: params[2], review: params[3], poster_url: params[4], tmdb_id: params[5] || null });
        return [{ ok: true }];
      }
      if (q.includes('UPDATE DIARY')) {
        const row = d.find(x => x.id == params[5] || x.title === params[1]);
        if (row && params.length >= 6) Object.assign(row, { title: params[0], watched_date: params[1], rating: params[2], review: params[3], poster_url: params[4] });
        else if (row) row.poster_url = params[0];
        return [{ ok: true }];
      }
      if (q.includes('DELETE FROM DIARY')) { d = d.filter(x => x.id != params[0]); return [{ ok: true }]; }
      if (q.includes('FROM WATCHLIST')) {
        if (params.length && q.includes('WHERE')) {
          const match = w.filter(x => (params[0] && x.tmdb_id == params[0]) || (x.title.toLowerCase() === (params[1] || '').toLowerCase()));
          return [match];
        }
        return [w];
      }
      if (q.includes('INSERT INTO WATCHLIST')) {
        w.unshift({ id: Date.now(), title: params[0], poster_url: params[1], genre: params[2], description: params[3], tmdb_id: params[4] || null });
        return [{ ok: true }];
      }
      if (q.includes('DELETE FROM WATCHLIST')) { w = w.filter(x => x.id != params[0]); return [{ ok: true }]; }
      return [[]];
    }
  };
}

// Queries TMDB Search API via Node built-in https (keeps TMDB_KEY secret on server)
function searchTMDB(query) {
  return new Promise((resolve, reject) => {
    if (!TMDB_KEY) {
      return reject(new Error('TMDB_KEY is not configured on server. Please add TMDB_KEY=your_key to your .env file'));
    }
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.results) {
            const movies = parsed.results.slice(0, 12).map(m => ({
              tmdb_id: m.id,
              title: m.title || '',
              release_year: m.release_date ? m.release_date.split('-')[0] : 'N/A',
              overview: m.overview || 'No synopsis available.',
              poster_url: m.poster_path ? 'https://image.tmdb.org/t/p/w500' + m.poster_path : ''
            }));
            resolve(movies);
          } else {
            reject(new Error(parsed.status_message || 'TMDB search error'));
          }
        } catch (e) {
          reject(new Error('Failed to parse TMDB response'));
        }
      });
    }).on('error', (e) => reject(new Error('Connection error: ' + e.message)));
  });
}

// Creates database, tables, and seeds sample movies if tables are empty
async function setup() {
  try {
    const init = await mysql.createConnection({ user: DB_USER, password: DB_PASS });
    await init.query('CREATE DATABASE IF NOT EXISTS cinephile_lite');
    await init.end();

    db = mysql.createPool({ user: DB_USER, password: DB_PASS, database: 'cinephile_lite', dateStrings: true });

    await db.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE, password VARCHAR(50))`);
    await db.query(`CREATE TABLE IF NOT EXISTS diary (id INT AUTO_INCREMENT PRIMARY KEY, tmdb_id INT DEFAULT NULL, title VARCHAR(200), watched_date DATE, rating INT, review TEXT, poster_url TEXT)`);
    await db.query(`CREATE TABLE IF NOT EXISTS watchlist (id INT AUTO_INCREMENT PRIMARY KEY, tmdb_id INT DEFAULT NULL, title VARCHAR(200), poster_url TEXT, genre VARCHAR(50), description TEXT)`);

    // Ensure tmdb_id column exists on existing databases
    await db.query('ALTER TABLE diary ADD COLUMN tmdb_id INT DEFAULT NULL').catch(() => {});
    await db.query('ALTER TABLE watchlist ADD COLUMN tmdb_id INT DEFAULT NULL').catch(() => {});

    // Insert demo user if empty
    const [users] = await db.query('SELECT COUNT(*) AS count FROM users');
    if (users[0].count === 0) {
      await db.query('INSERT INTO users (username, password) VALUES (?, ?)', ['demo12345', 'demo12345']);
    }

    // Insert 5 diary movies if empty (no duplicate on restart)
    const [diary] = await db.query('SELECT COUNT(*) AS count FROM diary');
    if (diary[0].count === 0) {
      for (const m of DEMO_DIARY) {
        await db.query('INSERT INTO diary (title, watched_date, rating, review, poster_url, tmdb_id) VALUES (?,?,?,?,?,?)', m);
      }
    } else {
      for (const m of DEMO_DIARY) {
        await db.query('UPDATE diary SET poster_url = ? WHERE title = ? AND (poster_url LIKE "%tmdb%" OR poster_url = "")', [m[4], m[0]]);
      }
    }

    // Insert 4 watchlist movies if empty
    const [watch] = await db.query('SELECT COUNT(*) AS count FROM watchlist');
    if (watch[0].count === 0) {
      for (const w of DEMO_WATCHLIST) {
        await db.query('INSERT INTO watchlist (title, poster_url, genre, description, tmdb_id) VALUES (?,?,?,?,?)', w);
      }
    } else {
      for (const w of DEMO_WATCHLIST) {
        await db.query('UPDATE watchlist SET poster_url = ? WHERE title = ? AND (poster_url LIKE "%tmdb%" OR poster_url = "")', [w[1], w[0]]);
      }
    }
    console.log('MySQL ready: connected to cinephile_lite');
  } catch (e) {
    console.log('MySQL offline (' + e.message + ') -> running in preview mode');
    db = fallbackDb();
  }
}

// Sends JSON response with status code
function send(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// REST API logic
async function api(req, res, endpoint, id, b) {
  // 1. Login
  if (endpoint === 'login' && req.method === 'POST') {
    const [u] = await db.query('SELECT * FROM users WHERE username = ? AND password = ?', [b.username, b.password]);
    return u.length || (b.username === 'demo12345' && b.password === 'demo12345')
      ? send(res, 200, { ok: true })
      : send(res, 401, { error: 'Invalid username or password' });
  }

  // 2. Register
  if (endpoint === 'register' && req.method === 'POST') {
    if (!b.username || !b.password) return send(res, 400, { error: 'Username and password required' });
    try {
      await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [b.username.trim(), b.password.trim()]);
      return send(res, 201, { ok: true });
    } catch {
      return send(res, 400, { error: 'Username already taken' });
    }
  }

  // 3. Stats for Dashboard
  if (endpoint === 'stats' && req.method === 'GET') {
    const [d] = await db.query('SELECT COUNT(*) AS totalDiary FROM diary');
    const [w] = await db.query('SELECT COUNT(*) AS totalWatchlist FROM watchlist');
    return send(res, 200, { totalDiary: d[0].totalDiary, totalWatchlist: w[0].totalWatchlist });
  }

  // 4. TMDB Movie Search Proxy (keeps API key secure on server)
  if (endpoint === 'search' && req.method === 'POST') {
    if (!b.query || !b.query.trim()) return send(res, 400, { error: 'Please type a movie title to search' });
    try {
      const results = await searchTMDB(b.query.trim());
      return send(res, 200, results);
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
  }

  // 5. Diary CRUD (with duplicate check)
  if (endpoint === 'diary') {
    if (req.method === 'GET') {
      const [rows] = await db.query('SELECT * FROM diary ORDER BY watched_date DESC, id DESC');
      return send(res, 200, rows);
    }
    if (req.method === 'DELETE' && id) {
      await db.query('DELETE FROM diary WHERE id = ?', [id]);
      return send(res, 200, { ok: true });
    }
    if (req.method === 'POST') {
      // Duplicate prevention: check if movie was already logged for that date
      const [exists] = await db.query(
        'SELECT id FROM diary WHERE (tmdb_id IS NOT NULL AND tmdb_id = ? AND watched_date = ?) OR (LOWER(title) = LOWER(?) AND watched_date = ?)',
        [b.tmdb_id || null, b.watched_date, b.title.trim(), b.watched_date]
      );
      if (exists && exists.length > 0) {
        return send(res, 400, { error: `"${b.title}" is already recorded in your diary for this date.` });
      }

      await db.query('INSERT INTO diary (title, watched_date, rating, review, poster_url, tmdb_id) VALUES (?,?,?,?,?,?)',
        [b.title.trim(), b.watched_date, Number(b.rating), b.review || '', b.poster_url || '', b.tmdb_id || null]);
      return send(res, 201, { ok: true });
    }
    if (req.method === 'PUT' && id) {
      await db.query('UPDATE diary SET title=?, watched_date=?, rating=?, review=?, poster_url=? WHERE id=?',
        [b.title, b.watched_date, Number(b.rating), b.review || '', b.poster_url || '', id]);
      return send(res, 200, { ok: true });
    }
  }

  // 6. Watchlist CRUD (with duplicate check)
  if (endpoint === 'watchlist') {
    if (req.method === 'GET') {
      const [rows] = await db.query('SELECT * FROM watchlist ORDER BY id DESC');
      return send(res, 200, rows);
    }
    if (req.method === 'DELETE' && id) {
      await db.query('DELETE FROM watchlist WHERE id = ?', [id]);
      return send(res, 200, { ok: true });
    }
    if (req.method === 'POST') {
      // Duplicate prevention: check if movie already in watchlist
      const [exists] = await db.query(
        'SELECT id FROM watchlist WHERE (tmdb_id IS NOT NULL AND tmdb_id = ?) OR LOWER(title) = LOWER(?)',
        [b.tmdb_id || null, b.title.trim()]
      );
      if (exists && exists.length > 0) {
        return send(res, 400, { error: `"${b.title}" is already in your watchlist.` });
      }

      await db.query('INSERT INTO watchlist (title, poster_url, genre, description, tmdb_id) VALUES (?,?,?,?,?)',
        [b.title.trim(), b.poster_url || '', b.genre || '', b.description || '', b.tmdb_id || null]);
      return send(res, 201, { ok: true });
    }
  }

  send(res, 404, { error: 'Not found' });
}

// HTTP Server
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const parts = url.split('/');
  const endpoint = parts[2];
  const id = parts[3];

  if (parts[1] === 'api') {
    let bodyText = '';
    req.on('data', (c) => (bodyText += c));
    req.on('end', async () => {
      let body = {};
      try { if (bodyText) body = JSON.parse(bodyText); } catch {}
      try { await api(req, res, endpoint, id, body); } catch (e) { send(res, 500, { error: e.message }); }
    });
    return;
  }

  const file = PAGES[url];
  if (!file) { res.writeHead(404); return res.end('Not Found'); }
  res.writeHead(200, { 'Content-Type': file.endsWith('.css') ? 'text/css' : 'text/html' });
  res.end(fs.readFileSync(path.join(__dirname, file)));
});

setup().then(() => {
  server.listen(PORT, () => console.log('Open http://localhost:' + PORT));
});
