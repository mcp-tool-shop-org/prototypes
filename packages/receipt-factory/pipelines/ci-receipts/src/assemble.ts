import { ReceiptBuilder } from "@receipt-factory/core";
import type { Receipt } from "@receipt-factory/core";
import type { GitHubCIEvidence } from "@receipt-factory/adapter-github";

/**
 * Assemble a Receipt from GitHub CI evidence.
 */
export function assemble(evidence: GitHubCIEvidence): Receipt {
  const { run, commit, jobs, artifacts, repository, workflow } = evidence;

  const builder = new ReceiptBuilder("ci_run")
    .subject({
      type: "repository",
      name: repository.full_name,
      ref: commit.sha,
      url: repository.url,
    })
    .intent(
      `${workflow.name} workflow ${run.conclusion ?? run.status} for ${commit.ref} @ ${commit.sha.slice(0, 7)}`,
    )
    .createdAt(run.created_at)
    .inputs({
      trigger: "push",
      workflow_name: workflow.name,
      workflow_path: workflow.path,
      commit_message: commit.message,
      commit_author: commit.author,
      branch: commit.ref,
    });

  // Add outputs from artifacts
  for (const artifact of artifacts) {
    builder.addOutput({
      name: artifact.name,
      size: artifact.size,
      url: artifact.url,
    });
  }

  // Add evidence links
  builder.addEvidence({
    type: "workflow_run",
    url: run.url,
    description: `${workflow.name} run #${run.id}`,
  });

  builder.addEvidence({
    type: "commit",
    url: commit.url,
    description: `Commit ${commit.sha.slice(0, 7)}: ${commit.message.split("\n")[0]}`,
  });

  // Job results as evidence
  for (const job of jobs) {
    const stepsTotal = job.steps.length;
    const stepsPassed = job.steps.filter((s) => s.conclusion === "success").length;
    builder.addEvidence({
      type: "job",
      url: run.url,
      description: `${job.name}: ${job.conclusion ?? job.status} (${stepsPassed}/${stepsTotal} steps)`,
    });
  }

  // Verification
  builder.addStep("Download the receipt JSON file");
  builder.addStep("Run the verify command to check integrity");
  builder.addStep("Follow the evidence links to confirm data matches");
  builder.addCommand(`rf verify receipts/ci/${run.created_at.split("T")[0]}/${run.id}.json`);

  // Environment from first job
  const firstJob = jobs[0];
  builder.environment({
    runner: firstJob?.runner_os ?? "unknown",
    os: firstJob?.runner_os ?? "unknown",
    tool_versions: {},
  });

  // Policy
  builder.policy({
    redacted_fields: [],
    required_checks: jobs.map((j) => j.name),
  });

  // Metadata
  builder.meta("github_run_id", run.id);
  builder.meta("conclusion", run.conclusion);
  builder.meta("jobs_total", jobs.length);
  builder.meta("jobs_passed", jobs.filter((j) => j.conclusion === "success").length);

  return builder.build();
}
