using Xunit;
using Yeodeun.Application.Pricing;
using Yeodeun.Domain.Menu;

namespace Yeodeun.Application.Tests;

public sealed class PricingServiceTests
{
    private readonly PricingService _sut = new();

    [Fact]
    public void Quote_AlaCarte_AppliesSauceCreditsAndChargesRemainingSauces()
    {
        var entree = NewItem(MenuCategory.Entree, 1000);
        var vegetable = NewItem(MenuCategory.Vegetable, 800);
        var fruit = NewItem(MenuCategory.Fruit, 500);
        var side = NewItem(MenuCategory.Side, 300);
        var sauce1 = NewItem(MenuCategory.Sauce, 100);
        var sauce2 = NewItem(MenuCategory.Sauce, 100);
        var sauce3 = NewItem(MenuCategory.Sauce, 100);

        var req = new QuoteRequest(
            EntreeIds: [entree.Id],
            VegetableIds: [vegetable.Id],
            FruitIds: [fruit.Id],
            SideIds: [side.Id],
            SauceIds: [sauce1.Id, sauce2.Id, sauce3.Id],
            ToppingIds: [],
            BeverageIds: []);

        var items = BuildItems(entree, vegetable, fruit, side, sauce1, sauce2, sauce3);

        var result = _sut.Quote(req, items);

        Assert.False(result.IsCombo);
        Assert.Equal(2, result.SauceCredits);
        Assert.Equal(3, result.SaucesSelected);
        Assert.Equal(1, result.SaucesCharged);
        Assert.Equal(2900, result.ListPriceCents);
        Assert.Equal(2700, result.FinalPriceCents);
    }

    [Fact]
    public void Quote_Combo_UsesComboPriceAndChargesOnlyExtras()
    {
        var entree = NewItem(MenuCategory.Entree, 1000);
        var vegetable = NewItem(MenuCategory.Vegetable, 800);
        var fruit = NewItem(MenuCategory.Fruit, 500);
        var side = NewItem(MenuCategory.Side, 300);
        var sauce1 = NewItem(MenuCategory.Sauce, 100);
        var sauce2 = NewItem(MenuCategory.Sauce, 100);
        var topping = NewItem(MenuCategory.Topping, 100);
        var beverage = NewItem(MenuCategory.Beverage, 300);

        var req = new QuoteRequest(
            EntreeIds: [entree.Id],
            VegetableIds: [vegetable.Id],
            FruitIds: [fruit.Id],
            SideIds: [side.Id],
            SauceIds: [sauce1.Id, sauce2.Id],
            ToppingIds: [topping.Id],
            BeverageIds: [beverage.Id]);

        var items = BuildItems(entree, vegetable, fruit, side, sauce1, sauce2, topping, beverage);

        var result = _sut.Quote(req, items);

        Assert.True(result.IsCombo);
        Assert.Equal(PricingRules.ComboPriceCents, result.ComboPriceCents);
        Assert.Equal(0, result.SaucesCharged);
        Assert.Equal(2500, result.FinalPriceCents);
        Assert.True(result.SavingsCents > 0);
    }

    [Fact]
    public void Quote_MissingComboCoreItems_DoesNotApplyCombo()
    {
        var entree = NewItem(MenuCategory.Entree, 1000);
        var vegetable = NewItem(MenuCategory.Vegetable, 800);
        var fruit = NewItem(MenuCategory.Fruit, 500);
        var sauce1 = NewItem(MenuCategory.Sauce, 100);
        var sauce2 = NewItem(MenuCategory.Sauce, 100);

        var req = new QuoteRequest(
            EntreeIds: [entree.Id],
            VegetableIds: [vegetable.Id],
            FruitIds: [fruit.Id],
            SideIds: [],
            SauceIds: [sauce1.Id, sauce2.Id],
            ToppingIds: [],
            BeverageIds: []);

        var items = BuildItems(entree, vegetable, fruit, sauce1, sauce2);

        var result = _sut.Quote(req, items);

        Assert.False(result.IsCombo);
        Assert.Equal(0, result.SaucesCharged);
        Assert.Equal(2300, result.FinalPriceCents);
    }

    private static Dictionary<Guid, MenuItem> BuildItems(params MenuItem[] values)
        => values.ToDictionary(item => item.Id);

    private static MenuItem NewItem(MenuCategory category, int priceCents)
        => new($"{category}-{Guid.NewGuid():N}", category, priceCents);
}
