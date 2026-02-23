using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yeodeun.Api.Contracts;
using Yeodeun.Domain.Menu;
using Yeodeun.Infrastructure.Persistence;

namespace Yeodeun.Api.Controllers;

[ApiController]
[Route("api/menu")]
/// <summary>
/// Provides read-only menu and nutrition endpoints.
/// </summary>
public sealed class MenuController : ControllerBase
{
    private readonly YeodeunDbContext _db;

    /// <summary>
    /// Initializes a new instance of the <see cref="MenuController"/> class.
    /// </summary>
    /// <param name="db">The application database context.</param>
    public MenuController(YeodeunDbContext db) => _db = db;

    // GET /api/menu/categories
    [HttpGet("categories")]
    /// <summary>
    /// Returns the list of available menu categories.
    /// </summary>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>The category list.</returns>
    public async Task<ActionResult<IReadOnlyList<string>>> GetCategories(CancellationToken ct)
    {
        var cats = await _db.MenuItems
            .AsNoTracking()
            .Where(x => x.IsActive)
            .Select(x => x.Category)
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync(ct);

        return Ok(cats.Select(c => c.ToString()).ToList());
    }

    // GET /api/menu/counts?includeInactive=false
    [HttpGet("counts")]
    /// <summary>
    /// Returns per-category menu item counts.
    /// </summary>
    /// <param name="includeInactive">Whether inactive items should be included.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>The category counts.</returns>
    public async Task<ActionResult<IReadOnlyList<MenuCategoryCountDto>>> GetCounts(
        [FromQuery] bool includeInactive = false,
        CancellationToken ct = default)
    {
        var query = _db.MenuItems.AsNoTracking();

        if (!includeInactive)
            query = query.Where(x => x.IsActive);

        var counts = await query
            .GroupBy(x => x.Category)
            .Select(g => new MenuCategoryCountDto(g.Key.ToString(), g.Count()))
            .OrderBy(x => x.Category)
            .ToListAsync(ct);

        return Ok(counts);
    }

    // GET /api/menu/items?category=Entree&q=salmon&includeInactive=false&includeNutrition=false
    [HttpGet("items")]
    /// <summary>
    /// Returns menu items with optional filters and nutrition details.
    /// </summary>
    /// <param name="category">Optional category filter.</param>
    /// <param name="q">Optional name search filter.</param>
    /// <param name="includeInactive">Whether inactive items should be included.</param>
    /// <param name="includeNutrition">Whether nutrition data should be included.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>The filtered item list.</returns>
    public async Task<ActionResult<IReadOnlyList<MenuItemDto>>> GetItems(
        [FromQuery] string? category,
        [FromQuery] string? q,
        [FromQuery] bool includeInactive = false,
        [FromQuery] bool includeNutrition = false,
        CancellationToken ct = default)
    {
        IQueryable<MenuItem> query = _db.MenuItems.AsNoTracking();

        if (!includeInactive)
            query = query.Where(x => x.IsActive);

        if (!string.IsNullOrWhiteSpace(category))
        {
            if (!Enum.TryParse<MenuCategory>(category.Trim(), ignoreCase: true, out var cat))
                return BadRequest($"Invalid category '{category}'.");
            query = query.Where(x => x.Category == cat);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var needle = $"%{q.Trim()}%";
            query = query.Where(x => EF.Functions.ILike(x.Name, needle));
        }

        if (includeNutrition)
        {
            var withNutrition = await query
                .OrderBy(x => x.Category)
                .ThenBy(x => x.Name)
                .Select(x => new MenuItemDto(
                    x.Id,
                    x.Name,
                    x.Description,
                    x.Category.ToString(),
                    x.PriceCents,
                    x.IsActive,
                    x.NutritionProfile == null
                        ? null
                        : new NutritionProfileDto(
                            x.NutritionProfile.ServingGrams,
                            x.NutritionProfile.Calories,
                            x.NutritionProfile.TotalFatG,
                            x.NutritionProfile.SaturatedFatG,
                            x.NutritionProfile.TransFatG,
                            x.NutritionProfile.CholesterolMg,
                            x.NutritionProfile.SodiumMg,
                            x.NutritionProfile.TotalCarbG,
                            x.NutritionProfile.DietaryFiberG,
                            x.NutritionProfile.TotalSugarsG,
                            x.NutritionProfile.AddedSugarsG,
                            x.NutritionProfile.ProteinG,
                            x.NutritionProfile.SourceName,
                            x.NutritionProfile.SourceUrl,
                            x.NutritionProfile.ExternalRef,
                            x.NutritionProfile.LastUpdatedUtc
                        )
                ))
                .ToListAsync(ct);

            return Ok(withNutrition);
        }

        var basic = await query
            .OrderBy(x => x.Category)
            .ThenBy(x => x.Name)
            .Select(x => new MenuItemDto(
                x.Id,
                x.Name,
                x.Description,
                x.Category.ToString(),
                x.PriceCents,
                x.IsActive
            ))
            .ToListAsync(ct);

        return Ok(basic);
    }

