---
title: Grading System
description: How Tool-Scan scores and grades MCP tools.
sidebar:
  order: 3
---

Tool-Scan assigns every tool a numeric score (0–100) and a letter grade (A+ to F) based on three weighted components.

## Score breakdown

| Component | Weight | What it measures |
|-----------|--------|------------------|
| Security | 40% | No vulnerabilities found |
| Compliance | 35% | MCP 2025-11-25 spec adherence |
| Quality | 25% | Best practices and documentation |

Security is weighted highest because a vulnerable tool is dangerous regardless of how well-documented it is.

## Grade scale

| Grade | Score | Recommendation |
|-------|-------|----------------|
| A+ | 97–100 | Production ready |
| A | 93–96 | Excellent |
| A- | 90–92 | Very good |
| B+ | 87–89 | Good |
| B | 83–86 | Good |
| B- | 80–82 | Above average |
| C+ | 77–79 | Satisfactory |
| C | 73–76 | Satisfactory |
| C- | 70–72 | Below average |
| D+ | 67–69 | Poor |
| D | 63–66 | Poor |
| D- | 60–62 | Barely passing |
| F | 0–59 | Do not use |

## MCP compliance

Tool-Scan validates against the [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25):

- Required fields present (`name`, `description`, `inputSchema`)
- Valid name format (alphanumeric, underscore, hyphen)
- Root schema type is `object`
- Required properties exist in schema
- Annotation types are correct (`readOnlyHint`, `destructiveHint`, etc.)

## Remarks

Every deduction comes with an actionable remark. The `GradeReport.remarks` list tells you exactly what was found, the severity, and what to fix. Use `--json` output for machine-readable access to all remarks.
