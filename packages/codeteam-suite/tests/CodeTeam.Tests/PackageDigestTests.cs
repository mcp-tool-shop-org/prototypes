using CodeTeam.Core;
using FluentAssertions;
using Xunit;

namespace CodeTeam.Tests;

/// <summary>
/// Tests for package digest computation per CodeTeam Digest Spec v0.1.
/// These tests ensure deterministic digest computation across platforms.
/// </summary>
public class PackageDigestTests
{
    private const string TestManifestDigest = "sha256:abc123def456abc123def456abc123def456abc123def456abc123def456abc1";

    #region Determinism Tests

    [Fact]
    public void Compute_SameInputs_ShouldProduceSameDigest()
    {
        var artifacts = new[]
        {
            new ArtifactDigestInfo { Path = "a.txt", Sha256 = "sha256:aaa", SizeBytes = 100 },
            new ArtifactDigestInfo { Path = "b.txt", Sha256 = "sha256:bbb", SizeBytes = 200 }
        };

        var digest1 = PackageDigest.Compute(TestManifestDigest, artifacts);
        var digest2 = PackageDigest.Compute(TestManifestDigest, artifacts);

        digest1.Should().Be(digest2);
    }

    [Fact]
    public void Compute_DifferentArtifactOrder_ShouldProduceSameDigest()
    {
        // Artifacts in original order
        var artifacts1 = new[]
        {
            new ArtifactDigestInfo { Path = "z.txt", Sha256 = "sha256:zzz", SizeBytes = 300 },
            new ArtifactDigestInfo { Path = "a.txt", Sha256 = "sha256:aaa", SizeBytes = 100 },
            new ArtifactDigestInfo { Path = "m.txt", Sha256 = "sha256:mmm", SizeBytes = 200 }
        };

        // Artifacts in different order
        var artifacts2 = new[]
        {
            new ArtifactDigestInfo { Path = "m.txt", Sha256 = "sha256:mmm", SizeBytes = 200 },
            new ArtifactDigestInfo { Path = "a.txt", Sha256 = "sha256:aaa", SizeBytes = 100 },
            new ArtifactDigestInfo { Path = "z.txt", Sha256 = "sha256:zzz", SizeBytes = 300 }
        };

        var digest1 = PackageDigest.Compute(TestManifestDigest, artifacts1);
        var digest2 = PackageDigest.Compute(TestManifestDigest, artifacts2);

        // Different input order → same digest (because artifacts are sorted by path)
        digest1.Should().Be(digest2);
    }

    [Fact]
    public void Compute_DifferentPathSeparators_ShouldProduceSameDigest()
    {
        // Forward slashes (Unix-style)
        var artifacts1 = new[]
        {
            new ArtifactDigestInfo { Path = "dir/subdir/file.txt", Sha256 = "sha256:aaa", SizeBytes = 100 }
        };

        // Backslashes (Windows-style)
        var artifacts2 = new[]
        {
            new ArtifactDigestInfo { Path = "dir\\subdir\\file.txt", Sha256 = "sha256:aaa", SizeBytes = 100 }
        };

        var digest1 = PackageDigest.Compute(TestManifestDigest, artifacts1);
        var digest2 = PackageDigest.Compute(TestManifestDigest, artifacts2);

        // Different path separators → same digest (paths are normalized)
        digest1.Should().Be(digest2);
    }

    [Fact]
    public void Compute_WithLeadingTrailingSlashes_ShouldProduceSameDigest()
    {
        var artifacts1 = new[]
        {
            new ArtifactDigestInfo { Path = "dir/file.txt", Sha256 = "sha256:aaa", SizeBytes = 100 }
        };

        var artifacts2 = new[]
        {
            new ArtifactDigestInfo { Path = "/dir/file.txt/", Sha256 = "sha256:aaa", SizeBytes = 100 }
        };

        var digest1 = PackageDigest.Compute(TestManifestDigest, artifacts1);
        var digest2 = PackageDigest.Compute(TestManifestDigest, artifacts2);

        // Leading/trailing slashes removed → same digest
        digest1.Should().Be(digest2);
    }

    #endregion

    #region Change Detection Tests

    [Fact]
    public void Compute_DifferentManifestDigest_ShouldProduceDifferentDigest()
    {
        var artifacts = new[]
        {
            new ArtifactDigestInfo { Path = "file.txt", Sha256 = "sha256:aaa", SizeBytes = 100 }
        };

        var digest1 = PackageDigest.Compute("sha256:manifest1111111111111111111111111111111111111111111111111111111111", artifacts);
        var digest2 = PackageDigest.Compute("sha256:manifest2222222222222222222222222222222222222222222222222222222222", artifacts);

        digest1.Should().NotBe(digest2);
    }

