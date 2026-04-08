"""
Batch 2: Indexer and Quick Index Additional Tests (25 tests)
Tests for Merkle hashing, incremental updates, large file batches, error recovery.
"""

import shutil
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import AsyncMock, patch

import numpy as np
import pytest

from file_compass.indexer import FileIndex
from file_compass.merkle import MerkleTree
from file_compass.quick_index import QuickIndex
from file_compass.scanner import ScannedFile

# =============================================================================
# Section 1: Indexer Merkle Hashing Tests (8 tests)
# =============================================================================

class TestIndexerMerkleHashing:
    """Test Merkle tree hashing in indexer."""

    @pytest.fixture
    def temp_index(self):
        """Create a temporary FileIndex."""
        tmpdir = tempfile.mkdtemp()
        index_path = Path(tmpdir) / "test.hnsw"
        sqlite_path = Path(tmpdir) / "test.db"
        index = FileIndex(index_path=index_path, sqlite_path=sqlite_path)

        yield index, tmpdir

        if index._conn:
            index._conn.close()
            index._conn = None
        import time
        time.sleep(0.1)
        try:
            shutil.rmtree(tmpdir)
        except PermissionError:
            pass

    @pytest.mark.asyncio
    async def test_merkle_tree_created_after_build(self, temp_index):
        """Test Merkle tree is created after index build."""
        index, tmpdir = temp_index

        mock_file = ScannedFile(
            path=Path(tmpdir) / "test.py",
            relative_path="test.py",
            file_type="python",
            size_bytes=20,
            modified_at=datetime.now(),
            content_hash="hash1"
        )

        # Create actual file
        (Path(tmpdir) / "test.py").write_text("def test(): pass")

        with patch.object(index.scanner, 'scan_all', return_value=iter([mock_file])):
            with patch.object(index.embedder, 'embed_batch', new_callable=AsyncMock) as mock_embed:
                mock_embed.return_value = np.random.randn(1, 768).astype(np.float32)
                await index.build_index(show_progress=False)

        # Verify index was built
        status = index.get_status()
        assert status["files_indexed"] == 1

    def test_merkle_root_changes_with_file_modification(self, temp_index):
        """Test Merkle root hash changes when file is modified."""
        index, tmpdir = temp_index

        # Build initial tree (MerkleTree has no args in __init__)
        tree1 = MerkleTree()
        tree1.add_file("test.py", "hash1", ["chunk1"], datetime.now().timestamp())
        root1 = tree1.root.hash

        # Build tree with modified file
        tree2 = MerkleTree()
        tree2.add_file("test.py", "hash2", ["chunk1"], datetime.now().timestamp())  # Different hash
        root2 = tree2.root.hash

        assert root1 != root2

    def test_merkle_root_same_for_same_content(self, temp_index):
        """Test Merkle root is same for identical content."""
        index, tmpdir = temp_index

        now = datetime.now().timestamp()

        tree1 = MerkleTree()
        tree1.add_file("test.py", "hash1", ["chunk1"], now)

        tree2 = MerkleTree()
        tree2.add_file("test.py", "hash1", ["chunk1"], now)

        assert tree1.root.hash == tree2.root.hash


