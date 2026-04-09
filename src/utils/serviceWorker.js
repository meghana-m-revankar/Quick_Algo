// Service Worker Management Utility
class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isUpdateAvailable = false;
  }

  async register() {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      
      this.setupEventListeners();
      return true;
    } catch (error) {
      return false;
    }
  }

  setupEventListeners() {
    if (!this.registration) return;

    // Listen for updates
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          this.isUpdateAvailable = true;
          this.showUpdateNotification();
        }
      });
    });

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      this.isUpdateAvailable = false;
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'background-sync') {
        // Handle background sync completion
      }
    });
  }

  showUpdateNotification() {
    // Create a custom notification instead of using confirm
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    
    notification.innerHTML = `
      <div style="margin-bottom: 10px;">New version available!</div>
      <div style="display: flex; gap: 10px;">
        <button onclick="this.parentElement.parentElement.remove(); window.location.reload();" 
                style="background: white; color: #007bff; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
          Update
        </button>
        <button onclick="this.parentElement.parentElement.remove();" 
                style="background: transparent; color: white; border: 1px solid white; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
          Later
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  async unregister() {
    if (this.registration) {
      await this.registration.unregister();
    }
  }

  async update() {
    if (this.registration) {
      await this.registration.update();
    }
  }

  isSupported() {
    return 'serviceWorker' in navigator;
  }

  getRegistration() {
    return this.registration;
  }

  isUpdateAvailable() {
    return this.isUpdateAvailable;
  }
}

// Create and export instance
const serviceWorkerManager = new ServiceWorkerManager();

export default serviceWorkerManager; 