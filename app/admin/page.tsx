"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const fetcher = (key: string, headers: HeadersInit) =>
  fetch(key, { headers }).then((r) => r.json());

export default function AdminPage() {
  const [key, setKey] = useState<string>("");
  const headers = key ? { "x-admin-key": key } : undefined;
  const keyParam = key ? `adminKey=${encodeURIComponent(key)}` : "";

  const { data, error, mutate, isLoading } = useSWR(
    key ? ["/api/admin/incidents", headers] : null,
    ([url, h]) => fetcher(url as string, h as HeadersInit),
    { refreshInterval: 10000 }
  );

  useEffect(() => {
    try {
      const saved =
        typeof window !== "undefined"
          ? window.localStorage.getItem("ot_admin_key") || ""
          : "";
      if (saved) setKey(saved);
    } catch {
      /* no-op */
    }
  }, []);

  const setKeyAndSave = () => {
    const input = prompt("Enter admin key");
    if (input) {
      if (typeof window !== "undefined") window.localStorage.setItem("ot_admin_key", input);
      setKey(input);
    }
  };

  const act = async (action: "approve" | "disapprove" | "delete", id: string) => {
    await fetch("/api/admin/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(headers || {}) },
      body: JSON.stringify({ action, id }),
    });
    mutate();
  };

  if (!key) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <Button onClick={setKeyAndSave}>Enter admin key</Button>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">Admin</h1>
        <Button variant="outline" onClick={setKeyAndSave}>
          Change key
        </Button>
      </div>

      {error && <div className="text-red-500 text-sm">Auth failed or API error.</div>}
      {isLoading && <div className="text-sm text-zinc-500">Loading…</div>}

      <section>
        <h2 className="text-xl font-semibold mb-3">Drafts & Disapproved</h2>
        <div className="space-y-2">
          {data?.drafts?.length ? (
            data.drafts.map((d: any) => (
              <div key={d.id} className="border border-zinc-200 dark:border-zinc-800 rounded p-3 space-y-2">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">{d.title}</div>
                    <div className="text-xs text-zinc-500">{d.slug}</div>
                    <div className="text-xs text-zinc-500">Tags: {d.tags.join(", ") || "—"}</div>
                  </div>
                  <Badge variant={d.status === "DISAPPROVED" ? "destructive" : "outline"}>
                    {d.status.toLowerCase()}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => act("approve", d.id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => act("disapprove", d.id)}>
                    Disapprove
                  </Button>
                  <Link
                    href={`/admin/preview/${d.slug}${keyParam ? `?${keyParam}` : ""}`}
                    className="text-sm text-blue-600 dark:text-blue-400 underline"
                  >
                    Preview
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-zinc-500">No drafts.</div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Published</h2>
        <div className="space-y-2">
          {data?.published?.length ? (
            data.published.map((d: any) => (
              <div key={d.id} className="border border-zinc-200 dark:border-zinc-800 rounded p-3 space-y-2">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">{d.title}</div>
                    <div className="text-xs text-zinc-500">{d.slug}</div>
                    <div className="text-xs text-zinc-500">Tags: {d.tags.join(", ") || "—"}</div>
                  </div>
                  <Badge variant="secondary">published</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => act("delete", d.id)}>
                    Move to draft
                  </Button>
                  <Link
                    href={`/admin/preview/${d.slug}?published=1${keyParam ? `&${keyParam}` : ""}`}
                    className="text-sm text-blue-600 dark:text-blue-400 underline"
                  >
                    Preview
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-zinc-500">No published items.</div>
          )}
        </div>
      </section>
    </main>
  );
}

