using System.Globalization;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Yeodeun.Domain.Menu;

namespace Yeodeun.Infrastructure.Persistence;

/// <summary>
/// Seeds nutrition profiles from USDA FoodData Central (FDC).
/// </summary>
internal static class UsdaFdcNutritionSeeder
{
    private const string SourceName = "USDA FoodData Central";

    private static readonly HashSet<MenuCategory> SeededCategories =
    [
        MenuCategory.Entree,
        MenuCategory.Vegetable,
        MenuCategory.Fruit,
        MenuCategory.Side,
        MenuCategory.Beverage,
    ];

    private static readonly Dictionary<string, FdcSeedSpec> SeedSpecs = new(StringComparer.OrdinalIgnoreCase)
    {
        ["grilled chicken"] = new("chicken breast grilled cooked", 150m),
        ["grilled beef"] = new("beef flank steak cooked grilled", 150m),
        ["pork belly"] = new("pork belly cooked braised", 150m),
        ["grilled lamb"] = new("lamb leg cooked roasted", 150m),
        ["salmon filet"] = new("salmon Atlantic cooked dry heat", 150m),
        ["grilled prawns"] = new("shrimp cooked", 140m),
        ["grilled squid"] = new("squid cooked", 140m),
        ["grilled octopus"] = new("octopus cooked", 140m),
        ["grilled tofu"] = new("tofu firm prepared", 150m),
        ["fried tofu"] = new("tofu fried", 150m),
        ["stuffed field roast"] = new("vegetarian roast meat substitute", 150m),
        ["seitan"] = new("seitan", 150m),
        ["vegan sausage"] = new("vegetarian sausage", 120m),
        ["pulled jackfruit"] = new("jackfruit cooked", 150m),

        ["baby bok choy"] = new("bok choy cooked", 85m),
        ["kimchi"] = new("kimchi", 85m),
        ["glazed carrots"] = new("carrots cooked", 85m),
        ["braised greens"] = new("mixed greens cooked", 85m),
        ["roasted kale"] = new("kale cooked", 85m),
        ["roasted broccoli"] = new("broccoli cooked", 85m),

        ["sliced banana"] = new("banana raw", 118m),
        ["mandarin oranges"] = new("mandarin oranges raw", 120m),
        ["blackberries"] = new("blackberries raw", 100m),
        ["sliced pear"] = new("pear raw", 120m),
        ["green grapes"] = new("grapes green raw", 100m),

        ["steamed rice"] = new("rice white cooked", 158m),
        ["fried rice"] = new("fried rice", 160m),
        ["crispy potatoes"] = new("potatoes roasted", 150m),
        ["bean thread noodles"] = new("mung bean noodles cooked", 140m),
        ["black bean noodles"] = new("wheat noodles cooked", 160m),

        ["water"] = new("water bottled", 237m),
        ["sparkling water"] = new("sparkling water", 237m),
        ["hot tea"] = new("green tea brewed", 473m),
        ["iced tea"] = new("black tea brewed", 473m),
        ["apple-carrot juice"] = new("apple carrot juice", 177m),
        ["chocolate oatmilk"] = new("oat milk chocolate", 177m),
    };

    // Add deterministic fixes here after reviewing audit output and USDA candidates.
    // Example: ["steamed rice"] = 1234567
    private static readonly Dictionary<string, long> FdcIdOverrides = new(StringComparer.OrdinalIgnoreCase)
    {
        ["hot tea"] = 171917,
        ["steamed rice"] = 168932,
        ["fried rice"] = 167668,
        ["grilled prawns"] = 175180,
        ["blackberries"] = 173946,
        ["roasted broccoli"] = 168510,
        ["roasted kale"] = 169355,
        ["bean thread noodles"] = 2708355,
        ["black bean noodles"] = 168909,
        ["vegan sausage"] = 2659276,
        // Optional future overrides (if audit flags them again):
        // ["salmon filet"] = <fdcId for cooked salmon>,
    };

    private static readonly string[] PreferredDataTypes =
    [
        "Foundation",
        "SR Legacy",
        "Survey (FNDDS)"
    ];

    private sealed record FdcSeedSpec(string Query, decimal ServingGrams, long? FdcIdOverride = null);

