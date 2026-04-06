import { ReceiptBuilder } from "@receipt-factory/core";
import type { Receipt } from "@receipt-factory/core";
import type { GitHubReleaseEvidence } from "@receipt-factory/adapter-github";

/**
 * Assemble a Receipt from GitHub release evidence.
 */
export function assemble(evidence: GitHubReleaseEvidence): Receipt {
  const { release, assets, commit, repository } = evidence;

  const builder = new ReceiptBuilder("release")
    .subject({
      type: "repository",
      name: repository.full_name,
      ref: release.tag_name,
      url: repository.url,
    })
    .intent(
      `Published ${release.tag_name} of ${repository.full_name}`,
    )
    .createdAt(release.published_at || release.created_at)
    .inputs({
      tag: release.tag_name,
      release_name: release.name,
      prerelease: release.prerelease,
      draft: release.draft,
      author: release.author,
      commit_sha: commit.sha,
    });

  // Add assets as outputs
  for (const asset of assets) {
    builder.addOutput({
      name: asset.name,
      size: asset.size,
      url: asset.download_url,
    });
  }

  // Evidence links
  builder.addEvidence({
    type: "release",
    url: release.html_url,
    description: `GitHub release: ${release.name || release.tag_name}`,
  });

  builder.addEvidence({
    type: "tag",
    url: `${repository.url}/releases/tag/${release.tag_name}`,
    description: `Tag ${release.tag_name}`,
  });

  builder.addEvidence({
    type: "commit",
    url: commit.url,
    description: `Source commit ${commit.sha.slice(0, 7)}`,
  });

  // Verification
  builder.addStep("Download the receipt JSON file");
  builder.addStep("Run rf verify to check integrity");
  builder.addStep("Compare release assets with the outputs listed");
  builder.addStep("Verify the tag exists on the repository");
  builder.addCommand(
    `rf verify receipts/release/${(release.published_at || release.created_at).split("T")[0]}/${release.tag_name}.json`,
  );
  builder.addCommand(`gh release view ${release.tag_name} --repo ${repository.full_name}`);

  // Environment (releases don't have runner info)
  builder.environment({
    tool_versions: {},
  });

  // Policy
  builder.policy({
    redacted_fields: [],
    required_checks: ["schema", "hash"],
  });

  // What this receipt does NOT prove
  builder.meta("factory_version", "1.7.2");
  builder.meta("pipeline", "release-receipts");
  builder.meta("assets_count", assets.length);
  if (release.body) {
    // Store first 200 chars of release body as context
    builder.meta(
      "changelog_excerpt",
      release.body.length > 200
        ? release.body.slice(0, 200) + "..."
        : release.body,
    );
  }

  return builder.build();
}
