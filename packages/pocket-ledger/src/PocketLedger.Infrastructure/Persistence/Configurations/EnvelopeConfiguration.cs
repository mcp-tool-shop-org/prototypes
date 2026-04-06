using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PocketLedger.Domain.Entities;

namespace PocketLedger.Infrastructure.Persistence.Configurations;

public class EnvelopeConfiguration : IEntityTypeConfiguration<Envelope>
{
    public void Configure(EntityTypeBuilder<Envelope> builder)
    {
        builder.ToTable("Envelopes");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.CategoryId)
            .IsRequired();

        builder.OwnsOne(e => e.Allocated, allocBuilder =>
        {
            allocBuilder.Property(m => m.Amount)
                .HasColumnName("Allocated")
                .HasPrecision(18, 2)
                .IsRequired();

            allocBuilder.Property(m => m.CurrencyCode)
                .HasColumnName("AllocatedCurrency")
                .HasMaxLength(3)
                .IsRequired();
        });

        builder.OwnsOne(e => e.Spent, spentBuilder =>
        {
            spentBuilder.Property(m => m.Amount)
                .HasColumnName("Spent")
                .HasPrecision(18, 2)
                .IsRequired();

            spentBuilder.Property(m => m.CurrencyCode)
                .HasColumnName("SpentCurrency")
                .HasMaxLength(3)
                .IsRequired();
        });

        builder.Property(e => e.Year)
            .IsRequired();

        builder.Property(e => e.Month)
            .IsRequired();

        builder.Property(e => e.Notes)
            .HasMaxLength(500);

        builder.Property(e => e.CreatedAt)
            .IsRequired();

        builder.Property(e => e.UpdatedAt);

        builder.HasIndex(e => e.CategoryId);
        builder.HasIndex(e => new { e.Year, e.Month });
        builder.HasIndex(e => new { e.CategoryId, e.Year, e.Month }).IsUnique();
    }
}
