"""PackSpec for the error-triage dataset pack."""

from edgepacks.packs._base import BasePack
from edgepacks.packs.error_triage.categories import (
    ERROR_CATEGORIES,
    NEXT_STEPS,
    SEVERITY_LEVELS,
)
from edgepacks.schema.eval_protocol import EvalMetric, EvalProtocol
from edgepacks.schema.example import Example
from edgepacks.schema.pack import GenerationMode, PackSpec, QualityCheck


def _seed_examples() -> list[Example]:
    """Hand-crafted seed examples for error triage."""
    return [
        Example(
            input={
                "error": "TypeError: Cannot read properties of null (reading 'map')\n    at renderItems (App.jsx:42)\n    at Component.render (App.jsx:78)",
                "context": "React frontend, production build",
            },
            output={
                "category": "null_reference",
                "severity": "medium",
                "next_step": "fix_code",
                "explanation": "Attempting to call .map() on a null value in React render. Likely an API response that returned null instead of an array.",
            },
        ),
        Example(
            input={
                "error": "psycopg2.OperationalError: connection to server at '10.0.1.5', port 5432 failed: Connection timed out\n\tIs the server running on that host and accepting TCP/IP connections?",
                "context": "Python backend service, database connection",
            },
            output={
                "category": "connection_timeout",
                "severity": "high",
                "next_step": "check_network",
                "explanation": "Database connection timeout. Server may be down, network issue, or firewall blocking port 5432.",
            },
        ),
        Example(
            input={
                "error": "java.lang.OutOfMemoryError: Java heap space\n\tat java.util.Arrays.copyOf(Arrays.java:3236)\n\tat java.util.ArrayList.grow(ArrayList.java:265)",
                "context": "Java microservice processing batch job",
            },
            output={
                "category": "out_of_memory",
                "severity": "critical",
                "next_step": "increase_resources",
                "explanation": "JVM heap exhausted during ArrayList growth. Batch job likely loading too much data into memory. Increase heap or implement streaming.",
            },
        ),
        Example(
            input={
                "error": "ENOSPC: no space left on device, write '/var/log/app/output.log'",
                "context": "Node.js service on Linux container",
            },
            output={
                "category": "disk_full",
                "severity": "critical",
                "next_step": "check_disk_space",
                "explanation": "Disk is full. Log files likely consuming all space. Clean up old logs and add log rotation.",
            },
        ),
        Example(
            input={
                "error": "requests.exceptions.HTTPError: 401 Client Error: Unauthorized for url: https://api.stripe.com/v1/charges",
                "context": "Python payment service",
            },
            output={
                "category": "authentication_failure",
                "severity": "high",
                "next_step": "check_credentials",
                "explanation": "Stripe API returning 401. API key is invalid, expired, or using test key against live endpoint.",
            },
        ),
        Example(
            input={
                "error": "ModuleNotFoundError: No module named 'pandas'\n\nDuring handling of the above exception, another exception occurred:\n\nImportError: Install pandas with: pip install pandas",
                "context": "Python data pipeline, fresh deployment",
            },
            output={
                "category": "dependency_missing",
                "severity": "high",
                "next_step": "install_dependency",
                "explanation": "pandas not installed in the deployment environment. requirements.txt or Dockerfile likely missing this dependency.",
            },
        ),
        Example(
            input={
                "error": "HTTP 429 Too Many Requests\nRetry-After: 60\nX-RateLimit-Remaining: 0",
                "context": "API client hitting third-party service",
            },
            output={
                "category": "rate_limit_exceeded",
                "severity": "low",
                "next_step": "retry_with_backoff",
                "explanation": "Rate limit hit. Implement exponential backoff with Retry-After header. Consider request batching.",
            },
        ),
        Example(
            input={
                "error": "FileNotFoundError: [Errno 2] No such file or directory: '/app/config/settings.yaml'",
                "context": "Python service startup",
            },
            output={
                "category": "file_not_found",
                "severity": "low",
                "next_step": "update_config",
                "explanation": "Config file missing at expected path. File not included in deployment or path environment variable not set.",
            },
        ),
        Example(
            input={
                "error": "ValidationError: 3 validation errors for UserCreate\nname\n  field required\nemail\n  value is not a valid email address\nage\n  ensure this value is greater than 0",
                "context": "FastAPI endpoint, user registration",
            },
            output={
                "category": "schema_validation",
                "severity": "low",
                "next_step": "review_input_data",
                "explanation": "Pydantic validation failure on user input. Client sent malformed data: missing name, invalid email format, non-positive age.",
            },
        ),
        Example(
            input={
                "error": "FATAL:  password authentication failed for user 'admin'\nDetail: Role 'admin' does not exist.",
                "context": "PostgreSQL database connection",
            },
            output={
                "category": "authentication_failure",
                "severity": "high",
                "next_step": "check_credentials",
                "explanation": "PostgreSQL user 'admin' does not exist. Database credentials are wrong or the user needs to be created.",
            },
        ),
        Example(
            input={
                "error": "Thread 1 waiting for lock held by Thread 2\nThread 2 waiting for lock held by Thread 1\nDeadlock detected, aborting transaction",
                "context": "Database transaction in concurrent service",
            },
            output={
                "category": "deadlock",
                "severity": "critical",
                "next_step": "investigate_deadlock",
                "explanation": "Classic circular deadlock between two transactions. Review lock ordering. Consider using advisory locks or reducing transaction scope.",
            },
        ),
        Example(
            input={
                "error": "npm ERR! ERESOLVE unable to resolve dependency tree\nnpm ERR! peer dep missing: react@^17.0.0, required by react-router-dom@5.3.4\nnpm ERR! Found: react@18.2.0",
                "context": "Node.js project, npm install",
            },
            output={
                "category": "version_conflict",
                "severity": "medium",
                "next_step": "upgrade_version",
                "explanation": "react-router-dom@5.x requires React 17 but React 18 is installed. Upgrade to react-router-dom@6 or use --legacy-peer-deps.",
            },
        ),
    ]


