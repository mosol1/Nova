using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Nova.Shared;
using Nova.Shared.Messages;

namespace Nova.Service
{
    /// <summary>
    /// Authentication service that exactly matches your Elite Optimizer implementation
    /// Handles Discord OAuth, registration, and login without HTTP endpoints
    /// </summary>
    public class AuthenticationService : IDisposable
    {
        private readonly string _userDataPath;
        private readonly string _credentialsPath;
        private readonly EncryptionService _encryption;
        private readonly DiscordBotService _discordBot;
        private readonly CallbackServerService _callbackServer;
        private readonly HttpClient _httpClient;

        // Constants from your Elite Optimizer
        private const string DiscordClientId = "YOUR_DISCORD_CLIENT_ID";
        private const string RedirectUri = "http://localhost:8080/callback";
        private const string VerifiedRoleId = "YOUR_VERIFIED_ROLE_ID";
        private const string GuildId = "YOUR_GUILD_ID";
        private const string EncryptionKey = "C:/Program Files (x86)/EliteOptimizer";

        public AuthenticationService()
        {
            _userDataPath = Path.Combine(Constants.UserDataPath, "user_data.json");
            _credentialsPath = Path.Combine(Constants.UserDataPath, "credentials.json");
            _encryption = new EncryptionService();
            _discordBot = new DiscordBotService();
            _callbackServer = new CallbackServerService();
            _httpClient = new HttpClient();

            // Ensure user data directory exists
            FileSystemHelper.EnsureDirectoryExists(Constants.UserDataPath);

            Logger.Info("Authentication service initialized", "AuthenticationService");
        }

        /// <summary>
        /// Discord OAuth - exactly like Elite Optimizer
        /// </summary>
        public async Task<Dictionary<string, object>> AuthDiscordAsync()
        {
            try
            {
                Logger.Info("Starting Discord authentication...", "AuthenticationService");

                // Start callback server and wait for auth
                var authTask = _callbackServer.StartCallbackServerAndWaitForAuth();

                // Generate auth URL and open browser
                var authUrl = $"https://discord.com/api/oauth2/authorize?client_id={DiscordClientId}&redirect_uri={RedirectUri}&response_type=code&scope=identify guilds.join";

                Logger.Info($"Generated auth URL: {authUrl}", "AuthenticationService");

                // Open browser
                Process.Start(new ProcessStartInfo
                {
                    FileName = authUrl,
                    UseShellExecute = true
                });

                Logger.Info("Auth URL opened in browser", "AuthenticationService");

                // Wait for authentication to complete
                var userData = await authTask;

                if (userData != null)
                {
                    Logger.Info("User data fetched successfully", "AuthenticationService");
                    return userData;
                }
                else
                {
                    Logger.Info("Failed to fetch user data", "AuthenticationService");
                    return null;
                }
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Discord authentication failed", "AuthenticationService");
                return null;
            }
        }

        /// <summary>
        /// Register user - exactly like Elite Optimizer
        /// </summary>
        public async Task<bool> RegisterAsync(string email, string password, string discordId, Dictionary<string, object> userData)
        {
            try
            {
                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
                {
                    return false;
                }

                email = email.ToLower();

                // Check if user exists
                if (File.Exists(_credentialsPath))
                {
                    return false; // User already exists
                }

                // Create user data exactly like Elite Optimizer
                userData["elite_email"] = email;

                var userFileData = new
                {
                    user_data = userData
                };

                var credentials = new
                {
                    email = email,
                    password = password,
                    discord_id = discordId,
                    status = "Free",
                    tweak_ratings = new object[0],
                    launch_history = new object[0]
                };

                // Save user data locally (exactly like Elite Optimizer)
                SaveUserDataLocally(userFileData);
                SaveCredentialsLocally(credentials);

                // Assign verified role
                if (ulong.TryParse(discordId, out var userId))
                {
                    await _discordBot.AssignRoleAsync(userId, ulong.Parse(VerifiedRoleId), ulong.Parse(GuildId));
                }

                Logger.Info($"User registered successfully: {email}", "AuthenticationService");
                return true;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Registration failed", "AuthenticationService");
                return false;
            }
        }

