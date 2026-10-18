/* Cinephile Lite keeps page behavior in one beginner-friendly vanilla JavaScript file. */
const fallbackMovies = [
  {id: 1, title: 'Interstellar', release_year: 2014, runtime_min: 169, genre: 'Sci-Fi', overview: 'A team of explorers travels through a wormhole in search of a future for humanity, while one family waits beneath the stars.'},
  {id: 2, title: 'The Dark Knight', release_year: 2008, runtime_min: 152, genre: 'Crime', overview: 'Batman faces a criminal mastermind who turns Gotham into a test of courage, order, and moral choice.'},
  {id: 3, title: 'Inception', release_year: 2010, runtime_min: 148, genre: 'Sci-Fi', overview: 'A specialist who enters dreams is offered a chance to erase his past by planting an idea inside a target’s mind.'},
  {id: 4, title: 'Pulp Fiction', release_year: 1994, runtime_min: 154, genre: 'Crime', overview: 'Lives collide in a sharp, funny, and nonlinear collection of stories about chance, loyalty, and consequence.'},
  {id: 5, title: 'Spirited Away', release_year: 2001, runtime_min: 125, genre: 'Animation', overview: 'A young girl enters a mysterious spirit world and must find her courage to rescue her parents and return home.'},
  {id: 6, title: 'Dune', release_year: 2021, runtime_min: 155, genre: 'Sci-Fi', overview: 'A gifted heir travels to a dangerous desert world whose vast resources and ancient politics will shape his destiny.'},
  {id: 7, title: 'Parasite', release_year: 2019, runtime_min: 132, genre: 'Thriller', overview: 'An ambitious family slowly enters the life of a wealthy household, creating a tense portrait of class and desire.'},
  {id: 8, title: 'Whiplash', release_year: 2014, runtime_min: 107, genre: 'Drama', overview: 'A driven drummer joins an elite conservatory where an exacting teacher pushes ambition toward obsession.'},
  {id: 9, title: 'The Matrix', release_year: 1999, runtime_min: 136, genre: 'Action', overview: 'A programmer discovers that the world he knows is an elaborate simulation and joins a fight to wake humanity.'},
  {id: 10, title: 'Fight Club', release_year: 1999, runtime_min: 139, genre: 'Drama', overview: 'An insomniac office worker finds a new identity in an underground club that begins to grow beyond anyone’s control.'},
  {id: 11, title: 'The Shawshank Redemption', release_year: 1994, runtime_min: 142, genre: 'Drama', overview: 'A banker sentenced to prison builds a quiet friendship and a patient hope that refuses to disappear.'},
  {id: 12, title: 'Gladiator', release_year: 2000, runtime_min: 155, genre: 'Historical', overview: 'A betrayed Roman general is forced into the arena and turns survival into a path toward justice.'}
];
let currentUser = null;
let toastTimer = null;

// Start the correct page controller after the shared HTML has loaded.
async function initApp() {
  setupMenu();
  currentUser = await loadSession();
  updateNavigation();
  const page = document.body.dataset.page;
  if (page === 'home') loadHome();
  if (page === 'browse') loadBrowsePage();
  if (page === 'detail') loadMoviePage();
  if (page === 'login' || page === 'register') setupAuthPage(page);
  if (page === 'watchlist') loadWatchlistPage();
  if (page === 'diary') loadDiaryPage();
  if (page === 'profile') loadProfilePage();
}

// Call a PHP endpoint and turn non-2xx or unsuccessful JSON into a readable error.
async function api(path, options = {}) {
  const response = await fetch(path, {credentials: 'same-origin', ...options});
  let result;
  try { result = await response.json(); } catch (error) { throw new Error('The server returned an unreadable response.'); }
  if (!response.ok || !result.success) throw new Error(result.message || 'Something went wrong.');
  return result;
}

// Load the current login state so navigation and protected forms stay in sync.
async function loadSession() {
  try { const result = await api('backend/auth.php?action=status'); return result.data.user || null; }
  catch (error) { return null; }
}

