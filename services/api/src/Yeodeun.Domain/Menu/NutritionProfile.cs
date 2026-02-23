namespace Yeodeun.Domain.Menu;

/// <summary>
/// Represents the nutrition profile class.
/// </summary>
public sealed class NutritionProfile
{
    /// <summary>
    /// Gets or sets the id.
    /// </summary>
    public Guid Id { get; private set; } = Guid.NewGuid();
    /// <summary>
    /// Gets or sets the menu item id.
    /// </summary>
    public Guid MenuItemId { get; private set; }

    /// <summary>
    /// Gets or sets the serving grams.
    /// </summary>
    public decimal ServingGrams { get; private set; }
    /// <summary>
    /// Gets or sets the calories.
    /// </summary>
    public decimal Calories { get; private set; }
    /// <summary>
    /// Gets or sets the total fat g.
    /// </summary>
    public decimal TotalFatG { get; private set; }
    /// <summary>
    /// Gets or sets the saturated fat g.
    /// </summary>
    public decimal SaturatedFatG { get; private set; }
    /// <summary>
    /// Gets or sets the trans fat g.
    /// </summary>
    public decimal TransFatG { get; private set; }

    /// <summary>
    /// Gets or sets the cholesterol mg.
    /// </summary>
    public int CholesterolMg { get; private set; }
    /// <summary>
    /// Gets or sets the sodium mg.
    /// </summary>
    public int SodiumMg { get; private set; }

    /// <summary>
    /// Gets or sets the total carb g.
    /// </summary>
    public decimal TotalCarbG { get; private set; }
    /// <summary>
    /// Gets or sets the dietary fiber g.
    /// </summary>
    public decimal DietaryFiberG { get; private set; }
    /// <summary>
    /// Gets or sets the total sugars g.
    /// </summary>
    public decimal TotalSugarsG { get; private set; }
    /// <summary>
    /// Gets or sets the added sugars g.
    /// </summary>
    public decimal AddedSugarsG { get; private set; }
    /// <summary>
    /// Gets or sets the protein g.
    /// </summary>
    public decimal ProteinG { get; private set; }

    /// <summary>
    /// Gets or sets the source name.
    /// </summary>
    public string SourceName { get; private set; } = "TBD";
    /// <summary>
    /// Gets or sets the source url.
    /// </summary>
    public string? SourceUrl { get; private set; }
    /// <summary>
    /// Gets or sets the external ref.
    /// </summary>
    public string? ExternalRef { get; private set; }
    /// <summary>
    /// Gets or sets the last updated utc.
    /// </summary>
    public DateTimeOffset LastUpdatedUtc { get; private set; } = DateTimeOffset.UtcNow;

    private NutritionProfile() { }

    public NutritionProfile(Guid menuItemId, decimal servingGrams)
    {
        MenuItemId = menuItemId;
        ServingGrams = servingGrams;
    }

    public void UpdateNutritionFacts(
        decimal servingGrams,
        decimal calories,
        decimal totalFatG,
        decimal saturatedFatG,
        decimal transFatG,
        int cholesterolMg,
        int sodiumMg,
        decimal totalCarbG,
        decimal dietaryFiberG,
        decimal totalSugarsG,
        decimal addedSugarsG,
        decimal proteinG,
        string sourceName,
        string? sourceUrl,
        string? externalRef,
        DateTimeOffset lastUpdatedUtc)
    {
        if (servingGrams <= 0) throw new ArgumentOutOfRangeException(nameof(servingGrams));
        if (calories < 0) throw new ArgumentOutOfRangeException(nameof(calories));
        if (totalFatG < 0) throw new ArgumentOutOfRangeException(nameof(totalFatG));
        if (saturatedFatG < 0) throw new ArgumentOutOfRangeException(nameof(saturatedFatG));
        if (transFatG < 0) throw new ArgumentOutOfRangeException(nameof(transFatG));
        if (cholesterolMg < 0) throw new ArgumentOutOfRangeException(nameof(cholesterolMg));
        if (sodiumMg < 0) throw new ArgumentOutOfRangeException(nameof(sodiumMg));
        if (totalCarbG < 0) throw new ArgumentOutOfRangeException(nameof(totalCarbG));
        if (dietaryFiberG < 0) throw new ArgumentOutOfRangeException(nameof(dietaryFiberG));
        if (totalSugarsG < 0) throw new ArgumentOutOfRangeException(nameof(totalSugarsG));
        if (addedSugarsG < 0) throw new ArgumentOutOfRangeException(nameof(addedSugarsG));
        if (proteinG < 0) throw new ArgumentOutOfRangeException(nameof(proteinG));

        ServingGrams = servingGrams;
        Calories = calories;
        TotalFatG = totalFatG;
        SaturatedFatG = saturatedFatG;
        TransFatG = transFatG;
        CholesterolMg = cholesterolMg;
        SodiumMg = sodiumMg;
        TotalCarbG = totalCarbG;
        DietaryFiberG = dietaryFiberG;
        TotalSugarsG = totalSugarsG;
        AddedSugarsG = addedSugarsG;
        ProteinG = proteinG;

        SourceName = string.IsNullOrWhiteSpace(sourceName) ? "TBD" : sourceName.Trim();
        SourceUrl = string.IsNullOrWhiteSpace(sourceUrl) ? null : sourceUrl.Trim();
        ExternalRef = string.IsNullOrWhiteSpace(externalRef) ? null : externalRef.Trim();
        LastUpdatedUtc = lastUpdatedUtc;
    }
}

