<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';

/**
 * List the current user's saved movies with live average ratings.
 */
function listWatchlist(PDO $pdo, array $user): void
{
    $query = $pdo->prepare(
        'SELECT m.id, m.title, m.release_year, m.runtime_min, m.genre, m.overview, m.poster_path,
            w.created_at AS saved_at,
            (SELECT ROUND(AVG(r.stars), 1) FROM ratings r WHERE r.movie_id = m.id) AS average_rating
         FROM watchlist w INNER JOIN movies m ON m.id = w.movie_id
         WHERE w.user_id = ? ORDER BY w.created_at DESC'
    );
    $query->execute([$user['id']]);
    $movies = $query->fetchAll();
    foreach ($movies as &$movie) {
        $movie['id'] = (int) $movie['id'];
        $movie['release_year'] = (int) $movie['release_year'];
        $movie['runtime_min'] = (int) $movie['runtime_min'];
        $movie['average_rating'] = $movie['average_rating'] !== null ? (float) $movie['average_rating'] : null;
    }
    unset($movie);
    jsonResponse(true, 'Watchlist loaded.', ['movies' => $movies]);
}

/**
 * Add a movie once to the current user's watchlist.
 */
function addToWatchlist(PDO $pdo, array $user): void
{
    $input = requestData();
    $movieId = positiveInt($input['movie_id'] ?? null);
    if ($movieId === null) {
        jsonResponse(false, 'A valid movie ID is required.', null, 422);
    }
    if (!movieExists($pdo, $movieId)) {
        jsonResponse(false, 'Choose an existing movie first.', null, 404);
    }
    $query = $pdo->prepare('INSERT IGNORE INTO watchlist (user_id, movie_id) VALUES (?, ?)');
    $query->execute([$user['id'], $movieId]);
    jsonResponse(true, 'Added to your watchlist.', ['in_watchlist' => true]);
}

/**
 * Remove a movie from the current user's watchlist only.
 */
function removeFromWatchlist(PDO $pdo, array $user): void
{
    $input = requestData();
    $movieId = positiveInt($input['movie_id'] ?? null);
    if ($movieId === null) {
        jsonResponse(false, 'A valid movie ID is required.', null, 422);
    }
    $query = $pdo->prepare('DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?');
    $query->execute([$user['id'], $movieId]);
    jsonResponse(true, 'Removed from your watchlist.', ['in_watchlist' => false]);
}

$user = requireUser();
$pdo = getPdo();
$action = strtolower(cleanText($_GET['action'] ?? 'list', 20));
if ($action === 'list') {
    listWatchlist($pdo, $user);
} elseif ($action === 'add') {
    addToWatchlist($pdo, $user);
} elseif ($action === 'remove') {
    removeFromWatchlist($pdo, $user);
} else {
    jsonResponse(false, 'Unknown watchlist action.', null, 404);
}
