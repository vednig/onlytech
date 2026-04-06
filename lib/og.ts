const base =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export function buildOg(params: { title: string; cost?: number; lessons?: string }) {
  const url = new URL('/api/og', base);
  url.searchParams.set('title', params.title);
  if (params.cost != null) url.searchParams.set('cost', String(params.cost));
  if (params.lessons) url.searchParams.set('lessons', params.lessons);
  return url.toString();
}

export function incidentOg(slug: string) {
  const url = new URL(`/api/og/incident/${slug}`, base);
  return url.toString();
}

