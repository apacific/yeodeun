using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Yeodeun.Domain.Menu;

namespace Yeodeun.Infrastructure.Persistence;

/// <summary>
/// Applies migrations and seeds menu/nutrition baseline data.
/// </summary>
public static class DbInitializer
{
    // If true: any existing menu item NOT in the seed list is set inactive (not deleted).
    private const bool SoftDisableMissingMenuItems = true;

    /// <summary>
    /// Runs database migrations and seed upserts.
    /// </summary>
    /// <param name="db">The application database context.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>A task that completes when migration and seeding finish.</returns>
    public static async Task MigrateAndSeedAsync(
        YeodeunDbContext db,
        IConfiguration? configuration = null,
        ILogger? logger = null,
        CancellationToken ct = default)
    {
        await db.Database.MigrateAsync(ct);

        await SeedMenuItemsAsync(db, ct);
        await SeedNutritionProfilesAsync(db, ct);
        await SeedUsdaNutritionProfilesAsync(db, configuration, logger, null, ct);
    }

    /// <summary>
    /// Refreshes USDA FoodData Central nutrition profiles on demand.
    /// </summary>
    /// <param name="db">The application database context.</param>
    /// <param name="configuration">Application configuration.</param>
    /// <param name="logger">Logger used for seeding diagnostics.</param>
    /// <param name="forceRefreshOverride">Optional force-refresh override for USDA-seeded rows.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>The number of nutrition profiles updated from USDA.</returns>
    public static async Task<int> RefreshUsdaNutritionAsync(
        YeodeunDbContext db,
        IConfiguration? configuration,
        ILogger? logger,
        bool? forceRefreshOverride = null,
        CancellationToken ct = default)
    {
        return await SeedUsdaNutritionProfilesAsync(db, configuration, logger, forceRefreshOverride, ct);
    }

    // -----------------------
    // MENU UPSERT SEED
    // -----------------------
    private static async Task SeedMenuItemsAsync(YeodeunDbContext db, CancellationToken ct)
    {
        var seed = BuildSeedItems();

        var existing = await db.MenuItems
            .AsTracking()
            .ToListAsync(ct);

        var existingByKey = existing.ToDictionary(
            x => (x.Category, Key(x.Name)),
            x => x
        );

        var seedKeys = seed
            .Select(x => (x.Category, Key(x.Name)))
            .ToHashSet();

        foreach (var s in seed)
        {
            var k = (s.Category, Key(s.Name));

            if (!existingByKey.TryGetValue(k, out var cur))
            {
                db.MenuItems.Add(s);
                continue;
            }

            // price change
            if (cur.PriceCents != s.PriceCents)
                cur.UpdatePriceCents(s.PriceCents);

            // description change
            if (!string.Equals(cur.Description, s.Description, StringComparison.Ordinal))
                cur.UpdateDescription(s.Description);

            // revive if it was previously soft-disabled
            if (!cur.IsActive)
                cur.SetActive(true);
        }

        if (SoftDisableMissingMenuItems)
        {
            foreach (var cur in existing)
            {
                var k = (cur.Category, Key(cur.Name));
                if (!seedKeys.Contains(k) && cur.IsActive)
                    cur.SetActive(false);
            }
        }

        await db.SaveChangesAsync(ct);
    }

