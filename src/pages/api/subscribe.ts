import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { Resend } from 'resend';
import { ok, fail } from '../../lib/response';
import { subscribeSchema, readBody, isBot } from '../../lib/validation';
import { rateLimit, clientKey } from '../../lib/rate-limit';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	let body: Record<string, unknown>;
	try {
		body = await readBody(request);
	} catch {
		return fail('Invalid request body.', 400);
	}

	if (isBot(body)) return ok({ message: 'Thanks! Please check your email to confirm.' });

	const parsed = subscribeSchema.safeParse(body);
	if (!parsed.success) return fail('Enter a valid email address.', 422);

	const email = parsed.data.email.toLowerCase();
	const source = parsed.data.source ?? null;

	const limited = await rateLimit(env.RATE_LIMIT, `subscribe:${clientKey(request)}`, {
		limit: 5,
		windowSeconds: 300,
	});
	if (!limited.ok) return fail('Too many attempts. Please try again in a bit.', 429);

	// Already confirmed? Nothing to do — respond the same way regardless so the
	// endpoint doesn't reveal who is on the list.
	const existing = await env.DB.prepare('SELECT status FROM subscribers WHERE email = ?')
		.bind(email)
		.first<{ status: string }>();
	if (existing?.status === 'confirmed') {
		return ok({ message: "You're already subscribed." });
	}

	// Create or refresh a pending signup with a fresh confirmation token.
	const token = crypto.randomUUID();
	await env.DB.prepare(
		`INSERT INTO subscribers (email, token, status, source)
		 VALUES (?, ?, 'pending', ?)
		 ON CONFLICT(email) DO UPDATE SET token = excluded.token, status = 'pending', source = excluded.source`,
	)
		.bind(email, token, source)
		.run();

	if (!env.RESEND_API_KEY) {
		console.error('subscribe: RESEND_API_KEY is not set');
		return fail('Email is not configured yet.', 500);
	}

	const origin = new URL(request.url).origin;
	const confirmUrl = `${origin}/api/confirm?token=${token}`;

	const resend = new Resend(env.RESEND_API_KEY);
	const { error } = await resend.emails.send({
		from: `${env.PUBLIC_SITE_NAME} <${env.MAIL_FROM_EMAIL}>`,
		to: email,
		subject: `Confirm your subscription to ${env.PUBLIC_SITE_NAME}`,
		text:
			`Thanks for signing up!\n\nConfirm your email to start getting updates:\n${confirmUrl}\n\n` +
			`If you didn't request this, you can ignore this email.`,
		html:
			`<p>Thanks for signing up!</p>` +
			`<p><a href="${confirmUrl}">Confirm your email</a> to start getting updates.</p>` +
			`<p style="color:#6b7280;font-size:14px">If you didn't request this, you can ignore this email.</p>`,
	});

	if (error) {
		console.error('subscribe: Resend error', error);
		return fail('Could not send the confirmation email. Please try again later.', 502);
	}

	return ok({ message: 'Almost there — check your email to confirm.' });
};
