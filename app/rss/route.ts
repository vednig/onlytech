import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return new NextResponse('DATABASE_URL not set', { status: 503 });
  }

  const incidents = await prisma.incident.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const url = new URL(request.url);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    `${url.protocol}//${url.host}`;

  const items = incidents
    .map((incident) => {
      const link = `${siteUrl}/incident/${incident.slug}`;
      return `<item>
  <title><![CDATA[${incident.title}]]></title>
  <link>${link}</link>
  <guid>${link}</guid>
  <description><![CDATA[${incident.context}]]></description>
  <pubDate>${incident.createdAt.toUTCString()}</pubDate>
</item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>OnlyTech incidents</title>
  <link>${siteUrl}</link>
  <description>Real-world engineering failures and lessons learned.</description>
  ${items}
</channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
