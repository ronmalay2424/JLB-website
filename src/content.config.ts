import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Content collections are edited through the CMS at /admin and rendered by the
// frontend later. Each collection maps to a folder of Markdown files; the schema
// is the contract the CMS forms and the frontend both rely on.

// Upcoming (and past) shows. One file per show.
const shows = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/shows' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		venue: z.string(),
		city: z.string(),
		ticketUrl: z.string().url().optional(),
		price: z.string().optional(),
		ageRestriction: z.string().optional(),
		soldOut: z.boolean().default(false),
	}),
});

// Photo gallery. One file per photo; the body is unused.
const gallery = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/gallery' }),
	schema: z.object({
		image: z.string(),
		alt: z.string(),
		caption: z.string().optional(),
		featured: z.boolean().default(false),
		order: z.number().default(0),
	}),
});

// Band members. One file per member; the body is an optional bio.
const members = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/members' }),
	schema: z.object({
		name: z.string(),
		photo: z.string(),
		role: z.string().optional(),
		order: z.number().default(0),
	}),
});

// Long-form pages (bio/about, press, etc.). Body is Markdown.
const pages = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
	schema: z.object({
		title: z.string(),
		heroImage: z.string().optional(),
	}),
});

export const collections = { shows, gallery, members, pages };
