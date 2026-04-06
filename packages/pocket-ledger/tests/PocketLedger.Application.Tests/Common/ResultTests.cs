using FluentAssertions;
using PocketLedger.Application.Common;
using Xunit;

namespace PocketLedger.Application.Tests.Common;

public class ResultTests
{
    [Fact]
    public void Success_ShouldCreateSuccessResult()
    {
        var result = Result.Success();

        result.IsSuccess.Should().BeTrue();
        result.IsFailure.Should().BeFalse();
        result.Error.Should().BeNull();
    }

    [Fact]
    public void Failure_ShouldCreateFailureResult()
    {
        var result = Result.Failure("Something went wrong");

        result.IsSuccess.Should().BeFalse();
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Be("Something went wrong");
    }

    [Fact]
    public void SuccessT_ShouldCreateSuccessWithValue()
    {
        var result = Result.Success(42);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(42);
    }

    [Fact]
    public void FailureT_ShouldCreateFailureWithoutValue()
    {
        var result = Result.Failure<int>("Error occurred");

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Error occurred");
    }

    [Fact]
    public void Value_OnFailure_ShouldThrow()
    {
        var result = Result.Failure<int>("Error");

        var act = () => _ = result.Value;

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void ImplicitConversion_ShouldWork()
    {
        Result<string> result = "Hello";

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be("Hello");
    }

    [Fact]
    public void Success_WithNullError_ShouldWork()
    {
        var result = Result.Success();

        result.Error.Should().BeNull();
    }

    [Fact]
    public void Failure_WithEmptyError_ShouldThrow()
    {
        var act = () => Result.Failure("");

        act.Should().Throw<InvalidOperationException>();
    }
}
