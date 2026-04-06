namespace DevOpTyper.Content.Models;

public sealed record CodeMetrics(int Lines, int Characters, float SymbolDensity, int MaxIndentDepth);
