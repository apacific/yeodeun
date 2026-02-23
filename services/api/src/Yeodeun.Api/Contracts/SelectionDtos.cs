namespace Yeodeun.Api.Contracts;

/// <summary>
/// Represents the dish selection dto class.
/// </summary>
public sealed class DishSelectionDto
{
    /// <summary>
    /// Gets or sets the entree id.
    /// </summary>
    public Guid? EntreeId { get; set; }
    /// <summary>
    /// Gets or sets the vegetable id.
    /// </summary>
    public Guid? VegetableId { get; set; }
    /// <summary>
    /// Gets or sets the fruit id.
    /// </summary>
    public Guid? FruitId { get; set; }
    /// <summary>
    /// Gets or sets the side id.
    /// </summary>
    public Guid? SideId { get; set; }

    /// <summary>
    /// Gets or sets the sauce ids.
    /// </summary>
    public List<Guid> SauceIds { get; set; } = new();
    /// <summary>
    /// Gets or sets the topping ids.
    /// </summary>
    public List<Guid> ToppingIds { get; set; } = new();

    /// <summary>
    /// Gets or sets the beverage id.
    /// </summary>
    public Guid? BeverageId { get; set; }
}

