using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using ProjectA.Dtos.Auth;
using ProjectA.Models;
using ProjectA.Services;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IJwtTokenService _tokenService;

        public AuthController(UserManager<ApplicationUser> userManager, IJwtTokenService tokenService)
        {
            _userManager = userManager;
            _tokenService = tokenService;
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

            var token = await _tokenService.CreateTokenAsync(user);
            return Ok(new AuthResponse
            {
                Token = token.Token,
                ExpiresAtUtc = token.ExpiresAtUtc,
                UserId = user.Id,
                Email = user.Email ?? string.Empty
            });
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

            var token = await _tokenService.CreateTokenAsync(user);
            return Ok(new AuthResponse
            {
                Token = token.Token,
                ExpiresAtUtc = token.ExpiresAtUtc,
                UserId = user.Id,
                Email = user.Email ?? string.Empty
            });
        }
    }
}
