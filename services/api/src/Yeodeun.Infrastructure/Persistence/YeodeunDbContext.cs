using Microsoft.EntityFrameworkCore;
using Yeodeun.Domain.Menu;

namespace Yeodeun.Infrastructure.Persistence;

/// <summary>
/// Entity Framework Core context for menu and nutrition persistence.
/// </summary>
public sealed class YeodeunDbContext : DbContext
{
    /// <summary>
    /// Initializes a new instance of the <see cref="YeodeunDbContext"/> class.
    /// </summary>
    /// <param name="options">Configured database options for this context.</param>
    public YeodeunDbContext(DbContextOptions<YeodeunDbContext> options) : base(options) { }

    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<NutritionProfile> NutritionProfiles => Set<NutritionProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<MenuItem>(b =>
        {
            b.ToTable("menu_items");
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(200).IsRequired();
            b.Property(x => x.Description).HasMaxLength(500);
            b.Property(x => x.Category).HasConversion<string>().IsRequired();
            b.Property(x => x.PriceCents).IsRequired();
            b.Property(x => x.IsActive).IsRequired();

            b.HasIndex(x => new { x.Category, x.Name }).IsUnique();

            b.HasOne(x => x.NutritionProfile)
                .WithOne()
                .HasForeignKey<NutritionProfile>(n => n.MenuItemId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<NutritionProfile>(b =>
        {
            b.ToTable("nutrition_profiles");
            b.HasKey(x => x.Id);

            b.Property(x => x.MenuItemId).IsRequired();
            b.Property(x => x.CholesterolMg).IsRequired();
            b.Property(x => x.SodiumMg).IsRequired();

            b.Property(x => x.ServingGrams).HasPrecision(10, 2);
            b.Property(x => x.Calories).HasPrecision(10, 2);
            b.Property(x => x.TotalFatG).HasPrecision(10, 2);
            b.Property(x => x.SaturatedFatG).HasPrecision(10, 2);
            b.Property(x => x.TransFatG).HasPrecision(10, 2);
            b.Property(x => x.TotalCarbG).HasPrecision(10, 2);
            b.Property(x => x.DietaryFiberG).HasPrecision(10, 2);
            b.Property(x => x.TotalSugarsG).HasPrecision(10, 2);
            b.Property(x => x.AddedSugarsG).HasPrecision(10, 2);
            b.Property(x => x.ProteinG).HasPrecision(10, 2);

            b.Property(x => x.SourceName).HasMaxLength(200).IsRequired();
            b.Property(x => x.SourceUrl).HasMaxLength(500);
            b.Property(x => x.ExternalRef).HasMaxLength(100);
            
            b.HasIndex(x => x.MenuItemId).IsUnique();
        });
    }
}

