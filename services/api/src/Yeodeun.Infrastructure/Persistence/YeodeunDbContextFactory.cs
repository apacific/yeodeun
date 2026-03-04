using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Yeodeun.Infrastructure.Persistence;

/// <summary>
/// Creates design-time <see cref="YeodeunDbContext"/> instances for EF tooling.
/// </summary>
public sealed class YeodeunDbContextFactory : IDesignTimeDbContextFactory<YeodeunDbContext>
{
    /// <summary>
    /// Builds a design-time database context, including local-host fallback for Docker hostnames.
    /// </summary>
    /// <param name="args">Command-line arguments passed by EF tooling.</param>
    /// <returns>A configured <see cref="YeodeunDbContext"/> instance.</returns>
    public YeodeunDbContext CreateDbContext(string[] args)
    {
        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";

        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile(@"src\Yeodeun.Api\appsettings.json", optional: true)
            .AddJsonFile($@"src\Yeodeun.Api\appsettings.{env}.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var conn =
            config.GetConnectionString("Default")
            ?? config["ConnectionStrings:Default"]
            ?? "Host=localhost;Port=5433;Database=yeodeun_db;Username=yeodeun;Password=yeodeun_dev_pw";

        // If EF is running on the host, "db:5432" won't resolve.
        var runningInContainer =
            string.Equals(Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER"), "true", StringComparison.OrdinalIgnoreCase);

        if (!runningInContainer && conn.Contains("Host=db", StringComparison.OrdinalIgnoreCase))
        {
            conn = conn
                .Replace("Host=db", "Host=localhost", StringComparison.OrdinalIgnoreCase)
                .Replace("Port=5432", "Port=5433", StringComparison.OrdinalIgnoreCase);
        }

        var options = new DbContextOptionsBuilder<YeodeunDbContext>()
            .UseNpgsql(conn)
            .Options;

        return new YeodeunDbContext(options);
    }
}


