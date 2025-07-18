using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Nova.Core;
using Nova.Shared;
using Nova.Shared.Messages;

namespace Nova.Updater
{
    /// <summary>
    /// Nova Updater - Handles automatic updates for Nova products
    /// </summary>
    internal class Program
    {
        private static NovaCore _novaCore;

        static async Task<int> Main(string[] args)
        {
            try
            {
                Logger.Initialize("Updater", NovaLogLevel.Info);
                Logger.Info("Nova Updater starting...");

                var options = ParseCommandLineArguments(args);
                if (options.ShowHelp)
                {
                    ShowHelp();
                    return 0;
                }

                _novaCore = NovaCore.Instance;
                if (!await _novaCore.InitializeClientAsync("Nova.Updater"))
                {
                    Logger.Error("Could not connect to Nova Service");
                    return 1;
                }

                Logger.Info("Connected to Nova Service");
                return await ExecuteOperation(options);
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Fatal error in Nova Updater");
                return 1;
            }
            finally
            {
                _novaCore?.Shutdown();
            }
        }

        private static UpdaterOptions ParseCommandLineArguments(string[] args)
        {
            var options = new UpdaterOptions();

            for (int i = 0; i < args.Length; i++)
            {
                switch (args[i].ToLower())
                {
                    case "-h":
                    case "--help":
                    case "/help":
                        options.ShowHelp = true;
                        break;

                    case "-c":
                    case "--check":
                    case "/check":
                        options.Operation = UpdateOperation.Check;
                        break;

                    case "-u":
                    case "--update":
                    case "/update":
                        options.Operation = UpdateOperation.Update;
                        if (i + 1 < args.Length && !args[i + 1].StartsWith("-") && !args[i + 1].StartsWith("/"))
                        {
                            options.ProductName = args[++i];
                        }
                        break;

                    case "-a":
                    case "--all":
                    case "/all":
                        options.UpdateAll = true;
                        break;

                    case "-f":
                    case "--force":
                    case "/force":
                        options.Force = true;
                        break;

                    case "-s":
                    case "--silent":
                    case "/silent":
                        options.Silent = true;
                        break;

                    case "--url":
                        if (i + 1 < args.Length)
                        {
                            options.UpdateServerUrl = args[++i];
                        }
                        break;

                    default:
                        if (!args[i].StartsWith("-") && !args[i].StartsWith("/") && string.IsNullOrEmpty(options.ProductName))
                        {
                            options.ProductName = args[i];
                        }
                        break;
                }
            }

            return options;
        }

        private static async Task<int> ExecuteOperation(UpdaterOptions options)
        {
            try
            {
                switch (options.Operation)
                {
                    case UpdateOperation.Check:
                        return await CheckForUpdates(options);

                    case UpdateOperation.Update:
                        return await PerformUpdate(options);

                    default:
                        ShowHelp();
                        return 0;
                }
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error executing operation", "Updater");

                if (!options.Silent)
                {
                    Console.WriteLine($"Error: {ex.Message}");
                }

                return 1;
            }
        }

        private static async Task<int> CheckForUpdates(UpdaterOptions options)
        {
            try
            {
                if (!options.Silent)
                {
                    Console.WriteLine("Checking for updates...");
                }

                var productsToCheck = new List<string>();

                if (options.UpdateAll || string.IsNullOrEmpty(options.ProductName))
                {
                    // Get all installed products
                    productsToCheck.AddRange(new[] { Constants.Products.Core, Constants.Products.Hub });
                }
                else
                {
                    productsToCheck.Add(options.ProductName);
                }

                bool updatesAvailable = false;

                foreach (string productName in productsToCheck)
                {
                    var updateInfo = await CheckProductUpdate(productName, options.UpdateServerUrl);

                    if (updateInfo.UpdateAvailable)
                    {
                        updatesAvailable = true;

                        if (!options.Silent)
                        {
                            Console.WriteLine($"Update available for {productName}:");
                            Console.WriteLine($"  Current: {updateInfo.CurrentVersion}");
                            Console.WriteLine($"  Latest:  {updateInfo.LatestVersion}");
                            Console.WriteLine($"  Size:    {FormatFileSize(updateInfo.UpdateSize)}");

                            if (updateInfo.IsCritical)
                            {
                                Console.WriteLine("  ⚠️  CRITICAL UPDATE");
                            }

                            Console.WriteLine();
                        }
                    }
                    else
                    {
                        if (!options.Silent)
                        {
                            Console.WriteLine($"{productName} is up to date (v{updateInfo.CurrentVersion})");
                        }
                    }
                }

                if (!options.Silent)
                {
                    if (updatesAvailable)
                    {
                        Console.WriteLine("Run with --update to install updates.");
                    }
                    else
                    {
                        Console.WriteLine("All products are up to date.");
                    }
                }

                return updatesAvailable ? 2 : 0; // Exit code 2 means updates available
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error checking for updates", "Updater");
                throw;
            }
        }

