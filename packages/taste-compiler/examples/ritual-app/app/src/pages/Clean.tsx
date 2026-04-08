import React from "react";
import { Button } from "@ui/button";

// This file is CLEAN — no violations
export function Clean() {
  return (
    <div className="p-4">
      <h1>Your Practice</h1>
      <p>Take a moment to be present with your ritual.</p>
      <Button variant="primary">Begin</Button>
    </div>
  );
}
