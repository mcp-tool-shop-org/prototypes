"""Error categories, severity levels, and recommended next steps."""

ERROR_CATEGORIES = [
    "null_reference",
    "type_error",
    "index_out_of_bounds",
    "connection_timeout",
    "connection_refused",
    "dns_resolution",
    "authentication_failure",
    "authorization_denied",
    "rate_limit_exceeded",
    "disk_full",
    "out_of_memory",
    "stack_overflow",
    "deadlock",
    "file_not_found",
    "permission_denied",
    "invalid_input",
    "schema_validation",
    "dependency_missing",
    "version_conflict",
    "configuration_error",
]

SEVERITY_LEVELS = ["critical", "high", "medium", "low"]

NEXT_STEPS = [
    "restart_service",
    "check_credentials",
    "increase_resources",
    "fix_code",
    "update_config",
    "check_network",
    "check_permissions",
    "install_dependency",
    "upgrade_version",
    "retry_with_backoff",
    "escalate_to_oncall",
    "check_disk_space",
    "review_input_data",
    "check_rate_limits",
    "investigate_deadlock",
]

# Mapping: category → typical severity
CATEGORY_SEVERITY = {
    "null_reference": "medium",
    "type_error": "medium",
    "index_out_of_bounds": "medium",
    "connection_timeout": "high",
    "connection_refused": "high",
    "dns_resolution": "high",
    "authentication_failure": "high",
    "authorization_denied": "medium",
    "rate_limit_exceeded": "low",
    "disk_full": "critical",
    "out_of_memory": "critical",
    "stack_overflow": "critical",
    "deadlock": "critical",
    "file_not_found": "low",
    "permission_denied": "medium",
    "invalid_input": "low",
    "schema_validation": "low",
    "dependency_missing": "high",
    "version_conflict": "medium",
    "configuration_error": "medium",
}
