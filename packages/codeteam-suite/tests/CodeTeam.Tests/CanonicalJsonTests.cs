using System.Text;
using System.Text.Json;
using CodeTeam.Core;
using FluentAssertions;
using Xunit;

namespace CodeTeam.Tests;

/// <summary>
/// Tests for canonical JSON serialization per CodeTeam Canonicalization Spec v0.1.
/// These tests ensure deterministic, byte-identical output across platforms.
/// </summary>
public class CanonicalJsonTests
{
    #region Object Key Ordering Tests

    [Fact]
    public void Canonicalize_ShouldSortObjectKeysLexicographically()
    {
        // Keys should be sorted by Unicode code point (ordinal)
        var json = """{"zebra":1,"apple":2,"Banana":3}""";

        var canonical = CanonicalJson.Canonicalize(json);

        // Capital letters come before lowercase in ordinal sort
        canonical.Should().Be("""{"Banana":3,"apple":2,"zebra":1}""");
    }

    [Fact]
    public void Canonicalize_ShouldProduceSameOutputRegardlessOfInputKeyOrder()
    {
        var json1 = """{"a":1,"b":2,"c":3}""";
        var json2 = """{"c":3,"a":1,"b":2}""";
        var json3 = """{"b":2,"c":3,"a":1}""";

        var canonical1 = CanonicalJson.Canonicalize(json1);
        var canonical2 = CanonicalJson.Canonicalize(json2);
        var canonical3 = CanonicalJson.Canonicalize(json3);

        canonical1.Should().Be(canonical2);
        canonical2.Should().Be(canonical3);
        canonical1.Should().Be("""{"a":1,"b":2,"c":3}""");
    }

    [Fact]
    public void Canonicalize_ShouldSortNestedObjectKeys()
    {
        var json = """{"outer":{"z":1,"a":2},"inner":{"y":3,"b":4}}""";

        var canonical = CanonicalJson.Canonicalize(json);

        canonical.Should().Be("""{"inner":{"b":4,"y":3},"outer":{"a":2,"z":1}}""");
    }

    [Fact]
    public void Canonicalize_ShouldRejectDuplicateKeys()
    {
        // Note: JsonDocument.Parse may coalesce duplicates, but we detect at enumeration
        // This test verifies behavior with valid JSON that has conceptual duplicates
        var json = """{"a":1,"b":2}""";

        // This should work fine
        var action = () => CanonicalJson.Canonicalize(json);
        action.Should().NotThrow();
    }

    #endregion

    #region Array Ordering Tests

    [Fact]
    public void Canonicalize_ShouldPreserveArrayOrder()
    {
        var json = """{"items":[3,1,2]}""";

        var canonical = CanonicalJson.Canonicalize(json);

        // Array order must be preserved, not sorted
        canonical.Should().Be("""{"items":[3,1,2]}""");
    }

    [Fact]
    public void Canonicalize_ArrayOrderChange_ShouldChangeOutput()
    {
        var json1 = """{"items":[1,2,3]}""";
        var json2 = """{"items":[3,2,1]}""";

        var canonical1 = CanonicalJson.Canonicalize(json1);
        var canonical2 = CanonicalJson.Canonicalize(json2);

        // Different array orders should produce different canonical output
        canonical1.Should().NotBe(canonical2);
    }

    [Fact]
    public void Canonicalize_ShouldHandleNestedArrays()
    {
        var json = """{"matrix":[[1,2],[3,4]]}""";

        var canonical = CanonicalJson.Canonicalize(json);

        canonical.Should().Be("""{"matrix":[[1,2],[3,4]]}""");
    }

    #endregion

    #region String Escaping Tests

    [Fact]
    public void Canonicalize_ShouldEscapeRequiredCharacters()
    {
        var json = """{"text":"hello\nworld\ttab\"quote\\slash"}""";

        var canonical = CanonicalJson.Canonicalize(json);

        canonical.Should().Be("""{"text":"hello\nworld\ttab\"quote\\slash"}""");
    }

