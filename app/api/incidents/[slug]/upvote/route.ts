import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Validate user session via Supabase auth
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user, error } = await supabase.auth.getUser(token);
    if (error || !user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.user.id;

    // Ensure one vote per user per incident
    const incidentRecord = await prisma.incident.findUnique({ where: { slug } });
    if (!incidentRecord) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const existing = await prisma.vote.findUnique({
      where: { incidentId_userId: { incidentId: incidentRecord.id, userId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Already upvoted' }, { status: 409 });
    }

    const incident = await prisma.incident
      .update({
        where: { slug },
        data: {
          upvotes: { increment: 1 },
          votes: { create: { userId } },
        },
      })
      .catch((err) => {
        if (err.code === 'P2025') return null;
        throw err;
      });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Error upvoting incident:', error);
    return NextResponse.json(
      { error: 'Failed to upvote incident' },
      { status: 500 }
    );
  }
}
