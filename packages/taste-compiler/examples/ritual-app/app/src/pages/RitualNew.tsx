import React from "react";
import { Button } from "@ui/button";
import { Form } from "@ui/form";

export function RitualNew() {
  return (
    <div className="p-4">
      <h1>Create a New Ritual</h1>
      <p>
        Design your blazing fast morning routine with our autonomous ritual
        builder.
        {/* VIOLATIONS: discouraged tone "blazing fast", banned phrase "autonomous" */}
      </p>

      <Form>
        <input placeholder="Ritual name" />
        <textarea placeholder="Description" />
      </Form>

      <Button variant="primary">Save Ritual</Button>
      <Button variant="primary">Save as Draft</Button>
      {/* VIOLATION: 2 primary actions (max 1) */}
    </div>
  );
}