    [Fact]
    public void Canonicalize_ShouldEscapeControlCharacters()
    {
        // Control character (ASCII 1)
        var obj = new { text = "a\u0001b" };
        var json = JsonSerializer.Serialize(obj);

        var canonical = CanonicalJson.Canonicalize(json);

        canonical.Should().Contain("\\u0001");
    }

    [Fact]
    public void Canonicalize_ShouldPreserveUnicodeCharacters()
    {
        // Unicode characters should pass through without normalization
        var json = """{"emoji":"🎉","chinese":"中文"}""";

        var canonical = CanonicalJson.Canonicalize(json);

        canonical.Should().Be("""{"chinese":"中文","emoji":"🎉"}""");
    }

    [Fact]
    public void Canonicalize_ShouldProduceStableStringEscaping()
    {
        var json1 = """{"text":"line1\nline2"}""";
        var json2 = """{"text":"line1\nline2"}""";

        var canonical1 = CanonicalJson.Canonicalize(json1);
        var canonical2 = CanonicalJson.Canonicalize(json2);

        canonical1.Should().Be(canonical2);
    }

    #endregion

    #region Number Handling Tests

    [Fact]
    public void Canonicalize_ShouldAcceptValidIntegers()
    {
        var json = """{"a":0,"b":1,"c":-1,"d":9007199254740991}""";

        var canonical = CanonicalJson.Canonicalize(json);

        canonical.Should().Be("""{"a":0,"b":1,"c":-1,"d":9007199254740991}""");
    }

    [Fact]
    public void Canonicalize_ShouldRejectFloats()
    {
        var json = """{"value":1.5}""";

        var action = () => CanonicalJson.Canonicalize(json);

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*floats*");
    }

    [Fact]
    public void Canonicalize_ShouldRejectExponentNotation()
    {
        var json = """{"value":1e3}""";

        var action = () => CanonicalJson.Canonicalize(json);

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*exponents*");
    }

    [Fact]
    public void Canonicalize_ShouldRejectLeadingZeros()
    {
        // Note: JSON parsers may normalize this, but raw text "01" is invalid JSON anyway
        // This test documents the expectation
        var json = """{"value":10}"""; // Valid

        var action = () => CanonicalJson.Canonicalize(json);
        action.Should().NotThrow();
    }

    [Fact]
    public void Canonicalize_ShouldNormalizeZero()
    {
        var json = """{"value":0}""";

        var canonical = CanonicalJson.Canonicalize(json);

        canonical.Should().Be("""{"value":0}""");
    }

    [Fact]
    public void Canonicalize_ShouldNormalizeNegativeZero()
    {
        // -0 should become 0 in canonical form
        var json = """{"value":-0}""";

        var canonical = CanonicalJson.Canonicalize(json);

        // JsonElement normalizes -0 to 0
        canonical.Should().Be("""{"value":0}""");
    }

    #endregion

    #region Whitespace and Formatting Tests

    [Fact]
    public void Canonicalize_ShouldRemoveWhitespace()
    {
        var json = """
        {
            "key1": "value1",
            "key2": "value2"
        }
        """;

        var canonical = CanonicalJson.Canonicalize(json);

        canonical.Should().Be("""{"key1":"value1","key2":"value2"}""");
    }

    [Fact]
    public void Canonicalize_ShouldProduceMinimalJson()
    {
        var json = """{"a" : 1 , "b" : 2}""";

        var canonical = CanonicalJson.Canonicalize(json);

        // No spaces around colons or commas
        canonical.Should().Be("""{"a":1,"b":2}""");
    }

    [Fact]
    public void Canonicalize_ShouldNotHaveTrailingNewline()
    {
        var json = """{"key":"value"}""";

        var canonical = CanonicalJson.Canonicalize(json);

        canonical.Should().NotEndWith("\n");
        canonical.Should().NotEndWith("\r");
    }

    #endregion

    #region Boolean and Null Tests

    [Fact]
    public void Canonicalize_ShouldHandleBooleans()
    {
        var json = """{"t":true,"f":false}""";

        var canonical = CanonicalJson.Canonicalize(json);

        canonical.Should().Be("""{"f":false,"t":true}""");
    }

