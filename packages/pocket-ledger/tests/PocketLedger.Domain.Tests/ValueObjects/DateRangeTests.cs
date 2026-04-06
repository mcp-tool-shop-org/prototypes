using FluentAssertions;
using PocketLedger.Domain.ValueObjects;
using Xunit;

namespace PocketLedger.Domain.Tests.ValueObjects;

public class DateRangeTests
{
    [Fact]
    public void Create_WithValidDates_ShouldCreateRange()
    {
        var start = new DateOnly(2024, 1, 1);
        var end = new DateOnly(2024, 1, 31);

        var range = DateRange.Create(start, end);

        range.StartDate.Should().Be(start);
        range.EndDate.Should().Be(end);
    }

    [Fact]
    public void Create_WithEndBeforeStart_ShouldThrow()
    {
        var start = new DateOnly(2024, 1, 31);
        var end = new DateOnly(2024, 1, 1);

        var act = () => DateRange.Create(start, end);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*before start*");
    }

    [Fact]
    public void ForMonth_ShouldReturnCorrectRange()
    {
        var range = DateRange.ForMonth(2024, 2);

        range.StartDate.Should().Be(new DateOnly(2024, 2, 1));
        range.EndDate.Should().Be(new DateOnly(2024, 2, 29)); // 2024 is a leap year
    }

    [Fact]
    public void ForYear_ShouldReturnCorrectRange()
    {
        var range = DateRange.ForYear(2024);

        range.StartDate.Should().Be(new DateOnly(2024, 1, 1));
        range.EndDate.Should().Be(new DateOnly(2024, 12, 31));
    }

    [Fact]
    public void Contains_WithDateInRange_ShouldReturnTrue()
    {
        var range = DateRange.ForMonth(2024, 1);
        var date = new DateOnly(2024, 1, 15);

        range.Contains(date).Should().BeTrue();
    }

    [Fact]
    public void Contains_WithDateOutsideRange_ShouldReturnFalse()
    {
        var range = DateRange.ForMonth(2024, 1);
        var date = new DateOnly(2024, 2, 1);

        range.Contains(date).Should().BeFalse();
    }

    [Fact]
    public void Contains_WithBoundaryDates_ShouldReturnTrue()
    {
        var range = DateRange.ForMonth(2024, 1);

        range.Contains(new DateOnly(2024, 1, 1)).Should().BeTrue();
        range.Contains(new DateOnly(2024, 1, 31)).Should().BeTrue();
    }

    [Fact]
    public void Overlaps_WithOverlappingRanges_ShouldReturnTrue()
    {
        var range1 = DateRange.Create(new DateOnly(2024, 1, 1), new DateOnly(2024, 1, 20));
        var range2 = DateRange.Create(new DateOnly(2024, 1, 15), new DateOnly(2024, 2, 10));

        range1.Overlaps(range2).Should().BeTrue();
        range2.Overlaps(range1).Should().BeTrue();
    }

    [Fact]
    public void Overlaps_WithNonOverlappingRanges_ShouldReturnFalse()
    {
        var range1 = DateRange.Create(new DateOnly(2024, 1, 1), new DateOnly(2024, 1, 10));
        var range2 = DateRange.Create(new DateOnly(2024, 1, 15), new DateOnly(2024, 1, 31));

        range1.Overlaps(range2).Should().BeFalse();
    }

    [Fact]
    public void TotalDays_ShouldReturnCorrectCount()
    {
        var range = DateRange.ForMonth(2024, 1);

        range.TotalDays.Should().Be(31);
    }

    [Fact]
    public void Equality_WithSameValues_ShouldBeEqual()
    {
        var range1 = DateRange.ForMonth(2024, 1);
        var range2 = DateRange.ForMonth(2024, 1);

        range1.Should().Be(range2);
    }
}
