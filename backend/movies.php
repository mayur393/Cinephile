<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';

/**
 * List movies with optional title search and exact genre filtering.
 */
function listMovies(PDO $pdo): void
{
    $search = cleanText($_GET['search'] ?? '', 100);
    $genre = cleanText($_GET['genre'] ?? '', 60);
    $conditions = [];
    $parameters = [];

    if ($search !== '') {
        $conditions[] = 'm.title LIKE ?';
        $parameters[] = '%' . $search . '%';
    }
    if ($genre !== '') {
        $conditions[] = 'm.genre = ?';
        $parameters[] = $genre;
    }

    $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';
    // The correlated subquery keeps the starter schema simple while calculating live averages.
    $query = $pdo->prepare(
        "SELECT m.id, m.title, m.release_year, m.runtime_min, m.genre, m.overview, m.poster_path,
            (SELECT ROUND(AVG(r.stars), 1) FROM ratings r WHERE r.movie_id = m.id) AS average_rating
         FROM movies m {$where} ORDER BY m.release_year DESC, m.title ASC"
    );
    $query->execute($parameters);
    $movies = $query->fetchAll();
    foreach ($movies as &$movie) {
        $movie['id'] = (int) $movie['id'];
        $movie['release_year'] = (int) $movie['release_year'];
        $movie['runtime_min'] = (int) $movie['runtime_min'];
        $movie['average_rating'] = $movie['average_rating'] !== null ? (float) $movie['average_rating'] : null;
    }
    unset($movie);
    jsonResponse(true, 'Movies loaded.', ['movies' => $movies]);
}

/**
 * Return one movie and its live average rating plus the current user's saved state.
 */
function showMovie(PDO $pdo): void
{
    $movieId = positiveInt($_GET['id'] ?? null);
    if ($movieId === null) {
        jsonResponse(false, 'A valid movie ID is required.', null, 422);
    }

    $query = $pdo->prepare(
        'SELECT m.id, m.title, m.release_year, m.runtime_min, m.genre, m.overview, m.poster_path,
            (SELECT ROUND(AVG(r.stars), 1) FROM ratings r WHERE r.movie_id = m.id) AS average_rating
         FROM movies m WHERE m.id = ?'
    );
    $query->execute([$movieId]);
    $movie = $query->fetch();
    if (!$movie) {
        jsonResponse(false, 'That movie could not be found.', null, 404);
    }

    $movie['id'] = (int) $movie['id'];
    $movie['release_year'] = (int) $movie['release_year'];
    $movie['runtime_min'] = (int) $movie['runtime_min'];
    $movie['average_rating'] = $movie['average_rating'] !== null ? (float) $movie['average_rating'] : null;
    $user = currentUser();
    $myRating = null;
    $inWatchlist = false;
    if ($user) {
        $ratingQuery = $pdo->prepare('SELECT stars FROM ratings WHERE user_id = ? AND movie_id = ?');
        $ratingQuery->execute([$user['id'], $movieId]);
        $myRating = $ratingQuery->fetchColumn();
        $watchlistQuery = $pdo->prepare('SELECT 1 FROM watchlist WHERE user_id = ? AND movie_id = ?');
        $watchlistQuery->execute([$user['id'], $movieId]);
        $inWatchlist = (bool) $watchlistQuery->fetchColumn();
    }
    jsonResponse(true, 'Movie loaded.', ['movie' => $movie, 'my_rating' => $myRating !== false && $myRating !== null ? (int) $myRating : null, 'in_watchlist' => $inWatchlist]);
}

/**
 * Return unique genres for the browse filter.
 */
function listGenres(PDO $pdo): void
{
    $query = $pdo->query('SELECT DISTINCT genre FROM movies ORDER BY genre ASC');
    jsonResponse(true, 'Genres loaded.', ['genres' => $query->fetchAll(PDO::FETCH_COLUMN)]);
}

$action = strtolower(cleanText($_GET['action'] ?? 'list', 20));
$pdo = getPdo();
if ($action === 'list') {
    listMovies($pdo);
} elseif ($action === 'detail') {
    showMovie($pdo);
} elseif ($action === 'genres') {
    listGenres($pdo);
} else {
    jsonResponse(false, 'Unknown movie action.', null, 404);
}
