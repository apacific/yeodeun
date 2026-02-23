namespace Yeodeun.Api.Contracts;

/// <summary>
/// Represents the menu item dto record.
/// </summary>
public sealed record MenuItemDto(
    Guid Id,
    string Name,
    string? Description,
    string Category,
    int PriceCents,
    bool IsActive,
    NutritionProfileDto? Nutrition = null
);

/// <summary>
/// Represents the menu category group dto record.
/// </summary>
public sealed record MenuCategoryGroupDto(
    string Category,
    IReadOnlyList<MenuItemDto> Items
);

/// <summary>
/// Represents the grouped menu dto record.
/// </summary>
public sealed record GroupedMenuDto(
    IReadOnlyList<MenuCategoryGroupDto> Groups
);

/// <summary>
/// Represents the menu category count dto record.
/// </summary>
public sealed record MenuCategoryCountDto(
    string Category,
    int Count
);

/// <summary>
/// Represents the menu item with nutrition dto record.
/// </summary>
public sealed record MenuItemWithNutritionDto(
    Guid Id,
    string Name,
    string? Description,
    string Category,
    int PriceCents,
    bool IsActive,
    NutritionProfileDto? Nutrition
);

