using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Nova.Product.Template
{
    /// <summary>
    /// Template background worker for Nova products
    /// This handles periodic tasks and background processing
    /// </summary>
    public class ProductWorker : BackgroundService
    {
        private readonly ProductService _productService;
        private readonly ILogger<ProductWorker> _logger;

        public ProductWorker(ProductService productService, ILogger<ProductWorker> logger)
        {
            _productService = productService;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Product Worker starting...");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Perform periodic tasks here
                    await PerformPeriodicTasks();

                    // Wait for the next cycle (adjust interval as needed)
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // Expected when stopping
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in Product Worker cycle");
                    
                    // Wait a bit before retrying on error
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                }
            }

            _logger.LogInformation("Product Worker stopped");
        }

        /// <summary>
        /// Perform periodic background tasks
        /// Override this method in your product implementation
        /// </summary>
        protected virtual async Task PerformPeriodicTasks()
        {
            // TODO: Override this method in your product implementation
            // Examples:
            // - Health checks
            // - Data synchronization
            // - Cleanup operations
            // - Status updates
            
            if (_productService.IsRunning)
            {
                _logger.LogDebug("Performing periodic tasks...");
                
                // Example: Update product status
                // Example: Sync data with Nova Core
                // Example: Perform maintenance tasks
                
                await Task.CompletedTask;
            }
        }

        public override async Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Product Worker is starting");
            await base.StartAsync(cancellationToken);
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Product Worker is stopping");
            await base.StopAsync(cancellationToken);
        }
    }
} 