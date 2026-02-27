using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Yeodeun.Api.Contracts;
using Yeodeun.Domain.Menu;
using Yeodeun.Infrastructure.Persistence;

namespace Yeodeun.Api.Controllers;

[ApiController]
[EnableRateLimiting("checkout-write")]
[Route("api/checkout")]
/// <summary>
/// Validates checkout requests and records payment intent metadata.
/// </summary>
public sealed class CheckoutController : ControllerBase
{
    private static readonly HashSet<string> ValidPaymentMethods =
    [
        "card",
        "cash",
        "delivery"
    ];

    private const int ComboPriceCents = 2100;

    private readonly YeodeunDbContext _db;
    private readonly ILogger<CheckoutController> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="CheckoutController"/> class.
    /// </summary>
    /// <param name="db">Database context used to validate pricing against persisted menu data.</param>
    /// <param name="logger">Logger used for checkout intake telemetry.</param>
    public CheckoutController(YeodeunDbContext db, ILogger<CheckoutController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Validates checkout payload fields and returns a confirmation token.
    /// </summary>
    /// <param name="request">Checkout payload including selection, totals, and payment fields.</param>
    /// <returns>Checkout confirmation or validation errors.</returns>
    [HttpPost]
    public async Task<ActionResult<CheckoutResponseDto>> Submit(CheckoutRequestDto request, CancellationToken ct)
    {
        if (!ValidPaymentMethods.Contains(request.PaymentMethod))
            return BadRequest("Invalid payment method.");

        var selections = (request.Selections is { Count: > 0 }
                ? request.Selections
                : new List<DishSelectionDto> { request.Selection })
            .Where(HasSelectionItems)
            .ToList();

        var hasALaCarte = request.ALaCarteItems.Any(x => x.Quantity > 0);

        if (selections.Count == 0 && !hasALaCarte)
            return BadRequest("Order is empty.");

        if (request.PaymentMethod == "card")
        {
            if (request.Card is null)
                return BadRequest("Card details are required.");

            if (string.IsNullOrWhiteSpace(request.Card.Name) ||
                string.IsNullOrWhiteSpace(request.Card.Number) ||
                string.IsNullOrWhiteSpace(request.Card.Expiry) ||
                string.IsNullOrWhiteSpace(request.Card.Cvv))
                return BadRequest("Card details are incomplete.");
        }

        var lookupIds = new HashSet<Guid>();
        foreach (var selection in selections)
        {
            AddSelectionIds(selection, lookupIds);
        }

        foreach (var line in request.ALaCarteItems)
        {
            if (line.Quantity <= 0)
                return BadRequest("A-la-carte item quantity must be greater than zero.");
            lookupIds.Add(line.MenuItemId);
        }

        var itemsById = await _db.MenuItems
            .AsNoTracking()
            .Where(x => lookupIds.Contains(x.Id) && x.IsActive)
            .ToDictionaryAsync(x => x.Id, ct);

        if (itemsById.Count != lookupIds.Count)
            return BadRequest("One or more selected menu items are invalid or inactive.");

        var computedComboTotal = 0;
        foreach (var selection in selections)
        {
            if (selection.SauceIds.Count > 2)
                return BadRequest("A dish may include at most 2 sauces.");

            var categoryErrors = ValidateSelectionCategories(selection, itemsById);
            if (categoryErrors.Count > 0)
                return BadRequest(new { message = "Invalid selection.", errors = categoryErrors });

            computedComboTotal += ComputeSelectionTotal(selection, itemsById);
        }

        var computedALaCarteTotal = request.ALaCarteItems.Sum(line =>
            itemsById[line.MenuItemId].PriceCents * line.Quantity);
        var computedOrderTotal = computedComboTotal + computedALaCarteTotal;

        if (request.Totals.ComboTotalCents != computedComboTotal ||
            request.Totals.ALaCarteTotalCents != computedALaCarteTotal ||
            request.Totals.OrderTotalCents != computedOrderTotal)
        {
            return BadRequest(new
            {
                message = "Submitted totals do not match server pricing.",
                expected = new
                {
                    comboTotalCents = computedComboTotal,
                    aLaCarteTotalCents = computedALaCarteTotal,
                    orderTotalCents = computedOrderTotal,
                }
            });
        }

        _logger.LogInformation("Checkout received. PaymentMethod={Method} Total={Total}",
            request.PaymentMethod,
            computedOrderTotal);

        return Ok(new CheckoutResponseDto(
            "Checkout received. We'll follow up to confirm payment.",
            Guid.NewGuid()));
    }

    private static bool HasSelectionItems(DishSelectionDto selection) =>
        selection.EntreeId != null
        || selection.VegetableId != null
        || selection.FruitId != null
        || selection.SideId != null
        || selection.SauceIds.Count > 0
        || selection.ToppingIds.Count > 0
        || selection.BeverageId != null;

    private static void AddSelectionIds(DishSelectionDto selection, HashSet<Guid> ids)
    {
        static void Add(HashSet<Guid> target, Guid? id)
        {
            if (id is not null)
                target.Add(id.Value);
        }

        Add(ids, selection.EntreeId);
        Add(ids, selection.VegetableId);
        Add(ids, selection.FruitId);
        Add(ids, selection.SideId);
        Add(ids, selection.BeverageId);

        foreach (var id in selection.SauceIds) ids.Add(id);
        foreach (var id in selection.ToppingIds) ids.Add(id);
    }

    private static List<string> ValidateSelectionCategories(
        DishSelectionDto selection,
        IReadOnlyDictionary<Guid, MenuItem> itemsById)
    {
        var errors = new List<string>();

        static void Expect(
            Guid? id,
            MenuCategory expected,
            string label,
            IReadOnlyDictionary<Guid, MenuItem> byId,
            List<string> output)
        {
            if (id is null) return;
            if (!byId.TryGetValue(id.Value, out var item) || item.Category != expected)
                output.Add($"{label} must be a {expected}.");
        }

        Expect(selection.EntreeId, MenuCategory.Entree, "EntreeId", itemsById, errors);
        Expect(selection.VegetableId, MenuCategory.Vegetable, "VegetableId", itemsById, errors);
        Expect(selection.FruitId, MenuCategory.Fruit, "FruitId", itemsById, errors);
        Expect(selection.SideId, MenuCategory.Side, "SideId", itemsById, errors);
        Expect(selection.BeverageId, MenuCategory.Beverage, "BeverageId", itemsById, errors);

        foreach (var id in selection.SauceIds)
            if (itemsById.TryGetValue(id, out var item) && item.Category != MenuCategory.Sauce)
                errors.Add("All SauceIds must be Sauce items.");

        foreach (var id in selection.ToppingIds)
            if (itemsById.TryGetValue(id, out var item) && item.Category != MenuCategory.Topping)
                errors.Add("All ToppingIds must be Topping items.");

        return errors;
    }

    private static int ComputeSelectionTotal(
        DishSelectionDto selection,
        IReadOnlyDictionary<Guid, MenuItem> itemsById)
    {
        var sauceCount = selection.SauceIds.Count;

        var comboEligible =
            selection.EntreeId is not null &&
            selection.VegetableId is not null &&
            selection.FruitId is not null &&
            selection.SideId is not null &&
            sauceCount == 2;

        if (comboEligible)
        {
            var addonIds = selection.ToppingIds.ToHashSet();
            if (selection.BeverageId is not null)
                addonIds.Add(selection.BeverageId.Value);

            var addonTotal = addonIds.Sum(id => itemsById[id].PriceCents);
            return ComboPriceCents + addonTotal;
        }

        var allIds = new List<Guid>();

        void Add(Guid? id)
        {
            if (id is not null) allIds.Add(id.Value);
        }

        Add(selection.EntreeId);
        Add(selection.VegetableId);
        Add(selection.FruitId);
        Add(selection.SideId);
        Add(selection.BeverageId);
        allIds.AddRange(selection.ToppingIds);

        var sauceCredits =
            (selection.EntreeId is not null ? 1 : 0) +
            (selection.VegetableId is not null ? 1 : 0);

        var saucesCharged = Math.Max(0, sauceCount - sauceCredits);
        var nonSauceTotal = allIds.Sum(id => itemsById[id].PriceCents);
        return nonSauceTotal + (saucesCharged * 100);
    }
}
