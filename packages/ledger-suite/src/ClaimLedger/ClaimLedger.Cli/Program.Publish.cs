using System.CommandLine;
using System.Text.Json;
using ClaimLedger.Application.Publish;

namespace ClaimLedger.Cli;

public static partial class Program
{
    private static Command CreatePublishCommand()
    {
        // Required arguments
        var claimArg = new Argument<FileInfo>("claim") { Description = "Path to claim bundle JSON file" };

        // Output options
        var outOption = new Option<string>(
            "--out", "-o")
        { Required = true, Description = "Output path (directory or .zip file)" };

        var zipOption = new Option<bool>(
            "--zip")
        { Description = "Output as ZIP archive (auto-detected if --out ends with .zip)" };

        // Include options
        var evidenceOption = new Option<DirectoryInfo?>(
            "--evidence", "-e")
        { Description = "Directory containing evidence files to include" };

        var creatorLedgerOption = new Option<DirectoryInfo?>(
            "--creatorledger")
        { Description = "Directory containing CreatorLedger proof bundles to include" };

        var revocationsOption = new Option<DirectoryInfo?>(
            "--revocations")
        { Description = "Directory containing revocation files to include" };

        var tsaTrustOption = new Option<DirectoryInfo?>(
            "--tsa-trust")
        { Description = "Directory containing TSA trust anchor certificates" };

        var includeCitationsOption = new Option<bool>(
            "--include-citations")
        { DefaultValueFactory = _ => true, Description = "Include embedded citations in the pack" };

        var includeAttestationsOption = new Option<bool>(
            "--include-attestations")
        { DefaultValueFactory = _ => true, Description = "Include attestations in verification" };

        var includeTimestampsOption = new Option<bool>(
            "--include-timestamps")
        { DefaultValueFactory = _ => true, Description = "Include timestamp receipts in verification" };

        // Signing options
        var signPackOption = new Option<bool>(
            "--sign-pack")
        { Description = "Sign the pack manifest" };

        var publisherKeyOption = new Option<FileInfo?>(
            "--publisher-key")
        { Description = "Path to publisher private key JSON file" };

        var publisherIdentityOption = new Option<FileInfo?>(
            "--publisher-identity")
        { Description = "Path to publisher identity JSON file" };

        var authorKeyOption = new Option<FileInfo?>(
            "--author-key")
        { Description = "Path to author private key JSON file" };

        var authorIdentityOption = new Option<FileInfo?>(
            "--author-identity")
        { Description = "Path to author identity JSON file" };

        // Verification options
        var strictOption = new Option<bool>(
            "--strict")
        { DefaultValueFactory = _ => true, Description = "Run strict verification gate (default: true for publishing)" };

        // Report option
        var reportOption = new Option<FileInfo?>(
            "--report")
        { Description = "Path to write publish report JSON" };

        var command = new Command("publish", "Publish a claim bundle as a ready-to-share ClaimPack")
        {
            claimArg,
            outOption,
            zipOption,
            evidenceOption,
            creatorLedgerOption,
            revocationsOption,
            tsaTrustOption,
            includeCitationsOption,
            includeAttestationsOption,
            includeTimestampsOption,
            signPackOption,
            publisherKeyOption,
            publisherIdentityOption,
            authorKeyOption,
            authorIdentityOption,
            strictOption,
            reportOption
        };

        command.SetAction(async (ParseResult parseResult) =>
        {
            var claim = parseResult.GetValue(claimArg)!;
            var outPath = parseResult.GetValue(outOption)!;
            var zip = parseResult.GetValue(zipOption);
            var evidence = parseResult.GetValue(evidenceOption);
            var creatorLedger = parseResult.GetValue(creatorLedgerOption);
            var revocations = parseResult.GetValue(revocationsOption);
            var tsaTrust = parseResult.GetValue(tsaTrustOption);
            var includeCitations = parseResult.GetValue(includeCitationsOption);
            var includeAttestations = parseResult.GetValue(includeAttestationsOption);
            var includeTimestamps = parseResult.GetValue(includeTimestampsOption);
            var signPack = parseResult.GetValue(signPackOption);
            var publisherKey = parseResult.GetValue(publisherKeyOption);
            var publisherIdentity = parseResult.GetValue(publisherIdentityOption);
            var authorKey = parseResult.GetValue(authorKeyOption);
            var authorIdentity = parseResult.GetValue(authorIdentityOption);
            var strict = parseResult.GetValue(strictOption);
            var report = parseResult.GetValue(reportOption);

            return await Publish(
                claim, outPath, zip,
                evidence, creatorLedger, revocations, tsaTrust,
                includeCitations, includeAttestations, includeTimestamps,
                signPack,
                publisherKey, publisherIdentity,
                authorKey, authorIdentity,
                strict, report);
        });

        return command;
    }

