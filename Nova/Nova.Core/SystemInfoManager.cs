using System;
using System.Diagnostics;
using System.Linq;
using System.Management;
using System.Threading;
using Nova.Shared;

namespace Nova.Core
{
    public class SystemInfoManager : IDisposable
    {
        private readonly Timer _monitoringTimer;
        private SystemInfo _currentSystemInfo;
        private HardwareInfo _hardwareInfo;
        private bool _isMonitoring = false;
        private PerformanceCounter _cpuCounter;
        private PerformanceCounter _memCounter;

        public event EventHandler<SystemInfo> SystemInfoUpdated;

        public SystemInfoManager()
        {
            _monitoringTimer = new Timer(UpdateSystemInfo, null, Timeout.Infinite, Timeout.Infinite);
            _currentSystemInfo = new SystemInfo();
            _hardwareInfo = new HardwareInfo();

            try
            {
                _cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
                _memCounter = new PerformanceCounter("Memory", "Available MBytes");
            }
            catch (Exception ex)
            {
                Logger.Warning($"Failed to initialize performance counters: {ex.Message}", "SystemInfoManager");
            }
        }

        public void StartMonitoring(int intervalSeconds = 5)
        {
            if (_isMonitoring) return;

            try
            {
                // Get initial hardware info
                _hardwareInfo = GetHardwareInfoInternal();

                // Start periodic monitoring
                _isMonitoring = true;
                _monitoringTimer.Change(0, intervalSeconds * 1000);
                Logger.Info("System monitoring started", "SystemInfoManager");
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Failed to start system monitoring", "SystemInfoManager");
            }
        }

        public void StopMonitoring()
        {
            try
            {
                _isMonitoring = false;
                _monitoringTimer.Change(Timeout.Infinite, Timeout.Infinite);
                Logger.Info("System monitoring stopped", "SystemInfoManager");
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error stopping system monitoring", "SystemInfoManager");
            }
        }

        public SystemInfo GetCurrentSystemInfo()
        {
            return _currentSystemInfo ?? new SystemInfo();
        }

        public HardwareInfo GetHardwareInfo()
        {
            return _hardwareInfo ?? new HardwareInfo();
        }

        private void UpdateSystemInfo(object state)
        {
            try
            {
                var newInfo = new SystemInfo
                {
                    Timestamp = DateTime.Now,
                    CpuUsage = GetCpuUsage(),
                    MemoryUsagePercent = GetMemoryUsage(),
                    ProcessCount = Process.GetProcesses().Length,
                    Uptime = TimeSpan.FromMilliseconds(Environment.TickCount)
                };

                _currentSystemInfo = newInfo;
                SystemInfoUpdated?.Invoke(this, newInfo);
            }
            catch (Exception ex)
            {
                Logger.Warning($"Error updating system info: {ex.Message}", "SystemInfoManager");
            }
        }

        private float GetCpuUsage()
        {
            try
            {
                if (_cpuCounter != null)
                {
                    return _cpuCounter.NextValue();
                }
            }
            catch (Exception ex)
            {
                Logger.Debug($"Error getting CPU usage: {ex.Message}", "SystemInfoManager");
            }
            return 0;
        }

        private float GetMemoryUsage()
        {
            try
            {
                if (_memCounter != null && _hardwareInfo.TotalMemory > 0)
                {
                    float availableMB = _memCounter.NextValue();
                    float totalMB = _hardwareInfo.TotalMemory / (1024 * 1024);
                    return Math.Max(0, 100 - (availableMB / totalMB * 100));
                }
            }
            catch (Exception ex)
            {
                Logger.Debug($"Error getting memory usage: {ex.Message}", "SystemInfoManager");
            }
            return 0;
        }

