using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Nova.Shared;
using Nova.Shared.Messages;

namespace Nova.Core
{
    /// <summary>
    /// Main Nova Core API - Central hub for authentication, product management, and communication
    /// Now uses direct communication with the service instead of complex IPC
    /// </summary>
    public class NovaCore : IDisposable
    {
        private static NovaCore _instance;
        private static readonly SemaphoreSlim _instanceLock = new SemaphoreSlim(1, 1);

        // Core managers
        private readonly ProductManager _productManager;
        private readonly SimpleCommunicationManager _communicationManager;
        private readonly bool _isServiceMode;

        // Authentication state
        private UserInfo _currentUser = new UserInfo { IsAuthenticated = false };

        // State
        private bool _isInitialized = false;
        private bool _isRunning = false;
        private DateTime _startTime;
        private readonly SemaphoreSlim _stateLock = new SemaphoreSlim(1, 1);

        /// <summary>
        /// Singleton instance of Nova Core
        /// </summary>
        public static NovaCore Instance
        {
            get
            {
                _instanceLock.Wait();
                try
                {
                    if (_instance == null)
                    {
                        _instance = new NovaCore();
                    }
                    return _instance;
                }
                finally
                {
                    _instanceLock.Release();
                }
            }
        }

        // Public properties
        public ProductManager ProductManager => _productManager;
        public SimpleCommunicationManager CommunicationManager => _communicationManager;
        public UserInfo CurrentUser => _currentUser;
        public bool IsRunning => _isRunning;
        public bool IsInitialized => _isInitialized;
        public DateTime StartTime => _startTime;
        public TimeSpan Uptime => DateTime.Now - _startTime;

        private NovaCore()
        {
            try
            {
                Logger.Initialize("Core", NovaLogLevel.Info);
                Logger.Info("Initializing Nova Core...");

                // Determine if we're running as service or client based on assembly name
                var assemblyName = System.Reflection.Assembly.GetEntryAssembly()?.GetName()?.Name ?? "";
                _isServiceMode = assemblyName.Contains("Service") || assemblyName.Contains("NovaService");

                // Create managers
                _productManager = new ProductManager();
                _communicationManager = new SimpleCommunicationManager(_isServiceMode);

                // Subscribe to events only if we're the service
                if (_isServiceMode)
                {
                    _communicationManager.MessageReceived += OnMessageReceived;
                }

                Logger.Info($"Nova Core managers created successfully (Service mode: {_isServiceMode})");
            }
            catch (Exception ex)
            {
                Logger.Critical("Failed to initialize Nova Core", ex);
                throw;
            }
        }

        /// <summary>
        /// Initialize Nova Core system (for the service)
        /// </summary>
        public async Task<bool> InitializeAsync()
        {
            await _stateLock.WaitAsync();
            try
            {
                if (_isInitialized)
                {
                    Logger.Warning("Nova Core is already initialized");
                    return true;
                }

                if (!_isServiceMode)
                {
                    Logger.Error("InitializeAsync can only be called in service mode");
                    return false;
                }

                Logger.Info("Starting Nova Core initialization...");

                // Ensure required directories exist
                if (!EnsureDirectoriesExist())
                {
                    Logger.Error("Failed to create required directories");
                    return false;
                }

                // Initialize core registry structure
                if (!InitializeRegistryStructure())
                {
                    Logger.Error("Failed to initialize registry structure");
                    return false;
                }

                // Initialize core products
                _productManager.InitializeCoreProducts();

                _isInitialized = true;
                Logger.Info("Nova Core initialization completed successfully");
                return true;
            }
            catch (Exception ex)
            {
                Logger.Critical("Nova Core initialization failed", ex);
                return false;
            }
            finally
            {
                _stateLock.Release();
            }
        }

