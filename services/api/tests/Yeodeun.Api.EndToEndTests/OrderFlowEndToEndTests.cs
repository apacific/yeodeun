using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Yeodeun.Domain.Menu;
using Yeodeun.Infrastructure.Persistence;
using Xunit;
using System.Net;
using System.Net.Http.Json;
using Yeodeun.Api.Contracts;

namespace Yeodeun.Api.EndToEndTests;

public sealed class OrderFlowEndToEndTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public OrderFlowEndToEndTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task MenuToQuoteToCheckout_Flow_CompletesSuccessfully()
    {
        var client = _factory.CreateClient();
        await EnsureSeededAsync();

        var menu = await client.GetFromJsonAsync<List<MenuItemDto>>("/api/menu/items");
        Assert.NotNull(menu);
        Assert.True(menu!.Count >= 7);

        var entree = menu.First(x => x.Category == "Entree");
        var vegetable = menu.First(x => x.Category == "Vegetable");
        var fruit = menu.First(x => x.Category == "Fruit");
        var side = menu.First(x => x.Category == "Side");
        var sauces = menu.Where(x => x.Category == "Sauce").Take(2).ToList();

        var selection = new DishSelectionDto
        {
            EntreeId = entree.Id,
            VegetableId = vegetable.Id,
            FruitId = fruit.Id,
            SideId = side.Id,
            SauceIds = sauces.Select(x => x.Id).ToList(),
        };

        var quoteResponse = await client.PostAsJsonAsync("/api/quote", new SelectionRequestDto(selection));
        Assert.Equal(HttpStatusCode.OK, quoteResponse.StatusCode);

        var quote = await quoteResponse.Content.ReadFromJsonAsync<QuoteResponseDto>();
        Assert.NotNull(quote);
        Assert.True(quote!.ComboApplied);

        var checkoutResponse = await client.PostAsJsonAsync("/api/checkout", new CheckoutRequestDto(
            PaymentMethod: "cash",
            Notes: null,
            Selection: selection,
            ALaCarteItems: [],
            Totals: new CheckoutTotalsDto(
                ComboTotalCents: quote.TotalCents,
                ALaCarteTotalCents: 0,
                OrderTotalCents: quote.TotalCents),
            Card: null,
            Selections: [selection]));

        Assert.Equal(HttpStatusCode.OK, checkoutResponse.StatusCode);

        var checkout = await checkoutResponse.Content.ReadFromJsonAsync<CheckoutResponseDto>();
        Assert.NotNull(checkout);
        Assert.NotEqual(Guid.Empty, checkout!.OrderId);
    }


    private async Task EnsureSeededAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<YeodeunDbContext>();

        await db.Database.EnsureCreatedAsync();

        if (await db.MenuItems.AnyAsync())
        {
            return;
        }

        db.MenuItems.AddRange(
            new MenuItem("grilled chicken", MenuCategory.Entree, 1000),
            new MenuItem("baby bok choy", MenuCategory.Vegetable, 800),
            new MenuItem("mandarin oranges", MenuCategory.Fruit, 500),
            new MenuItem("steamed rice", MenuCategory.Side, 300),
            new MenuItem("soy ginger sauce", MenuCategory.Sauce, 100),
            new MenuItem("yellow curry sauce", MenuCategory.Sauce, 100),
            new MenuItem("chopped peanuts", MenuCategory.Topping, 100),
            new MenuItem("water", MenuCategory.Beverage, 100));

        await db.SaveChangesAsync();
    }

}
