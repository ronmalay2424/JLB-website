// Small helpers for JSON API responses.

export function json(data: unknown, init: ResponseInit = {}): Response {
	return new Response(JSON.stringify(data), {
		...init,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			...(init.headers ?? {}),
		},
	});
}

export const ok = (data: Record<string, unknown> = {}) => json({ ok: true, ...data });

export const fail = (error: string, status = 400, extra: Record<string, unknown> = {}) =>
	json({ ok: false, error, ...extra }, { status });

// Minimal HTML page, used by the GET confirm/unsubscribe links which are opened
// directly in the browser. Kept intentionally plain until the frontend exists.
export function htmlPage(title: string, body: string, status = 200): Response {
	const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
		`<meta name="viewport" content="width=device-width,initial-scale=1">` +
		`<title>${title}</title>` +
		`<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:20vh auto;padding:0 1.5rem;text-align:center;color:#111}h1{font-size:1.5rem}a{color:#2563eb}</style>` +
		`</head><body><h1>${title}</h1>${body}</body></html>`;
	return new Response(doc, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}
