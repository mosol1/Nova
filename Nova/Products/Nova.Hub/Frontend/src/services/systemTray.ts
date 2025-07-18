import { invoke } from '@tauri-apps/api/core';

export interface SystemStatus {
  health: string;
  running_products: number;
  updates_available: number;
  uptime: string;
}

export interface TrayUpdateData {
  running_products: number;
  updates_available: number;
  system_health: string;
}

class SystemTrayService {
  private updateInterval: number | null = null;
  private readonly REFRESH_INTERVAL = 30000; // 30 seconds

  /**
   * Initialize the system tray service with periodic updates
   */
  async initialize(): Promise<void> {
    // Initial status update
    await this.refreshStatus();
    
    // Set up periodic updates
    this.startPeriodicUpdates();
  }

  /**
   * Update the system tray with current status
   */
  async updateTrayStatus(data: TrayUpdateData): Promise<void> {
    try {
      await invoke('update_tray_status', {
        runningProducts: data.running_products,
        updatesAvailable: data.updates_available,
        systemHealth: data.system_health,
      });
    } catch (error) {
      console.error('Failed to update tray status:', error);
    }
  }

  /**
   * Show the main window from system tray
   */
  async showMainWindow(): Promise<void> {
    try {
      await invoke('show_main_window');
    } catch (error) {
      console.error('Failed to show main window:', error);
    }
  }

  /**
   * Toggle window visibility
   */
  async toggleWindowVisibility(): Promise<void> {
    try {
      await invoke('toggle_window_visibility');
    } catch (error) {
      console.error('Failed to toggle window visibility:', error);
    }
  }

  /**
   * Get current system status
   */
  async getSystemStatus(): Promise<SystemStatus | null> {
    try {
      return await invoke('get_system_status');
    } catch (error) {
      console.error('Failed to get system status:', error);
      return null;
    }
  }

  /**
   * Refresh system status and update tray
   */
  async refreshStatus(): Promise<void> {
    try {
      // Get current system status
      const systemStatus = await this.getSystemStatus();
      if (!systemStatus) return;

      // Calculate running products and updates (mock data for now)
      const runningProducts = this.calculateRunningProducts();
      const updatesAvailable = this.calculateAvailableUpdates();

      // Update tray with current status
      await this.updateTrayStatus({
        running_products: runningProducts,
        updates_available: updatesAvailable,
        system_health: systemStatus.health,
      });
    } catch (error) {
      console.error('Failed to refresh status:', error);
    }
  }

  /**
   * Start periodic status updates
   */
  private startPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = window.setInterval(() => {
      this.refreshStatus();
    }, this.REFRESH_INTERVAL);
  }

  /**
   * Stop periodic updates
   */
  stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update tray with product status changes
   */
  async onProductStatusChange(productId: string, status: 'Running' | 'Stopped'): Promise<void> {
    // Refresh status after product status change
    await this.refreshStatus();
  }

  /**
   * Update tray when updates are available
   */
  async onUpdatesAvailable(updateCount: number): Promise<void> {
    const currentStatus = await this.getSystemStatus();
    if (currentStatus) {
      await this.updateTrayStatus({
        running_products: this.calculateRunningProducts(),
        updates_available: updateCount,
        system_health: currentStatus.health,
      });
    }
  }

  /**
   * Set system health status
   */
  async setSystemHealth(health: 'Optimal' | 'Warning' | 'Critical'): Promise<void> {
    await this.updateTrayStatus({
      running_products: this.calculateRunningProducts(),
      updates_available: this.calculateAvailableUpdates(),
      system_health: health,
    });
  }

  /**
   * Calculate number of running products (placeholder implementation)
   */
  private calculateRunningProducts(): number {
    // This would normally check actual product states
    // For now, return mock data based on localStorage or state
    const products = JSON.parse(localStorage.getItem('nova_products') || '[]');
    return products.filter((p: any) => p.status === 'Running').length;
  }

  /**
   * Calculate number of available updates (placeholder implementation)
   */
  private calculateAvailableUpdates(): number {
    // This would normally check with the update service
    // For now, return mock data
    return 0;
  }

  /**
   * Minimize to tray (hide window)
   */
  async minimizeToTray(): Promise<void> {
    try {
      await invoke('toggle_window_visibility');
    } catch (error) {
      console.error('Failed to minimize to tray:', error);
    }
  }

  /**
   * Cleanup service
   */
  destroy(): void {
    this.stopPeriodicUpdates();
  }
}

// Export singleton instance
export const systemTrayService = new SystemTrayService(); 