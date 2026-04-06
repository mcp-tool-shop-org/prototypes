using System.Diagnostics;
using LinuxDevTyper.Core.Models;

namespace LinuxDevTyper.Core.Typing;

public sealed class TypingSession
{
    private readonly Stopwatch _sw = new();
    private string _target = "";
    private string _language = "";
    private string _snippetId = "";
    private int _difficulty;
    private int _recentPlayCount;
    private TypingSessionOptions _options = new();

    // Per-character mistake tracking (deduped by position)
    private readonly List<MistakeRecord> _mistakes = new();
    private readonly HashSet<int> _recordedPositions = new();

    public bool Running { get; private set; }
    public bool Complete { get; private set; }

    public int Errors { get; private set; }
    public double Wpm { get; private set; }
    public double Accuracy { get; private set; } = 100.0;
    public int XpEarned { get; private set; }

    /// <summary>Per-character mistakes recorded during this session (first mistake per position only).</summary>
    public IReadOnlyList<MistakeRecord> Mistakes => _mistakes.AsReadOnly();

    public void Start(string target, string language = "", string snippetId = "",
                      TypingSessionOptions? options = null, int difficulty = 0,
                      int recentPlayCount = 0)
    {
        _language = language ?? "";
        _snippetId = snippetId ?? "";
        _difficulty = difficulty;
        _recentPlayCount = recentPlayCount;
        _options = options ?? new TypingSessionOptions();
        _target = Preprocess(target ?? "");
        Running = true;
        Complete = false;
        Errors = 0;
        Wpm = 0;
        Accuracy = 100.0;
        XpEarned = 0;

        _mistakes.Clear();
        _recordedPositions.Clear();

        _sw.Reset();
        _sw.Start();
    }

    public Result ToResult(SessionMetadata? metadata = null)
    {
        return new Result(
            Timestamp: DateTimeOffset.UtcNow,
            Language: _language,
            SnippetId: _snippetId,
            Wpm: Wpm,
            Accuracy: Accuracy,
            Errors: Errors,
            CharactersTyped: _target.Length,
            XpEarned: XpEarned,
            Difficulty: _difficulty,
            Mistakes: _mistakes.ToList(),
            Metadata: metadata
        );
    }

    public void Update(string typed)
    {
        if (!Running) return;
        typed = Preprocess(typed ?? "");

        // Hardcore mode: error-lock — can't advance past first wrong character
        if (_options.HardcoreMode)
        {
            for (int j = 0; j < Math.Min(typed.Length, _target.Length); j++)
            {
                if (typed[j] != _target[j])
                {
                    // Clamp: keep up to and including the wrong char, discard the rest
                    typed = typed[..(j + 1)];
                    break;
                }
            }
            // Also prevent typing beyond target length
            if (typed.Length > _target.Length)
                typed = typed[.._target.Length];
        }

        int minLen = Math.Min(typed.Length, _target.Length);
        int errors = 0;
        for (int i = 0; i < minLen; i++)
        {
            if (typed[i] != _target[i])
            {
                errors++;

                // Record first mistake at this position only
                if (!_recordedPositions.Contains(i))
                {
                    _mistakes.Add(new MistakeRecord(i, _target[i], typed[i], _snippetId));
                    _recordedPositions.Add(i);
                }
            }
        }

        errors += Math.Max(0, typed.Length - _target.Length);
        Errors = errors;

        int denom = Math.Max(1, Math.Max(_target.Length, typed.Length));
        Accuracy = 100.0 * (1.0 - (double)errors / denom);
        if (Accuracy < 0) Accuracy = 0;

        double minutes = Math.Max(1e-6, _sw.Elapsed.TotalMinutes);
        Wpm = (typed.Length / 5.0) / minutes;

        XpEarned = XpEngine.Calculate(Wpm, Accuracy, _recentPlayCount);

        if (typed == _target && errors == 0)
        {
            Complete = true;
            Running = false;
            _sw.Stop();
            XpEarned += XpEngine.CompletionBonus(_recentPlayCount);
        }
        else
        {
            Complete = false;
        }
    }

    private string Preprocess(string text)
    {
        if (_options.NormalizeLineEndings)
            text = text.Replace("\r\n", "\n").Replace("\r", "\n");

        if (_options.IgnoreTrailingSpaces)
        {
            var lines = text.Split('\n');
            for (int i = 0; i < lines.Length; i++)
                lines[i] = lines[i].TrimEnd(' ', '\t');
            text = string.Join("\n", lines);
        }

        if (!_options.StrictWhitespace)
        {
            // Collapse runs of whitespace to single space
            text = System.Text.RegularExpressions.Regex.Replace(text, @"[ \t]+", " ");
        }

        return text;
    }
}
