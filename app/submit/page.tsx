import Link from 'next/link';
import { IncidentForm } from '@/components/IncidentForm';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Submit an Incident - OnlyTech.boo',
  description: 'Share your engineering failure and help the community learn from your mistakes.',
};

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-950 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Incidents
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Submit an Incident
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Share your engineering failure to help the community learn from your experience. Be specific and honest about what went wrong and what you learned.
          </p>
        </div>

        <IncidentForm />
      </div>
    </main>
  );
}
