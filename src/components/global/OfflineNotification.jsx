import React, { useState, useEffect } from 'react';
import './OfflineNotification.scss';

const OfflineNotification = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      document.body.classList.remove('offline-mode');
    };

    const handleOffline = () => {
      setIsOffline(true);
      document.body.classList.add('offline-mode');
    };

    // Set initial state
    const isCurrentlyOffline = !navigator.onLine;
    setIsOffline(isCurrentlyOffline);
    if (isCurrentlyOffline) {
      document.body.classList.add('offline-mode');
    } else {
      document.body.classList.remove('offline-mode');
    }

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.body.classList.remove('offline-mode');
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="offline-notification">
      <div className="offline-notification-content">
        <div className="offline-notification-icon">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="9" cy="9" r="9" className="offline-icon-circle"/>
            <path
              d="M9 5V9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 12H9.0075"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="offline-notification-text">
          <p className="offline-notification-title">You're offline. The markets aren't. Don't miss your move.</p>
        </div>
      </div>
    </div>
  );
};

export default OfflineNotification;
