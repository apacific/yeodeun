using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yeodeun.Api.Contracts;
using Yeodeun.Domain.Menu;
using Yeodeun.Infrastructure.Persistence;

namespace Yeodeun.Api.Controllers;

[ApiController]
[Route("api/quote")]
/// <summary>
/// Prices a dish selection using combo and sauce-credit rules.
/// </summary>
public sealed class QuoteController : ControllerBase
{
    private const int ComboPriceCents = 2100;

    private readonly YeodeunDbContext _db;

    /// <summary>
    /// Initializes a new instance of the <see cref="QuoteController"/> class.
    /// </summary>
    /// <param name="db">Database context used to load selected menu items.</param>
    public QuoteController(YeodeunDbContext db) => _db = db;

    /// <summary>
    /// Calculates list and discounted pricing for the requested selection.
    /// </summary>
    /// <param name="req">Selection request payload.</param>
    /// <param name="ct">Cancellation token for async operations.</param>
    /// <returns>Quoted pricing details or validation errors.</returns>
    [HttpPost]
    public async Task<ActionResult<QuoteResponseDto>> Quote([FromBody] SelectionRequestDto req, CancellationToken ct)


    {
        if (req.Selection is null) return BadRequest("Selection is required.");

        var sel = req.Selection;

        // Do NOT mutate init-only DTO properties. Use locals.
        var sauceIds = sel.SauceIds ?? new List<Guid>();
        var toppingIds = sel.ToppingIds ?? new List<Guid>();

        if (sauceIds.Count > 2)
            return BadRequest("A dish may include at most 2 sauces.");

        var ids = GatherIds(sel, sauceIds, toppingIds);
        if (ids.Count == 0) return BadRequest("Select at least one item.");

        var items = await _db.MenuItems
            .AsNoTracking()
            .Where(x => ids.Contains(x.Id))
            .ToListAsync(ct);

        if (items.Count != ids.Count)
        {
            var found = items.Select(x => x.Id).ToHashSet();
            var missing = ids.Where(id => !found.Contains(id)).ToList();
            return NotFound(new { message = "One or more menu items were not found.", missingIds = missing });
        }

        var errors = ValidateCategories(sel, sauceIds, toppingIds, items);
        if (errors.Count > 0) return BadRequest(new { message = "Invalid selection.", errors });

        var notes = new List<string>();

        var lines = items
            .OrderBy(x => x.Category).ThenBy(x => x.Name)
            .Select(x => new QuoteLineDto(x.Id, x.Name, x.Category.ToString(), x.PriceCents))
            .ToList();

        var listPrice = items.Sum(x => x.PriceCents);

        var sauceCount = sauceIds.Count;

        // 1 free sauce per entree and per vegetable (0-2 credits for a dish)
        var sauceCredits =
            (sel.EntreeId is not null ? 1 : 0) +
            (sel.VegetableId is not null ? 1 : 0);

        var comboEligible =
            sel.EntreeId is not null &&
            sel.VegetableId is not null &&
            sel.FruitId is not null &&
            sel.SideId is not null &&
            sauceCount == 2;

        // Only applies for non-combo pricing
        var saucesCharged = Math.Max(0, sauceCount - sauceCredits);
        var sauceDiscountCents = Math.Min(sauceCount, sauceCredits) * 100;

        int totalCents;
        int comboDiscountCents = 0;

        if (comboEligible)
        {
            // Combo includes entree + vegetable + fruit + side + 2 sauces for $21.
            // Add-ons: toppings + beverage are charged à-la-carte.
            var addonIds = toppingIds.ToHashSet();

            if (sel.BeverageId is not null)
                addonIds.Add(sel.BeverageId.Value);

            var addonTotal = items
                .Where(x => addonIds.Contains(x.Id))
                .Sum(x => x.PriceCents);

            totalCents = ComboPriceCents + addonTotal;

            // Compare against à-la-carte after sauce credits for "savings" messaging.
            var aLaCarteAfterCredits = listPrice - sauceDiscountCents;
            comboDiscountCents = Math.Max(0, aLaCarteAfterCredits - totalCents);

            notes.Add("Combo applied: entree + vegetable + fruit + side + 2 sauces for $21.");
            if (comboDiscountCents > 0)
                notes.Add($"Combo saved {comboDiscountCents}¢ vs à-la-carte (after sauce credits).");
        }
        else
        {
            totalCents = listPrice - sauceDiscountCents;

            if (sauceDiscountCents > 0)
                notes.Add($"Sauce credits applied: -{sauceDiscountCents}¢ ({Math.Min(sauceCount, sauceCredits)} free sauce(s)).");

            // Helpful hint when user has the 4 core items but not 2 sauces.
            if (sel.EntreeId is not null &&
                sel.VegetableId is not null &&
                sel.FruitId is not null &&
                sel.SideId is not null &&
                sauceCount < 2)
            {
                notes.Add("Add 2 sauces to qualify for the $21 combo.");
            }
        }

        var res = new QuoteResponseDto(
            Lines: lines,
            ListPriceCents: listPrice,
            SauceCredits: sauceCredits,
            SaucesSelected: sauceCount,
            SaucesCharged: comboEligible ? 0 : saucesCharged,
            SauceDiscountCents: comboEligible ? 0 : sauceDiscountCents,
            ComboApplied: comboEligible,
            ComboBasePriceCents: comboEligible ? ComboPriceCents : 0,
            ComboDiscountCents: comboDiscountCents,
            TotalCents: totalCents,
            Notes: notes
        );

        return Ok(res);
    }

    private static HashSet<Guid> GatherIds(DishSelectionDto sel, List<Guid> sauceIds, List<Guid> toppingIds)
    {
        var ids = new HashSet<Guid>();

        void Add(Guid? id)
        {
            if (id is not null) ids.Add(id.Value);
        }

        Add(sel.EntreeId);
        Add(sel.VegetableId);
        Add(sel.FruitId);
        Add(sel.SideId);
        Add(sel.BeverageId);

        foreach (var s in sauceIds) ids.Add(s);
        foreach (var t in toppingIds) ids.Add(t);

        return ids;
    }

    private static List<string> ValidateCategories(
        DishSelectionDto sel,
        List<Guid> sauceIds,
        List<Guid> toppingIds,
        List<MenuItem> items)
    {
        var byId = items.ToDictionary(x => x.Id, x => x.Category);
        var errors = new List<string>();

        void Expect(Guid? id, MenuCategory expected, string label)
        {
            if (id is null) return;
            if (!byId.TryGetValue(id.Value, out var cat) || cat != expected)
                errors.Add($"{label} must be a {expected}.");
        }

        Expect(sel.EntreeId, MenuCategory.Entree, "EntreeId");
        Expect(sel.VegetableId, MenuCategory.Vegetable, "VegetableId");
        Expect(sel.FruitId, MenuCategory.Fruit, "FruitId");
        Expect(sel.SideId, MenuCategory.Side, "SideId");
        Expect(sel.BeverageId, MenuCategory.Beverage, "BeverageId");

        foreach (var id in sauceIds)
            if (byId.TryGetValue(id, out var cat) && cat != MenuCategory.Sauce)
                errors.Add("All SauceIds must be Sauce items.");

        foreach (var id in toppingIds)
            if (byId.TryGetValue(id, out var cat) && cat != MenuCategory.Topping)
                errors.Add("All ToppingIds must be Topping items.");

        return errors;
    }
}

