<?php
declare(strict_types=1);
require __DIR__ . '/access.php';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!vh_valid_csrf()) {
        http_response_code(403);
        $error = 'La pagina è scaduta. Aggiornala e riprova.';
    } elseif (($_POST['action'] ?? '') === 'logout') {
        $_SESSION = [];
        session_regenerate_id(true);
        header('Location: ./', true, 303); exit;
    } elseif (!vh_ready()) {
        http_response_code(503);
        $error = 'Gli inviti non sono ancora attivi. Riprova più tardi.';
    } else {
        $result = vh_attempt(is_string($_POST['invite_code'] ?? null) ? trim($_POST['invite_code']) : '');
        if ($result['ok']) {
            session_regenerate_id(true);
            $_SESSION['invite_stamp'] = hash('sha256', vh_config()['code_hash']);
            $_SESSION['invite_expires'] = time() + 43200;
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
            header('Location: app.php', true, 303); exit;
        }
        http_response_code($result['status']);
        $error = $result['error'];
    }
}
define('VIRUS_ENTRY', true);
require __DIR__ . '/landing.php';
