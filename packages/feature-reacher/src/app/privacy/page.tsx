import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Feature-Reacher",
  description: "How Feature-Reacher handles your data",
};

/**
 * Privacy Policy page for Marketplace compliance.
 */
export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Last updated: February 2026
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          <section>
            <h2>Overview</h2>
            <p>
              Feature-Reacher is a client-side application that analyzes product
              documentation to identify adoption risks. We are committed to
              protecting your privacy and being transparent about how your data
              is handled.
            </p>
          </section>

          <section>
            <h2>What Data Is Processed</h2>
            <p>Feature-Reacher processes the following data:</p>
            <ul>
              <li>
                <strong>Artifact content</strong>: Text you paste or upload
                (release notes, documentation, FAQs)
              </li>
              <li>
                <strong>Audit results</strong>: Extracted features, risk scores,
                and diagnoses generated from your content
              </li>
              <li>
                <strong>User preferences</strong>: Settings like auto-save
                toggle state
              </li>
            </ul>
          </section>

          <section>
            <h2>Where Data Is Stored</h2>
            <p>
              <strong>All data is stored locally in your browser</strong> using
              IndexedDB. Specifically:
            </p>
            <ul>
              <li>
                No data is transmitted to external servers during normal
                operation
              </li>
              <li>No cloud storage or third-party analytics are used</li>
              <li>No user accounts or authentication are required</li>
              <li>
                Data remains entirely on your device unless you explicitly
                export it
              </li>
            </ul>
          </section>

          <section>
            <h2>Data Retention</h2>
            <p>
              Data persists in your browser&apos;s IndexedDB until you delete it.
              You can:
            </p>
            <ul>
              <li>
                Delete individual audits from the History page
              </li>
              <li>
                Purge all local data from the Settings page
              </li>
              <li>
                Clear browser data (which removes all Feature-Reacher data)
              </li>
            </ul>
            <p>
              We do not have access to your data and cannot delete it on your
              behalf.
            </p>
          </section>

          <section>
            <h2>Data Sharing</h2>
            <p>
              Feature-Reacher does not share your data with third parties.
              However:
            </p>
            <ul>
              <li>
                <strong>Exports</strong>: When you export a report (text, HTML,
                or PDF), the exported file contains your audit data. You control
                who receives this file.
              </li>
              <li>
                <strong>Future features</strong>: If we add collaboration or
                cloud sync features in the future, they will be opt-in and
                clearly disclosed.
              </li>
            </ul>
          </section>

          <section>
            <h2>Cookies and Tracking</h2>
            <p>Feature-Reacher does not use:</p>
            <ul>
              <li>Cookies</li>
              <li>Analytics trackers</li>
              <li>Advertising pixels</li>
              <li>Session recording tools</li>
            </ul>
          </section>

          <section>
            <h2>Third-Party Services</h2>
            <p>
              The application may load resources from:
            </p>
            <ul>
              <li>
                <strong>Google Fonts</strong>: For typography (Geist font
                family). Google&apos;s privacy policy applies to font loading.
              </li>
            </ul>
            <p>
              No other third-party services are used during normal operation.
            </p>
          </section>

          <section>
            <h2>Security</h2>
            <p>
              Since all data remains on your device, security depends on your
              browser and device security practices. We recommend:
            </p>
            <ul>
              <li>Keeping your browser updated</li>
              <li>Using device encryption</li>
              <li>
                Being cautious about exporting sensitive audit data
              </li>
            </ul>
          </section>

          <section>
            <h2>Changes to This Policy</h2>
            <p>
              We may update this privacy policy to reflect changes in our
              practices or for legal reasons. Significant changes will be noted
              in the application.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              For privacy-related questions, please visit our{" "}
              <Link href="/support" className="text-blue-600 hover:underline">
                Support page
              </Link>
              .
            </p>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
            <Link href="/terms" className="hover:text-zinc-700">
              Terms
            </Link>
            <Link href="/support" className="hover:text-zinc-700">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
