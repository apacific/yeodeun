using Microsoft.AspNetCore.Mvc;
using Yeodeun.Api.Contracts;

namespace Yeodeun.Api.Controllers;

[ApiController]
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

    private readonly ILogger<CheckoutController> _logger;

        /// <summary>
    /// Initializes a new instance of the <see cref="CheckoutController"/> class.
    /// </summary>
    /// <param name="logger">Logger used for checkout intake telemetry.</param>
    public CheckoutController(ILogger<CheckoutController> logger) => _logger = logger;

        /// <summary>
    /// Validates checkout payload fields and returns a confirmation token.
    /// </summary>
    /// <param name="request">Checkout payload including selection, totals, and payment fields.</param>
    /// <returns>Checkout confirmation or validation errors.</returns>
    [HttpPost]
    public ActionResult<CheckoutResponseDto> Submit(CheckoutRequestDto request)
    {
        if (!ValidPaymentMethods.Contains(request.PaymentMethod))
            return BadRequest("Invalid payment method.");

        var hasSelectionItems = request.Selection.EntreeId != null
            || request.Selection.VegetableId != null
            || request.Selection.FruitId != null
            || request.Selection.SideId != null
            || request.Selection.SauceIds.Count > 0
            || request.Selection.ToppingIds.Count > 0
            || request.Selection.BeverageId != null;

        var hasSelections = request.Selections?.Any(selection =>
            selection.EntreeId != null
            || selection.VegetableId != null
            || selection.FruitId != null
            || selection.SideId != null
            || selection.SauceIds.Count > 0
            || selection.ToppingIds.Count > 0
            || selection.BeverageId != null) == true;

        var hasALaCarte = request.ALaCarteItems.Any(x => x.Quantity > 0);

        if (!hasSelectionItems && !hasSelections && !hasALaCarte)
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

        _logger.LogInformation("Checkout received. PaymentMethod={Method} Total={Total}",
            request.PaymentMethod,
            request.Totals.OrderTotalCents);

        return Ok(new CheckoutResponseDto(
            "Checkout received. We'll follow up to confirm payment.",
            Guid.NewGuid()));
    }
}

