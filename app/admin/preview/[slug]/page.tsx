"use client";

import useSWR from 'swr';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

const fetcher = (url: string, headers: HeadersInit) => fetch(url, { headers }).then((r) => r.json());

export default function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchKey = searchParams?.get('adminKey') || '';
  const key =
    searchKey || (typeof window !== 'undefined' ? window.localStorage.getItem('ot_admin_key') || '' : '');
  const headers = key ? { 'x-admin-key': key } : {};
  const isPublished = searchParams?.get('published') === '1';

  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const endpoint =
    slug && isPublished
      ? `/api/admin/preview/${slug}?published=1`
      : slug
      ? `/api/admin/preview/${slug}`
      : null;

  const { data, error, mutate, isLoading } = useSWR(
    key && endpoint ? [endpoint, headers] : null,
    ([url, h]) => fetcher(url as string, h as HeadersInit)
  );

  const act = async (action: 'approve' | 'disapprove' | 'delete') => {
    if (isPublished && action === 'approve') return; // no-op
    await fetch('/api/admin/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(headers || {}) },
      body: JSON.stringify({ action, id: isPublished ? data?.incident?.id : data?.draft?.id }),
    });
    mutate();
    router.push('/admin');
  };

  if (!key) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-sm text-red-500">Admin key missing.</div>
      </main>
    );
  }

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-10 text-sm">Loading…</div>;
  const record = isPublished ? data?.incident : data?.draft;
  if (error || !record) return <div className="max-w-3xl mx-auto px-4 py-10 text-sm">Not found.</div>;

  const d = record;

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <Button variant="outline" onClick={() => router.push('/admin')}>
        ← Back to admin
      </Button>

      <div className="flex gap-3 items-center">
        {!isPublished && (
          <>
            <Button onClick={() => act('approve')}>Approve</Button>
            <Button variant="outline" onClick={() => act('disapprove')}>
              Disapprove
            </Button>
          </>
        )}
        {isPublished && (
          <Button variant="destructive" onClick={() => act('delete')}>
            Move to draft
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {d.status && <Badge>{String(d.status).toLowerCase()}</Badge>}
        {d.tags?.map((t: string) => (
          <Badge key={t} variant="outline">
            {t}
          </Badge>
        ))}
      </div>

      <article className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">{d.title}</h1>
          {d.cost_estimate && (
            <div className="text-sm font-semibold text-orange-600">~${(d.cost_estimate / 1000).toFixed(0)}k</div>
          )}
        </div>
        <Section title="Context" body={d.context} />
        <Section title="What Happened" body={d.what_happened} />
        <Section title="Root Cause" body={d.root_cause} />
        <Section title="Impact" body={d.impact} />
        <Section title="Fix" body={d.fix} />
        {d.lessons?.length ? <ListSection title="Lessons" items={d.lessons} /> : null}
        {d.prevention?.length ? <ListSection title="Prevention" items={d.prevention} /> : null}
      </article>
    </main>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="space-y-2">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{body}</p>
    </section>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <ul className="list-disc pl-5 space-y-1 text-zinc-800 dark:text-zinc-200">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </section>
  );
}
