<?php
declare(strict_types=1);

// Keep PHP warnings out of JSON responses while still logging useful server details.
ini_set('display_errors', '0');
error_reporting(E_ALL);
date_default_timezone_set('UTC');

/**
 * Send one predictable JSON response and stop the current endpoint request.
 */
function jsonResponse(bool $success, string $message = '', mixed $data = null, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Read JSON input for POST requests, with form data as a beginner-friendly fallback.
 */
function requestData(): array
{
    $rawBody = file_get_contents('php://input');
    $decoded = json_decode($rawBody ?: '', true);
    return is_array($decoded) ? $decoded : $_POST;
}

/**
 * Convert a request value to a positive integer or return null for invalid input.
 */
function positiveInt(mixed $value): ?int
{
    $number = filter_var($value, FILTER_VALIDATE_INT);
    return ($number !== false && $number > 0) ? (int) $number : null;
}

/**
 * Return a clean string with a safe maximum length for user-provided fields.
 */
function cleanText(mixed $value, int $maxLength = 255): string
{
    $text = trim((string) ($value ?? ''));
    return function_exists('mb_substr') ? mb_substr($text, 0, $maxLength) : substr($text, 0, $maxLength);
}

/**
 * Check a YYYY-MM-DD date without accepting impossible calendar dates.
 */
function isValidDate(string $date): bool
{
    $parsed = DateTime::createFromFormat('Y-m-d', $date);
    return $parsed !== false && $parsed->format('Y-m-d') === $date;
}

/**
 * Create the PDO connection from environment variables or XAMPP's usual local defaults.
 */
function getPdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $databaseUrl = getenv('DATABASE_URL') ?: '';
    $host = getenv('CINEPHILE_DB_HOST') ?: getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('CINEPHILE_DB_PORT') ?: getenv('DB_PORT') ?: '3306';
    $database = getenv('CINEPHILE_DB_NAME') ?: getenv('DB_NAME') ?: 'cinephile_simple';
    $username = getenv('CINEPHILE_DB_USER') ?: getenv('DB_USER') ?: 'root';
    $password = getenv('CINEPHILE_DB_PASS') ?: getenv('DB_PASS') ?: '';

    // Managed database environments may provide one standard MySQL connection URL.
    if ($databaseUrl !== '') {
        $parts = parse_url($databaseUrl);
        if (is_array($parts)) {
            $host = $parts['host'] ?? $host;
            $port = (string) ($parts['port'] ?? $port);
            $database = ltrim((string) ($parts['path'] ?? '/' . $database), '/');
            $username = urldecode((string) ($parts['user'] ?? $username));
            $password = urldecode((string) ($parts['pass'] ?? $password));
        }
    }

    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
    $pdoOptions = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    // The managed MySQL connection requires TLS; local XAMPP keeps the simple defaults above.
    if ($databaseUrl !== '' && defined('PDO::MYSQL_ATTR_SSL_CA') && file_exists('/etc/ssl/certs/ca-certificates.crt')) {
        $pdoOptions[PDO::MYSQL_ATTR_SSL_CA] = '/etc/ssl/certs/ca-certificates.crt';
        $pdoOptions[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
    }
    try {
        $pdo = new PDO($dsn, $username, $password, $pdoOptions);
        return $pdo;
    } catch (Throwable $exception) {
        error_log('Cinephile database connection failed: ' . $exception->getMessage());
        jsonResponse(false, 'Database connection is unavailable. Import sql/cinephile_simple.sql and check backend/db.php settings.', null, 503);
    }
}

/**
 * Verify that a movie exists before writing a rating, review, watchlist item, or diary entry.
 */
function movieExists(PDO $pdo, int $movieId): bool
{
    $statement = $pdo->prepare('SELECT id FROM movies WHERE id = ?');
    $statement->execute([$movieId]);
    return (bool) $statement->fetchColumn();
}