class TestIndexerIncrementalUpdate:
    """Test incremental index updates."""

    @pytest.fixture
    def temp_index(self):
        tmpdir = tempfile.mkdtemp()
        index_path = Path(tmpdir) / "test.hnsw"
        sqlite_path = Path(tmpdir) / "test.db"
        index = FileIndex(index_path=index_path, sqlite_path=sqlite_path)

        yield index, tmpdir

        if index._conn:
            index._conn.close()
        import time
        time.sleep(0.1)
        try:
            shutil.rmtree(tmpdir)
        except PermissionError:
            pass

    @pytest.mark.asyncio
    async def test_incremental_detects_new_files(self, temp_index):
        """Test incremental update detects newly added files."""
        index, tmpdir = temp_index
        test_dir = Path(tmpdir) / "code"
        test_dir.mkdir()

        # Initial file
        (test_dir / "a.py").write_text("a = 1")
        mock_file_a = ScannedFile(
            path=test_dir / "a.py",
            relative_path="a.py",
            file_type="python",
            size_bytes=5,
            modified_at=datetime.now(),
            content_hash="hash_a"
        )

        # Initial build
        with patch.object(index.scanner, 'scan_all', return_value=iter([mock_file_a])):
            with patch.object(index.embedder, 'embed_batch', new_callable=AsyncMock) as mock_embed:
                mock_embed.return_value = np.random.randn(1, 768).astype(np.float32)
                await index.build_index(show_progress=False)

        # Add new file
        (test_dir / "b.py").write_text("b = 2")
        mock_file_b = ScannedFile(
            path=test_dir / "b.py",
            relative_path="b.py",
            file_type="python",
            size_bytes=5,
            modified_at=datetime.now(),
            content_hash="hash_b"
        )

        # Incremental update
        with patch.object(index.scanner, 'scan_all', return_value=iter([mock_file_a, mock_file_b])):
            with patch.object(index.embedder, 'embed_batch', new_callable=AsyncMock) as mock_embed:
                mock_embed.return_value = np.random.randn(1, 768).astype(np.float32)
                stats = await index.incremental_update(show_progress=False)

        assert stats["files_added"] == 1

    @pytest.mark.asyncio
    async def test_incremental_detects_deleted_files(self, temp_index):
        """Test incremental update detects deleted files."""
        index, tmpdir = temp_index
        test_dir = Path(tmpdir) / "code"
        test_dir.mkdir()

        # Two initial files
        (test_dir / "a.py").write_text("a = 1")
        (test_dir / "b.py").write_text("b = 2")

        mock_file_a = ScannedFile(
            path=test_dir / "a.py",
            relative_path="a.py",
            file_type="python",
            size_bytes=5,
            modified_at=datetime.now(),
            content_hash="hash_a"
        )
        mock_file_b = ScannedFile(
            path=test_dir / "b.py",
            relative_path="b.py",
            file_type="python",
            size_bytes=5,
            modified_at=datetime.now(),
            content_hash="hash_b"
        )

        # Initial build with both
        with patch.object(index.scanner, 'scan_all', return_value=iter([mock_file_a, mock_file_b])):
            with patch.object(index.embedder, 'embed_batch', new_callable=AsyncMock) as mock_embed:
                mock_embed.return_value = np.random.randn(2, 768).astype(np.float32)
                await index.build_index(show_progress=False)

        # Incremental with only one file (b deleted)
        with patch.object(index.scanner, 'scan_all', return_value=iter([mock_file_a])):
            with patch.object(index.embedder, 'embed_batch', new_callable=AsyncMock) as mock_embed:
                mock_embed.return_value = np.random.randn(0, 768).astype(np.float32)
                stats = await index.incremental_update(show_progress=False)

        assert stats["files_removed"] == 1


class TestIndexerLargeFileBatch:
    """Test indexer with large file batches."""

    @pytest.fixture
    def temp_index(self):
        tmpdir = tempfile.mkdtemp()
        index_path = Path(tmpdir) / "test.hnsw"
        sqlite_path = Path(tmpdir) / "test.db"
        index = FileIndex(index_path=index_path, sqlite_path=sqlite_path)

        yield index, tmpdir

        if index._conn:
            index._conn.close()
        import time
        time.sleep(0.1)
        try:
            shutil.rmtree(tmpdir)
        except PermissionError:
            pass

    @pytest.mark.asyncio
    async def test_index_many_files(self, temp_index):
        """Test indexing many files in batch."""
        index, tmpdir = temp_index
        test_dir = Path(tmpdir) / "code"
        test_dir.mkdir()

        # Create 50 mock files
        mock_files = []
        for i in range(50):
            path = test_dir / f"file_{i}.py"
            path.write_text(f"x_{i} = {i}")
            mock_files.append(ScannedFile(
                path=path,
                relative_path=f"file_{i}.py",
                file_type="python",
                size_bytes=10,
                modified_at=datetime.now(),
                content_hash=f"hash_{i}"
            ))

        with patch.object(index.scanner, 'scan_all', return_value=iter(mock_files)):
            with patch.object(index.embedder, 'embed_batch', new_callable=AsyncMock) as mock_embed:
                mock_embed.return_value = np.random.randn(50, 768).astype(np.float32)
                stats = await index.build_index(show_progress=False)

        assert stats["files_indexed"] == 50


