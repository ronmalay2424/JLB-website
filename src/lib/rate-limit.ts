// Fixed-window rate limiter backed by Cloudflare KV.
//
// If the RATE_LIMIT KV binding isn't configured (e.g. a fresh local dev setup),
// this no-ops and allows the request, so nothing breaks before KV is created.

interface RateLimitOptions {
	limit?: number;
	windowSeconds?: number;
}

export async function rateLimit(
	kv: KVNamespace | undefined,
	key: string,
	{ limit = 5, windowSeconds = 60 }: RateLimitOptions = {},
): Promise<{ ok: boolean; remaining: number }> {
	if (!kv) return { ok: true, remaining: limit };

	const bucketKey = `rl:${key}`;
	const current = Number((await kv.get(bucketKey)) ?? '0');

	if (current >= limit) return { ok: false, remaining: 0 };

	// expirationTtl resets the window; good enough for abuse prevention on a
	// low-traffic site (not a precise sliding window).
	await kv.put(bucketKey, String(current + 1), { expirationTtl: windowSeconds });
	return { ok: true, remaining: limit - current - 1 };
}

// Best-effort client IP for keying the limiter.
export function clientKey(request: Request, fallback?: string): string {
	return request.headers.get('CF-Connecting-IP') ?? fallback ?? 'unknown';
}
