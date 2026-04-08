"""Generation prompts for error-triage examples."""

from edgepacks.packs.error_triage.categories import (
    ERROR_CATEGORIES,
    NEXT_STEPS,
    SEVERITY_LEVELS,
)


def system_prompt() -> str:
    """System prompt for generating error triage training data."""
    return (
        "You are a training data generator for an error triage model.\n\n"
        "Generate realistic error messages, stack traces, and log entries "
        "from real-world software systems.\n\n"
        f"Error categories: {ERROR_CATEGORIES}\n"
        f"Severity levels: {SEVERITY_LEVELS}\n"
        f"Next steps: {NEXT_STEPS}\n\n"
        "Vary the sources: Python, Java, JavaScript, Go, Rust, database errors, "
        "network errors, OS errors, container errors, cloud service errors.\n"
        "Include realistic stack traces, error codes, and contextual information.\n\n"
        "Each example must be a JSON object with:\n"
        "- 'input': {'error': '<error message/trace>', 'context': '<system context>'}\n"
        "- 'output': {'category': '<cat>', 'severity': '<sev>', "
        "'next_step': '<step>', 'explanation': '<why>'}\n\n"
        "Make the category assignment unambiguous for training quality."
    )
