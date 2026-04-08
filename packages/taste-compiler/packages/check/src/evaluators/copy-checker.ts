import type { TastePack, TasteViolation } from "@taste-compiler/core";

export interface ExtractedCopy {
  file: string;
  line: number;
  text: string;
  snippet: string;
}

/**
 * Check copy rules violations.
 */
export function checkCopyViolations(
  pack: TastePack,
  copyBlocks: ExtractedCopy[]
): TasteViolation[] {
  const violations: TasteViolation[] = [];
  const rules = pack.artifacts.copyRules;

  for (const block of copyBlocks) {
    const lower = block.text.toLowerCase();

    // Banned phrases
    for (const bp of rules.bannedPhrases) {
      if (lower.includes(bp.phrase.toLowerCase())) {
        violations.push({
          id: `copy-ban-${block.file}-${block.line}`,
          severity: "error",
          class: "copy-rule",
          ruleId: "COPY-001",
          message: `Banned phrase "${bp.phrase}" used`,
          rationale: bp.reason || "This phrase violates copy rules",
          evidence: [
            {
              file: block.file,
              line: block.line,
              snippet: block.snippet,
              value: bp.phrase,
            },
          ],
          suggestedFix: `Remove or rephrase: "${bp.phrase}"`,
        });
      }
    }

    // Discouraged tone words
    for (const word of rules.toneWords.discouraged) {
      if (lower.includes(word.toLowerCase())) {
        violations.push({
          id: `copy-tone-${block.file}-${block.line}-${word}`,
          severity: "warn",
          class: "copy-rule",
          ruleId: "COPY-002",
          message: `Discouraged tone word "${word}" detected`,
          rationale: "This word conflicts with the product's intended voice",
          evidence: [
            {
              file: block.file,
              line: block.line,
              snippet: block.snippet,
              value: word,
            },
          ],
          suggestedFix: `Consider a more aligned alternative`,
        });
      }
    }

    // Claim qualifiers
    for (const cq of rules.claimQualifiers) {
      if (lower.includes(cq.pattern.toLowerCase())) {
        // Check if the qualifier is already present
        if (!lower.includes(cq.qualifier.toLowerCase())) {
          violations.push({
            id: `copy-claim-${block.file}-${block.line}`,
            severity: "error",
            class: "copy-rule",
            ruleId: "COPY-004",
            message: `Unqualified claim: "${cq.pattern}" should be "${cq.qualifier}"`,
            rationale:
              "Claims about AI capabilities need qualifying language for trust",
            evidence: [
              {
                file: block.file,
                line: block.line,
                snippet: block.snippet,
                value: cq.pattern,
              },
            ],
            suggestedFix: `Replace "${cq.pattern}" with "${cq.qualifier}"`,
          });
        }
      }
    }
  }

  return violations;
}
