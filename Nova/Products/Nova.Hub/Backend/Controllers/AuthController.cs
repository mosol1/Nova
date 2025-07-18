using Microsoft.AspNetCore.Mvc;
using Nova.Hub.Service;
using Nova.Shared;

namespace Nova.Hub.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly HubService _hubService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(HubService hubService, ILogger<AuthController> logger)
        {
            _hubService = hubService;
            _logger = logger;
        }

        /// <summary>
        /// Get current user authentication status
        /// </summary>
        [HttpGet("status")]
        public ActionResult<object> GetAuthStatus()
        {
            try
            {
                var user = _hubService.CurrentUser;
                return Ok(new
                {
                    isAuthenticated = user.IsAuthenticated,
                    user = user.IsAuthenticated ? new
                    {
                        id = user.UserId ?? user.Username,
                        username = user.Username,
                        email = user.Email,
                        displayName = user.DisplayName ?? user.GlobalName ?? user.Username,
                        avatarUrl = user.AvatarUrl,
                        globalName = user.GlobalName,
                        discordId = user.DiscordId,
                        image = user.Image, // Base64 profile picture
                        createdAt = user.CreatedAt
                    } : null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting auth status");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Check for pending authentication (polling endpoint)
        /// </summary>
        [HttpGet("check/{state}")]
        public async Task<ActionResult<object>> CheckPendingAuth(string state)
        {
            try
            {
                var pendingAuth = await _hubService.CheckPendingAuthentication(state);
                if (pendingAuth != null)
                {
                    // Process the authentication
                    await _hubService.ProcessAuthenticationCallback(pendingAuth);
                    return Ok(new { success = true, message = "Authentication completed" });
                }
                
                return Ok(new { success = false, message = "No pending authentication" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking pending authentication");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Initiate sign-in flow
        /// </summary>
        [HttpPost("signin")]
        public async Task<ActionResult<object>> InitiateSignIn()
        {
            try
            {
                _logger.LogInformation("Sign-in initiated via API");
                var state = await _hubService.InitiateSignIn();
                
                return Ok(new { 
                    message = "Sign-in flow initiated. Please complete authentication in your browser.",
                    status = "initiated",
                    state = state
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating sign-in");
                return StatusCode(500, new { error = "Failed to initiate sign-in" });
            }
        }

        /// <summary>
        /// Sign out current user
        /// </summary>
        [HttpPost("signout")]
        public new async Task<ActionResult<object>> SignOut()
        {
            try
            {
                await _hubService.SignOut();
                return Ok(new { message = "Successfully signed out" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during sign-out");
                return StatusCode(500, new { error = "Failed to sign out" });
            }
        }
    }
} 