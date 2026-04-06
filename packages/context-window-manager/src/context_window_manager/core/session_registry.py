"""
Session and Window registry for Context Window Manager.

Provides SQLite-backed storage for:
- Session lifecycle management
- Window (frozen context) metadata
- State machine enforcement
- Audit logging
"""

from __future__ import annotations

import hashlib
import json
import re
import secrets
from datetime import UTC, datetime
from enum import Enum
from pathlib import Path
from typing import Any

import aiosqlite
import structlog

from context_window_manager.errors import (
    InvalidStateTransitionError,
    SessionNotFoundError,
    ValidationError,
    WindowAlreadyExistsError,
    WindowNotFoundError,
)

logger = structlog.get_logger()


# =============================================================================
# SQL Safety Utilities
# =============================================================================


def escape_like_pattern(value: str) -> str:
    """
    Escape special characters for LIKE patterns.

    SQL LIKE patterns treat % and _ as wildcards. This function escapes them
    so they match literally when used with ESCAPE clause.

    Args:
        value: User input to use in LIKE pattern

    Returns:
        Escaped string safe for LIKE patterns
    """
    # Escape backslash first (it's our escape char), then wildcards
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def validate_sort_column(
    sort_by: str,
    allowed_columns: frozenset[str],
    default: str = "created_at",
) -> str:
    """
    Validate and sanitize sort column name.

    Args:
        sort_by: User-provided sort column
        allowed_columns: Whitelist of valid column names
        default: Default column if invalid

    Returns:
        Safe column name from allowlist
    """
    if sort_by in allowed_columns:
        return sort_by
    logger.warning(
        "Invalid sort_by rejected",
        attempted=sort_by,
        allowed=list(allowed_columns),
        fallback=default,
    )
    return default


def validate_sort_order(sort_order: str) -> str:
    """
    Validate and sanitize sort order.

    Args:
        sort_order: User-provided sort order

    Returns:
        Either "ASC" or "DESC"
    """
    normalized = sort_order.strip().upper()
    if normalized in ("ASC", "DESC"):
        return normalized
    logger.warning(
        "Invalid sort_order rejected",
        attempted=sort_order,
        fallback="DESC",
    )
    return "DESC"


# =============================================================================
# Models
# =============================================================================


class SessionState(str, Enum):
    """Session lifecycle states."""

    ACTIVE = "active"  # Session is being used
    FROZEN = "frozen"  # Session has been snapshotted
    THAWED = "thawed"  # Session restored from snapshot
    EXPIRED = "expired"  # Session timed out
    DELETED = "deleted"  # Soft-deleted


# Valid state transitions
STATE_TRANSITIONS: dict[SessionState, set[SessionState]] = {
    SessionState.ACTIVE: {
        SessionState.FROZEN,
        SessionState.EXPIRED,
        SessionState.DELETED,
    },
    SessionState.FROZEN: {SessionState.THAWED, SessionState.DELETED},
    SessionState.THAWED: {
        SessionState.ACTIVE,
        SessionState.FROZEN,
        SessionState.DELETED,
    },
    SessionState.EXPIRED: {SessionState.DELETED},
    SessionState.DELETED: set(),  # Terminal state
}


class Session:
    """Represents an active or historical LLM session."""

    def __init__(
        self,
        id: str,
        state: SessionState = SessionState.ACTIVE,
        model: str = "",
        token_count: int = 0,
        cache_salt: str | None = None,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
        frozen_at: datetime | None = None,
        metadata: dict[str, Any] | None = None,
    ):
        self.id = id
        self.state = state
        self.model = model
        self.token_count = token_count
        self.cache_salt = cache_salt
        self.created_at = created_at or datetime.now(UTC)
        self.updated_at = updated_at or self.created_at
        self.frozen_at = frozen_at
        self.metadata = metadata or {}

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "id": self.id,
            "state": self.state.value,
            "model": self.model,
            "token_count": self.token_count,
            "cache_salt": self.cache_salt,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "frozen_at": self.frozen_at.isoformat() if self.frozen_at else None,
            "metadata": self.metadata,
        }

    @classmethod
    def from_row(cls, row: aiosqlite.Row) -> Session:
        """Create from database row."""
        return cls(
            id=row["id"],
            state=SessionState(row["state"]),
            model=row["model"],
            token_count=row["token_count"],
            cache_salt=row["cache_salt"],
            created_at=datetime.fromisoformat(row["created_at"])
            if row["created_at"]
            else None,
            updated_at=datetime.fromisoformat(row["updated_at"])
            if row["updated_at"]
            else None,
            frozen_at=datetime.fromisoformat(row["frozen_at"])
            if row["frozen_at"]
            else None,
            metadata=json.loads(row["metadata"]) if row["metadata"] else {},
        )


