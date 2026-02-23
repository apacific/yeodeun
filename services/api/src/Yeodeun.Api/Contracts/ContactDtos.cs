namespace Yeodeun.Api.Contracts;

/// <summary>
/// Represents the contact request dto record.
/// </summary>
public sealed record ContactRequestDto(
    string? Message,
    string? Email,
    string? Phone
);

/// <summary>
/// Represents the contact response dto record.
/// </summary>
public sealed record ContactResponseDto(string Message);