    private static async Task<int> Publish(
        FileInfo claimFile,
        string outPath,
        bool zip,
        DirectoryInfo? evidenceDir,
        DirectoryInfo? creatorLedgerDir,
        DirectoryInfo? revocationsDir,
        DirectoryInfo? tsaTrustDir,
        bool includeCitations,
        bool includeAttestations,
        bool includeTimestamps,
        bool signPack,
        FileInfo? publisherKeyFile,
        FileInfo? publisherIdentityFile,
        FileInfo? authorKeyFile,
        FileInfo? authorIdentityFile,
        bool strict,
        FileInfo? reportFile)
    {
        var command = new PublishCommand(
            InputClaimPath: claimFile.FullName,
            OutputPath: outPath,
            Zip: zip,
            EvidenceDirectory: evidenceDir?.FullName,
            CreatorLedgerDirectory: creatorLedgerDir?.FullName,
            RevocationsDirectory: revocationsDir?.FullName,
            TsaTrustDirectory: tsaTrustDir?.FullName,
            IncludeCitations: includeCitations,
            IncludeAttestations: includeAttestations,
            IncludeTimestamps: includeTimestamps,
            SignPack: signPack,
            PublisherKeyPath: publisherKeyFile?.FullName,
            PublisherIdentityPath: publisherIdentityFile?.FullName,
            AuthorKeyPath: authorKeyFile?.FullName,
            AuthorIdentityPath: authorIdentityFile?.FullName,
            Strict: strict,
            ReportPath: reportFile?.FullName);

        var result = await PublishHandler.HandleAsync(command);

        if (result.Success)
        {
            Console.WriteLine("✓ Published successfully");
            Console.WriteLine($"  Output: {result.OutputPath}");

            if (result.Report != null)
            {
                Console.WriteLine($"  Pack ID: {result.Report.PackId}");
                Console.WriteLine($"  Root digest: {result.Report.RootClaimCoreDigest}");
                Console.WriteLine($"  Manifest hash: {result.Report.ManifestSha256Hex}");

                if (result.Report.Counts.Claims > 1)
                    Console.WriteLine($"  Claims: {result.Report.Counts.Claims}");
                if (result.Report.Counts.EvidenceFiles > 0)
                    Console.WriteLine($"  Evidence files: {result.Report.Counts.EvidenceFiles}");
                if (result.Report.Counts.CreatorLedgerBundles > 0)
                    Console.WriteLine($"  CreatorLedger bundles: {result.Report.Counts.CreatorLedgerBundles}");
                if (result.Report.Counts.ManifestSignatures > 0)
                    Console.WriteLine($"  Manifest signatures: {result.Report.Counts.ManifestSignatures}");

                if (result.Report.Signing.PublisherSigned)
                    Console.WriteLine("  Signed by: Publisher");
                if (result.Report.Signing.AuthorSigned)
                    Console.WriteLine("  Signed by: Author");
            }

            return 0;
        }
        else
        {
            Console.WriteLine($"✗ Publish failed: {result.Error}");

            if (result.Report?.VerificationGate != null)
            {
                Console.WriteLine($"  Gate result: {result.Report.VerificationGate.Result}");
                foreach (var note in result.Report.VerificationGate.Notes)
                {
                    Console.WriteLine($"  {note}");
                }
            }

            return result.ExitCode;
        }
    }
}
