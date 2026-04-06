using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Tests.Fixtures;

/// <summary>
/// Factory methods for creating test snippets at specific difficulty levels.
/// Used by session planner tests (Phase 2) and calibration validation tests.
/// </summary>
public static class SnippetFixtures
{
    /// <summary>
    /// Creates a snippet at the given difficulty level with a deterministic ID.
    /// </summary>
    public static Snippet AtDifficulty(int difficulty, string language = "python", int seq = 1)
    {
        return new Snippet
        {
            Id = $"test-{language}-d{difficulty}-{seq:D3}",
            Language = language,
            Difficulty = difficulty,
            Title = $"Test snippet D{difficulty} #{seq}",
            Code = GenerateCode(difficulty, $"builtin-{seq}"),
            Topics = new[] { "test" },
            Explain = new[] { $"Test snippet at difficulty {difficulty}" }
        };
    }

    /// <summary>
    /// Creates a pool of snippets spanning all 7 difficulty bands for a language.
    /// </summary>
    public static List<Snippet> FullPool(string language = "python", int perBand = 5)
    {
        var pool = new List<Snippet>();
        for (int d = 1; d <= 7; d++)
        {
            for (int seq = 1; seq <= perBand; seq++)
            {
                pool.Add(AtDifficulty(d, language, seq));
            }
        }
        return pool;
    }

    /// <summary>
    /// Creates a pool biased toward a specific difficulty band.
    /// Heavy = 10 items at target, Light = 3 items at all other bands.
    /// </summary>
    public static List<Snippet> BiasedPool(int targetDifficulty, string language = "python")
    {
        var pool = new List<Snippet>();
        for (int d = 1; d <= 7; d++)
        {
            int count = d == targetDifficulty ? 10 : 3;
            for (int seq = 1; seq <= count; seq++)
            {
                pool.Add(AtDifficulty(d, language, seq));
            }
        }
        return pool;
    }

    /// <summary>
    /// Creates a calibration-style snippet with the cal-{lang}-d{band}-{seq} ID format.
    /// </summary>
    public static Snippet CalibrationSnippet(int difficulty, string language = "python", int seq = 1)
    {
        string langCode = language switch
        {
            "python" => "py",
            "rust" => "rs",
            "javascript" => "js",
            "csharp" => "cs",
            "go" => "go",
            _ => language[..2]
        };

        return new Snippet
        {
            Id = $"cal-{langCode}-d{difficulty}-{seq:D3}",
            Language = language,
            Difficulty = difficulty,
            Title = $"Calibration D{difficulty} #{seq}",
            Code = GenerateCode(difficulty, $"cal-{seq}"),
            Topics = new[] { "calibration" },
            Explain = new[] { $"Calibration snippet at difficulty {difficulty}" }
        };
    }

    /// <summary>
    /// Creates a result for a snippet, simulating a typing session outcome.
    /// </summary>
    public static Result MakeResult(Snippet snippet, double wpm = 60, double accuracy = 95, int xp = 50)
    {
        int errors = (int)((100 - accuracy) / 2);
        int chars = snippet.Code.Length;

        return new Result(
            Timestamp: DateTimeOffset.UtcNow,
            Language: snippet.Language,
            SnippetId: snippet.Id,
            Wpm: wpm,
            Accuracy: accuracy,
            Errors: errors,
            CharactersTyped: chars,
            XpEarned: xp,
            Difficulty: snippet.Difficulty
        );
    }

    private static string GenerateCode(int difficulty, string salt = "")
    {
        // Salt ensures unique content-addressed IDs when code is ingested through ContentPipeline
        var tag = string.IsNullOrEmpty(salt) ? "" : $"# {salt}\n";
        return difficulty switch
        {
            1 => $"{tag}x = 42\n",
            2 => $"{tag}def greet(name):\n    return f\"Hello, {{name}}!\"\n",
            3 => $"{tag}def fibonacci(n):\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b\n",
            4 => $"{tag}class Stack:\n    def __init__(self):\n        self._items = []\n\n    def push(self, item):\n        self._items.append(item)\n\n    def pop(self):\n        if not self._items:\n            raise IndexError(\"empty\")\n        return self._items.pop()\n",
            5 => $"{tag}def retry(fn, max_attempts=3, delay=1.0):\n    import time\n    last_err = None\n    for attempt in range(1, max_attempts + 1):\n        try:\n            return fn()\n        except Exception as e:\n            last_err = e\n            if attempt < max_attempts:\n                time.sleep(delay * attempt)\n    raise last_err\n",
            6 => $"{tag}from collections import OrderedDict\n\nclass LRUCache:\n    def __init__(self, capacity):\n        self._capacity = capacity\n        self._cache = OrderedDict()\n\n    def get(self, key):\n        if key not in self._cache:\n            return None\n        self._cache.move_to_end(key)\n        return self._cache[key]\n\n    def put(self, key, value):\n        if key in self._cache:\n            self._cache.move_to_end(key)\n        elif len(self._cache) >= self._capacity:\n            self._cache.popitem(last=False)\n        self._cache[key] = value\n",
            7 => $"{tag}import ast\nfrom dataclasses import dataclass, field\nfrom typing import Optional\n\n@dataclass\nclass FnInfo:\n    name: str\n    lineno: int\n    args: list[str]\n    complexity: int = 1\n    nested: list[\"FnInfo\"] = field(default_factory=list)\n\nclass Visitor(ast.NodeVisitor):\n    def __init__(self):\n        self._stack: list[FnInfo] = []\n        self.functions: list[FnInfo] = []\n\n    def visit_FunctionDef(self, node):\n        info = FnInfo(node.name, node.lineno,\n                      [a.arg for a in node.args.args])\n        parent = self._stack[-1] if self._stack else None\n        if parent:\n            parent.nested.append(info)\n        else:\n            self.functions.append(info)\n        self._stack.append(info)\n        self.generic_visit(node)\n        self._stack.pop()\n",
            _ => $"{tag}x = 42\n"
        };
    }
}
