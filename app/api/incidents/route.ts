import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const tagsParam = searchParams.get('tags');
    const tags = (tagsParam || tag || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const sortBy = searchParams.get('sort') || 'recent';
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 50);

    const incidents = await prisma.incident.findMany({
      where: {
        published: true,
        ...(tags.length ? { tags: { hasEvery: tags } } : {}),
      },
      orderBy:
        sortBy === 'trending'
          ? [{ upvotes: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }]
          : [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    let nextCursor: string | null = null;
    if (incidents.length > limit) {
      const nextItem = incidents.pop();
      nextCursor = nextItem?.id ?? null;
    }

    return NextResponse.json({ items: incidents, nextCursor });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      context,
      whatHappened,
      rootCause,
      impact,
      fix,
      lessons,
      prevention,
      tags,
      costEstimate,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const slug = createSlug(title);

    const draft = await prisma.draftIncident.create({
      data: {
        slug,
        title,
        context: context ?? '',
        whatHappened: whatHappened ?? '',
        rootCause: rootCause ?? '',
        impact: impact ?? '',
        fix: fix ?? '',
        lessons: normalizeList(lessons),
        prevention: normalizeList(prevention),
        tags: normalizeTags(tags),
        costEstimate: costEstimate ? parseInt(costEstimate) : null,
        status: 'DRAFT',
      },
    });

    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 500 }
    );
  }
}

function normalizeList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'string')
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  return [];
}

function normalizeTags(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map((t) => String(t).trim()).filter(Boolean);
  if (typeof value === 'string')
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  return [];
}

function createSlug(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') +
    `-${Date.now().toString(36)}`
  );
}
