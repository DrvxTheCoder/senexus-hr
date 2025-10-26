import { db } from '@/lib/db';

/**
 * Get firm by slug
 * Returns firm with id and other details
 */
export async function getFirmFromSlug(slug: string) {
  const firm = await db.firm.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      themeColor: true
    }
  });

  return firm;
}

/**
 * Get firm ID from slug
 * Returns just the ID or null if not found
 */
export async function getFirmIdFromSlug(slug: string): Promise<string | null> {
  const firm = await getFirmFromSlug(slug);
  return firm?.id || null;
}
