using System.Data.Common;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Yeodeun.Domain.Menu;
using Yeodeun.Infrastructure.Persistence;

namespace Yeodeun.Api.EndToEndTests;

public sealed class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll(typeof(DbContextOptions<YeodeunDbContext>));
            services.RemoveAll(typeof(IDbContextOptionsConfiguration<YeodeunDbContext>));
            services.RemoveAll(typeof(DbConnection));

            services.AddSingleton<DbConnection>(_ =>
            {
                var connection = new SqliteConnection("Data Source=:memory:");
                connection.Open();
                return connection;
            });

            services.AddDbContext<YeodeunDbContext>((sp, opt) =>
                opt.UseSqlite(sp.GetRequiredService<DbConnection>())
                    .ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning)));

            using var scope = services.BuildServiceProvider().CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<YeodeunDbContext>();
            db.Database.EnsureCreated();

            if (!db.MenuItems.Any())
            {
                db.MenuItems.AddRange(
                    new MenuItem("grilled chicken", MenuCategory.Entree, 1000),
                    new MenuItem("baby bok choy", MenuCategory.Vegetable, 800),
                    new MenuItem("mandarin oranges", MenuCategory.Fruit, 500),
                    new MenuItem("steamed rice", MenuCategory.Side, 300),
                    new MenuItem("soy ginger sauce", MenuCategory.Sauce, 100),
                    new MenuItem("yellow curry sauce", MenuCategory.Sauce, 100),
                    new MenuItem("chopped peanuts", MenuCategory.Topping, 100),
                    new MenuItem("water", MenuCategory.Beverage, 100));

                db.SaveChanges();
            }
        });
    }
}
