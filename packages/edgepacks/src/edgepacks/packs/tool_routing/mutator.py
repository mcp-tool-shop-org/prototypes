"""Mutation rules for tool-routing hard negatives."""

# Tool confusion pairs — tools that are easy to mix up
CONFUSION_PAIRS = [
    ("web_search", "query_database"),       # Both involve "searching" for information
    ("read_file", "http_request"),           # Both retrieve content
    ("write_file", "git_commit"),            # Both persist changes
    ("summarize_text", "extract_entities"),  # Both analyze text
    ("translate_text", "summarize_text"),    # Both transform text
    ("send_email", "create_task"),           # Both involve action items
    ("generate_image", "resize_image"),      # Both involve images
    ("run_command", "git_commit"),           # Both involve CLI operations
    ("analyze_sentiment", "summarize_text"), # Both analyze text content
    ("parse_json", "query_database"),        # Both deal with structured data
]

# Ambiguous request templates that could match multiple tools
AMBIGUOUS_TEMPLATES = [
    "Look up {topic}",                       # web_search vs query_database
    "Get me the {item}",                     # read_file vs http_request vs query_database
    "Send this to {person}",                 # send_email vs create_task
    "Process this {content_type}",           # multiple text tools
    "Show me {data}",                        # read_file vs query_database vs web_search
    "Fix the {item}",                        # write_file vs git_commit vs run_command
    "Check the {item}",                      # web_search vs read_file vs run_command
    "Create a {thing}",                      # write_file vs generate_image vs create_task
    "Convert this {item}",                   # translate_text vs convert_currency
    "Update the {item}",                     # write_file vs query_database vs http_request
]
