namespace Yeodeun.Api.Contracts;

/// <summary>
/// Represents the quote line dto record.
/// </summary>
public sealed record QuoteLineDto(
    Guid Id,
    string Name,
    string Category,
    int PriceCents
);

/// <summary>
/// Represents the quote response dto record.
/// </summary>
public sealed record QuoteResponseDto(
    IReadOnlyList<QuoteLineDto> Lines,
    int ListPriceCents,
    int SauceCredits,
    int SaucesSelected,
    int SaucesCharged,
    int SauceDiscountCents,
    bool ComboApplied,
    int ComboBasePriceCents,
    int ComboDiscountCents,
    int TotalCents,
    IReadOnlyList<string> Notes
);

