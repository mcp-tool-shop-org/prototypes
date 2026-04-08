import { useState, useEffect, useCallback } from "react";
import { useWorkspaceStore } from "@glyphstudio/state";
import "./onboardingTooltips.css";

// ---------------------------------------------------------------------------
// Tooltip sequence definition
// ---------------------------------------------------------------------------

type TooltipStep = {
  id: string;
  target: string; // CSS selector for the anchor element
  title: string;
  body: string;
  position: "top" | "bottom" | "left" | "right";
  highlight?: boolean;
};

const ONBOARDING_STEPS: TooltipStep[] = [
  {
    id: "welcome",
    target: ".topbar",
    title: "Welcome to GlyphStudio! 🎨",
    body: "I'm excited to help you get started with pixel art! Let me walk you through the main features so you can start creating amazing sprites in no time.",
    position: "bottom",
    highlight: true,
  },
  {
    id: "tool-rail",
    target: ".tool-rail",
    title: "Your Creative Toolkit 🖌️",
    body: "Here's where the magic happens! You'll find all your drawing tools here — pencil, eraser, fill bucket, shapes, and more. I've organized them so the most popular tools are right at your fingertips. Try clicking one to get started!",
    position: "right",
    highlight: true,
  },
  {
    id: "canvas",
    target: ".canvas-container",
    title: "The Canvas — Your Creative Playground 🖼️",
    body: "This is where your art comes to life! You can zoom in and out with the scroll wheel, and pan around by holding the middle mouse button. Don't worry about making mistakes — you can always undo with Ctrl+Z!",
    position: "top",
  },
  {
    id: "modes",
    target: ".mode-selector",
    title: "Powerful Workspace Modes ⚡",
    body: "GlyphStudio is more than just a pixel editor! We've packed in 10 specialized modes including animation, palette management, AI assistance, and export tools. Each mode is carefully designed to help you work faster and smarter.",
    position: "bottom",
    highlight: true,
  },
  {
    id: "right-dock",
    target: ".right-dock",
    title: "Smart Panels That Adapt to You 📋",
    body: "The right panel automatically shows you the most relevant tools for your current mode. As you explore different modes, you'll discover a rich ecosystem of panels designed to streamline every aspect of your workflow.",
    position: "left",
  },
  {
    id: "timeline",
    target: ".bottom-dock",
    title: "Bring Your Sprites to Life! ✨",
    body: "Ready for animation? The timeline at the bottom lets you create frame-by-frame animations with professional features like onion skinning, ping-pong playback, and customizable FPS. It's everything you need to make your characters move!",
    position: "top",
    highlight: true,
  },
  {
    id: "save",
    target: ".save-controls",
    title: "Never Lose Your Work 💾",
    body: "GlyphStudio auto-saves your progress every 30 seconds, and you can always save manually with Ctrl+S. We've got your back! Your creative flow should never be interrupted by worrying about losing work.",
    position: "bottom",
  },
  {
    id: "finish",
    target: ".topbar",
    title: "You're All Set! 🚀",
    body: "You're ready to start creating! Remember, you can always press '?' to see keyboard shortcuts, and we're constantly adding new features to make your creative experience even better. Have fun and happy creating!",
    position: "bottom",
  },
];

// ---------------------------------------------------------------------------
// Local storage key
// ---------------------------------------------------------------------------

const STORAGE_KEY = "glyphstudio-onboarding-complete";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OnboardingTooltips() {
  const mode = useWorkspaceStore((s) => s.activeMode);
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);

  // Only show on first visit
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed && mode === "edit") {
      setVisible(true);
    }
  }, [mode]);

  // Position tooltip near target element
  useEffect(() => {
    if (!visible) return;
    const step = ONBOARDING_STEPS[currentStep];
    const el = document.querySelector(step.target);
    if (el) {
      setTooltipRect(el.getBoundingClientRect());
    }
  }, [visible, currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const handleComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }, []);

  const handleSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }, []);

  if (!visible || !tooltipRect) return null;

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <>
      {/* Overlay backdrop with spotlight cutout */}
      <div className="onboarding-overlay" onClick={handleSkip} />

      {/* Tooltip */}
      <div
        className="onboarding-tooltip"
        style={{
          top: tooltipRect.bottom + 12,
          left: tooltipRect.left + tooltipRect.width / 2,
          transform: "translateX(-50%)",
        }}
      >
        {/* Arrow */}
        <div className="onboarding-arrow" />

        {/* Content */}
        <h3 className="onboarding-title">{step.title}</h3>
        <p className="onboarding-body">{step.body}</p>

        {/* Progress bar */}
        <div className="onboarding-progress">
          <div
            className="onboarding-progress-fill"
            style={{
              width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%`,
            }}
          />
        </div>

        {/* Navigation */}
        <div className="onboarding-nav">
          <span className="onboarding-counter">
            {currentStep + 1} of {ONBOARDING_STEPS.length}
          </span>
          <div className="onboarding-buttons">
            {currentStep > 0 && (
              <button className="onboarding-btn-back" onClick={handlePrev}>
                ← Back
              </button>
            )}
            <button className="onboarding-btn-skip" onClick={handleSkip}>
              Skip Tour
            </button>
            <button className="onboarding-btn-next" onClick={handleNext}>
              {currentStep === ONBOARDING_STEPS.length - 1
                ? "🎉 Let's Go!"
                : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