        private HardwareInfo GetHardwareInfoInternal()
        {
            var info = new HardwareInfo();

            try
            {
                // Get CPU info
                using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_Processor"))
                {
                    foreach (ManagementObject item in searcher.Get())
                    {
                        info.CpuName = item["Name"]?.ToString() ?? "Unknown";
                        if (int.TryParse(item["NumberOfCores"]?.ToString(), out int cores))
                            info.CpuCores = cores;
                        if (int.TryParse(item["ThreadCount"]?.ToString(), out int threads))
                            info.CpuThreads = threads;
                        break; // Just get first CPU
                    }
                }

                // Get memory info
                using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_ComputerSystem"))
                {
                    foreach (ManagementObject item in searcher.Get())
                    {
                        if (long.TryParse(item["TotalPhysicalMemory"]?.ToString(), out long memory))
                            info.TotalMemory = memory;
                        break;
                    }
                }

                // Get OS info
                using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_OperatingSystem"))
                {
                    foreach (ManagementObject item in searcher.Get())
                    {
                        info.OSVersion = item["Caption"]?.ToString() ?? "Unknown";
                        info.OSArchitecture = item["OSArchitecture"]?.ToString() ?? "Unknown";
                        break;
                    }
                }

                // Get GPU info
                using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_VideoController"))
                {
                    foreach (ManagementObject item in searcher.Get())
                    {
                        var name = item["Name"]?.ToString();
                        if (!string.IsNullOrEmpty(name) && !name.Contains("Remote") && !name.Contains("Virtual"))
                        {
                            info.GpuName = name;
                            if (long.TryParse(item["AdapterRAM"]?.ToString(), out long gpuMem))
                                info.GpuMemory = gpuMem;
                            break; // Just get first real GPU
                        }
                    }
                }

                // Get disk info
                using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_LogicalDisk WHERE DriveType=3"))
                {
                    foreach (ManagementObject item in searcher.Get())
                    {
                        var drive = new DriveInformation
                        {
                            DriveLetter = item["DeviceID"]?.ToString() ?? "Unknown",
                            Label = item["VolumeName"]?.ToString() ?? "",
                            FileSystem = item["FileSystem"]?.ToString() ?? "Unknown"
                        };

                        if (long.TryParse(item["Size"]?.ToString(), out long totalSize))
                            drive.TotalSize = totalSize;

                        if (long.TryParse(item["FreeSpace"]?.ToString(), out long freeSpace))
                            drive.FreeSpace = freeSpace;

                        drive.UsedSpace = drive.TotalSize - drive.FreeSpace;
                        drive.UsagePercent = drive.TotalSize > 0 ? (double)drive.UsedSpace / drive.TotalSize * 100 : 0;

                        info.Drives.Add(drive);
                    }
                }

                // Get network adapters
                using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_NetworkAdapter WHERE NetConnectionStatus=2"))
                {
                    foreach (ManagementObject item in searcher.Get())
                    {
                        var adapter = new NetworkAdapterInfo
                        {
                            Name = item["Name"]?.ToString() ?? "Unknown",
                            Description = item["Description"]?.ToString() ?? "",
                            MacAddress = item["MACAddress"]?.ToString() ?? "",
                            Speed = item["Speed"]?.ToString() ?? "Unknown"
                        };

                        info.NetworkAdapters.Add(adapter);
                    }
                }

                Logger.Debug($"Hardware info collected: CPU={info.CpuName}, Memory={FileSystemHelper.FormatFileSize(info.TotalMemory)}, OS={info.OSVersion}", "SystemInfoManager");
            }
            catch (Exception ex)
            {
                Logger.Warning($"Error getting hardware info: {ex.Message}", "SystemInfoManager");
            }

            return info;
        }

        public void Dispose()
        {
            try
            {
                StopMonitoring();
                _monitoringTimer?.Dispose();
                _cpuCounter?.Dispose();
                _memCounter?.Dispose();
            }
            catch (Exception ex)
            {
                Logger.Debug($"Error disposing SystemInfoManager: {ex.Message}", "SystemInfoManager");
            }
        }
    }

    public class SystemInfo
    {
        public DateTime Timestamp { get; set; }
        public float CpuUsage { get; set; }
        public float MemoryUsagePercent { get; set; }
        public int ProcessCount { get; set; }
        public TimeSpan Uptime { get; set; }
    }

    public class HardwareInfo
    {
        public string CpuName { get; set; } = "Unknown";
        public int CpuCores { get; set; } = 1;
        public int CpuThreads { get; set; } = 1;
        public long TotalMemory { get; set; } = 0;
        public string OSVersion { get; set; } = "Unknown";
        public string OSArchitecture { get; set; } = "Unknown";
        public string GpuName { get; set; } = "Unknown";
        public long GpuMemory { get; set; } = 0;
        public System.Collections.Generic.List<DriveInformation> Drives { get; set; } = new System.Collections.Generic.List<DriveInformation>();
        public System.Collections.Generic.List<NetworkAdapterInfo> NetworkAdapters { get; set; } = new System.Collections.Generic.List<NetworkAdapterInfo>();
    }

    public class DriveInformation
    {
        public string DriveLetter { get; set; } = "";
        public string Label { get; set; } = "";
        public string FileSystem { get; set; } = "";
        public long TotalSize { get; set; } = 0;
        public long FreeSpace { get; set; } = 0;
        public long UsedSpace { get; set; } = 0;
        public double UsagePercent { get; set; } = 0;

        public string FormattedTotalSize => FileSystemHelper.FormatFileSize(TotalSize);
        public string FormattedFreeSpace => FileSystemHelper.FormatFileSize(FreeSpace);
        public string FormattedUsedSpace => FileSystemHelper.FormatFileSize(UsedSpace);
    }

    public class NetworkAdapterInfo
    {
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public string MacAddress { get; set; } = "";
        public string Speed { get; set; } = "";
    }
}