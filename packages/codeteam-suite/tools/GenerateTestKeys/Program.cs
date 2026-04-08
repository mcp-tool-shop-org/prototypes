using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using NSec.Cryptography;

// Generate test keys and signatures for CodeTeam fixtures
// Uses deterministic seed for reproducible fixtures

Console.WriteLine("Generating Ed25519 test keys and signatures...\n");

var algorithm = SignatureAlgorithm.Ed25519;

// Use deterministic seeds for reproducible test keys
// These are NOT secure - they're for testing only!
var approverSeed = SHA256.HashData(Encoding.UTF8.GetBytes("codeteam-test-approver-seed-v1"));
var signerSeed = SHA256.HashData(Encoding.UTF8.GetBytes("codeteam-test-signer-seed-v1"));

using var approverKey = Key.Import(algorithm, approverSeed, KeyBlobFormat.RawPrivateKey,
    new KeyCreationParameters { ExportPolicy = KeyExportPolicies.AllowPlaintextExport });
using var signerKey = Key.Import(algorithm, signerSeed, KeyBlobFormat.RawPrivateKey,
    new KeyCreationParameters { ExportPolicy = KeyExportPolicies.AllowPlaintextExport });

// Export public keys
var approverPubKey = approverKey.Export(KeyBlobFormat.RawPublicKey);
var signerPubKey = signerKey.Export(KeyBlobFormat.RawPublicKey);

// Compute key IDs (first 16 hex chars of sha256(pubkey))
var approverKeyId = ComputeKeyId(approverPubKey);
var signerKeyId = ComputeKeyId(signerPubKey);

Console.WriteLine("=== Approver Key (deterministic) ===");
Console.WriteLine($"Key ID: {approverKeyId}");
Console.WriteLine($"Public Key (base64): {Convert.ToBase64String(approverPubKey)}");
Console.WriteLine();

Console.WriteLine("=== Signer Key (deterministic) ===");
Console.WriteLine($"Key ID: {signerKeyId}");
Console.WriteLine($"Public Key (base64): {Convert.ToBase64String(signerPubKey)}");
Console.WriteLine();

// Package digest from the manifest file
// sha256 of the manifest JSON content
var packageDigest = "sha256:0c737e8d707bd7ae4c7a2d31d179b623343c01456c2f55f0d83a800056188b94";
var timestamp = "2025-01-30T12:00:00Z";

// Create signable bytes per VERIFICATION.md
var approvalSignableBytes = CreateApprovalSignableBytes(packageDigest, approverKeyId);
var signatureSignableBytes = CreateSignatureSignableBytes(packageDigest, signerKeyId);

Console.WriteLine($"Package digest: {packageDigest}");
Console.WriteLine($"Approval signable: {Encoding.UTF8.GetString(approvalSignableBytes)}");
Console.WriteLine($"Signature signable: {Encoding.UTF8.GetString(signatureSignableBytes)}");
Console.WriteLine();

// Sign messages
var approvalSig = algorithm.Sign(approverKey, approvalSignableBytes);
var signatureSig = algorithm.Sign(signerKey, signatureSignableBytes);

// Also create invalid signature (signed with wrong key)
var invalidSig = algorithm.Sign(approverKey, signatureSignableBytes); // Wrong key!

Console.WriteLine("=== Valid Approval Record (for approvals.jsonl) ===");
Console.WriteLine($"{{\"type\":\"approval\",\"package_digest\":\"{packageDigest}\",\"approver_id\":\"{approverKeyId}\",\"ts\":\"{timestamp}\",\"comment\":\"Approved for testing\",\"signature\":\"{Convert.ToBase64String(approvalSig)}\"}}");
Console.WriteLine();

Console.WriteLine("=== Valid Signature Record (for signatures.jsonl) ===");
Console.WriteLine($"{{\"type\":\"signature\",\"package_digest\":\"{packageDigest}\",\"signer_id\":\"{signerKeyId}\",\"role\":\"release-signer\",\"ts\":\"{timestamp}\",\"signature\":\"{Convert.ToBase64String(signatureSig)}\"}}");
Console.WriteLine();

Console.WriteLine("=== Invalid Signature Record (wrong key - for signed_invalid_sig fixture) ===");
Console.WriteLine($"{{\"type\":\"signature\",\"package_digest\":\"{packageDigest}\",\"signer_id\":\"{signerKeyId}\",\"role\":\"release-signer\",\"ts\":\"{timestamp}\",\"signature\":\"{Convert.ToBase64String(invalidSig)}\"}}");
Console.WriteLine();

// Verify signatures work
Console.WriteLine("=== Verification Check ===");
var verifyApproval = algorithm.Verify(approverKey.PublicKey, approvalSignableBytes, approvalSig);
var verifySignature = algorithm.Verify(signerKey.PublicKey, signatureSignableBytes, signatureSig);
var verifyInvalid = algorithm.Verify(signerKey.PublicKey, signatureSignableBytes, invalidSig);
Console.WriteLine($"Approval signature valid: {verifyApproval}");
Console.WriteLine($"Final signature valid: {verifySignature}");
Console.WriteLine($"Invalid signature valid: {verifyInvalid} (should be false)");

static string ComputeKeyId(byte[] publicKey)
{
    var hash = SHA256.HashData(publicKey);
    return Convert.ToHexString(hash)[..16].ToLowerInvariant();
}

static byte[] CreateApprovalSignableBytes(string packageDigest, string approverId)
{
    return Encoding.UTF8.GetBytes($"codeteam:approval:v0.1:{packageDigest}:{approverId}");
}

static byte[] CreateSignatureSignableBytes(string packageDigest, string signerId)
{
    return Encoding.UTF8.GetBytes($"codeteam:signature:v0.1:{packageDigest}:{signerId}");
}
