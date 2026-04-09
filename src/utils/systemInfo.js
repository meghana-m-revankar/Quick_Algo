/**
 * System Information Detection Utility
 * Uses ua-parser-js library for accurate OS, browser, and device detection
 */

import UAParser from 'ua-parser-js';

export const detectSystemInfo = () => {
  const parser = new UAParser();
  const result = parser.getResult();
  
  // Get additional system information
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const screenResolution = `${screenWidth}x${screenHeight}`;
  const language = navigator.language || navigator.userLanguage;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const platform = navigator.platform;
  const userAgent = navigator.userAgent;

  return {
    os: result.os.name || "Unknown OS",
    osVersion: result.os.version || "",
    browser: result.browser.name || "Unknown Browser",
    browserVersion: result.browser.version || "",
    deviceType: result.device.type || "desktop",
    device: result.device.model || "",
    userAgent: result.ua,
    platform,
    screenResolution,
    language,
    timezone,
    screenWidth,
    screenHeight,
    // Additional parsed info
    cpu: result.cpu.architecture || "",
    engine: result.engine.name || "",
    engineVersion: result.engine.version || ""
  };
};

export const getDeviceManufacturer = (os) => {
  switch (os) {
    case "macOS":
      return "Apple";
    case "iOS":
      return "Apple";
    case "Android":
      return "Android Device";
    case "Windows":
      return "PC";
    case "Linux":
      return "Linux PC";
    default:
      return "Unknown";
  }
};

export const formatDeviceName = (os, osVersion, manufacturer) => {
  if (os === "macOS") {
    return `${manufacturer} (${os} ${osVersion})`;
  } else if (os === "Windows") {
    return `${manufacturer} (${os} ${osVersion})`;
  } else if (os === "Android") {
    return `${manufacturer} ${osVersion}`;
  } else if (os === "iOS") {
    return `${manufacturer} (${os} ${osVersion})`;
  } else {
    return `${manufacturer} (${os} ${osVersion})`;
  }
};

export const getCurrentSessionInfo = () => {
  const systemInfo = detectSystemInfo();
  const manufacturer = getDeviceManufacturer(systemInfo.os);
  const deviceName = formatDeviceName(systemInfo.os, systemInfo.osVersion, manufacturer);
  
  return {
    id: Date.now(),
    device: deviceName,
    browser: systemInfo.browser,
    browserVersion: systemInfo.browserVersion,
    lastActivity: "less than a minute ago",
    isCurrent: true,
    deviceType: systemInfo.deviceType,
    os: systemInfo.os,
    osVersion: systemInfo.osVersion,
    userAgent: systemInfo.userAgent,
    platform: systemInfo.platform,
    screenResolution: systemInfo.screenResolution,
    language: systemInfo.language,
    timezone: systemInfo.timezone,
    cpu: systemInfo.cpu,
    engine: systemInfo.engine,
    engineVersion: systemInfo.engineVersion
  };
};

// Enhanced function to get detailed system information
export const getDetailedSystemInfo = () => {
  const parser = new UAParser();
  const result = parser.getResult();
  
  return {
    // Basic info
    os: result.os.name,
    osVersion: result.os.version,
    browser: result.browser.name,
    browserVersion: result.browser.version,
    device: result.device.model,
    deviceType: result.device.type,
    deviceVendor: result.device.vendor,
    
    // Engine info
    engine: result.engine.name,
    engineVersion: result.engine.version,
    
    // CPU info
    cpu: result.cpu.architecture,
    
    // Screen info
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    
    // Browser info
    language: navigator.language || navigator.userLanguage,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    
    // Additional browser capabilities
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
    doNotTrack: navigator.doNotTrack,
    
    // Performance info
    hardwareConcurrency: navigator.hardwareConcurrency,
    maxTouchPoints: navigator.maxTouchPoints,
    
    // Connection info
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    } : null
  };
};

// Function to get device icon based on device type
export const getDeviceIconType = (deviceType) => {
  switch (deviceType) {
    case "mobile":
      return "mobile";
    case "tablet":
      return "tablet";
    case "console":
      return "console";
    case "smarttv":
      return "tv";
    case "wearable":
      return "watch";
    default:
      return "desktop";
  }
};

// Function to format browser name with version
export const formatBrowserName = (browser, version) => {
  if (!browser) return "Unknown Browser";
  if (!version) return browser;
  return `${browser} ${version}`;
};

// Function to get device category for display
export const getDeviceCategory = (deviceType) => {
  switch (deviceType) {
    case "mobile":
      return "Mobile Device";
    case "tablet":
      return "Tablet";
    case "console":
      return "Gaming Console";
    case "smarttv":
      return "Smart TV";
    case "wearable":
      return "Wearable Device";
    default:
      return "Desktop Computer";
  }
}; 