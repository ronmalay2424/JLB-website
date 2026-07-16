import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { Resend } from 'resend';
import { ok, fail } from '../../lib/response';
import { contactSchema, readBody, isBot } from '../../lib/validation';
import { rateLimit, clientKey } from '../../lib/rate-limit';

// Server-rendered endpoint (not prerendered to a static file).
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	let body: Record<string, unknown>;
	try {
		body = await readBody(request);
	} catch {
		return fail('Invalid request body.', 400);
	}

	// Silently accept bot submissions so they don't retry.
	if (isBot(body)) return ok();

	const parsed = contactSchema.safeParse(body);
	if (!parsed.success) {
		return fail('Please check the form and try again.', 422, {
			issues: parsed.error.flatten().fieldErrors,
		});
	}
	const { name, email, subject, message } = parsed.data;

	const limited = await rateLimit(env.RATE_LIMIT, `contact:${clientKey(request)}`, {
		limit: 5,
		windowSeconds: 300,
	});
	if (!limited.ok) return fail('Too many messages. Please try again in a bit.', 429);

	// Durable record. Best-effort: a logging failure shouldn't block the email.
	try {
		await env.DB.prepare(
			'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
		)
			.bind(name, email, subject ?? null, message)
			.run();
	} catch (err) {
		console.error('contact: D1 insert failed', err);
	}

	if (!env.RESEND_API_KEY) {
		console.error('contact: RESEND_API_KEY is not set');
		return fail('Email is not configured yet.', 500);
	}

	const resend = new Resend(env.RESEND_API_KEY);
	const { error } = await resend.emails.send({
		from: `${env.PUBLIC_SITE_NAME} Website <${env.MAIL_FROM_EMAIL}>`,
		to: env.CONTACT_TO_EMAIL,
		replyTo: email,
		subject: `[Contact] ${subject?.trim() || 'New message'} — from ${name}`,
		text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject ?? '(none)'}\n\n${message}`,
	});

	if (error) {
		console.error('contact: Resend error', error);
		return fail('Could not send your message. Please try again later.', 502);
	}

	return ok();
};
