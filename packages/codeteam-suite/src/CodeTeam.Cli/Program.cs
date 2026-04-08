using System.CommandLine;
using System.CommandLine.Invocation;

namespace CodeTeam.Cli;

/// <summary>
/// CodeTeam CLI entry point
///
/// Usage:
///   codeteam verify <package-path> [--json]
///   codeteam approve <package-path> --key <key-id> [--json]
///   codeteam sign <package-path> --key <key-id> [--json]
/// </summary>
public static class Program
{
    public static async Task<int> Main(string[] args)
    {
        var rootCommand = new RootCommand("CodeTeam CLI - Package verification and signing");

        // Global options
        var jsonOption = new Option<bool>("--json", "Output results as JSON");

        // Verify command
        var verifyCommand = new Command("verify", "Verify a package");
        var packagePathArg = new Argument<string>("package-path", "Path to package directory");
        var verifySignaturesOption = new Option<bool>("--verify-signatures", "Cryptographically verify signatures (default: false for backward compatibility)");
        verifyCommand.AddArgument(packagePathArg);
        verifyCommand.AddOption(jsonOption);
        verifyCommand.AddOption(verifySignaturesOption);
        verifyCommand.SetHandler(async (context) =>
        {
            var path = context.ParseResult.GetValueForArgument(packagePathArg);
            var json = context.ParseResult.GetValueForOption(jsonOption);
            var verifySignatures = context.ParseResult.GetValueForOption(verifySignaturesOption);
            context.ExitCode = await VerifyCommand.ExecuteAsync(path, json, verifySignatures);
        });

        // Approve command
        var approveCommand = new Command("approve", "Approve a package");
        var approvePathArg = new Argument<string>("package-path", "Path to package directory");
        var approveKeyOption = new Option<string>("--key", "Path to key file") { IsRequired = true };
        var approveRoleOption = new Option<string>("--role", () => "reviewer", "Role of the approver");
        var approveOutOption = new Option<string?>("--out", "Output file path (default: stdout)");
        var approveCommentOption = new Option<string?>("--comment", "Optional comment");
        approveCommand.AddArgument(approvePathArg);
        approveCommand.AddOption(approveKeyOption);
        approveCommand.AddOption(approveRoleOption);
        approveCommand.AddOption(approveOutOption);
        approveCommand.AddOption(approveCommentOption);
        approveCommand.AddOption(jsonOption);
        approveCommand.SetHandler(async (context) =>
        {
            var path = context.ParseResult.GetValueForArgument(approvePathArg);
            var keyPath = context.ParseResult.GetValueForOption(approveKeyOption)!;
            var role = context.ParseResult.GetValueForOption(approveRoleOption)!;
            var outPath = context.ParseResult.GetValueForOption(approveOutOption);
            var comment = context.ParseResult.GetValueForOption(approveCommentOption);
            var json = context.ParseResult.GetValueForOption(jsonOption);
            context.ExitCode = await ApproveCommand.ExecuteAsync(path, keyPath, role, outPath, comment, json);
        });

        // Sign command
        var signCommand = new Command("sign", "Sign a package");
        var signPathArg = new Argument<string>("package-path", "Path to package directory");
        var signKeyOption = new Option<string>("--key", "Path to key file") { IsRequired = true };
        var signRoleOption = new Option<string>("--role", () => "release-signer", "Role of the signer");
        var signOutOption = new Option<string?>("--out", "Output file path (default: stdout)");
        signCommand.AddArgument(signPathArg);
        signCommand.AddOption(signKeyOption);
        signCommand.AddOption(signRoleOption);
        signCommand.AddOption(signOutOption);
        signCommand.AddOption(jsonOption);
        signCommand.SetHandler(async (context) =>
        {
            var path = context.ParseResult.GetValueForArgument(signPathArg);
            var keyPath = context.ParseResult.GetValueForOption(signKeyOption)!;
            var role = context.ParseResult.GetValueForOption(signRoleOption)!;
            var outPath = context.ParseResult.GetValueForOption(signOutOption);
            var json = context.ParseResult.GetValueForOption(jsonOption);
            context.ExitCode = await SignCommand.ExecuteAsync(path, keyPath, role, outPath, json);
        });

        // Version command
        var versionCommand = new Command("version", "Show CLI and schema version");
        versionCommand.AddOption(jsonOption);
        versionCommand.SetHandler((context) =>
        {
            var json = context.ParseResult.GetValueForOption(jsonOption);
            context.ExitCode = VersionCommand.Execute(json);
        });

        // Keygen command
        var keygenCommand = new Command("keygen", "Generate a new Ed25519 key pair");
        var keygenOutOption = new Option<string?>("--out", "Output file path (default: stdout)");
        keygenCommand.AddOption(keygenOutOption);
        keygenCommand.AddOption(jsonOption);
        keygenCommand.SetHandler((context) =>
        {
            var outPath = context.ParseResult.GetValueForOption(keygenOutOption);
            var json = context.ParseResult.GetValueForOption(jsonOption);
            context.ExitCode = KeygenCommand.Execute(outPath, json);
        });

        // Diagnose command
        var diagnoseCommand = new Command("diagnose", "Check environment health and crypto capabilities");
        diagnoseCommand.AddOption(jsonOption);
        diagnoseCommand.SetHandler((context) =>
        {
            var json = context.ParseResult.GetValueForOption(jsonOption);
            context.ExitCode = DiagnoseCommand.Execute(json);
        });

        rootCommand.AddCommand(verifyCommand);
        rootCommand.AddCommand(approveCommand);
        rootCommand.AddCommand(signCommand);
        rootCommand.AddCommand(versionCommand);
        rootCommand.AddCommand(keygenCommand);
        rootCommand.AddCommand(diagnoseCommand);

        return await rootCommand.InvokeAsync(args);
    }
}
