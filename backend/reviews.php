<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';

/**
 * List reviews for a movie, including the reviewer's public username and date.
 */
function listReviews(PDO $pdo): void
{
    $movieId = positiveInt($_GET['movie_id'] ?? null);
    if ($movieId === null) {
        jsonResponse(false, 'A valid movie ID is required.', null, 422);
    }
    $query = $pdo->prepare(
        'SELECT r.id, r.review_text, r.created_at, u.username
         FROM reviews r INNER JOIN users u ON u.id = r.user_id
         WHERE r.movie_id = ? ORDER BY r.created_at DESC'
    );
    $query->execute([$movieId]);
    $reviews = $query->fetchAll();
    jsonResponse(true, 'Reviews loaded.', ['reviews' => $reviews]);
}

/**
 * Validate and store a review written by the authenticated user.
 */
function createReview(PDO $pdo, array $user): void
{
    $input = requestData();
    $movieId = positiveInt($input['movie_id'] ?? null);
    $reviewText = cleanText($input['review_text'] ?? '', 1000);
    if ($movieId === null || $reviewText === '') {
        jsonResponse(false, 'Write a short review before submitting.', null, 422);
    }
    if (strlen($reviewText) < 10) {
        jsonResponse(false, 'Your review should be at least 10 characters long.', null, 422);
    }
    if (!movieExists($pdo, $movieId)) {
        jsonResponse(false, 'That movie does not exist.', null, 404);
    }
    $query = $pdo->prepare('INSERT INTO reviews (user_id, movie_id, review_text) VALUES (?, ?, ?)');
    $query->execute([$user['id'], $movieId, $reviewText]);
    jsonResponse(true, 'Your review was added.', ['review_id' => (int) $pdo->lastInsertId()], 201);
}

$action = strtolower(cleanText($_GET['action'] ?? 'list', 20));
$pdo = getPdo();
if ($action === 'list') {
    listReviews($pdo);
} elseif ($action === 'create') {
    createReview($pdo, requireUser());
} else {
    jsonResponse(false, 'Unknown review action.', null, 404);
}
