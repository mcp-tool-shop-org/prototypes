using Attestia.Core.Models;
using FluentAssertions;
using Xunit;

namespace Attestia.Tests.Models;

public class IntentTests
{
    private static Intent CreateValidIntent() => new()
    {
        Id = "intent-001",
        Status = IntentStatus.Declared,
        Kind = "transfer",
        Description = "Transfer 100 USDC to recipient",
        DeclaredBy = "user-abc",
        DeclaredAt = "2026-01-15T10:30:00Z",
        Params = new Dictionary<string, object?>
        {
            ["to"] = "0xRecipient",
            ["amount"] = "100",
        },
    };

    [Fact]
    public void Validate_ValidIntent_ReturnsNoErrors()
    {
        var intent = CreateValidIntent();
        var errors = intent.Validate();
        errors.Should().BeEmpty();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_EmptyId_ReturnsError(string id)
    {
        var intent = CreateValidIntent() with { Id = id };
        var errors = intent.Validate();
        errors.Should().Contain(e => e.Contains("Id"));
    }

    [Fact]
    public void Validate_IdExceedsMaxLength_ReturnsError()
    {
        var intent = CreateValidIntent() with { Id = new string('x', Intent.MaxIdLength + 1) };
        var errors = intent.Validate();
        errors.Should().Contain(e => e.Contains("Id") && e.Contains($"{Intent.MaxIdLength}"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_EmptyKind_ReturnsError(string kind)
    {
        var intent = CreateValidIntent() with { Kind = kind };
        var errors = intent.Validate();
        errors.Should().Contain(e => e.Contains("Kind"));
    }

    [Fact]
    public void Validate_KindExceedsMaxLength_ReturnsError()
    {
        var intent = CreateValidIntent() with { Kind = new string('k', Intent.MaxKindLength + 1) };
        var errors = intent.Validate();
        errors.Should().Contain(e => e.Contains("Kind") && e.Contains($"{Intent.MaxKindLength}"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_EmptyDescription_ReturnsError(string description)
    {
        var intent = CreateValidIntent() with { Description = description };
        var errors = intent.Validate();
        errors.Should().Contain(e => e.Contains("Description"));
    }

    [Fact]
    public void Validate_DescriptionExceedsMaxLength_ReturnsError()
    {
        var intent = CreateValidIntent() with { Description = new string('d', Intent.MaxDescriptionLength + 1) };
        var errors = intent.Validate();
        errors.Should().Contain(e => e.Contains("Description") && e.Contains($"{Intent.MaxDescriptionLength}"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_EmptyDeclaredBy_ReturnsError(string declaredBy)
    {
        var intent = CreateValidIntent() with { DeclaredBy = declaredBy };
        var errors = intent.Validate();
        errors.Should().Contain(e => e.Contains("DeclaredBy"));
    }

    [Fact]
    public void Validate_DeclaredByExceedsMaxLength_ReturnsError()
    {
        var intent = CreateValidIntent() with { DeclaredBy = new string('u', Intent.MaxDeclaredByLength + 1) };
        var errors = intent.Validate();
        errors.Should().Contain(e => e.Contains("DeclaredBy") && e.Contains($"{Intent.MaxDeclaredByLength}"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_EmptyDeclaredAt_ReturnsError(string declaredAt)
    {
        var intent = CreateValidIntent() with { DeclaredAt = declaredAt };
        var errors = intent.Validate();
        errors.Should().Contain(e => e.Contains("DeclaredAt"));
    }

    [Fact]
    public void Validate_TooManyParams_ReturnsError()
    {
        var largeParams = Enumerable.Range(0, Intent.MaxParamsCount + 1)
            .ToDictionary(i => $"key{i}", i => (object?)i);
        var intent = CreateValidIntent() with { Params = largeParams };
        var errors = intent.Validate();
        errors.Should().Contain(e => e.Contains("Params") && e.Contains($"{Intent.MaxParamsCount}"));
    }

    [Fact]
    public void Validate_MaxParamsExactly_ReturnsNoError()
    {
        var maxParams = Enumerable.Range(0, Intent.MaxParamsCount)
            .ToDictionary(i => $"key{i}", i => (object?)i);
        var intent = CreateValidIntent() with { Params = maxParams };
        var errors = intent.Validate();
        errors.Should().BeEmpty();
    }

    [Fact]
    public void Validate_MultipleErrors_ReturnsAll()
    {
        var intent = CreateValidIntent() with
        {
            Id = "",
            Kind = "",
            Description = "",
        };
        var errors = intent.Validate();
        errors.Should().HaveCountGreaterThanOrEqualTo(3);
    }

    [Fact]
    public void IntentStatus_AllValuesAreDefined()
    {
        var values = Enum.GetValues<IntentStatus>();
        values.Should().HaveCount(7);
        values.Should().Contain(IntentStatus.Declared);
        values.Should().Contain(IntentStatus.Verified);
        values.Should().Contain(IntentStatus.Failed);
    }
}
