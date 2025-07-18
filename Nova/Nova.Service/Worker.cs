using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Nova.Core;
using System.Threading;
using System.Threading.Tasks;

namespace Nova.Service
{
    public class Worker : BackgroundService
    {
        private readonly ILogger<Worker> _logger;
        private readonly NovaCore _novaCore;

        public Worker(ILogger<Worker> logger)
        {
            _logger = logger;
            _novaCore = NovaCore.Instance;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Initialize Nova Core
            if (!await _novaCore.InitializeAsync())
            {
                _logger.LogError("Failed to initialize Nova Core");
                return;
            }

            // Start Nova Core
            if (!await _novaCore.StartAsync())
            {
                _logger.LogError("Failed to start Nova Core");
                return;
            }

            _logger.LogInformation("Nova Service started successfully");

            // Main service loop
            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(1000, stoppingToken);
            }

            // Stop Nova Core
            await _novaCore.StopAsync();
            _logger.LogInformation("Nova Service stopped");
        }
    }
}