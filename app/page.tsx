import Link from 'next/link';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { TagsFilter } from '@/components/TagsFilter';
import IncidentFeed from '@/components/IncidentFeed';

async function getStats() {
  const [count, costly] = await Promise.all([
    prisma.incident.count({ where: { published: true } }),
    prisma.incident.findFirst({ where: { published: true }, orderBy: { costEstimate: 'desc' } }),
  ]);

  return { count, topCost: costly?.costEstimate ?? 0 };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; tags?: string }>;
}) {
  const { tag, tags } = await searchParams;
  const selectedTags = (tags || tag || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const statsPromise = getStats();
  const tagsPromise = getAllTags();

  if (!process.env.DATABASE_URL) {
    return (
      <main className="min-h-screen bg-white dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            OnlyTech.boo setup
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Set <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900">DATABASE_URL</code> in
            a <code>.env</code> file, then run <code>prisma migrate dev</code> (or <code>prisma db push</code>) and restart the dev server.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Example: see <code>.env.example</code>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-950 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Only<span style={{color:"#00B0F1"}}>Tech</span>
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
                Brutally honest, engineering-first incident library. No vanity metrics—just costly mistakes and lessons learned.
              </p>
              <div className="flex gap-3 mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                <Link href="/top" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                  Top costly
                </Link>
                <Link href="/rss" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                  RSS
                </Link>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/submit"
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-md font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Submit Your Story
              </Link>
            </div>
          </div>

          <Suspense fallback={<div className="text-sm text-zinc-500">Loading stats…</div>}>
            <StatsBar statsPromise={statsPromise} />
          </Suspense>

          <Suspense fallback={<div className="text-sm text-zinc-500 mt-3">Loading tags…</div>}>
            <TagsBar tagsPromise={tagsPromise} selected={selectedTags} />
          </Suspense>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <IncidentFeed tags={selectedTags} />
      </div>
    </main>
  );
}

async function StatsBar({ statsPromise }: { statsPromise: Promise<{ count: number; topCost: number }> }) {
  const stats = await statsPromise;
  return (
    <div className="flex gap-6 text-sm text-zinc-600 dark:text-zinc-400">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{stats.count}</span>
        <span>incidents filed</span>
      </div>
      {stats.topCost > 0 && (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-orange-600 dark:text-orange-400">
            ${(stats.topCost / 1000).toFixed(0)}k
          </span>
          <span>largest reported loss</span>
        </div>
      )}
    </div>
  );
}

async function TagsBar({
  tagsPromise,
  selected,
}: {
  tagsPromise: Promise<string[]>;
  selected: string[];
}) {
  const tags = await tagsPromise;
  return <TagsFilter availableTags={tags} selected={selected} />;
}

async function getAllTags() {
  const rows = await prisma.incident.findMany({
    select: { tags: true },
    where: { published: true },
    take: 500,
  });
  const set = new Set<string>();
  rows.forEach((r) => r.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort();
}
