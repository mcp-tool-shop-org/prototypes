"use client";

import { useState, useEffect, useCallback } from "react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  position: "center" | "bottom-right" | "top-center";
  action?: string; // Optional action button text
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Feature-Reacher",
    description:
      "Surface underutilized features before they become technical debt. This quick tour shows you how to run your first Adoption Risk Audit. This app runs entirely in your browser\u2014no data is sent to a server.",
    position: "center",
    action: "Get Started",
  },
  {
    id: "load-demo",
    title: "Step 1: Load Demo Data",
    description:
      "Click 'Load Demo Data' to add sample release notes and documentation. This shows you what a real audit looks like.",
    target: "[data-tour='demo-loader']",
    position: "bottom-right",
    action: "Next",
  },
  {
    id: "run-audit",
    title: "Step 2: Run the Audit",
    description:
      "Once artifacts are loaded, click 'Run Audit' to analyze them. The engine extracts features, scores visibility, and generates diagnoses.",
    target: "[data-tour='run-audit']",
    position: "bottom-right",
    action: "Next",
  },
  {
    id: "explainability",
    title: "Step 3: Explore Evidence",
    description:
      "Expand any feature card to see cited evidence and recommendations. Every diagnosis is explainable—no black boxes.",
    target: "[data-tour='feature-cards']",
    position: "top-center",
    action: "Next",
  },
  {
    id: "export",
    title: "Step 4: Export Reports",
    description:
      "Share insights with stakeholders using Export options. Generate plain text, HTML, or executive summaries.",
    target: "[data-tour='export-buttons']",
    position: "bottom-right",
    action: "Finish Tour",
  },
];

const TOUR_STORAGE_KEY = "feature-reacher-tour-completed";

interface OnboardingTourProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export function OnboardingTour({ onComplete, forceShow }: OnboardingTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if tour was already completed
    if (forceShow) {
      setTimeout(() => setIsActive(true), 0);
      return;
    }

    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      // Small delay to let the page render
      const timer = setTimeout(() => setIsActive(true), 500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Tour complete
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
      setIsActive(false);
      onComplete?.();
    }
  }, [currentStep, onComplete]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsActive(false);
    onComplete?.();
  }, [onComplete]);

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Tour Card */}
      <div
        className={`fixed z-50 w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-800 ${getPositionClasses(step.position)}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full ${
                  i <= currentStep
                    ? "bg-blue-600"
                    : "bg-zinc-200 dark:bg-zinc-600"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Skip tour
          </button>
        </div>

        {/* Content */}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30">
            <span className="text-sm font-bold">{currentStep + 1}</span>
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {step.title}
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {step.description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="rounded px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {step.action || "Next"}
          </button>
        </div>
      </div>

      {/* Target highlight (if applicable) */}
      {step.target && <TourHighlight selector={step.target} />}
    </>
  );
}

function getPositionClasses(position: TourStep["position"]): string {
  switch (position) {
    case "center":
      return "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";
    case "bottom-right":
      return "right-4 bottom-4 sm:right-8 sm:bottom-8";
    case "top-center":
      return "left-1/2 top-24 -translate-x-1/2";
    default:
      return "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";
  }
}

function TourHighlight({ selector }: { selector: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const element = document.querySelector(selector);
    if (element) {
      setTimeout(() => setRect(element.getBoundingClientRect()), 0);
    }
  }, [selector]);

  if (!rect) return null;

  return (
    <div
      className="pointer-events-none fixed z-40 rounded-lg ring-4 ring-blue-500 ring-offset-4"
      style={{
        left: rect.left - 4,
        top: rect.top - 4,
        width: rect.width + 8,
        height: rect.height + 8,
      }}
    />
  );
}

/**
 * Hook to manually trigger the tour.
 */
export function useOnboardingTour() {
  const [showTour, setShowTour] = useState(false);

  const startTour = useCallback(() => {
    setShowTour(true);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setShowTour(true);
  }, []);

  return { showTour, startTour, resetTour, setShowTour };
}

/**
 * Button to restart the tour from settings or help.
 */
export function RestartTourButton({ onStart }: { onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      className="flex items-center gap-2 rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Start guided tour
    </button>
  );
}
