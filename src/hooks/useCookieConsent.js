import { useState, useEffect } from 'react';

const useCookieConsent = () => {
  const [consentGiven, setConsentGiven] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedConsent = localStorage.getItem('cookieConsent');
    
    if (savedConsent) {
      try {
        JSON.parse(savedConsent);
        setConsentGiven(true);
      } catch (error) {
        setConsentGiven(false);
      }
    } else {
      setConsentGiven(false);
    }
    
    setIsLoaded(true);
  }, []);

  const updatePreferences = (newPreferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify(newPreferences));
    setConsentGiven(true);
  };

  return {
    consentGiven,
    isLoaded,
    updatePreferences,
  };
};

export default useCookieConsent;
