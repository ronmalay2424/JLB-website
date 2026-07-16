// Cloudflare bindings + vars are typed by `wrangler types` into
// worker-configuration.d.ts (as `Cloudflare.Env`). Access them in server code
// with:  import { env } from 'cloudflare:workers'
//
// Here we merge in runtime-only SECRETS (which never appear in wrangler.jsonc,
// so wrangler can't generate them). Add new secrets to this interface so they're
// typed on `env`.
declare namespace Cloudflare {
	interface Env {
		RESEND_API_KEY: string;
	}
}
