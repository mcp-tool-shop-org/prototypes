"""
Witness CLI - Command-line interface for Witness event journal.

Commands:
- init: Initialize a new witness store
- record: Record a new event
- inspect: View event details
- verify: Verify events cryptographically and analyze timeline
- export: Export events to JSONL
- rotate-key: Create a key rotation event
- testify: Generate a human-readable testimony report
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

from witness import __version__
from witness.canon import canonical_json
from witness.crypto import (
    sign_event,
    verify_event,
    generate_key_id,
    public_key_to_base64,
    public_key_to_bytes,
)
from witness.storage import WitnessStore, EventExistsError, VerificationError
from witness.timeline import analyze_timeline, analyze_single_event
from witness.models import VerifyStatus
from witness.testify import testify


DEFAULT_STORE = Path(".witness/events.db")
DEFAULT_KEY_FILE = Path(".witness/signing_key.pem")


def get_or_create_key(key_path: Path) -> Ed25519PrivateKey:
    """Load or create a signing key."""
    if key_path.exists():
        with open(key_path, "rb") as f:
            return serialization.load_pem_private_key(f.read(), password=None)

    # Generate new key
    key = Ed25519PrivateKey.generate()
    key_path.parent.mkdir(parents=True, exist_ok=True)

    with open(key_path, "wb") as f:
        f.write(key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ))

    return key


def load_key(key_path: Path) -> Optional[Ed25519PrivateKey]:
    """Load a signing key if it exists."""
    if not key_path.exists():
        return None

    with open(key_path, "rb") as f:
        return serialization.load_pem_private_key(f.read(), password=None)


def cmd_init(args: argparse.Namespace) -> int:
    """Initialize a new witness store."""
    store_path = Path(args.store)
    key_path = Path(args.key)

    if store_path.exists() and not args.force:
        print(f"Store already exists: {store_path}", file=sys.stderr)
        print("Use --force to reinitialize", file=sys.stderr)
        return 1

    # Create directories
    store_path.parent.mkdir(parents=True, exist_ok=True)

    # Initialize store
    store = WitnessStore(store_path)
    store.init()
    store.close()

    # Create or load key
    key = get_or_create_key(key_path)
    key_id = generate_key_id(public_key_to_bytes(key))

    print(f"Initialized witness store: {store_path}")
    print(f"Signing key: {key_path}")
    print(f"Key ID: {key_id}")

    return 0


def cmd_record(args: argparse.Namespace) -> int:
    """Record a new event."""
    store_path = Path(args.store)
    key_path = Path(args.key)

    if not store_path.exists():
        print(f"Store not found: {store_path}", file=sys.stderr)
        print("Run 'witness init' first", file=sys.stderr)
        return 1

    key = load_key(key_path)
    if key is None:
        print(f"Signing key not found: {key_path}", file=sys.stderr)
        return 1

    pub_b64 = public_key_to_base64(key)
    key_id = generate_key_id(public_key_to_bytes(key))

    # Build event
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    occurred_at = args.occurred_at or now

    # Warn about backdating
    if occurred_at < now and not args.allow_backdate:
        print(f"Warning: occurred_at ({occurred_at}) is in the past", file=sys.stderr)
        print("Use --allow-backdate to suppress this warning", file=sys.stderr)

    event: Dict[str, Any] = {
        "schema_version": "0.1",
        "event_id": args.event_id or str(uuid.uuid4()),
        "occurred_at": occurred_at,
        "actor": {
            "type": args.actor_type,
            "id": args.actor_id or key_id,
        },
        "intent": args.intent,
        "action": args.action,
        "inputs": [],
        "outputs": [],
        "context": {},
        "links": {
            "parent_event_ids": args.parent or [],
            "related_event_ids": args.related or [],
        },
        "signing": {
            "algorithm": "ed25519",
            "public_key": pub_b64,
            "signature": "",
        },
    }

    # Add context from JSON file or string
    if args.context:
        try:
            event["context"] = json.loads(args.context)
        except json.JSONDecodeError:
            # Try as file path
            context_path = Path(args.context)
            if context_path.exists():
                with open(context_path) as f:
                    event["context"] = json.load(f)
            else:
                print(f"Invalid context JSON: {args.context}", file=sys.stderr)
                return 1

    # Sign event
    signed = sign_event(event, key)

    # Store event
    store = WitnessStore(store_path)
    try:
        event_id = store.append(signed)
        print(f"Recorded: {event_id}")

        if args.verbose:
            print(canonical_json(signed))

        return 0
    except EventExistsError:
        print(f"Event already exists: {signed['event_id']}", file=sys.stderr)
        return 1
    except VerificationError as e:
        print(f"Verification failed: {e}", file=sys.stderr)
        return 3
    finally:
        store.close()


def cmd_inspect(args: argparse.Namespace) -> int:
    """Inspect an event."""
    store_path = Path(args.store)

    if not store_path.exists():
        print(f"Store not found: {store_path}", file=sys.stderr)
        return 1

    store = WitnessStore(store_path)
    try:
        stored = store.get(args.event_id)
        if stored is None:
            print(f"Event not found: {args.event_id}", file=sys.stderr)
            return 1

        if args.json:
            print(canonical_json(stored.event))
        else:
            event = stored.event
            print(f"Event ID:    {event['event_id']}")
            print(f"Occurred:    {event['occurred_at']}")
            print(f"Recorded:    {stored.recorded_at}")
            print(f"Action:      {event['action']}")
            print(f"Intent:      {event['intent']}")
            print(f"Actor:       {event['actor']['type']}:{event['actor']['id'][:16]}...")
            print(f"Signing Key: {stored.signing_key_id[:16]}...")
            print(f"Digest:      {event['integrity']['event_digest']}")

            # Verify
            result = verify_event(event)
            print(f"Crypto:      {'VALID' if result.ok else 'INVALID: ' + (result.error or '')}")

        return 0
    finally:
        store.close()


def cmd_verify(args: argparse.Namespace) -> int:
    """Verify events."""
    store_path = Path(args.store)

    if not store_path.exists():
        print(f"Store not found: {store_path}", file=sys.stderr)
        return 1

    store = WitnessStore(store_path)
    try:
        # Collect events
        events = [stored.event for stored in store.iter_events()]

        if not events:
            print("No events to verify")
            return 0

        # Analyze timeline
        results = analyze_timeline(events, verify_crypto=True)

        # Collect stats
        verified = 0
        with_flags = 0
        failed = 0
        all_flags: List[str] = []

        for analysis in results:
            if analysis.status == VerifyStatus.VERIFIED:
                verified += 1
            elif analysis.status == VerifyStatus.VERIFIED_WITH_FLAGS:
                with_flags += 1
                all_flags.extend(analysis.flags)
            else:
                failed += 1
                if args.verbose and analysis.crypto_result:
                    print(f"FAILED {analysis.event_id}: {analysis.crypto_result.error}")

        # Summary
        total = len(results)
        print(f"Verified: {verified + with_flags}/{total}")

        if with_flags > 0:
            print(f"  With flags: {with_flags}")
            if args.verbose:
                for flag in sorted(set(all_flags)):
                    count = all_flags.count(flag)
                    print(f"    {flag}: {count}")

        if failed > 0:
            print(f"  Failed: {failed}")

        # Exit code
        if failed > 0:
            return 3
        elif with_flags > 0:
            return 2
        else:
            return 0

    finally:
        store.close()


def cmd_export(args: argparse.Namespace) -> int:
    """Export events to JSONL."""
    store_path = Path(args.store)

    if not store_path.exists():
        print(f"Store not found: {store_path}", file=sys.stderr)
        return 1

    store = WitnessStore(store_path)
    try:
        if args.output:
            count = store.export_jsonl(args.output)
            print(f"Exported {count} events to {args.output}")
        else:
            # Write to stdout
            for stored in store.iter_events():
                print(canonical_json(stored.event))

        return 0
    finally:
        store.close()


def cmd_rotate_key(args: argparse.Namespace) -> int:
    """Create a key rotation event."""
    store_path = Path(args.store)
    key_path = Path(args.key)

    if not store_path.exists():
        print(f"Store not found: {store_path}", file=sys.stderr)
        return 1

    old_key = load_key(key_path)
    if old_key is None:
        print(f"Current signing key not found: {key_path}", file=sys.stderr)
        return 1

    old_key_id = generate_key_id(public_key_to_bytes(old_key))

    # Generate new key
    new_key = Ed25519PrivateKey.generate()
    new_key_id = generate_key_id(public_key_to_bytes(new_key))
    new_pub_b64 = public_key_to_base64(new_key)

    # Determine mode and signing key
    if args.mode == "continuity":
        signing_key = old_key
        signing_pub_b64 = public_key_to_base64(old_key)
    else:  # recovery
        signing_key = new_key
        signing_pub_b64 = new_pub_b64

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Build rotation event
    event: Dict[str, Any] = {
        "schema_version": "0.1",
        "event_id": str(uuid.uuid4()),
        "occurred_at": now,
        "actor": {
            "type": "system",
            "id": generate_key_id(public_key_to_bytes(signing_key)),
        },
        "intent": args.reason or f"Key rotation ({args.mode})",
        "action": "witness.rotate_key",
        "inputs": [],
        "outputs": [{
            "artifact_id": "new_public_key",
            "media_type": "application/octet-stream",
            "size_bytes": 32,
            "digest": f"sha256:{hashlib.sha256(public_key_to_bytes(new_key)).hexdigest()}",
        }],
        "context": {
            "tool": "witness-cli",
            "tool_version": __version__,
            "rotation": {
                "old_key_id": old_key_id,
                "new_key_id": new_key_id,
                "reason": args.reason_code or "policy",
                "mode": args.mode,
                "note": args.note or "",
            },
        },
        "links": {"parent_event_ids": [], "related_event_ids": []},
        "signing": {
            "algorithm": "ed25519",
            "public_key": signing_pub_b64,
            "signature": "",
        },
    }

    # Sign and store
    signed = sign_event(event, signing_key)

    store = WitnessStore(store_path)
    try:
        event_id = store.append(signed)

        # Save new key
        new_key_path = key_path.with_suffix(".new.pem")
        with open(new_key_path, "wb") as f:
            f.write(new_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption(),
            ))

        print(f"Rotation recorded: {event_id}")
        print(f"Old key ID: {old_key_id}")
        print(f"New key ID: {new_key_id}")
        print(f"New key saved to: {new_key_path}")
        print()
        print("To complete the rotation, replace the old key:")
        print(f"  mv {new_key_path} {key_path}")

        return 0
    except Exception as e:
        print(f"Failed to record rotation: {e}", file=sys.stderr)
        return 1
    finally:
        store.close()


def cmd_testify(args: argparse.Namespace) -> int:
    """Generate a testimony report."""
    store_path = Path(args.store)

    # Handle emit-artifact option
    emit_dir = Path(args.emit_artifact) if args.emit_artifact else None

    result = testify(
        store_path,
        since=args.since,
        until=args.until,
        event_id=args.event,
        actor_id=args.actor,
        format=args.format,
        check_files=args.check_files,
        include_events=args.include_events,
        include_artifacts=args.include_artifacts,
        fail_on=args.fail_on,
        generated_at=args.generated_at,
        emit_artifact_dir=emit_dir,
    )

    if emit_dir:
        print(f"Testimony artifacts emitted to: {emit_dir}", file=sys.stderr)

    if args.output:
        output_path = Path(args.output)
        output_path.write_text(result.text, encoding="utf-8")
        print(f"Testimony written to: {output_path}", file=sys.stderr)
    else:
        print(result.text)

    return result.exit_code


def main(argv: Optional[List[str]] = None) -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        prog="witness",
        description="Local-first, append-only event journal for human-AI work.",
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"%(prog)s {__version__}",
    )
    parser.add_argument(
        "--store",
        default=str(DEFAULT_STORE),
        help=f"Path to witness store (default: {DEFAULT_STORE})",
    )
    parser.add_argument(
        "--key",
        default=str(DEFAULT_KEY_FILE),
        help=f"Path to signing key (default: {DEFAULT_KEY_FILE})",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # init
    init_parser = subparsers.add_parser("init", help="Initialize a new witness store")
    init_parser.add_argument("--force", action="store_true", help="Force reinitialization")
    init_parser.set_defaults(func=cmd_init)

    # record
    record_parser = subparsers.add_parser("record", help="Record a new event")
    record_parser.add_argument("--action", required=True, help="Action identifier")
    record_parser.add_argument("--intent", required=True, help="Declared intent")
    record_parser.add_argument("--event-id", help="Custom event ID (default: UUID)")
    record_parser.add_argument("--occurred-at", help="Timestamp (default: now)")
    record_parser.add_argument("--actor-type", default="human", help="Actor type (default: human)")
    record_parser.add_argument("--actor-id", help="Actor ID (default: signing key ID)")
    record_parser.add_argument("--context", help="Context JSON or file path")
    record_parser.add_argument("--parent", action="append", help="Parent event ID(s)")
    record_parser.add_argument("--related", action="append", help="Related event ID(s)")
    record_parser.add_argument("--allow-backdate", action="store_true", help="Allow past timestamps")
    record_parser.add_argument("-v", "--verbose", action="store_true", help="Print full event JSON")
    record_parser.set_defaults(func=cmd_record)

    # inspect
    inspect_parser = subparsers.add_parser("inspect", help="Inspect an event")
    inspect_parser.add_argument("event_id", help="Event ID to inspect")
    inspect_parser.add_argument("--json", action="store_true", help="Output as JSON")
    inspect_parser.set_defaults(func=cmd_inspect)

    # verify
    verify_parser = subparsers.add_parser("verify", help="Verify events")
    verify_parser.add_argument("-v", "--verbose", action="store_true", help="Show details")
    verify_parser.set_defaults(func=cmd_verify)

    # export
    export_parser = subparsers.add_parser("export", help="Export events to JSONL")
    export_parser.add_argument("-o", "--output", help="Output file (default: stdout)")
    export_parser.set_defaults(func=cmd_export)

    # rotate-key
    rotate_parser = subparsers.add_parser("rotate-key", help="Create a key rotation event")
    rotate_parser.add_argument(
        "--mode",
        choices=["continuity", "recovery"],
        default="continuity",
        help="Rotation mode (default: continuity)",
    )
    rotate_parser.add_argument("--reason", help="Human-readable reason")
    rotate_parser.add_argument(
        "--reason-code",
        choices=["scheduled", "suspected_compromise", "device_migration", "policy", "other"],
        default="policy",
        help="Reason code (default: policy)",
    )
    rotate_parser.add_argument("--note", help="Additional note")
    rotate_parser.set_defaults(func=cmd_rotate_key)

    # testify
    testify_parser = subparsers.add_parser(
        "testify",
        help="Generate a human-readable testimony report from verified events",
    )
    testify_parser.add_argument("--since", help="Filter events since timestamp")
    testify_parser.add_argument("--until", help="Filter events until timestamp")
    testify_parser.add_argument("--event", help="Filter to specific event ID")
    testify_parser.add_argument("--actor", help="Filter to specific actor key ID")
    testify_parser.add_argument(
        "--format",
        choices=["md", "text", "json"],
        default="md",
        help="Output format (default: md)",
    )
    testify_parser.add_argument(
        "--check-files",
        action="store_true",
        help="Verify artifact files exist and match digests",
    )
    testify_parser.add_argument(
        "-o", "--output",
        help="Output file (default: stdout)",
    )
    testify_parser.add_argument(
        "--include-events",
        action="store_true",
        help="Embed event JSON in output",
    )
    testify_parser.add_argument(
        "--include-artifacts",
        action="store_true",
        default=True,
        help="Include artifact details (default: true)",
    )
    testify_parser.add_argument(
        "--fail-on",
        choices=["crypto", "never"],
        default="crypto",
        help="When to fail (default: crypto)",
    )
    testify_parser.add_argument(
        "--generated-at",
        help="Override timestamp for deterministic output (ISO 8601)",
    )
    testify_parser.add_argument(
        "--emit-artifact",
        metavar="DIR",
        help="Emit testimony.json, testimony.md, and testimony.manifest.json to DIR",
    )
    testify_parser.set_defaults(func=cmd_testify)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
