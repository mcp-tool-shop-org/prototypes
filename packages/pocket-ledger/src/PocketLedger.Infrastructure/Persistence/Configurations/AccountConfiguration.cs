using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PocketLedger.Domain.Entities;
using PocketLedger.Domain.ValueObjects;

namespace PocketLedger.Infrastructure.Persistence.Configurations;

public class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("Accounts");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.Type)
            .IsRequired();

        builder.Property(a => a.CurrencyCode)
            .IsRequired()
            .HasMaxLength(3);

        builder.OwnsOne(a => a.Balance, balanceBuilder =>
        {
            balanceBuilder.Property(m => m.Amount)
                .HasColumnName("Balance")
                .HasPrecision(18, 2);

            balanceBuilder.Property(m => m.CurrencyCode)
                .HasColumnName("BalanceCurrency")
                .HasMaxLength(3);
        });

        builder.Property(a => a.Notes)
            .HasMaxLength(500);

        builder.Property(a => a.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(a => a.DisplayOrder)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(a => a.CreatedAt)
            .IsRequired();

        builder.Property(a => a.UpdatedAt);

        builder.HasIndex(a => a.Name);
        builder.HasIndex(a => a.IsActive);
    }
}