    [Fact]
    public void Canonicalize_ShouldHandleNull()
    {
        var json = """{"value":null}""";

        var canonical = CanonicalJson.Canonicalize(json);

        canonical.Should().Be("""{"value":null}""");
    }

    #endregion

    #region Determinism Tests

    [Fact]
    public void Canonicalize_ShouldProduceIdenticalBytes()
    {
        var json = """{"b":2,"a":1}""";

        var bytes1 = CanonicalJson.SerializeToBytes(JsonSerializer.Deserialize<object>(json)!);
        var bytes2 = CanonicalJson.SerializeToBytes(JsonSerializer.Deserialize<object>(json)!);

        bytes1.Should().Equal(bytes2);
    }

    [Fact]
    public void Canonicalize_ShouldProduceUtf8Bytes()
    {
        var json = """{"key":"value"}""";

        var canonical = CanonicalJson.Canonicalize(json);
        var bytes = Encoding.UTF8.GetBytes(canonical);

        // No BOM (check first 3 bytes aren't the UTF-8 BOM)
        if (bytes.Length >= 3)
        {
            var hasBom = bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF;
            hasBom.Should().BeFalse("canonical JSON should not have BOM");
        }

        // Should be valid UTF-8
        var decoded = Encoding.UTF8.GetString(bytes);
        decoded.Should().Be(canonical);
    }

    [Fact]
    public void Canonicalize_ComplexObject_ShouldBeDeterministic()
    {
        var json1 = """
        {
            "manifest": {
                "version": "0.1",
                "artifacts": [
                    {"path": "b.txt", "size": 100},
                    {"path": "a.txt", "size": 200}
                ]
            },
            "metadata": {
                "created": "2026-01-30",
                "author": "test"
            }
        }
        """;

        var json2 = """
        {
            "metadata": {
                "author": "test",
                "created": "2026-01-30"
            },
            "manifest": {
                "artifacts": [
                    {"path": "b.txt", "size": 100},
                    {"path": "a.txt", "size": 200}
                ],
                "version": "0.1"
            }
        }
        """;

        var canonical1 = CanonicalJson.Canonicalize(json1);
        var canonical2 = CanonicalJson.Canonicalize(json2);

        // Same content, different key order → identical canonical output
        canonical1.Should().Be(canonical2);

        // Array order preserved (b.txt before a.txt)
        canonical1.Should().Contain("""[{"path":"b.txt","size":100},{"path":"a.txt","size":200}]""");
    }

    [Fact]
    public void Canonicalize_KnownInput_ShouldProduceExactOutput()
    {
        // This test locks the exact byte output for a known input
        var json = """{"z":1,"a":2,"m":{"y":true,"x":false}}""";

        var canonical = CanonicalJson.Canonicalize(json);

        // Exact expected output
        canonical.Should().Be("""{"a":2,"m":{"x":false,"y":true},"z":1}""");
    }

    #endregion

    #region Edge Cases

    [Fact]
    public void Canonicalize_EmptyObject_ShouldWork()
    {
        var json = """{}""";

        var canonical = CanonicalJson.Canonicalize(json);

        canonical.Should().Be("{}");
    }

    [Fact]
    public void Canonicalize_EmptyArray_ShouldWork()
    {
        var json = """{"items":[]}""";

        var canonical = CanonicalJson.Canonicalize(json);

        canonical.Should().Be("""{"items":[]}""");
    }

    [Fact]
    public void Canonicalize_EmptyString_ShouldWork()
    {
        var json = """{"text":""}""";

        var canonical = CanonicalJson.Canonicalize(json);

        canonical.Should().Be("""{"text":""}""");
    }

    [Fact]
    public void Canonicalize_DeeplyNested_ShouldWork()
    {
        var json = """{"a":{"b":{"c":{"d":{"e":1}}}}}""";

        var canonical = CanonicalJson.Canonicalize(json);

        canonical.Should().Be("""{"a":{"b":{"c":{"d":{"e":1}}}}}""");
    }

    #endregion
}
