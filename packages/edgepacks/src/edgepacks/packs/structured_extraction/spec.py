"""PackSpec for the structured-extraction dataset pack."""

from edgepacks.packs._base import BasePack
from edgepacks.packs.structured_extraction.schemas import SCHEMA_NAMES
from edgepacks.schema.eval_protocol import EvalMetric, EvalProtocol
from edgepacks.schema.example import Example
from edgepacks.schema.pack import GenerationMode, PackSpec, QualityCheck


def _seed_examples() -> list[Example]:
    """Hand-crafted seed examples across all three extraction schemas."""
    return [
        # Contact extraction
        Example(
            input={
                "text": "Hey, reach out to Sarah Chen at sarah.chen@acme.io — she's the VP of Engineering at Acme Corp. Her direct line is 415-555-0142.",
                "schema_type": "contact",
            },
            output={
                "extracted": {
                    "name": "Sarah Chen",
                    "email": "sarah.chen@acme.io",
                    "phone": "415-555-0142",
                    "company": "Acme Corp",
                    "role": "VP of Engineering",
                },
                "confidence": 0.95,
            },
        ),
        Example(
            input={
                "text": "From: Mike R. <mike@startup.co>\nSubject: Quick intro\n\nHi there, I'm Mike Rodriguez, CTO at StartupCo.",
                "schema_type": "contact",
            },
            output={
                "extracted": {
                    "name": "Mike Rodriguez",
                    "email": "mike@startup.co",
                    "company": "StartupCo",
                    "role": "CTO",
                },
                "confidence": 0.90,
            },
        ),
        Example(
            input={
                "text": "CC: j.wilson on the thread — they work in marketing I think",
                "schema_type": "contact",
            },
            output={
                "extracted": {
                    "name": "J. Wilson",
                    "role": "marketing",
                },
                "confidence": 0.40,
            },
        ),
        # Event extraction
        Example(
            input={
                "text": "Don't forget — product review is this Thursday at 2pm in the Maple conference room. Lisa is running it, and she wants the whole design team there.",
                "schema_type": "event",
            },
            output={
                "extracted": {
                    "title": "Product Review",
                    "date": "Thursday",
                    "time": "2:00 PM",
                    "location": "Maple conference room",
                    "organizer": "Lisa",
                    "attendees": ["design team"],
                },
                "confidence": 0.85,
            },
        ),
        Example(
            input={
                "text": "Quarterly all-hands next Monday, March 31st. 10am-11:30am, main auditorium + Zoom link TBD. CEO and VPs presenting.",
                "schema_type": "event",
            },
            output={
                "extracted": {
                    "title": "Quarterly All-Hands",
                    "date": "March 31",
                    "time": "10:00 AM - 11:30 AM",
                    "location": "main auditorium + Zoom",
                    "attendees": ["CEO", "VPs"],
                },
                "confidence": 0.90,
            },
        ),
        Example(
            input={
                "text": "might do a lunch thing friday? idk lmk if you're free",
                "schema_type": "event",
            },
            output={
                "extracted": {
                    "title": "Lunch",
                    "date": "Friday",
                    "time": "lunch",
                },
                "confidence": 0.30,
            },
        ),
        # Config extraction
        Example(
            input={
                "text": "Set the max_connections to 100 in the [database] section. Also make sure debug is false.",
                "schema_type": "config",
            },
            output={
                "extracted": [
                    {"key": "max_connections", "value": "100", "section": "database", "type": "integer"},
                    {"key": "debug", "value": "false", "section": "database", "type": "boolean"},
                ],
                "confidence": 0.95,
            },
        ),
        Example(
            input={
                "text": "The API rate limit should be 1000 requests per minute. Timeout is 30 seconds. Enable caching.",
                "schema_type": "config",
            },
            output={
                "extracted": [
                    {"key": "rate_limit", "value": "1000", "type": "integer"},
                    {"key": "timeout", "value": "30", "type": "integer"},
                    {"key": "caching", "value": "true", "type": "boolean"},
                ],
                "confidence": 0.85,
            },
        ),
    ]


class StructuredExtractionPack(BasePack):
    """Dataset pack for training structured extraction models."""

    def spec(self) -> PackSpec:
        return PackSpec(
            name="structured-extraction",
            version="0.1.0",
            description=(
                "Extract structured data from messy unstructured text. "
                "Three sub-tasks: contact extraction, event extraction, config extraction."
            ),
            task_type="extraction",
            input_schema={
                "type": "object",
                "properties": {
                    "text": {"type": "string"},
                    "schema_type": {"type": "string", "enum": SCHEMA_NAMES},
                },
                "required": ["text", "schema_type"],
            },
            output_schema={
                "type": "object",
                "properties": {
                    "extracted": {},  # Varies by schema_type
                    "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0},
                },
                "required": ["extracted", "confidence"],
            },
            instruction_template=(
                "You are a structured extraction model. Given messy text and a target schema, "
                "extract the relevant information into a structured format.\n\n"
                "Schema type: {schema_type}\n"
                "Text: {text}\n\n"
                "Extract all matching information into JSON. Include a confidence score (0.0-1.0) "
                "reflecting how complete and certain the extraction is. "
                "If information is ambiguous or missing, use lower confidence."
            ),
            label_space=SCHEMA_NAMES,
            generation_mode=GenerationMode.HYBRID,
            generation_config={"ollama_model": "qwen2.5:7b", "temperature": 0.8},
            quality_checks=[
                QualityCheck.SCHEMA_VALID,
                QualityCheck.INPUT_NONEMPTY,
                QualityCheck.OUTPUT_NONEMPTY,
            ],
            eval_protocol=EvalProtocol(
                metrics=[
                    EvalMetric(
                        name="field_recall",
                        weight=1.0,
                        threshold=0.75,
                        description="Fraction of expected fields correctly extracted",
                    ),
                    EvalMetric(
                        name="field_precision",
                        weight=0.8,
                        threshold=0.70,
                        description="Fraction of extracted fields that are correct",
                    ),
                    EvalMetric(
                        name="confidence_calibration",
                        weight=0.3,
                        threshold=0.60,
                        description="How well confidence scores predict accuracy",
                    ),
                ],
                min_eval_samples=100,
                stratify_by="schema_type",
                description="Field-level extraction accuracy with confidence calibration",
            ),
            examples=_seed_examples(),
            recommended_model_classes=[
                "Qwen2.5-3B",
                "Phi-3-mini-4k",
                "Llama-3.2-3B",
                "Gemma-2-2B",
            ],
            tags=["extraction", "structured-data", "parsing", "NER"],
            min_examples=500,
            target_examples=2000,
        )

    def evaluate(self, predicted: dict, expected: dict) -> float:
        """Field-level extraction scoring."""
        pred_ext = predicted.get("extracted", {})
        exp_ext = expected.get("extracted", {})

        if isinstance(exp_ext, list):
            # Config extraction returns a list
            items = pred_ext if isinstance(pred_ext, list) else []
            pred_keys = {item.get("key") for item in items}
            exp_keys = {item.get("key") for item in exp_ext}
        elif isinstance(exp_ext, dict):
            pred_keys = set(pred_ext.keys()) if isinstance(pred_ext, dict) else set()
            exp_keys = set(exp_ext.keys())
        else:
            return 0.0

        if not exp_keys:
            return 1.0 if not pred_keys else 0.0

        tp = len(pred_keys & exp_keys)
        precision = tp / len(pred_keys) if pred_keys else 0.0
        recall = tp / len(exp_keys)
        if precision + recall == 0:
            return 0.0
        return 2 * precision * recall / (precision + recall)
