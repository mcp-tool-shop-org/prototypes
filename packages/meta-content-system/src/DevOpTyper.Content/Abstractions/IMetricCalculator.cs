using DevOpTyper.Content.Models;

namespace DevOpTyper.Content.Abstractions;

public interface IMetricCalculator
{
    CodeMetrics Compute(string normalizedText);
}