class Window:
    """Represents a frozen context window."""

    def __init__(
        self,
        name: str,
        session_id: str,
        description: str = "",
        tags: list[str] | None = None,
        block_count: int = 0,
        block_hashes: list[str] | None = None,
        total_size_bytes: int = 0,
        model: str = "",
        token_count: int = 0,
        created_at: datetime | None = None,
        parent_window: str | None = None,
    ):
        self.name = name
        self.session_id = session_id
        self.description = description
        self.tags = tags or []
        self.block_count = block_count
        self.block_hashes = block_hashes or []
        self.total_size_bytes = total_size_bytes
        self.model = model
        self.token_count = token_count
        self.created_at = created_at or datetime.now(UTC)
        self.parent_window = parent_window

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "name": self.name,
            "session_id": self.session_id,
            "description": self.description,
            "tags": self.tags,
            "block_count": self.block_count,
            "block_hashes": self.block_hashes,
            "total_size_bytes": self.total_size_bytes,
            "model": self.model,
            "token_count": self.token_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "parent_window": self.parent_window,
        }

    @classmethod
    def from_row(cls, row: aiosqlite.Row) -> Window:
        """Create from database row."""
        return cls(
            name=row["name"],
            session_id=row["session_id"],
            description=row["description"] or "",
            tags=json.loads(row["tags"]) if row["tags"] else [],
            block_count=row["block_count"],
            block_hashes=json.loads(row["block_hashes"]) if row["block_hashes"] else [],
            total_size_bytes=row["total_size_bytes"],
            model=row["model"],
            token_count=row["token_count"],
            created_at=datetime.fromisoformat(row["created_at"])
            if row["created_at"]
            else None,
            parent_window=row["parent_window"],
        )


# =============================================================================
# Registry
# =============================================================================

# Validation patterns
SESSION_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
WINDOW_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{1,128}$")


def validate_session_id(session_id: str) -> None:
    """Validate session ID format."""
    if not session_id:
        raise ValidationError("Session ID cannot be empty")
    if not SESSION_ID_PATTERN.match(session_id):
        raise ValidationError(
            f"Invalid session ID format: {session_id!r}. "
            "Must be 1-64 alphanumeric characters, underscores, or hyphens."
        )


def validate_window_name(name: str) -> None:
    """Validate window name format."""
    if not name:
        raise ValidationError("Window name cannot be empty")
    if not WINDOW_NAME_PATTERN.match(name):
        raise ValidationError(
            f"Invalid window name format: {name!r}. "
            "Must be 1-128 alphanumeric characters, underscores, or hyphens."
        )


def generate_cache_salt(session_id: str, namespace: str = "cwm") -> str:
    """
    Generate a unique cache_salt for session isolation.

    The salt ensures KV cache blocks are isolated between sessions,
    preventing unauthorized access and enabling restoration.
    """
    components = [
        namespace,
        session_id,
        secrets.token_hex(8),
    ]
    return hashlib.sha256("_".join(components).encode()).hexdigest()[:32]


