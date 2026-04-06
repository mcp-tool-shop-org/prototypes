using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace PocketLedger.Infrastructure.Persistence;

public class PocketLedgerDbContextFactory : IDesignTimeDbContextFactory<PocketLedgerDbContext>
{
    public PocketLedgerDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<PocketLedgerDbContext>();

        var dbPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "PocketLedger",
            "pocketledger.db");

        var directory = Path.GetDirectoryName(dbPath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        optionsBuilder.UseSqlite($"Data Source={dbPath}");

        return new PocketLedgerDbContext(optionsBuilder.Options);
    }
}