    // -----------------------
    // NUTRITION UPSERT SEED
    // -----------------------
    private static async Task SeedNutritionProfilesAsync(YeodeunDbContext db, CancellationToken ct)
    {
        var seed = BuildSeedNutrition();
        if (seed.Count == 0) return;

        // Resolve (Category, Name) -> MenuItemId
        var menuLookup = await db.MenuItems
            .AsNoTracking()
            .Select(m => new { m.Id, m.Name, m.Category })
            .ToDictionaryAsync(
                m => (m.Category, Key(m.Name)),
                m => m.Id,
                ct
            );

        var resolved = new List<(Guid MenuItemId, SeedNutrition Seed)>();
        foreach (var s in seed)
        {
            if (menuLookup.TryGetValue((s.Category, Key(s.Name)), out var id))
                resolved.Add((id, s));
            // else: seed row refers to a menu item that doesn't exist (typo / mismatch).
            // Intentionally ignored for now; you can throw here if you prefer strictness.
        }

        if (resolved.Count == 0) return;

        var ids = resolved.Select(x => x.MenuItemId).Distinct().ToList();

        var existing = await db.NutritionProfiles
            .AsTracking()
            .Where(n => ids.Contains(n.MenuItemId))
            .ToListAsync(ct);

        var byMenuItemId = existing.ToDictionary(n => n.MenuItemId, n => n);

        foreach (var (menuItemId, s) in resolved)
        {
            if (!byMenuItemId.TryGetValue(menuItemId, out var cur))
            {
                cur = new NutritionProfile(menuItemId, s.ServingGrams);
                db.NutritionProfiles.Add(cur);
                byMenuItemId[menuItemId] = cur;
            }

            cur.UpdateNutritionFacts(
                servingGrams: s.ServingGrams,
                calories: s.Calories,
                totalFatG: s.TotalFatG,
                saturatedFatG: s.SaturatedFatG,
                transFatG: s.TransFatG,
                cholesterolMg: s.CholesterolMg,
                sodiumMg: s.SodiumMg,
                totalCarbG: s.TotalCarbG,
                dietaryFiberG: s.DietaryFiberG,
                totalSugarsG: s.TotalSugarsG,
                addedSugarsG: s.AddedSugarsG,
                proteinG: s.ProteinG,
                sourceName: s.SourceName,
                sourceUrl: s.SourceUrl,
                externalRef: s.ExternalRef,
                lastUpdatedUtc: s.LastUpdatedUtc ?? DateTimeOffset.UtcNow
            );
        }

        await db.SaveChangesAsync(ct);
    }

    private sealed record SeedNutrition(
        MenuCategory Category,
        string Name,
        decimal ServingGrams,
        decimal Calories,
        decimal TotalFatG,
        decimal SaturatedFatG,
        decimal TransFatG,
        int CholesterolMg,
        int SodiumMg,
        decimal TotalCarbG,
        decimal DietaryFiberG,
        decimal TotalSugarsG,
        decimal AddedSugarsG,
        decimal ProteinG,
        string SourceName,
        string? SourceUrl = null,
        string? ExternalRef = null,
        DateTimeOffset? LastUpdatedUtc = null
    );

    private static string Key(string name) => name.Trim().ToLowerInvariant();

    private static List<SeedNutrition> BuildSeedNutrition() => new()
    {
        new(
            Category: MenuCategory.Entree,
            Name: "grilled chicken",
            ServingGrams: 150m,
            Calories: 248m,
            TotalFatG: 5.4m,
            SaturatedFatG: 1.5m,
            TransFatG: 0.0m,
            CholesterolMg: 135,
            SodiumMg: 150,
            TotalCarbG: 0.0m,
            DietaryFiberG: 0.0m,
            TotalSugarsG: 0.0m,
            AddedSugarsG: 0.0m,
            ProteinG: 46.0m,
            SourceName: "TBD"
        ),

        new(
            Category: MenuCategory.Vegetable,
            Name: "baby bok choy",
            ServingGrams: 85m,
            Calories: 9m,
            TotalFatG: 0.1m,
            SaturatedFatG: 0.0m,
            TransFatG: 0.0m,
            CholesterolMg: 0,
            SodiumMg: 55,
            TotalCarbG: 1.5m,
            DietaryFiberG: 0.7m,
            TotalSugarsG: 0.8m,
            AddedSugarsG: 0.0m,
            ProteinG: 1.1m,
            SourceName: "TBD"
        ),

        new(
            Category: MenuCategory.Fruit,
            Name: "sliced banana",
            ServingGrams: 118m,
            Calories: 105m,
            TotalFatG: 0.4m,
            SaturatedFatG: 0.1m,
            TransFatG: 0.0m,
            CholesterolMg: 0,
            SodiumMg: 1,
            TotalCarbG: 27.0m,
            DietaryFiberG: 3.1m,
            TotalSugarsG: 14.4m,
            AddedSugarsG: 0.0m,
            ProteinG: 1.3m,
            SourceName: "TBD"
        ),
    };


