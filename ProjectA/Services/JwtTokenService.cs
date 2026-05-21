using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using ProjectA.Data;
using ProjectA.Models;
using ProjectA.Options;

namespace ProjectA.Services
{
    public interface IJwtTokenService
    {
        Task<AuthTokenResult> IssueTokensAsync(ApplicationUser user);
        Task<AuthTokenResult?> RefreshAsync(string refreshToken);
        Task<bool> RevokeAsync(string refreshToken);
    }

    public record AuthTokenResult(
        ApplicationUser User,
        string AccessToken,
        DateTime AccessTokenExpiresAtUtc,
        string RefreshToken,
        DateTime RefreshTokenExpiresAtUtc);

    public class JwtTokenService : IJwtTokenService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _db;
        private readonly JwtOptions _options;

        public JwtTokenService(
            UserManager<ApplicationUser> userManager,
            AppDbContext db,
            IOptions<JwtOptions> options)
        {
            _userManager = userManager;
            _db = db;
            _options = options.Value;
        }

        public async Task<AuthTokenResult> IssueTokensAsync(ApplicationUser user)
        {
            var (accessToken, accessExpiresAt) = await CreateAccessTokenAsync(user);
            var refreshToken = await CreateRefreshTokenAsync(user.Id);

            return new AuthTokenResult(
                user,
                accessToken,
                accessExpiresAt,
                refreshToken.Token,
                refreshToken.ExpiresAtUtc);
        }

        public async Task<AuthTokenResult?> RefreshAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return null;
            }

            var existing = await _db.RefreshTokens
                .Include(t => t.User)
                .SingleOrDefaultAsync(t => t.Token == refreshToken);

            if (existing is null || !existing.IsActive)
            {
                return null;
            }

            // Rotate: revoke the current token and issue a new one.
            var replacement = await CreateRefreshTokenAsync(existing.UserId);
            existing.RevokedAtUtc = DateTime.UtcNow;
            existing.ReplacedByToken = replacement.Token;
            await _db.SaveChangesAsync();

            var (accessToken, accessExpiresAt) = await CreateAccessTokenAsync(existing.User);

            return new AuthTokenResult(
                existing.User,
                accessToken,
                accessExpiresAt,
                replacement.Token,
                replacement.ExpiresAtUtc);
        }

        public async Task<bool> RevokeAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return false;
            }

            var existing = await _db.RefreshTokens
                .SingleOrDefaultAsync(t => t.Token == refreshToken);

            if (existing is null || !existing.IsActive)
            {
                return false;
            }

            existing.RevokedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        private async Task<(string Token, DateTime ExpiresAtUtc)> CreateAccessTokenAsync(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Name, user.UserName ?? user.Email ?? string.Empty)
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(_options.Key));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiresAt = DateTime.UtcNow.AddMinutes(_options.ExpiresMinutes);

            var token = new JwtSecurityToken(
                _options.Issuer,
                _options.Audience,
                claims,
                expires: expiresAt,
                signingCredentials: credentials);

            var tokenValue = new JwtSecurityTokenHandler().WriteToken(token);
            return (tokenValue, expiresAt);
        }

        private async Task<RefreshToken> CreateRefreshTokenAsync(Guid userId)
        {
            var now = DateTime.UtcNow;
            var refreshToken = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = GenerateSecureToken(),
                CreatedAtUtc = now,
                ExpiresAtUtc = now.AddDays(_options.RefreshTokenExpiresDays)
            };

            _db.RefreshTokens.Add(refreshToken);
            await _db.SaveChangesAsync();
            return refreshToken;
        }

        private static string GenerateSecureToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToBase64String(bytes);
        }
    }
}
