using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Nova.Core;
using Nova.Shared;

namespace Nova.Product.Template
{
    /// <summary>
    /// Template Program class for Nova product backends
    /// This serves as a foundation for all Nova product backend services
    /// </summary>
    internal class Program
    {
        static async Task<int> Main(string[] args)
        {
            try
            {
                // Initialize logging
                Logger.Initialize("ProductTemplate", NovaLogLevel.Info);
                Logger.Info("Starting Nova Product Template Backend...");

                // Create host builder
                var hostBuilder = Host.CreateDefaultBuilder(args)
                    .ConfigureServices((context, services) =>
                    {
                        // Register Nova Core services
                        services.AddSingleton<NovaCore>();
                        
                        // Register your product-specific services here
                        services.AddSingleton<ProductService>();
                        services.AddSingleton<ProductWorker>();
                    })
                    .ConfigureLogging(logging =>
                    {
                        logging.ClearProviders();
                        logging.AddConsole();
                        logging.AddDebug();
                    });

                // Build and run host
                using var host = hostBuilder.Build();
                
                // Initialize Nova Core
                var novaCore = host.Services.GetRequiredService<NovaCore>();
                Logger.Info("Initializing Nova Core connection...");
                
                // Start the product service
                var productService = host.Services.GetRequiredService<ProductService>();
                await productService.StartAsync();

                Logger.Info("Nova Product Template Backend started successfully");

                // Run the host
                await host.RunAsync();

                return 0;
            }
            catch (Exception ex)
            {
                Logger.Critical("Critical error in Nova Product Template Backend", ex);
                return 1;
            }
        }
    }
} 