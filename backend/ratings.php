<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';

/**
 * Save or update one authenticated user's 1–5 star rating for a movie.
 */
function saveRating(PDO $pdo, array $user): void
{
    $input = requestData();
    $movieId = positiveInt($input['movie_id'] ?? null);
    $stars = filter_var($input['stars'] ?? null, FILTER_VALIDATE_INT);
    if ($movieId === null || $stars === false || $stars === null || $stars < 1 || $stars > 5) {
        jsonResponse(false, 'Choose a rating from 1 to 5 stars.', null, 422);
    }
    if (!movieExists($pdo, $movieId)) {
        jsonResponse(false, 'That movie does not exist.', null, 404);
    }

    $query = $pdo->prepare(
        'INSERT INTO ratings (user_id, movie_id, stars) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE stars = VALUES(stars), updated_at = CURRENT_TIMESTAMP'
    );
    $query->execute([$user['id'], $movieId, $stars]);
    jsonResponse(true, 'Your rating was saved.', ['stars' => (int) $stars]);
}

/**
 * Return the current user's rating and the live average for one movie.
 */
function getRating(PDO $pdo, array $user): void
{
    $movieId = positiveInt($_GET['movie_id'] ?? null);
    if ($movieId === null) {
        jsonResponse(false, 'A valid movie ID is required.', null, 422);
    }
    $mine = $pdo->prepare('SELECT stars FROM ratings WHERE user_id = ? AND movie_id = ?');
    $mine->execute([$user['id'], $movieId]);
    $myRating = $mine->fetchColumn();
    $average = $pdo->prepare('SELECT ROUND(AVG(stars), 1) FROM ratings WHERE movie_id = ?');
    $average->execute([$movieId]);
    $avgRating = $average->fetchColumn();
    jsonResponse(true, 'Rating loaded.', [
        'my_rating' => ($myRating !== false && $myRating !== null) ? (int) $myRating : null,
        'average_rating' => ($avgRating !== false && $avgRating !== null) ? (float) $avgRating : null
    ]);
}

$user = requireUser();
$pdo = getPdo();
$action = strtolower(cleanText($_GET['action'] ?? 'save', 20));
if ($action === 'save') {
    saveRating($pdo, $user);
} elseif ($action === 'get') {
    getRating($pdo, $user);
} else {
    jsonResponse(false, 'Unknown rating action.', null, 404);
}
