using System;
using System.Collections.Generic;
using System.Linq;
using Nova.Shared;

namespace Nova.Core
{
    public class ProductManager : IDisposable
    {
        private readonly Dictionary<string, NovaProduct> _products = new Dictionary<string, NovaProduct>();
        private readonly object _lock = new object();

        public void InitializeCoreProducts()
        {
            RegisterProduct(new NovaProduct
            {
                Id = "nova.core",
                Name = Constants.Products.Core,
                Version = Constants.Version,
                InstallPath = Constants.InstallationPath,
                Status = ProductStatus.Running,
                IsInstalled = true,
                Description = "Core system service"
            });

            RegisterProduct(new NovaProduct
            {
                Id = "nova.hub",
                Name = Constants.Products.Hub,
                Version = Constants.Version,
                Status = ProductStatus.Installed,
                IsInstalled = true,
                Description = "Central control panel"
            });

            RegisterProduct(new NovaProduct
            {
                Id = "nova.service",
                Name = Constants.Products.Service,
                Version = Constants.Version,
                Status = ProductStatus.Running,
                IsInstalled = true,
                Description = "Background service"
            });

            // Add your actual products that can be installed
            RegisterProduct(new NovaProduct
            {
                Id = "nova.cleaner",
                Name = Constants.Products.Cleaner,
                Version = Constants.Version,
                Status = ProductStatus.Installed,
                IsInstalled = true,
                Description = "System cleanup and optimization"
            });

            RegisterProduct(new NovaProduct
            {
                Id = "nova.tweaker",
                Name = Constants.Products.Tweaker,
                Version = Constants.Version,
                Status = ProductStatus.Installed,
                IsInstalled = true,
                Description = "Windows tweaking and customization"
            });

            RegisterProduct(new NovaProduct
            {
                Id = "nova.gaming",
                Name = Constants.Products.Gaming,
                Version = Constants.Version,
                Status = ProductStatus.Installed,
                IsInstalled = true,
                Description = "Gaming optimization and management"
            });
        }

        public bool RegisterProduct(NovaProduct product)
        {
            if (product == null || string.IsNullOrEmpty(product.Name))
                return false;

            lock (_lock)
            {
                if (_products.ContainsKey(product.Name))
                {
                    // Update existing product
                    var existing = _products[product.Name];
                    existing.Version = product.Version;
                    existing.Status = product.Status;
                    existing.LastUpdated = DateTime.Now;
                    existing.ProcessId = product.ProcessId;

                    Logger.Info($"Updated product: {product.Name} v{product.Version}");
                    return true;
                }

                _products[product.Name] = product;
                Logger.Info($"Registered product: {product.Name} v{product.Version}");
                return true;
            }
        }

        public bool UnregisterProduct(string productName)
        {
            lock (_lock)
            {
                if (_products.Remove(productName))
                {
                    Logger.Info($"Unregistered product: {productName}");
                    return true;
                }
                return false;
            }
        }

        public NovaProduct GetProduct(string productName)
        {
            lock (_lock)
            {
                return _products.TryGetValue(productName, out var product) ? product : null;
            }
        }

        public void UpdateProductStatus(string productName, ProductStatus status)
        {
            lock (_lock)
            {
                if (_products.TryGetValue(productName, out var product))
                {
                    product.Status = status;
                    product.LastUpdated = DateTime.Now;
                    Logger.Debug($"Updated {productName} status to {status}");
                }
            }
        }

        public void UpdateProductLastUsed(string productName)
        {
            lock (_lock)
            {
                if (_products.TryGetValue(productName, out var product))
                {
                    product.LastUsed = DateTime.Now;
                }
            }
        }

        public bool IsProductAvailable(string productName)
        {
            lock (_lock)
            {
                return _products.ContainsKey(productName);
            }
        }

        public List<NovaProduct> GetAllProducts()
        {
            lock (_lock)
            {
                return new List<NovaProduct>(_products.Values);
            }
        }

        public List<NovaProduct> GetRunningProducts()
        {
            lock (_lock)
            {
                return _products.Values.Where(p => p.Status == ProductStatus.Running).ToList();
            }
        }

        public List<NovaProduct> GetInstalledProducts()
        {
            lock (_lock)
            {
                return _products.Values.Where(p => p.Status == ProductStatus.Installed || p.Status == ProductStatus.Running).ToList();
            }
        }

        public void Dispose()
        {
            lock (_lock)
            {
                _products.Clear();
            }
        }
    }

    public class NovaProduct
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Version { get; set; }
        public string InstallPath { get; set; }
        public ProductStatus Status { get; set; }
        public bool IsInstalled { get; set; } = true;
        public DateTime InstallDate { get; set; } = DateTime.Now;
        public DateTime LastUpdated { get; set; } = DateTime.Now;
        public DateTime LastUsed { get; set; } = DateTime.Now;
        public int ProcessId { get; set; }
        public string DisplayName => GetDisplayName();
        public string Description { get; set; }

        public NovaProduct()
        {
            // Set default description if not provided
            if (string.IsNullOrEmpty(Description))
            {
                Description = GetDefaultDescription();
            }
        }

        private string GetDisplayName()
        {
            switch (Name)
            {
                case Constants.Products.Cleaner: return "Nova Cleaner";
                case Constants.Products.Tweaker: return "Nova Tweaker";
                case Constants.Products.Gaming: return "Nova Gaming";
                case Constants.Products.Hub: return "Nova Hub";
                case Constants.Products.Core: return "Nova Core";
                case Constants.Products.Service: return "Nova Service";
                default: return Name;
            }
        }

        private string GetDefaultDescription()
        {
            switch (Name)
            {
                case Constants.Products.Cleaner: return "System cleanup and optimization";
                case Constants.Products.Tweaker: return "Windows tweaking and customization";
                case Constants.Products.Gaming: return "Gaming optimization and management";
                case Constants.Products.Hub: return "Central control panel";
                case Constants.Products.Core: return "Core system service";
                case Constants.Products.Service: return "Background service";
                default: return "Nova product";
            }
        }
    }

    public enum ProductStatus
    {
        Unknown,
        Installed,
        Running,
        Stopped,
        Error,
        Updating
    }
}