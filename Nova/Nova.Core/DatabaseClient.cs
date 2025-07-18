using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Nova.Shared;
using Nova.Shared.Messages;

namespace Nova.Core
{
    /// <summary>
    /// Database client that communicates with your Rust backend
    /// Uses the same encryption and protocol as your existing Elite Optimizer system
    /// </summary>
    public class DatabaseClient : IDisposable
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;
        private readonly string _xorKey;

        public DatabaseClient(string baseUrl = "http://127.0.0.1:7720")
        {
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(30);
            _baseUrl = baseUrl;
            _xorKey = GetXorKey();

            Logger.Info($"Database client initialized for {_baseUrl}", "DatabaseClient");
        }

        /// <summary>
        /// Test connection to database backend
        /// </summary>
        public async Task<bool> TestConnectionAsync()
        {
            try
            {
                var testRequest = new DatabaseRequest
                {
                    Operation = "find_one",
                    Collection = "test",
                    Filter = new Dictionary<string, object> { ["test"] = "ping" }
                };

                var result = await ExecuteAsync<object>(testRequest);
                Logger.Info("Database connection test successful", "DatabaseClient");
                return true;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Database connection test failed", "DatabaseClient");
                return false;
            }
        }

        /// <summary>
        /// Execute a database operation (matches your Rust backend exactly)
        /// </summary>
        public async Task<T> ExecuteAsync<T>(DatabaseRequest request)
        {
            try
            {
                Logger.Debug($"Executing database operation: {request.Operation} on {request.Collection}", "DatabaseClient");

                // Create the command object that matches your Rust backend exactly
                var command = new
                {
                    operation = request.Operation,
                    database = request.Collection,
                    @params = request.Data.Count > 0 ? request.Data : request.Filter
                };

                // Serialize and encrypt the command
                var commandJson = JsonConvert.SerializeObject(command);
                var encryptedCommand = XorEncrypt(commandJson, _xorKey);

                // Create the payload that matches your Rust backend
                var payload = new
                {
                    payload = encryptedCommand
                };

                // Send request
                var payloadJson = JsonConvert.SerializeObject(payload);
                var content = new StringContent(payloadJson, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_baseUrl}/execute", content);

                if (!response.IsSuccessStatusCode)
                {
                    Logger.Error($"HTTP error: {response.StatusCode}", "DatabaseClient");
                    return default(T);
                }

                var responseJson = await response.Content.ReadAsStringAsync();
                var responseObj = JsonConvert.DeserializeObject<DatabaseResponse>(responseJson);

                if (responseObj?.Response == null)
                {
                    Logger.Warning("Empty response from database backend", "DatabaseClient");
                    return default(T);
                }

                // Decrypt the response
                var decryptedResponse = XorDecrypt(responseObj.Response, _xorKey);

                Logger.Debug($"Database operation successful: {request.Operation}", "DatabaseClient");

                // Try to deserialize as the requested type
                if (typeof(T) == typeof(string))
                {
                    return (T)(object)decryptedResponse;
                }

                if (string.IsNullOrEmpty(decryptedResponse) || decryptedResponse == "{}")
                {
                    return default(T);
                }

                return JsonConvert.DeserializeObject<T>(decryptedResponse);
            }
            catch (HttpRequestException ex)
            {
                Logger.Error(ex, "Network error during database operation", "DatabaseClient");
                return default(T);
            }
            catch (TaskCanceledException ex)
            {
                Logger.Error(ex, "Database operation timeout", "DatabaseClient");
                return default(T);
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Database operation failed", "DatabaseClient");
                return default(T);
            }
        }

        /// <summary>
        /// Authenticate user
        /// </summary>
        public async Task<UserInfo> AuthenticateUserAsync(string username, string password)
        {
            try
            {
                Logger.Info($"Authenticating user: {username}", "DatabaseClient");

                var request = new DatabaseRequest
                {
                    Operation = "find_one",
                    Collection = "users",
                    Filter = new Dictionary<string, object>
                    {
                        ["username"] = username,
                        ["password"] = HashPassword(password)
                    }
                };

                var result = await ExecuteAsync<Dictionary<string, object>>(request);

                if (result != null && result.Count > 0)
                {
                    Logger.Info($"User authentication successful: {username}", "DatabaseClient");

                    return new UserInfo
                    {
                        UserId = result.GetValueOrDefault("_id")?.ToString(),
                        Username = result.GetValueOrDefault("username")?.ToString(),
                        Email = result.GetValueOrDefault("email")?.ToString(),
                        IsAuthenticated = true,
                        LoginTime = DateTime.Now,
                        AuthToken = GenerateAuthToken()
                    };
                }

                Logger.Warning($"User authentication failed: {username}", "DatabaseClient");
                return new UserInfo { IsAuthenticated = false };
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Authentication error for user: {username}", "DatabaseClient");
                return new UserInfo { IsAuthenticated = false };
            }
        }