    /// <summary>
    /// Enriches seeded nutrition profiles from USDA FoodData Central when configured.
    /// </summary>
    /// <param name="db">The application database context.</param>
    /// <param name="configuration">Application configuration.</param>
    /// <param name="logger">Logger used for seeding diagnostics.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>A task that completes when USDA enrichment is attempted.</returns>
    private static async Task<int> SeedUsdaNutritionProfilesAsync(
        YeodeunDbContext db,
        IConfiguration? configuration,
        ILogger? logger,
        bool? forceRefreshOverride,
        CancellationToken ct)
    {
        if (configuration is null)
        {
            logger?.LogInformation("USDA FDC nutrition seeding skipped: configuration was not provided.");
            return 0;
        }

        var section = configuration.GetSection("NutritionSeeding:UsdaFdc");
        var enabled = section.GetValue<bool>("Enabled");
        if (!enabled)
        {
            logger?.LogInformation("USDA FDC nutrition seeding skipped: NutritionSeeding:UsdaFdc:Enabled is false.");
            return 0;
        }

        var apiKey = section["ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            apiKey = configuration["USDA_FDC_API_KEY"];
        }

        var forceRefresh = forceRefreshOverride ?? section.GetValue<bool>("ForceRefresh");
        var updated = await UsdaFdcNutritionSeeder.TrySeedAsync(db, apiKey, forceRefresh, logger, ct);

        logger?.LogInformation("USDA FDC nutrition seeding completed. Profiles updated: {Count}.", updated);
        return updated;
    }

