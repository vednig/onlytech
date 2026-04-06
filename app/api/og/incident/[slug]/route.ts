import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const incident = await prisma.incident.findFirst({ where: { slug, published: true } });
  if (!incident) return new Response('Not found', { status: 404 });

  const title = escapeText(incident.title);
  const tagline = 'Engineering failures, root causes, and prevention.';
  const headline = `“${incident.title}”`;
  const footer = [
    incident.impact ? 'Impact' : null,
    incident.costEstimate != null ? `Cost ~$${Math.round(incident.costEstimate).toLocaleString()}` : null,
    incident.lessons?.length ? 'Lessons' : null,
    incident.prevention?.length ? 'Prevention' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0f172a"/>
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="#0b1220" stroke="#1f2937" stroke-width="4"/>
  <text x="120" y="200" fill="#e5e7eb" font-family="Helvetica, Arial, sans-serif" font-size="64" font-weight="700">
    OnlyTech
  </text>
  <text x="120" y="270" fill="#9ca3af" font-family="Helvetica, Arial, sans-serif" font-size="32" font-weight="500">
    ${tagline}
  </text>
  <text x="120" y="340" fill="#f97316" font-family="Helvetica, Arial, sans-serif" font-size="28" font-weight="600">
    ${headline}
  </text>
  <text x="120" y="400" fill="#22c55e" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="600">
    ${footer || 'Impact · Cost · Lessons · Prevention'}
  </text>
</svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function escapeText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
