using Microsoft.EntityFrameworkCore;
using PocketLedger.Domain.Entities;
using PocketLedger.Domain.Enums;

namespace PocketLedger.Infrastructure.Persistence;

public class DatabaseInitializer
{
    private readonly PocketLedgerDbContext _context;

    public DatabaseInitializer(PocketLedgerDbContext context)
    {
        _context = context;
    }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        await _context.Database.MigrateAsync(cancellationToken);
        await SeedDefaultCategoriesAsync(cancellationToken);
    }

    public async Task EnsureCreatedAsync(CancellationToken cancellationToken = default)
    {
        await _context.Database.EnsureCreatedAsync(cancellationToken);
        await SeedDefaultCategoriesAsync(cancellationToken);
    }

    private async Task SeedDefaultCategoriesAsync(CancellationToken cancellationToken)
    {
        if (await _context.Categories.AnyAsync(cancellationToken))
            return;

        var expenseCategories = new[]
        {
            Category.CreateSystem("Housing", TransactionType.Expense, "home", "#4A90D9"),
            Category.CreateSystem("Transportation", TransactionType.Expense, "car", "#50C878"),
            Category.CreateSystem("Food & Dining", TransactionType.Expense, "utensils", "#FFB347"),
            Category.CreateSystem("Utilities", TransactionType.Expense, "bolt", "#87CEEB"),
            Category.CreateSystem("Healthcare", TransactionType.Expense, "heart-pulse", "#FF6B6B"),
            Category.CreateSystem("Entertainment", TransactionType.Expense, "gamepad", "#DDA0DD"),
            Category.CreateSystem("Shopping", TransactionType.Expense, "shopping-bag", "#F0E68C"),
            Category.CreateSystem("Personal Care", TransactionType.Expense, "user", "#FFB6C1"),
            Category.CreateSystem("Education", TransactionType.Expense, "graduation-cap", "#98D8C8"),
            Category.CreateSystem("Subscriptions", TransactionType.Expense, "repeat", "#B19CD9"),
            Category.CreateSystem("Insurance", TransactionType.Expense, "shield", "#77DD77"),
            Category.CreateSystem("Gifts & Donations", TransactionType.Expense, "gift", "#FFDAB9"),
            Category.CreateSystem("Travel", TransactionType.Expense, "plane", "#ADD8E6"),
            Category.CreateSystem("Pets", TransactionType.Expense, "paw", "#D2691E"),
            Category.CreateSystem("Other Expense", TransactionType.Expense, "ellipsis", "#C0C0C0")
        };

        var incomeCategories = new[]
        {
            Category.CreateSystem("Salary", TransactionType.Income, "briefcase", "#4CAF50"),
            Category.CreateSystem("Freelance", TransactionType.Income, "laptop", "#2196F3"),
            Category.CreateSystem("Investments", TransactionType.Income, "chart-line", "#9C27B0"),
            Category.CreateSystem("Rental Income", TransactionType.Income, "building", "#FF9800"),
            Category.CreateSystem("Refunds", TransactionType.Income, "rotate-left", "#00BCD4"),
            Category.CreateSystem("Gifts Received", TransactionType.Income, "gift", "#E91E63"),
            Category.CreateSystem("Other Income", TransactionType.Income, "ellipsis", "#607D8B")
        };

        _context.Categories.AddRange(expenseCategories);
        _context.Categories.AddRange(incomeCategories);

        await _context.SaveChangesAsync(cancellationToken);
    }
}
