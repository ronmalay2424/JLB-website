import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { htmlPage } from '../../lib/response';

export const prerender = false;

// Linked from the footer of newsletter emails (append ?token=<subscriber token>).
export const GET: APIRoute = async ({ request }) => {
	const token = new URL(request.url).searchParams.get('token');

	if (!token) {
		return htmlPage('Invalid link', '<p>This unsubscribe link is missing its token.</p>', 400);
	}

	await env.DB.prepare(
		`UPDATE subscribers
		 SET status = 'unsubscribed', unsubscribed_at = datetime('now')
		 WHERE token = ?`,
	)
		.bind(token)
		.run();

	// Respond the same way whether or not the token matched, so the endpoint
	// can't be used to probe who is on the list.
	return htmlPage('Unsubscribed', '<p>You have been removed from the mailing list.</p>');
};
