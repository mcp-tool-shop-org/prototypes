using Microsoft.EntityFrameworkCore;
using PocketLedger.Application.Interfaces;
using PocketLedger.Domain.Entities;
using PocketLedger.Domain.Enums;
using PocketLedger.Infrastructure.Persistence;

namespace PocketLedger.Infrastructure.Repositories;

public class CategoryRepository : RepositoryBase<Category>, ICategoryRepository
{
    public CategoryRepository(PocketLedgerDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Category>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Category>> GetByTypeAsync(
        TransactionType type,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(c => c.Type == type && c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Category>> GetByParentAsync(
        Guid parentId,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(c => c.ParentCategoryId == parentId)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Category>> GetRootCategoriesAsync(
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(c => c.ParentCategoryId == null && c.IsActive)
            .OrderBy(c => c.Type)
            .ThenBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Category>> GetSystemCategoriesAsync(
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(c => c.IsSystem)
            .OrderBy(c => c.Type)
            .ThenBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Category?> GetByNameAsync(
        string name,
        CancellationToken cancellationToken = default)
    {
        return await DbSet
            .FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower(), cancellationToken);
    }
}