// Build the responsive menu and its small-screen open/close interaction.
function setupMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// Show public or authenticated navigation items and highlight the current page.
function updateNavigation() {
  document.querySelectorAll('.auth-only').forEach((element) => { element.hidden = !currentUser; });
  document.querySelectorAll('.guest-only').forEach((element) => { element.hidden = Boolean(currentUser); });
  const page = document.body.dataset.page;
  const navName = page === 'detail' ? 'browse' : page;
  const active = document.querySelector(`[data-nav="${navName}"]`);
  if (active) active.classList.add('active');
  const logout = document.getElementById('logout-button');
  if (logout) logout.addEventListener('click', handleLogout);
}

// Send logout to PHP, then return the visitor to the public home page.
async function handleLogout() {
  try { await api('backend/auth.php?action=logout', {method: 'POST'}); window.location.href = 'index.html'; }
  catch (error) { showToast(error.message); }
}

// Display a short, non-blocking feedback message at the bottom of the page.
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3400);
}

// Put a message into a page state box without injecting HTML from users.
function setMessage(element, message, type = 'info') {
  if (!element) return;
  element.textContent = message;
  element.className = `message-box ${type}`;
  element.hidden = false;
}

// Add a small message below an authentication or review form.
function setFormMessage(element, message, success = false) {
  if (!element) return;
  element.textContent = message;
  element.className = success ? 'form-message success' : 'form-message';
}

// Return a local starter movie when the database has not been imported yet.
function findFallbackMovie(movieId) { return fallbackMovies.find((movie) => Number(movie.id) === Number(movieId)) || null; }

// Choose a repeatable visual tone for placeholder poster cards.
function posterTone(movieId) { return `poster-tone-${(Number(movieId) % 6) + 1}`; }

// Build a poster placeholder that remains useful when no image file exists.
function createPoster(movie, className = 'card-poster') {
  const poster = document.createElement('div');
  poster.className = `${className} ${posterTone(movie.id)}`;
  const title = document.createElement('span');
  title.textContent = movie.title;
  const genre = document.createElement('small');
  genre.textContent = movie.genre || 'Film';
  poster.append(title, genre);
  if (movie.poster_path) {
    poster.style.backgroundImage = `linear-gradient(transparent 45%, rgba(0,0,0,.82)), url("${movie.poster_path}")`;
    poster.style.backgroundPosition = 'center';
    poster.style.backgroundSize = 'cover';
  }
  return poster;
}

// Create one accessible movie card used by home, browse, and collection pages.
function createMovieCard(movie) {
  const article = document.createElement('article');
  article.className = 'movie-card';
  const link = document.createElement('a');
  link.className = 'movie-card-link';
  link.href = `movie.html?id=${encodeURIComponent(movie.id)}`;
  link.appendChild(createPoster(movie));
  const info = document.createElement('div');
  info.className = 'movie-card-info';
  const title = document.createElement('h3');
  title.textContent = movie.title;
  const meta = document.createElement('div');
  meta.className = 'movie-meta';
  meta.textContent = `${movie.release_year} · ${movie.genre} · ${movie.runtime_min} min`;
  const rating = document.createElement('div');
  rating.className = 'rating-line';
  if (movie.average_rating) rating.textContent = `★ ${Number(movie.average_rating).toFixed(1)} / 5`;
  else { rating.textContent = '★ '; const muted = document.createElement('span'); muted.className = 'muted-rating'; muted.textContent = 'Not rated yet'; rating.appendChild(muted); }
  info.append(title, meta, rating);
  link.appendChild(info);
  article.appendChild(link);
  return article;
}

// Render a set of movie cards or a clear empty state into a grid.
function renderMovieGrid(container, movies, emptyText = 'No films matched that search.') {
  if (!container) return;
  container.replaceChildren();
  if (!movies.length) { const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = emptyText; container.appendChild(empty); return; }
  movies.forEach((movie) => container.appendChild(createMovieCard(movie)));
}

// Load public movie sections and fall back to the local starter catalogue when needed.
async function loadHome() {
  let movies = fallbackMovies;
  try { movies = (await api('backend/movies.php?action=list')).data.movies; } catch (error) { showToast('Showing starter films while the database is being set up.'); }
  renderMovieGrid(document.getElementById('featured-movies'), movies.slice(0, 4), 'The catalogue is ready for its first import.');
  renderMovieGrid(document.getElementById('popular-movies'), movies.slice(4, 10), 'Browse the catalogue to begin.');
}

