"use client";

import Link from "next/link";

/**
 * Public landing page for Feature-Reacher.
 * Primary CTA: "Try the Demo" which loads sample data.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
                FR
              </div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Feature-Reacher
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/demo"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Try Demo
              </Link>
              <Link
                href="/methodology"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Methodology
              </Link>
              <Link
                href="/"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Open App
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          No analytics required
        </div>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
          Run an Adoption Risk Audit
          <br />
          <span className="text-blue-600">in 2 minutes</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Surface features that users may never discover. Feature-Reacher analyzes your
          release notes and documentation to find adoption risks—backed by evidence,
          not guesswork.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Try the Demo
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-6 py-3 text-lg font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Use Your Own Data
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            How It Works
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-zinc-600 dark:text-zinc-400">
            Three steps to evidence-backed adoption insights
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Step
              number={1}
              title="Paste Your Docs"
              description="Upload release notes, documentation, FAQs, or any product content. No account required."
              icon={
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              }
            />
            <Step
              number={2}
              title="Run the Audit"
              description="Feature-Reacher extracts features, scores visibility, and generates diagnoses with cited evidence."
              icon={
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              }
            />
            <Step
              number={3}
              title="Act on Insights"
              description="Get ranked features with actionable recommendations. Export reports for stakeholders."
              icon={
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              }
            />
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Why Feature-Reacher?
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <ValueProp
              title="Evidence-Backed, Not AI Vibes"
              description="Every diagnosis comes with cited evidence from your documents. No hallucinations, no black boxes—just explainable heuristics."
            />
            <ValueProp
              title="No Analytics Required"
              description="Don't have usage data? No problem. Feature-Reacher works with what you already have: release notes and documentation."
            />
            <ValueProp
              title="Repeatable Audits"
              description="Save artifact sets, compare audits over time, and track feature risk trends with sparkline visualizations."
            />
            <ValueProp
              title="Stakeholder-Ready Exports"
              description="Generate executive narratives and comparison reports. Template-driven, professional output—ready for partners."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-200 bg-blue-600 py-16 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to find your hidden features?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-blue-100">
            Run your first Adoption Risk Audit in under 2 minutes. No sign-up required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-lg font-medium text-blue-600 shadow-lg transition-all hover:bg-blue-50"
            >
              Try the Demo
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-400 px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-blue-700"
            >
              Start Fresh
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white text-xs font-bold">
                FR
              </div>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Feature-Reacher
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/privacy" className="hover:text-zinc-700 dark:hover:text-zinc-300">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-zinc-700 dark:hover:text-zinc-300">
                Terms
              </Link>
              <Link href="/support" className="hover:text-zinc-700 dark:hover:text-zinc-300">
                Support
              </Link>
              <Link href="/methodology" className="hover:text-zinc-700 dark:hover:text-zinc-300">
                Methodology
              </Link>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-zinc-400">
            Phase 3 — Marketplace-Ready Packaging
          </p>
        </div>
      </footer>
    </div>
  );
}

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function Step({ number, title, description, icon }: StepProps) {
  return (
    <div className="relative rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="absolute -top-3 left-6 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
        {number}
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}

interface ValuePropProps {
  title: string;
  description: string;
}

function ValueProp({ title, description }: ValuePropProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}
