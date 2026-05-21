using Microsoft.AspNetCore.Mvc;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using ProjectA.Dtos.Auth;
using ProjectA.Models;
using ProjectA.Options;
using ProjectA.Services;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IJwtTokenService _tokenService;
        private readonly GoogleAuthOptions _googleOptions;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            IJwtTokenService tokenService,
            IOptions<GoogleAuthOptions> googleOptions)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _googleOptions = googleOptions.Value;
        }

        [HttpPost("signup")]
        public async Task<ActionResult<AuthResponse>> SignUp([FromBody] SignupRequest request)
        {
            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                IsAdminApproved = false
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors.Select(e => e.Description));
            }

            var tokens = await _tokenService.IssueTokensAsync(user);
            return Ok(BuildResponse(tokens));
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user is null)
            {
                return Unauthorized();
            }

            var valid = await _userManager.CheckPasswordAsync(user, request.Password);
            if (!valid)
            {
                return Unauthorized();
            }

            var tokens = await _tokenService.IssueTokensAsync(user);
            return Ok(BuildResponse(tokens));
        }

        [HttpPost("google")]
        public async Task<ActionResult<AuthResponse>> LoginWithGoogle([FromBody] GoogleLoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.IdToken))
            {
                return BadRequest("IdToken is required.");
            }

            if (string.IsNullOrWhiteSpace(_googleOptions.ClientId))
            {
                throw new InvalidOperationException("GoogleAuth:ClientId is required.");
            }

            GoogleJsonWebSignature.Payload payload;
            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { _googleOptions.ClientId }
                });
            }
            catch (InvalidJwtException)
            {
                return Unauthorized();
            }

            if (string.IsNullOrWhiteSpace(payload.Email))
            {
                return BadRequest("Google account email is required.");
            }

            const string loginProvider = "Google";
            var user = await _userManager.FindByLoginAsync(loginProvider, payload.Subject);

            if (user is null)
            {
                user = await _userManager.FindByEmailAsync(payload.Email);
                if (user is null)
                {
                    user = new ApplicationUser
                    {
                        UserName = payload.Email,
                        Email = payload.Email,
                        EmailConfirmed = payload.EmailVerified,
                        IsAdminApproved = false
                    };

                    var createResult = await _userManager.CreateAsync(user);
                    if (!createResult.Succeeded)
                    {
                        return BadRequest(createResult.Errors.Select(e => e.Description));
                    }
                }

                var loginInfo = new UserLoginInfo(loginProvider, payload.Subject, loginProvider);
                var loginResult = await _userManager.AddLoginAsync(user, loginInfo);
                if (!loginResult.Succeeded)
                {
                    return BadRequest(loginResult.Errors.Select(e => e.Description));
                }
            }

            var tokens = await _tokenService.IssueTokensAsync(user);
            return Ok(BuildResponse(tokens));
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshTokenRequest request)
        {
            var tokens = await _tokenService.RefreshAsync(request.RefreshToken);
            if (tokens is null)
            {
                return Unauthorized();
            }

            return Ok(BuildResponse(tokens));
        }

        [HttpPost("revoke")]
        public async Task<IActionResult> Revoke([FromBody] RefreshTokenRequest request)
        {
            var revoked = await _tokenService.RevokeAsync(request.RefreshToken);
            if (!revoked)
            {
                return NotFound();
            }

            return NoContent();
        }

        private static AuthResponse BuildResponse(AuthTokenResult tokens) => new()
        {
            Token = tokens.AccessToken,
            ExpiresAtUtc = tokens.AccessTokenExpiresAtUtc,
            RefreshToken = tokens.RefreshToken,
            RefreshTokenExpiresAtUtc = tokens.RefreshTokenExpiresAtUtc,
            UserId = tokens.User.Id,
            Email = tokens.User.Email ?? string.Empty
        };
    }
}
