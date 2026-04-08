"""PackSpec for the tool-routing dataset pack."""

from edgepacks.packs._base import BasePack
from edgepacks.packs.tool_routing.tools import TOOL_NAMES, TOOLS
from edgepacks.schema.eval_protocol import EvalMetric, EvalProtocol
from edgepacks.schema.example import Example
from edgepacks.schema.pack import GenerationMode, PackSpec, QualityCheck


def _seed_examples() -> list[Example]:
    """Hand-crafted seed examples for each tool."""
    return [
        Example(
            input={"request": "Find recent articles about quantum computing breakthroughs"},
            output={"tool": "web_search", "args": {"query": "quantum computing breakthroughs 2026"}},
        ),
        Example(
            input={"request": "Show me what's in the config.yaml file"},
            output={"tool": "read_file", "args": {"path": "config.yaml"}},
        ),
        Example(
            input={"request": "Save this text to output.txt: Hello World"},
            output={"tool": "write_file", "args": {"path": "output.txt", "content": "Hello World"}},
        ),
        Example(
            input={"request": "List all running Docker containers"},
            output={"tool": "run_command", "args": {"command": "docker ps"}},
        ),
        Example(
            input={"request": "Email john@example.com about the meeting tomorrow"},
            output={
                "tool": "send_email",
                "args": {
                    "to": "john@example.com",
                    "subject": "Meeting Tomorrow",
                    "body": "Hi John, just a reminder about our meeting tomorrow.",
                },
            },
        ),
        Example(
            input={"request": "Schedule a team standup for Monday at 9am"},
            output={
                "tool": "create_calendar_event",
                "args": {"title": "Team Standup", "start": "2026-03-30T09:00:00"},
            },
        ),
        Example(
            input={"request": "Get all users from the prod database who signed up this month"},
            output={
                "tool": "query_database",
                "args": {
                    "query": "SELECT * FROM users WHERE created_at >= DATE_TRUNC('month', NOW())",
                    "database": "prod",
                },
            },
        ),
        Example(
            input={"request": "Translate 'hello world' to Japanese"},
            output={
                "tool": "translate_text",
                "args": {"text": "hello world", "target_lang": "ja"},
            },
        ),
        Example(
            input={"request": "Give me a quick summary of this 10-page report"},
            output={
                "tool": "summarize_text",
                "args": {"text": "[report content]", "max_length": 200},
            },
        ),
        Example(
            input={"request": "What companies and people are mentioned in this press release?"},
            output={
                "tool": "extract_entities",
                "args": {
                    "text": "[press release content]",
                    "entity_types": ["person", "organization"],
                },
            },
        ),
        Example(
            input={"request": "Create a picture of a sunset over mountains"},
            output={
                "tool": "generate_image",
                "args": {"prompt": "sunset over mountains, photorealistic"},
            },
        ),
        Example(
            input={"request": "Is this customer review positive or negative?"},
            output={"tool": "analyze_sentiment", "args": {"text": "[review content]"}},
        ),
        Example(
            input={"request": "How much is 100 USD in euros?"},
            output={
                "tool": "convert_currency",
                "args": {"amount": 100, "from_currency": "USD", "to_currency": "EUR"},
            },
        ),
        Example(
            input={"request": "What's the weather like in Tokyo right now?"},
            output={"tool": "get_weather", "args": {"location": "Tokyo", "units": "celsius"}},
        ),
        Example(
            input={"request": "Create a high-priority bug ticket for the login issue"},
            output={
                "tool": "create_task",
                "args": {
                    "title": "Login issue - users cannot authenticate",
                    "priority": "high",
                },
            },
        ),
        Example(
            input={"request": "Commit the changes with message 'fix: resolve auth bug'"},
            output={
                "tool": "git_commit",
                "args": {"message": "fix: resolve auth bug"},
            },
        ),
        Example(
            input={"request": "Call the GitHub API to get my repositories"},
            output={
                "tool": "http_request",
                "args": {"url": "https://api.github.com/user/repos", "method": "GET"},
            },
        ),
        Example(
            input={"request": "Parse this JSON string and check if it's valid"},
            output={"tool": "parse_json", "args": {"text": "[json string]"}},
        ),
        Example(
            input={"request": "Zip up all the log files into an archive"},
            output={
                "tool": "compress_files",
                "args": {"files": ["*.log"], "output": "logs.zip", "format": "zip"},
            },
        ),
        Example(
            input={"request": "Resize the banner image to 1200x630"},
            output={
                "tool": "resize_image",
                "args": {"input_path": "banner.png", "width": 1200, "height": 630},
            },
        ),
    ]


class ToolRoutingPack(BasePack):
    """Dataset pack for training tool-routing models."""

    def spec(self) -> PackSpec:
        return PackSpec(
            name="tool-routing",
            version="0.1.0",
            description=(
                "Route natural language requests to the correct tool with proper arguments. "
                "20 tools covering search, file ops, communication, data, media, and dev tasks."
            ),
            task_type="classification",
            input_schema={
                "type": "object",
                "properties": {"request": {"type": "string"}},
                "required": ["request"],
            },
            output_schema={
                "type": "object",
                "properties": {
                    "tool": {"type": "string", "enum": TOOL_NAMES},
                    "args": {"type": "object"},
                },
                "required": ["tool", "args"],
            },
            instruction_template=(
                "You are a tool router. Given a user request, select the correct tool "
                "and provide the appropriate arguments.\n\n"
                "Available tools:\n"
                + "\n".join(f"- {t['name']}: {t['description']}" for t in TOOLS)
                + "\n\nUser request: {request}\n\n"
                "Respond with JSON containing 'tool' (tool name) and 'args' (arguments object)."
            ),
            label_space=TOOL_NAMES,
            generation_mode=GenerationMode.HYBRID,
            generation_config={
                "ollama_model": "qwen2.5:7b",
                "temperature": 0.8,
            },
            quality_checks=[
                QualityCheck.SCHEMA_VALID,
                QualityCheck.INPUT_NONEMPTY,
                QualityCheck.OUTPUT_NONEMPTY,
                QualityCheck.LABEL_IN_SPACE,
            ],
            eval_protocol=EvalProtocol(
                metrics=[
                    EvalMetric(
                        name="tool_accuracy",
                        weight=1.0,
                        threshold=0.85,
                        description="Exact match on tool name",
                    ),
                    EvalMetric(
                        name="args_f1",
                        weight=0.5,
                        threshold=0.70,
                        description="F1 score on argument keys present",
                    ),
                ],
                min_eval_samples=100,
                stratify_by="tool",
                description="Tool selection accuracy + argument completeness",
            ),
            examples=_seed_examples(),
            recommended_model_classes=[
                "Qwen2.5-1.5B",
                "Phi-3-mini-4k",
                "Llama-3.2-1B",
                "Gemma-2-2B",
            ],
            tags=["routing", "classification", "tool-use", "agents"],
            min_examples=500,
            target_examples=2000,
        )

    def evaluate(self, predicted: dict, expected: dict) -> float:
        """Score: 1.0 for exact tool match, 0.5 partial credit for args."""
        score = 0.0
        if predicted.get("tool") == expected.get("tool"):
            score += 0.7
            # Check args overlap
            pred_args = set(predicted.get("args", {}).keys())
            exp_args = set(expected.get("args", {}).keys())
            if exp_args:
                overlap = len(pred_args & exp_args) / len(exp_args)
                score += 0.3 * overlap
        return score
