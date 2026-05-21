using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Models;
using ProjectA.Options;
using ProjectA.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<BusinessHoursOptions>(builder.Configuration.GetSection("BusinessHours"));
builder.Services.Configure<AdminSeedOptions>(builder.Configuration.GetSection("AdminSeed"));
builder.Services.Configure<GoogleAuthOptions>(builder.Configuration.GetSection("GoogleAuth"));
builder.Services.Configure<MinioOptions>(builder.Configuration.GetSection("Minio"));

var connectionString = builder.Configuration.GetConnectionString("Postgres");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("ConnectionStrings:Postgres is required.");
}
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequiredLength = 6;
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddSignInManager();

builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<IImageStorageService, MinioImageStorageService>();

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetSection("Redis")["ConnectionString"];
});

var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
if (string.IsNullOrWhiteSpace(jwtOptions.Key))
{
    throw new InvalidOperationException("Jwt:Key is required.");
}

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(Policies.ProductView, policy =>
        policy.Requirements.Add(new PermissionRequirement(Permissions.ProductView)));

    options.AddPolicy(Policies.ProductAdd, policy =>
    {
        policy.Requirements.Add(new PermissionRequirement(Permissions.ProductAdd));
        policy.Requirements.Add(new BusinessHoursApprovalRequirement());
    });

    options.AddPolicy(Policies.ProductEdit, policy =>
    {
        policy.Requirements.Add(new PermissionRequirement(Permissions.ProductEdit));
        policy.Requirements.Add(new BusinessHoursApprovalRequirement());
    });

    options.AddPolicy(Policies.ProductDelete, policy =>
    {
        policy.Requirements.Add(new PermissionRequirement(Permissions.ProductDelete));
        policy.Requirements.Add(new BusinessHoursApprovalRequirement());
    });

    // Court — xem chỉ cần quyền; thêm/sửa/xóa phải trong ca làm việc (RBAC theo ca).
    options.AddPolicy(Policies.CourtView, policy =>
        policy.Requirements.Add(new PermissionRequirement(Permissions.CourtView)));

    options.AddPolicy(Policies.CourtAdd, policy =>
    {
        policy.Requirements.Add(new PermissionRequirement(Permissions.CourtAdd));
        policy.Requirements.Add(new BusinessHoursApprovalRequirement());
    });

    options.AddPolicy(Policies.CourtEdit, policy =>
    {
        policy.Requirements.Add(new PermissionRequirement(Permissions.CourtEdit));
        policy.Requirements.Add(new BusinessHoursApprovalRequirement());
    });

    options.AddPolicy(Policies.CourtDelete, policy =>
    {
        policy.Requirements.Add(new PermissionRequirement(Permissions.CourtDelete));
        policy.Requirements.Add(new BusinessHoursApprovalRequirement());
    });

    // Các module domain — xem chỉ cần quyền; thêm/sửa/xóa phải trong ca (RBAC theo ca).
    void AddViewPolicy(string policyName, string permission) =>
        options.AddPolicy(policyName, p => p.Requirements.Add(new PermissionRequirement(permission)));

    void AddWritePolicy(string policyName, string permission) =>
        options.AddPolicy(policyName, p =>
        {
            p.Requirements.Add(new PermissionRequirement(permission));
            p.Requirements.Add(new BusinessHoursApprovalRequirement());
        });

    AddViewPolicy(Policies.CustomerView, Permissions.CustomerView);
    AddWritePolicy(Policies.CustomerAdd, Permissions.CustomerAdd);
    AddWritePolicy(Policies.CustomerEdit, Permissions.CustomerEdit);
    AddWritePolicy(Policies.CustomerDelete, Permissions.CustomerDelete);

    AddViewPolicy(Policies.BookingView, Permissions.BookingView);
    AddWritePolicy(Policies.BookingAdd, Permissions.BookingAdd);
    AddWritePolicy(Policies.BookingEdit, Permissions.BookingEdit);
    AddWritePolicy(Policies.BookingDelete, Permissions.BookingDelete);

    AddViewPolicy(Policies.SupplyView, Permissions.SupplyView);
    AddWritePolicy(Policies.SupplyAdd, Permissions.SupplyAdd);
    AddWritePolicy(Policies.SupplyEdit, Permissions.SupplyEdit);
    AddWritePolicy(Policies.SupplyDelete, Permissions.SupplyDelete);

    AddViewPolicy(Policies.OrderView, Permissions.OrderView);
    AddWritePolicy(Policies.OrderAdd, Permissions.OrderAdd);

    AddViewPolicy(Policies.PaymentView, Permissions.PaymentView);
    AddWritePolicy(Policies.PaymentAdd, Permissions.PaymentAdd);
    AddWritePolicy(Policies.PaymentEdit, Permissions.PaymentEdit);
    AddWritePolicy(Policies.PaymentDelete, Permissions.PaymentDelete);
});

builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddScoped<IAuthorizationHandler, BusinessHoursApprovalHandler>();
builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler, AuthorizationFailureResultHandler>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Vite", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ProjectA API",
        Version = "v1"
    });

    // JWT Auth
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT token.\n\nExample: Bearer eyJhbGciOiJIUzI1Ni..."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("Vite");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    await DbSeeder.SeedAsync(scope.ServiceProvider);
}

await app.RunAsync();
