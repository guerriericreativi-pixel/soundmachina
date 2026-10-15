<?php
// Local development equivalent of the Apache rules; never deployed.
declare(strict_types=1);
$root = realpath($_SERVER['DOCUMENT_ROOT']);
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
if (preg_match('~(?:^|/)\.|\\\\~', $path) || in_array($path, ['/access.php','/landing.php'], true)) {
    http_response_code(403); echo 'Accesso negato.'; return true;
}
if ($path === '/index.html') { require $root . '/app.php'; return true; }
if ($path === '/' || $path === '/index.php') { require $root . '/index.php'; return true; }
$file = realpath($root . $path);
if (!$file || !str_starts_with($file, $root . '/')) { http_response_code(404); return true; }
return false;