        /// <summary>
        /// Login with email/password - exactly like Elite Optimizer
        /// </summary>
        public async Task<UserInfo> LoginAsync(string email, string password)
        {
            try
            {
                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
                {
                    return new UserInfo { IsAuthenticated = false };
                }

                email = email.ToLower();

                // Check if credentials file exists
                if (!File.Exists(_credentialsPath))
                {
                    Logger.Warning("No user found", "AuthenticationService");
                    return new UserInfo { IsAuthenticated = false };
                }

                // Load credentials
                var credJson = File.ReadAllText(_credentialsPath);
                var credentials = JsonConvert.DeserializeObject<Dictionary<string, object>>(credJson);

                if (credentials["email"].ToString() != email || credentials["password"].ToString() != password)
                {
                    Logger.Warning("Invalid password", "AuthenticationService");
                    return new UserInfo { IsAuthenticated = false };
                }

                // Load user data
                var userData = await LoadUserDataAsync();
                if (userData != null)
                {
                    // Handle global_name encoding exactly like Elite Optimizer
                    if (userData.ContainsKey("global_name") && userData["global_name"] != null)
                    {
                        try
                        {
                            string globalName = userData["global_name"].ToString();
                            // EXACT Elite Optimizer double encoding
                            var bytes1 = System.Text.Encoding.GetEncoding("iso-8859-1").GetBytes(globalName);
                            var stage1 = System.Text.Encoding.UTF8.GetString(bytes1);
                            var bytes2 = System.Text.Encoding.GetEncoding("iso-8859-1").GetBytes(stage1);
                            userData["global_name"] = System.Text.Encoding.UTF8.GetString(bytes2);
                        }
                        catch (Exception)
                        {
                            Logger.Info("Decoding failed", "AuthenticationService");
                        }
                    }
                }

                Logger.Info($"User login successful: {email}", "AuthenticationService");

                return new UserInfo
                {
                    UserId = credentials.GetValueOrDefault("discord_id")?.ToString() ?? Guid.NewGuid().ToString(),
                    Username = userData?.GetValueOrDefault("username")?.ToString() ??
                              userData?.GetValueOrDefault("global_name")?.ToString() ??
                              email.Split('@')[0],
                    Email = email,
                    IsAuthenticated = true,
                    LoginTime = DateTime.Now,
                    AuthToken = GenerateAuthToken(),
                    Profile = userData ?? new Dictionary<string, object>()
                };
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Login failed", "AuthenticationService");
                return new UserInfo { IsAuthenticated = false };
            }
        }

        /// <summary>
        /// Login with Discord - exactly like Elite Optimizer
        /// </summary>
        public async Task<UserInfo> LoginDiscordAsync()
        {
            try
            {
                // Start callback server and wait for auth
                var authTask = _callbackServer.StartCallbackServerAndWaitForAuth();

                // Generate auth URL and open browser
                var authUrl = $"https://discord.com/api/oauth2/authorize?client_id={DiscordClientId}&redirect_uri={RedirectUri}&response_type=code&scope=identify guilds.join";

                // Open browser
                Process.Start(new ProcessStartInfo
                {
                    FileName = authUrl,
                    UseShellExecute = true
                });

                // Wait for authentication to complete
                var userData = await authTask;

                if (userData == null)
                {
                    return new UserInfo { IsAuthenticated = false };
                }

                var discordId = userData.GetValueOrDefault("id")?.ToString();
                if (string.IsNullOrEmpty(discordId))
                {
                    return new UserInfo { IsAuthenticated = false };
                }

                // Check if user exists with this Discord ID
                if (!File.Exists(_credentialsPath))
                {
                    return new UserInfo { IsAuthenticated = false };
                }

                var credJson = File.ReadAllText(_credentialsPath);
                var credentials = JsonConvert.DeserializeObject<Dictionary<string, object>>(credJson);

                if (credentials.GetValueOrDefault("discord_id")?.ToString() != discordId)
                {
                    return new UserInfo { IsAuthenticated = false };
                }

                // Handle encoding similar to Elite Optimizer
                if (userData.ContainsKey("global_name") && userData["global_name"] != null)
                {
                    try
                    {
                        string globalName = userData["global_name"].ToString();
                        // EXACT Elite Optimizer double encoding
                        var bytes1 = System.Text.Encoding.GetEncoding("iso-8859-1").GetBytes(globalName);
                        var stage1 = System.Text.Encoding.UTF8.GetString(bytes1);
                        var bytes2 = System.Text.Encoding.GetEncoding("iso-8859-1").GetBytes(stage1);
                        userData["global_name"] = System.Text.Encoding.UTF8.GetString(bytes2);
                    }
                    catch (Exception)
                    {
                        Logger.Info("Decoding failed for global_name", "AuthenticationService");
                    }
                }

                var email = credentials.GetValueOrDefault("email")?.ToString();
                if (!string.IsNullOrEmpty(email))
                {
                    SaveUserDataLocally(new { user_data = userData });

                    return new UserInfo
                    {
                        UserId = discordId,
                        Username = userData.GetValueOrDefault("username")?.ToString() ??
                                  userData.GetValueOrDefault("global_name")?.ToString(),
                        Email = email,
                        IsAuthenticated = true,
                        LoginTime = DateTime.Now,
                        AuthToken = GenerateAuthToken(),
                        Profile = userData
                    };
                }

                return new UserInfo { IsAuthenticated = false };
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Discord login failed", "AuthenticationService");
                return new UserInfo { IsAuthenticated = false };
            }
        }

        /// <summary>
        /// Check if user is registered
        /// </summary>
        public bool IsUserRegistered()
        {
            return File.Exists(_userDataPath) && File.Exists(_credentialsPath);
        }

