using Yeodeun.Domain.Menu;

namespace Yeodeun.Application.Pricing;

/// <summary>
/// Immutable input model used by pricing calculations.
/// </summary>
public sealed record QuoteRequest(
    IReadOnlyList<Guid> EntreeIds,
    IReadOnlyList<Guid> VegetableIds,
    IReadOnlyList<Guid> FruitIds,
    IReadOnlyList<Guid> SideIds,
    IReadOnlyList<Guid> SauceIds,
    IReadOnlyList<Guid> ToppingIds,
    IReadOnlyList<Guid> BeverageIds
);

/// <summary>
/// Immutable output model produced by pricing calculations.
/// </summary>
public sealed record QuoteResponse(
    int ListPriceCents,
    int FinalPriceCents,
    bool IsCombo,
    int ComboPriceCents,
    int SavingsCents,
    int SauceCredits,
    int SaucesSelected,
    int SaucesCharged
);

/// <summary>
/// Central constants for combo pricing and limits.
/// </summary>
public static class PricingRules
{
    public const int ComboPriceCents = 2100;
    public const int MaxComboSauces = 2;
}

/// <summary>
/// Applies business rules to compute final order pricing.
/// </summary>
public sealed class PricingService
{
        /// <summary>
    /// Computes list price, discounts, and final payable total.
    /// </summary>
    /// <param name="req">Chosen item ids grouped by menu category.</param>
    /// <param name="itemsById">Menu item catalog indexed by item id.</param>
    /// <returns>Pricing totals and discount metadata.</returns>
    public QuoteResponse Quote(QuoteRequest req, IReadOnlyDictionary<Guid, MenuItem> itemsById)
    {
        // Flatten all chosen items into categories for price calc
        var allIds = req.EntreeIds
            .Concat(req.VegetableIds)
            .Concat(req.FruitIds)
            .Concat(req.SideIds)
            .Concat(req.SauceIds)
            .Concat(req.ToppingIds)
            .Concat(req.BeverageIds)
            .ToList();

        var listPrice = allIds.Sum(id => itemsById[id].PriceCents);

        var isCombo =
            req.EntreeIds.Count == 1 &&
            req.VegetableIds.Count == 1 &&
            req.FruitIds.Count == 1 &&
            req.SideIds.Count == 1 &&
            req.SauceIds.Count <= PricingRules.MaxComboSauces;

        // Sauce credits: 1 free sauce per entree + 1 per vegetable (a-la-carte rule)
        // For combos, sauces are included in the $21 combo price up to 2 sauces; we *don’t* spend credits there.
        var sauceCredits = req.EntreeIds.Count + req.VegetableIds.Count;
        var saucesSelected = req.SauceIds.Count;

        int saucesCharged;
        int finalPrice;

        if (isCombo)
        {
            // Combo price includes up to 2 sauces; toppings + beverages are extra
            var extras = req.ToppingIds.Sum(id => itemsById[id].PriceCents)
                        + req.BeverageIds.Sum(id => itemsById[id].PriceCents);

            finalPrice = PricingRules.ComboPriceCents + extras;
            saucesCharged = 0; // included (up to 2)
        }
        else
        {
            // A-la-carte: sauces cost $1 but credits apply
            saucesCharged = Math.Max(0, saucesSelected - sauceCredits);

            // Start with all non-sauce items + charged sauces only
            var nonSauceIds = req.EntreeIds
                .Concat(req.VegetableIds)
                .Concat(req.FruitIds)
                .Concat(req.SideIds)
                .Concat(req.ToppingIds)
                .Concat(req.BeverageIds)
                .ToList();

            finalPrice = nonSauceIds.Sum(id => itemsById[id].PriceCents) + (saucesCharged * 100);
        }

        var savings = Math.Max(0, listPrice - finalPrice);

        return new QuoteResponse(
            ListPriceCents: listPrice,
            FinalPriceCents: finalPrice,
            IsCombo: isCombo,
            ComboPriceCents: isCombo ? PricingRules.ComboPriceCents : 0,
            SavingsCents: savings,
            SauceCredits: sauceCredits,
            SaucesSelected: saucesSelected,
            SaucesCharged: saucesCharged
        );
    }
}

