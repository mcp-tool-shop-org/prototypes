using System.Text.Json;
using System.Text.Json.Serialization;

namespace CodeTeam.Packaging;

/// <summary>
/// Default implementation of IPackageLoader
/// </summary>
public sealed class PackageLoaderImpl : IPackageLoader
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        AllowTrailingCommas = false,
        ReadCommentHandling = JsonCommentHandling.Disallow
    };

    private readonly IPackageReader _reader;

    public PackageLoaderImpl(IPackageReader reader)
    {
        _reader = reader ?? throw new ArgumentNullException(nameof(reader));
    }

    public async Task<PackageManifest?> LoadManifestAsync(string packagePath)
    {
        // packagePath is ignored; we use the reader's path
        if (!_reader.FileExists(PackageConstants.ManifestPath))
            return null;

        try
        {
            var json = _reader.ReadAllText(PackageConstants.ManifestPath);
            var dto = JsonSerializer.Deserialize<ManifestDto>(json, JsonOptions);

            if (dto is null)
                return null;

            return MapToManifest(dto);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    public async Task<IReadOnlyList<ApprovalRecord>> LoadApprovalsAsync(string packagePath)
    {
        return await LoadJsonlAsync<ApprovalDto, ApprovalRecord>(
            PackageConstants.ApprovalsPath,
            MapToApproval);
    }

    public async Task<IReadOnlyList<SignatureRecord>> LoadSignaturesAsync(string packagePath)
    {
        return await LoadJsonlAsync<SignatureDto, SignatureRecord>(
            PackageConstants.SignaturesPath,
            MapToSignature);
    }

    private async Task<IReadOnlyList<TResult>> LoadJsonlAsync<TDto, TResult>(
        string path,
        Func<TDto, TResult?> mapper)
        where TDto : class
        where TResult : class
    {
        var results = new List<TResult>();

        if (!_reader.FileExists(path))
            return results;

        try
        {
            var content = _reader.ReadAllText(path);
            var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);

            foreach (var line in lines)
            {
                var trimmed = line.Trim();
                if (string.IsNullOrEmpty(trimmed))
                    continue;

                try
                {
                    var dto = JsonSerializer.Deserialize<TDto>(trimmed, JsonOptions);
                    if (dto is not null)
                    {
                        var result = mapper(dto);
                        if (result is not null)
                            results.Add(result);
                    }
                }
                catch (JsonException)
                {
                    // Skip invalid JSONL lines per VERIFICATION.md
                    // "skip invalid records"
                }
            }
        }
        catch (Exception)
        {
            // Return empty list on file read errors
        }

        return results;
    }

    // DTO classes for JSON deserialization (snake_case)

    private sealed class ManifestDto
    {
        public string? SchemaVersion { get; set; }
        public string? PackageVersion { get; set; }
        public string? CreatedAt { get; set; }
        public string? Intent { get; set; }
        public WorkspaceDto? Workspace { get; set; }
        public List<ArtifactDto>? Artifacts { get; set; }
        public List<EvidenceDto>? Evidence { get; set; }
        public PolicyDto? Policy { get; set; }
    }

    private sealed class WorkspaceDto
    {
        public string? Name { get; set; }
        public string? RepoUrl { get; set; }
        public string? GitCommit { get; set; }
        public bool? Dirty { get; set; }
    }

    private sealed class ArtifactDto
    {
        public string? Path { get; set; }
        public string? Sha256 { get; set; }
        public long? SizeBytes { get; set; }
        public string? MediaType { get; set; }
    }

    private sealed class EvidenceDto
    {
        public string? Path { get; set; }
        public string? Sha256 { get; set; }
        public long? SizeBytes { get; set; }
        public string? Kind { get; set; }
    }

    private sealed class PolicyDto
    {
        public int? RequiredApprovals { get; set; }
        public List<ApproverKeyDto>? ApproverKeys { get; set; }
    }

    private sealed class ApproverKeyDto
    {
        public string? Id { get; set; }
        public string? Algorithm { get; set; }
        public string? PublicKey { get; set; }
        public string? Name { get; set; }
    }

    private sealed class ApprovalDto
    {
        public string? Type { get; set; }
        public string? PackageDigest { get; set; }
        public string? ApproverId { get; set; }
        public string? Ts { get; set; }
        public string? Comment { get; set; }
        public string? Signature { get; set; }
    }

    private sealed class SignatureDto
    {
        public string? Type { get; set; }
        public string? PackageDigest { get; set; }
        public string? SignerId { get; set; }
        public string? Role { get; set; }
        public string? Ts { get; set; }
        public string? Signature { get; set; }
    }

    // Mapping functions

    private static PackageManifest? MapToManifest(ManifestDto dto)
    {
        if (dto.SchemaVersion is null ||
            dto.PackageVersion is null ||
            dto.CreatedAt is null ||
            dto.Intent is null ||
            dto.Workspace?.Name is null ||
            dto.Artifacts is null ||
            dto.Evidence is null ||
            dto.Policy is null)
            return null;

        return new PackageManifest
        {
            SchemaVersion = dto.SchemaVersion,
            PackageVersion = dto.PackageVersion,
            CreatedAt = dto.CreatedAt,
            Intent = dto.Intent,
            Workspace = new WorkspaceInfo { Name = dto.Workspace.Name },
            Artifacts = dto.Artifacts
                .Where(a => a.Path is not null && a.Sha256 is not null && a.SizeBytes.HasValue)
                .Select(a => new ArtifactEntry
                {
                    Path = a.Path!,
                    Sha256 = a.Sha256!,
                    SizeBytes = a.SizeBytes!.Value
                })
                .ToList(),
            Evidence = dto.Evidence
                .Where(e => e.Path is not null && e.Sha256 is not null && e.SizeBytes.HasValue && e.Kind is not null)
                .Select(e => new EvidenceEntry
                {
                    Path = e.Path!,
                    Sha256 = e.Sha256!,
                    SizeBytes = e.SizeBytes!.Value,
                    Category = e.Kind!
                })
                .ToList(),
            Policy = new PolicyInfo
            {
                RequiredApprovals = dto.Policy.RequiredApprovals ?? 0,
                ApproverKeys = (dto.Policy.ApproverKeys ?? new List<ApproverKeyDto>())
                    .Where(k => k.Id is not null && k.Algorithm is not null && k.PublicKey is not null)
                    .Select(k => new ApproverKey
                    {
                        Id = k.Id!,
                        Algorithm = k.Algorithm!,
                        PublicKey = k.PublicKey!,
                        Name = k.Name
                    })
                    .ToList()
            }
        };
    }

    private static ApprovalRecord? MapToApproval(ApprovalDto dto)
    {
        if (dto.Type is null ||
            dto.PackageDigest is null ||
            dto.ApproverId is null ||
            dto.Ts is null ||
            dto.Signature is null)
            return null;

        return new ApprovalRecord
        {
            Type = dto.Type,
            PackageDigest = dto.PackageDigest,
            ApproverId = dto.ApproverId,
            Ts = dto.Ts,
            Comment = dto.Comment,
            Signature = dto.Signature
        };
    }

    private static SignatureRecord? MapToSignature(SignatureDto dto)
    {
        if (dto.Type is null ||
            dto.PackageDigest is null ||
            dto.SignerId is null ||
            dto.Role is null ||
            dto.Ts is null ||
            dto.Signature is null)
            return null;

        return new SignatureRecord
        {
            Type = dto.Type,
            PackageDigest = dto.PackageDigest,
            SignerId = dto.SignerId,
            Role = dto.Role,
            Ts = dto.Ts,
            Signature = dto.Signature
        };
    }
}
