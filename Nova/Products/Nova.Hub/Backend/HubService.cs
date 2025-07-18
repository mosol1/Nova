using Microsoft.Extensions.Logging;
using Nova.Core;
using Nova.Shared;
using Nova.Shared.Messages;
using System.Diagnostics;
using System.Net.Http;
using System.Text;
using System.Security;
using Newtonsoft.Json;

namespace Nova.Hub.Service
{
    /// <summary>
    /// Nova Hub service - manages the central hub for all Nova products
    /// Handles product discovery, authentication flow, and catalog management
    /// </summary>
    public class HubService
    {
        private readonly NovaCore _novaCore;
        private readonly ILogger<HubService> _logger;
        private readonly HttpClient _httpClient;
        private bool _isRunning = false;
        private readonly System.Threading.Timer _refreshTimer;

        // Hub data
        private List<NovaProduct> _allProducts = new List<NovaProduct>();
        private UserInfo _currentUser = new UserInfo { IsAuthenticated = false };

        // Authentication
        private string _authenticationState = Guid.NewGuid().ToString("N");
        private TaskCompletionSource<UserInfo>? _authenticationTask;
        private readonly Dictionary<string, PendingAuthData> _pendingAuthentications = new Dictionary<string, PendingAuthData>();

        // Configuration
        private const string WEBSITE_BASE_URL = "http://localhost:3000"; // Local Nova web frontend
        private const string API_BASE_URL = "http://localhost:5000"; // Local Nova web backend API

        public HubService(NovaCore novaCore, ILogger<HubService> logger)
        {
            _novaCore = novaCore;
            _logger = logger;
            _httpClient = new HttpClient();
            
            // Set up periodic refresh timer (every 5 seconds)
            _refreshTimer = new System.Threading.Timer(RefreshData, null, TimeSpan.Zero, TimeSpan.FromSeconds(5));
        }

        /// <summary>
        /// Start the Hub service
        /// </summary>
        public async Task StartAsync()
        {
            try
            {
                _logger.LogInformation("Starting Nova Hub Service...");

                // Register with Nova Core as the hub
                await RegisterWithNovaCore();

                // Initialize authentication monitoring
                await InitializeAuthenticationMonitoring();

                // Load initial data
                await RefreshAllData();

                // Load saved user data if available
                await LoadSavedUserData();

                _isRunning = true;
                _logger.LogInformation("Nova Hub Service started successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start Nova Hub Service");
                throw;
            }
        }

        /// <summary>
        /// Stop the Hub service
        /// </summary>
        public async Task StopAsync()
        {
            try
            {
                _logger.LogInformation("Stopping Nova Hub Service...");

                _isRunning = false;
                _refreshTimer?.Dispose();
                _httpClient?.Dispose();

                await UnregisterFromNovaCore();

                _logger.LogInformation("Nova Hub Service stopped successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping Nova Hub Service");
                throw;
            }
        }

        /// <summary>
        /// Register this hub with Nova Core
        /// </summary>
        private async Task RegisterWithNovaCore()
        {
            var hubInfo = new NovaProduct
            {
                Id = "nova.hub",
                Name = "Nova Hub",
                Version = "2.0.0",
                Status = ProductStatus.Running,
                IsInstalled = true,
                Description = "Central management interface for all Nova products"
            };

            _novaCore.ProductManager.RegisterProduct(hubInfo);
            _logger.LogInformation("Registered Nova Hub with Nova Core");
        }

        /// <summary>
        /// Unregister the hub from Nova Core
        /// </summary>
        private async Task UnregisterFromNovaCore()
        {
            _novaCore.ProductManager.UnregisterProduct("nova.hub");
            _logger.LogInformation("Unregistered Nova Hub from Nova Core");
        }

