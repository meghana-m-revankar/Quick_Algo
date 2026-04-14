import Storage from "./storage";
import Cookies from "js-cookie";
 
class AuthService {
  constructor() {
    this.logoutCheckInterval = null;
    this.isInitialized = false;
    this.creatingReactChartToken = false; // Flag to prevent duplicate calls
    
    // Inactivity timeout variables - from environment variables with fallback defaults
    // REACT_APP_INACTIVITY_TIMEOUT: Total inactivity timeout in milliseconds (default: 300000 = 5 minutes)
    // REACT_APP_INACTIVITY_WARNING_TIME: Warning time in milliseconds before timeout (default: 240000 = 4 minutes)
    const inactivityTimeoutEnv = process.env.REACT_APP_INACTIVITY_TIMEOUT;
    const warningTimeoutEnv = process.env.REACT_APP_INACTIVITY_WARNING_TIME;
    
    this.inactivityTimeout = inactivityTimeoutEnv 
      ? parseInt(inactivityTimeoutEnv, 10) 
      : 300000; // Default: 5 minutes
    
    this.warningTimeout = warningTimeoutEnv 
      ? parseInt(warningTimeoutEnv, 10) 
      : 240000; // Default: 4 minutes
    
    // Validate values (must be positive numbers)
    if (isNaN(this.inactivityTimeout) || this.inactivityTimeout <= 0) {
      this.inactivityTimeout = 300000; // Fallback to default
    }
    if (isNaN(this.warningTimeout) || this.warningTimeout <= 0) {
      this.warningTimeout = 240000; // Fallback to default
    }
    
    // Ensure warning timeout is less than inactivity timeout
    if (this.warningTimeout >= this.inactivityTimeout) {
      this.warningTimeout = Math.max(240000, this.inactivityTimeout - 60000); // At least 1 min before timeout
    }
    this.inactivityTimer = null;
    this.warningTimer = null;
    this.inactivityCheckInterval = null;
    this.lastActivityTime = null;
    this.activityListeners = [];
    this.isWarningShown = false;
    this.activityDebounceTimer = null;
    this.debounceDelay = 1000; // Update activity every 1 second max
  }

  // Helper method to dispatch logout action (lazy import to avoid circular dependency)
  async dispatchLogout() {
    try {
      const { store } = await import("../redux/store");
      const { userLogout } = await import("../redux/auth/slice/authSlice");
      store.dispatch(userLogout());
    } catch (error) {
      console.error("Error dispatching logout:", error);
      // Fallback: manually clear tokens if Redux dispatch fails
      this.clearNodeTokens();
      this.clearReactChartTokens();
      this.stopIntervals();
    }
  }

  // Initialize auth service
  init() {
    if (this.isInitialized) return;
    
    this.startLogoutCheck();
    this.startInactivityTracking();
    this.isInitialized = true;
  }

