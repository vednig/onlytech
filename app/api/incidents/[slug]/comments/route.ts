import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const incident = await prisma.incident.findUnique({ where: { slug } });
  if (!incident) {
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  }

  const comments = await prisma.comment.findMany({
    where: { incidentId: incident.id },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(comments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { slug } = await params;
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: user, error } = await supabase.auth.getUser(token);
  if (error || !user.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const text: string = body.body?.trim();
  const authorName: string | undefined = body.authorName?.trim() || undefined;
  const parentId: string | undefined = body.parentId || undefined;

  if (!text) {
    return NextResponse.json({ error: 'Comment body required' }, { status: 400 });
  }

  const incident = await prisma.incident.findUnique({ where: { slug } });
  if (!incident) {
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  }

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.incidentId !== incident.id) {
      return NextResponse.json({ error: 'Invalid parent' }, { status: 400 });
    }
  }

  const comment = await prisma.comment.create({
    data: {
      incidentId: incident.id,
      parentId,
      userId: user.user.id,
      authorName,
      body: text,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
