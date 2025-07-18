using Microsoft.Win32;
using System;

namespace Nova.Shared
{
    public static class RegistryHelper
    {
        public static bool KeyExists(string keyPath)
        {
            try
            {
                using (var key = Registry.LocalMachine.OpenSubKey(keyPath))
                {
                    return key != null;
                }
            }
            catch
            {
                return false;
            }
        }

        public static void WriteString(string keyPath, string name, string value)
        {
            try
            {
                using (var key = Registry.LocalMachine.CreateSubKey(keyPath))
                {
                    key?.SetValue(name, value);
                }
            }
            catch (Exception ex)
            {
                Logger.Error($"Failed to write registry string: {ex.Message}");
            }
        }

        public static void WriteBool(string keyPath, string name, bool value)
        {
            WriteString(keyPath, name, value ? "1" : "0");  
        }

        public static string ReadString(string keyPath, string name, string defaultValue = "")
        {
            try
            {
                using (var key = Registry.LocalMachine.OpenSubKey(keyPath))
                {
                    return key?.GetValue(name, defaultValue)?.ToString() ?? defaultValue;
                }
            }
            catch (Exception ex)
            {
                Logger.Error($"Failed to read registry string: {ex.Message}");
                return defaultValue;
            }
        }

        public static bool ReadBool(string keyPath, string name, bool defaultValue = false)
        {
            var value = ReadString(keyPath, name, defaultValue ? "1" : "0");
            return value == "1";
        }
    }
}   