        /// <summary>
        /// Clear user data (sign out permanently)
        /// </summary>
        public async Task<bool> ClearUserDataAsync()
        {
            try
            {
                if (File.Exists(_userDataPath))
                {
                    File.Delete(_userDataPath);
                }
                if (File.Exists(_credentialsPath))
                {
                    File.Delete(_credentialsPath);
                }
                Logger.Info("User data cleared", "AuthenticationService");
                return true;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Failed to clear user data", "AuthenticationService");
                return false;
            }
        }

        /// <summary>
        /// Save user data locally exactly like Elite Optimizer
        /// </summary>
        private void SaveUserDataLocally(object userData)
        {
            try
            {
                // Ensure directory exists
                Directory.CreateDirectory(Path.GetDirectoryName(_userDataPath));

                var json = JsonConvert.SerializeObject(userData, Formatting.Indented);

                // CRITICAL: Save as UTF-8 without BOM (like Elite Optimizer)
                var utf8WithoutBom = new UTF8Encoding(false);
                File.WriteAllText(_userDataPath, json, utf8WithoutBom);
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Failed to save user data locally", "AuthenticationService");
            }
        }

        /// <summary>
        /// Save credentials locally
        /// </summary>
        private void SaveCredentialsLocally(object credentials)
        {
            try
            {
                var json = JsonConvert.SerializeObject(credentials, Formatting.Indented);
                var utf8WithoutBom = new UTF8Encoding(false);
                File.WriteAllText(_credentialsPath, json, utf8WithoutBom);
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Failed to save credentials locally", "AuthenticationService");
            }
        }

        /// <summary>
        /// Load user data from file
        /// </summary>
        private async Task<Dictionary<string, object>> LoadUserDataAsync()
        {
            try
            {
                if (!File.Exists(_userDataPath))
                    return null;

                var json = File.ReadAllText(_userDataPath, Encoding.UTF8);
                var data = JsonConvert.DeserializeObject<Dictionary<string, object>>(json);
                return data.GetValueOrDefault("user_data") as Dictionary<string, object>;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Failed to load user data", "AuthenticationService");
                return null;
            }
        }

        /// <summary>
        /// Generate authentication token
        /// </summary>
        private string GenerateAuthToken()
        {
            var tokenBytes = new byte[32];
            using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
            {
                rng.GetBytes(tokenBytes);
            }
            return Convert.ToBase64String(tokenBytes);
        }

        public void Dispose()
        {
            try
            {
                _httpClient?.Dispose();
                _discordBot?.Dispose();
                _callbackServer?.Dispose();
                Logger.Info("Authentication service disposed", "AuthenticationService");
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error disposing authentication service", "AuthenticationService");
            }
        }
    }

    /// <summary>
    /// Encryption service exactly like Elite Optimizer
    /// </summary>
    public class EncryptionService
    {
        private readonly string _encryptionKey;

        public EncryptionService()
        {
            _encryptionKey = "YOUR_ENCRYPTION_KEY"; // Set this to your actual key
        }

        public string DecryptHex(string encryptedPayload, string key)
        {
            try
            {
                var bytes = new byte[encryptedPayload.Length / 2];
                for (int i = 0; i < bytes.Length; i++)
                {
                    bytes[i] = Convert.ToByte(encryptedPayload.Substring(i * 2, 2), 16);
                }

                var keyBytes = Encoding.UTF8.GetBytes(key);
                var decryptedBytes = new byte[bytes.Length];

                for (int i = 0; i < bytes.Length; i++)
                {
                    decryptedBytes[i] = (byte)(bytes[i] ^ keyBytes[i % keyBytes.Length]);
                }

                return Encoding.UTF8.GetString(decryptedBytes);
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Decryption failed", "EncryptionService");
                throw;
            }
        }
    }

    /// <summary>
    /// Mock Discord bot service (implement your actual Discord bot logic)
    /// </summary>
    public class DiscordBotService : IDisposable
    {
        public async Task AssignRoleAsync(ulong userId, ulong roleId, ulong guildId)
        {
            try
            {
                // TODO: Implement actual Discord bot role assignment
                Logger.Info($"Assigned role {roleId} to user {userId} in guild {guildId}", "DiscordBotService");
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Failed to assign Discord role", "DiscordBotService");
            }
        }

        public void Dispose()
        {
            // Dispose Discord bot resources
        }
    }

    /// <summary>
    /// Mock callback server service (implement your actual OAuth callback server)
    /// </summary>
    public class CallbackServerService : IDisposable
    {
        public async Task<Dictionary<string, object>> StartCallbackServerAndWaitForAuth()
        {
            try
            {
                // TODO: Implement actual OAuth callback server
                // For now, return mock Discord user data
                await Task.Delay(2000); // Simulate OAuth flow

                return new Dictionary<string, object>
                {
                    ["id"] = "123456789012345678",
                    ["username"] = "NovaUser",
                    ["global_name"] = "Nova User",
                    ["discriminator"] = "0001",
                    ["avatar"] = "avatar_hash",
                    ["email"] = "user@discord.com",
                    ["verified"] = true
                };
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "OAuth callback failed", "CallbackServerService");
                return null;
            }
        }

        public void Dispose()
        {
            // Dispose callback server resources
        }
    }
}