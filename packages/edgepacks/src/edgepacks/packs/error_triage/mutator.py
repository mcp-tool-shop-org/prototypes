"""Mutation rules for error-triage hard negatives."""

# Error confusion pairs — categories that look similar
CONFUSION_PAIRS = [
    ("connection_timeout", "connection_refused"),    # Both network, different causes
    ("authentication_failure", "authorization_denied"),  # 401 vs 403
    ("null_reference", "type_error"),                # Both runtime type issues
    ("disk_full", "out_of_memory"),                  # Both resource exhaustion
    ("file_not_found", "permission_denied"),          # Both filesystem, different causes
    ("dependency_missing", "version_conflict"),       # Both install issues
    ("configuration_error", "file_not_found"),        # Missing config vs wrong config
    ("rate_limit_exceeded", "connection_timeout"),    # Both look like "service not responding"
    ("schema_validation", "invalid_input"),           # Both input quality issues
    ("deadlock", "connection_timeout"),               # Both cause hangs
]

# Severity confusion cases
SEVERITY_CONFUSIONS = [
    # category, looks_like_severity, actual_severity, reason
    ("rate_limit_exceeded", "high", "low", "Feels urgent but auto-resolves with backoff"),
    ("out_of_memory", "medium", "critical", "May seem minor but causes cascading failures"),
    ("authentication_failure", "critical", "high", "Alarming but usually just a config fix"),
    ("null_reference", "low", "medium", "Seems minor but can corrupt user-facing responses"),
]
