import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { htmlPage } from '../../lib/response';

export const prerender = false;

// Opened directly from the confirmation email link.
export const GET: APIRoute = async ({ request }) => {
	const token = new URL(request.url).searchParams.get('token');

	if (!token) {
		return htmlPage('Invalid link', '<p>This confirmation link is missing its token.</p>', 400);
	}

	const result = await env.DB.prepare(
		`UPDATE subscribers
		 SET status = 'confirmed', confirmed_at = datetime('now')
		 WHERE token = ? AND status = 'pending'`,
	)
		.bind(token)
		.run();

	if (result.meta.changes === 0) {
		return htmlPage(
			'Link expired',
			'<p>This link is invalid or has already been used. Try subscribing again.</p>',
			410,
		);
	}

	return htmlPage(
		"You're subscribed!",
		`<p>Thanks for confirming. You'll hear from ${env.PUBLIC_SITE_NAME} soon.</p>`,
	);
};
