using System;
using System.IO;

namespace Nova.Shared
{
    public static class Constants
    {
        // Core constants
        public const string Version = "1.0.0";
        public const int DefaultTimeout = 30000;
        public const int PipeTimeoutMs = 5000;
        public const int MaxPipeInstances = 10;

        // Named pipe names
        public const string CorePipeName = "Nova.Core.IPC";
        public const string HubPipeName = "Nova.Hub.IPC";

        // Paths
        public static string AppDataPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "Nova");
        public static string LogsPath = Path.Combine(AppDataPath, "Logs");
        public static string CachePath = Path.Combine(AppDataPath, "Cache");
        public static string BackupsPath = Path.Combine(AppDataPath, "Backups");
        public static string UserDataPath = Path.Combine(AppDataPath, "UserData");
        public static string InstallationPath = AppDomain.CurrentDomain.BaseDirectory;

        // Registry paths
        public static string CoreRegistryKey = @"SOFTWARE\Nova\Core";
        public static string ProductsRegistryKey = @"SOFTWARE\Nova\Products";
        public static string SettingsRegistryKey = @"SOFTWARE\Nova\Settings";

        // Product names
        public static class Products
        {
            public const string Core = "Nova.Core";
            public const string Hub = "Nova.Hub";
            public const string Service = "Nova.Service";
            public const string Cleaner = "Nova.Cleaner";
            public const string Tweaker = "Nova.Tweaker";
            public const string Gaming = "Nova.Gaming";
        }

        // Message types for IPC
        public static class MessageTypes
        {
            public const string ProductRegister = "Product.Register";
            public const string ProductLaunch = "Product.Launch";
            public const string ProductStatus = "Product.Status";
            public const string AuthRequest = "Auth.Request";
            public const string AuthResponse = "Auth.Response";
            public const string GetProducts = "Products.Get";
            public const string Response = "Response";
            public const string Command = "Command";
            public const string Heartbeat = "Heartbeat";
            public const string Status = "Status";
            public const string Request = "Request";
            public const string Acknowledgment = "Acknowledgment";
        }

        // Error codes
        public static class ErrorCodes
        {
            public const int Success = 0;
            public const int GeneralError = 1;
            public const int ConnectionError = 2;
            public const int Timeout = 3;
            public const int AuthRequired = 4;
            public const int ProductNotFound = 5;
        }

        // Service constants
        public const string ServiceName = "NovaService";
        public const string ServiceDisplayName = "Nova Core Service";
        public const string ServiceDescription = "Provides core functionality for Nova products";

        // Database/API constants (for your authentication system)
        public const string ApiBaseUrl = "https://api.nova.com"; // Replace with your actual API
        public const string DatabaseName = "Nova";
    }
}