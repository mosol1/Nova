using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Nova.Hub.Service;

namespace Nova.Hub
{
    /// <summary>
    /// Background worker for Nova Hub service hosting
    /// </summary>
    public class HubWorker : BackgroundService
    {
        private readonly ILogger<HubWorker> _logger;
        private readonly HubService _hubService;

        public HubWorker(ILogger<HubWorker> logger, HubService hubService)
        {
            _logger = logger;
            _hubService = hubService;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                _logger.LogInformation("Nova Hub Worker starting...");

                // The HubService is already started in Program.cs
                // This worker just keeps the service alive and handles background tasks

                while (!stoppingToken.IsCancellationRequested)
                {
                    // Keep the service running
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                    
                    // Periodic health check
                    if (_hubService.IsRunning)
                    {
                        _logger.LogDebug("Nova Hub service health check: OK");
                    }
                    else
                    {
                        _logger.LogWarning("Nova Hub service appears to be stopped");
                    }
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Nova Hub Worker stopping due to cancellation");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Nova Hub Worker encountered an error");
                throw;
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Nova Hub Worker stopping...");
            
            // Stop the hub service
            await _hubService.StopAsync();
            
            await base.StopAsync(cancellationToken);
            
            _logger.LogInformation("Nova Hub Worker stopped");
        }
    }
} 