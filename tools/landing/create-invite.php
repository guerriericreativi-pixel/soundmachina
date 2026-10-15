<?php
/** Generate a fresh shared invitation outside version control. CLI only. */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
$directory = $argv[1] ?? null;
if (!$directory) { fwrite(STDERR, "Usage: php tools/landing/create-invite.php PRIVATE_DIRECTORY\n"); exit(1); }
if (!is_dir($directory) && !mkdir($directory, 0700, true)) exit(1);
$config = rtrim($directory, '/') . '/config.php';
$codeFile = rtrim($directory, '/') . '/invite-code.txt';
if (file_exists($config)) { fwrite(STDERR, "Config already exists. Move it aside explicitly before rotating the invitation.\n"); exit(1); }
$code = 'VIRUS-' . strtoupper(bin2hex(random_bytes(8)));
$hash = password_hash($code, PASSWORD_DEFAULT);
file_put_contents($config, "<?php\nreturn ['code_hash' => " . var_export($hash,true) . "];\n");
file_put_contents($codeFile, $code . "\n");
chmod($config, 0600); chmod($codeFile, 0600);
fwrite(STDOUT, "Invitation config and code created in the private directory. No code printed to logs.\n");
