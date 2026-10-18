<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';

/**
 * List individual diary entries for the current user, newest viewing first.
 */
function listDiary(PDO $pdo, array $user): void
{
    $query = $pdo->prepare(
        'SELECT d.id, d.watched_date, d.created_at, m.id AS movie_id, m.title, m.release_year, m.runtime_min, m.genre, m.overview, m.poster_path
         FROM diary d INNER JOIN movies m ON m.id = d.movie_id
         WHERE d.user_id = ? ORDER BY d.watched_date DESC, d.created_at DESC'
    );
    $query->execute([$user['id']]);
    $entries = $query->fetchAll();
    foreach ($entries as &$entry) {
        $entry['id'] = (int) $entry['id'];
        $entry['movie_id'] = (int) $entry['movie_id'];
        $entry['release_year'] = (int) $entry['release_year'];
        $entry['runtime_min'] = (int) $entry['runtime_min'];
    }
    unset($entry);
    jsonResponse(true, 'Diary loaded.', ['entries' => $entries]);
}

/**
 * Add a dated viewing entry after validating both the movie and calendar date.
 */
function addDiaryEntry(PDO $pdo, array $user): void
{
    $input = requestData();
    $movieId = positiveInt($input['movie_id'] ?? null);
    $watchedDate = cleanText($input['watched_date'] ?? '', 10);
    if ($movieId === null) {
        jsonResponse(false, 'A valid movie ID is required.', null, 422);
    }
    // Allow one day ahead so users east of UTC can log tonight's film.
    if (!isValidDate($watchedDate) || $watchedDate > date('Y-m-d', strtotime('+1 day'))) {
        jsonResponse(false, 'Choose a valid watched date.', null, 422);
    }
    if (!movieExists($pdo, $movieId)) {
        jsonResponse(false, 'Choose an existing movie first.', null, 404);
    }
    $query = $pdo->prepare('INSERT INTO diary (user_id, movie_id, watched_date) VALUES (?, ?, ?)');
    $query->execute([$user['id'], $movieId, $watchedDate]);
    jsonResponse(true, 'Added to your diary.', ['entry_id' => (int) $pdo->lastInsertId()], 201);
}

/**
 * Delete one diary entry only when it belongs to the current user.
 */
function removeDiaryEntry(PDO $pdo, array $user): void
{
    $input = requestData();
    $entryId = positiveInt($input['entry_id'] ?? null);
    if ($entryId === null) {
        jsonResponse(false, 'A valid diary entry is required.', null, 422);
    }
    $query = $pdo->prepare('DELETE FROM diary WHERE id = ? AND user_id = ?');
    $query->execute([$entryId, $user['id']]);
    jsonResponse(true, 'Diary entry removed.');
}

$user = requireUser();
$pdo = getPdo();
$action = strtolower(cleanText($_GET['action'] ?? 'list', 20));
if ($action === 'list') {
    listDiary($pdo, $user);
} elseif ($action === 'add') {
    addDiaryEntry($pdo, $user);
} elseif ($action === 'remove') {
    removeDiaryEntry($pdo, $user);
} else {
    jsonResponse(false, 'Unknown diary action.', null, 404);
}
