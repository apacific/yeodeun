using Microsoft.EntityFrameworkCore;
using Npgsql;
using Yeodeun.Application.Pricing;
using Yeodeun.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(o =>
{
    o.AddPolicy("dev", p => p.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
});

builder.Services.AddDbContext<YeodeunDbContext>(opt =>
    opt.UseNpgsql(
        builder.Configuration.GetConnectionString("Default"),
        npgsql => npgsql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(2), null)));

builder.Services.AddScoped<PricingService>();

var app = builder.Build();

app.UseCors("dev");

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

// Dev-only migrate/seed + retry for container startup ordering
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<YeodeunDbContext>();
    var seedLogger = scope.ServiceProvider
        .GetRequiredService<ILoggerFactory>()
        .CreateLogger("DbInitializer");

    const int maxAttempts = 10;
    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            await DbInitializer.MigrateAndSeedAsync(db, builder.Configuration, seedLogger);
            break;
        }
        catch (PostgresException) when (attempt < maxAttempts)
        {
            await Task.Delay(TimeSpan.FromSeconds(2));
        }
        catch (NpgsqlException) when (attempt < maxAttempts)
        {
            await Task.Delay(TimeSpan.FromSeconds(2));
        }
    }
}

app.Run();

