using Microsoft.AspNetCore.Mvc;
using Nova.Hub.Service;
using Nova.Shared;
using Nova.Core;

namespace Nova.Hub.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly HubService _hubService;
        private readonly ILogger<ProductsController> _logger;

        public ProductsController(HubService hubService, ILogger<ProductsController> logger)
        {
            _hubService = hubService;
            _logger = logger;
        }

        /// <summary>
        /// Get all available products
        /// </summary>
        [HttpGet]
        public ActionResult<object> GetAllProducts()
        {
            try
            {
                var runningProducts = _hubService.RunningProducts;
                var installedProducts = _hubService.InstalledProducts;
                
                // Combine both lists for a complete view
                var allProducts = runningProducts.Concat(installedProducts).ToList();
                
                return Ok(new
                {
                    products = allProducts.Select(p => new
                    {
                        id = p.Id,
                        name = p.Name,
                        description = p.Description,
                        version = p.Version,
                        isInstalled = p.IsInstalled,
                        isRunning = p.Status == ProductStatus.Running,
                        category = "Nova Product" // Default category since Category might not exist
                    }),
                    totalCount = allProducts.Count,
                    installedCount = installedProducts.Count,
                    runningCount = runningProducts.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all products");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Launch a specific product
        /// </summary>
        [HttpPost("{id}/launch")]
        public async Task<ActionResult<object>> LaunchProduct(string id)
        {
            try
            {
                _logger.LogInformation("Launching product {ProductId} via API", id);
                
                var success = await _hubService.LaunchProduct(id);

                if (success)
                {
                return Ok(new { 
                        message = $"Product {id} launched successfully",
                        timestamp = DateTime.UtcNow
                    });
                }
                else
                {
                    return BadRequest(new { error = $"Failed to launch product {id}" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error launching product {ProductId}", id);
                return StatusCode(500, new { error = "Failed to launch product" });
            }
        }
    }
} 