    // GET /api/menu/grouped?includeInactive=false
    [HttpGet("grouped")]
    /// <summary>
    /// Returns menu items grouped by category.
    /// </summary>
    /// <param name="includeInactive">Whether inactive items should be included.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>The grouped menu payload.</returns>
    public async Task<ActionResult<GroupedMenuDto>> GetGrouped(
        [FromQuery] bool includeInactive = false,
        CancellationToken ct = default)
    {
        var query = _db.MenuItems.AsNoTracking();

        if (!includeInactive)
            query = query.Where(x => x.IsActive);

        var items = await query
            .OrderBy(x => x.Category)
            .ThenBy(x => x.Name)
            .Select(x => new MenuItemDto(
                x.Id,
                x.Name,
                x.Description,
                x.Category.ToString(),
                x.PriceCents,
                x.IsActive
            ))
            .ToListAsync(ct);

        var groups = items
            .GroupBy(x => x.Category)
            .OrderBy(g => g.Key)
            .Select(g => new MenuCategoryGroupDto(g.Key, g.ToList()))
            .ToList();

        return Ok(new GroupedMenuDto(groups));
    }

    // GET /api/menu/items/{id}?includeNutrition=false
    [HttpGet("items/{id:guid}")]
    /// <summary>
    /// Returns a single menu item by id.
    /// </summary>
    /// <param name="id">The menu item identifier.</param>
    /// <param name="includeNutrition">Whether nutrition data should be included.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>The requested menu item when found.</returns>
    public async Task<ActionResult<MenuItemDto>> GetById(
        Guid id,
        [FromQuery] bool includeNutrition = false,
        CancellationToken ct = default)
    {
        if (includeNutrition)
        {
            var item = await _db.MenuItems
                .AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x => new MenuItemDto(
                    x.Id,
                    x.Name,
                    x.Description,
                    x.Category.ToString(),
                    x.PriceCents,
                    x.IsActive,
                    x.NutritionProfile == null
                        ? null
                        : new NutritionProfileDto(
                            x.NutritionProfile.ServingGrams,
                            x.NutritionProfile.Calories,
                            x.NutritionProfile.TotalFatG,
                            x.NutritionProfile.SaturatedFatG,
                            x.NutritionProfile.TransFatG,
                            x.NutritionProfile.CholesterolMg,
                            x.NutritionProfile.SodiumMg,
                            x.NutritionProfile.TotalCarbG,
                            x.NutritionProfile.DietaryFiberG,
                            x.NutritionProfile.TotalSugarsG,
                            x.NutritionProfile.AddedSugarsG,
                            x.NutritionProfile.ProteinG,
                            x.NutritionProfile.SourceName,
                            x.NutritionProfile.SourceUrl,
                            x.NutritionProfile.ExternalRef,
                            x.NutritionProfile.LastUpdatedUtc
                        )
                ))
                .SingleOrDefaultAsync(ct);

            return item is null ? NotFound() : Ok(item);
        }

        var basic = await _db.MenuItems
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new MenuItemDto(
                x.Id,
                x.Name,
                x.Description,
                x.Category.ToString(),
                x.PriceCents,
                x.IsActive
            ))
            .SingleOrDefaultAsync(ct);

        return basic is null ? NotFound() : Ok(basic);
    }
}

