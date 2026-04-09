import React, { useState, useEffect } from "react";
import { FontAwesomeIcons } from "#components";
import useCookieConsent from "../../../hooks/useCookieConsent";
import "./CookieConsent.scss";

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);
  const { consentGiven, isLoaded, updatePreferences } = useCookieConsent();

  useEffect(() => {
    // Only show consent after data is loaded and user hasn't given consent
    if (isLoaded && !consentGiven) {
      setShowConsent(true);
    } else if (isLoaded && consentGiven) {
      setShowConsent(false);
    }
  }, [consentGiven, isLoaded]);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };

    updatePreferences(allAccepted);
    setShowConsent(false);
  };

  // Don't render anything until data is loaded
  if (!isLoaded) return null;

  if (!showConsent) return null;

  return (
    <div
      className="cookie-consent-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="cookie-consent-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cookie-consent-main">
          <div className="cookie-icon">
            <FontAwesomeIcons name="cookie" />
          </div>

          <div className="cookie-content">
            <h3 className="cookie-title">We use cookies</h3>
            <p className="cookie-description">
              We use cookies to enhance your browsing experience, serve
              personalized content, and analyze our traffic. By clicking "Accept
              All", you consent to our use of cookies.
            </p>

            <div className="cookie-actions">
              <button
                className="cookie-btn cookie-btn-accept"
                onClick={handleAcceptAll}
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