        /// <summary>
        /// Initialize authentication monitoring
        /// </summary>
        private async Task InitializeAuthenticationMonitoring()
        {
            // Subscribe to authentication changes from Nova Core
            // This will update the UI when user signs in/out   
            _currentUser = _novaCore.CurrentUser ?? new UserInfo { IsAuthenticated = false };
            _logger.LogInformation($"Authentication monitoring initialized. Current user: {(_currentUser.IsAuthenticated ? _currentUser.Username : "Not signed in")}");
        }

        /// <summary>
        /// Load saved user data from local storage
        /// </summary>
        private async Task LoadSavedUserData()
        {
            try
            {
                var userDataPath = Path.Combine(Constants.UserDataPath, "user.json");
                if (File.Exists(userDataPath))
                {
                    var userJson = await File.ReadAllTextAsync(userDataPath);
                    var savedUser = JsonConvert.DeserializeObject<UserInfo>(userJson);
                    
                    if (savedUser != null && !string.IsNullOrEmpty(savedUser.AuthToken))
                    {
                        // Validate token with server
                        var isValid = await ValidateAuthToken(savedUser.AuthToken);
                        if (isValid)
                        {
                            _currentUser = savedUser;
                            _currentUser.IsAuthenticated = true;
                            
                            // Load local preferences from registry
                            await LoadLocalPreferences();
                            
                            _logger.LogInformation($"Restored user session: {_currentUser.Username}");
                        }
                        else
                        {
                            _logger.LogInformation("Saved auth token is no longer valid");
                            // Clear invalid user data
                            File.Delete(userDataPath);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load saved user data");
            }
        }

        /// <summary>
        /// Save user data to local storage
        /// </summary>
        private async Task SaveUserData()
        {
            try
            {
                if (!Directory.Exists(Constants.UserDataPath))
                {
                    Directory.CreateDirectory(Constants.UserDataPath);
                }

                var userDataPath = Path.Combine(Constants.UserDataPath, "user.json");
                var userJson = JsonConvert.SerializeObject(_currentUser, Formatting.Indented);
                await File.WriteAllTextAsync(userDataPath, userJson);
                
                // Save local preferences to registry
                await SaveLocalPreferences();
                
                _logger.LogDebug("User data saved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to save user data");
            }
        }

        /// <summary>
        /// Save local preferences to Windows Registry
        /// </summary>
        private async Task SaveLocalPreferences()
        {
            try
            {
                await Task.Run(() =>
                {
                    using (var key = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"SOFTWARE\Nova\Hub\Preferences"))
                    {
                        if (_currentUser?.LocalPreferences != null)
                        {
                            foreach (var pref in _currentUser.LocalPreferences)
                            {
                                key.SetValue(pref.Key, pref.Value?.ToString() ?? "");
                            }
                        }
                    }
                });
                
                _logger.LogDebug("Local preferences saved to registry");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to save local preferences to registry");
            }
        }

        /// <summary>
        /// Load local preferences from Windows Registry
        /// </summary>
        private async Task LoadLocalPreferences()
        {
            try
            {
                await Task.Run(() =>
                {
                    using (var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"SOFTWARE\Nova\Hub\Preferences"))
                    {
                        if (key != null && _currentUser != null)
                        {
                            _currentUser.LocalPreferences = new Dictionary<string, object>();
                            
                            // Load common preferences with defaults
                            _currentUser.LocalPreferences["language"] = key.GetValue("language", "en")?.ToString() ?? "en";
                            _currentUser.LocalPreferences["theme"] = key.GetValue("theme", "dark")?.ToString() ?? "dark";
                            _currentUser.LocalPreferences["notifications"] = bool.Parse(key.GetValue("notifications", "true")?.ToString() ?? "true");
                            _currentUser.LocalPreferences["auto_updates"] = bool.Parse(key.GetValue("auto_updates", "true")?.ToString() ?? "true");
                            _currentUser.LocalPreferences["telemetry"] = bool.Parse(key.GetValue("telemetry", "false")?.ToString() ?? "false");
                        }
                    }
                });
                
                _logger.LogDebug("Local preferences loaded from registry");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load local preferences from registry");
            }
        }

        /// <summary>
        /// Validate authentication token with server
        /// </summary>
        private async Task<bool> ValidateAuthToken(string token)
        {
            try
            {
                _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                var response = await _httpClient.GetAsync($"{API_BASE_URL}/auth/validate");
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to validate auth token");
                return false;
            }
        }

        /// <summary>
        /// Refresh all hub data
        /// </summary>
        public async Task RefreshAllData()
        {
            try
            {
                // Get all products from Nova Core
                _allProducts = _novaCore.ProductManager.GetAllProducts().ToList();
                
                // Update user information from Nova Core if not locally authenticated
                if (!_currentUser.IsAuthenticated)
                {
                    _currentUser = _novaCore.CurrentUser ?? new UserInfo { IsAuthenticated = false };
                }

                _logger.LogDebug($"Refreshed hub data: {_allProducts.Count} products, User authenticated: {_currentUser.IsAuthenticated}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing hub data");
            }
        }

        /// <summary>
        /// Timer callback to refresh data periodically
        /// </summary>
        private void RefreshData(object? state)
        {
            if (_isRunning)
            {
                try
                {
                    RefreshAllData().Wait();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in periodic data refresh");
                }
            }
        }

        /// <summary>
        /// Launch a specific Nova product
        /// </summary>
        public async Task<bool> LaunchProduct(string productId)
        {
            try
            {
                _logger.LogInformation($"Launching product: {productId}");

                var product = _allProducts.FirstOrDefault(p => p.Id == productId);
                if (product == null)
                {
                    _logger.LogWarning($"Product not found: {productId}");
                    return false;
                }

                // TODO: Implement product launching logic
                // This should start the product's backend service and frontend
                
                _logger.LogInformation($"Successfully launched product: {productId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error launching product: {productId}");
                return false;
            }
        }

        /// <summary>
        /// Initiate sign-in flow (opens website)
        /// </summary>
        public async Task<string> InitiateSignIn()
        {
            try
            {
                _logger.LogInformation("Initiating sign-in flow...");

                // Generate a new authentication state
                _authenticationState = Guid.NewGuid().ToString("N");
                
                // Create authentication task to wait for callback
                _authenticationTask = new TaskCompletionSource<UserInfo>();

                // Build sign-in URL with return protocol handler
                var returnUrl = Uri.EscapeDataString($"nova://auth/callback?state={_authenticationState}");
                var signInUrl = $"{WEBSITE_BASE_URL}/login?return={returnUrl}";
                
                _logger.LogInformation($"Opening sign-in URL: {signInUrl}");

                // Open the Nova website sign-in page
                Process.Start(new ProcessStartInfo
                {
                    FileName = signInUrl,
                    UseShellExecute = true
                });

                _logger.LogInformation("Sign-in URL opened in browser. Frontend will poll for authentication completion.");
                
                // Return the state for polling
                return _authenticationState;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating sign-in flow");
                throw;
            }
        }

        /// <summary>
        /// Handle protocol authentication callback from website
        /// </summary>
        public async Task HandleAuthenticationCallback(string authData)
        {
            try
            {
                _logger.LogInformation("Handling authentication callback...");

                // Parse the auth data from the nova:// URL
                var uri = new Uri(authData);
                var query = ParseQueryString(uri.Query);
                
                var state = query.GetValueOrDefault("state");
                var token = query.GetValueOrDefault("token");
                var userId = query.GetValueOrDefault("userId");

                // Validate state to prevent CSRF attacks
                if (state != _authenticationState)
                {
                    _logger.LogWarning("Invalid authentication state - possible CSRF attack");
                    _authenticationTask?.SetException(new SecurityException("Invalid authentication state"));
                    return;
                }

                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("No authentication token provided");
                    _authenticationTask?.SetException(new ArgumentException("No authentication token provided"));
                    return;
                }

                // Fetch user details from API using the token
                var userInfo = await FetchUserInfo(token);
                if (userInfo != null)
                {
                    _currentUser = userInfo;
                    _currentUser.IsAuthenticated = true;
                    _currentUser.LoginTime = DateTime.Now;
                    _currentUser.AuthToken = token;

                    // Initialize default local preferences if not already set
                    if (_currentUser.LocalPreferences == null || _currentUser.LocalPreferences.Count == 0)
                    {
                        _currentUser.LocalPreferences = new Dictionary<string, object>
                        {
                            ["language"] = "en",
                            ["theme"] = "dark",
                            ["notifications"] = true,
                            ["auto_updates"] = true,
                            ["telemetry"] = false
                        };
                    }

                    // Save user data for future sessions
                    await SaveUserData();

                    // Update Nova Core
                    _novaCore.SetCurrentUser(_currentUser);

                    _logger.LogInformation($"Authentication successful for user: {_currentUser.Username}");
                    
                    // Complete the authentication task
                    _authenticationTask?.SetResult(_currentUser);
                }
                else
                {
                    _logger.LogWarning("Failed to fetch user information");
                    _authenticationTask?.SetException(new Exception("Failed to fetch user information"));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling authentication callback");
                _authenticationTask?.SetException(ex);
            }
            finally
            {
                _authenticationTask = null;
                _authenticationState = string.Empty;
            }
        }

        /// <summary>
        /// Parse query string parameters manually
        /// </summary>
        private Dictionary<string, string?> ParseQueryString(string query)
        {
            var result = new Dictionary<string, string?>();
            
            if (string.IsNullOrEmpty(query))
                return result;

            // Remove leading ? if present
            if (query.StartsWith("?"))
                query = query.Substring(1);

            var pairs = query.Split('&');
            foreach (var pair in pairs)
            {
                var keyValue = pair.Split('=', 2);
                if (keyValue.Length == 2)
                {
                    var key = Uri.UnescapeDataString(keyValue[0]);
                    var value = Uri.UnescapeDataString(keyValue[1]);
                    result[key] = value;
                }
            }

            return result;
        }

        /// <summary>
        /// Fetch user information from API using auth token
        /// </summary>
        private async Task<UserInfo?> FetchUserInfo(string token)
        {
            try
            {
                _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                var response = await _httpClient.GetAsync($"{API_BASE_URL}/api/auth/me");
                
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonConvert.DeserializeObject<dynamic>(json);
                    
                    if (apiResponse?.success == true && apiResponse?.user != null)
                    {
                        var user = apiResponse.user;
                        var userData = user.user_data;
                        
                        // Fetch Discord profile picture as base64
                        string profilePictureBase64 = "";
                        if (userData?.avatar != null && userData?.id != null)
                        {
                            try
                            {
                                var avatarUrl = $"https://cdn.discordapp.com/avatars/{userData.id}/{userData.avatar}.png";
                                var imageResponse = await _httpClient.GetAsync(avatarUrl);
                                if (imageResponse.IsSuccessStatusCode)
                                {
                                    var imageBytes = await imageResponse.Content.ReadAsByteArrayAsync();
                                    profilePictureBase64 = Convert.ToBase64String(imageBytes);
                                }
                                else
                                {
                                    // Try default Discord avatar if user avatar fails
                                    var discriminator = userData?.discriminator?.ToString() ?? "0";
                                    var defaultAvatarUrl = $"https://cdn.discordapp.com/embed/avatars/{int.Parse(discriminator) % 5}.png";
                                    var defaultResponse = await _httpClient.GetAsync(defaultAvatarUrl);
                                    if (defaultResponse.IsSuccessStatusCode)
                                    {
                                        var defaultImageBytes = await defaultResponse.Content.ReadAsByteArrayAsync();
                                        profilePictureBase64 = Convert.ToBase64String(defaultImageBytes);
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Failed to fetch Discord profile picture");
                            }
                        }
                        
                        var userInfo = new UserInfo
                        {
                            UserId = user._id?.ToString() ?? "",
                            Email = user.email?.ToString() ?? "",
                            IsAuthenticated = true,
                            CreatedAt = user.created_at != null ? DateTime.Parse(user.created_at.ToString()) : DateTime.Now,
                            
                            // Use Discord global_name if available, otherwise username, otherwise email prefix
                            Username = userData?.username?.ToString() ?? user.email?.ToString()?.Split('@')[0] ?? "User",
                            GlobalName = userData?.global_name?.ToString() ?? "",
                            DisplayName = userData?.global_name?.ToString() ?? userData?.username?.ToString() ?? user.email?.ToString()?.Split('@')[0] ?? "User",
                            
                            // Discord data
                            DiscordId = user.discord_id?.ToString() ?? "",
                            
                            // Profile picture as base64
                            Image = profilePictureBase64,
                            
                            // Build Discord avatar URL if avatar hash exists (fallback)
                            AvatarUrl = userData?.avatar != null ? $"https://cdn.discordapp.com/avatars/{user.discord_id}/{userData.avatar}.png?size=256" : null
                        };
                        
                    return userInfo;
                    }
                    
                    return null;
                }
                else
                {
                    _logger.LogWarning($"Failed to fetch user info: {response.StatusCode}");
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user information");
                return null;
            }
        }

        /// <summary>
        /// Sign out the current user
        /// </summary>
        public async Task SignOut()
        {
            try
            {
                _logger.LogInformation("Signing out user...");

                // Clear local authentication data
                _currentUser = new UserInfo { IsAuthenticated = false };
                
                // Update Nova Core
                _novaCore.SetCurrentUser(_currentUser);

                // Clear saved user data
                var userDataPath = Path.Combine(Constants.UserDataPath, "user.json");
                if (File.Exists(userDataPath))
                {
                    File.Delete(userDataPath);
                }

                await RefreshAllData();
                
                _logger.LogInformation("User signed out successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error signing out user");
            }
        }

        /// <summary>
        /// Check for pending authentication for the given state
        /// </summary>
        public async Task<PendingAuthData?> CheckPendingAuthentication(string state)
        {
            // Check local pending authentications first
            if (_pendingAuthentications.TryGetValue(state, out var pendingAuth))
            {
                _pendingAuthentications.Remove(state); // Remove it once retrieved
                return pendingAuth;
            }

            // Check the web backend for pending authentication
            try
            {
                var response = await _httpClient.GetAsync($"{API_BASE_URL}/api/auth/pending/{state}");
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonConvert.DeserializeObject<dynamic>(content);
                    
                    if (result?.success == true && result?.data != null)
                    {
                        return new PendingAuthData
                        {
                            State = state,
                            Token = result.data.token,
                            User = new UserInfo
                            {
                                Username = result.data.user.username,
                                Email = result.data.user.email,
                                IsAuthenticated = true
                            }
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking pending authentication from web backend");
            }

            return null;
        }

        /// <summary>
        /// Process authentication callback data
        /// </summary>
        public async Task ProcessAuthenticationCallback(PendingAuthData authData)
        {
            try
            {
                _logger.LogInformation($"Processing authentication for user: {authData.User.Username}");
                
                // Update current user
                _currentUser = authData.User;
                
                // Complete any pending authentication task
                if (_authenticationTask != null && !_authenticationTask.Task.IsCompleted)
                {
                    _authenticationTask.SetResult(authData.User);
                    _authenticationTask = null;
                }
                
                _logger.LogInformation("Authentication completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing authentication callback");
                throw;
            }
        }

        // Properties for frontend access
        public List<NovaProduct> RunningProducts => _allProducts.Where(p => p.Status == ProductStatus.Running).ToList();
        public List<NovaProduct> InstalledProducts => _allProducts.Where(p => p.IsInstalled && p.Status != ProductStatus.Running).ToList();
        public UserInfo CurrentUser => _currentUser;
        public bool IsRunning => _isRunning;
    }

    /// <summary>
    /// Data structure for pending authentication
    /// </summary>
    public class PendingAuthData
    {
        public string State { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public UserInfo User { get; set; } = new UserInfo();
    }
} 