// Connect the browse form, genre selector, and clear button.
function loadBrowsePage() {
  const form = document.getElementById('movie-search-form');
  const clear = document.getElementById('clear-search');
  form.addEventListener('submit', (event) => { event.preventDefault(); loadBrowseMovies(); });
  document.getElementById('genre-filter').addEventListener('change', loadBrowseMovies);
  clear.addEventListener('click', () => { document.getElementById('movie-search').value = ''; document.getElementById('genre-filter').value = ''; loadBrowseMovies(); });
  loadGenres();
  loadBrowseMovies();
}

// Populate the genre dropdown from the database or from the starter data.
async function loadGenres() {
  const select = document.getElementById('genre-filter');
  let genres;
  try { genres = (await api('backend/movies.php?action=genres')).data.genres; } catch (error) { genres = [...new Set(fallbackMovies.map((movie) => movie.genre))].sort(); }
  genres.forEach((genre) => { const option = document.createElement('option'); option.value = genre; option.textContent = genre; select.appendChild(option); });
}

// Search the catalogue and show loading, error, and empty states.
async function loadBrowseMovies() {
  const grid = document.getElementById('movies-grid');
  const errorBox = document.getElementById('movies-error');
  const count = document.getElementById('movie-result-count');
  const search = document.getElementById('movie-search').value.trim();
  const genre = document.getElementById('genre-filter').value;
  grid.replaceChildren();
  const loading = document.createElement('div'); loading.className = 'loading-state'; loading.textContent = 'Searching the catalogue…'; grid.appendChild(loading);
  errorBox.hidden = true;
  try {
    const params = new URLSearchParams({action: 'list'}); if (search) params.set('search', search); if (genre) params.set('genre', genre);
    const movies = (await api(`backend/movies.php?${params.toString()}`)).data.movies;
    count.textContent = `${movies.length} ${movies.length === 1 ? 'film' : 'films'} found`;
    renderMovieGrid(grid, movies);
  } catch (error) {
    const filtered = fallbackMovies.filter((movie) => (!search || movie.title.toLowerCase().includes(search.toLowerCase())) && (!genre || movie.genre === genre));
    count.textContent = `${filtered.length} starter ${filtered.length === 1 ? 'film' : 'films'} found`;
    renderMovieGrid(grid, filtered);
    setMessage(errorBox, 'The database is not connected yet, so you are viewing local starter data. Import the SQL file for live search and accounts.', 'info');
  }
}

// Load a selected movie, its reviews, and the actions allowed for the current visitor.
async function loadMoviePage() {
  const movieId = new URLSearchParams(window.location.search).get('id');
  const detail = document.getElementById('movie-detail');
  const errorBox = document.getElementById('movie-error');
  if (!movieId) { setMessage(errorBox, 'Choose a movie from the browse page first.', 'error'); return; }
  let payload;
  try { payload = (await api(`backend/movies.php?action=detail&id=${encodeURIComponent(movieId)}`)).data; }
  catch (error) { const fallback = findFallbackMovie(movieId); if (!fallback) { setMessage(errorBox, error.message, 'error'); return; } payload = {movie: fallback, my_rating: null, in_watchlist: false}; }
  renderMovieDetail(detail, payload.movie, payload);
  loadReviews(movieId);
}

