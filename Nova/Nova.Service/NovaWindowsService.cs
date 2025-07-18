using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ServiceProcess;
using System.Threading;
using System.Threading.Tasks;
using Nova.Core;
using Nova.Shared;
using Nova.Shared.Messages;

namespace Nova.Service
{
    public partial class NovaWindowsService : ServiceBase
    {
        // Core managers
        private NovaCore _novaCore;
        private AuthenticationService _authService;
        private CancellationTokenSource _cancellationTokenSource;
        private Task _serviceTask;
        private IContainer components = null;

        public NovaWindowsService()
        {
            InitializeComponent();
        }

        /// <summary>
        /// Clean up resources and stop the service.
        /// </summary>
        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                StopService();

                if (components != null)
                {
                    components.Dispose();
                }
            }
            base.Dispose(disposing);
        }

        /// <summary>
        /// Designer support
        /// </summary>
        private void InitializeComponent()
        {
            components = new System.ComponentModel.Container();
            this.ServiceName = Constants.ServiceName;
        }

        protected override void OnStart(string[] args)
        {
            try
            {
                Logger.Info("Nova Service starting...", "NovaWindowsService");
                StartService();
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error starting Nova Service", "NovaWindowsService");
                throw;
            }
        }

        protected override void OnStop()
        {
            try
            {
                Logger.Info("Nova Service stopping...", "NovaWindowsService");
                StopService();
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error stopping Nova Service", "NovaWindowsService");
            }
        }

        public void StartService()
        {
            try
            {
                _cancellationTokenSource = new CancellationTokenSource();
                _novaCore = NovaCore.Instance;
                _authService = new AuthenticationService();

                _serviceTask = Task.Run(async () =>
                {
                    try
                    {
                        Logger.Info("Initializing Nova Core...", "NovaWindowsService");

                        // Initialize Nova Core
                        if (!await _novaCore.InitializeAsync())
                        {
                            Logger.Error("Failed to initialize Nova Core", "NovaWindowsService");
                            return;
                        }

                        // Subscribe to messages to handle authentication
                        _novaCore.CommunicationManager.MessageReceived += OnMessageReceived;

                        // Start Nova Core
                        if (!await _novaCore.StartAsync())
                        {
                            Logger.Error("Failed to start Nova Core", "NovaWindowsService");
                            return;
                        }

                        Logger.Info("Nova Service started successfully", "NovaWindowsService");

                        // Main service loop - handle authentication and maintain connections
                        while (!_cancellationTokenSource.Token.IsCancellationRequested)
                        {
                            try
                            {
                                // Periodic health checks and cleanup
                                await PerformPeriodicTasks();

                                // Wait for 30 seconds before next iteration
                                await Task.Delay(30000, _cancellationTokenSource.Token);
                            }
                            catch (OperationCanceledException)
                            {
                                break;
                            }
                            catch (Exception ex)
                            {
                                Logger.Warning($"Error in service main loop: {ex.Message}", "NovaWindowsService");
                                await Task.Delay(5000, _cancellationTokenSource.Token);
                            }
                        }
                    }
                    catch (OperationCanceledException)
                    {
                        Logger.Info("Nova Service operation cancelled", "NovaWindowsService");
                    }
                    catch (Exception ex)
                    {
                        Logger.Error(ex, "Error in Nova Service main loop", "NovaWindowsService");
                    }
                    finally
                    {
                        try
                        {
                            await _novaCore.StopAsync();
                            Logger.Info("Nova Service stopped", "NovaWindowsService");
                        }
                        catch (Exception ex)
                        {
                            Logger.Error(ex, "Error stopping Nova Core", "NovaWindowsService");
                        }
                    }
                }, _cancellationTokenSource.Token);
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error starting Nova Service", "NovaWindowsService");
                throw;
            }
        }

        public void StopService()
        {
            try
            {
                _cancellationTokenSource?.Cancel();

                if (_serviceTask != null)
                {
                    if (!_serviceTask.Wait(TimeSpan.FromSeconds(10)))
                    {
                        Logger.Warning("Service task did not stop within timeout", "NovaWindowsService");
                    }
                }

                _authService?.Dispose();
                _cancellationTokenSource?.Dispose();
                _cancellationTokenSource = null;
                _serviceTask = null;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error stopping Nova Service", "NovaWindowsService");
            }
        }

        /// <summary>
        /// Handle messages from products - integrate authentication
        /// </summary>
        private async void OnMessageReceived(object sender, NovaMessage message)
        {
            try
            {
                Logger.Debug($"Service received message: {message.Type} from {message.SourceProduct}", "NovaWindowsService");

                // Handle authentication-specific messages
                switch (message.Type)
                {
                    case Constants.MessageTypes.AuthRequest:
                        await HandleAuthenticationRequest(message);
                        break;

                    case Constants.MessageTypes.Command:
                        await HandleCommandMessage(message);
                        break;

                    default:
                        // Let NovaCore handle other message types
                        Logger.Debug($"Forwarding message to NovaCore: {message.Type}", "NovaWindowsService");
                        break;
                }
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error handling message in service", "NovaWindowsService");
            }
        }

        /// <summary>
        /// Handle authentication requests using your authentication service
        /// </summary>
        private async Task HandleAuthenticationRequest(NovaMessage message)
        {
            try
            {
                var username = message.GetData<string>("Username");
                var password = message.GetData<string>("Password");

                Logger.Info($"Processing authentication request for: {username}", "NovaWindowsService");

                if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
                {
                    Logger.Warning("Authentication request missing username or password", "NovaWindowsService");
                    return;
                }

                // Use your authentication service
                var userInfo = await _authService.LoginAsync(username, password);

                if (userInfo.IsAuthenticated)
                {
                    Logger.Info($"Authentication successful for: {username}", "NovaWindowsService");

                    // Send success response back
                    var response = MessageFactory.CreateAuthResponse(true, userInfo);
                    // Response will be sent automatically by SimpleCommunicationManager
                }
                else
                {
                    Logger.Warning($"Authentication failed for: {username}", "NovaWindowsService");

                    // Send failure response back
                    var response = MessageFactory.CreateAuthResponse(false, null, "Invalid credentials");
                    // Response will be sent automatically by SimpleCommunicationManager
                }
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error processing authentication request", "NovaWindowsService");
            }
        }

        /// <summary>
        /// Handle command messages including registration
        /// </summary>
        private async Task HandleCommandMessage(NovaMessage message)
        {
            try
            {
                var command = message.GetData<string>("Command");

                switch (command)
                {
                    case "RegisterUser":
                        await HandleUserRegistration(message);
                        break;

                    case "DiscordAuth":
                        await HandleDiscordAuth(message);
                        break;

                    case "DiscordLogin":
                        await HandleDiscordLogin(message);
                        break;

                    default:
                        Logger.Debug($"Unknown command: {command}", "NovaWindowsService");
                        break;
                }
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error handling command message", "NovaWindowsService");
            }
        }

        /// <summary>
        /// Handle user registration exactly like your Elite Optimizer
        /// </summary>
        private async Task HandleUserRegistration(NovaMessage message)
        {
            try
            {
                var email = message.GetData<string>("Email");
                var password = message.GetData<string>("Password");
                var hasDiscordConnected = message.GetData<bool>("HasDiscordConnected");

                Logger.Info($"Processing registration request for: {email}", "NovaWindowsService");

                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
                {
                    Logger.Warning("Registration request missing email or password", "NovaWindowsService");
                    return;
                }

                // Check if user already exists
                if (_authService.IsUserRegistered())
                {
                    Logger.Warning($"User already registered: {email}", "NovaWindowsService");
                    return;
                }

                // For now, simulate Discord data if not provided
                var discordData = new Dictionary<string, object>
                {
                    ["id"] = "123456789012345678",
                    ["username"] = email.Split('@')[0],
                    ["global_name"] = email.Split('@')[0],
                    ["email"] = email,
                    ["verified"] = true
                };

                // Register user
                var success = await _authService.RegisterAsync(email, password, discordData["id"].ToString(), discordData);

                if (success)
                {
                    Logger.Info($"User registration successful: {email}", "NovaWindowsService");
                }
                else
                {
                    Logger.Warning($"User registration failed: {email}", "NovaWindowsService");
                }
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error processing user registration", "NovaWindowsService");
            }
        }

        /// <summary>
        /// Handle Discord authentication
        /// </summary>
        private async Task HandleDiscordAuth(NovaMessage message)
        {
            try
            {
                Logger.Info("Processing Discord authentication request", "NovaWindowsService");

                var discordData = await _authService.AuthDiscordAsync();

                if (discordData != null)
                {
                    Logger.Info("Discord authentication successful", "NovaWindowsService");
                    // Discord data will be used in registration/login flow
                }
                else
                {
                    Logger.Warning("Discord authentication failed", "NovaWindowsService");
                }
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error processing Discord authentication", "NovaWindowsService");
            }
        }

        /// <summary>
        /// Handle Discord login
        /// </summary>
        private async Task HandleDiscordLogin(NovaMessage message)
        {
            try
            {
                Logger.Info("Processing Discord login request", "NovaWindowsService");

                var userInfo = await _authService.LoginDiscordAsync();

                if (userInfo.IsAuthenticated)
                {
                    Logger.Info($"Discord login successful: {userInfo.Username}", "NovaWindowsService");
                }
                else
                {
                    Logger.Warning("Discord login failed", "NovaWindowsService");
                }
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error processing Discord login", "NovaWindowsService");
            }
        }

        /// <summary>
        /// Perform periodic maintenance tasks
        /// </summary>
        private async Task PerformPeriodicTasks()
        {
            try
            {
                // Clean up inactive products
                CleanupInactiveProducts();

                // Log service health
                await LogServiceHealth();

                Logger.Debug("Periodic tasks completed", "NovaWindowsService");
            }
            catch (Exception ex)
            {
                Logger.Debug($"Error in periodic tasks: {ex.Message}", "NovaWindowsService");
            }
        }

        /// <summary>
        /// Clean up products that haven't been used recently
        /// </summary>
        private void CleanupInactiveProducts()
        {
            try
            {
                var products = _novaCore.GetAllProducts();
                var cutoffTime = DateTime.Now.AddMinutes(-30); // 30 minutes inactivity

                foreach (var product in products)
                {
                    if (product.LastUsed < cutoffTime &&
                        product.Status == ProductStatus.Running &&
                        product.Name != Constants.Products.Core &&
                        product.Name != Constants.Products.Service)
                    {
                        Logger.Info($"Marking inactive product as stopped: {product.Name}", "NovaWindowsService");
                        _novaCore.ProductManager.UpdateProductStatus(product.Name, ProductStatus.Stopped);
                    }
                }
            }
            catch (Exception ex)
            {
                Logger.Debug($"Error cleaning up inactive products: {ex.Message}", "NovaWindowsService");
            }
        }

        /// <summary>
        /// Log service health
        /// </summary>
        private async Task LogServiceHealth()
        {
            try
            {
                var runningProducts = _novaCore.GetAllProducts().FindAll(p => p.Status == ProductStatus.Running);
                Logger.Debug($"Service health check - Uptime: {_novaCore.Uptime.TotalMinutes:F1} minutes, Running Products: {runningProducts.Count}", "NovaWindowsService");
            }
            catch (Exception ex)
            {
                Logger.Debug($"Error logging service health: {ex.Message}", "NovaWindowsService");
            }
        }
    }
}