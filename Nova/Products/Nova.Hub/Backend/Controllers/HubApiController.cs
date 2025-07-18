using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Nova.Hub.Service;
using Nova.Shared;
using Nova.Core;

namespace Nova.Hub.Controllers
{
    [ApiController]
    [Route("api")]
    public class HubApiController : ControllerBase
    {
        private readonly HubService _hubService;
        private readonly ILogger<HubApiController> _logger;

        public HubApiController(HubService hubService, ILogger<HubApiController> logger)
        {
            _hubService = hubService;
            _logger = logger;
        }

        /// <summary>
        /// Handle authentication callback from Nova protocol handler
        /// </summary>
        [HttpPost("auth/callback")]
        public async Task<IActionResult> AuthCallback([FromBody] HubAuthCallbackRequest request)
        {
            try
            {
                _logger.LogInformation("Authentication callback received");

                if (string.IsNullOrEmpty(request.AuthData))
                {
                    return BadRequest(new { error = "Auth data is required" });
                }

                await _hubService.HandleAuthenticationCallback(request.AuthData);

                return Ok(new { 
                    message = "Authentication callback processed successfully",
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing authentication callback");
                return StatusCode(500, new { error = "Failed to process authentication callback" });
            }
        }

        /// <summary>
        /// Refresh all data
        /// </summary>
        [HttpGet("refresh")]
        public async Task<IActionResult> RefreshAll()
        {
            try
            {
                _logger.LogInformation("Refresh all data request received");

                await _hubService.RefreshAllData();

                // Get updated data
                var user = _hubService.CurrentUser;
                var products = _hubService.RunningProducts
                    .Concat(_hubService.InstalledProducts)
                    .Select(p => new
                    {
                        id = p.Id,
                        name = p.Name,
                        description = p.Description,
                        version = p.Version,
                        isRunning = p.Status == ProductStatus.Running,
                        isInstalled = p.IsInstalled,
                        category = "Nova Product" // Default category
                    })
                    .ToList();

                var authStatus = new
                {
                    isAuthenticated = user.IsAuthenticated,
                    user = user.IsAuthenticated ? new
                    {
                        id = user.Username, // Use Username as ID
                        username = user.Username,
                        email = user.Email,
                        avatarUrl = (string?)null // Set to null since Avatar might not exist
                    } : null
                };

                _logger.LogInformation("Refresh completed successfully");
                return Ok(new { 
                    products,
                    authStatus,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing all data");
                return StatusCode(500, new { error = "Failed to refresh data" });
            }
        }

        /// <summary>
        /// Test endpoint to verify API is working
        /// </summary>
        [HttpGet("test")]
        public IActionResult Test()
        {
            _logger.LogInformation("API test endpoint called");
            return Ok(new { 
                message = "Nova Hub API is working!",
                timestamp = DateTime.UtcNow,
                controller = "HubApiController"
            });
        }
    }

    /// <summary>
    /// Request model for authentication callback
    /// </summary>
    public class HubAuthCallbackRequest
    {
        public string AuthData { get; set; } = string.Empty;
    }
}