    private static List<MenuItem> BuildSeedItems() => new()
    {
        // ENTREES
        new("grilled chicken", MenuCategory.Entree, 1000,
            "breast fillet, lightly seasoned with salt, grapeseed oil and lemon juice"),
        new("grilled beef", MenuCategory.Entree, 1000,
            "tender, lean flank steak, marinated & skewered, grilled medium-well"),
        new("pork belly", MenuCategory.Entree, 1000,
            "cubed pork belly, braised + glazed hongshao rou style"),
        new("grilled lamb", MenuCategory.Entree, 1000,
            "boneless lamb leg portion, marinated & skewered, grilled medium"),
        new("salmon filet", MenuCategory.Entree, 1000,
            "boneless salmon filet, skin-on"),
        new("grilled prawns", MenuCategory.Entree, 1000,
            "jumbo prawns, tail-on, Creole seasoned and grilled"),
        new("grilled squid", MenuCategory.Entree, 1000,
            "tender squid, lightly seasoned and flame-grilled"),
        new("grilled octopus", MenuCategory.Entree, 1000,
            "char-grilled octopus, tenderized and lightly seasoned"),
        new("grilled tofu", MenuCategory.Entree, 1000,
            "extra firm tofu, sesame-ginger glazed"),
        new("fried tofu", MenuCategory.Entree, 1000,
            "medium firm tofu cubes, deep-fried"),
        new("stuffed field roast", MenuCategory.Entree, 1000,
            "our savory house-made field roast with pistachio-herb stuffing"),
        new("seitan", MenuCategory.Entree, 1000,
            "our homemade seitan, sliced and pan-fried"),
        new("vegan sausage", MenuCategory.Entree, 1000,
            "our homemade kielbasa-style vegan sausage, broiled"),
        new("pulled jackfruit", MenuCategory.Entree, 1000,
            "shredded, oven-browned jackfruit, BBQ seasoned"),

        // VEGETABLES
        new("baby bok choy", MenuCategory.Vegetable, 800,
            "tender steamed greens"),
        new("kimchi", MenuCategory.Vegetable, 800,
            "spicy fermented cabbage"),
        new("glazed carrots", MenuCategory.Vegetable, 800,
            "organic carrots, lightly glazed with maple syrup, sea salt"),
        new("braised greens", MenuCategory.Vegetable, 800,
            "baby kale, chard, spinach"),
        new("roasted kale", MenuCategory.Vegetable, 800,
            "oven-crisped kale leaves"),
        new("roasted broccoli", MenuCategory.Vegetable, 800,
            "oven-roasted broccoli florets"),

        // FRUIT
        new("sliced banana", MenuCategory.Fruit, 500,
            "organic, peeled and sliced"),
        new("mandarin oranges", MenuCategory.Fruit, 500,
            "peeled and sectioned"),
        new("blackberries", MenuCategory.Fruit, 500,
            "organic, locally grown"),
        new("sliced pear", MenuCategory.Fruit, 500,
            "organic, locally grown"),
        new("green grapes", MenuCategory.Fruit, 500,
            "organic, seedless"),

        // SIDES
        new("steamed rice", MenuCategory.Side, 300,
            "organic short-grain white rice"),
        new("fried rice", MenuCategory.Side, 300,
            "our steamed rice, wok-fried with sweet soy sauce and peanut oil"),
        new("crispy potatoes", MenuCategory.Side, 300,
            "organic mini gold potatoes, smashed and roasted until crisp"),
        new("bean thread noodles", MenuCategory.Side, 300,
            "tender, translucent, stretchy mung bean vermicelli, lightly seasoned"),
        new("black bean noodles", MenuCategory.Side, 300,
            "stretchy, starchy wheat noodles seasoned with black soybean sauce"),

        // SAUCES
        new("soy ginger sauce", MenuCategory.Sauce, 100,
            "teriyaki-style sweet + savory soy/garlic/ginger/sesame sauce"),
        new("yellow curry sauce", MenuCategory.Sauce, 100,
            "Southeast-Asian-style mild yellow coconut curry sauce"),
        new("brown gravy", MenuCategory.Sauce, 100,
            "thick brown gravy-style pan sauce with caramelized onions"),
        new("peanut sauce", MenuCategory.Sauce, 100,
            "rich coconut-cream and peanut sauce"),
        new("hot pepper sauce", MenuCategory.Sauce, 100,
            "cayenne, vinegar; old-school hot sauce"),
        new("gochujang", MenuCategory.Sauce, 100,
            "spicy, sweet, and savory fermented red chili condiment"),
        new("sesame miso dressing", MenuCategory.Sauce, 100,
            "homemade, creamy, great on everything"),
        new("cilantro vinaigrette", MenuCategory.Sauce, 100,
            "white wine vinegar, white pepper, organic cilantro"),

        // TOPPINGS
        new("radish sprouts", MenuCategory.Topping, 100,
            "tender, green, bright and fresh taste"),
        new("bean sprouts", MenuCategory.Topping, 100,
            "crisp organic bean sprouts"),
        new("cilantro", MenuCategory.Topping, 100,
            "organic minced cilantro leaves"),
        new("green onion", MenuCategory.Topping, 100,
            "fresh, minced organic scallions"),
        new("chopped peanuts", MenuCategory.Topping, 100,
            "deep-roasted and coarse-chopped"),
        new("shishito peppers", MenuCategory.Topping, 100,
            "blistered, crispy, some spicier than others"),
        new("chili garlic peas", MenuCategory.Topping, 100,
            "crunchy, salty, savory, spicy fried green peas"),

        // BEVERAGES
        new("water", MenuCategory.Beverage, 100,
            "8 oz. bottle"),
        new("sparkling water", MenuCategory.Beverage, 100,
            "8 oz. can"),
        new("hot tea", MenuCategory.Beverage, 200,
            "16 oz., organic green tea"),
        new("iced tea", MenuCategory.Beverage, 200,
            "16 oz., organic black tea"),
        new("apple-carrot juice", MenuCategory.Beverage, 300,
            "6 oz., organic, fresh-pressed"),
        new("chocolate oatmilk", MenuCategory.Beverage, 300,
            "6 oz., organic"),
    };
}





