import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology | Feature-Reacher",
  description: "How Feature-Reacher scores features and generates diagnoses",
};

/**
 * Methodology page explaining the scoring system.
 * Preempts AI skepticism by showing deterministic, evidence-based approach.
 */
export default function MethodologyPage() {
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
            Scoring Methodology
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            How Feature-Reacher generates evidence-backed adoption risk scores
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="space-y-12">
          {/* Philosophy */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Our Philosophy: Evidence Over AI
            </h2>
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>No AI, no hallucinations, no black boxes.</strong>{" "}
                Feature-Reacher uses deterministic heuristics that produce the
                same output for the same input. Every diagnosis is traceable to
                specific evidence in your documents.
              </p>
            </div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              We intentionally avoid machine learning models for feature detection
              and risk scoring. Why? Because we believe adoption risk analysis
              requires explainability. When we tell you a feature is at risk, you
              should be able to ask &quot;why?&quot; and get a concrete answer—not a
              probability distribution.
            </p>
          </section>

          {/* Scoring Factors */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Scoring Factors
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Each feature receives a composite risk score based on three factors:
            </p>

            <div className="mt-6 space-y-6">
              <ScoringFactor
                name="Recency Score"
                weight="30%"
                description="How recently was this feature mentioned in documentation?"
                calculation={[
                  "Extract timestamps from document metadata",
                  "Calculate days since last mention",
                  "Apply exponential decay function",
                  "Score: 1.0 (old/stale) → 0.0 (recently updated)",
                ]}
                example='Feature last mentioned 18 months ago in v2.0 release notes → Recency score: 0.72 (elevated risk)'
              />

              <ScoringFactor
                name="Visibility Score"
                weight="40%"
                description="How prominently is this feature surfaced in documentation?"
                calculation={[
                  "Count heading-level mentions (H1 = high visibility)",
                  "Count FAQ entries mentioning the feature",
                  "Check for dedicated documentation pages",
                  "Analyze position in document hierarchy",
                  "Score: 1.0 (buried/hidden) → 0.0 (prominent)",
                ]}
                example='Feature buried in paragraph 8 of a long page, no FAQ entry → Visibility score: 0.68 (moderate risk)'
              />

              <ScoringFactor
                name="Density Score"
                weight="30%"
                description="How thoroughly is this feature documented?"
                calculation={[
                  "Calculate word count dedicated to feature",
                  "Count code examples/screenshots",
                  "Evaluate cross-reference count",
                  "Compare against feature complexity signals",
                  "Score: 1.0 (sparse) → 0.0 (comprehensive)",
                ]}
                example='Complex feature with 50-word explanation and no examples → Density score: 0.55 (moderate risk)'
              />
            </div>
          </section>

          {/* Composite Score */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Composite Risk Score
            </h2>
            <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 font-mono text-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-zinc-600 dark:text-zinc-400">
                Risk = (Recency × 0.30) + (Visibility × 0.40) + (Density × 0.30)
              </p>
            </div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              The composite score is normalized to a 0-1 scale where:
            </p>
            <ul className="mt-2 ml-4 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <strong>0.0 - 0.25:</strong> Low risk (healthy feature)
              </li>
              <li>
                <strong>0.25 - 0.50:</strong> Medium risk (needs attention)
              </li>
              <li>
                <strong>0.50 - 0.75:</strong> High risk (likely underutilized)
              </li>
              <li>
                <strong>0.75 - 1.0:</strong> Critical risk (urgent action needed)
              </li>
            </ul>
          </section>

          {/* Diagnoses */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Diagnosis Types
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Based on scoring patterns, features receive one or more diagnoses:
            </p>

            <div className="mt-6 space-y-4">
              <DiagnosisType
                name="Documentation Gap"
                trigger="Density score > 0.6 AND feature appears complex"
                description="Feature lacks sufficient documentation for its complexity."
              />
              <DiagnosisType
                name="Low Visibility"
                trigger="Visibility score > 0.5 AND feature has value signals"
                description="Feature is buried in docs despite being potentially valuable."
              />
              <DiagnosisType
                name="Stale"
                trigger="Recency score > 0.7 AND no recent updates"
                description="Feature documentation hasn't been updated in significant time."
              />
              <DiagnosisType
                name="Complexity Barrier"
                trigger="Multiple setup steps detected AND no wizard/guide"
                description="Feature requires complex setup without guided assistance."
              />
              <DiagnosisType
                name="Enterprise Gate"
                trigger="Plan/tier restriction detected"
                description="Feature is limited to higher-tier plans, reducing discoverability."
              />
              <DiagnosisType
                name="Technical Jargon"
                trigger="Undefined technical terms detected"
                description="Documentation uses terminology without beginner-friendly explanations."
              />
            </div>
          </section>

          {/* Confidence */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Confidence Indicators
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Not all scores are created equal. Confidence depends on:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                <span>
                  <strong>High confidence:</strong> Multiple evidence sources,
                  clear patterns, unambiguous signals
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-500" />
                <span>
                  <strong>Medium confidence:</strong> Single evidence source or
                  mixed signals
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                <span>
                  <strong>Low confidence:</strong> Inferred from limited data,
                  verify manually
                </span>
              </li>
            </ul>
          </section>

          {/* Limitations */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Known Limitations
            </h2>
            <div className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <p>
                <strong>No usage data:</strong> We analyze documentation, not
                actual user behavior. A feature may be well-documented but still
                underused, or poorly documented but widely adopted.
              </p>
              <p>
                <strong>Text-only analysis:</strong> We don&apos;t analyze images,
                videos, or interactive tutorials. Features documented primarily
                through visual media may score higher risk than warranted.
              </p>
              <p>
                <strong>English-focused:</strong> Heuristics are optimized for
                English-language documentation. Non-English content may produce
                less accurate results.
              </p>
              <p>
                <strong>Point-in-time snapshot:</strong> Results reflect the
                state of documentation at analysis time. Use the compare feature
                to track changes over time.
              </p>
            </div>
          </section>

          {/* Verify */}
          <section className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-900/20">
            <h2 className="font-semibold text-blue-900 dark:text-blue-100">
              Verify Important Findings
            </h2>
            <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              Feature-Reacher provides decision-support intelligence, not
              definitive conclusions. For critical decisions, we recommend:
            </p>
            <ul className="mt-3 ml-4 list-disc text-sm text-blue-700 dark:text-blue-300">
              <li>Cross-reference with actual usage analytics if available</li>
              <li>Validate with customer support/success teams</li>
              <li>Review the cited evidence for each diagnosis</li>
              <li>Track trends over multiple audits</li>
            </ul>
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
            <Link href="/support" className="hover:text-zinc-700">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ScoringFactor({
  name,
  weight,
  description,
  calculation,
  example,
}: {
  name: string;
  weight: string;
  description: string;
  calculation: string[];
  example: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
          {name}
        </h3>
        <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          Weight: {weight}
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      <div className="mt-3">
        <h4 className="text-xs font-medium text-zinc-500">Calculation:</h4>
        <ol className="mt-1 ml-4 list-decimal text-xs text-zinc-500">
          {calculation.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
      <div className="mt-3 rounded bg-zinc-50 p-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        <strong>Example:</strong> {example}
      </div>
    </div>
  );
}

function DiagnosisType({
  name,
  trigger,
  description,
}: {
  name: string;
  trigger: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 rounded border border-zinc-200 p-3 dark:border-zinc-700">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <div>
        <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{name}</h4>
        <p className="text-xs text-zinc-500">
          <strong>Trigger:</strong> {trigger}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>
    </div>
  );
}
