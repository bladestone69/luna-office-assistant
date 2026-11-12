# Login and session upgrade

This release replaces unsigned client cookies and the previous admin cookie format with signed, versioned sessions. Every protected API validates the signature and expiry. Client requests also verify the current user-to-client membership and active client status. Sessions are tied to the current password hash, so a password change invalidates existing sessions. Admin requests likewise check the current stored credential.

Both login entry points await password verification and use the same admin credential source. A database outage cannot reactivate the older environment password. Public login requests use the existing rate limiter; it remains per-process and should be replaced by a shared limiter as a separate task.

New passwords use randomly salted scrypt hashes. Existing client and admin hashes are upgraded after successful login with a conditional update to avoid overwriting a concurrent password reset. Failed logins never migrate hashes. The environment admin password remains the bootstrap credential only while there is no database admin credential.

The development seed script no longer contains or prints default passwords. It requires explicit seed passwords, refuses to run in production, and preserves existing admin credentials.

## Release behavior

- No database schema migration or new production environment variable is required.
- `ADMIN_SESSION_SECRET` remains required; there is no default signing secret.
- All users, including the admin, must sign in again after this release.
- Suspended or deleted accounts lose access on their next request.
- Password changes require a fresh login on the next protected request.
- Telephone routing, call behavior, and voice configuration are unchanged.
- Rolling back to the old release would restore its security weaknesses; prefer a forward fix.

## Verification

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.

The automated suite covers unsigned and altered cookies, expiry, role separation, secret rotation, account filtering, password-based revocation, salted password hashing, both admin login paths, legacy hash upgrades, database outages, and protected API rejection. Database interactions are mocked; deployment smoke checks should additionally verify that anonymous API requests receive 401 and incorrect credentials do not create cookies.
