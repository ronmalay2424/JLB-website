# JLB Website

The website for the Jenny Labow Band, built to run on Cloudflare. The repo
contains the full site: frontend (dark/gold design drawn from the band logo),
backend, content model, and CMS. Remaining setup: Resend email, CMS login, and
the custom domain (see the checklist below).

---

## What's here

| Piece | Tech | Where |
| :-- | :-- | :-- |
| Site framework | [Astro](https://astro.build) | `src/` |
| Hosting / runtime | Cloudflare Workers (+ static assets) | `wrangler.jsonc` |
| Database | Cloudflare D1 (SQLite) | `migrations/` |
| Object storage | Cloudflare R2 (reserved for large media) | binding `MEDIA` |
| Rate limiting | Cloudflare KV | binding `RATE_LIMIT` |
| Content (shows, gallery, pages) | Astro content collections | `src/content/`, `src/content.config.ts` |
| Editor for non-coders | [Sveltia CMS](https://github.com/sveltia/sveltia-cms) | `public/admin/` → `/admin` |
| Contact form + mailing list | Astro API routes + [Resend](https://resend.com) | `src/pages/api/` |

Merch/store is intentionally **not** built yet — see [Adding merch later](#adding-merch-later).

---

## Local development

Requires Node.js 22+.

```sh
npm install                 # install dependencies
cp .dev.vars.example .dev.vars   # then fill in RESEND_API_KEY
npm run db:migrate:local    # create the local D1 tables
npm run dev                 # http://localhost:4321  (CMS at /admin)
```

| Command | What it does |
| :-- | :-- |
| `npm run dev` | Local dev server with emulated D1/KV/R2 bindings |
| `npm run build` | Production build to `./dist/` |
| `npm run preview` | Run the built site locally via `wrangler dev` |
| `npm run deploy` | Build and deploy to Cloudflare |
| `npm run db:migrate:local` | Apply DB migrations to the local database |
| `npm run db:migrate:remote` | Apply DB migrations to the production database |
| `npm run cf-typegen` | Regenerate binding types (run after editing `wrangler.jsonc`) |

---

## Setup checklist (do these in order)

You need to create a few accounts/resources. **I (Claude) can't create accounts or
handle your API keys** — that's what this list is for. Each step says exactly where
the value goes.

### 1. Push this repo to GitHub
The CMS and Cloudflare deploys both work off GitHub.
```sh
git remote add origin https://github.com/<you>/jlb-website.git
git push -u origin main
```
Then in `public/admin/config.yml`, set `repo:` to `<you>/jlb-website`.

### 2. Cloudflare — create the D1 database, R2 bucket, and KV namespace
Log in first: `npx wrangler login`
```sh
npx wrangler d1 create jlb-db
npx wrangler r2 bucket create jlb-media
npx wrangler kv namespace create RATE_LIMIT
```
Paste the returned IDs into `wrangler.jsonc`:
- D1 `database_id` → replaces `REPLACE_WITH_D1_DATABASE_ID`
- KV `id` → replaces `REPLACE_WITH_KV_NAMESPACE_ID`

Then apply migrations to production: `npm run db:migrate:remote`

### 3. Resend — email for the contact form & mailing list
1. Create an account at [resend.com](https://resend.com).
2. Add and **verify the band's domain** (Resend shows the DNS records — add them in
   Cloudflare DNS). Sending only works from a verified domain.
3. Create an API key.
4. Put the key in `.dev.vars` locally, and set it in production:
   `npx wrangler secret put RESEND_API_KEY`
5. In `wrangler.jsonc` `vars`, set:
   - `CONTACT_TO_EMAIL` → where contact-form messages should land
   - `MAIL_FROM_EMAIL` → a from-address on the verified domain (e.g. `noreply@yourband.com`)

### 4. CMS login (Sveltia + GitHub OAuth)
The CMS commits content to GitHub, so editors log in with GitHub. This needs a tiny
OAuth relay (Cloudflare Worker):
1. GitHub → Settings → Developer settings → **OAuth Apps** → New. Set the callback URL
   to your auth worker's `/callback` (from the next step).
2. Deploy the [`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth) Worker
   (a one-file Cloudflare Worker) with your GitHub OAuth client ID/secret.
3. Put the worker's URL in `public/admin/config.yml` → `backend.base_url`.

Editors then go to `https://yourband.com/admin`.

### 5. Deploy
Either connect the GitHub repo in the Cloudflare dashboard (Workers → Create → Import
repository) for auto-deploys on push, or deploy manually with `npm run deploy`.
Finally, point the domain (already on Cloudflare) at the Worker.

---

## Content model

Editors use `/admin`; under the hood it's plain files in the repo:

- **Shows** → `src/content/shows/*.md` (title, date, venue, city, tickets, price, sold-out)
- **Gallery** → `src/content/gallery/*.md` (image, alt text, caption, featured, order)
- **Pages** (bio/about, press) → `src/content/pages/*.md` (title, hero image, body)
- **Site settings** (band name, tagline, social + streaming links, booking email) →
  `src/data/site.json`
- Uploaded images → `public/images/uploads/`

The schemas in `src/content.config.ts` and the fields in `public/admin/config.yml`
must stay in sync — update both when you add a field.

## API routes

All under `src/pages/api/` (server-rendered):

- `POST /api/contact` — validates, stores in D1, emails via Resend. Honeypot + rate-limited.
- `POST /api/subscribe` — double opt-in mailing list; stores subscriber, emails a confirm link.
- `GET  /api/confirm?token=…` — confirms a subscription.
- `GET  /api/unsubscribe?token=…` — removes a subscriber.

## Adding merch later

The stack is ready for it. When you want a store, the low-effort path is **Stripe**:
add a `stripe` dependency, a `POST /api/checkout` route that creates a Stripe Checkout
session, and a `POST /api/stripe-webhook` route that records orders in a new D1 table.
Stripe's own dashboard becomes the product/inventory admin, so no custom store UI is
needed.
