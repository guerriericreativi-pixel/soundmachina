<?php
declare(strict_types=1);

// Server-side gate, shared by the landing and the protected editor.
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('X-Frame-Options: SAMEORIGIN');
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
$cookiePath = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/index.php')), '/') . '/';
session_name('virus_h_access');
session_set_cookie_params([
    'lifetime' => 0, 'path' => $cookiePath,
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true, 'samesite' => 'Lax',
]);
session_start();

function vh_config(): array {
    static $config;
    if ($config !== null) return $config;
    $config = [];
    $path = getenv('VIRUS_INVITE_CONFIG') ?: __DIR__ . '/.access/config.php';
    if (is_file($path)) {
        $loaded = require $path;
        if (is_array($loaded)) $config = $loaded;
    }
    $hash = getenv('VIRUS_INVITE_HASH');
    if ($hash !== false && $hash !== '') $config['code_hash'] = $hash;
    return $config;
}
function vh_ready(): bool {
    $hash = vh_config()['code_hash'] ?? '';
    return is_string($hash) && (password_get_info($hash)['algo'] ?? null) !== null;
}
function vh_authenticated(): bool {
    $stamp = $_SESSION['invite_stamp'] ?? '';
    return vh_ready() && is_string($stamp)
        && hash_equals(hash('sha256', vh_config()['code_hash']), $stamp)
        && ($_SESSION['invite_expires'] ?? 0) > time();
}
function vh_csrf(): string {
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}
function vh_valid_csrf(): bool {
    return is_string($_POST['csrf'] ?? null) && hash_equals(vh_csrf(), $_POST['csrf']);
}
function vh_escape(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Persistent rate limiting survives a new session or a cleared cookie. */
function vh_attempt(string $code): array {
    $directory = vh_config()['state_dir'] ?? sys_get_temp_dir() . '/virus-h-invites-' . substr(hash('sha256', __DIR__), 0, 16);
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) {
        return ['ok' => false, 'error' => 'Accesso momentaneamente non disponibile. Riprova più tardi.', 'status' => 503];
    }
    $file = $directory . '/' . hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown') . '.json';
    $handle = @fopen($file, 'c+');
    if (!$handle || !flock($handle, LOCK_EX)) {
        if ($handle) fclose($handle);
        return ['ok' => false, 'error' => 'Accesso momentaneamente non disponibile. Riprova più tardi.', 'status' => 503];
    }
    @chmod($file, 0600);
    try {
        $state = json_decode(stream_get_contents($handle), true) ?: ['fails' => 0, 'until' => 0];
        if (($state['until'] ?? 0) <= time()) $state = ['fails' => 0, 'until' => time() + 900];
        if ($state['fails'] >= 8) {
            header('Retry-After: ' . max(1, $state['until'] - time()));
            return ['ok' => false, 'error' => 'Troppi tentativi. Riprova tra qualche minuto.', 'status' => 429];
        }
        $ok = strlen($code) <= 128 && password_verify($code, vh_config()['code_hash']);
        $state['fails'] = $ok ? 0 : $state['fails'] + 1;
        rewind($handle); ftruncate($handle, 0);
        fwrite($handle, json_encode($state)); fflush($handle);
        return ['ok' => $ok, 'error' => $ok ? '' : 'Il codice non è valido. Controllalo e riprova.', 'status' => $ok ? 200 : 401];
    } finally {
        flock($handle, LOCK_UN); fclose($handle);
    }
}
