"""Mutation rules for structured-extraction hard negatives."""

# Text mutations that make extraction harder
MUTATION_STRATEGIES = [
    "missing_fields",      # Text mentions a field type but value is absent
    "ambiguous_values",    # Values could map to multiple fields
    "noise_injection",     # Add irrelevant text that looks extractable
    "format_variation",    # Same info in unusual formats (dates, phones, etc.)
    "conflicting_info",    # Two different values for the same field
]

# Field confusion pairs — fields that are easy to mix up
FIELD_CONFUSIONS = {
    "contact": [
        ("name", "company"),      # "Working with Apple" — person or company?
        ("email", "role"),         # truncated emails look like role descriptions
        ("phone", "company"),     # numbers in company names
    ],
    "event": [
        ("title", "location"),    # "Meet at Riverside" — name or place?
        ("organizer", "attendees"),  # Who's running it vs who's invited
        ("date", "time"),         # Ambiguous time references
    ],
    "config": [
        ("key", "value"),         # When key names look like values
        ("section", "key"),       # Nested config confusion
    ],
}
