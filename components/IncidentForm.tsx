'use client';

import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const SUGGESTED_TAGS = [
  'aws',
  'vercel',
  'dns',
  'security',
  'billing',
  'scaling',
  'human-error',
  'database',
  'api',
  'infra',
  'devops',
  'performance',
  'data-loss',
  'compliance',
];

export function IncidentForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    context: '',
    whatHappened: '',
    rootCause: '',
    impact: '',
    fix: '',
    lessons: '',
    prevention: '',
    costEstimate: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const payload = {
      ...formData,
      tags: selectedTags,
      costEstimate: formData.costEstimate ? parseInt(formData.costEstimate, 10) : null,
    };

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const incident = await response.json();
        toast.success('Incident submitted successfully!');
        router.push(`/incident/${incident.slug}`);
      } else {
        toast.error('Failed to submit incident');
      }
    } catch (error) {
      console.error('Error submitting incident:', error);
      toast.error('An error occurred while submitting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="Incident Title" required>
        <Input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Cron job deleted prod at 3AM"
          required
        />
      </Field>

      <Field label="Context">
        <Textarea
          id="context"
          name="context"
          value={formData.context}
          onChange={handleInputChange}
          placeholder="Stack, scale, environment, stakeholders"
          rows={3}
        />
      </Field>

      <Field label="What Happened">
        <Textarea
          id="whatHappened"
          name="whatHappened"
          value={formData.whatHappened}
          onChange={handleInputChange}
          placeholder="Sequence of events"
          rows={4}
        />
      </Field>

      <Field label="Root Cause">
        <Textarea
          id="rootCause"
          name="rootCause"
          value={formData.rootCause}
          onChange={handleInputChange}
          placeholder="Systemic and proximate causes"
          rows={3}
        />
      </Field>

      <Field label="Impact">
        <Textarea
          id="impact"
          name="impact"
          value={formData.impact}
          onChange={handleInputChange}
          placeholder="Cost, downtime, data loss"
          rows={3}
        />
      </Field>

      <Field label="Fix">
        <Textarea
          id="fix"
          name="fix"
          value={formData.fix}
          onChange={handleInputChange}
          placeholder="Actions taken to restore service"
          rows={3}
        />
      </Field>

      <Field label="Lessons Learned" hint="One per line">
        <Textarea
          id="lessons"
          name="lessons"
          value={formData.lessons}
          onChange={handleInputChange}
          placeholder="One lesson per line"
          rows={3}
        />
      </Field>

      <Field label="Prevention" hint="One per line">
        <Textarea
          id="prevention"
          name="prevention"
          value={formData.prevention}
          onChange={handleInputChange}
          placeholder="Guardrails, checklists, monitors"
          rows={3}
        />
      </Field>

      <Field label="Estimated Cost ($)">
        <Input
          type="number"
          id="costEstimate"
          name="costEstimate"
          value={formData.costEstimate}
          onChange={handleInputChange}
          placeholder="48000"
          min={0}
        />
      </Field>

      <div>
        <Label className="block text-sm font-medium mb-3">Tags</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {SUGGESTED_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black border-zinc-900 dark:border-zinc-100'
                  : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : 'Submit Incident'}
      </Button>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
  required,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">
          {label}
          {required ? ' *' : ''}
        </Label>
        {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
