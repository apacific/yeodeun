namespace Yeodeun.Api.Contracts;

/// <summary>
/// Represents the nutrition quote request dto record.
/// </summary>
public sealed record NutritionQuoteRequestDto(
    DishSelectionDto Selection
);

/// <summary>
/// Represents the nutrition totals dto record.
/// </summary>
public sealed record NutritionTotalsDto(
    int Calories,
    decimal TotalFatG,
    decimal SaturatedFatG,
    decimal TransFatG,
    int CholesterolMg,
    int SodiumMg,
    decimal TotalCarbsG,
    decimal DietaryFiberG,
    decimal TotalSugarsG,
    decimal AddedSugarsG,
    decimal ProteinG
);

/// <summary>
/// Represents the nutrition profile dto record.
/// </summary>
public sealed record NutritionProfileDto(
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
    string? SourceUrl,
    string? ExternalRef,
    DateTimeOffset LastUpdatedUtc
);

// Per-item breakdown row (selected items only)
/// <summary>
/// Represents the nutrition quote line dto record.
/// </summary>
public sealed record NutritionQuoteLineDto(
    Guid Id,
    string Name,
    string Category,
    NutritionProfileDto? Nutrition
);

/// <summary>
/// Represents the nutrition quote response dto record.
/// </summary>
public sealed record NutritionQuoteResponseDto(
    NutritionTotalsDto Totals,
    IReadOnlyList<NutritionQuoteLineDto> Lines,
    IReadOnlyList<Guid> MissingNutritionForItemIds,
    IReadOnlyList<string> Notes
);
