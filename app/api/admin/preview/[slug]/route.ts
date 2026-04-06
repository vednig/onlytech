import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_KEY = process.env.ADMIN_KEY;

function authorize(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || req.nextUrl.searchParams.get('adminKey');
  return ADMIN_KEY && key === ADMIN_KEY;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!authorize(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { slug } = await params;
  const isPublished = request.nextUrl.searchParams.get('published') === '1';

  if (isPublished) {
    const incident = await prisma.incident.findUnique({ where: { slug } });
    if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ incident });
  }

  const draft = await prisma.draftIncident.findUnique({ where: { slug } });
  if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ draft });
}

