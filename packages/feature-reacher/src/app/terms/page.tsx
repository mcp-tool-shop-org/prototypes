import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Feature-Reacher",
  description: "Terms and conditions for using Feature-Reacher",
};

/**
 * Terms of Service page for Marketplace compliance.
 */
export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Last updated: February 2026
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          <section>
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing or using Feature-Reacher, you agree to be bound by
              these Terms of Service. If you do not agree to these terms, please
              do not use the application.
            </p>
            <p>
              Feature-Reacher is operated by mcp-tool-shop, based in Louisiana,
              United States.
            </p>
          </section>

          <section>
            <h2>Description of Service</h2>
            <p>
              Feature-Reacher is a documentation analysis tool that identifies
              potential feature adoption risks. The service:
            </p>
            <ul>
              <li>Analyzes text content you provide</li>
              <li>Generates diagnostic reports based on heuristic algorithms</li>
              <li>Stores data locally in your browser</li>
              <li>Provides export functionality for sharing results</li>
            </ul>
          </section>

          <section>
            <h2>Use License</h2>
            <p>
              Feature-Reacher is provided under the MIT License. You are
              permitted to:
            </p>
            <ul>
              <li>Use the application for personal or commercial purposes</li>
              <li>Modify and distribute the source code</li>
              <li>Create derivative works</li>
            </ul>
            <p>
              The software is provided &quot;as is&quot; without warranty of any kind.
            </p>
          </section>

          <section>
            <h2>User Responsibilities</h2>
            <p>When using Feature-Reacher, you agree to:</p>
            <ul>
              <li>
                Provide only content you have the right to analyze
              </li>
              <li>
                Not use the service for any unlawful purpose
              </li>
              <li>
                Not attempt to reverse engineer the analysis algorithms for
                malicious purposes
              </li>
              <li>
                Take responsibility for the security of exported reports
              </li>
            </ul>
          </section>

          <section>
            <h2>Intellectual Property</h2>
            <p>
              <strong>Your content</strong>: You retain all rights to the
              content you upload or paste into Feature-Reacher. We do not claim
              ownership of your data.
            </p>
            <p>
              <strong>Our content</strong>: The Feature-Reacher brand, design,
              and documentation are protected by copyright. The source code is
              available under the MIT License.
            </p>
          </section>

          <section>
            <h2>Disclaimer of Warranties</h2>
            <p>
              Feature-Reacher is provided on an &quot;as is&quot; and &quot;as available&quot;
              basis. We make no warranties, expressed or implied, regarding:
            </p>
            <ul>
              <li>The accuracy of analysis results</li>
              <li>The suitability of the service for any particular purpose</li>
              <li>Uninterrupted or error-free operation</li>
              <li>The security of locally stored data</li>
            </ul>
          </section>

          <section>
            <h2>Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, we shall not be liable for
              any indirect, incidental, special, consequential, or punitive
              damages arising from your use of Feature-Reacher.
            </p>
            <p>
              This includes, but is not limited to, damages resulting from:
            </p>
            <ul>
              <li>Business decisions made based on audit results</li>
              <li>Loss of data stored in your browser</li>
              <li>Unauthorized access to exported reports</li>
            </ul>
          </section>

          <section>
            <h2>Analysis Results Disclaimer</h2>
            <p>
              <strong>Important</strong>: Feature-Reacher provides diagnostic
              suggestions based on heuristic analysis of text content. Results
              are intended as decision-support information, not definitive
              conclusions.
            </p>
            <p>You should:</p>
            <ul>
              <li>
                Verify important findings with actual usage data when available
              </li>
              <li>
                Use results as one input among many in decision-making
              </li>
              <li>
                Not rely solely on automated analysis for critical business
                decisions
              </li>
            </ul>
          </section>

          <section>
            <h2>Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued
              use of Feature-Reacher after changes constitutes acceptance of the
              updated terms.
            </p>
          </section>

          <section>
            <h2>Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with
              the laws of the State of Florida, United States, without regard
              to conflict of law principles.
            </p>
          </section>

          <section>
            <h2>Data Processing Summary</h2>
            <ul>
              <li>No server-side storage &mdash; all data stays in your browser</li>
              <li>No analytics or tracking cookies</li>
              <li>No third-party data sharing</li>
            </ul>
            <p>
              For full details, see our{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              For questions about these terms, please visit our{" "}
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
            <Link href="/privacy" className="hover:text-zinc-700">
              Privacy
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
