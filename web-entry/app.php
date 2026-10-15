<?php
declare(strict_types=1);
require __DIR__ . '/access.php';
if (!vh_authenticated()) { header('Location: ./#accesso', true, 302); exit; }
$editor = __DIR__ . '/.editor/index.html';
if (!is_file($editor)) { http_response_code(503); echo 'Editor momentaneamente non disponibile.'; exit; }
header('Content-Type: text/html; charset=utf-8');
readfile($editor);
