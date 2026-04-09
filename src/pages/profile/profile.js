import { useContext, useState, useEffect } from 'react'
import { useDispatch, useSelector } from "react-redux";
import { userLogout } from "#redux/auth/slice/authSlice.js";
import Storage from "#services/storage";
import { asyncGetSubscriptionExpiry } from "#redux/user/action.js";
import { useNavigate } from "react-router-dom";
import { handleCatchErrors } from "#utils/validation";
import { useGlobalServices } from "#services/global";

const useProfile = () => {
    const { userDetail } = useSelector((state) => state.userDetails);
    const { companyDetails } = useSelector((state) => state.companyDetails);
    const { activeSubscriptionFeatures } = useGlobalServices();
    const [subscriptionExpiry, setSubscriptionExpiry] = useState(null);
    const navigate = useNavigate();

    console.log(userDetail, "userDetail");
    console.log(companyDetails, "companyDetails");
    console.log(activeSubscriptionFeatures, "activeSubscriptionFeatures");
    console.log(subscriptionExpiry, "subscriptionExpiry");
    

    const dispatch = useDispatch();
    const handleLogout = () => {
      dispatch(userLogout());
    };

    // Cache clearing functions
    const clearWebsiteCache = () => {
      const confirmed = window.confirm(
        'Are you sure you want to clear all website cache and cookies?'
      );
      
      if (!confirmed) return false;
      
      try {
        // Clear localStorage (but keep login data)
        const loginTime = localStorage.getItem("loginTime");
        const userData = localStorage.getItem("userData");
        const authToken = localStorage.getItem("authToken");
        
        localStorage.clear();
        
        // Restore important data to prevent logout
        if (loginTime) localStorage.setItem("loginTime", loginTime);
        if (userData) localStorage.setItem("userData", userData);
        if (authToken) localStorage.setItem("authToken", authToken);
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear service worker cache if available
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              caches.delete(name);
            });
          });
        }
        
        alert('Website cache cleared successfully! The page will reload.');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        return true;
      } catch (error) {
        alert('Error clearing website cache. Please try again.');
        return false;
      }
    };


    // Get login time from localStorage
    const getLoginTime = () => {
      const encryptedLoginTime = localStorage.getItem("loginTime");
      if (encryptedLoginTime) {
        const loginTime = Storage.decryptData(encryptedLoginTime);
        if (loginTime) {
          return new Date(loginTime).toLocaleString();
        }
      }
      return "Not available";
    };

    // Fetch subscription expiry
    useEffect(() => {
      asyncGetSubscriptionExpiry()
        .then((result) => {
          setSubscriptionExpiry(result?.data?.result);
        })
        .catch((err) => {
          handleCatchErrors(err, navigate);
        });
    }, [navigate]);
  
 
    
  return{
    userDetail,
    companyDetails,
    activeSubscriptionFeatures,
    subscriptionExpiry,
    handleLogout,
    loginTime: getLoginTime(),
    clearWebsiteCache
  }
}

export default useProfile
