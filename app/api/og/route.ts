export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'OnlyTech.boo';
  const cost = searchParams.get('cost');
  const lessons = searchParams.get('lessons') || '';

  const headline = escapeText(title);
  const lessonText = lessons ? `Lessons: ${escapeText(lessons)}` : '';
  const costText = cost ? `Estimated cost: $${Number(cost).toLocaleString()}` : '';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0f172a"/>
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="#0b1220" stroke="#1f2937" stroke-width="4"/>
  <text x="120" y="200" fill="#e5e7eb" font-family="Helvetica, Arial, sans-serif" font-size="64" font-weight="700">
    OnlyTech.boo
  </text>
  <text x="120" y="270" fill="#9ca3af" font-family="Helvetica, Arial, sans-serif" font-size="32" font-weight="500">
    Engineering failures, root causes, and prevention.
  </text>
  <text x="120" y="340" fill="#f97316" font-family="Helvetica, Arial, sans-serif" font-size="28" font-weight="600">
    ${headline}
  </text>
  <text x="120" y="400" fill="#22c55e" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="600">
    ${costText || 'Impact · Cost · Lessons · Prevention'}
  </text>
  ${lessonText ? `<text x="120" y="450" fill="#cbd5e1" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="500">${lessonText}</text>` : ''}
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

