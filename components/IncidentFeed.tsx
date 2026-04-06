"use client";

import { useEffect, useRef, useState } from 'react';
import { IncidentCard } from '@/components/IncidentCard';

interface Incident {
  id: string;
  slug: string;
  title: string;
  context: string;
  upvotes: number;
  tags: string[];
  createdAt: string;
  costEstimate?: number | null;
}

export default function IncidentFeed({ tags }: { tags: string[] }) {
  const [items, setItems] = useState<Incident[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tags.join(',')]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading && nextCursor) {
          load(false);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, nextCursor]);

  async function load(reset: boolean) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (tags.length) params.set('tags', tags.join(','));
      if (!reset && nextCursor) params.set('cursor', nextCursor);
      params.set('limit', '10');
      const res = await fetch(`/api/incidents?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load incidents');
      const data = await res.json();
      const newItems: Incident[] = data.items || [];
      setItems((prev) => (reset ? newItems : [...prev, ...newItems]));
      setNextCursor(data.nextCursor ?? null);
    } catch (err: any) {
      setError(err.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {items.map((incident, idx) => (
        <div key={incident.id} ref={idx === items.length - 2 ? sentinelRef : null}>
          <IncidentCard
            slug={incident.slug}
            title={incident.title}
            context={incident.context}
            upvotes={incident.upvotes}
            tags={incident.tags}
            createdAt={incident.createdAt}
            costEstimate={incident.costEstimate}
          />
        </div>
      ))}
      <div ref={items.length < 2 ? sentinelRef : undefined} />
      {loading && <div className="text-sm text-zinc-500 py-4">Loading…</div>}
      {error && <div className="text-sm text-red-500 py-2">{error}</div>}
      {!loading && items.length === 0 && <div className="text-sm text-zinc-500 py-4">No incidents found.</div>}
    </div>
  );
}