    private static FdcSeedSpec ApplyFdcOverride(FdcSeedSpec spec, string menuItemName)
    {
        if (!FdcIdOverrides.TryGetValue(menuItemName, out var fdcId))
        {
            return spec;
        }

        return spec with { FdcIdOverride = fdcId };
    }

    public static async Task<int> TrySeedAsync(
        YeodeunDbContext db,
        string? apiKey,
        bool forceRefresh,
        ILogger? logger,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            logger?.LogInformation("USDA FDC nutrition seeding skipped: no API key configured.");
            return 0;
        }

        using var http = new HttpClient
        {
            BaseAddress = new Uri("https://api.nal.usda.gov/fdc/v1/")
        };
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        http.DefaultRequestHeaders.Add("X-Api-Key", apiKey.Trim());

        var menuItems = await db.MenuItems
            .AsTracking()
            .Include(x => x.NutritionProfile)
            .Where(x => x.IsActive && SeededCategories.Contains(x.Category))
            .OrderBy(x => x.Category)
            .ThenBy(x => x.Name)
            .ToListAsync(ct);

        var updated = 0;

        foreach (var item in menuItems)
        {
            ct.ThrowIfCancellationRequested();

            if (!forceRefresh && item.NutritionProfile is not null &&
                string.Equals(item.NutritionProfile.SourceName, SourceName, StringComparison.OrdinalIgnoreCase) &&
                !string.IsNullOrWhiteSpace(item.NutritionProfile.ExternalRef))
            {
                continue;
            }

            if (!SeedSpecs.TryGetValue(item.Name, out var baseSpec))
            {
                logger?.LogWarning("USDA FDC seeding spec missing for menu item '{MenuItemName}'.", item.Name);
                continue;
            }

            var spec = ApplyFdcOverride(baseSpec, item.Name);

            FdcFoodSearchItemDto? selected = null;
            FdcFoodDetailDto? detail = null;
            FdcNutrientIndex? nutrientIndex = null;
            var matchMethod = "search";

            if (spec.FdcIdOverride.HasValue)
            {
                detail = await GetFoodDetailsAsync(http, spec.FdcIdOverride.Value, ct);
                if (detail is null)
                {
                    logger?.LogWarning("USDA FDC details fetch failed for '{MenuItemName}' override fdcId {FdcId}.", item.Name, spec.FdcIdOverride.Value);
                    continue;
                }

                nutrientIndex = BuildNutrientIndex(detail.FoodNutrients);
                if (nutrientIndex.ByNumber.Count == 0 && nutrientIndex.ByName.Count == 0)
                {
                    logger?.LogWarning("USDA FDC override returned no nutrient values for '{MenuItemName}' (fdcId {FdcId}).", item.Name, detail.FdcId);
                    continue;
                }

                selected = new FdcFoodSearchItemDto(detail.FdcId, detail.Description, detail.DataType);
                matchMethod = "override";
            }
            else
            {
                var search = await SearchAsync(http, spec.Query, ct);
                var rankedCandidates = RankCandidates(search?.Foods, item.Name);
                if (rankedCandidates.Count == 0)
                {
                    logger?.LogWarning("USDA FDC search returned no candidate for '{MenuItemName}' (query '{Query}').", item.Name, spec.Query);
                    continue;
                }

                (FdcFoodSearchItemDto Candidate, FdcFoodDetailDto Detail, FdcNutrientIndex Nutrients)? fallbackCandidate = null;

                foreach (var candidate in rankedCandidates.Take(6))
                {
                    var candidateDetail = await GetFoodDetailsAsync(http, candidate.FdcId, ct);
                    if (candidateDetail is null)
                    {
                        continue;
                    }

                    var candidateNutrients = BuildNutrientIndex(candidateDetail.FoodNutrients);
                    if (candidateNutrients.ByNumber.Count == 0 && candidateNutrients.ByName.Count == 0)
                    {
                        continue;
                    }

                    fallbackCandidate ??= (candidate, candidateDetail, candidateNutrients);

                    if (IsPlausibleCandidate(item, candidateNutrients))
                    {
                        selected = candidate;
                        detail = candidateDetail;
                        nutrientIndex = candidateNutrients;
                        break;
                    }
                }

                if (selected is null && fallbackCandidate.HasValue)
                {
                    selected = fallbackCandidate.Value.Candidate;
                    detail = fallbackCandidate.Value.Detail;
                    nutrientIndex = fallbackCandidate.Value.Nutrients;
                    matchMethod = "search-fallback";
                }

                if (selected is null || detail is null || nutrientIndex is null)
                {
                    logger?.LogWarning("USDA FDC could not produce a usable nutrition candidate for '{MenuItemName}' (query '{Query}').", item.Name, spec.Query);
                    continue;
                }
            }

            var useReportedServing = string.Equals(detail.DataType, "Branded", StringComparison.OrdinalIgnoreCase)
                                   && detail.ServingSize.HasValue
                                   && detail.ServingSize.Value > 0
                                   && IsGrams(detail.ServingSizeUnit);

            var servingGrams = useReportedServing
                ? DecimalRound(detail.ServingSize!.Value)
                : spec.ServingGrams;

            var scale = useReportedServing ? 1m : (servingGrams / 100m);

            var profile = item.NutritionProfile ?? new NutritionProfile(item.Id, servingGrams);
            if (item.NutritionProfile is null)
            {
                db.NutritionProfiles.Add(profile);
            }

            profile.UpdateNutritionFacts(
                servingGrams: servingGrams,
                calories: Scale(nutrientIndex, scale, ["1008", "208"], ["energy", "energy (atwater general factors)", "energy (atwater specific factors)", "calories"]),
                totalFatG: Scale(nutrientIndex, scale, ["1004", "204"], ["total lipid (fat)"]),
                saturatedFatG: Scale(nutrientIndex, scale, ["1258", "606"], ["fatty acids, total saturated"]),
                transFatG: Scale(nutrientIndex, scale, ["1257", "605"], ["fatty acids, total trans"]),
                cholesterolMg: IntScale(nutrientIndex, scale, ["1253", "601"], ["cholesterol"]),
                sodiumMg: IntScale(nutrientIndex, scale, ["1093", "307"], ["sodium, na"]),
                totalCarbG: Scale(nutrientIndex, scale, ["1005", "205"], ["carbohydrate, by difference"]),
                dietaryFiberG: Scale(nutrientIndex, scale, ["1079", "291"], ["fiber, total dietary"]),
                totalSugarsG: Scale(nutrientIndex, scale, ["2000", "269"], ["sugars, total including nlea"]),
                addedSugarsG: Scale(nutrientIndex, scale, ["1235", "539"], ["sugars, added"]),
                proteinG: Scale(nutrientIndex, scale, ["1003", "203"], ["protein"]),
                sourceName: SourceName,
                sourceUrl: $"https://fdc.nal.usda.gov/fdc-app.html#/food-details/{selected.FdcId}/nutrients",
                externalRef: selected.FdcId.ToString(CultureInfo.InvariantCulture),
                lastUpdatedUtc: DateTimeOffset.UtcNow);

            updated++;
            logger?.LogInformation(
                "Seeded USDA FDC nutrition for '{MenuItemName}' using fdcId {FdcId} ({Description}, {DataType}, method {MatchMethod}).",
                item.Name,
                selected.FdcId,
                selected.Description,
                selected.DataType,
                matchMethod);
        }