        /// <summary>
        /// Register new user
        /// </summary>
        public async Task<bool> RegisterUserAsync(string username, string email, string password)
        {
            try
            {
                Logger.Info($"Registering new user: {username}", "DatabaseClient");

                var request = new DatabaseRequest
                {
                    Operation = "insert_one",
                    Collection = "users",
                    Data = new Dictionary<string, object>
                    {
                        ["username"] = username,
                        ["email"] = email,
                        ["password"] = HashPassword(password),
                        ["created_at"] = DateTime.UtcNow,
                        ["is_active"] = true,
                        ["registration_ip"] = await GetPublicIpAsync()
                    }
                };

                var result = await ExecuteAsync<Dictionary<string, object>>(request);

                if (result != null)
                {
                    Logger.Info($"User registration successful: {username}", "DatabaseClient");
                    return true;
                }

                Logger.Warning($"User registration failed: {username}", "DatabaseClient");
                return false;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Registration error for user: {username}", "DatabaseClient");
                return false;
            }
        }

        /// <summary>
        /// Update user last login
        /// </summary>
        public async Task<bool> UpdateUserLoginAsync(string userId)
        {
            try
            {
                var request = new DatabaseRequest
                {
                    Operation = "update_one",
                    Collection = "users",
                    Filter = new Dictionary<string, object> { ["_id"] = userId },
                    Data = new Dictionary<string, object>
                    {
                        ["$set"] = new Dictionary<string, object>
                        {
                            ["last_login"] = DateTime.UtcNow,
                            ["last_login_ip"] = await GetPublicIpAsync()
                        }
                    }
                };

                var result = await ExecuteAsync<Dictionary<string, object>>(request);
                return result != null;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Failed to update user login", "DatabaseClient");
                return false;
            }
        }

        /// <summary>
        /// Get XOR key (matches your Rust implementation exactly)
        /// </summary>
        private string GetXorKey()
        {
            try
            {
                // This MUST match your Rust implementation exactly
                var decoded = Convert.FromBase64String("QzovUHJvZ3JhbSBGaWxlcyAoeDg2KS9FbGl0ZU9wdGltaXplcg==");
                return Encoding.UTF8.GetString(decoded);
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Failed to decode XOR key", "DatabaseClient");
                throw;
            }
        }

        /// <summary>
        /// XOR encryption (matches your Rust implementation exactly)
        /// </summary>
        private string XorEncrypt(string text, string key)
        {
            try
            {
                var textBytes = Encoding.UTF8.GetBytes(text);
                var keyBytes = Encoding.UTF8.GetBytes(key);
                var encryptedBytes = new byte[textBytes.Length];

                for (int i = 0; i < textBytes.Length; i++)
                {
                    encryptedBytes[i] = (byte)(textBytes[i] ^ keyBytes[i % keyBytes.Length]);
                }

                return BitConverter.ToString(encryptedBytes).Replace("-", "").ToLower();
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "XOR encryption failed", "DatabaseClient");
                throw;
            }
        }

        /// <summary>
        /// XOR decryption (matches your Rust implementation exactly)
        /// </summary>
        private string XorDecrypt(string hexText, string key)
        {
            try
            {
                var bytes = new byte[hexText.Length / 2];
                for (int i = 0; i < bytes.Length; i++)
                {
                    bytes[i] = Convert.ToByte(hexText.Substring(i * 2, 2), 16);
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
                Logger.Error(ex, "XOR decryption failed", "DatabaseClient");
                throw;
            }
        }

        /// <summary>
        /// Hash password (use a strong hashing algorithm)
        /// </summary>
        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password + "nova_salt_2024"));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        /// <summary>
        /// Generate authentication token
        /// </summary>
        private string GenerateAuthToken()
        {
            var tokenBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(tokenBytes);
            }
            return Convert.ToBase64String(tokenBytes);
        }

        /// <summary>
        /// Get public IP for logging
        /// </summary>
        private async Task<string> GetPublicIpAsync()
        {
            try
            {
                var response = await _httpClient.GetStringAsync("https://api.ipify.org");
                return response.Trim();
            }
            catch
            {
                return "unknown";
            }
        }

        public void Dispose()
        {
            try
            {
                _httpClient?.Dispose();
                Logger.Info("Database client disposed", "DatabaseClient");
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error disposing database client", "DatabaseClient");
            }
        }
    }

    /// <summary>
    /// Response from database (matches your Rust backend exactly)
    /// </summary>
    public class DatabaseResponse
    {
        [JsonProperty("response")]
        public string Response { get; set; }
    }
}