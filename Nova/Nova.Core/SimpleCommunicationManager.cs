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
    /// Simplified communication manager that focuses on direct product-to-service communication
    /// Products send messages directly to the NovaService, which responds back
    /// </summary>
    public class SimpleCommunicationManager : IDisposable
    {
        private readonly bool _isService;
        private readonly string _servicePipeName = "Nova.Service.IPC";
        private NamedPipeServerStream _server;
        private readonly List<Task> _clientTasks = new List<Task>();
        private readonly CancellationTokenSource _cancellationTokenSource = new CancellationTokenSource();
        private bool _isRunning = false;

        public event EventHandler<NovaMessage> MessageReceived;

        public SimpleCommunicationManager(bool isService = false)
        {
            _isService = isService;
            Logger.Info($"Communication manager initialized (Service: {isService})", "SimpleCommunicationManager");
        }

        /// <summary>
        /// Start communication system
        /// For service: starts listening for connections
        /// For clients: does nothing (clients connect when sending)
        /// </summary>
        public void Start()
        {
            if (_isService && !_isRunning)
            {
                _isRunning = true;
                _ = Task.Run(ServiceListenerLoop);
                Logger.Info("Communication service started", "SimpleCommunicationManager");
            }
        }

        /// <summary>
        /// Stop communication system
        /// </summary>
        public void Stop()
        {
            try
            {
                _isRunning = false;
                _cancellationTokenSource.Cancel();

                // Close server
                _server?.Close();
                _server?.Dispose();

                // Wait for client tasks to complete
                Task.WaitAll(_clientTasks.ToArray(), TimeSpan.FromSeconds(5));

                Logger.Info("Communication manager stopped", "SimpleCommunicationManager");
            }
            catch (Exception ex)
            {
                Logger.Warning($"Error stopping communication manager: {ex.Message}", "SimpleCommunicationManager");
            }
        }

        /// <summary>
        /// Send message from product to service (or service response back to product)
        /// </summary>
        public async Task<NovaMessage> SendMessageAsync(string targetProduct, NovaMessage message)
        {
            if (_isService)
            {
                // Service doesn't send messages to products directly in this architecture
                // Products send to service, service responds
                Logger.Warning("Service attempted to send message - not supported in this architecture", "SimpleCommunicationManager");
                return null;
            }

            // Client sending to service
            return await SendToServiceAsync(message);
        }

        /// <summary>
        /// Broadcast message (only supported by service)
        /// </summary>
        public async Task<int> BroadcastMessageAsync(NovaMessage message)
        {
            if (!_isService)
            {
                Logger.Warning("Client attempted to broadcast - only service can broadcast", "SimpleCommunicationManager");
                return 0;
            }

            // For now, just log - broadcasting would require maintaining client connections
            Logger.Info($"Broadcasting message: {message.Type}", "SimpleCommunicationManager");
            return 0;
        }

        /// <summary>
        /// Service listener loop - handles incoming connections from products
        /// </summary>
        private async Task ServiceListenerLoop()
        {
            while (_isRunning && !_cancellationTokenSource.Token.IsCancellationRequested)
            {
                try
                {
                    _server = new NamedPipeServerStream(
                        _servicePipeName,
                        PipeDirection.InOut,
                        10, // Max instances
                        PipeTransmissionMode.Byte,
                        PipeOptions.Asynchronous);

                    Logger.Debug("Waiting for client connection...", "SimpleCommunicationManager");
                    await _server.WaitForConnectionAsync(_cancellationTokenSource.Token);

                    if (_server.IsConnected)
                    {
                        Logger.Debug("Client connected", "SimpleCommunicationManager");

                        // Handle this client in a separate task
                        var clientTask = Task.Run(async () => await HandleClientAsync(_server), _cancellationTokenSource.Token);
                        _clientTasks.Add(clientTask);

                        // Clean up completed tasks
                        _clientTasks.RemoveAll(t => t.IsCompleted);
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Logger.Warning($"Error in service listener: {ex.Message}", "SimpleCommunicationManager");
                    await Task.Delay(1000, _cancellationTokenSource.Token);
                }
            }
        }

        /// <summary>
        /// Handle individual client connection
        /// </summary>
        private async Task HandleClientAsync(NamedPipeServerStream client)
        {
            try
            {
                while (client.IsConnected && !_cancellationTokenSource.Token.IsCancellationRequested)
                {
                    // Read message from client
                    var message = await ReadMessageAsync(client);
                    if (message != null)
                    {
                        Logger.Debug($"Received message from {message.SourceProduct}: {message.Type}", "SimpleCommunicationManager");

                        // Notify listeners (NovaCore service)
                        MessageReceived?.Invoke(this, message);

                        // Send acknowledgment back to client
                        var ack = new NovaResponse(true, "Nova.Service", message.SourceProduct);
                        ack.SetData("Message", "Received");
                        await WriteMessageAsync(client, ack);
                    }
                    else
                    {
                        // Client disconnected
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                Logger.Debug($"Client disconnected: {ex.Message}", "SimpleCommunicationManager");
            }
            finally
            {
                try
                {
                    client.Close();
                    client.Dispose();
                }
                catch (Exception ex)
                {
                    Logger.Debug($"Error disposing client: {ex.Message}", "SimpleCommunicationManager");
                }
            }
        }

        /// <summary>
        /// Send message from product to service
        /// </summary>
        private async Task<NovaMessage> SendToServiceAsync(NovaMessage message)
        {
            NamedPipeClientStream client = null;
            try
            {
                client = new NamedPipeClientStream(".", _servicePipeName, PipeDirection.InOut);

                // Connect with timeout
                await client.ConnectAsync(Constants.PipeTimeoutMs);

                if (!client.IsConnected)
                {
                    Logger.Warning("Failed to connect to Nova Service", "SimpleCommunicationManager");
                    return null;
                }

                // Send message
                await WriteMessageAsync(client, message);

                // Read response
                var response = await ReadMessageAsync(client);

                Logger.Debug($"Sent message to service and received response", "SimpleCommunicationManager");
                return response;
            }
            catch (TimeoutException)
            {
                Logger.Warning("Timeout connecting to Nova Service", "SimpleCommunicationManager");
                return null;
            }
            catch (Exception ex)
            {
                Logger.Warning($"Error sending message to service: {ex.Message}", "SimpleCommunicationManager");
                return null;
            }
            finally
            {
                try
                {
                    client?.Close();
                    client?.Dispose();
                }
                catch (Exception ex)
                {
                    Logger.Debug($"Error disposing client connection: {ex.Message}", "SimpleCommunicationManager");
                }
            }
        }

        /// <summary>
        /// Read message from pipe stream
        /// </summary>
        private async Task<NovaMessage> ReadMessageAsync(Stream stream)
        {
            try
            {
                // Read message length (4 bytes)
                var lengthBytes = new byte[4];
                var bytesRead = await stream.ReadAsync(lengthBytes, 0, 4);
                if (bytesRead != 4)
                    return null;

                var messageLength = BitConverter.ToInt32(lengthBytes, 0);
                if (messageLength <= 0 || messageLength > 1024 * 1024) // Max 1MB
                    return null;

                // Read message content
                var messageBytes = new byte[messageLength];
                var totalRead = 0;
                while (totalRead < messageLength)
                {
                    var read = await stream.ReadAsync(messageBytes, totalRead, messageLength - totalRead);
                    if (read == 0)
                        return null;
                    totalRead += read;
                }

                // Deserialize message
                var json = Encoding.UTF8.GetString(messageBytes);
                return JsonConvert.DeserializeObject<NovaMessage>(json);
            }
            catch (Exception ex)
            {
                Logger.Debug($"Error reading message: {ex.Message}", "SimpleCommunicationManager");
                return null;
            }
        }

        /// <summary>
        /// Write message to pipe stream
        /// </summary>
        private async Task WriteMessageAsync(Stream stream, NovaMessage message)
        {
            try
            {
                // Serialize message
                var json = JsonConvert.SerializeObject(message);
                var messageBytes = Encoding.UTF8.GetBytes(json);

                // Write message length first
                var lengthBytes = BitConverter.GetBytes(messageBytes.Length);
                await stream.WriteAsync(lengthBytes, 0, lengthBytes.Length);

                // Write message content
                await stream.WriteAsync(messageBytes, 0, messageBytes.Length);
                await stream.FlushAsync();
            }
            catch (Exception ex)
            {
                Logger.Debug($"Error writing message: {ex.Message}", "SimpleCommunicationManager");
                throw;
            }
        }

        public void Dispose()
        {
            try
            {
                Stop();
                _cancellationTokenSource?.Dispose();
                _server?.Dispose();
            }
            catch (Exception ex)
            {
                Logger.Debug($"Error disposing communication manager: {ex.Message}", "SimpleCommunicationManager");
            }
        }
    }
}