// Render the movie detail layout and wire rating, watchlist, and diary actions.
function renderMovieDetail(container, movie, payload) {
  container.replaceChildren();
  const posterWrap = document.createElement('div'); posterWrap.appendChild(createPoster(movie, 'detail-poster'));
  const copy = document.createElement('div'); copy.className = 'detail-copy';
  const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = 'Now showing in your journal';
  const title = document.createElement('h1'); title.textContent = movie.title;
  const meta = document.createElement('div'); meta.className = 'detail-meta'; [movie.release_year, movie.genre, `${movie.runtime_min} minutes`].forEach((value) => { const chip = document.createElement('span'); chip.className = 'meta-chip'; chip.textContent = value; meta.appendChild(chip); });
  const overview = document.createElement('p'); overview.className = 'detail-overview'; overview.textContent = movie.overview;
  const rating = document.createElement('div'); rating.className = 'detail-rating'; const big = document.createElement('span'); big.className = 'big-rating'; big.textContent = movie.average_rating ? `★ ${Number(movie.average_rating).toFixed(1)}` : '★ —'; const ratingNote = document.createElement('small'); ratingNote.textContent = movie.average_rating ? ' community rating' : ' no ratings yet'; big.appendChild(ratingNote); rating.appendChild(big);
  const actions = document.createElement('div'); actions.className = 'detail-tools';
  if (currentUser) {
    const ratingForm = document.createElement('form'); ratingForm.className = 'rating-form'; ratingForm.id = 'rating-form'; const label = document.createElement('label'); label.setAttribute('for', 'rating-select'); label.textContent = 'Your rating'; const select = document.createElement('select'); select.id = 'rating-select'; for (let number = 1; number <= 5; number += 1) { const option = document.createElement('option'); option.value = number; option.textContent = `${number} star${number === 1 ? '' : 's'}`; if (Number(payload.my_rating) === number) option.selected = true; select.appendChild(option); } const save = document.createElement('button'); save.className = 'button button-secondary'; save.type = 'submit'; save.textContent = payload.my_rating ? 'Update rating' : 'Rate this film'; ratingForm.append(label, select, save); ratingForm.addEventListener('submit', (event) => submitRating(event, movie.id)); actions.appendChild(ratingForm);
    const actionRow = document.createElement('div'); actionRow.className = 'action-row'; const watch = document.createElement('button'); watch.className = 'button button-secondary'; watch.id = 'watchlist-button'; watch.type = 'button'; watch.textContent = payload.in_watchlist ? 'Remove from watchlist' : 'Add to watchlist'; watch.addEventListener('click', () => toggleWatchlist(movie.id, Boolean(payload.in_watchlist))); actionRow.appendChild(watch); actions.appendChild(actionRow);
    const diaryForm = document.createElement('form'); diaryForm.className = 'diary-inline'; diaryForm.id = 'diary-form'; const dateLabel = document.createElement('label'); dateLabel.textContent = 'Watched on'; const date = document.createElement('input'); date.type = 'date'; date.name = 'watched_date'; date.required = true; date.value = new Date().toISOString().slice(0, 10); const diaryButton = document.createElement('button'); diaryButton.className = 'button button-primary'; diaryButton.type = 'submit'; diaryButton.textContent = 'Add to diary'; dateLabel.appendChild(date); diaryForm.append(dateLabel, diaryButton); diaryForm.addEventListener('submit', (event) => submitDiary(event, movie.id)); actions.appendChild(diaryForm);
  } else {
    const note = document.createElement('p'); note.className = 'field-hint'; note.textContent = 'Log in to rate, review, save, or record this film.'; actions.appendChild(note); const link = document.createElement('a'); link.className = 'button button-primary'; link.href = 'login.html'; link.textContent = 'Log in to keep it'; actions.appendChild(link);
  }
  copy.append(eyebrow, title, meta, overview, rating, actions); container.append(posterWrap, copy);
}

// Load and safely render existing review text using textContent.
async function loadReviews(movieId) {
  const list = document.getElementById('review-list');
  try { const reviews = (await api(`backend/reviews.php?action=list&movie_id=${encodeURIComponent(movieId)}`)).data.reviews; renderReviews(list, reviews); }
  catch (error) { list.replaceChildren(); const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = 'Reviews will appear here after the database is connected.'; list.appendChild(empty); }
  const form = document.getElementById('review-form'); const note = document.getElementById('review-login-note'); if (currentUser) { form.classList.remove('hidden'); note.classList.add('hidden'); form.onsubmit = (event) => submitReview(event, movieId); } else { form.classList.add('hidden'); note.classList.remove('hidden'); }
}