        private static async Task<int> PerformUpdate(UpdaterOptions options)
        {
            try
            {
                if (!options.Silent)
                {
                    Console.WriteLine("Performing updates...");
                }

                var productsToUpdate = new List<string>();

                if (options.UpdateAll || string.IsNullOrEmpty(options.ProductName))
                {
                    // Get all installed products that have updates
                    productsToUpdate.AddRange(new[] { Constants.Products.Core, Constants.Products.Hub });
                }
                else
                {
                    productsToUpdate.Add(options.ProductName);
                }

                bool anyUpdatesPerformed = false;

                foreach (string productName in productsToUpdate)
                {
                    var updateInfo = await CheckProductUpdate(productName, options.UpdateServerUrl);

                    if (updateInfo.UpdateAvailable || options.Force)
                    {
                        if (!options.Silent)
                        {
                            Console.WriteLine($"Updating {productName}...");
                        }

                        bool success = await UpdateProduct(productName, updateInfo, options);

                        if (success)
                        {
                            anyUpdatesPerformed = true;

                            if (!options.Silent)
                            {
                                Console.WriteLine($"✅ {productName} updated successfully");
                            }
                        }
                        else
                        {
                            if (!options.Silent)
                            {
                                Console.WriteLine($"❌ Failed to update {productName}");
                            }
                        }
                    }
                    else
                    {
                        if (!options.Silent)
                        {
                            Console.WriteLine($"{productName} is already up to date");
                        }
                    }
                }

                if (!options.Silent)
                {
                    if (anyUpdatesPerformed)
                    {
                        Console.WriteLine("Updates completed. You may need to restart Nova products.");
                    }
                    else
                    {
                        Console.WriteLine("No updates were performed.");
                    }
                }

                return 0;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error performing updates", "Updater");
                throw;
            }
        }

        private static async Task<UpdateInfo> CheckProductUpdate(string productName, string updateServerUrl)
        {
            try
            {
                // TODO: Implement actual update checking against your update server
                // For now, return a mock response indicating no updates

                var updateInfo = new UpdateInfo
                {
                    ProductName = productName,
                    CurrentVersion = Constants.Version,
                    LatestVersion = Constants.Version,
                    UpdateAvailable = false,
                    UpdateDescription = "No updates available",
                    UpdateSize = 0,
                    DownloadUrl = "",
                    ReleaseDate = DateTime.Now,
                    IsCritical = false
                };

                Logger.Debug($"Checked updates for {productName}: {updateInfo.UpdateAvailable}", "Updater");
                return updateInfo;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Error checking update for {productName}", "Updater");
                throw;
            }
        }

        private static async Task<bool> UpdateProduct(string productName, UpdateInfo updateInfo, UpdaterOptions options)
        {
            try
            {
                // TODO: Implement actual product update
                // This would involve:
                // 1. Download the update package
                // 2. Stop the product if running
                // 3. Backup current installation
                // 4. Extract and install new version
                // 5. Update registry
                // 6. Restart product if it was running

                if (!options.Silent)
                {
                    Console.WriteLine($"  Downloading update for {productName}...");
                    Console.WriteLine($"  Installing update...");
                    Console.WriteLine($"  Updating registration...");
                }

                // Simulate update process
                await Task.Delay(1000);

                Logger.Info($"Updated {productName} from {updateInfo.CurrentVersion} to {updateInfo.LatestVersion}", "Updater");
                return true;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Error updating {productName}", "Updater");
                return false;
            }
        }

        private static string FormatFileSize(long bytes)
        {
            return FileSystemHelper.FormatFileSize(bytes);
        }

        private static void ShowHelp()
        {
            Console.WriteLine("Nova Updater v" + Constants.Version);
            Console.WriteLine("==================================");
            Console.WriteLine();
            Console.WriteLine("Usage:");
            Console.WriteLine("  NovaUpdater.exe [options] [product-name]");
            Console.WriteLine();
            Console.WriteLine("Options:");
            Console.WriteLine("  -c, --check         Check for available updates");
            Console.WriteLine("  -u, --update        Download and install updates");
            Console.WriteLine("  -a, --all           Process all installed products");
            Console.WriteLine("  -f, --force         Force update even if no new version");
            Console.WriteLine("  -s, --silent        Run silently (no console output)");
            Console.WriteLine("  -h, --help          Show this help message");
            Console.WriteLine("      --url <url>     Custom update server URL");
            Console.WriteLine();
            Console.WriteLine("Examples:");
            Console.WriteLine("  NovaUpdater.exe --check --all");
            Console.WriteLine("  NovaUpdater.exe --update Nova.Cleaner");
            Console.WriteLine("  NovaUpdater.exe --update --all --silent");
            Console.WriteLine();
            Console.WriteLine("Exit Codes:");
            Console.WriteLine("  0 - Success, no updates available");
            Console.WriteLine("  1 - Error occurred");
            Console.WriteLine("  2 - Updates are available (check mode only)");
        }
    }

    public class UpdaterOptions
    {
        public UpdateOperation Operation { get; set; } = UpdateOperation.Check;
        public string ProductName { get; set; } = "";
        public bool UpdateAll { get; set; } = false;
        public bool Force { get; set; } = false;
        public bool Silent { get; set; } = false;
        public bool ShowHelp { get; set; } = false;
        public string UpdateServerUrl { get; set; } = "https://updates.nova.com/api"; // TODO: Configure actual URL
    }

    public enum UpdateOperation
    {
        Check,
        Update
    }
}