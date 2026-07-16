import { z } from 'astro:schema';

// Shared input schemas for the public form endpoints.

export const contactSchema = z.object({
	name: z.string().trim().min(1, 'Name is required').max(200),
	email: z.string().trim().email('Enter a valid email').max(320),
	subject: z.string().trim().max(300).optional(),
	message: z.string().trim().min(1, 'Message is required').max(5000),
});

export const subscribeSchema = z.object({
	email: z.string().trim().email('Enter a valid email').max(320),
	source: z.string().trim().max(100).optional(),
});

// Reads a request body as either JSON or form-encoded, so the same endpoint
// works whether the frontend posts fetch(JSON) or a plain <form>.
export async function readBody(request: Request): Promise<Record<string, unknown>> {
	const contentType = request.headers.get('content-type') ?? '';
	if (contentType.includes('application/json')) {
		return (await request.json()) as Record<string, unknown>;
	}
	const form = await request.formData();
	return Object.fromEntries(form.entries());
}

// Honeypot: a hidden form field real users never fill. If it has a value, the
// submission is almost certainly a bot.
export function isBot(body: Record<string, unknown>): boolean {
	const trap = body._gotcha ?? body.website;
	return typeof trap === 'string' && trap.trim().length > 0;
}
