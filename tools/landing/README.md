# VIRUS-H landing and shared invites

The root `index.html` remains the editor source and native-plugin resource.
`web-entry/` is a separate public landing and PHP session gate. Both skins use
local images/fonts. The why/what/how sections use actual editor screenshots.

## Local preview

Requires Node.js and PHP 8.1+. Do not use a static file server to test this gate.

```
node tools/landing/build-entry.mjs .local/landing-preview
php tools/landing/create-invite.php .local/invite
VIRUS_INVITE_CONFIG="$PWD/.local/invite/config.php" php -S 127.0.0.1:8766 -t .local/landing-preview tools/landing/router.php
```

The generator refuses to overwrite an existing invitation. The local invitation
code is in `.local/invite/invite-code.txt`, readable only by its owner. Do not
commit it. `.local/` and all invite configs are ignored. To rotate, move the old
private config aside explicitly, then generate a new one.

```
node --test tests/*.test.cjs
```

## Hostinger publication

Requires a hosting plan executing PHP and Apache/LiteSpeed `.htaccess`, HTTPS,
PHP sessions and writable private storage. A static-only hosting target cannot
run this gate. Publish only after rendering approval and explicit authorization.

1. Build the entry into the Tools public directory using the updated sync script.
   It removes the previous public static editor, protects its private copy, and
   retains the legacy route through `app.php`.
2. Provision the invitation configuration **outside the public document root**
   using the CLI generator. Configure `VIRUS_INVITE_CONFIG` to the absolute path
   of its `config.php`. `VIRUS_INVITE_HASH` can alternatively supply the hash.
   Without environment configuration, `.access/config.php` is supported as a
   server-only fallback, denied by `.htaccess`. Provision it on the server after
   deployment; never track it in Git or overwrite it on rebuild.
3. Do not upload `invite-code.txt`; share its code privately with invited users.
4. Verify anonymous `app.php` and legacy `index.html` redirect to the landing;
   `.editor/index.html`, `.access/config.php` and `access.php` return 403;
   valid login reaches the editor; logout revokes access. Verify cookies have
   Secure on HTTPS. Missing config must deny login with 503.
5. Confirm no other old or alternate public copies of the editor are reachable.
   Previously downloaded copies cannot be revoked by a new web gate.

The runtime hash fingerprint invalidates active sessions when the shared code
changes. Sessions last twelve hours and are bound to the current shared invite.
The shared-code model intentionally has no per-person revocation or audit trail.
