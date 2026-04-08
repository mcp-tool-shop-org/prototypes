# registry-sync — Questions

## Answered during lockdown

### Q1: Can this system report "success" when a mutation didn't complete?

**Answer:** No, at the per-action level. Each action gets `success: true/false`. The system cannot report a failed mutation as succeeded. However, multi-step mutations (createWorkflowPR) report the whole operation as failed without surfacing which sub-steps completed. See TC-1.

### Q2: Can apply create duplicate remote state?

**Answer:** Yes. Issue creation has no idempotency checks. Running apply twice creates duplicate issues. The system honestly reports both as "succeeded" — it doesn't hide the duplication, but it doesn't prevent it either. See TC-2.

### Q3: Does the 422 retry in createIssue make correct assumptions?

**Answer:** Partially. The retry assumes 422 means "label doesn't exist" and retries without labels. But 422 means "Validation Failed" generically. Non-label 422s will trigger a wasted retry. The code is defensive (retry then fail), not permissive (retry then falsely succeed). See TC-3.

### Q4: Can the caller distinguish auth failure from other failures?

**Answer:** At the exit-code level: yes (AUTH_MISSING → exit 1, APPLY_FAILED → exit 2). At the error-code level during apply: no. Expired/invalid token during mutation gets the same APPLY_FAILED code as network or permission failures. See TC-4.
