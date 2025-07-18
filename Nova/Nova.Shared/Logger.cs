using System;
using System.IO;

namespace Nova.Shared
{
    public static class Logger
    {
        private static string _logFilePath;
        private static NovaLogLevel _minLogLevel = NovaLogLevel.Info;
        private static readonly object _lock = new object();

        public static void Initialize(string component, NovaLogLevel level)
        {
            _minLogLevel = level;
            _logFilePath = Path.Combine(Constants.LogsPath, $"Nova_{DateTime.Now:yyyyMMdd}.log");
            EnsureLogDirectory();
        }

        private static void EnsureLogDirectory()
        {
            try
            {
                if (!Directory.Exists(Constants.LogsPath))
                {
                    Directory.CreateDirectory(Constants.LogsPath);
                }
            }
            catch { /* Ignore directory creation errors */ }
        }

        public static void Info(string message, string component = "")
        {
            Log(NovaLogLevel.Info, message, component);
        }

        public static void Debug(string message, string component = "")
        {
            Log(NovaLogLevel.Debug, message, component);
        }

        public static void Warning(string message, string component = "")
        {
            Log(NovaLogLevel.Warning, message, component);
        }

        public static void Error(string message, string component = "")
        {
            Log(NovaLogLevel.Error, message, component);
        }

        public static void Error(Exception ex, string message, string component = "")
        {
            Log(NovaLogLevel.Error, $"{message} - {ex.Message}\n{ex.StackTrace}", component);
        }

        public static void Critical(string message, Exception ex)
        {
            Log(NovaLogLevel.Critical, $"{message} - {ex.Message}\n{ex.StackTrace}", "CRITICAL");
        }

        private static void Log(NovaLogLevel level, string message, string component)
        {
            if (level < _minLogLevel) return;

            try
            {
                lock (_lock)
                {
                    var logMessage = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} [{level}] {component}: {message}";
                    Console.WriteLine(logMessage);

                    if (!string.IsNullOrEmpty(_logFilePath))
                    {
                        File.AppendAllText(_logFilePath, logMessage + Environment.NewLine);

                        // Rotate logs if file gets too large (>10MB)
                        var fileInfo = new FileInfo(_logFilePath);
                        if (fileInfo.Exists && fileInfo.Length > 10 * 1024 * 1024)
                        {
                            ArchiveLogFile();
                        }
                    }
                }
            }
            catch { /* Ignore logging errors */ }
        }

        private static void ArchiveLogFile()
        {
            try
            {
                var archivePath = Path.Combine(Constants.LogsPath, $"Nova_{DateTime.Now:yyyyMMdd_HHmmss}.log");
                File.Move(_logFilePath, archivePath);
            }
            catch { /* Ignore archive errors */ }
        }
    }

    public enum NovaLogLevel
    {
        Debug,
        Info,
        Warning,
        Error,
        Critical
    }
}