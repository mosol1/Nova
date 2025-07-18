using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Pipes;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Nova.Shared;
using Nova.Shared.Messages;

namespace Nova.Core
{
    /// <summary>
    /// Async lock implementation for .NET Framework 4.8
    /// </summary>
    public class AsyncLock : IDisposable
    {
        private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

        public async Task<AsyncLock> LockAsync()
        {
            await _semaphore.WaitAsync();
            return this;
        }

        public void Dispose()
        {
            _semaphore.Release();
        }
    }

    /// <summary>
    /// Communication client for connecting to pipes
    /// </summary>
    public class CommunicationClient : IDisposable
    {
        private NamedPipeClientStream _client;
        private readonly string _pipeName;
        private bool _isConnected = false;

        public CommunicationClient(string pipeName)
        {
            _pipeName = pipeName;
        }

        public async Task<bool> ConnectAsync(int timeoutMs = Constants.PipeTimeoutMs)
        {
            try
            {
                _client = new NamedPipeClientStream(".", _pipeName, PipeDirection.InOut);
                await _client.ConnectAsync(timeoutMs);
                _isConnected = true;
                return true;
            }
            catch (Exception ex)
            {
                Logger.Warning($"Failed to connect to pipe {_pipeName}: {ex.Message}");
                _isConnected = false;
                return false;
            }
        }

        public async Task<bool> SendMessageAsync(NovaMessage message)
        {
            if (!_isConnected || _client == null)
                return false;

            try
            {
                var json = JsonConvert.SerializeObject(message);
                var data = Encoding.UTF8.GetBytes(json);
                var lengthBytes = BitConverter.GetBytes(data.Length);

                await _client.WriteAsync(lengthBytes, 0, lengthBytes.Length);
                await _client.WriteAsync(data, 0, data.Length);
                await _client.FlushAsync();

                Logger.Debug($"Sent message to {_pipeName}: {message.Type}");
                return true;
            }
            catch (Exception ex)
            {
                Logger.Warning($"Failed to send message to {_pipeName}: {ex.Message}");
                return false;
            }
        }

        public async Task<NovaMessage> ReceiveMessageAsync()
        {
            if (!_isConnected || _client == null)
                return null;

            try
            {
                var lengthBytes = new byte[4];
                await _client.ReadAsync(lengthBytes, 0, 4);
                var length = BitConverter.ToInt32(lengthBytes, 0);

                if (length <= 0 || length > 1024 * 1024)
                    return null;

                var data = new byte[length];
                await _client.ReadAsync(data, 0, length);
                var json = Encoding.UTF8.GetString(data);

                return JsonConvert.DeserializeObject<NovaMessage>(json);
            }
            catch (Exception ex)
            {
                Logger.Warning($"Failed to receive message from {_pipeName}: {ex.Message}");
                return null;
            }
        }