class SessionRegistry:
    """
    SQLite-backed registry for sessions and windows.

    Features:
    - ACID transactions for data integrity
    - State machine enforcement
    - Audit logging
    - Async interface
    """

    SCHEMA_VERSION = 1

    def __init__(self, db_path: Path | str):
        """
        Initialize the registry.

        Args:
            db_path: Path to SQLite database file.
        """
        self.db_path = Path(db_path)
        self._db: aiosqlite.Connection | None = None

    async def __aenter__(self) -> SessionRegistry:
        """Async context manager entry."""
        await self.initialize()
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit."""
        await self.close()

    async def initialize(self) -> None:
        """Initialize database and create tables if needed."""
        # Ensure directory exists
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        self._db = await aiosqlite.connect(self.db_path)
        self._db.row_factory = aiosqlite.Row

        # Enable WAL mode for better concurrent access
        await self._db.execute("PRAGMA journal_mode=WAL")
        await self._db.execute("PRAGMA foreign_keys=ON")

        await self._create_tables()
        await self._db.commit()

        logger.info("Session registry initialized", db_path=str(self.db_path))

    async def _create_tables(self) -> None:
        """Create database tables if they don't exist."""
        await self._db.executescript("""
            -- Sessions table
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                state TEXT NOT NULL DEFAULT 'active',
                model TEXT NOT NULL DEFAULT '',
                token_count INTEGER DEFAULT 0,
                cache_salt TEXT UNIQUE,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now')),
                frozen_at TEXT,
                metadata TEXT DEFAULT '{}'
            );

            -- Windows table (frozen snapshots)
            CREATE TABLE IF NOT EXISTS windows (
                name TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                description TEXT DEFAULT '',
                tags TEXT DEFAULT '[]',
                block_count INTEGER NOT NULL DEFAULT 0,
                block_hashes TEXT NOT NULL DEFAULT '[]',
                total_size_bytes INTEGER NOT NULL DEFAULT 0,
                model TEXT NOT NULL DEFAULT '',
                token_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now')),
                parent_window TEXT,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            );

            -- Audit log
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT DEFAULT (datetime('now')),
                event TEXT NOT NULL,
                session_id TEXT,
                window_name TEXT,
                details TEXT DEFAULT '{}',
                severity TEXT DEFAULT 'INFO'
            );

            -- Schema version
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_sessions_state ON sessions(state);
            CREATE INDEX IF NOT EXISTS idx_sessions_cache_salt ON sessions(cache_salt);
            CREATE INDEX IF NOT EXISTS idx_sessions_model ON sessions(model);
            CREATE INDEX IF NOT EXISTS idx_windows_session ON windows(session_id);
            CREATE INDEX IF NOT EXISTS idx_windows_created ON windows(created_at);
            CREATE INDEX IF NOT EXISTS idx_windows_model ON windows(model);
            CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
            CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_log(event);
        """)

        # Insert schema version if not exists
        await self._db.execute(
            "INSERT OR IGNORE INTO schema_version (version) VALUES (?)",
            (self.SCHEMA_VERSION,),
        )

    async def close(self) -> None:
        """Close database connection."""
        if self._db:
            await self._db.close()
            self._db = None

    # -------------------------------------------------------------------------
    # Session Operations
    # -------------------------------------------------------------------------

    async def create_session(
        self,
        session_id: str,
        model: str,
        *,
        token_count: int = 0,
        cache_salt: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> Session:
        """
        Create a new session.

        Args:
            session_id: Unique session identifier.
            model: Model name.
            token_count: Initial token count.
            cache_salt: Optional cache_salt (for thawed sessions). Generated if not provided.
            metadata: Additional metadata.

        Returns:
            Created Session object.

        Raises:
            ValidationError: If session_id is invalid.
            ValueError: If session already exists.
        """
        validate_session_id(session_id)

        # Check for existing session
        existing = await self.get_session(session_id)
        if existing:
            raise ValueError(f"Session already exists: {session_id}")

        # Generate unique cache_salt if not provided
        if cache_salt is None:
            cache_salt = generate_cache_salt(session_id)

        now = datetime.now(UTC)
        session = Session(
            id=session_id,
            state=SessionState.ACTIVE,
            model=model,
            token_count=token_count,
            cache_salt=cache_salt,
            created_at=now,
            updated_at=now,
            metadata=metadata or {},
        )

        await self._db.execute(
            """
            INSERT INTO sessions (id, state, model, token_count, cache_salt,
                                  created_at, updated_at, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session.id,
                session.state.value,
                session.model,
                session.token_count,
                session.cache_salt,
                session.created_at.isoformat(),
                session.updated_at.isoformat(),
                json.dumps(session.metadata),
            ),
        )
        await self._db.commit()

        await self._audit_log("SESSION_CREATE", session_id=session_id)
        logger.info("Session created", session_id=session_id, model=model)

        return session

    async def get_session(self, session_id: str) -> Session | None:
        """
        Get session by ID.

        Args:
            session_id: Session identifier.

        Returns:
            Session if found, None otherwise.
        """
        async with self._db.execute(
            "SELECT * FROM sessions WHERE id = ?",
            (session_id,),
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                return Session.from_row(row)
        return None

    async def get_session_by_cache_salt(self, cache_salt: str) -> Session | None:
        """
        Get session by cache_salt.

        Args:
            cache_salt: The cache salt value.

        Returns:
            Session if found, None otherwise.
        """
        async with self._db.execute(
            "SELECT * FROM sessions WHERE cache_salt = ?",
            (cache_salt,),
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                return Session.from_row(row)
        return None

    async def update_session(
        self,
        session_id: str,
        *,
        state: SessionState | None = None,
        token_count: int | None = None,
        frozen_at: datetime | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> Session:
        """
        Update session fields.

        Args:
            session_id: Session to update.
            state: New state (validates transition).
            token_count: Updated token count.
            frozen_at: Timestamp when frozen.
            metadata: Updated metadata.

        Returns:
            Updated Session object.

        Raises:
            SessionNotFoundError: If session doesn't exist.
            InvalidStateTransitionError: If state transition is invalid.
        """
        session = await self.get_session(session_id)
        if not session:
            raise SessionNotFoundError(session_id)

        # Validate state transition
        if state is not None and state != session.state:
            allowed = STATE_TRANSITIONS.get(session.state, set())
            if state not in allowed:
                raise InvalidStateTransitionError(
                    session.state.value,
                    f"transition to {state.value}",
                )
            session.state = state

        if token_count is not None:
            session.token_count = token_count

        if frozen_at is not None:
            session.frozen_at = frozen_at

        if metadata is not None:
            session.metadata.update(metadata)

        session.updated_at = datetime.now(UTC)

        await self._db.execute(
            """
            UPDATE sessions
            SET state = ?, token_count = ?, frozen_at = ?, metadata = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                session.state.value,
                session.token_count,
                session.frozen_at.isoformat() if session.frozen_at else None,
                json.dumps(session.metadata),
                session.updated_at.isoformat(),
                session_id,
            ),
        )
        await self._db.commit()

        if state is not None:
            await self._audit_log(
                "SESSION_STATE_CHANGE",
                session_id=session_id,
                details={"new_state": state.value},
            )

        return session

    async def list_sessions(
        self,
        *,
        state: SessionState | None = None,
        model: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[Session]:
        """
        List sessions with optional filtering.

        Args:
            state: Filter by state.
            model: Filter by model.
            limit: Maximum results.
            offset: Pagination offset.

        Returns:
            List of matching sessions.
        """
        query = "SELECT * FROM sessions WHERE 1=1"
        params: list[Any] = []

        if state:
            query += " AND state = ?"
            params.append(state.value)

        if model:
            query += " AND model = ?"
            params.append(model)

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        sessions = []
        async with self._db.execute(query, params) as cursor:
            async for row in cursor:
                sessions.append(Session.from_row(row))

        return sessions

    async def count_sessions(self, *, state: SessionState | None = None) -> int:
        """Count sessions, optionally filtered by state."""
        query = "SELECT COUNT(*) FROM sessions"
        params: list[Any] = []

        if state:
            query += " WHERE state = ?"
            params.append(state.value)

        async with self._db.execute(query, params) as cursor:
            row = await cursor.fetchone()
            return row[0] if row else 0

    async def delete_session(self, session_id: str, *, hard: bool = False) -> None:
        """
        Delete a session.

        Args:
            session_id: Session to delete.
            hard: If True, permanently remove. If False, soft delete.

        Raises:
            SessionNotFoundError: If session doesn't exist.
        """
        session = await self.get_session(session_id)
        if not session:
            raise SessionNotFoundError(session_id)

        if hard:
            await self._db.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        else:
            await self.update_session(session_id, state=SessionState.DELETED)

        await self._db.commit()
        await self._audit_log(
            "SESSION_DELETE",
            session_id=session_id,
            details={"hard": hard},
        )

    # -------------------------------------------------------------------------
    # Window Operations
    # -------------------------------------------------------------------------

    async def create_window(self, window: Window) -> Window:
        """
        Create a new window.

        Args:
            window: Window object to create.

        Returns:
            Created Window.

        Raises:
            ValidationError: If window name is invalid.
            WindowAlreadyExistsError: If window name exists.
        """
        validate_window_name(window.name)

        existing = await self.get_window(window.name)
        if existing:
            raise WindowAlreadyExistsError(window.name)

        window.created_at = window.created_at or datetime.now(UTC)

        await self._db.execute(
            """
            INSERT INTO windows (name, session_id, description, tags, block_count,
                                block_hashes, total_size_bytes, model, token_count,
                                created_at, parent_window)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                window.name,
                window.session_id,
                window.description,
                json.dumps(window.tags),
                window.block_count,
                json.dumps(window.block_hashes),
                window.total_size_bytes,
                window.model,
                window.token_count,
                window.created_at.isoformat(),
                window.parent_window,
            ),
        )
        await self._db.commit()

        await self._audit_log(
            "WINDOW_CREATE",
            window_name=window.name,
            session_id=window.session_id,
            details={
                "token_count": window.token_count,
                "block_count": window.block_count,
            },
        )
        logger.info(
            "Window created",
            window_name=window.name,
            session_id=window.session_id,
            token_count=window.token_count,
        )

        return window

    async def get_window(self, name: str) -> Window | None:
        """
        Get window by name.

        Args:
            name: Window name.

        Returns:
            Window if found, None otherwise.
        """
        async with self._db.execute(
            "SELECT * FROM windows WHERE name = ?",
            (name,),
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                return Window.from_row(row)
        return None

    async def window_exists(self, name: str) -> bool:
        """Check if window exists."""
        async with self._db.execute(
            "SELECT 1 FROM windows WHERE name = ?",
            (name,),
        ) as cursor:
            return await cursor.fetchone() is not None

    async def list_windows(
        self,
        *,
        tags: list[str] | None = None,
        model: str | None = None,
        session_id: str | None = None,
        search: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[Window], int]:
        """
        List windows with filtering and pagination.

        Args:
            tags: Filter by tags (all must match).
            model: Filter by model.
            session_id: Filter by source session.
            search: Search in name and description.
            sort_by: Sort field (name, created_at, token_count, total_size_bytes).
            sort_order: Sort order (asc, desc).
            limit: Maximum results.
            offset: Pagination offset.

        Returns:
            Tuple of (windows list, total count).
        """
        # Allowed sort columns (immutable for safety)
        ALLOWED_SORT_COLUMNS: frozenset[str] = frozenset({
            "name", "created_at", "token_count", "total_size_bytes"
        })

        # Build query
        query = "SELECT * FROM windows WHERE 1=1"
        count_query = "SELECT COUNT(*) FROM windows WHERE 1=1"
        params: list[Any] = []

        if model:
            query += " AND model = ?"
            count_query += " AND model = ?"
            params.append(model)

        if session_id:
            query += " AND session_id = ?"
            count_query += " AND session_id = ?"
            params.append(session_id)

        if search:
            # Escape SQL wildcards in search input for literal matching
            escaped_search = escape_like_pattern(search)
            query += " AND (name LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')"
            count_query += " AND (name LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')"
            search_pattern = f"%{escaped_search}%"
            params.extend([search_pattern, search_pattern])

        # Tag filtering (using JSON)
        if tags:
            for tag in tags:
                # Escape tag for JSON LIKE pattern
                escaped_tag = escape_like_pattern(tag)
                query += " AND tags LIKE ? ESCAPE '\\'"
                count_query += " AND tags LIKE ? ESCAPE '\\'"
                params.append(f'%"{escaped_tag}"%')

        # Get total count
        count_params = params.copy()
        async with self._db.execute(count_query, count_params) as cursor:
            row = await cursor.fetchone()
            total = row[0] if row else 0

        # Validate and sanitize sort parameters
        safe_sort_by = validate_sort_column(sort_by, ALLOWED_SORT_COLUMNS, "created_at")
        safe_order = validate_sort_order(sort_order)

        # Deterministic sort: add secondary key (name) for stable ordering
        query += f" ORDER BY {safe_sort_by} {safe_order}, name ASC"

        # Pagination
        query += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        windows = []
        async with self._db.execute(query, params) as cursor:
            async for row in cursor:
                windows.append(Window.from_row(row))

        return windows, total

    async def delete_window(self, name: str) -> None:
        """
        Delete a window.

        Args:
            name: Window name to delete.

        Raises:
            WindowNotFoundError: If window doesn't exist.
        """
        window = await self.get_window(name)
        if not window:
            raise WindowNotFoundError(name)

        await self._db.execute("DELETE FROM windows WHERE name = ?", (name,))
        await self._db.commit()

        await self._audit_log("WINDOW_DELETE", window_name=name)
        logger.info("Window deleted", window_name=name)

    async def get_windows_for_session(self, session_id: str) -> list[Window]:
        """Get all windows created from a session."""
        windows = []
        async with self._db.execute(
            "SELECT * FROM windows WHERE session_id = ? ORDER BY created_at DESC",
            (session_id,),
        ) as cursor:
            async for row in cursor:
                windows.append(Window.from_row(row))
        return windows

    # -------------------------------------------------------------------------
    # Audit Logging
    # -------------------------------------------------------------------------

    async def _audit_log(
        self,
        event: str,
        *,
        session_id: str | None = None,
        window_name: str | None = None,
        details: dict[str, Any] | None = None,
        severity: str = "INFO",
    ) -> None:
        """Write to audit log."""
        await self._db.execute(
            """
            INSERT INTO audit_log (event, session_id, window_name, details, severity)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                event,
                session_id,
                window_name,
                json.dumps(details or {}),
                severity,
            ),
        )
        # Don't commit here - let caller decide transaction boundaries

    async def get_audit_log(
        self,
        *,
        event: str | None = None,
        session_id: str | None = None,
        window_name: str | None = None,
        since: datetime | None = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        """
        Query audit log.

        Args:
            event: Filter by event type.
            session_id: Filter by session.
            window_name: Filter by window.
            since: Only events after this timestamp.
            limit: Maximum results.

        Returns:
            List of audit log entries.
        """
        query = "SELECT * FROM audit_log WHERE 1=1"
        params: list[Any] = []

        if event:
            query += " AND event = ?"
            params.append(event)

        if session_id:
            query += " AND session_id = ?"
            params.append(session_id)

        if window_name:
            query += " AND window_name = ?"
            params.append(window_name)

        if since:
            query += " AND timestamp >= ?"
            params.append(since.isoformat())

        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)

        entries = []
        async with self._db.execute(query, params) as cursor:
            async for row in cursor:
                entries.append(
                    {
                        "id": row["id"],
                        "timestamp": row["timestamp"],
                        "event": row["event"],
                        "session_id": row["session_id"],
                        "window_name": row["window_name"],
                        "details": json.loads(row["details"]) if row["details"] else {},
                        "severity": row["severity"],
                    }
                )

        return entries
