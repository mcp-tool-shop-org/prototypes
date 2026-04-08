# Submitting Tools

We welcome community contributions! The process is automated to make it fast and easy.

## How to Submit

1.  **Open an Issue**: Go to the Issues tab and choose [Submit a Tool](../../issues/new?template=submit-tool.yml).
2.  **Fill the Form**: Provide the ID, name, repo, and tags.
3.  **Wait for Bot**: A bot will automatically:
    - Validate your inputs.
    - Create a Pull Request with your changes.
    - Run the registry validation suite.

## Review Process

1.  **Validation**: If the CI checks fail on your PR (red X), fix the errors in your issue description. The bot will update the PR.
2.  **Approval**: A maintainer will review the metadata (we check for SPAM, malicious links, and accurate descriptions).
3.  **Merge**: Once merged, your tool will appear in the registry, the search index, and the explorer site within minutes.

## Guidelines

- **IDs**: Keep them simple (`my-tool`). No spaces or special chars.
- **Descriptions**: Be clear. "A tool that does X" is better than "My cool project".
- **Tags**: Use existing tags when possible (check `scripts/facets.mjs`).
