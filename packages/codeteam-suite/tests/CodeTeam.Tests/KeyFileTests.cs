using System.Security.Cryptography;
using System.Text;
using CodeTeam.Crypto;
using FluentAssertions;
using NSec.Cryptography;
using Xunit;

namespace CodeTeam.Tests;

/// <summary>
/// Tests for key file handling.
/// </summary>
public class KeyFileTests
{
    #region Generation Tests

    [Fact]
    public void Generate_ShouldCreateValidKeyFile()
    {
        var keyFile = KeyFile.Generate();

        keyFile.Kty.Should().Be("OKP");
        keyFile.Crv.Should().Be("Ed25519");
        keyFile.D.Should().NotBeNullOrEmpty();
        keyFile.X.Should().NotBeNullOrEmpty();
        keyFile.Kid.Should().MatchRegex("^[0-9a-f]{16}$");
    }

    [Fact]
    public void Generate_ShouldCreateUniqueKeys()
    {
        var key1 = KeyFile.Generate();
        var key2 = KeyFile.Generate();

        key1.Kid.Should().NotBe(key2.Kid);
        key1.D.Should().NotBe(key2.D);
        key1.X.Should().NotBe(key2.X);
    }

    [Fact]
    public void GenerateFromSeed_ShouldBeDeterministic()
    {
        var seed = SHA256.HashData(Encoding.UTF8.GetBytes("test-seed"));

        var key1 = KeyFile.GenerateFromSeed(seed);
        var key2 = KeyFile.GenerateFromSeed(seed);

        key1.Kid.Should().Be(key2.Kid);
        key1.D.Should().Be(key2.D);
        key1.X.Should().Be(key2.X);
    }

    [Fact]
    public void GenerateFromSeed_DifferentSeeds_ShouldProduceDifferentKeys()
    {
        var seed1 = SHA256.HashData(Encoding.UTF8.GetBytes("seed-1"));
        var seed2 = SHA256.HashData(Encoding.UTF8.GetBytes("seed-2"));

        var key1 = KeyFile.GenerateFromSeed(seed1);
        var key2 = KeyFile.GenerateFromSeed(seed2);

        key1.Kid.Should().NotBe(key2.Kid);
    }

    [Fact]
    public void GenerateFromSeed_InvalidSeedLength_ShouldThrow()
    {
        var shortSeed = new byte[16];

        var action = () => KeyFile.GenerateFromSeed(shortSeed);

        action.Should().Throw<ArgumentException>();
    }

    #endregion

    #region Key ID Tests

    [Fact]
    public void ComputeKeyId_ShouldBeFirst16HexChars()
    {
        var publicKeyBytes = new byte[32];
        Array.Fill<byte>(publicKeyBytes, 0xAB);

        var keyId = KeyFile.ComputeKeyId(publicKeyBytes);

        // SHA256 of 32 bytes of 0xAB, first 16 hex chars
        var expectedHash = SHA256.HashData(publicKeyBytes);
        var expectedKeyId = Convert.ToHexString(expectedHash).ToLowerInvariant().Substring(0, 16);

        keyId.Should().Be(expectedKeyId);
        keyId.Should().HaveLength(16);
    }

    [Fact]
    public void ComputeKeyId_ShouldBeLowercase()
    {
        var seed = SHA256.HashData(Encoding.UTF8.GetBytes("test"));
        var key = KeyFile.GenerateFromSeed(seed);

        key.Kid.Should().MatchRegex("^[0-9a-f]+$", "Key ID should be lowercase hex");
    }

    #endregion

    #region Serialization Tests

    [Fact]
    public void Serialize_ShouldProduceValidJson()
    {
        var keyFile = KeyFile.Generate();

        var json = KeyFile.Serialize(keyFile);

        json.Should().Contain("\"kty\"");
        json.Should().Contain("\"crv\"");
        json.Should().Contain("\"d\"");
        json.Should().Contain("\"x\"");
        json.Should().Contain("\"kid\"");
    }

    [Fact]
    public void Parse_ShouldRoundTrip()
    {
        var original = KeyFile.Generate();
        var json = KeyFile.Serialize(original);

        var parsed = KeyFile.Parse(json);

        parsed.Kty.Should().Be(original.Kty);
        parsed.Crv.Should().Be(original.Crv);
        parsed.D.Should().Be(original.D);
        parsed.X.Should().Be(original.X);
        parsed.Kid.Should().Be(original.Kid);
    }

    [Fact]
    public void Parse_InvalidKty_ShouldThrow()
    {
        var json = """{"kty":"RSA","crv":"Ed25519","d":"abc","x":"def","kid":"0123456789abcdef"}""";

        var action = () => KeyFile.Parse(json);

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*key type*");
    }

