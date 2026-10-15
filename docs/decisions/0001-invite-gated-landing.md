# Invite-gated VIRUS-H landing

Date: 2026-10-15. Status: deployed and verified on Hostinger.

The editor stays a standalone web document for the native plugin. A separate PHP
entry supplies the public landing and a server-side shared-invite session. This
fits the existing Apache-style Hostinger deployment without introducing accounts,
a database or a paid identity service.

The public build has no static `index.html` editor. Its only copy lives in
`.editor/index.html`, denied by Apache, and is streamed by `app.php` after the
session check. The old `index.html` URL routes through the same gate. Assets remain
public. The native plugin continues to bundle the original root editor, without
web authentication or network dependencies.

Invitation configuration is private deployment state, never Git content. Store
only a password hash. Changing the hash invalidates active sessions. Session
cookies are HttpOnly, SameSite=Lax and Secure on HTTPS; login rotates the ID.
Login/logout require a CSRF token. Failed attempts are limited per IP for fifteen
minutes, independently of session cookies. Missing configuration or unavailable
rate-limit storage denies access.

The local PHP router mirrors the Apache route policy. Automated HTTP tests cover
entry, legacy route, private paths, CSRF, login, logout, missing config and fresh-
session rate-limit attempts. Production must additionally verify the real PHP and
Apache/LiteSpeed configuration before claiming the deployed gate works.

References:
- https://www.php.net/manual/en/function.session-set-cookie-params.php
- https://httpd.apache.org/docs/2.4/howto/access.html
- https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API