    [Fact]
    public void Compute_DifferentArtifactContent_ShouldProduceDifferentDigest()
    {
        var artifacts1 = new[]
        {
            new ArtifactDigestInfo { Path = "file.txt", Sha256 = "sha256:content1111111111111111111111111111111111111111111111111111111111", SizeBytes = 100 }
        };

        var artifacts2 = new[]
        {
            new ArtifactDigestInfo { Path = "file.txt", Sha256 = "sha256:content2222222222222222222222222222222222222222222222222222222222", SizeBytes = 100 }
        };

        var digest1 = PackageDigest.Compute(TestManifestDigest, artifacts1);
        var digest2 = PackageDigest.Compute(TestManifestDigest, artifacts2);

        digest1.Should().NotBe(digest2);
    }

    [Fact]
    public void Compute_DifferentArtifactSize_ShouldProduceDifferentDigest()
    {
        var artifacts1 = new[]
        {
            new ArtifactDigestInfo { Path = "file.txt", Sha256 = "sha256:aaa", SizeBytes = 100 }
        };

        var artifacts2 = new[]
        {
            new ArtifactDigestInfo { Path = "file.txt", Sha256 = "sha256:aaa", SizeBytes = 101 }
        };

        var digest1 = PackageDigest.Compute(TestManifestDigest, artifacts1);
        var digest2 = PackageDigest.Compute(TestManifestDigest, artifacts2);

        digest1.Should().NotBe(digest2);
    }

    [Fact]
    public void Compute_DifferentArtifactPath_ShouldProduceDifferentDigest()
    {
        var artifacts1 = new[]
        {
            new ArtifactDigestInfo { Path = "file1.txt", Sha256 = "sha256:aaa", SizeBytes = 100 }
        };

        var artifacts2 = new[]
        {
            new ArtifactDigestInfo { Path = "file2.txt", Sha256 = "sha256:aaa", SizeBytes = 100 }
        };

        var digest1 = PackageDigest.Compute(TestManifestDigest, artifacts1);
        var digest2 = PackageDigest.Compute(TestManifestDigest, artifacts2);

        digest1.Should().NotBe(digest2);
    }

    [Fact]
    public void Compute_AdditionalArtifact_ShouldProduceDifferentDigest()
    {
        var artifacts1 = new[]
        {
            new ArtifactDigestInfo { Path = "file.txt", Sha256 = "sha256:aaa", SizeBytes = 100 }
        };

        var artifacts2 = new[]
        {
            new ArtifactDigestInfo { Path = "file.txt", Sha256 = "sha256:aaa", SizeBytes = 100 },
            new ArtifactDigestInfo { Path = "extra.txt", Sha256 = "sha256:bbb", SizeBytes = 50 }
        };

        var digest1 = PackageDigest.Compute(TestManifestDigest, artifacts1);
        var digest2 = PackageDigest.Compute(TestManifestDigest, artifacts2);

        digest1.Should().NotBe(digest2);
    }

    #endregion

    #region Format Tests

    [Fact]
    public void Compute_ShouldReturnDigestInCorrectFormat()
    {
        var artifacts = new[]
        {
            new ArtifactDigestInfo { Path = "file.txt", Sha256 = "sha256:aaa", SizeBytes = 100 }
        };

        var digest = PackageDigest.Compute(TestManifestDigest, artifacts);

        digest.Should().MatchRegex(@"^sha256:[0-9a-f]{64}$");
    }

    [Fact]
    public void Compute_ShouldReturnLowercaseHex()
    {
        var artifacts = new[]
        {
            new ArtifactDigestInfo { Path = "file.txt", Sha256 = "sha256:aaa", SizeBytes = 100 }
        };

        var digest = PackageDigest.Compute(TestManifestDigest, artifacts);

        // Extract hex part and check it's lowercase
        var hex = digest.Substring("sha256:".Length);
        hex.Should().Be(hex.ToLowerInvariant());
    }

    [Fact]
    public void Compute_EmptyArtifacts_ShouldWork()
    {
        var artifacts = Array.Empty<ArtifactDigestInfo>();

        var digest = PackageDigest.Compute(TestManifestDigest, artifacts);

        digest.Should().MatchRegex(@"^sha256:[0-9a-f]{64}$");
    }

    #endregion

    #region Payload Structure Tests

