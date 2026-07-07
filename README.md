# Locus

Locus is the easiest self-hostable project management tool that runs entirely on Next.js.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Beta](https://img.shields.io/badge/status-beta-orange.svg)](#beta)

**[Features](#features) · [Architecture](#architecture) · [Local Setup](#local-setup) · [Self-hosting](#self-hosting) · [Env Vars](#environment-variables) · [Updates](#updates) · [Contributing](#contributing)**

There are already a lot of project management tools, but self-hosting most of them means managing multiple services and ongoing maintenance. Locus was built to simplify that.

## Features

- Kanban board with drag-and-drop, table view, calendar view
- Issues with types (task / story / bug / subtask), priority, labels, story points, due dates
- Sprints (planned → active → completed), backlog, epics
- Multi-workspace support (one account, multiple organizations)
- Roles at org level (owner / admin / member) and project level, private projects
- Comments, file attachments (S3/MinIO), rich text with inline image paste
- Browser push notifications via Web Push, per-workspace and per-device
- Email invitations, OTP login, Google OAuth, JWT sessions
- Activity log on issues, epics, and sprints
- SQLite or PostgreSQL, switch with one env var, no code changes

## Architecture

Locus runs entirely on Next.js with no separate backend server. It utilizes the full potential of the framework, with Server Actions, Route Handlers, Middleware, Server Components, and `after()` each handling the part they're best suited for.

**Server Actions** handle every mutation: creating issues, drag-and-drop reordering, sprint transitions, assignee changes. Types go from the form directly to the database with no REST layer in between. Any new feature that writes data is a Server Action.

**Route Handlers** are kept for the cases where Server Actions don't fit like multipart file uploads, the image proxy, push subscription endpoints, and search typeaheads.

**`after()`** from `next/server` is used for background tasks such as activity logging, notification emails, and push notifications. Since these run after the response is sent, they don't increase the request latency.

```ts
after(async () => {
  await logActivity(...)
  await notify(userId, orgId, payload)
})
```

**Middleware** (`src/proxy.ts`) handles auth at the edge before any page renders. It checks the session cookie, redirects to login or passes through.

**Server Components** fetch data directly from the database at render time. `revalidatePath` is called on every mutation to keep data fresh without polling or websockets.

**Kysely** is the query builder throughout. Fully type-safe and runs identically against SQLite and PostgreSQL. Migrations are numbered `.ts` files in `src/db/migrations/`.

## Local Setup

Node 22+ required.

```bash
git clone https://github.com/amitvaibhavtiwari/Locus
cd Locus
npm install
cp .env.example .env.local
```

Minimum `.env` to get running:

```env
DATABASE_URL=./dev.db
AUTH_SECRET=any-random-string
AUTH_URL=http://localhost:3000
```

```bash
npm run db:migrate
npm run dev
```

Email, storage, and push notifications are optional. If the env vars aren't set, those features are just disabled; everything else works fine. For the full list of env vars and what each one does, see [Environment Variables](#environment-variables).

## Self-hosting

Locus is a single Next.js app so deployment is straightforward.

**Vercel / Railway / Render**

Push the repo and set the env vars. That's it.

For Vercel, SQLite won't work (serverless, no persistent filesystem), so use [Neon](https://neon.tech) for Postgres instead. Neon has a first-party Vercel integration that provisions the database and injects `DATABASE_URL` automatically.

Railway and Render both support persistent volumes, so SQLite works fine there. Alternatively set `DATABASE_URL` to any Postgres connection string.

**Docker** *(work in progress)*

Docker support is being worked on. It will run the app with a named volume for SQLite and support switching to Postgres via `DATABASE_URL`.

**Standalone Node**

```bash
npm run build
node .next/standalone/server.js
```

Runs the app as a plain Node.js process. Works on any VPS. Put Nginx in front for SSL termination.

## Environment Variables

A sample .env file is at [`.env.example`](.env.example). The app starts with just the three required vars; every optional feature is independently disabled if its vars are missing.

**Required**

| Variable | Description |
|---|---|
| `DATABASE_URL` | `./dev.db` for SQLite or a `postgres://...` connection string |
| `AUTH_SECRET` | Any random string, used to sign and verify JWTs |
| `AUTH_URL` | Full public URL of your deployment e.g. `https://yourdomain.com` |

---

**Google OAuth** *(optional)*

By default users sign up and log in with email and password. If you also want a "Sign in with Google" option, set these up. Go to [Google Cloud Console](https://console.cloud.google.com) → Create a project → APIs & Services → Credentials → Create OAuth 2.0 Client ID. Set the redirect URI to `{AUTH_URL}/api/auth/callback/google`.

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Client secret from Google Cloud Console |

---

**Email** *(optional)*

Locus sends emails during signup, login, workspace invitations, and password resets for OTPs and links. If no provider is configured, all OTPs and reset links are printed directly to the server console so you can still use them. No email will be delivered, but the flow still works.

If you want to disable the login OTP step entirely (useful for local dev or internal teams), set:

```env
DISABLE_LOGIN_OTP=true
```

Three ways to configure email, pick one:

**Option 1: SendGrid** 

Sign up at [sendgrid.com](https://sendgrid.com) → Settings → API Keys → Create API Key with Mail Send permission.

| Variable | Description |
|---|---|
| `SENDGRID_API_KEY` | Your SendGrid API key |
| `EMAIL_FROM` | From address, must be a verified sender in SendGrid |

**Option 2: SMTP URL** (quick setup for Mailgun, Brevo, Postmark, etc.)

| Variable | Description |
|---|---|
| `SMTP_URL` | Full SMTP connection string e.g. `smtps://user:password@smtp.provider.com` |
| `EMAIL_FROM` | The from address shown in outgoing emails |

Use `smtps://` for TLS (port 465) and `smtp://` for STARTTLS (port 587).

**Option 3: Individual SMTP credentials** (Gmail, Outlook, Yahoo, or any custom SMTP server)

These are the variables:

| Variable | Description |
|---|---|
| `EMAIL_HOST` | SMTP server hostname |
| `EMAIL_PORT` | `587` for STARTTLS (default), `465` for SSL/TLS |
| `EMAIL_SECURE` | Set `true` when using port 465, leave `false` for 587 |
| `EMAIL_USER` | Your email address or SMTP username |
| `EMAIL_PASS` | Your password or app-specific password |
| `EMAIL_FROM` | The from address shown on outgoing emails |

Here's how to set it up for each provider:

**Gmail**

Gmail does not allow your regular account password for SMTP; you need to generate an App Password. Steps:
1. Make sure 2-Step Verification is enabled on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and generate a password
4. Use that 16-character password as `EMAIL_PASS`

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=you@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=you@gmail.com
```

**Outlook / Hotmail / Microsoft 365**

```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=you@outlook.com
EMAIL_PASS=your-password
EMAIL_FROM=you@outlook.com
```

**Yahoo Mail**

Yahoo also requires an App Password. Go to your Yahoo Account Security settings → Generate app password → select "Other app" → use the generated password.

```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=you@yahoo.com
EMAIL_PASS=your-app-password
EMAIL_FROM=you@yahoo.com
```

**Custom / self-hosted SMTP**

```env
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-password
EMAIL_FROM=noreply@yourdomain.com
```

---

**File Storage** *(optional)*

File attachments and image uploads in issues require an S3-compatible storage bucket. Without this, the attachment feature is hidden from the UI entirely. Locus works with AWS S3, Cloudflare R2, and MinIO. Any S3-compatible provider works perfectly here.

These are the variables:

| Variable | Description |
|---|---|
| `STORAGE_ENABLED` | Set to `true` to enable file uploads |
| `STORAGE_ENDPOINT` | Storage endpoint URL; leave blank for AWS S3, required for everything else |
| `STORAGE_REGION` | Bucket region |
| `STORAGE_BUCKET` | Name of your bucket |
| `STORAGE_ACCESS_KEY` | Access key ID |
| `STORAGE_SECRET_KEY` | Secret access key |
| `STORAGE_FORCE_PATH_STYLE` | `true` for MinIO, `false` for AWS S3 and R2 |

Here's how to set it up for each option:

**MinIO (self-hosted)**

MinIO is an open-source S3-compatible storage server you can run yourself, on a VPS, home server, or locally for development. It's a good option if you want full control and don't want to use a cloud provider.

To run MinIO locally with Docker:
```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  quay.io/minio/minio server /data --console-address ":9001"
```

Then open `http://localhost:9001`, log in, create a bucket, and use the root credentials as your access key and secret.

```env
STORAGE_ENABLED=true
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_REGION=us-east-1
STORAGE_BUCKET=your-bucket-name
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_FORCE_PATH_STYLE=true
```

For a production MinIO deployment, replace the endpoint with your server's URL and use proper credentials instead of the defaults.

**AWS S3**

1. Go to [AWS Console](https://console.aws.amazon.com) → S3 → Create bucket
2. Note the bucket name and region
3. Go to IAM → Users → Create user → Attach `AmazonS3FullAccess` policy (or a scoped policy for your bucket)
4. Create an access key for that user and copy the Access Key ID and Secret

```env
STORAGE_ENABLED=true
STORAGE_ENDPOINT=
STORAGE_REGION=us-east-1
STORAGE_BUCKET=your-bucket-name
STORAGE_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
STORAGE_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STORAGE_FORCE_PATH_STYLE=false
```

Leave `STORAGE_ENDPOINT` blank; the AWS SDK resolves it automatically from the region.

**Cloudflare R2**

R2 has a generous free tier and no egress fees. Setup: [dash.cloudflare.com](https://dash.cloudflare.com) → R2 → Create bucket → Manage R2 API tokens → Create token with Object Read & Write permission. Copy your Account ID from the R2 overview page.

```env
STORAGE_ENABLED=true
STORAGE_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_BUCKET=your-bucket-name
STORAGE_ACCESS_KEY=your-r2-access-key-id
STORAGE_SECRET_KEY=your-r2-secret-access-key
STORAGE_FORCE_PATH_STYLE=false
```

---

**Push Notifications** *(optional)*

Locus supports browser push notifications for events like issue assignments, comments, sprint updates, and status changes. Users can opt in per workspace and per device. Without these vars, push notifications are fully disabled.

VAPID keys are a pair of keys used to authenticate your server with browser push services. Generate them once and keep them; changing them will break existing subscriptions.

```bash
npx web-push generate-vapid-keys
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public key, sent to the browser to set up subscriptions |
| `VAPID_PRIVATE_KEY` | Private key, stays on the server, never exposed |
| `VAPID_SUBJECT` | Contact identifier for your push sender (see below) |

`VAPID_SUBJECT` is required by the Web Push spec. Browser push services (like Google's FCM) use it to identify who is sending push messages and contact you if there's an abuse issue. It accepts two formats:

- `mailto:you@example.com` (your email address, recommended)
- `https://yourdomain.com` (your app's public URL)

## Stack

| | |
|---|---|
| Framework | Next.js 15 App Router |
| Database | SQLite (`better-sqlite3`) / PostgreSQL (`pg`) |
| Query builder | Kysely |
| Auth | NextAuth v5 |
| UI | Tailwind v4 + shadcn/ui |
| Storage | S3-compatible (optional) |
| Push | `web-push` (VAPID) |
| Email | nodemailer |

## Updates

Locus follows a backward-compatible update policy. New features, improvements, and fixes will not require any changes to your existing configuration or database. To update your instance, pull the latest changes and restart:

```bash
git pull
npm install
npm run db:migrate
```

`npm run db:migrate` is safe to run on every update. It only applies migrations that haven't been run yet and skips everything else. Your data is never affected by an update.

## Contributing

All contributions that make Locus better are welcome. Bug fixes, features, documentation, or anything else. Please go through [CONTRIBUTING.md](CONTRIBUTING.md) before starting.

## Beta

Locus is currently in beta, and active development is ongoing to complete the full feature set. It is not yet recommended for production use, as you may encounter unexpected issues. You're always welcome to run it locally and explore its features. Bug reports, issues, suggestions and feedback are always welcome.
