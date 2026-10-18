<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

/**
 * Start a session with a secure cross-site cookie for HTTPS Preview and a local HTTP fallback.
 */
function startUserSession(): void
{
    if (session_status() !== PHP_SESSION_NONE) {
        return;
    }

    $forwardedProtocol = strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
    $isSecureRequest = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $forwardedProtocol === 'https' || getenv('CINEPHILE_PREVIEW') === '1';
    session_name('cinephile_session');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $isSecureRequest,
        'httponly' => true,
        'samesite' => $isSecureRequest ? 'None' : 'Lax',
    ]);
    session_start();
}

/**
 * Return the small public user object stored in the current session, or null when logged out.
 */
function currentUser(): ?array
{
    startUserSession();
    return isset($_SESSION['user']) && is_array($_SESSION['user']) ? $_SESSION['user'] : null;
}

/**
 * Require a logged-in session for protected actions and return its user object.
 */
function requireUser(): array
{
    $user = currentUser();
    if ($user === null) {
        jsonResponse(false, 'Please log in before using this feature.', null, 401);
    }
    return $user;
}

/**
 * Store only safe user fields after a successful login or registration.
 */
function saveSessionUser(array $user): void
{
    startUserSession();
    session_regenerate_id(true);
    $_SESSION['user'] = [
        'id' => (int) $user['id'],
        'username' => (string) $user['username'],
        'email' => (string) $user['email'],
    ];
}

/**
 * Return profile counts and the logged-in user's average submitted rating.
 */
function profileData(PDO $pdo, array $user): array
{
    $statsQuery = $pdo->prepare(
        'SELECT
            (SELECT COUNT(*) FROM diary WHERE user_id = ?) AS watched_count,
            (SELECT COUNT(*) FROM watchlist WHERE user_id = ?) AS watchlist_count,
            (SELECT COUNT(*) FROM reviews WHERE user_id = ?) AS review_count,
            (SELECT ROUND(AVG(stars), 1) FROM ratings WHERE user_id = ?) AS average_rating'
    );
    $statsQuery->execute([$user['id'], $user['id'], $user['id'], $user['id']]);
    $stats = $statsQuery->fetch() ?: [];
    return [
        'user' => $user,
        'stats' => [
            'watched_count' => (int) ($stats['watched_count'] ?? 0),
            'watchlist_count' => (int) ($stats['watchlist_count'] ?? 0),
            'review_count' => (int) ($stats['review_count'] ?? 0),
            'average_rating' => $stats['average_rating'] !== null ? (float) $stats['average_rating'] : null,
        ],
    ];
}

/**
 * Handle registration, login, logout, session status, and the profile response.
 */
function handleAuthRequest(): void
{
    $action = strtolower(cleanText($_GET['action'] ?? 'status', 40));

    if ($action === 'status') {
        $user = currentUser();
        jsonResponse(true, 'Session status loaded.', ['user' => $user]);
    }

    if ($action === 'logout') {
        startUserSession();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool) $params['secure'], (bool) $params['httponly']);
        }
        session_destroy();
        jsonResponse(true, 'You have been logged out.', ['user' => null]);
    }

    $pdo = getPdo();

    if ($action === 'register') {
        $input = requestData();
        $username = cleanText($input['username'] ?? '', 40);
        $email = strtolower(cleanText($input['email'] ?? '', 160));
        $password = (string) ($input['password'] ?? '');

        if (!preg_match('/^[A-Za-z0-9_]{3,40}$/', $username)) {
            jsonResponse(false, 'Username must be 3–40 characters using letters, numbers, or underscores.', null, 422);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(false, 'Enter a valid email address.', null, 422);
        }
        if (strlen($password) < 8) {
            jsonResponse(false, 'Password must be at least 8 characters.', null, 422);
        }

        $duplicate = $pdo->prepare('SELECT username, email FROM users WHERE username = ? OR email = ? LIMIT 1');
        $duplicate->execute([$username, $email]);
        $existing = $duplicate->fetch();
        if ($existing) {
            $field = strcasecmp($existing['username'], $username) === 0 ? 'username' : 'email';
            jsonResponse(false, "That {$field} is already registered. Try logging in instead.", null, 409);
        }

        $insert = $pdo->prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
        $insert->execute([$username, $email, password_hash($password, PASSWORD_DEFAULT)]);
        $user = ['id' => (int) $pdo->lastInsertId(), 'username' => $username, 'email' => $email];
        saveSessionUser($user);
        jsonResponse(true, 'Account created. Your film journal is ready.', ['user' => $user], 201);
    }

    if ($action === 'login') {
        $input = requestData();
        $login = cleanText($input['login'] ?? '', 160);
        $password = (string) ($input['password'] ?? '');
        if ($login === '' || $password === '') {
            jsonResponse(false, 'Enter your username or email and password.', null, 422);
        }

        $find = $pdo->prepare('SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ? LIMIT 1');
        $find->execute([$login, strtolower($login)]);
        $user = $find->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            jsonResponse(false, 'Those login details did not match. Try again.', null, 401);
        }

        $safeUser = ['id' => (int) $user['id'], 'username' => $user['username'], 'email' => $user['email']];
        saveSessionUser($safeUser);
        jsonResponse(true, 'Welcome back, ' . $safeUser['username'] . '.', ['user' => $safeUser]);
    }

    if ($action === 'profile') {
        $user = requireUser();
        jsonResponse(true, 'Profile loaded.', profileData($pdo, $user));
    }

    jsonResponse(false, 'Unknown authentication action.', null, 404);
}

// Only run the auth controller when this file is the requested endpoint, not when another endpoint includes its helpers.
if (basename((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === 'auth.php') {
    handleAuthRequest();
}