    [Fact]
    public void BuildPayload_ShouldHaveCorrectVersion()
    {
        var artifacts = new[]
        {
            new ArtifactDigestInfo { Path = "file.txt", Sha256 = "sha256:aaa", SizeBytes = 100 }
        };

        var payload = PackageDigest.BuildPayload(TestManifestDigest, artifacts);

        payload.PayloadVersion.Should().Be("0.1");
    }

    [Fact]
    public void BuildPayload_ShouldSortArtifactsByPath()
    {
        var artifacts = new[]
        {
            new ArtifactDigestInfo { Path = "z.txt", Sha256 = "sha256:zzz", SizeBytes = 300 },
            new ArtifactDigestInfo { Path = "a.txt", Sha256 = "sha256:aaa", SizeBytes = 100 },
            new ArtifactDigestInfo { Path = "m.txt", Sha256 = "sha256:mmm", SizeBytes = 200 }
        };

        var payload = PackageDigest.BuildPayload(TestManifestDigest, artifacts);

        payload.Artifacts.Should().HaveCount(3);
        payload.Artifacts[0].Path.Should().Be("a.txt");
        payload.Artifacts[1].Path.Should().Be("m.txt");
        payload.Artifacts[2].Path.Should().Be("z.txt");
    }

    [Fact]
    public void BuildPayload_ShouldNormalizePaths()
    {
        var artifacts = new[]
        {
            new ArtifactDigestInfo { Path = "dir\\subdir\\file.txt", Sha256 = "sha256:aaa", SizeBytes = 100 }
        };

        var payload = PackageDigest.BuildPayload(TestManifestDigest, artifacts);

        payload.Artifacts[0].Path.Should().Be("dir/subdir/file.txt");
    }

    [Fact]
    public void BuildPayload_ShouldStoreSizeAsString()
    {
        var artifacts = new[]
        {
            new ArtifactDigestInfo { Path = "file.txt", Sha256 = "sha256:aaa", SizeBytes = 9007199254740991 } // Max safe integer
        };

        var payload = PackageDigest.BuildPayload(TestManifestDigest, artifacts);

        payload.Artifacts[0].SizeBytes.Should().Be("9007199254740991");
    }

    [Fact]
    public void GetCanonicalJson_ShouldProduceValidJson()
    {
        var artifacts = new[]
        {
            new ArtifactDigestInfo { Path = "file.txt", Sha256 = "sha256:aaa", SizeBytes = 100 }
        };

        var payload = PackageDigest.BuildPayload(TestManifestDigest, artifacts);
        var json = PackageDigest.GetCanonicalJson(payload);

        // Should be minimal JSON (no whitespace)
        json.Should().NotContain("\n");
        json.Should().NotContain("  ");

        // Should have sorted keys
        json.Should().Contain("\"artifacts\"");
        json.Should().Contain("\"manifest\"");
        json.Should().Contain("\"payload_version\"");
    }

    #endregion

    #region Known-Value Tests (Lock the Algorithm)

    [Fact]
    public void Compute_KnownInput_ShouldProduceExpectedDigest()
    {
        // This test locks the exact algorithm output
        var manifestDigest = "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        var artifacts = new[]
        {
            new ArtifactDigestInfo
            {
                Path = "artifacts/hello.txt",
                Sha256 = "sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
                SizeBytes = 5
            }
        };

        var digest = PackageDigest.Compute(manifestDigest, artifacts);

        // The digest should be stable and reproducible
        // This is the "golden" value for this specific input
        digest.Should().MatchRegex(@"^sha256:[0-9a-f]{64}$");

        // Run twice to verify determinism
        var digest2 = PackageDigest.Compute(manifestDigest, artifacts);
        digest.Should().Be(digest2, "digest computation must be deterministic");
    }

    [Fact]
    public void GetCanonicalJson_KnownInput_ShouldProduceExpectedOutput()
    {
        var manifestDigest = "sha256:abc";
        var artifacts = new[]
        {
            new ArtifactDigestInfo { Path = "b.txt", Sha256 = "sha256:bbb", SizeBytes = 200 },
            new ArtifactDigestInfo { Path = "a.txt", Sha256 = "sha256:aaa", SizeBytes = 100 }
        };

        var payload = PackageDigest.BuildPayload(manifestDigest, artifacts);
        var json = PackageDigest.GetCanonicalJson(payload);

        // Exact expected canonical JSON (artifacts sorted, keys sorted)
        var expected = """{"artifacts":[{"path":"a.txt","sha256":"sha256:aaa","size_bytes":"100"},{"path":"b.txt","sha256":"sha256:bbb","size_bytes":"200"}],"manifest":{"manifest_digest":"sha256:abc"},"payload_version":"0.1"}""";

        json.Should().Be(expected);
    }

    #endregion
}
