using System.ComponentModel;
using System.Configuration.Install;
using System.ServiceProcess;
using Microsoft.Extensions.Logging;
using Nova.Shared;
using System.Threading.Tasks;
using Nova.Core;
using System;

namespace Nova.Service
{
    [RunInstaller(true)]
    public partial class NovaServiceInstaller : Installer
    {
        private ServiceProcessInstaller serviceProcessInstaller;
        private ServiceInstaller serviceInstaller;

        public NovaServiceInstaller()
        {
            InitializeComponent();

            // Service Process Installer
            serviceProcessInstaller = new ServiceProcessInstaller();
            serviceProcessInstaller.Account = ServiceAccount.LocalSystem;
            serviceProcessInstaller.Username = null;
            serviceProcessInstaller.Password = null;

            // Service Installer
            serviceInstaller = new ServiceInstaller();
            serviceInstaller.ServiceName = Constants.ServiceName;
            serviceInstaller.DisplayName = Constants.ServiceDisplayName;
            serviceInstaller.Description = Constants.ServiceDescription;
            serviceInstaller.StartType = ServiceStartMode.Automatic;
            serviceInstaller.DelayedAutoStart = true; // Start after system boot completes

            // Add installers to the collection
            Installers.Add(serviceProcessInstaller);
            Installers.Add(serviceInstaller);
        }

        protected override void OnBeforeInstall(System.Collections.IDictionary savedState)
        {
            Logger.Info("Installing Nova Service...", "ServiceInstaller");
            base.OnBeforeInstall(savedState);
        }

        protected override void OnAfterInstall(System.Collections.IDictionary savedState)
        {
            base.OnAfterInstall(savedState);
            Logger.Info("Nova Service installed successfully", "ServiceInstaller");

            try
            {
                // Set service recovery options
                SetServiceRecoveryOptions();
            }
            catch (System.Exception ex)
            {
                Logger.Warning($"Failed to set service recovery options: {ex.Message}", "ServiceInstaller");
            }
        }

        protected override void OnBeforeUninstall(System.Collections.IDictionary savedState)
        {
            Logger.Info("Uninstalling Nova Service...", "ServiceInstaller");
            base.OnBeforeUninstall(savedState);
        }

        protected override void OnAfterUninstall(System.Collections.IDictionary savedState)
        {
            base.OnAfterUninstall(savedState);
            Logger.Info("Nova Service uninstalled successfully", "ServiceInstaller");
        }

        private void SetServiceRecoveryOptions()
        {
            try
            {
                // Use sc.exe to set recovery options
                // This configures the service to restart automatically on failure
                string serviceName = Constants.ServiceName;

                // Set recovery options: restart after 1 minute on first failure, 
                // restart after 5 minutes on second failure, restart after 10 minutes on subsequent failures
                var startInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "sc.exe",
                    Arguments = $"failure \"{serviceName}\" reset= 86400 actions= restart/60000/restart/300000/restart/600000",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true
                };

                using (var process = System.Diagnostics.Process.Start(startInfo))
                {
                    process.WaitForExit();
                    if (process.ExitCode == 0)
                    {
                        Logger.Info("Service recovery options set successfully", "ServiceInstaller");
                    }
                    else
                    {
                        string error = process.StandardError.ReadToEnd();
                        Logger.Warning($"Failed to set service recovery options: {error}", "ServiceInstaller");
                    }
                }
            }
            catch (System.Exception ex)
            {
                Logger.Warning($"Exception setting service recovery options: {ex.Message}", "ServiceInstaller");
            }
        }
    }

    partial class NovaServiceInstaller
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary> 
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Component Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            components = new System.ComponentModel.Container();
        }

        #endregion
    }
}