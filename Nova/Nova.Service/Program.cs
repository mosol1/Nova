using System;
using System.ServiceProcess;
using Nova.Shared;

namespace Nova.Service
{
    public static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        public static void Main(string[] args)
        {
            Logger.Initialize("Service", NovaLogLevel.Info);

            if (args.Length > 0)
            {
                switch (args[0].ToLower())
                {
                    case "-install":
                    case "/install":
                        InstallService();
                        return;

                    case "-uninstall":
                    case "/uninstall":
                        UninstallService();
                        return;

                    case "-start":
                    case "/start":
                        StartService();
                        return;

                    case "-stop":
                    case "/stop":
                        StopService();
                        return;

                    case "-console":
                    case "/console":
                        RunAsConsole();
                        return;

                    case "-help":
                    case "/help":
                    case "/?":
                        ShowHelp();
                        return;
                }
            }

            // Run as Windows Service
            ServiceBase[] ServicesToRun = { new NovaWindowsService() };
            ServiceBase.Run(ServicesToRun);
        }

        private static void InstallService()
        {
            try
            {
                Console.WriteLine("Installing Nova Service...");
                System.Configuration.Install.ManagedInstallerClass.InstallHelper(
                    new string[] { System.Reflection.Assembly.GetExecutingAssembly().Location });
                Console.WriteLine("✅ Nova Service installed successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Failed to install service: {ex.Message}");
                Logger.Error(ex, "Failed to install service", "Program");
            }
        }

        private static void UninstallService()
        {
            try
            {
                Console.WriteLine("Uninstalling Nova Service...");
                System.Configuration.Install.ManagedInstallerClass.InstallHelper(
                    new string[] { "/u", System.Reflection.Assembly.GetExecutingAssembly().Location });
                Console.WriteLine("✅ Nova Service uninstalled successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Failed to uninstall service: {ex.Message}");
                Logger.Error(ex, "Failed to uninstall service", "Program");
            }
        }

        private static void StartService()
        {
            try
            {
                Console.WriteLine("Starting Nova Service...");
                using (var sc = new ServiceController(Constants.ServiceName))
                {
                    if (sc.Status != ServiceControllerStatus.Running)
                    {
                        sc.Start();
                        sc.WaitForStatus(ServiceControllerStatus.Running, TimeSpan.FromSeconds(30));
                        Console.WriteLine("✅ Nova Service started successfully");
                    }
                    else
                    {
                        Console.WriteLine("ℹ️  Nova Service is already running");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Failed to start service: {ex.Message}");
                Logger.Error(ex, "Failed to start service", "Program");
            }
        }

        private static void StopService()
        {
            try
            {
                Console.WriteLine("Stopping Nova Service...");
                using (var sc = new ServiceController(Constants.ServiceName))
                {
                    if (sc.Status != ServiceControllerStatus.Stopped)
                    {
                        sc.Stop();
                        sc.WaitForStatus(ServiceControllerStatus.Stopped, TimeSpan.FromSeconds(30));
                        Console.WriteLine("✅ Nova Service stopped successfully");
                    }
                    else
                    {
                        Console.WriteLine("ℹ️  Nova Service is already stopped");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Failed to stop service: {ex.Message}");
                Logger.Error(ex, "Failed to stop service", "Program");
            }
        }

        private static void RunAsConsole()
        {
            try
            {
                Console.WriteLine("🚀 Running Nova Service in console mode...");
                Console.WriteLine("Press Ctrl+C to stop");

                var service = new NovaWindowsService();
                service.StartService();

                Console.CancelKeyPress += (sender, e) =>
                {
                    e.Cancel = true;
                    Console.WriteLine("\n🛑 Stopping Nova Service...");
                    service.StopService();
                };

                // Keep running until interrupted
                while (true)
                {
                    System.Threading.Thread.Sleep(1000);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error running in console mode: {ex.Message}");
                Logger.Error(ex, "Error running in console mode", "Program");
            }
        }

        private static void ShowHelp()
        {
            Console.WriteLine("Nova Service v" + Constants.Version);
            Console.WriteLine("============================");
            Console.WriteLine();
            Console.WriteLine("Usage: NovaService.exe [command]");
            Console.WriteLine();
            Console.WriteLine("Commands:");
            Console.WriteLine("  -install     Install the Windows service");
            Console.WriteLine("  -uninstall   Uninstall the Windows service");
            Console.WriteLine("  -start       Start the service");
            Console.WriteLine("  -stop        Stop the service");
            Console.WriteLine("  -console     Run in console mode (for debugging)");
            Console.WriteLine("  -help        Show this help");
            Console.WriteLine();
            Console.WriteLine("Examples:");
            Console.WriteLine("  NovaService.exe -install");
            Console.WriteLine("  NovaService.exe -start");
            Console.WriteLine("  NovaService.exe -console");
        }
    }
}