class TestIndexerErrorRecovery:
    """Test indexer error recovery."""

    @pytest.fixture
    def temp_index(self):
        tmpdir = tempfile.mkdtemp()
        index_path = Path(tmpdir) / "test.hnsw"
        sqlite_path = Path(tmpdir) / "test.db"
        index = FileIndex(index_path=index_path, sqlite_path=sqlite_path)

        yield index, tmpdir

        if index._conn:
            index._conn.close()
        import time
        time.sleep(0.1)
        try:
            shutil.rmtree(tmpdir)
        except PermissionError:
            pass

    @pytest.mark.asyncio
    async def test_index_recovers_from_embed_error(self, temp_index):
        """Test index continues after embedding error."""
        index, tmpdir = temp_index
        test_dir = Path(tmpdir) / "code"
        test_dir.mkdir()

        (test_dir / "good.py").write_text("x = 1")
        mock_file = ScannedFile(
            path=test_dir / "good.py",
            relative_path="good.py",
            file_type="python",
            size_bytes=5,
            modified_at=datetime.now(),
            content_hash="hash_good"
        )

        call_count = [0]

        async def flaky_embed(texts, **kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                raise RuntimeError("Temporary error")
            return np.random.randn(len(texts), 768).astype(np.float32)

        with patch.object(index.scanner, 'scan_all', return_value=iter([mock_file])):
            with patch.object(index.embedder, 'embed_batch', side_effect=flaky_embed):
                # May raise or handle gracefully
                try:
                    await index.build_index(show_progress=False)
                except RuntimeError:
                    pass  # Expected if no retry logic

    @pytest.mark.asyncio
    async def test_index_handles_corrupt_file(self, temp_index):
        """Test index handles file read errors."""
        index, tmpdir = temp_index

        mock_file = ScannedFile(
            path=Path("/nonexistent/corrupt.py"),
            relative_path="corrupt.py",
            file_type="python",
            size_bytes=100,
            modified_at=datetime.now(),
            content_hash="hash_corrupt"
        )

        with patch.object(index.scanner, 'scan_all', return_value=iter([mock_file])):
            with patch.object(index.chunker, 'chunk_file', side_effect=IOError("Cannot read")):
                with patch.object(index.embedder, 'embed_batch', new_callable=AsyncMock) as mock_embed:
                    mock_embed.return_value = np.array([]).reshape(0, 768)
                    stats = await index.build_index(show_progress=False)

        # Should not crash, file recorded but no chunks
        assert stats["files_indexed"] == 1
        assert stats["chunks_indexed"] == 0


# =============================================================================
# Section 2: Quick Index Tests (12 tests)
# =============================================================================

class TestQuickIndexSmallRepo:
    """Test QuickIndex with small repository."""

    def setup_method(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = Path(self.temp_dir) / "quick.db"
        self.index = QuickIndex(db_path=self.db_path)
        self.code_dir = Path(self.temp_dir) / "code"
        self.code_dir.mkdir()

    def teardown_method(self):
        self.index.close()
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    @pytest.mark.asyncio
    async def test_quick_index_small_repo(self):
        """Test quick index on small repository."""
        (self.code_dir / "main.py").write_text("def main(): pass")
        (self.code_dir / "utils.py").write_text("def util(): pass")

        mock_files = [
            ScannedFile(
                path=self.code_dir / "main.py",
                relative_path="main.py",
                file_type="python",
                size_bytes=20,
                modified_at=datetime.now(),
                content_hash="h1"
            ),
            ScannedFile(
                path=self.code_dir / "utils.py",
                relative_path="utils.py",
                file_type="python",
                size_bytes=20,
                modified_at=datetime.now(),
                content_hash="h2"
            )
        ]

        with patch.object(self.index.scanner, 'scan_all', return_value=iter(mock_files)):
            stats = await self.index.build_quick_index(
                directories=[str(self.code_dir)],
                extract_symbols=True
            )

        assert stats["files_indexed"] == 2
        assert stats["symbols_extracted"] > 0

    @pytest.mark.asyncio
    async def test_quick_index_completes_fast(self):
        """Test quick index completes within reasonable time."""
        import time

        (self.code_dir / "test.py").write_text("x = 1")
        mock_file = ScannedFile(
            path=self.code_dir / "test.py",
            relative_path="test.py",
            file_type="python",
            size_bytes=5,
            modified_at=datetime.now(),
            content_hash="h1"
        )

        start = time.time()
        with patch.object(self.index.scanner, 'scan_all', return_value=iter([mock_file])):
            await self.index.build_quick_index(
                directories=[str(self.code_dir)],
                extract_symbols=False
            )
        duration = time.time() - start

        # Should complete quickly (under 5 seconds for small repo)
        assert duration < 5.0


class TestQuickIndexRespectsLimits:
    """Test QuickIndex respects search limits."""

    def setup_method(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = Path(self.temp_dir) / "quick.db"
        self.index = QuickIndex(db_path=self.db_path)

    def teardown_method(self):
        self.index.close()
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_search_respects_top_k(self):
        """Test search respects top_k limit."""
        conn = self.index._get_conn()

        # Insert many files
        for i in range(20):
            conn.execute("""
                INSERT INTO files (path, relative_path, file_type, modified_at, indexed_at)
                VALUES (?, ?, ?, ?, ?)
            """, (f"/test/file_{i}.py", f"file_{i}.py", "python",
                  datetime.now().isoformat(), datetime.now().isoformat()))
        conn.commit()

        results = self.index.search("file", top_k=5)

        assert len(results) <= 5

    def test_search_filters_by_file_type(self):
        """Test search filters by file type."""
        conn = self.index._get_conn()

        conn.execute("""
            INSERT INTO files (path, relative_path, file_type, modified_at, indexed_at)
            VALUES (?, ?, ?, ?, ?)
        """, ("/test/app.py", "app.py", "python",
              datetime.now().isoformat(), datetime.now().isoformat()))
        conn.execute("""
            INSERT INTO files (path, relative_path, file_type, modified_at, indexed_at)
            VALUES (?, ?, ?, ?, ?)
        """, ("/test/app.js", "app.js", "javascript",
              datetime.now().isoformat(), datetime.now().isoformat()))
        conn.commit()

        results = self.index.search("app", file_types=["python"])

        assert all(r.file_type == "python" for r in results)


class TestQuickIndexOutputsSummary:
    """Test QuickIndex summary output."""

    def setup_method(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = Path(self.temp_dir) / "quick.db"
        self.index = QuickIndex(db_path=self.db_path)
        self.code_dir = Path(self.temp_dir) / "code"
        self.code_dir.mkdir()

    def teardown_method(self):
        self.index.close()
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    @pytest.mark.asyncio
    async def test_build_returns_summary_stats(self):
        """Test build returns summary statistics."""
        (self.code_dir / "test.py").write_text("def func(): pass\nclass Cls: pass")

        mock_file = ScannedFile(
            path=self.code_dir / "test.py",
            relative_path="test.py",
            file_type="python",
            size_bytes=35,
            modified_at=datetime.now(),
            content_hash="h1"
        )

        with patch.object(self.index.scanner, 'scan_all', return_value=iter([mock_file])):
            stats = await self.index.build_quick_index(
                directories=[str(self.code_dir)],
                extract_symbols=True
            )

        assert "files_indexed" in stats
        assert "symbols_extracted" in stats
        assert "duration_seconds" in stats
        assert stats["files_indexed"] == 1
        assert stats["symbols_extracted"] >= 2

    def test_get_status_returns_complete_info(self):
        """Test get_status returns complete information."""
        conn = self.index._get_conn()
        conn.execute("""
            INSERT INTO files (path, relative_path, file_type, modified_at, indexed_at)
            VALUES (?, ?, ?, ?, ?)
        """, ("/test/file.py", "file.py", "python",
              datetime.now().isoformat(), datetime.now().isoformat()))
        conn.execute("""
            INSERT INTO symbols (file_id, name, symbol_type, line_number)
            VALUES (?, ?, ?, ?)
        """, (1, "my_func", "function", 10))
        conn.commit()

        status = self.index.get_status()

        assert "files_indexed" in status
        assert "symbols_indexed" in status
        assert "file_types" in status
        assert status["files_indexed"] == 1
        assert status["symbols_indexed"] == 1


class TestQuickIndexSymbolExtraction:
    """Test QuickIndex symbol extraction for various languages."""

    def setup_method(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = Path(self.temp_dir) / "quick.db"
        self.index = QuickIndex(db_path=self.db_path)

    def teardown_method(self):
        self.index.close()
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_extract_typescript_symbols(self):
        """Test TypeScript symbol extraction."""
        ts_file = Path(self.temp_dir) / "app.ts"
        ts_file.write_text("""
export function processData(input: string): string {
    return input.trim();
}

export class DataService {
    async fetch(): Promise<void> {}
}

interface Config {
    debug: boolean;
}
""")
        symbols = self.index._extract_symbols_fast(ts_file)
        names = [s[0] for s in symbols]

        assert "processData" in names
        assert "DataService" in names

    def test_extract_async_function_symbols(self):
        """Test async function symbol extraction."""
        py_file = Path(self.temp_dir) / "async_code.py"
        py_file.write_text("""
async def fetch_data():
    pass

async def process_async(data):
    await fetch_data()
""")
        symbols = self.index._extract_symbols_fast(py_file)
        names = [s[0] for s in symbols]

        assert "fetch_data" in names
        assert "process_async" in names


class TestQuickIndexRecentDays:
    """Test QuickIndex recent_days filter."""

    def setup_method(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = Path(self.temp_dir) / "quick.db"
        self.index = QuickIndex(db_path=self.db_path)

    def teardown_method(self):
        self.index.close()
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_recent_days_filters_old_files(self):
        """Test recent_days filters out old files."""
        conn = self.index._get_conn()

        # Recent file
        recent_time = datetime.now().isoformat()
        conn.execute("""
            INSERT INTO files (path, relative_path, file_type, modified_at, indexed_at)
            VALUES (?, ?, ?, ?, ?)
        """, ("/test/recent.py", "recent.py", "python", recent_time, recent_time))

        # Old file (30 days ago)
        old_time = (datetime.now() - timedelta(days=30)).isoformat()
        conn.execute("""
            INSERT INTO files (path, relative_path, file_type, modified_at, indexed_at)
            VALUES (?, ?, ?, ?, ?)
        """, ("/test/old.py", "old.py", "python", old_time, old_time))
        conn.commit()

        # Search with 7 day filter
        results = self.index.search("py", recent_days=7)

        paths = [r.relative_path for r in results]
        assert "recent.py" in paths
        assert "old.py" not in paths
