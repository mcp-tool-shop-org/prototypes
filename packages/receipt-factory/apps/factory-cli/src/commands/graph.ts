import { readFileSync } from "node:fs";
import { buildIndex } from "@receipt-factory/index";

export interface GraphOptions {
  index?: string;
}

interface GraphNode {
  id: string;
  kind: string;
  subject: string;
  file: string;
}

interface GraphEdge {
  from: string;
  to: string;
  description: string;
}

/**
 * Build a JSON graph of receipt→receipt references from a receipts directory.
 */
export async function handleGraph(
  dir: string = "receipts",
  opts: GraphOptions = {},
): Promise<void> {
  // Build the index to find all receipts
  const index = await buildIndex(dir);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const entry of index.receipts) {
    nodes.push({
      id: entry.id,
      kind: entry.kind,
      subject: entry.subject.name,
      file: entry.file,
    });

    // Read the full receipt to get reference details
    if (entry.references && entry.references.length > 0) {
      const fullPath = `${dir}/${entry.file}`;
      try {
        const raw = readFileSync(fullPath, "utf-8");
        const receipt = JSON.parse(raw) as Record<string, unknown>;
        const refs = receipt.references as Array<{
          hash: string;
          description: string;
        }> | undefined;

        if (refs) {
          for (const ref of refs) {
            edges.push({
              from: entry.id,
              to: ref.hash,
              description: ref.description,
            });
          }
        }
      } catch {
        // If we can't read the full receipt, use just the hashes
        for (const hash of entry.references) {
          edges.push({
            from: entry.id,
            to: hash,
            description: "(description unavailable)",
          });
        }
      }
    }
  }

  const graph = {
    graph_version: "1.0",
    generated_at: new Date().toISOString(),
    nodes,
    edges,
  };

  console.log(JSON.stringify(graph, null, 2));
}
