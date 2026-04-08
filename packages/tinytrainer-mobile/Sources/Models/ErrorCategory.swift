import Foundation

/// Display metadata for error-triage categories.
/// Mirrors categories.py from edgepacks error_triage pack.
struct ErrorCategory {
    let name: String
    let severity: String
    let nextStep: String

    /// All 20 error categories with severity and recommended next step
    static let all: [String: ErrorCategory] = [
        "null_reference": ErrorCategory(name: "null_reference", severity: "medium", nextStep: "fix_code"),
        "type_error": ErrorCategory(name: "type_error", severity: "medium", nextStep: "fix_code"),
        "index_out_of_bounds": ErrorCategory(name: "index_out_of_bounds", severity: "medium", nextStep: "fix_code"),
        "connection_timeout": ErrorCategory(name: "connection_timeout", severity: "high", nextStep: "check_network"),
        "connection_refused": ErrorCategory(name: "connection_refused", severity: "high", nextStep: "check_network"),
        "dns_resolution": ErrorCategory(name: "dns_resolution", severity: "high", nextStep: "check_network"),
        "authentication_failure": ErrorCategory(name: "authentication_failure", severity: "high", nextStep: "check_credentials"),
        "authorization_denied": ErrorCategory(name: "authorization_denied", severity: "medium", nextStep: "check_permissions"),
        "rate_limit_exceeded": ErrorCategory(name: "rate_limit_exceeded", severity: "low", nextStep: "retry_with_backoff"),
        "disk_full": ErrorCategory(name: "disk_full", severity: "critical", nextStep: "check_disk_space"),
        "out_of_memory": ErrorCategory(name: "out_of_memory", severity: "critical", nextStep: "increase_resources"),
        "stack_overflow": ErrorCategory(name: "stack_overflow", severity: "critical", nextStep: "fix_code"),
        "deadlock": ErrorCategory(name: "deadlock", severity: "critical", nextStep: "investigate_deadlock"),
        "file_not_found": ErrorCategory(name: "file_not_found", severity: "low", nextStep: "update_config"),
        "permission_denied": ErrorCategory(name: "permission_denied", severity: "medium", nextStep: "check_permissions"),
        "invalid_input": ErrorCategory(name: "invalid_input", severity: "low", nextStep: "review_input_data"),
        "schema_validation": ErrorCategory(name: "schema_validation", severity: "low", nextStep: "review_input_data"),
        "dependency_missing": ErrorCategory(name: "dependency_missing", severity: "high", nextStep: "install_dependency"),
        "version_conflict": ErrorCategory(name: "version_conflict", severity: "medium", nextStep: "upgrade_version"),
        "configuration_error": ErrorCategory(name: "configuration_error", severity: "medium", nextStep: "update_config"),
    ]

    static func lookup(_ label: String) -> ErrorCategory {
        all[label] ?? ErrorCategory(name: label, severity: "unknown", nextStep: "investigate")
    }

    var severityColor: String {
        switch severity {
        case "critical": return "red"
        case "high": return "orange"
        case "medium": return "yellow"
        case "low": return "green"
        default: return "gray"
        }
    }
}