class ErrorTriagePack(BasePack):
    """Dataset pack for training error triage models."""

    def spec(self) -> PackSpec:
        return PackSpec(
            name="error-triage",
            version="0.1.0",
            description=(
                "Classify errors by root cause, severity, and recommended next step. "
                "20 error categories covering runtime, network, auth, resource, and config failures."
            ),
            task_type="classification",
            input_schema={
                "type": "object",
                "properties": {
                    "error": {"type": "string"},
                    "context": {"type": "string"},
                },
                "required": ["error"],
            },
            output_schema={
                "type": "object",
                "properties": {
                    "category": {"type": "string", "enum": ERROR_CATEGORIES},
                    "severity": {"type": "string", "enum": SEVERITY_LEVELS},
                    "next_step": {"type": "string", "enum": NEXT_STEPS},
                    "explanation": {"type": "string"},
                },
                "required": ["category", "severity", "next_step"],
            },
            instruction_template=(
                "You are an error triage system. Given an error message and optional context, "
                "classify the error and recommend a resolution.\n\n"
                "Error categories: " + ", ".join(ERROR_CATEGORIES) + "\n"
                "Severity levels: " + ", ".join(SEVERITY_LEVELS) + "\n"
                "Next steps: " + ", ".join(NEXT_STEPS) + "\n\n"
                "Error: {error}\n"
                "Context: {context}\n\n"
                "Respond with JSON containing 'category', 'severity', 'next_step', and 'explanation'."
            ),
            label_space=ERROR_CATEGORIES,
            generation_mode=GenerationMode.HYBRID,
            generation_config={"ollama_model": "qwen2.5:7b", "temperature": 0.7},
            quality_checks=[
                QualityCheck.SCHEMA_VALID,
                QualityCheck.INPUT_NONEMPTY,
                QualityCheck.OUTPUT_NONEMPTY,
                QualityCheck.LABEL_IN_SPACE,
            ],
            eval_protocol=EvalProtocol(
                metrics=[
                    EvalMetric(
                        name="category_accuracy",
                        weight=1.0,
                        threshold=0.80,
                        description="Exact match on error category",
                    ),
                    EvalMetric(
                        name="severity_accuracy",
                        weight=0.7,
                        threshold=0.75,
                        description="Exact match on severity level",
                    ),
                    EvalMetric(
                        name="next_step_accuracy",
                        weight=0.5,
                        threshold=0.65,
                        description="Exact match on recommended next step",
                    ),
                ],
                min_eval_samples=100,
                stratify_by="category",
                description="Multi-label accuracy: category + severity + next step",
            ),
            examples=_seed_examples(),
            recommended_model_classes=[
                "Qwen2.5-3B",
                "Phi-3-mini-4k",
                "Llama-3.2-3B",
                "Gemma-2-2B",
            ],
            tags=["triage", "classification", "errors", "debugging", "ops"],
            min_examples=500,
            target_examples=2000,
        )

    def evaluate(self, predicted: dict, expected: dict) -> float:
        """Weighted accuracy across category, severity, and next_step."""
        score = 0.0
        if predicted.get("category") == expected.get("category"):
            score += 0.5
        if predicted.get("severity") == expected.get("severity"):
            score += 0.3
        if predicted.get("next_step") == expected.get("next_step"):
            score += 0.2
        return score
