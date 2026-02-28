using Xunit;
using Yeodeun.Domain.Menu;

namespace Yeodeun.Domain.Tests;

public sealed class MenuItemTests
{
    [Fact]
    public void Constructor_ValidValues_SetsProperties()
    {
        var item = new MenuItem("Grilled Chicken", MenuCategory.Entree, 1000, "Juicy and seasoned.");

        Assert.Equal("Grilled Chicken", item.Name);
        Assert.Equal(MenuCategory.Entree, item.Category);
        Assert.Equal(1000, item.PriceCents);
        Assert.Equal("Juicy and seasoned.", item.Description);
        Assert.True(item.IsActive);
    }

    [Fact]
    public void Rename_WhitespaceOnly_ThrowsArgumentException()
    {
        var item = new MenuItem("Water", MenuCategory.Beverage, 100);

        Assert.Throws<ArgumentException>(() => item.Rename("   "));
    }

    [Fact]
    public void UpdatePriceCents_Negative_ThrowsArgumentOutOfRangeException()
    {
        var item = new MenuItem("Water", MenuCategory.Beverage, 100);

        Assert.Throws<ArgumentOutOfRangeException>(() => item.UpdatePriceCents(-1));
    }

    [Fact]
    public void UpdateDescription_NullOrWhitespace_ClearsDescription()
    {
        var item = new MenuItem("Water", MenuCategory.Beverage, 100, "Initial");

        item.UpdateDescription(" ");

        Assert.Null(item.Description);
    }
}