        /// <summary>
        /// Initialize client connection to Nova Core (for products)
        /// </summary>
        public async Task<bool> InitializeClientAsync(string clientName)
        {
            try
            {
                Logger.Info($"Initializing client: {clientName}");

                if (_isServiceMode)
                {
                    Logger.Warning("InitializeClientAsync called in service mode - ignoring");
                    return true;
                }

                // Register with the core service
                var registerMessage = MessageFactory.CreateProductRegister(
                    clientName,
                    Constants.Version,
                    AppDomain.CurrentDomain.BaseDirectory,
                    System.Diagnostics.Process.GetCurrentProcess().Id
                );

                // Try to send registration
                var response = await _communicationManager.SendMessageAsync("Nova.Service", registerMessage);

                if (response != null && response is NovaResponse novaResponse && novaResponse.Success)
                {
                    Logger.Info($"Client {clientName} registered successfully");
                    return true;
                }
                else
                {
                    Logger.Warning($"Failed to register client {clientName} - service may not be running");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to initialize client: {clientName}");
                return false;
            }
        }

        /// <summary>
        /// Start Nova Core services (for the service)
        /// </summary>
        public async Task<bool> StartAsync()
        {
            await _stateLock.WaitAsync();
            try
            {
                if (!_isServiceMode)
                {
                    Logger.Error("StartAsync can only be called in service mode");
                    return false;
                }

                if (!_isInitialized)
                {
                    Logger.Error("Cannot start Nova Core - not initialized");
                    return false;
                }

                if (_isRunning)
                {
                    Logger.Warning("Nova Core is already running");
                    return true;
                }

                Logger.Info("Starting Nova Core services...");
                _startTime = DateTime.Now;

                // Start communication system
                _communicationManager.Start();

                _isRunning = true;
                Logger.Info("Nova Core started successfully");

                return true;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Failed to start Nova Core", "NovaCore");
                return false;
            }
            finally
            {
                _stateLock.Release();
            }
        }

        /// <summary>
        /// Stop Nova Core services
        /// </summary>
        public async Task<bool> StopAsync()
        {
            await _stateLock.WaitAsync();
            try
            {
                if (!_isRunning)
                {
                    Logger.Warning("Nova Core is not running");
                    return true;
                }

                Logger.Info("Stopping Nova Core services...");

                // Stop communication system
                _communicationManager.Stop();

                _isRunning = false;
                Logger.Info("Nova Core stopped successfully");
                return true;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Failed to stop Nova Core", "NovaCore");
                return false;
            }
            finally
            {
                _stateLock.Release();
            }
        }

        /// <summary>
        /// Authenticate user (sends request to service if running as client)
        /// </summary>
        public async Task<bool> AuthenticateUserAsync(string username, string password)
        {
            try
            {
                Logger.Info($"Authenticating user: {username}");

                if (_isServiceMode)
                {
                    Logger.Error("AuthenticateUserAsync should not be called directly in service mode");
                    return false;
                }

                // Send authentication request to service
                var authMessage = MessageFactory.CreateAuthRequest(username, password);
                var response = await _communicationManager.SendMessageAsync("Nova.Service", authMessage);

                if (response is NovaResponse authResponse && authResponse.Success)
                {
                    var userInfo = authResponse.GetData<UserInfo>("User");
                    if (userInfo != null && userInfo.IsAuthenticated)
                    {
                        _currentUser = userInfo;
                        Logger.Info($"User authenticated successfully: {username}");
                        return true;
                    }
                }

                Logger.Warning($"Authentication failed for user: {username}");
                return false;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Authentication error", "NovaCore");
                return false;
            }
        }

        /// <summary>
        /// Register new user (sends request to service if running as client)
        /// </summary>
        public async Task<bool> RegisterUserAsync(string email, string password, bool hasDiscordConnected = false)
        {
            try
            {
                Logger.Info($"Registering user: {email}");

                if (_isServiceMode)
                {
                    Logger.Error("RegisterUserAsync should not be called directly in service mode");
                    return false;
                }

                // Send registration request to service
                var registerMessage = new NovaMessage(Constants.MessageTypes.Command, "Client", "Nova.Service");
                registerMessage.SetData("Command", "RegisterUser");
                registerMessage.SetData("Email", email);
                registerMessage.SetData("Password", password);
                registerMessage.SetData("HasDiscordConnected", hasDiscordConnected);

                var response = await _communicationManager.SendMessageAsync("Nova.Service", registerMessage);
                if (response is NovaResponse regResponse)
                {
                    if (regResponse.Success)
                    {
                        Logger.Info($"User registration successful: {email}");
                    }
                    return regResponse.Success;
                }

                return false;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Registration error", "NovaCore");
                return false;
            }
        }

        /// <summary>
        /// Sign out current user
        /// </summary>
        public async Task<bool> SignOutAsync()
        {
            try
            {
                if (_currentUser.IsAuthenticated)
                {
                    Logger.Info($"Signing out user: {_currentUser.Username}");
                    _currentUser = new UserInfo { IsAuthenticated = false };
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Sign out error", "NovaCore");
                return false;
            }
        }

        /// <summary>
        /// Set the current authenticated user (for internal use by authentication components)
        /// </summary>
        public void SetCurrentUser(UserInfo userInfo)
        {
            try
            {
                _currentUser = userInfo ?? new UserInfo { IsAuthenticated = false };
                if (_currentUser.IsAuthenticated)
                {
                    Logger.Info($"Current user set: {_currentUser.Username}");
                }
                else
                {
                    Logger.Info("Current user cleared");
                }
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error setting current user", "NovaCore");
            }
        }

        /// <summary>
        /// Register a new product
        /// </summary>
        public bool RegisterProduct(NovaProduct product)
        {
            try
            {
                var result = _productManager.RegisterProduct(product);
                if (result)
                {
                    Logger.Info($"Product registered: {product.Name}");
                }
                return result;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to register product: {product?.Name}", "NovaCore");
                return false;
            }
        }

        /// <summary>
        /// Launch a Nova product
        /// </summary>
        public async Task<bool> LaunchProductAsync(string productName)
        {
            try
            {
                Logger.Info($"Launching product: {productName}");

                var product = _productManager.GetProduct(productName);
                if (product == null)
                {
                    Logger.Warning($"Product not found: {productName}");
                    return false;
                }

                // For now, just update status - you can add actual launching logic later
                _productManager.UpdateProductStatus(productName, ProductStatus.Running);

                Logger.Info($"Product {productName} marked as running");
                return true;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to launch product: {productName}", "NovaCore");
                return false;
            }
        }

        /// <summary>
        /// Get all registered products
        /// </summary>
        public List<NovaProduct> GetAllProducts()
        {
            return _productManager.GetAllProducts();
        }

        /// <summary>
        /// Shutdown Nova Core client
        /// </summary>
        public void Shutdown()
        {
            try
            {
                Logger.Info("Shutting down Nova Core client");
                Dispose();
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error during shutdown");
            }
        }

        /// <summary>
        /// Ensure required directories exist
        /// </summary>
        private bool EnsureDirectoriesExist()
        {
            try
            {
                var directories = new[]
                {
                    Constants.AppDataPath,
                    Constants.LogsPath,
                    Constants.CachePath,
                    Constants.BackupsPath,
                    Constants.UserDataPath
                };

                foreach (var directory in directories)
                {
                    if (!FileSystemHelper.EnsureDirectoryExists(directory))
                        return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Failed to ensure directories exist", "NovaCore");
                return false;
            }
        }

        /// <summary>
        /// Initialize registry structure
        /// </summary>
        private bool InitializeRegistryStructure()
        {
            try
            {
                // Create core registry keys
                if (!RegistryHelper.KeyExists(Constants.CoreRegistryKey))
                {
                    RegistryHelper.WriteString(Constants.CoreRegistryKey, "Version", Constants.Version);
                    RegistryHelper.WriteString(Constants.CoreRegistryKey, "InstallPath", Constants.InstallationPath);
                    RegistryHelper.WriteString(Constants.CoreRegistryKey, "InstallDate", DateTime.Now.ToString("O"));
                }

                // Ensure products registry key exists
                if (!RegistryHelper.KeyExists(Constants.ProductsRegistryKey))
                {
                    RegistryHelper.WriteString(Constants.ProductsRegistryKey, "Created", DateTime.Now.ToString("O"));
                }

                // Ensure settings registry key exists
                if (!RegistryHelper.KeyExists(Constants.SettingsRegistryKey))
                {
                    RegistryHelper.WriteBool(Constants.SettingsRegistryKey, "AutoUpdate", true);
                    RegistryHelper.WriteBool(Constants.SettingsRegistryKey, "StartWithWindows", true);
                }

                return true;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Failed to initialize registry structure", "NovaCore");
                return false;
            }
        }

        /// <summary>
        /// Handle received messages from communication manager (SERVICE MODE ONLY)
        /// </summary>
        private void OnMessageReceived(object sender, NovaMessage message)
        {
            if (!_isServiceMode)
                return;

            try
            {
                Logger.Debug($"Core received message: {message.Type} from {message.SourceProduct}");

                // Update product last used time
                _productManager.UpdateProductLastUsed(message.SourceProduct);

                // Handle specific message types
                switch (message.Type)
                {
                    case Constants.MessageTypes.ProductRegister:
                        HandleProductRegistration(message);
                        break;

                    case Constants.MessageTypes.AuthRequest:
                        Task.Run(async () => await HandleAuthRequest(message));
                        break;

                    case Constants.MessageTypes.GetProducts:
                        Task.Run(async () => await HandleGetProductsRequest(message));
                        break;

                    case Constants.MessageTypes.ProductLaunch:
                        Task.Run(async () => await HandleProductLaunchRequest(message));
                        break;

                    case Constants.MessageTypes.Command:
                        Task.Run(async () => await HandleCommandRequest(message));
                        break;

                    case Constants.MessageTypes.Heartbeat:
                        HandleHeartbeat(message);
                        break;

                    default:
                        Logger.Debug($"Unhandled message type in Core: {message.Type}");
                        break;
                }
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error handling received message in Core", "NovaCore");
            }
        }

        /// <summary>
        /// Handle product registration messages (SERVICE MODE ONLY)
        /// </summary>
        private void HandleProductRegistration(NovaMessage message)
        {
            try
            {
                var productName = message.GetData<string>("ProductName");
                var productId = message.GetData<string>("ProductId");
                var version = message.GetData<string>("Version");
                var installPath = message.GetData<string>("InstallPath");
                var processId = message.GetData<int>("ProcessId");
                var description = message.GetData<string>("Description");

                if (!string.IsNullOrEmpty(productName))
                {
                    var product = new NovaProduct
                    {
                        Id = productId ?? productName.ToLower().Replace(" ", "."),
                        Name = productName,
                        Version = version ?? Constants.Version,
                        InstallPath = installPath ?? "",
                        Status = ProductStatus.Running,
                        IsInstalled = true,
                        ProcessId = processId,
                        LastUsed = DateTime.Now,
                        Description = description ?? "Nova product"
                    };

                    RegisterProduct(product);
                    Logger.Info($"Product registered via IPC: {productName}");
                }
            }
            catch (Exception ex)
            {
                Logger.Warning($"Error handling product registration: {ex.Message}");
            }
        }

        /// <summary>
        /// Handle authentication requests (SERVICE MODE ONLY) 
        /// </summary>
        private async Task HandleAuthRequest(NovaMessage message)
        {
            try
            {
                // In service mode, we would authenticate using the AuthenticationService
                // For now, simulate authentication
                var username = message.GetData<string>("Username");
                var password = message.GetData<string>("Password");

                Logger.Info($"Service handling auth request for: {username}");

                // TODO: Use actual AuthenticationService here
                // For now, just create a mock successful response
                var userInfo = new UserInfo
                {
                    UserId = Guid.NewGuid().ToString(),
                    Username = username,
                    Email = username,
                    IsAuthenticated = true,
                    LoginTime = DateTime.Now,
                    AuthToken = Guid.NewGuid().ToString()
                };

                // NOTE: The response will be sent automatically by SimpleCommunicationManager
                // We just need to update our internal state
                Logger.Info($"Authentication handled for: {username}");
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error handling auth request", "NovaCore");
            }
        }

        /// <summary>
        /// Handle get products requests (SERVICE MODE ONLY)
        /// </summary>
        private async Task HandleGetProductsRequest(NovaMessage message)
        {
            try
            {
                var products = GetAllProducts();
                Logger.Info($"Returning {products.Count} products to {message.SourceProduct}");
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error handling get products request", "NovaCore");
            }
        }

        /// <summary>
        /// Handle product launch requests (SERVICE MODE ONLY)
        /// </summary>
        private async Task HandleProductLaunchRequest(NovaMessage message)
        {
            try
            {
                var productName = message.GetData<string>("ProductName");
                if (!string.IsNullOrEmpty(productName))
                {
                    var success = await LaunchProductAsync(productName);
                    Logger.Info($"Product launch request for {productName}: {success}");
                }
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error handling product launch request", "NovaCore");
            }
        }

        /// <summary>
        /// Handle command requests (SERVICE MODE ONLY)
        /// </summary>
        private async Task HandleCommandRequest(NovaMessage message)
        {
            try
            {
                var command = message.GetData<string>("Command");

                switch (command)
                {
                    case "RegisterUser":
                        var email = message.GetData<string>("Email");
                        var password = message.GetData<string>("Password");
                        var hasDiscord = message.GetData<bool>("HasDiscordConnected");

                        Logger.Info($"Service handling registration request for: {email}");
                        // TODO: Use actual AuthenticationService here
                        break;

                    default:
                        Logger.Warning($"Unknown command: {command}");
                        break;
                }
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error handling command request", "NovaCore");
            }
        }

        /// <summary>
        /// Handle heartbeat messages (SERVICE MODE ONLY)
        /// </summary>
        private void HandleHeartbeat(NovaMessage message)
        {
            try
            {
                Logger.Debug($"Heartbeat from {message.SourceProduct}");
                _productManager.UpdateProductLastUsed(message.SourceProduct);
            }
            catch (Exception ex)
            {
                Logger.Debug($"Error handling heartbeat: {ex.Message}");
            }
        }

        /// <summary>
        /// Dispose Nova Core resources
        /// </summary>
        public void Dispose()
        {
            try
            {
                Logger.Info("Disposing Nova Core...");

                // Stop if running
                if (_isRunning)
                {
                    StopAsync().Wait(5000);
                }

                // Dispose managers
                _communicationManager?.Dispose();
                _productManager?.Dispose();

                _isInitialized = false;
                _isRunning = false;

                Logger.Info("Nova Core disposed successfully");
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error disposing Nova Core", "NovaCore");
            }
        }
    }
}