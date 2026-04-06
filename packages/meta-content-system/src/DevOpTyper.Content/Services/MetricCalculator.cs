using DevOpTyper.Content.Abstractions;
using DevOpTyper.Content.Models;

namespace DevOpTyper.Content.Services;

public sealed class MetricCalculator : IMetricCalculator
{
    private static readonly HashSet<char> Symbols = new(new[]
    {
        '{','}','[',']','(',')','<','>',';',':',',','.',
        '=','+','-','*','/','%','!','&','|','^','~','?','@','#','\\',
        '"','\''
    });

    public CodeMetrics Compute(string normalizedText)
    {
        normalizedText ??= string.Empty;

        int lines = 1;
        for (int i = 0; i < normalizedText.Length; i++)
            if (normalizedText[i] == '\n') lines++;

        int chars = normalizedText.Length;

        int nonWs = 0;
        int sym = 0;

        // maxIndentDepth
        int maxIndentDepth = 0;
        int idx = 0;
        while (idx < normalizedText.Length)
        {
            int cols = 0;
            int j = idx;
            while (j < normalizedText.Length)
            {
                char c = normalizedText[j];
                if (c == ' ') { cols += 1; j++; continue; }
                if (c == '\t') { cols += 4; j++; continue; }
                break;
            }
            int depth = cols / 4;
            if (depth > maxIndentDepth) maxIndentDepth = depth;

            int end = normalizedText.IndexOf('\n', idx);
            if (end < 0) end = normalizedText.Length;
            idx = end + 1;
        }

        for (int i = 0; i < normalizedText.Length; i++)
        {
            char c = normalizedText[i];
            if (c == ' ' || c == '\t' || c == '\n') continue;
            nonWs++;
            if (Symbols.Contains(c)) sym++;
        }

        float density = nonWs == 0 ? 0.0f : (float)sym / nonWs;
        return new CodeMetrics(lines, chars, density, maxIndentDepth);
    }
}
