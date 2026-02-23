namespace Yeodeun.Domain.Menu;

/// <summary>
/// Represents a purchasable menu item.
/// </summary>
public sealed class MenuItem
{
    /// <summary>
    /// Gets the unique menu item identifier.
    /// </summary>
    public Guid Id { get; private set; } = Guid.NewGuid();
    /// <summary>
    /// Gets the display name.
    /// </summary>
    public string Name { get; private set; } = default!;
    /// <summary>
    /// Gets the optional item description.
    /// </summary>
    public string? Description { get; private set; }
    /// <summary>
    /// Gets the menu category.
    /// </summary>
    public MenuCategory Category { get; private set; }
    /// <summary>
    /// Gets the unit price in cents.
    /// </summary>
    public int PriceCents { get; private set; }
    /// <summary>
    /// Gets a value indicating whether the item is available for ordering.
    /// </summary>
    public bool IsActive { get; private set; } = true;

    /// <summary>
    /// Gets the optional nutrition profile.
    /// </summary>
    public NutritionProfile? NutritionProfile { get; private set; }

    private MenuItem() { }

    /// <summary>
    /// Initializes a new instance of the <see cref="MenuItem"/> class.
    /// </summary>
    /// <param name="name">The item name.</param>
    /// <param name="category">The item category.</param>
    /// <param name="priceCents">The unit price in cents.</param>
    /// <param name="description">The optional item description.</param>
    public MenuItem(string name, MenuCategory category, int priceCents, string? description = null)
    {
        Rename(name);
        Category = category;
        UpdatePriceCents(priceCents);
        UpdateDescription(description);
    }

    /// <summary>
    /// Updates the item name.
    /// </summary>
    /// <param name="name">The new name.</param>
    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Name is required.", nameof(name));
        Name = name.Trim();
    }

    /// <summary>
    /// Updates the unit price.
    /// </summary>
    /// <param name="priceCents">The new unit price in cents.</param>
    public void UpdatePriceCents(int priceCents)
    {
        if (priceCents < 0) throw new ArgumentOutOfRangeException(nameof(priceCents));
        PriceCents = priceCents;
    }

    /// <summary>
    /// Updates the item description.
    /// </summary>
    /// <param name="description">The new description, or null/empty to clear it.</param>
    public void UpdateDescription(string? description)
    {
        Description = string.IsNullOrWhiteSpace(description)
            ? null
            : description.Trim();
    }

    // Convenience methods for readability at call sites
    /// <summary>
    /// Marks the item as active.
    /// </summary>
    public void SetActive() => IsActive = true;
    /// <summary>
    /// Marks the item as inactive.
    /// </summary>
    public void SetInactive() => IsActive = false;
    /// <summary>
    /// Marks the item as active.
    /// </summary>
    /// <param name="isActive">True to activate the item; otherwise, false.</param>
    public void SetActive(bool isActive) => IsActive = isActive;
}

