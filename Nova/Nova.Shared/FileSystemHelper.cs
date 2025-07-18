using System;
using System.IO;

namespace Nova.Shared
{
    public static class FileSystemHelper
    {
        public static bool EnsureDirectoryExists(string path)
        {
            try
            {
                if (!Directory.Exists(path))
                {
                    Directory.CreateDirectory(path);
                }
                return true;
            }
            catch (Exception ex)
            {
                Logger.Error($"Failed to create directory: {path} - {ex.Message}");
                return false;
            }
        }

        public static string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len /= 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }

        public static void CleanupTempFiles()
        {
            try
            {
                var tempPath = Path.GetTempPath();
                var files = Directory.GetFiles(tempPath, "Nova_*.tmp");
                foreach (var file in files)
                {
                    try
                    {
                        File.Delete(file);
                    }
                    catch { /* Ignore deletion errors */ }
                }
            }
            catch { /* Ignore cleanup errors */ }
        }
    }
}