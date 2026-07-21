# JLB Website — notes for Claude

Band website on **Astro + Cloudflare Workers**. The frontend/design is not built
yet; this repo is the backend, content model, and CMS. See `README.md` for the full
architecture and the account/setup checklist.

## Environment quirks (Windows)

- Node is installed **user-scope via winget** and is **not on the Git Bash PATH**.
  Use the PowerShell tool, and prefix Node/npm commands with a PATH refresh:
  ```powershell
  $env:Path = [System.Environment]::GetEnvironmentVariable('Path','User') + ';' + [System.Environment]::GetEnvironmentVariable('Path','Machine')
  ```
- npm 11 blocks package install scripts by default; approved ones are pinned in
  `package.json` under `allowScripts`.

## Commands

- `npm run dev` — dev server (emulated D1/KV/R2 via `platformProxy`), CMS at `/admin`
- `npm run build` — production build; also validates content-collection schemas
- `npm run db:migrate:local` / `db:migrate:remote` — apply `migrations/`
- `npm run cf-typegen` — regenerate `worker-configuration.d.ts` after editing `wrangler.jsonc`

## Conventions

- Cloudflare bindings are accessed via `Astro.locals.runtime.env` (`DB`, `RATE_LIMIT`,
  `MEDIA`, plus vars). Secrets (e.g. `RESEND_API_KEY`) are typed in `src/env.d.ts`.
- API routes live in `src/pages/api/` and must `export const prerender = false`.
- Content schemas (`src/content.config.ts`) and CMS fields (`public/admin/config.yml`)
  must be kept in sync.
- Files use tab indentation (matches the Astro scaffold).

## Frontend

- Design system: dark/gold palette drawn from the JLB logo, defined in
  `src/styles/global.css`; display font is Cormorant Garamond (self-hosted via
  @fontsource). Layout/nav/footer in `src/layouts/Layout.astro`.
- The landing hero (`src/components/Hero.astro`) has three variants; `/hero-options`
  previews all of them (delete that page once the band picks one).
- Band photos live in `public/images/uploads/` (also the CMS media folder).

## Not built yet

- Merch/store — `/merch` is a "coming soon" page; see README → "Adding merch later".

## Astro docs

https://docs.astro.build — content collections, routing, and endpoints guides are the
relevant ones here.
