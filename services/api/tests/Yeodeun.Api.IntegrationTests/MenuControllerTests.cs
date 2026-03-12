using System.Net;
using System.Net.Http.Json;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using Yeodeun.Api.Contracts;
using Yeodeun.Domain.Menu;
using Yeodeun.Infrastructure.Persistence;

namespace Yeodeun.Api.IntegrationTests;

public sealed class MenuControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public MenuControllerTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetCategories_ReturnsAlphabeticalCategories()
    {
        var client = _factory.CreateClient();
        await EnsureSeededMenuForCategoryTestsAsync();

        var response = await client.GetAsync("/api/menu/categories");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var categories = await response.Content.ReadFromJsonAsync<List<string>>();
        Assert.NotNull(categories);

        var expectedSorted = categories.OrderBy(x => x).ToList();
        Assert.Equal(expectedSorted, categories);
        Assert.Contains("Beverage", categories);
        Assert.Contains("Entree", categories);
    }

    [Fact]
    public async Task GetItems_FiltersByCategoryAndRespectsIsActiveFlag()
    {
        var client = _factory.CreateClient();

        var marker = $"contract-active-{Guid.NewGuid():N}";
        await using var seedScope = _factory.Services.CreateAsyncScope();
        var db = seedScope.ServiceProvider.GetRequiredService<YeodeunDbContext>();
        await db.Database.EnsureCreatedAsync();

        var activeEntree = new MenuItem($"{marker}-active-entree", MenuCategory.Entree, 900);
        var inactiveEntree = new MenuItem($"{marker}-inactive-entree", MenuCategory.Entree, 1000);
        inactiveEntree.SetInactive();

        db.MenuItems.AddRange(activeEntree, inactiveEntree);
        await db.SaveChangesAsync();

        var defaultResponse = await client.GetFromJsonAsync<List<MenuItemDto>>($"/api/menu/items?category=Entree");
        Assert.NotNull(defaultResponse);
        Assert.All(defaultResponse, item => Assert.True(item.IsActive));
        Assert.All(defaultResponse, item => Assert.Equal("Entree", item.Category));
        Assert.Contains(defaultResponse, item => item.Name == $"{marker}-active-entree");
        Assert.DoesNotContain(defaultResponse, item => item.Name == $"{marker}-inactive-entree");

        var includeInactiveResponse = await client.GetFromJsonAsync<List<MenuItemDto>>($"/api/menu/items?category=Entree&includeInactive=true");
        Assert.NotNull(includeInactiveResponse);
        Assert.Contains(includeInactiveResponse, item => item.Name == $"{marker}-active-entree");
        Assert.Contains(includeInactiveResponse, item => item.Name == $"{marker}-inactive-entree");
    }

    [Fact]
    public async Task GetItems_WhenIncludeNutritionTrue_ReturnsNutritionPayload()
    {
        var client = _factory.CreateClient();

        var marker = $"contract-nutrition-{Guid.NewGuid():N}";
        await using var seedScope = _factory.Services.CreateAsyncScope();
        var db = seedScope.ServiceProvider.GetRequiredService<YeodeunDbContext>();
        await db.Database.EnsureCreatedAsync();

        var item = new MenuItem($"{marker}", MenuCategory.Fruit, 550);
        db.MenuItems.Add(item);
        await db.SaveChangesAsync();

        var nutritionProfile = new NutritionProfile(item.Id, 125);
        nutritionProfile.UpdateNutritionFacts(
            servingGrams: 125,
            calories: 80,
            totalFatG: 0.2m,
            saturatedFatG: 0m,
            transFatG: 0m,
            cholesterolMg: 0,
            sodiumMg: 2,
            totalCarbG: 20m,
            dietaryFiberG: 4m,
            totalSugarsG: 12m,
            addedSugarsG: 8m,
            proteinG: 1m,
            sourceName: "Test Source",
            sourceUrl: "https://example.test/nutrition",
            externalRef: "ref-123",
            lastUpdatedUtc: DateTimeOffset.UtcNow);

        db.NutritionProfiles.Add(nutritionProfile);
        await db.SaveChangesAsync();

        var items = await client.GetFromJsonAsync<List<MenuItemDto>>($"/api/menu/items?category=Fruit&includeNutrition=true");
        Assert.NotNull(items);
        var matching = items.Single(itemDto => itemDto.Id == item.Id);
        Assert.NotNull(matching.Nutrition);
        Assert.Equal(80, matching.Nutrition.Calories);
        Assert.Equal("Test Source", matching.Nutrition.SourceName);
    }

    [Fact]
    public async Task GetItems_WithInvalidCategory_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/menu/items?category=Invalid");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Invalid category 'Invalid'.", body);
    }

    private async Task EnsureSeededMenuForCategoryTestsAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<YeodeunDbContext>();
        await db.Database.EnsureCreatedAsync();

        var existingCategories = await db.MenuItems
            .Select(item => item.Category)
            .Distinct()
            .ToListAsync();

        if (!existingCategories.Contains(MenuCategory.Beverage))
        {
            db.MenuItems.Add(new MenuItem("seed-category-beverage", MenuCategory.Beverage, 200));
        }

        if (!existingCategories.Contains(MenuCategory.Entree))
        {
            db.MenuItems.Add(new MenuItem("seed-category-entree", MenuCategory.Entree, 1000));
        }

        if (db.ChangeTracker.HasChanges())
        {
            await db.SaveChangesAsync();
        }
    }
}
