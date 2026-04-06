import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_KEY = process.env.ADMIN_KEY;

function authorize(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || req.nextUrl.searchParams.get('adminKey');
  return ADMIN_KEY && key === ADMIN_KEY;
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [drafts, published] = await Promise.all([
    prisma.draftIncident.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.incident.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' } }),
  ]);

  return NextResponse.json({ drafts, published });
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const action: 'approve' | 'disapprove' | 'delete' = body.action;
  const id: string = body.id;
  if (!action || !id) return NextResponse.json({ error: 'Missing action or id' }, { status: 400 });

  if (action === 'approve') {
    const draft = await prisma.draftIncident.findUnique({ where: { id } });
    if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.incident.upsert({
        where: { slug: draft.slug },
        update: {
          title: draft.title,
          context: draft.context,
          whatHappened: draft.whatHappened,
          rootCause: draft.rootCause,
          impact: draft.impact,
          fix: draft.fix,
          lessons: draft.lessons,
          prevention: draft.prevention,
          tags: draft.tags,
          costEstimate: draft.costEstimate,
          published: true,
        },
        create: {
          slug: draft.slug,
          title: draft.title,
          context: draft.context,
          whatHappened: draft.whatHappened,
          rootCause: draft.rootCause,
          impact: draft.impact,
          fix: draft.fix,
          lessons: draft.lessons,
          prevention: draft.prevention,
          tags: draft.tags,
          costEstimate: draft.costEstimate,
          createdAt: draft.createdAt,
          published: true,
        },
      });
      await tx.draftIncident.delete({ where: { id } });
    });
    return NextResponse.json({ approved: draft.slug });
  }

  if (action === 'disapprove') {
    await prisma.draftIncident.update({ where: { id }, data: { status: 'DISAPPROVED' } });
    return NextResponse.json({ disapproved: id });
  }

  if (action === 'delete') {
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.$transaction(async (tx) => {
      await tx.draftIncident.upsert({
        where: { slug: incident.slug },
        update: {
          title: incident.title,
          context: incident.context,
          whatHappened: incident.whatHappened,
          rootCause: incident.rootCause,
          impact: incident.impact,
          fix: incident.fix,
          lessons: incident.lessons,
          prevention: incident.prevention,
          tags: incident.tags,
          costEstimate: incident.costEstimate,
          createdAt: incident.createdAt,
          status: 'DRAFT',
        },
        create: {
          slug: incident.slug,
          title: incident.title,
          context: incident.context,
          whatHappened: incident.whatHappened,
          rootCause: incident.rootCause,
          impact: incident.impact,
          fix: incident.fix,
          lessons: incident.lessons,
          prevention: incident.prevention,
          tags: incident.tags,
          costEstimate: incident.costEstimate,
          createdAt: incident.createdAt,
          status: 'DRAFT',
        },
      });

      await tx.incident.update({
        where: { id },
        data: { published: false },
      });
    });
    return NextResponse.json({ movedToDraft: incident.slug, unpublished: true });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
