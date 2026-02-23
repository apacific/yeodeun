namespace Yeodeun.Api.Contracts;

/// <summary>
/// Represents the checkout totals dto record.
/// </summary>
public sealed record CheckoutTotalsDto(
    int ComboTotalCents,
    int ALaCarteTotalCents,
    int OrderTotalCents
);

/// <summary>
/// Represents the checkout card dto record.
/// </summary>
public sealed record CheckoutCardDto(
    string Name,
    string Number,
    string Expiry,
    string Cvv
);

/// <summary>
/// Represents the checkout ala carte item dto record.
/// </summary>
public sealed record CheckoutALaCarteItemDto(
    Guid MenuItemId,
    int Quantity
);

/// <summary>
/// Represents the checkout request dto record.
/// </summary>
public sealed record CheckoutRequestDto(
    string PaymentMethod,
    string? Notes,
    DishSelectionDto Selection,
    IReadOnlyList<CheckoutALaCarteItemDto> ALaCarteItems,
    CheckoutTotalsDto Totals,
    CheckoutCardDto? Card
);

/// <summary>
/// Represents the checkout response dto record.
/// </summary>
public sealed record CheckoutResponseDto(
    string Message,
    Guid OrderId
);