// Render review cards without using unsafe HTML interpolation.
function renderReviews(container, reviews) {
  container.replaceChildren();
  if (!reviews.length) { const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = 'No notes yet. Be the first person to leave one.'; container.appendChild(empty); return; }
  reviews.forEach((review) => { const card = document.createElement('article'); card.className = 'review-card'; const header = document.createElement('div'); header.className = 'review-card-header'; const name = document.createElement('strong'); name.textContent = review.username; const time = document.createElement('time'); time.textContent = new Date(review.created_at).toLocaleDateString(); header.append(name, time); const text = document.createElement('p'); text.textContent = review.review_text; card.append(header, text); container.appendChild(card); });
}

// Send the selected 1–5 star rating to the protected PHP endpoint.
async function submitRating(event, movieId) {
  event.preventDefault(); const stars = document.getElementById('rating-select').value;
  try { await api('backend/ratings.php?action=save', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({movie_id: movieId, stars: Number(stars)})}); showToast('Your rating was saved.'); loadMoviePage(); }
  catch (error) { showToast(error.message); }
}

// Add or remove the current movie from the authenticated watchlist.
async function toggleWatchlist(movieId, inWatchlist) {
  const action = inWatchlist ? 'remove' : 'add';
  try { await api(`backend/watchlist.php?action=${action}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({movie_id: movieId})}); showToast(inWatchlist ? 'Removed from your watchlist.' : 'Added to your watchlist.'); loadMoviePage(); }
  catch (error) { showToast(error.message); }
}

// Submit a review and refresh the review list after the server confirms it.
async function submitReview(event, movieId) {
  event.preventDefault(); const form = event.currentTarget; const message = document.getElementById('review-message'); const reviewText = document.getElementById('review-text').value.trim();
  if (reviewText.length < 10) { setFormMessage(message, 'Your review should be at least 10 characters long.'); return; }
  try { await api('backend/reviews.php?action=create', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({movie_id: movieId, review_text: reviewText})}); form.reset(); setFormMessage(message, 'Your review was published.', true); loadReviews(movieId); }
  catch (error) { setFormMessage(message, error.message); }
}

// Record a viewing date in the authenticated diary.
async function submitDiary(event, movieId) {
  event.preventDefault(); const date = event.currentTarget.querySelector('input[name="watched_date"]').value;
  try { await api('backend/diary.php?action=add', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({movie_id: movieId, watched_date: date})}); showToast('Added to your diary.'); }
  catch (error) { showToast(error.message); }
}

// Load the authenticated watchlist page or redirect guests to login.
async function loadWatchlistPage() {
  if (!currentUser) { window.location.href = 'login.html?next=watchlist.html'; return; }
  const grid = document.getElementById('watchlist-grid'); const message = document.getElementById('watchlist-message');
  try { const movies = (await api('backend/watchlist.php?action=list')).data.movies; renderMovieGrid(grid, movies, 'Your watchlist is empty. Browse the catalogue and save a film for later.'); }
  catch (error) { grid.replaceChildren(); setMessage(message, error.message, 'error'); }
}

// Load the authenticated diary and render each dated viewing entry.
async function loadDiaryPage() {
  if (!currentUser) { window.location.href = 'login.html?next=diary.html'; return; }
  const list = document.getElementById('diary-list'); const message = document.getElementById('diary-message');
  try { const entries = (await api('backend/diary.php?action=list')).data.entries; renderDiary(list, entries); }
  catch (error) { list.replaceChildren(); setMessage(message, error.message, 'error'); }
}

// Render diary rows with a remove button for each viewing entry.
function renderDiary(container, entries) {
  container.replaceChildren();
  if (!entries.length) { const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = 'Your diary is waiting for its first entry. Open a movie to record a viewing.'; container.appendChild(empty); return; }
  entries.forEach((entry) => { const row = document.createElement('article'); row.className = 'diary-entry'; const thumb = document.createElement('div'); thumb.className = `diary-thumb ${posterTone(entry.movie_id)}`; thumb.textContent = entry.title; const details = document.createElement('div'); const title = document.createElement('h3'); const link = document.createElement('a'); link.href = `movie.html?id=${encodeURIComponent(entry.movie_id)}`; link.textContent = entry.title; title.appendChild(link); const meta = document.createElement('p'); meta.textContent = `${entry.release_year} · ${entry.genre} · ${entry.runtime_min} minutes`; details.append(title, meta); const date = document.createElement('time'); date.className = 'diary-date'; date.dateTime = entry.watched_date; date.textContent = new Date(`${entry.watched_date}T00:00:00`).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'}); const remove = document.createElement('button'); remove.className = 'button button-secondary'; remove.type = 'button'; remove.textContent = 'Remove'; remove.addEventListener('click', () => removeDiaryEntry(entry.id)); row.append(thumb, details, date, remove); container.appendChild(row); });
}

// Remove one diary entry after the server checks ownership.
async function removeDiaryEntry(entryId) { try { await api('backend/diary.php?action=remove', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({entry_id: entryId})}); showToast('Diary entry removed.'); loadDiaryPage(); } catch (error) { showToast(error.message); } }

// Load profile information and real database-derived statistics.
async function loadProfilePage() {
  if (!currentUser) { window.location.href = 'login.html?next=profile.html'; return; }
  const shell = document.getElementById('profile-shell'); const message = document.getElementById('profile-message');
  try { const data = (await api('backend/auth.php?action=profile')).data; renderProfile(shell, data); }
  catch (error) { shell.replaceChildren(); setMessage(message, error.message, 'error'); }
}

// Render the profile header, four statistics, and links to the user's collections.
function renderProfile(container, data) {
  const user = data.user; const stats = data.stats; container.className = '';
  const header = document.createElement('div'); header.className = 'profile-header'; const copy = document.createElement('div'); const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = 'Your film journal'; const title = document.createElement('h1'); title.textContent = user.username; const email = document.createElement('p'); email.className = 'profile-email'; email.textContent = user.email; copy.append(eyebrow, title, email); const mark = document.createElement('div'); mark.className = 'profile-mark'; mark.textContent = user.username.slice(0, 1).toUpperCase(); header.append(copy, mark);
  const statGrid = document.createElement('div'); statGrid.className = 'stats-grid'; [['watched_count', 'Films watched'], ['watchlist_count', 'On your watchlist'], ['review_count', 'Reviews written'], ['average_rating', 'Average rating']].forEach(([key, label]) => { const card = document.createElement('div'); card.className = 'stat-card'; const value = document.createElement('strong'); value.textContent = stats[key] === null ? '—' : String(stats[key]); const name = document.createElement('span'); name.textContent = label; card.append(value, name); statGrid.appendChild(card); });
  const links = document.createElement('div'); links.className = 'profile-links'; const diaryLink = document.createElement('a'); diaryLink.className = 'button button-primary'; diaryLink.href = 'diary.html'; diaryLink.textContent = 'Open my diary'; const watchLink = document.createElement('a'); watchLink.className = 'button button-secondary'; watchLink.href = 'watchlist.html'; watchLink.textContent = 'Open my watchlist'; links.append(diaryLink, watchLink); container.append(header, statGrid, links);
}

// Attach registration and login validation to the matching form.
function setupAuthPage(page) {
  const form = document.querySelector('form[data-auth]');
  if (currentUser) { window.location.href = 'profile.html'; return; }
  form.addEventListener('submit', (event) => handleAuth(event, page));
}

// Validate credentials in the browser, then let PHP repeat validation and create the session.
async function handleAuth(event, page) {
  event.preventDefault(); const form = event.currentTarget; const message = document.getElementById('auth-message'); const data = Object.fromEntries(new FormData(form).entries());
  if (page === 'register') { if (data.password.length < 8) { setFormMessage(message, 'Password must be at least 8 characters.'); return; } if (data.password !== data.confirm_password) { setFormMessage(message, 'The passwords do not match.'); return; } }
  if (page === 'login' && (!data.login || !data.password)) { setFormMessage(message, 'Enter both fields to log in.'); return; }
  try { const result = await api(`backend/auth.php?action=${page}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)}); setFormMessage(message, result.message, true); const next = new URLSearchParams(window.location.search).get('next'); window.setTimeout(() => { window.location.href = next || (page === 'register' ? 'profile.html' : 'index.html'); }, 450); }
  catch (error) { setFormMessage(message, error.message); }
}

document.addEventListener('DOMContentLoaded', initApp);
