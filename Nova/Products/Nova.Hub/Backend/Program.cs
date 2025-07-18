using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Hosting.WindowsServices;
using Nova.Core;
using Nova.Shared;
using Nova.Hub.Service;
using Nova.Hub.Controllers;

namespace Nova.Hub
{
    /// <summary>
    /// Nova Hub API Server
    /// HTTP API service for Nova Hub React frontend
    /// </summary>
    public class Program
    {
        public static async Task Main(string[] args)
        {
            // Initialize logging
            Logger.Initialize("NovaHubAPI", NovaLogLevel.Info);
            Logger.Info("Starting Nova Hub API Server...");
            
            var builder = WebApplication.CreateBuilder(args);
            
            // Configure services
            ConfigureServices(builder.Services, builder.Configuration);
            
            // Configure for Windows Service if needed
            if (WindowsServiceHelpers.IsWindowsService())
            {
                builder.Host.UseWindowsService();
            }
            
            var app = builder.Build();
            
            // Configure the HTTP request pipeline
            ConfigureMiddleware(app);
            
            // Start the Hub Service
            var hubService = app.Services.GetRequiredService<HubService>();
            await hubService.StartAsync();
            
            Logger.Info("Nova Hub API Server started successfully");
            
            try
            {
                await app.RunAsync();
            }
            finally
            {
                // Stop the Hub Service when the application shuts down
                await hubService.StopAsync();
            }
        }
        
        private static void ConfigureServices(IServiceCollection services, IConfiguration configuration)
        {
            // Add API controllers and configure assembly discovery
            services.AddControllers(options =>
            {
                // Additional configuration if needed
            })
            .AddApplicationPart(typeof(Program).Assembly)
            .AddNewtonsoftJson();
            
            // Add CORS for React frontend - UPDATED TO INCLUDE MORE PORTS
            services.AddCors(options =>
            {
                options.AddPolicy("AllowReactFrontend", policy =>
                {
                    policy.WithOrigins(
                        "http://localhost:3000",     // Create React App default
                        "http://localhost:5173",     // Vite default
                        "http://localhost:5174",     // Vite alternative
                        "http://localhost:1421",     // Your current port
                        "http://localhost:8080",     // Common dev port
                        "http://localhost:8081",     // Common dev port
                        "http://127.0.0.1:3000",
                        "http://127.0.0.1:5173",
                        "http://127.0.0.1:5174",
                        "http://127.0.0.1:1421",
                        "http://127.0.0.1:8080",
                        "http://127.0.0.1:8081",
                        "tauri://localhost"          // Tauri apps
                    )
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials()
                    .SetPreflightMaxAge(TimeSpan.FromDays(1)); // Cache preflight requests
                });

                // Alternative: Allow all origins for development (less secure but simpler)
                options.AddPolicy("AllowAll", policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                });
            });
            
            // Add Swagger for API documentation
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
                {
                    Title = "Nova Hub API",
                    Version = "v1",
                    Description = "API for Nova Hub - Central management interface for Nova products"
                });
            });
            
            // Register Nova services
            services.AddSingleton<NovaCore>(NovaCore.Instance);
            services.AddSingleton<HubService>();
            
            // Add the background service worker
            services.AddHostedService<HubWorker>();
            
            // Add authentication (for future use with JWT tokens)
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    // JWT configuration will be added later when needed
                });
            
            // Add logging
            services.AddLogging(builder =>
            {
                builder.AddConsole();
                if (OperatingSystem.IsWindows())
                {
                    builder.AddEventLog();
                }
            });
        }
        
        private static void ConfigureMiddleware(WebApplication app)
        {
            // Configure the HTTP request pipeline
            if (app.Environment.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Nova Hub API v1");
                });
                
                // Use the more permissive CORS policy in development
                app.UseCors("AllowAll");
            }
            else
            {
                // Use the restrictive CORS policy in production
                app.UseCors("AllowReactFrontend");
            }
            
            app.UseAuthentication();
            app.UseAuthorization();
            
            // Map API controllers
            app.MapControllers();
            
            // Health check endpoint
            app.MapGet("/health", () => new { 
                status = "healthy", 
                timestamp = DateTime.UtcNow,
                service = "Nova Hub API"
            });
            
            // Root endpoint with API info
            app.MapGet("/", () => new { 
                name = "Nova Hub API", 
                version = "1.0.0",
                documentation = "/swagger",
                status = "running",
                endpoints = new[] {
                    "/health",
                    "/api/test",
                    "/api/auth/status",
                    "/api/auth/signin", 
                    "/api/auth/signout",
                    "/api/products",
                    "/api/refresh"
                }
            });
        }
    }
}