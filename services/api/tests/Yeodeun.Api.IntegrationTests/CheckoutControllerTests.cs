using Xunit;
using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Yeodeun.Api.Contracts;
using Yeodeun.Domain.Menu;
using Yeodeun.Infrastructure.Persistence;

namespace Yeodeun.Api.IntegrationTests;

public sealed class CheckoutControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public CheckoutControllerTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Submit_WhenClientTotalsAreTampered_ReturnsBadRequestWithExpectedTotals()
    {
        var client = _factory.CreateClient();
        var ids = await EnsureSeededAndGetIdsAsync();

        var request = new CheckoutRequestDto(
            PaymentMethod: "cash",
            Notes: null,
            Selection: new DishSelectionDto
            {
                EntreeId = ids["Entree"],
                VegetableId = ids["Vegetable"],
                FruitId = ids["Fruit"],
                SideId = ids["Side"],
                SauceIds = [ids["Sauce1"], ids["Sauce2"]],
            },
            ALaCarteItems: [new CheckoutALaCarteItemDto(ids["Beverage"], 1)],
            Totals: new CheckoutTotalsDto(0, 100, 100),
            Card: null,
            Selections: null);

        var response = await client.PostAsJsonAsync("/api/checkout", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Submitted totals do not match server pricing", body);
    }

    [Fact]
    public async Task Submit_WhenRequestIsValid_ReturnsOk()
    {
        var client = _factory.CreateClient();
        var ids = await EnsureSeededAndGetIdsAsync();

        var selection = new DishSelectionDto
        {
            EntreeId = ids["Entree"],
            VegetableId = ids["Vegetable"],
            FruitId = ids["Fruit"],
            SideId = ids["Side"],
            SauceIds = [ids["Sauce1"], ids["Sauce2"]],
            ToppingIds = [ids["Topping"]],
            BeverageId = ids["Beverage"],
        };

        var totals = new CheckoutTotalsDto(2300, 0, 2300);

        var request = new CheckoutRequestDto(
            PaymentMethod: "card",
            Notes: "leave at front",
            Selection: selection,
            ALaCarteItems: [],
            Totals: totals,
            Card: new CheckoutCardDto("Test User", "4242424242424242", "12/30", "123"),
            Selections: [selection]);

        var response = await client.PostAsJsonAsync("/api/checkout", request);

        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == HttpStatusCode.OK, $"Expected 200 OK but got {(int)response.StatusCode}: {body}");
        var payload = await response.Content.ReadFromJsonAsync<CheckoutResponseDto>();
        Assert.NotNull(payload);
        Assert.NotEqual(Guid.Empty, payload!.OrderId);
    }

    [Fact]
    public async Task Submit_WhenCategoryMappingIsWrong_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();
        var ids = await EnsureSeededAndGetIdsAsync();

        var request = new CheckoutRequestDto(
            PaymentMethod: "cash",
            Notes: null,
            Selection: new DishSelectionDto
            {
                EntreeId = ids["Side"],
                VegetableId = ids["Vegetable"],
                FruitId = ids["Fruit"],
                SideId = ids["Entree"],
                SauceIds = [ids["Sauce1"], ids["Sauce2"]],
            },
            ALaCarteItems: [],
            Totals: new CheckoutTotalsDto(0, 0, 0),
            Card: null,
            Selections: null);

        var response = await client.PostAsJsonAsync("/api/checkout", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task<Dictionary<string, Guid>> EnsureSeededAndGetIdsAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<YeodeunDbContext>();
        await db.Database.EnsureCreatedAsync();

        var marker = $"test-suite-{Guid.NewGuid():N}";

        var entree = new MenuItem($"{marker}-entree", MenuCategory.Entree, 1000);
        var vegetable = new MenuItem($"{marker}-vegetable", MenuCategory.Vegetable, 800);
        var fruit = new MenuItem($"{marker}-fruit", MenuCategory.Fruit, 500);
        var side = new MenuItem($"{marker}-side", MenuCategory.Side, 300);
        var sauce1 = new MenuItem($"{marker}-sauce-1", MenuCategory.Sauce, 100);
        var sauce2 = new MenuItem($"{marker}-sauce-2", MenuCategory.Sauce, 100);
        var topping = new MenuItem($"{marker}-topping", MenuCategory.Topping, 100);
        var beverage = new MenuItem($"{marker}-beverage", MenuCategory.Beverage, 100);

        db.MenuItems.AddRange(entree, vegetable, fruit, side, sauce1, sauce2, topping, beverage);
        await db.SaveChangesAsync();

        return new Dictionary<string, Guid>
        {
            ["Entree"] = entree.Id,
            ["Vegetable"] = vegetable.Id,
            ["Fruit"] = fruit.Id,
            ["Side"] = side.Id,
            ["Sauce1"] = sauce1.Id,
            ["Sauce2"] = sauce2.Id,
            ["Topping"] = topping.Id,
            ["Beverage"] = beverage.Id,
        };
    }
}
