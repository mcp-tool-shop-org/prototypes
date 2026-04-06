using Attestia.Core.Models;
using FluentAssertions;
using Xunit;

namespace Attestia.Tests.Models;

public class IntentExecutionTests
{
    [Theory]
    [InlineData("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890", true)]
    [InlineData("abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890", true)]
    [InlineData("0xABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890", true)]
    [InlineData("not-a-hash", false)]
    [InlineData("0x", false)]
    [InlineData("", false)]
    [InlineData("0xZZZZZZ1234567890abcdef1234567890abcdef1234567890abcdef1234567890", false)]
    [InlineData("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef123456789", false)] // 63 hex chars
    public void IsTxHashValid_VariousInputs_ReturnsExpected(string txHash, bool expected)
    {
        var execution = new IntentExecution
        {
            IntentId = "intent-001",
            ExecutedAt = "2026-01-15T12:00:00Z",
            ChainId = "ethereum-mainnet",
            TxHash = txHash,
        };

        execution.IsTxHashValid().Should().Be(expected);
    }
}