        if (updated > 0)
        {
            await db.SaveChangesAsync(ct);
        }

        return updated;
    }

    private static bool IsGrams(string? unit) =>
        string.Equals(unit?.Trim(), "g", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(unit?.Trim(), "gram", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(unit?.Trim(), "grams", StringComparison.OrdinalIgnoreCase);

    private static decimal Scale(FdcNutrientIndex nutrientIndex, decimal scale, IReadOnlyList<string> nutrientNumbers, IReadOnlyList<string> nutrientNames)
    {
        var value = FindNutrientValue(nutrientIndex, nutrientNumbers, nutrientNames);
        return value.HasValue ? DecimalRound(value.Value * scale) : 0m;
    }

    private static int IntScale(FdcNutrientIndex nutrientIndex, decimal scale, IReadOnlyList<string> nutrientNumbers, IReadOnlyList<string> nutrientNames)
    {
        var value = FindNutrientValue(nutrientIndex, nutrientNumbers, nutrientNames);
        return value.HasValue
            ? (int)Math.Round(value.Value * scale, MidpointRounding.AwayFromZero)
            : 0;
    }

    private static decimal? FindNutrientValue(FdcNutrientIndex nutrientIndex, IReadOnlyList<string> nutrientNumbers, IReadOnlyList<string> nutrientNames)
    {
        foreach (var number in nutrientNumbers)
        {
            if (nutrientIndex.ByNumber.TryGetValue(number, out var byNumber))
            {
                return byNumber;
            }
        }

        foreach (var name in nutrientNames)
        {
            if (nutrientIndex.ByName.TryGetValue(name, out var byName))
            {
                return byName;
            }
        }

        return null;
    }

    private static decimal DecimalRound(decimal value) =>
        Math.Round(value, 1, MidpointRounding.AwayFromZero);

    private static FdcNutrientIndex BuildNutrientIndex(IReadOnlyList<FdcFoodNutrientDto>? nutrients)
    {
        var byNumber = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        var byName = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

        if (nutrients is null)
        {
            return new FdcNutrientIndex(byNumber, byName);
        }

        foreach (var n in nutrients)
        {
            decimal? amount = n.Amount;
            if (!amount.HasValue && n.Value.HasValue)
            {
                amount = n.Value;
            }

            if (!amount.HasValue || amount.Value < 0)
            {
                continue;
            }

            var number = n.Nutrient?.Number ?? n.NutrientNumber;
            if (!string.IsNullOrWhiteSpace(number))
            {
                SetPreferredValue(byNumber, number.Trim(), amount.Value);
            }

            var name = n.Nutrient?.Name;
            if (!string.IsNullOrWhiteSpace(name))
            {
                SetPreferredValue(byName, name.Trim(), amount.Value);
            }
        }

        return new FdcNutrientIndex(byNumber, byName);
    }

    private static void SetPreferredValue(Dictionary<string, decimal> target, string key, decimal value)
    {
        if (!target.TryGetValue(key, out var existing))
        {
            target[key] = value;
            return;
        }

        // USDA rows may contain duplicate nutrient entries where one duplicate is zero.
        // Preserve a non-zero value instead of overwriting it with zero.
        if (existing <= 0m && value > 0m)
        {
            target[key] = value;
        }
    }

    private sealed record FdcNutrientIndex(
        Dictionary<string, decimal> ByNumber,
        Dictionary<string, decimal> ByName);

    private static List<FdcFoodSearchItemDto> RankCandidates(IReadOnlyList<FdcFoodSearchItemDto>? foods, string menuItemName)
    {
        if (foods is null || foods.Count == 0) return [];

        var name = Normalize(menuItemName);
        return foods
            .OrderBy(f => !PreferredDataTypes.Contains(f.DataType ?? string.Empty, StringComparer.OrdinalIgnoreCase))
            .ThenBy(f => ScoreDescription(name, f.Description))
            .ThenBy(f => f.FdcId)
            .ToList();
    }

    private static bool IsPlausibleCandidate(MenuItem item, FdcNutrientIndex nutrients)
    {
        var caloriesPer100 = FindNutrientValue(nutrients, ["1008", "208"], ["energy", "energy (atwater general factors)"]) ?? 0m;
        var normalizedName = Normalize(item.Name);

        if (normalizedName == "water" || normalizedName == "sparkling water")
        {
            return caloriesPer100 <= 2m;
        }

        if (normalizedName.Contains("tea", StringComparison.Ordinal))
        {
            return caloriesPer100 <= 5m;
        }

        if (item.Category != MenuCategory.Beverage && caloriesPer100 <= 0m)
        {
            return false;
        }

        if (item.Category == MenuCategory.Fruit && caloriesPer100 < 15m)
        {
            return false;
        }

        if (item.Category == MenuCategory.Side &&
            (normalizedName.Contains("rice", StringComparison.Ordinal) ||
             normalizedName.Contains("noodles", StringComparison.Ordinal) ||
             normalizedName.Contains("potato", StringComparison.Ordinal)) &&
            caloriesPer100 < 40m)
        {
            return false;
        }

        if (item.Category == MenuCategory.Entree &&
            (normalizedName.Contains("salmon", StringComparison.Ordinal) ||
             normalizedName.Contains("lamb", StringComparison.Ordinal) ||
             normalizedName.Contains("pork", StringComparison.Ordinal) ||
             normalizedName.Contains("beef", StringComparison.Ordinal) ||
             normalizedName.Contains("chicken", StringComparison.Ordinal) ||
             normalizedName.Contains("prawn", StringComparison.Ordinal)) &&
            caloriesPer100 < 50m)
        {
            return false;
        }

        return true;
    }

    private static int ScoreDescription(string normalizedMenuName, string? description)
    {
        var d = Normalize(description ?? string.Empty);
        if (d == normalizedMenuName) return 0;
        if (d.Contains(normalizedMenuName, StringComparison.Ordinal)) return 1;

        var score = 10;
        foreach (var token in normalizedMenuName.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (d.Contains(token, StringComparison.Ordinal)) score--;
        }

        return score;
    }

    private static string Normalize(string value)
    {
        return new string(value
            .Trim()
            .ToLowerInvariant()
            .Select(ch => char.IsLetterOrDigit(ch) ? ch : ' ')
            .ToArray())
            .Replace("  ", " ")
            .Replace("  ", " ");
    }

    private static async Task<FdcSearchResponseDto?> SearchAsync(HttpClient http, string query, CancellationToken ct)
    {
        var request = new FdcSearchRequestDto(
            Query: query,
            DataType: PreferredDataTypes,
            PageSize: 10,
            PageNumber: 1,
            RequireAllWords: false,
            SortBy: "dataType.keyword",
            SortOrder: "asc");

        using var response = await http.PostAsJsonAsync("foods/search", request, ct);
        if (!response.IsSuccessStatusCode)
        {
            // fallback: broader search without datatype filtering
            var fallbackRequest = new FdcSearchRequestDto(
                Query: query,
                DataType: null,
                PageSize: 10,
                PageNumber: 1,
                RequireAllWords: false,
                SortBy: null,
                SortOrder: null);

            using var fallback = await http.PostAsJsonAsync("foods/search", fallbackRequest, ct);
            if (!fallback.IsSuccessStatusCode) return null;
            return await fallback.Content.ReadFromJsonAsync<FdcSearchResponseDto>(cancellationToken: ct);
        }

        return await response.Content.ReadFromJsonAsync<FdcSearchResponseDto>(cancellationToken: ct);
    }

    private static async Task<FdcFoodDetailDto?> GetFoodDetailsAsync(HttpClient http, long fdcId, CancellationToken ct)
    {
        using var response = await http.GetAsync($"food/{fdcId}", ct);
        if (!response.IsSuccessStatusCode) return null;
        return await response.Content.ReadFromJsonAsync<FdcFoodDetailDto>(cancellationToken: ct);
    }

    private sealed record FdcSearchRequestDto(
        [property: JsonPropertyName("query")] string Query,
        [property: JsonPropertyName("dataType")] IEnumerable<string>? DataType,
        [property: JsonPropertyName("pageSize")] int PageSize,
        [property: JsonPropertyName("pageNumber")] int PageNumber,
        [property: JsonPropertyName("requireAllWords")] bool RequireAllWords,
        [property: JsonPropertyName("sortBy")] string? SortBy,
        [property: JsonPropertyName("sortOrder")] string? SortOrder);

    private sealed record FdcSearchResponseDto(
        [property: JsonPropertyName("foods")] List<FdcFoodSearchItemDto>? Foods);

    private sealed record FdcFoodSearchItemDto(
        [property: JsonPropertyName("fdcId")] long FdcId,
        [property: JsonPropertyName("description")] string? Description,
        [property: JsonPropertyName("dataType")] string? DataType);

    private sealed record FdcFoodDetailDto(
        [property: JsonPropertyName("fdcId")] long FdcId,
        [property: JsonPropertyName("description")] string? Description,
        [property: JsonPropertyName("dataType")] string? DataType,
        [property: JsonPropertyName("servingSize")] decimal? ServingSize,
        [property: JsonPropertyName("servingSizeUnit")] string? ServingSizeUnit,
        [property: JsonPropertyName("foodNutrients")] List<FdcFoodNutrientDto>? FoodNutrients);

    private sealed record FdcFoodNutrientDto(
        [property: JsonPropertyName("amount")] decimal? Amount,
        [property: JsonPropertyName("value")] decimal? Value,
        [property: JsonPropertyName("nutrientNumber")] string? NutrientNumber,
        [property: JsonPropertyName("nutrient")] FdcNutrientDto? Nutrient);

    private sealed record FdcNutrientDto(
        [property: JsonPropertyName("number")] string? Number,
        [property: JsonPropertyName("name")] string? Name,
        [property: JsonPropertyName("unitName")] string? UnitName);
}




