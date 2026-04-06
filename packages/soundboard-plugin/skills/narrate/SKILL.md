---
name: narrate
description: Narrate a code walkthrough aloud with natural pacing. Use when explaining code, walking through a file, doing a code review out loud, or when the user wants to hear how code works.
argument-hint: [file path or code topic]
---

# Code Narration

Read and narrate the code at `$ARGUMENTS` as a spoken walkthrough.

## Process

1. **Read the code** — use the Read tool to get the file contents
2. **Analyse the structure** — identify functions, classes, key logic blocks
3. **Write a narration script** that explains the code naturally, as a spoken
   walkthrough. Include:
   - Opening summary of what the file/module does
   - Walk through each major section
   - Explain non-obvious logic or design decisions
   - Note any patterns, potential issues, or clever techniques
4. **Synthesise speech** — call the `voice.narrate` MCP tool with the script

## Narration Style

- Use plain language, not raw variable names
- Say "this function takes a list and returns the filtered results" not
  "def filter underscore items takes items colon list"
- Pronounce acronyms properly: "API" as "A P I", "URL" as "U R L",
  "SQL" as "sequel", "HTTP" as "H T T P"
- Keep each section under 30 seconds of speech
- Let the adaptive pacer handle pauses between sections

## Output

After narrating, provide a brief text summary of what was covered and how
long the narration took.
