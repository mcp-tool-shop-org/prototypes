import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support | Feature-Reacher",
  description: "Get help with Feature-Reacher",
};

/**
 * Support page for Marketplace compliance.
 */
export default function SupportPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <Link
            href="/landing"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            &larr; Back to Feature-Reacher
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Support
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Get help with Feature-Reacher
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="space-y-8">
          {/* Contact */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Contact Us
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              For support inquiries, bug reports, or feature requests:
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    Email
                  </div>
                  <a
                    href="mailto:support@gentle-bay-0363a0d10.4.azurestaticapps.net"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    support@gentle-bay-0363a0d10.4.azurestaticapps.net
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    GitHub Issues
                  </div>
                  <a
                    href="https://github.com/mcp-tool-shop-org/feature-reacher/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Report a bug or request a feature
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Frequently Asked Questions
            </h2>
            <div className="mt-4 space-y-4">
              <FAQ
                question="Where is my data stored?"
                answer="All data is stored locally in your browser using IndexedDB. Nothing is sent to external servers unless you explicitly export and share a report."
              />
              <FAQ
                question="How do I delete my data?"
                answer="You can delete individual audits from the History page, or purge all local data from the Settings page. Clearing your browser data will also remove all Feature-Reacher data."
              />
              <FAQ
                question="How accurate are the adoption risk scores?"
                answer="Scores are based on heuristic analysis of your documentation. They should be used as decision-support, not definitive conclusions. Always verify important findings with actual usage data when available."
              />
              <FAQ
                question="Can I use this for my company's products?"
                answer="Yes! Feature-Reacher is available under the MIT License, which permits both personal and commercial use."
              />
              <FAQ
                question="What file formats are supported?"
                answer="You can paste text directly or upload .txt and .md (Markdown) files. Other formats may work but are not officially supported."
              />
              <FAQ
                question="Is there a limit to how much content I can analyze?"
                answer="There are no hard limits, but very large documents may affect browser performance. For best results, keep individual artifacts under 50,000 characters."
              />
            </div>
          </section>

          {/* Response Time */}
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-900/20">
            <h2 className="font-semibold text-amber-900 dark:text-amber-100">
              Response Time
            </h2>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
              Feature-Reacher is an open-source project. We aim to respond to
              support inquiries within 2-3 business days. For urgent issues,
              please indicate the severity in your message.
            </p>
          </section>

          {/* Resources */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Resources
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ResourceLink
                href="/demo"
                title="Try the Demo"
                description="See Feature-Reacher in action with sample data"
              />
              <ResourceLink
                href="/methodology"
                title="Methodology"
                description="Learn how scoring and diagnoses work"
              />
              <ResourceLink
                href="/privacy"
                title="Privacy Policy"
                description="How we handle your data"
              />
              <ResourceLink
                href="/terms"
                title="Terms of Service"
                description="Usage terms and conditions"
              />
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
            <Link href="/privacy" className="hover:text-zinc-700">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-zinc-700">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer items-center justify-between rounded-lg p-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800">
        {question}
        <svg
          className="h-4 w-4 text-zinc-400 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="mt-2 px-2 text-sm text-zinc-600 dark:text-zinc-400">
        {answer}
      </div>
    </details>
  );
}

function ResourceLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
    >
      <svg
        className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
      <div>
        <div className="font-medium text-zinc-900 dark:text-zinc-100">
          {title}
        </div>
        <div className="text-xs text-zinc-500">{description}</div>
      </div>
    </Link>
  );
}
