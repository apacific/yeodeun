using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yeodeun.Api.Contracts;
using Yeodeun.Infrastructure.Persistence;

namespace Yeodeun.Api.Controllers;

[ApiController]
[Route("api/nutrition-quote")]
/// <summary>
/// Calculates nutrition totals for a composed selection of menu items.
/// </summary>
public sealed class NutritionQuoteController : ControllerBase
{
    private readonly YeodeunDbContext _db;

        /// <summary>
    /// Initializes a new instance of the <see cref="NutritionQuoteController"/> class.
    /// </summary>
    /// <param name="db">Database context used to load item nutrition profiles.</param>
    public NutritionQuoteController(YeodeunDbContext db) => _db = db;

        /// <summary>
    /// Computes nutrition totals for the provided dish selection.
    /// </summary>
    /// <param name="req">Selection request containing chosen item ids.</param>
    /// <param name="ct">Cancellation token for async operations.</param>
    /// <returns>Nutrition totals, per-item nutrition lines, and missing-data notes.</returns>
    [HttpPost]
    public async Task<ActionResult<NutritionQuoteResponseDto>> Quote(
        [FromBody] NutritionQuoteRequestDto req,
        CancellationToken ct)
    {
        if (req?.Selection is null)
            return BadRequest("Selection is required.");

        var sel = req.Selection;

        if (sel.SauceIds.Count > 2)
            return BadRequest("A dish may include at most 2 sauces.");

        var ids = GatherIds(sel);
        if (ids.Count == 0)
            return BadRequest("Select at least one item.");

        var items = await _db.MenuItems
            .AsNoTracking()
            .Include(x => x.NutritionProfile)
            .Where(x => ids.Contains(x.Id))
            .ToListAsync(ct);

        if (items.Count != ids.Count)
        {
            var found = items.Select(x => x.Id).ToHashSet();
            var missing = ids.Where(id => !found.Contains(id)).ToList();
            return NotFound(new { message = "One or more menu items were not found.", missingIds = missing });
        }

        // deterministic ordering in response
        items = items
            .OrderBy(x => x.Category)
            .ThenBy(x => x.Name)
            .ToList();

        var notes = new List<string>
        {
            "Totals assume one serving of each selected item (per each item's NutritionProfile.ServingGrams)."
        };

        var missingNutritionIds = new List<Guid>();

        decimal calories = 0m;
        decimal totalFat = 0m;
        decimal satFat = 0m;
        decimal transFat = 0m;
        int cholesterolMg = 0;
        int sodiumMg = 0;
        decimal totalCarb = 0m;
        decimal fiber = 0m;
        decimal sugars = 0m;
        decimal addedSugars = 0m;
        decimal protein = 0m;

        var lines = new List<NutritionQuoteLineDto>(items.Count);

        foreach (var item in items)
        {
            var n = item.NutritionProfile;

            NutritionProfileDto? dto = null;

            if (n is null)
            {
                missingNutritionIds.Add(item.Id);
            }
            else
            {
                // accumulate totals
                calories += n.Calories;
                totalFat += n.TotalFatG;
                satFat += n.SaturatedFatG;
                transFat += n.TransFatG;
                cholesterolMg += n.CholesterolMg;
                sodiumMg += n.SodiumMg;
                totalCarb += n.TotalCarbG;
                fiber += n.DietaryFiberG;
                sugars += n.TotalSugarsG;
                addedSugars += n.AddedSugarsG;
                protein += n.ProteinG;

                // per-item DTO (rounded for UI consistency)
                dto = new NutritionProfileDto(
                    ServingGrams: Round1(n.ServingGrams),
                    Calories: Round1(n.Calories),
                    TotalFatG: Round1(n.TotalFatG),
                    SaturatedFatG: Round1(n.SaturatedFatG),
                    TransFatG: Round1(n.TransFatG),
                    CholesterolMg: n.CholesterolMg,
                    SodiumMg: n.SodiumMg,
                    TotalCarbG: Round1(n.TotalCarbG),
                    DietaryFiberG: Round1(n.DietaryFiberG),
                    TotalSugarsG: Round1(n.TotalSugarsG),
                    AddedSugarsG: Round1(n.AddedSugarsG),
                    ProteinG: Round1(n.ProteinG),
                    SourceName: n.SourceName,
                    SourceUrl: n.SourceUrl,
                    ExternalRef: n.ExternalRef,
                    LastUpdatedUtc: n.LastUpdatedUtc
                );
            }

            // Selected items only: one line per selected item; Nutrition can be null if missing.
            lines.Add(new NutritionQuoteLineDto(
                Id: item.Id,
                Name: item.Name,
                Category: item.Category.ToString(),
                Nutrition: dto
            ));
        }

        if (missingNutritionIds.Count > 0)
            notes.Add($"Missing nutrition profiles for {missingNutritionIds.Count} selected item(s). Totals exclude those items.");

        var totals = new NutritionTotalsDto(
            Calories: (int)Math.Round(calories, MidpointRounding.AwayFromZero),
            TotalFatG: Round1(totalFat),
            SaturatedFatG: Round1(satFat),
            TransFatG: Round1(transFat),
            CholesterolMg: cholesterolMg,
            SodiumMg: sodiumMg,
            TotalCarbsG: Round1(totalCarb), // DTO plural name; domain uses TotalCarbG
            DietaryFiberG: Round1(fiber),
            TotalSugarsG: Round1(sugars),
            AddedSugarsG: Round1(addedSugars),
            ProteinG: Round1(protein)
        );

        return Ok(new NutritionQuoteResponseDto(
            Totals: totals,
            Lines: lines,
            MissingNutritionForItemIds: missingNutritionIds,
            Notes: notes
        ));
    }

    private static HashSet<Guid> GatherIds(DishSelectionDto sel)
    {
        var ids = new HashSet<Guid>();

        static void Add(HashSet<Guid> set, Guid? id)
        {
            if (id is not null) set.Add(id.Value);
        }

        Add(ids, sel.EntreeId);
        Add(ids, sel.VegetableId);
        Add(ids, sel.FruitId);
        Add(ids, sel.SideId);
        Add(ids, sel.BeverageId);

        foreach (var id in sel.SauceIds) ids.Add(id);
        foreach (var id in sel.ToppingIds) ids.Add(id);

        return ids;
    }

    private static decimal Round1(decimal value) =>
        Math.Round(value, 1, MidpointRounding.AwayFromZero);
}
