import React from "react";
import { DenseDataGrid } from "@ui/data-grid"; // VIOLATION: banned component
import { FloatingChatBubble } from "@ui/chat-widget"; // VIOLATION: banned component
import { Button } from "@ui/button";

export function Home() {
  return (
    <div className="p-[13px]" style={{ backgroundColor: "#ff5733" }}>
      {/* VIOLATION: raw hex color + raw spacing */}
      <h1 className="text-[#1a1a2e]">
        Your Supercharged Daily Rituals
        {/* VIOLATION: discouraged tone "supercharged" */}
      </h1>
      <p>
        This fully automated AI-powered ritual engine revolutionizes your
        morning routine.
        {/* VIOLATIONS: banned phrase "fully automated", claim "AI-powered",
            discouraged tone "revolutionizes" */}
      </p>

      <Button variant="primary" label="Start Practice">Start</Button>
      <Button variant="primary" label="Create New">New</Button>
      <Button variant="primary" label="View Stats">Stats</Button>
      {/* VIOLATION: 3 primary actions on one screen (budget max 1) */}

      <DenseDataGrid data={[]} columns={[]} />
      {/* VIOLATION: forbidden pattern — dashboard component */}

      <div className="grid-cols-6 gap-2">
        {/* VIOLATION: forbidden grid layout pattern */}
      </div>

      <FloatingChatBubble />
      {/* VIOLATION: forbidden pattern — chat widget */}
    </div>
  );
}
