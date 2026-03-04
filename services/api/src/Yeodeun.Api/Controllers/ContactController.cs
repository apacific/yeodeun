using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Yeodeun.Api.Contracts;

namespace Yeodeun.Api.Controllers;

[ApiController]
[EnableRateLimiting("contact-write")]
[Route("api/contact")]
/// <summary>
/// Handles contact form submissions and validates optional contact fields.
/// </summary>
public sealed class ContactController : ControllerBase
{
    private static readonly Regex PhoneRegex = new("^[0-9()+\\-\\s.]{7,}$", RegexOptions.Compiled);
    private static readonly EmailAddressAttribute EmailValidator = new();

    private readonly ILogger<ContactController> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="ContactController"/> class.
    /// </summary>
    /// <param name="logger">Logger used for intake audit events.</param>
    public ContactController(ILogger<ContactController> logger) => _logger = logger;

    /// <summary>
    /// Validates and accepts a contact request.
    /// </summary>
    /// <param name="request">Payload containing optional message, email, and phone fields.</param>
    /// <returns>Success confirmation or validation error details.</returns>
    [HttpPost]
    public ActionResult<ContactResponseDto> Submit(ContactRequestDto request)
    {
        var message = request.Message?.Trim();
        var email = request.Email?.Trim();
        var phone = request.Phone?.Trim();

        if (string.IsNullOrWhiteSpace(message) &&
            string.IsNullOrWhiteSpace(email) &&
            string.IsNullOrWhiteSpace(phone))
        {
            return BadRequest("At least one field must be provided.");
        }

        if (!string.IsNullOrWhiteSpace(email) && !EmailValidator.IsValid(email))
        {
            return BadRequest("Invalid email address.");
        }

        if (!string.IsNullOrWhiteSpace(phone) && !PhoneRegex.IsMatch(phone))
        {
            return BadRequest("Invalid phone number.");
        }

        _logger.LogInformation("Contact request received. HasEmail={HasEmail} HasPhone={HasPhone} MessageLength={Length}",
            !string.IsNullOrWhiteSpace(email),
            !string.IsNullOrWhiteSpace(phone),
            message?.Length ?? 0);

        return Ok(new ContactResponseDto("Thanks for reaching out! We'll be in touch soon."));
    }
}

