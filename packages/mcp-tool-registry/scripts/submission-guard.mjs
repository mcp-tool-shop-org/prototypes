// scripts/submission-guard.mjs
import { execSync } from "child_process"
import fs from "fs"
import path from "path"

const author = process.env.ISSUE_AUTHOR
const issueNumber = process.env.ISSUE_NUMBER

if (!author || !issueNumber) {
  console.error("Error: ISSUE_AUTHOR and ISSUE_NUMBER env vars required.")
  process.exit(1)
}

function runGh(command) {
  try {
    return execSync(`gh ${command}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim()
  } catch (error) {
    if (error.stderr) console.error(error.stderr)
    throw error
  }
}

console.log(`🔍 Checking for active submissions by @${author}...`)

try {
  // 1. Check for other open issues with label 'tool-submission'
  const issuesJson = runGh(
    `issue list --author "${author}" --label "tool-submission" --state open --json number --limit 100`
  )
  const activeIssues = JSON.parse(issuesJson).filter(
    i => i.number !== parseInt(issueNumber, 10)
  )

  // 2. Check for open PRs with label 'tool-submission'
  const prsJson = runGh(
    `pr list --author "${author}" --label "tool-submission" --state open --json number --limit 100`
  )
  const activePrs = JSON.parse(prsJson)

  const totalActive = activeIssues.length + activePrs.length

  if (totalActive > 0) {
    console.error(`❌ User @${author} has ${totalActive} active submissions.`)

    const message = `
Hello @${author}! 👋

Thanks for your interest in contributing to the MCP Tool Registry. To ensure fair review times for everyone, we limit each contributor to **one active submission at a time**.

Please resolve or close your existing submissions before opening a new one:

${activeIssues.map(i => `- Issue #${i.number}`).join("\n")}
${activePrs.map(p => `- PR #${p.number}`).join("\n")}

This issue will be closed automatically. Please reopen it once your other submissions are merged or closed.
`

    const tempFile = "submission_comment.md"
    fs.writeFileSync(tempFile, message)

    try {
      // Post comment
      runGh(`issue comment ${issueNumber} --body-file ${tempFile}`)
      // Close issue
      runGh(`issue close ${issueNumber} --reason "not planned"`)
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile)
    }

    process.exit(1) // Fail the workflow to stop processing
  }

  console.log("✅ No conflicting submissions found used.")
} catch (error) {
  console.error("An error occurred during verification:", error.message)
  process.exit(1)
}
