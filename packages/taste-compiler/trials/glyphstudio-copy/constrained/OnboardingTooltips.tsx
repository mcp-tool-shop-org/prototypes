import { useState, useEffect, useCallback } from "react";
import { useWorkspaceStore } from "@glyphstudio/state";
import "./onboardingTooltips.css";

// ---------------------------------------------------------------------------
// Tooltip sequence — terse, factual, tool-focused
// ---------------------------------------------------------------------------

type TooltipStep = {
  id: string;
  target: string;
  label: string;
  hint: string;
  position: "top" | "bottom" | "left" | "right";
};

const STEPS: TooltipStep[] = [
  {
    id: "tool-rail",
    target: ".tool-rail",
    label: "Tools",
    hint: "Draw, erase, fill, select. Keyboard shortcut on each button.",
    position: "right",
  },
  {
    id: "canvas",
    target: ".canvas-container",
    label: "Canvas",
    hint: "Scroll to zoom. Middle-click to pan. Ctrl+Z to undo.",
    position: "top",
  },
  {
    id: "modes",
    target: ".mode-selector",
    label: "Modes",
    hint: "Edit, Animate, Palette, Export. Panels change per mode.",
    position: "bottom",
  },
  {
    id: "right-dock",
    target: ".right-dock",
    label: "Panels",
    hint: "Layers, library, slices. Tabs change with the active mode.",
    position: "left",
  },
  {
    id: "timeline",
    target: ".bottom-dock",
    label: "Timeline",
    hint: "Frame strip, playback controls, onion skin. Switch to Animate mode.",
    position: "top",
  },
];

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = "glyphstudio-onboarding-v1";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OnboardingTooltips() {
  const mode = useWorkspaceStore((s) => s.activeMode);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY) && mode === "edit") {
      setVisible(true);
    }
  }, [mode]);

  useEffect(() => {
    if (!visible) return;
    const el = document.querySelector(STEPS[step].target);
    if (el) setAnchor(el.getBoundingClientRect());
  }, [visible, step]);

  const advance = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }, [step]);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "done");
    setVisible(false);
  }, []);

  if (!visible || !anchor) return null;

  const current = STEPS[step];

  return (
    <>
      <div className="onboarding-scrim" onClick={dismiss} />

      <div
        className="onboarding-tip"
        data-position={current.position}
        style={{
          top: anchor.bottom + 8,
          left: anchor.left + anchor.width / 2,
          transform: "translateX(-50%)",
        }}
      >
        <div className="onboarding-label">{current.label}</div>
        <div className="onboarding-hint">{current.hint}</div>

        <div className="onboarding-footer">
          <span className="onboarding-step">
            {step + 1}/{STEPS.length}
          </span>
          <div className="onboarding-actions">
            <button className="onboarding-skip" onClick={dismiss}>
              Skip
            </button>
            <button className="onboarding-next" onClick={advance}>
              {step === STEPS.length - 1 ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
