using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yeodeun.Domain.Menu;
using Yeodeun.Infrastructure.Persistence;

namespace Yeodeun.Api.Controllers;

[ApiController]
[Route("api/admin/nutrition")]
/// <summary>
/// Provides development/admin operations for nutrition data maintenance.
/// </summary>
public sealed class NutritionAdminController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly YeodeunDbContext _db;
    private readonly ILogger<NutritionAdminController> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="NutritionAdminController"/> class.
    /// </summary>
    /// <param name="db">Database context used to update nutrition profiles.</param>
    /// <param name="configuration">Application configuration for USDA seeding settings.</param>
    /// <param name="logger">Logger used for endpoint diagnostics.</param>
    public NutritionAdminController(
        YeodeunDbContext db,
        IConfiguration configuration,
        ILogger<NutritionAdminController> logger)
    {
        _db = db;
        _configuration = configuration;
        _logger = logger;
    }

    private bool TryAuthorizeAdminRequest(out ActionResult? failure)
    {
        failure = null;

        var configuredKey = _configuration["AdminEndpoints:NutritionRefresh:ApiKey"];
        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            configuredKey = _configuration["NUTRITION_ADMIN_API_KEY"];
        }

        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            _logger.LogWarning("Nutrition admin endpoint called without admin key configured.");
            failure = StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = "Nutrition admin endpoint is not configured. Set AdminEndpoints:NutritionRefresh:ApiKey or NUTRITION_ADMIN_API_KEY."
            });
            return false;
        }

        if (!Request.Headers.TryGetValue("X-Admin-Key", out var providedKey) ||
            providedKey.Count == 0 ||
            !string.Equals(providedKey[0], configuredKey, StringComparison.Ordinal))
        {
            failure = Unauthorized(new { message = "Invalid or missing X-Admin-Key." });
            return false;
        }

        return true;
    }

    private static readonly HashSet<MenuCategory> AuditedCategories =
    [
        MenuCategory.Entree,
        MenuCategory.Vegetable,
        MenuCategory.Fruit,
        MenuCategory.Side,
        MenuCategory.Beverage,
    ];

    /// <summary>
    /// Triggers an on-demand USDA FoodData Central nutrition refresh.
    /// </summary>
    /// <param name="request">Optional request options such as force refresh.</param>
    /// <param name="adminKey">Admin key sent in the <c>X-Admin-Key</c> header.</param>
    /// <param name="ct">Cancellation token for async operations.</param>
    /// <returns>The number of nutrition profiles updated.</returns>
    /// <remarks>Requires the <c>X-Admin-Key</c> request header.</remarks>
    [HttpPost("usda-refresh")]
    public async Task<ActionResult<UsdaNutritionRefreshResponseDto>> RefreshUsdaNutrition(
        [FromBody] UsdaNutritionRefreshRequestDto? request,
        [FromHeader(Name = "X-Admin-Key")] string? adminKey,
        CancellationToken ct)
    {
        if (!TryAuthorizeAdminRequest(out var failure))
        {
            return failure!;
        }

        var updated = await DbInitializer.RefreshUsdaNutritionAsync(
            _db,
            _configuration,
            _logger,
            request?.ForceRefresh,
            ct);

        return Ok(new UsdaNutritionRefreshResponseDto(
            UpdatedProfiles: updated,
            ForceRefresh: request?.ForceRefresh ?? false,
            EnabledInConfiguration: _configuration.GetValue<bool>("NutritionSeeding:UsdaFdc:Enabled")));
    }

    /// <summary>
    /// Returns a nutrition coverage audit for food and beverage menu items.
    /// </summary>
    /// <param name="adminKey">Admin key sent in the <c>X-Admin-Key</c> header.</param>
    /// <param name="ct">Cancellation token for async operations.</param>
    /// <returns>Coverage summary and item-level findings for missing or suspicious nutrition data.</returns>
    /// <remarks>Requires the <c>X-Admin-Key</c> request header.</remarks>
    [HttpGet("audit")]
    public async Task<ActionResult<NutritionAuditResponseDto>> GetAudit(
        [FromHeader(Name = "X-Admin-Key")] string? adminKey,
        CancellationToken ct)
    {
        if (!TryAuthorizeAdminRequest(out var failure))
        {
            return failure!;
        }

        var items = await _db.MenuItems
            .AsNoTracking()
            .Include(x => x.NutritionProfile)
            .Where(x => x.IsActive && AuditedCategories.Contains(x.Category))
            .OrderBy(x => x.Category)
            .ThenBy(x => x.Name)
            .ToListAsync(ct);

        var duplicateFdcIds = items
            .Where(x => x.NutritionProfile is not null &&
                        string.Equals(x.NutritionProfile.SourceName, "USDA FoodData Central", StringComparison.OrdinalIgnoreCase) &&
                        !string.IsNullOrWhiteSpace(x.NutritionProfile.ExternalRef))
            .GroupBy(x => x.NutritionProfile!.ExternalRef!, StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() > 1)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Name).OrderBy(n => n).ToList(), StringComparer.OrdinalIgnoreCase);

        var findings = new List<NutritionAuditItemDto>(items.Count);
        var missingCount = 0;
        var suspiciousCount = 0;
        var usdaCount = 0;
        var heuristicUsdaCount = 0;
        var baselineCount = 0;

        foreach (var item in items)
        {
            var profile = item.NutritionProfile;
            var issues = new List<string>();
            var sourceName = profile?.SourceName;
            var externalRef = profile?.ExternalRef;
            var matchMethod = "none";

            if (profile is null)
            {
                issues.Add("Missing nutrition profile.");
                missingCount++;
            }
            else
            {
                if (string.Equals(profile.SourceName, "USDA FoodData Central", StringComparison.OrdinalIgnoreCase))
                {
                    usdaCount++;
                    matchMethod = string.IsNullOrWhiteSpace(profile.ExternalRef) ? "search-heuristic" : "search-heuristic";
                    heuristicUsdaCount++;
                }
                else
                {
                    baselineCount++;
                    matchMethod = "baseline/manual";
                }

                if (profile.ServingGrams <= 0)
                    issues.Add("Serving size is zero or negative.");

                if (item.Category != MenuCategory.Beverage && !IsZeroCalorieFoodAllowed(item.Name) && profile.Calories <= 0)
                    issues.Add("Food item has zero calories.");

                if (profile.Calories > 1200)
                    issues.Add("Calories per serving are unusually high (>1200). Verify match/serving size.");

                if (profile.SodiumMg > 3000)
                    issues.Add("Sodium per serving is unusually high (>3000 mg). Verify match/serving size.");

                if (profile.TotalSugarsG > profile.TotalCarbG)
                    issues.Add("Total sugars exceed total carbohydrates.");

                if (profile.AddedSugarsG > profile.TotalSugarsG)
                    issues.Add("Added sugars exceed total sugars.");

                if (item.Category == MenuCategory.Beverage)
                {
                    var normalizedName = item.Name.Trim().ToLowerInvariant();
                    if (normalizedName.Contains("tea", StringComparison.Ordinal) && profile.Calories > 10)
                        issues.Add("Tea beverage has unusually high calories (>10) for unsweetened tea. Verify match.");

                    if ((normalizedName == "water" || normalizedName == "sparkling water") && profile.Calories > 2)
                        issues.Add("Water beverage has non-trivial calories. Verify match.");
                }

                if (item.Category == MenuCategory.Side)
                {
                    var normalizedName = item.Name.Trim().ToLowerInvariant();
                    if (normalizedName.Contains("steamed rice", StringComparison.Ordinal) && profile.Calories > 350)
                        issues.Add("Steamed rice calories look too high for the serving size. Possible dry-rice match.");

                    if (normalizedName.Contains("fried rice", StringComparison.Ordinal) && profile.Calories > 450)
                        issues.Add("Fried rice calories look too high for the serving size. Verify match.");

                    if (normalizedName.Contains("noodles", StringComparison.Ordinal) && profile.Calories > 0 && profile.Calories < 100)
                        issues.Add("Noodle dish calories look low for the serving size. Verify match.");
                }

                if (!string.IsNullOrWhiteSpace(profile.ExternalRef) && duplicateFdcIds.TryGetValue(profile.ExternalRef, out var duplicatedNames) && duplicatedNames.Count > 1)
                {
                    issues.Add($"USDA FDC id is shared by multiple items: {string.Join(", ", duplicatedNames)}.");
                }

                if (string.IsNullOrWhiteSpace(profile.SourceName) || string.Equals(profile.SourceName, "TBD", StringComparison.OrdinalIgnoreCase))
                    issues.Add("Nutrition source is TBD or missing.");
            }

            if (issues.Count > 0 && profile is not null)
                suspiciousCount++;

            findings.Add(new NutritionAuditItemDto(
                Id: item.Id,
                Name: item.Name,
                Category: item.Category.ToString(),
                HasNutrition: profile is not null,
                SourceName: sourceName,
                ExternalRef: externalRef,
                MatchMethod: matchMethod,
                ServingGrams: profile?.ServingGrams,
                Calories: profile?.Calories,
                Issues: issues));
        }

        return Ok(new NutritionAuditResponseDto(
            TotalItems: items.Count,
            MissingCount: missingCount,
            SuspiciousCount: suspiciousCount,
            UsdaCount: usdaCount,
            HeuristicUsdaCount: heuristicUsdaCount,
            BaselineOrManualCount: baselineCount,
            Items: findings));
    }

    private static bool IsZeroCalorieFoodAllowed(string name) =>
        string.Equals(name, "water", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(name, "sparkling water", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(name, "hot tea", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(name, "iced tea", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Request payload for USDA nutrition refresh operations.
    /// </summary>
    /// <param name="ForceRefresh">When true, re-fetches items already seeded from USDA.</param>
    public sealed record UsdaNutritionRefreshRequestDto(bool ForceRefresh = false);

    /// <summary>
    /// Response payload for USDA nutrition refresh operations.
    /// </summary>
    /// <param name="UpdatedProfiles">Number of nutrition profiles updated from USDA.</param>
    /// <param name="ForceRefresh">Whether the request forced a refresh of existing USDA rows.</param>
    /// <param name="EnabledInConfiguration">Whether USDA seeding is enabled in configuration.</param>
    public sealed record UsdaNutritionRefreshResponseDto(
        int UpdatedProfiles,
        bool ForceRefresh,
        bool EnabledInConfiguration);

    /// <summary>
    /// Response payload for nutrition audit results.
    /// </summary>
    /// <param name="TotalItems">Number of audited food and beverage items.</param>
    /// <param name="MissingCount">Number of items with no nutrition profile.</param>
    /// <param name="SuspiciousCount">Number of items with one or more data-quality issues.</param>
    /// <param name="UsdaCount">Number of items sourced from USDA FoodData Central.</param>
    /// <param name="HeuristicUsdaCount">Number of USDA-sourced items that should be reviewed/locked with overrides.</param>
    /// <param name="BaselineOrManualCount">Number of items using baseline/manual values.</param>
    /// <param name="Items">Item-level audit findings.</param>
    public sealed record NutritionAuditResponseDto(
        int TotalItems,
        int MissingCount,
        int SuspiciousCount,
        int UsdaCount,
        int HeuristicUsdaCount,
        int BaselineOrManualCount,
        IReadOnlyList<NutritionAuditItemDto> Items);

    /// <summary>
    /// Item-level nutrition audit result.
    /// </summary>
    /// <param name="Id">Menu item identifier.</param>
    /// <param name="Name">Menu item name.</param>
    /// <param name="Category">Menu category.</param>
    /// <param name="HasNutrition">Whether a nutrition profile exists.</param>
    /// <param name="SourceName">Nutrition source label.</param>
    /// <param name="ExternalRef">Source reference id (for USDA, FDC id).</param>
    /// <param name="MatchMethod">How the current value was matched/seeded.</param>
    /// <param name="ServingGrams">Serving grams if available.</param>
    /// <param name="Calories">Calories if available.</param>
    /// <param name="Issues">Detected data-quality issues.</param>
    public sealed record NutritionAuditItemDto(
        Guid Id,
        string Name,
        string Category,
        bool HasNutrition,
        string? SourceName,
        string? ExternalRef,
        string MatchMethod,
        decimal? ServingGrams,
        decimal? Calories,
        IReadOnlyList<string> Issues);
}
