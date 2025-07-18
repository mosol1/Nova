using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Nova.Shared;

namespace Nova.Shared.Messages
{
    /// <summary>
    /// Base message class for inter-process communication
    /// </summary>
    [Serializable]
    public class NovaMessage
    {
        public string Type { get; set; }
        public string SourceProduct { get; set; }
        public string TargetProduct { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.Now;
        public Dictionary<string, object> Data { get; set; } = new Dictionary<string, object>();

        public NovaMessage() { }

        public NovaMessage(string type, string sourceProduct, string targetProduct)
        {
            Type = type;
            SourceProduct = sourceProduct;
            TargetProduct = targetProduct;
        }

        public T GetData<T>(string key, T defaultValue = default(T))
        {
            if (Data.TryGetValue(key, out var value))
            {
                if (value is T directValue)
                    return directValue;

                try
                {
                    if (typeof(T) == typeof(string))
                        return (T)(object)value.ToString();

                    if (value is long && typeof(T) == typeof(int))
                        return (T)(object)(int)(long)value;

                    return JsonConvert.DeserializeObject<T>(JsonConvert.SerializeObject(value));
                }
                catch
                {
                    return defaultValue;
                }
            }
            return defaultValue;
        }

        public void SetData(string key, object value)
        {
            Data[key] = value;
        }
    }

    /// <summary>
    /// Response message from Nova operations
    /// </summary>
    [Serializable]
    public class NovaResponse : NovaMessage
    {
        public bool Success { get; set; }
        public string ErrorMessage { get; set; }
        public int ErrorCode { get; set; }

        public NovaResponse() : base() { }

        public NovaResponse(bool success, string sourceProduct = "Nova.Core", string targetProduct = "Client")
            : base(Constants.MessageTypes.Response, sourceProduct, targetProduct)
        {
            Success = success;
        }
    }

    /// <summary>
    /// User information for authentication
    /// </summary>
    [Serializable]
    public class UserInfo
    {
        public string UserId { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public bool IsAuthenticated { get; set; }
        public DateTime LoginTime { get; set; }
        public string AuthToken { get; set; }
        public Dictionary<string, object> Profile { get; set; } = new Dictionary<string, object>();
        
        // Discord-specific properties
        public string DiscordId { get; set; }
        public string GlobalName { get; set; }
        public string AvatarUrl { get; set; }
        public string DisplayName { get; set; }
        public string Image { get; set; } // Base64 encoded profile picture
        public DateTime CreatedAt { get; set; }
        
        // Local preferences (stored in registry/local storage)
        public Dictionary<string, object> LocalPreferences { get; set; } = new Dictionary<string, object>();
    }

    /// <summary>
    /// Database request for operations
    /// </summary>
    [Serializable]
    public class DatabaseRequest
    {
        public string Operation { get; set; }
        public string Collection { get; set; }
        public Dictionary<string, object> Filter { get; set; } = new Dictionary<string, object>();
        public Dictionary<string, object> Data { get; set; } = new Dictionary<string, object>();
        public Dictionary<string, object> Options { get; set; } = new Dictionary<string, object>();
    }

    /// <summary>
    /// Update information
    /// </summary>
    [Serializable]
    public class UpdateInfo
    {
        public string ProductName { get; set; }
        public string CurrentVersion { get; set; }
        public string LatestVersion { get; set; }
        public bool UpdateAvailable { get; set; }
        public string UpdateDescription { get; set; }
        public long UpdateSize { get; set; }
        public string DownloadUrl { get; set; }
        public DateTime ReleaseDate { get; set; }
        public bool IsCritical { get; set; }
    }

    /// <summary>
    /// Factory for creating common messages
    /// </summary>
    public static class MessageFactory
    {
        public static NovaMessage CreateProductRegister(string productName, string version, string installPath, int processId = 0)
        {
            var message = new NovaMessage(Constants.MessageTypes.ProductRegister, productName, Constants.Products.Core);
            message.SetData("ProductName", productName);
            message.SetData("Version", version);
            message.SetData("InstallPath", installPath);
            message.SetData("ProcessId", processId);
            return message;
        }

        public static NovaMessage CreateAuthRequest(string username, string password)
        {
            var message = new NovaMessage(Constants.MessageTypes.AuthRequest, "Client", Constants.Products.Core);
            message.SetData("Username", username);
            message.SetData("Password", password);
            return message;
        }

        public static NovaResponse CreateAuthResponse(bool success, UserInfo user = null, string error = null)
        {
            var response = new NovaResponse(success);
            if (user != null)
                response.SetData("User", user);
            if (!string.IsNullOrEmpty(error))
                response.ErrorMessage = error;
            return response;
        }

        public static NovaMessage CreateProductLaunch(string productName)
        {
            var message = new NovaMessage(Constants.MessageTypes.ProductLaunch, "Client", Constants.Products.Core);
            message.SetData("ProductName", productName);
            return message;
        }

        public static NovaMessage CreateHeartbeat(string sourceProduct)
        {
            return new NovaMessage(Constants.MessageTypes.Heartbeat, sourceProduct, Constants.Products.Core);
        }

        public static NovaMessage CreateGetProducts(string sourceProduct)
        {
            return new NovaMessage(Constants.MessageTypes.GetProducts, sourceProduct, Constants.Products.Core);
        }
    }
}