# Operations guide

Deployment, configuration, and recovery procedures for BillSpilt. For an overview of the project, see the [README](../README.md).

## Environment

Copy `.env.example` to `.env.local`. The Postgres and KV variables are injected automatically when you link those stores in the Vercel dashboard. Set these by hand:

- `AUTH_SECRET` — generate with `openssl rand -base64 32`.
- `CRON_SECRET` — any random string; protects the cron endpoint.
- `RESEND_API_KEY` (or `SMTP_USER` + `SMTP_PASS`) — required for password-reset emails. Without one of these, `/forgot` says it has nothing to send with instead of pretending a link is on its way. A provider that is configured but *rejecting* credentials (a revoked Gmail app password, a deleted Resend key) also counts as broken: `/forgot` reports that the mailer refused the send, and `/api/health` reports it too. That judgement is recorded in the database, so it is visible from every instance, not just the one that tried to send.

The database schema creates itself on first request via `ensureSchema()`; there are no migrations to run.

## Deploying to Vercel

1. Import the repository in Vercel.
2. Under **Storage**, add **Postgres** (and optionally **KV**). Environment variables are wired in automatically. Receipts need no separate store.
3. Add `AUTH_SECRET` and `CRON_SECRET`.
4. Deploy. `vercel.json` registers a daily run of `/api/cron/recurring` (06:00 UTC), which logs due recurring bills and prunes orphaned receipt uploads.

## Diagnosing login and password-reset problems

Login needs a reachable database plus `AUTH_SECRET`; password reset additionally needs an email provider. When any of those is missing, the symptom looks like a wrong password, so check the deployment first:

```bash
curl -s https://your-app.example.com/api/health | jq
# → login.ready / login.database / login.authSecret
#   passwordReset.ready / passwordReset.email
# add -H "Authorization: Bearer $CRON_SECRET" for the underlying error text
```

`/api/health` also reports the last provider failure recorded in the database (`passwordReset.lastSendFailedAt`, with `passwordReset.ready: false`), so a revoked app password does not read as healthy configuration.

### Setting a password out of band

If you are locked out with no working email, set a password directly against the database:

```bash
vercel env pull .env.local            # or copy POSTGRES_URL from your provider
POSTGRES_URL='postgres://…' npm run set-password -- you@example.com 'new-password'
# omit the password to have a strong one generated and printed

# list the accounts this database actually holds, before changing anything:
POSTGRES_URL='postgres://…' npm run set-password -- --list
```

The script prints the database it is about to touch (host and name, never credentials), matches the address case-insensitively, invalidates outstanding reset links, and lists the accounts it *can* see if there is no match.

If login keeps rejecting a password you know is right, `--list` is the tiebreaker: an account that isn't listed is not in the database the app is reading. `POSTGRES_URL` pointing at the wrong store (after a provider move, say) looks exactly like a bad password.

## Migrating receipts off an object store

Receipts used to live in Vercel Blob. If a database still has expenses whose receipt is an `https://…` URL, pull them in **before** deleting the Blob store; afterwards those links are dead.

```bash
POSTGRES_URL='postgres://…' npm run migrate-receipts -- --dry-run   # look first
POSTGRES_URL='postgres://…' npm run migrate-receipts
```

The script downloads each receipt, stores the bytes in Postgres, and repoints the expense at `/api/receipts/<id>.<ext>`. Re-running is safe: rows already moved are skipped.