  // Create Node.js token after ASP.NET login
  async createNodeToken(userData,customerID) {
    try {
      const apiUrl = process.env.REACT_APP_ENV === 'production' 
        ? process.env.REACT_APP_PRODUCTION_NODE_API_URL 
        : process.env.REACT_APP_NODE_API_URL;
      
      const response = await fetch(`${apiUrl}auth/createToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerID, // Ensure it's a number
          userName: userData.userName,
        }),
        credentials: 'include'
      });

      const result = await response.json();
      
      if (result.success) {
        // Store Node.js token
        localStorage.setItem("nodeToken", Storage.encryptData(result.token));
        Cookies.set("nodeAuthToken", result.token, {
          expires: 23 / 24, // 23 hours
          secure: true,
          sameSite: "strict"
        });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Create ReactChart token after ASP.NET login
  async createReactChartToken(userData, customerID, tokenID) {
    // Prevent duplicate concurrent calls
    if (this.creatingReactChartToken) {
     
      return false;
    }

    this.creatingReactChartToken = true;
   

    try {
      const apiUrl = process.env.REACT_APP_ENV === 'production' 
        ? process.env.REACT_APP_CHART_PRODUCTION_API_ENDPOINT 
        : process.env.REACT_APP_CHART_PRODUCTION_API_ENDPOINT;

      const requestUrl = `${apiUrl}/auth/createToken`;
     

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'customerId': tokenID ? `${customerID}:${tokenID}` : customerID,
        },
        body: JSON.stringify({
          customerId: customerID,
          userName: userData.userName,
        }),
        credentials: 'include'
      });

      // Handle non-ok responses (including 429)
      if (!response.ok) {
        let errorText = '';
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } catch (e) {
          errorText = await response.text().catch(() => 'Unable to read error response');
        }
        console.error('createReactChartToken: Request failed', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return false;
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('createReactChartToken: Failed to parse JSON response', jsonError);
        const textResponse = await response.text().catch(() => 'Unable to read response');
        console.error('createReactChartToken: Response text', textResponse);
        return false;
      }
      console.log('createReactChartToken: API response', { success: result.success, hasToken: !!result.token });
      
      if (result.success && result.token) {
        // Store ReactChart token with name cusToken
        localStorage.setItem("cusToken", Storage.encryptData(result.token));
        Cookies.set("cusToken", result.token, {
          expires: 23 / 24, // 23 hours
          secure: true,
          sameSite: "strict"
        });
        console.log('createReactChartToken: Token stored successfully');
        return true;
      } else {
        // If success is false, logout and redirect
        const errorMessage = result?.message || "Token creation failed. Please login again.";
        console.error('createReactChartToken: API returned success=false or no token', {
          success: result.success,
          hasToken: !!result.token,
          message: errorMessage,
          fullResult: result
        });
        return false;
      }
    } catch (error) {
      // On any error, log and return false
      console.error('createReactChartToken: Error occurred', error);
      return false;
    } finally {
      // Always reset the flag
      this.creatingReactChartToken = false;
    }
  }

  // Check if user should be logged out
  shouldLogout() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Logout at 12:00 AM
    return (currentHour === 0 && currentMinute === 0);
  }

  // Force logout
  forceLogout() {
    this.clearNodeTokens();
    this.clearReactChartTokens();
    this.stopIntervals();
    // Don't redirect - let ASP.NET handle it
  }

  // Clear only Node.js tokens
  clearNodeTokens() {
    localStorage.removeItem("nodeToken");
    Cookies.remove("nodeAuthToken");
  }

  // Clear only ReactChart tokens
  clearReactChartTokens() {
    localStorage.removeItem("cusToken");
    Cookies.remove("cusToken");
  }

  // Invalidate Node.js token on backend
  async invalidateNodeToken(customerId) {
    try {
      // Get current token before clearing
      //const currentToken = Storage.decryptData(localStorage.getItem("nodeToken"));
      const currentToken = localStorage.getItem("tokenID");
      const apiUrl = process.env.REACT_APP_ENV === 'production' 
        ? process.env.REACT_APP_PRODUCTION_NODE_API_URL 
        : process.env.REACT_APP_NODE_API_URL;
      
      const response = await fetch(`${apiUrl}auth/invalidateToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId,
          token: currentToken // Send token to add to blacklist
        }),
        credentials: 'include'
      });

      const result = await response.json();
      
      if (result.success) {
        // Also clear local tokens
        this.clearNodeTokens();
        return true;
      }
      return false;
    } catch (error) {
      // Even if backend fails, clear local tokens
      this.clearNodeTokens();
      return false;
    }
  }

  // Invalidate ReactChart token on backend
  async invalidateReactChartToken(customerId) {
    try {
      // Get current token before clearing
      const currentToken = Storage.decryptData(localStorage.getItem("cusToken"));
      
      const apiUrl = process.env.REACT_APP_ENV === 'production' 
        ? process.env.REACT_APP_CHART_PRODUCTION_API_ENDPOINT 
        : process.env.REACT_APP_CHART_API_ENDPOINT;
      
      const response = await fetch(`${apiUrl}auth/invalidateToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId,
          token: currentToken // Send token to add to blacklist
        }),
        credentials: 'include'
      });

      const result = await response.json();
      
      if (result.success) {
        // Also clear local tokens
        this.clearReactChartTokens();
        return true;
      }
      return false;
    } catch (error) {
      // Even if backend fails, clear local tokens
      this.clearReactChartTokens();
      return false;
    }
  }



  // Start logout check
  startLogoutCheck() {
    this.logoutCheckInterval = setInterval(() => {
      if (this.shouldLogout()) {
        this.forceLogout();
      }
    }, 60 * 1000); // Every minute
  }

  // Stop all intervals
  stopIntervals() {
    if (this.logoutCheckInterval) {
      clearInterval(this.logoutCheckInterval);
    }
  }

  // ========== INACTIVITY TIMEOUT METHODS ==========

  // Update last activity time (with debouncing)
  updateLastActivity() {
    // Check if user is still logged in
    const isLoggedIn = localStorage.getItem("customerID") && localStorage.getItem("tokenID");
    if (!isLoggedIn) {
      // User is not logged in, stop tracking
      this.stopInactivityTracking();
      return;
    }

    // Debounce: Only update once per second to avoid excessive localStorage writes
    if (this.activityDebounceTimer) {
      clearTimeout(this.activityDebounceTimer);
    }

    this.activityDebounceTimer = setTimeout(() => {
      const now = Date.now();
      this.lastActivityTime = now;
      
      // Store in localStorage for multi-tab support
      try {
        localStorage.setItem("lastActivityTime", now.toString());
      } catch (error) {
        console.error("Error storing lastActivityTime:", error);
      }

      // Reset warning flag if user becomes active again
      if (this.isWarningShown) {
        this.isWarningShown = false;
        this.hideWarning();
      }

      // Reset inactivity timer
      this.resetInactivityTimer();
    }, this.debounceDelay);
  }

  // Start inactivity tracking
  startInactivityTracking() {
    // Check if user is logged in before starting tracking
    // Only track inactivity for logged-in users
    const isLoggedIn = localStorage.getItem("customerID") && localStorage.getItem("tokenID");
    if (!isLoggedIn) {
      // User is not logged in, don't start tracking
      return;
    }

    // Initialize last activity time
    const storedTime = localStorage.getItem("lastActivityTime");
    if (storedTime) {
      this.lastActivityTime = parseInt(storedTime, 10);
    } else {
      this.lastActivityTime = Date.now();
      localStorage.setItem("lastActivityTime", this.lastActivityTime.toString());
    }

    // Set up event listeners for user activity
    this.setupActivityListeners();

    // Listen for activity from other tabs
    this.setupMultiTabListener();

    // Start the inactivity timer
    this.resetInactivityTimer();

    // Check inactivity every 10 seconds
    this.inactivityCheckInterval = setInterval(() => {
      this.checkInactivity();
    }, 10000); // Check every 10 seconds
  }

  // Set up event listeners for user activity
  setupActivityListeners() {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "wheel"
    ];

    const handleActivity = () => {
      this.updateLastActivity();
    };

    // Throttle mousemove to avoid excessive calls
    let mousemoveThrottle = null;
    const handleMouseMove = () => {
      if (!mousemoveThrottle) {
        mousemoveThrottle = setTimeout(() => {
          this.updateLastActivity();
          mousemoveThrottle = null;
        }, 2000); // Update every 2 seconds for mousemove
      }
    };

    events.forEach((event) => {
      const handler = event === "mousemove" ? handleMouseMove : handleActivity;
      document.addEventListener(event, handler, { passive: true });
      this.activityListeners.push({ event, handler });
    });

    // Also track visibility changes (tab focus)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        this.updateLastActivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    this.activityListeners.push({ event: "visibilitychange", handler: handleVisibilityChange });
  }

  // Set up listener for multi-tab support
  setupMultiTabListener() {
    const handleStorageChange = (e) => {
      if (e.key === "lastActivityTime") {
        const newTime = parseInt(e.newValue, 10);
        if (newTime && newTime > this.lastActivityTime) {
          this.lastActivityTime = newTime;
          // Reset warning if activity detected in another tab
          if (this.isWarningShown) {
            this.isWarningShown = false;
            this.hideWarning();
          }
          this.resetInactivityTimer();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    this.activityListeners.push({ event: "storage", handler: handleStorageChange });
  }

  // Reset inactivity timer
  resetInactivityTimer() {
    // Clear existing timers
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }

    // Set warning timer (4 minutes)
    this.warningTimer = setTimeout(() => {
      this.showWarning();
    }, this.warningTimeout);

    // Set inactivity timer (5 minutes)
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivityLogout();
    }, this.inactivityTimeout);
  }

  // Check inactivity status
  checkInactivity() {
    // Check if user is still logged in
    const isLoggedIn = localStorage.getItem("customerID") && localStorage.getItem("tokenID");
    if (!isLoggedIn) {
      // User is not logged in, stop tracking
      this.stopInactivityTracking();
      return;
    }

    if (!this.lastActivityTime) return;

    const now = Date.now();
    const inactiveTime = now - this.lastActivityTime;

    // If more than timeout period inactive, logout
    if (inactiveTime >= this.inactivityTimeout) {
      this.handleInactivityLogout();
    }
  }

  // Show warning message
  showWarning() {
    if (this.isWarningShown) return;
    
    this.isWarningShown = true;
    
    // Calculate remaining time in seconds
    const remainingTime = (this.inactivityTimeout - this.warningTimeout) / 1000; // Convert to seconds
    
    // Dispatch custom event for warning (components can listen to this)
    const warningEvent = new CustomEvent("inactivityWarning", {
      detail: { timeRemaining: Math.round(remainingTime) } // Remaining time in seconds
    });
    window.dispatchEvent(warningEvent);

    // Show browser notification if possible
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Session Expiring", {
        body: "Your session will expire in 1 minute due to inactivity.",
        icon: "/favicon.ico",
        tag: "inactivity-warning"
      });
    }
  }

  // Hide warning message
  hideWarning() {
    const hideEvent = new CustomEvent("inactivityWarningHide");
    window.dispatchEvent(hideEvent);
  }

  // Handle inactivity logout
  async handleInactivityLogout() {
    // Clear all timers
    this.stopInactivityTracking();

    // Show logout message
    const logoutEvent = new CustomEvent("inactivityLogout", {
      detail: { reason: "inactivity" }
    });
    window.dispatchEvent(logoutEvent);

    // Dispatch logout action
    await this.dispatchLogout();

    // Redirect to login page
    if (window.location.pathname !== "/") {
      window.location.href = "/";
    }
  }

  // Stop inactivity tracking
  stopInactivityTracking() {
    // Clear timers
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.activityDebounceTimer) {
      clearTimeout(this.activityDebounceTimer);
      this.activityDebounceTimer = null;
    }
    if (this.inactivityCheckInterval) {
      clearInterval(this.inactivityCheckInterval);
      this.inactivityCheckInterval = null;
    }

    // Remove event listeners
    this.activityListeners.forEach(({ event, handler }) => {
      if (event === "storage") {
        window.removeEventListener(event, handler);
      } else {
        document.removeEventListener(event, handler);
      }
    });
    this.activityListeners = [];

    // Clear localStorage
    try {
      localStorage.removeItem("lastActivityTime");
    } catch (error) {
      console.error("Error removing lastActivityTime:", error);
    }

    // Reset flags
    this.isWarningShown = false;
    this.lastActivityTime = null;
  }

  // Track API call as activity (called from axios interceptors)
  trackApiActivity() {
    this.updateLastActivity();
  }

  // ========== END INACTIVITY TIMEOUT METHODS ==========

  // Cleanup on unmount
  destroy() {
    this.stopIntervals();
    this.stopInactivityTracking();
    this.isInitialized = false;
  }
}

export default new AuthService();