        public void Dispose()
        {
            try
            {
                _isConnected = false;
                _client?.Close();
                _client?.Dispose();
            }
            catch (Exception ex)
            {
                Logger.Debug($"Error disposing communication client: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Communication server for hosting pipes
    /// </summary>
    public class CommunicationServer : IDisposable
    {
        private readonly string _pipeName;
        private readonly List<NamedPipeServerStream> _servers;
        private readonly CancellationTokenSource _cancellationTokenSource;
        private readonly Task _serverTask;
        private bool _isRunning = false;
        private readonly AsyncLock _serverLock = new AsyncLock();

        public event EventHandler<NovaMessage> MessageReceived;

        public CommunicationServer(string pipeName)
        {
            _pipeName = pipeName;
            _servers = new List<NamedPipeServerStream>();
            _cancellationTokenSource = new CancellationTokenSource();
            _serverTask = Task.Run(ServerLoop);
        }

        public void Start()
        {
            _isRunning = true;
            Logger.Info($"Started communication server on pipe: {_pipeName}");
        }

        public void Stop()
        {
            _isRunning = false;
            _cancellationTokenSource.Cancel();
            Logger.Info($"Stopped communication server on pipe: {_pipeName}");
        }

        private async Task ServerLoop()
        {
            while (!_cancellationTokenSource.Token.IsCancellationRequested)
            {
                using (await _serverLock.LockAsync())
                {
                    try
                    {
                        if (!_isRunning)
                        {
                            await Task.Delay(1000, _cancellationTokenSource.Token);
                            continue;
                        }

                        var server = new NamedPipeServerStream(
                            _pipeName,
                            PipeDirection.InOut,
                            Constants.MaxPipeInstances,
                            PipeTransmissionMode.Byte,
                            PipeOptions.Asynchronous);

                        _servers.Add(server);

                        Logger.Debug($"Waiting for client connection on {_pipeName}");
                        await server.WaitForConnectionAsync(_cancellationTokenSource.Token);

                        if (server.IsConnected)
                        {
                            Logger.Debug($"Client connected to {_pipeName}");
                            _ = Task.Run(async () => await HandleClientAsync(server), _cancellationTokenSource.Token);
                        }
                    }
                    catch (OperationCanceledException)
                    {
                        break;
                    }
                    catch (Exception ex)
                    {
                        Logger.Warning($"Error in server loop for {_pipeName}: {ex.Message}");
                        await Task.Delay(1000, _cancellationTokenSource.Token);
                    }
                }
            }
        }

        private async Task HandleClientAsync(NamedPipeServerStream server)
        {
            try
            {
                while (server.IsConnected && !_cancellationTokenSource.Token.IsCancellationRequested)
                {
                    var message = await ReceiveMessageAsync(server);
                    if (message != null)
                    {
                        MessageReceived?.Invoke(this, message);

                        var ackMessage = new NovaMessage
                        {
                            Type = Constants.MessageTypes.Acknowledgment,
                            SourceProduct = "Nova.Core",
                            TargetProduct = message.SourceProduct,
                            Data = new Dictionary<string, object> { ["Status"] = "Received" }
                        };

                        await SendMessageAsync(server, ackMessage);
                    }
                }
            }
            catch (Exception ex)
            {
                Logger.Debug($"Client disconnected from {_pipeName}: {ex.Message}");
            }
            finally
            {
                try
                {
                    server.Close();
                    server.Dispose();
                    _servers.Remove(server);
                }
                catch
                {
                    // Ignore disposal errors
                }
            }
        }

        private async Task<NovaMessage> ReceiveMessageAsync(Stream stream)
        {
            try
            {
                var lengthBytes = new byte[4];
                await stream.ReadAsync(lengthBytes, 0, 4, _cancellationTokenSource.Token);
                var length = BitConverter.ToInt32(lengthBytes, 0);

                if (length <= 0 || length > 1024 * 1024)
                    return null;

                var data = new byte[length];
                await stream.ReadAsync(data, 0, length, _cancellationTokenSource.Token);
                var json = Encoding.UTF8.GetString(data);

                return JsonConvert.DeserializeObject<NovaMessage>(json);
            }
            catch (Exception ex)
            {
                Logger.Debug($"Error receiving message: {ex.Message}");
                return null;
            }
        }

        private async Task SendMessageAsync(Stream stream, NovaMessage message)
        {
            try
            {
                var json = JsonConvert.SerializeObject(message);
                var data = Encoding.UTF8.GetBytes(json);
                var lengthBytes = BitConverter.GetBytes(data.Length);

                await stream.WriteAsync(lengthBytes, 0, lengthBytes.Length, _cancellationTokenSource.Token);
                await stream.WriteAsync(data, 0, data.Length, _cancellationTokenSource.Token);
                await stream.FlushAsync(_cancellationTokenSource.Token);
            }
            catch (Exception ex)
            {
                Logger.Debug($"Error sending message: {ex.Message}");
            }
        }

        public void Dispose()
        {
            try
            {
                Stop();
                _cancellationTokenSource.Cancel();
                _serverTask?.Wait(5000);

                foreach (var server in _servers)
                {
                    try
                    {
                        server.Close();
                        server.Dispose();
                    }
                    catch
                    {
                        // Ignore disposal errors
                    }
                }

                _servers.Clear();
                _cancellationTokenSource.Dispose();
            }
            catch (Exception ex)
            {
                Logger.Debug($"Error disposing communication server: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Main communication manager for Nova Core
    /// </summary>
    public class CommunicationManager : IDisposable
    {
        private readonly CommunicationServer _server;
        private readonly Dictionary<string, CommunicationClient> _clients;
        private readonly object _clientLock = new object();
        private readonly AsyncLock _broadcastLock = new AsyncLock();

        public event EventHandler<NovaMessage> MessageReceived;

        public CommunicationManager()
        {
            _server = new CommunicationServer(Constants.CorePipeName);
            _clients = new Dictionary<string, CommunicationClient>();
            _server.MessageReceived += OnMessageReceived;
        }

        public void Start()
        {
            _server.Start();
            Logger.Info("Communication manager started");
        }

        public void Stop()
        {
            _server.Stop();

            lock (_clientLock)
            {
                foreach (var client in _clients.Values)
                {
                    client.Dispose();
                }
                _clients.Clear();
            }

            Logger.Info("Communication manager stopped");
        }

        public async Task<NovaMessage> SendMessageAsync(string targetProduct, NovaMessage message)
        {
            try
            {
                var client = await GetOrCreateClientAsync(targetProduct);
                if (client != null && await client.SendMessageAsync(message))
                {
                    // For now, return the original message as acknowledgment
                    // In a real implementation, you might wait for a response
                    return message;
                }
                return null;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to send message to {targetProduct}");
                return null;
            }
        }

        public async Task<int> BroadcastMessageAsync(NovaMessage message)
        {
            int successCount = 0;

            using (await _broadcastLock.LockAsync())
            {
                List<string> clientNames;
                lock (_clientLock)
                {
                    clientNames = new List<string>(_clients.Keys);
                }

                foreach (var clientName in clientNames)
                {
                    try
                    {
                        CommunicationClient client;
                        lock (_clientLock)
                        {
                            _clients.TryGetValue(clientName, out client);
                        }

                        if (client != null && await client.SendMessageAsync(message))
                        {
                            successCount++;
                        }
                    }
                    catch (Exception ex)
                    {
                        Logger.Warning($"Failed to broadcast to {clientName}: {ex.Message}");
                    }
                }
            }

            Logger.Debug($"Broadcast message sent to {successCount} clients");
            return successCount;
        }

        private async Task<CommunicationClient> GetOrCreateClientAsync(string targetProduct)
        {
            lock (_clientLock)
            {
                if (_clients.TryGetValue(targetProduct, out var client))
                {
                    return client;
                }

                var pipeName = $"Nova{targetProduct}IPC";
                var newClient = new CommunicationClient(pipeName);
                _clients[targetProduct] = newClient;

                Task.Run(async () =>
                {
                    if (!await newClient.ConnectAsync())
                    {
                        lock (_clientLock)
                        {
                            _clients.Remove(targetProduct);
                        }
                        newClient.Dispose();
                        Logger.Warning($"Failed to connect to {targetProduct}");
                    }
                    else
                    {
                        Logger.Info($"Connected to {targetProduct}");
                    }
                });

                return newClient;
            }
        }

        private void OnMessageReceived(object sender, NovaMessage message)
        {
            try
            {
                Logger.Debug($"Received message: {message.Type} from {message.SourceProduct}");

                switch (message.Type)
                {
                    case Constants.MessageTypes.ProductRegister:
                        HandleRegistrationMessage(message);
                        break;
                    case Constants.MessageTypes.Status:
                        HandleStatusMessage(message);
                        break;
                    case Constants.MessageTypes.Command:
                        HandleCommandMessage(message);
                        break;
                    case Constants.MessageTypes.Request:
                        HandleRequestMessage(message);
                        break;
                    default:
                        Logger.Debug($"Unhandled message type: {message.Type}");
                        break;
                }

                MessageReceived?.Invoke(this, message);
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Error handling received message");
            }
        }

        private void HandleRegistrationMessage(NovaMessage message)
        {
            try
            {
                if (message.Data.TryGetValue("ProductName", out var productName))
                {
                    Logger.Info($"Product registered: {productName}");
                    Task.Run(async () => await GetOrCreateClientAsync(productName.ToString()));
                }
            }
            catch (Exception ex)
            {
                Logger.Warning($"Error handling registration message: {ex.Message}");
            }
        }

        private void HandleStatusMessage(NovaMessage message)
        {
            try
            {
                Logger.Debug($"Status update from {message.SourceProduct}: {message.Data}");
            }
            catch (Exception ex)
            {
                Logger.Warning($"Error handling status message: {ex.Message}");
            }
        }

        private void HandleCommandMessage(NovaMessage message)
        {
            try
            {
                Logger.Debug($"Command from {message.SourceProduct}: {message.Data}");
            }
            catch (Exception ex)
            {
                Logger.Warning($"Error handling command message: {ex.Message}");
            }
        }

        private void HandleRequestMessage(NovaMessage message)
        {
            try
            {
                Logger.Debug($"Request from {message.SourceProduct}: {message.Data}");
            }
            catch (Exception ex)
            {
                Logger.Warning($"Error handling request message: {ex.Message}");
            }
        }

        public void Dispose()
        {
            try
            {
                Stop();
                _server?.Dispose();

                lock (_clientLock)
                {
                    foreach (var client in _clients.Values)
                    {
                        client.Dispose();
                    }
                    _clients.Clear();
                }
            }
            catch (Exception ex)
            {
                Logger.Warning($"Error disposing communication manager: {ex.Message}");
            }
        }
    }
}