    [Fact]
    public void Parse_InvalidCrv_ShouldThrow()
    {
        var json = """{"kty":"OKP","crv":"P-256","d":"abc","x":"def","kid":"0123456789abcdef"}""";

        var action = () => KeyFile.Parse(json);

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*curve*");
    }

    [Fact]
    public void Parse_MissingPrivateKey_ShouldThrow()
    {
        var json = """{"kty":"OKP","crv":"Ed25519","x":"def","kid":"0123456789abcdef"}""";

        var action = () => KeyFile.Parse(json);

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*private key*");
    }

    #endregion

    #region Signing Tests

    [Fact]
    public void Sign_ShouldProduceValidSignature()
    {
        var keyFile = KeyFile.Generate();
        var message = Encoding.UTF8.GetBytes("test message");

        var signature = KeyFile.Sign(keyFile, message);

        signature.Should().HaveCount(64, "Ed25519 signatures are 64 bytes");
    }

    [Fact]
    public void Sign_SameMessage_ShouldProduceSameSignature()
    {
        var keyFile = KeyFile.Generate();
        var message = Encoding.UTF8.GetBytes("test message");

        var sig1 = KeyFile.Sign(keyFile, message);
        var sig2 = KeyFile.Sign(keyFile, message);

        sig1.Should().Equal(sig2);
    }

    [Fact]
    public void Sign_DifferentMessages_ShouldProduceDifferentSignatures()
    {
        var keyFile = KeyFile.Generate();
        var message1 = Encoding.UTF8.GetBytes("message 1");
        var message2 = Encoding.UTF8.GetBytes("message 2");

        var sig1 = KeyFile.Sign(keyFile, message1);
        var sig2 = KeyFile.Sign(keyFile, message2);

        sig1.Should().NotEqual(sig2);
    }

    [Fact]
    public void Sign_ShouldVerifyWithNSec()
    {
        var keyFile = KeyFile.Generate();
        var message = Encoding.UTF8.GetBytes("test message");

        var signature = KeyFile.Sign(keyFile, message);

        // Verify using NSec directly
        var publicKeyBytes = KeyFile.GetPublicKeyBytes(keyFile);
        var algorithm = SignatureAlgorithm.Ed25519;
        var publicKey = PublicKey.Import(algorithm, publicKeyBytes, KeyBlobFormat.RawPublicKey);

        algorithm.Verify(publicKey, message, signature).Should().BeTrue();
    }

    [Fact]
    public void Sign_ShouldVerifyWithEd25519SignatureVerifier()
    {
        var keyFile = KeyFile.Generate();
        var message = Encoding.UTF8.GetBytes("test message");

        var signatureBase64 = KeyFile.SignToBase64(keyFile, message);
        var publicKeyBase64 = KeyFile.GetPublicKeyBase64(keyFile);

        // Verify using our Ed25519SignatureVerifier
        var verifier = new Ed25519SignatureVerifier();
        verifier.Verify(publicKeyBase64, message, signatureBase64).Should().BeTrue();
    }

    [Fact]
    public void SignToBase64_ShouldProduceValidBase64()
    {
        var keyFile = KeyFile.Generate();
        var message = Encoding.UTF8.GetBytes("test message");

        var signatureBase64 = KeyFile.SignToBase64(keyFile, message);

        // Should be valid Base64
        var action = () => Convert.FromBase64String(signatureBase64);
        action.Should().NotThrow();

        // Should decode to 64 bytes
        var decoded = Convert.FromBase64String(signatureBase64);
        decoded.Should().HaveCount(64);
    }

    #endregion

    #region Base64URL Tests

    [Fact]
    public void GetPublicKeyBytes_ShouldRoundTrip()
    {
        var keyFile = KeyFile.Generate();

        var bytes1 = KeyFile.GetPublicKeyBytes(keyFile);
        var bytes2 = KeyFile.GetPublicKeyBytes(keyFile);

        bytes1.Should().Equal(bytes2);
        bytes1.Should().HaveCount(32, "Ed25519 public keys are 32 bytes");
    }

    [Fact]
    public void GetPrivateKeyBytes_ShouldRoundTrip()
    {
        var keyFile = KeyFile.Generate();

        var bytes1 = KeyFile.GetPrivateKeyBytes(keyFile);
        var bytes2 = KeyFile.GetPrivateKeyBytes(keyFile);

        bytes1.Should().Equal(bytes2);
        bytes1.Should().HaveCount(32, "Ed25519 private keys (seeds) are 32 bytes");
    }

    #endregion
}
