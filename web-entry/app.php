<?php
declare(strict_types=1);
require __DIR__ . '/access.php';
if (!vh_authenticated()) { header('Location: ./#accesso', true, 302); exit; }
$editor = __DIR__ . '/.editor/index.html';
if (!is_file($editor)) { http_response_code(503); echo 'Editor momentaneamente non disponibile.'; exit; }
header('Content-Type: text/html; charset=utf-8');
$session=['role'=>vh_role(),'csrf'=>vh_csrf(),'catalogue'=>'banks.php'];
$bootstrap='<script>window.VirusHSession='.json_encode($session,JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT).';</script>';
$html=file_get_contents($editor);
echo str_contains($html,'<head>')?str_replace('<head>','<head>'.$bootstrap,$html):$bootstrap.$html;
