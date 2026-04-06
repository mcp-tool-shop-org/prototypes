using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PocketLedger.Domain.Entities;

namespace PocketLedger.Infrastructure.Persistence.Configurations;

public class GoalConfiguration : IEntityTypeConfiguration<Goal>
{
    public void Configure(EntityTypeBuilder<Goal> builder)
    {
        builder.ToTable("Goals");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.OwnsOne(g => g.TargetAmount, targetBuilder =>
        {
            targetBuilder.Property(m => m.Amount)
                .HasColumnName("TargetAmount")
                .HasPrecision(18, 2)
                .IsRequired();

            targetBuilder.Property(m => m.CurrencyCode)
                .HasColumnName("TargetCurrency")
                .HasMaxLength(3)
                .IsRequired();
        });

        builder.OwnsOne(g => g.CurrentAmount, currentBuilder =>
        {
            currentBuilder.Property(m => m.Amount)
                .HasColumnName("CurrentAmount")
                .HasPrecision(18, 2)
                .IsRequired();

            currentBuilder.Property(m => m.CurrencyCode)
                .HasColumnName("CurrentCurrency")
                .HasMaxLength(3)
                .IsRequired();
        });

        builder.Property(g => g.TargetDate);

        builder.Property(g => g.Notes)
            .HasMaxLength(500);

        builder.Property(g => g.Icon)
            .HasMaxLength(50);

        builder.Property(g => g.ColorHex)
            .HasMaxLength(9);

        builder.Property(g => g.IsCompleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(g => g.CompletedAt);

        builder.Property(g => g.IsArchived)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(g => g.DisplayOrder)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(g => g.CreatedAt)
            .IsRequired();

        builder.Property(g => g.UpdatedAt);

        builder.HasIndex(g => g.IsCompleted);
        builder.HasIndex(g => g.IsArchived);
        builder.HasIndex(g => g.TargetDate);
    }
}
