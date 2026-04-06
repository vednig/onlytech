"use client";

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface TagsFilterProps {
  availableTags: string[];
  selected: string[];
}

export function TagsFilter({ availableTags, selected }: TagsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggleTag = (tag: string) => {
    const next = new Set(selectedSet);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    const params = new URLSearchParams(searchParams?.toString());
    if (next.size === 0) {
      params.delete('tags');
      params.delete('tag');
    } else {
      params.set('tags', Array.from(next).join(','));
      params.delete('tag');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {availableTags.map((tag) => {
        const active = selectedSet.has(tag);
        return (
          <Badge
            key={tag}
            variant={active ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Badge>
        );
      })}
    </div>
  );
}

