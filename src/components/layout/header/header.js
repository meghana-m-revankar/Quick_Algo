import useSymbolDetails from "#hooks/useSymbol";
import { userLogout } from "#redux/auth/slice/authSlice.js";
import { useGlobalServices } from "#services/global";
import { useContext, useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ThemeContext } from "../../../context";
import Storage from "#services/storage";
import { asyncGetCustomerUnReadNotification } from "#redux/global/action.js";
import { handleCatchErrors } from "#utils/validation";
import { useNavigate } from "react-router-dom";
import { checkLogin } from "#helpers";

const useHeader = () => {
  const { headerSymbol, isLoading } = useGlobalServices();
  const symbolValue = useSymbolDetails(headerSymbol);
  const { companyDetails } = useSelector((state) => state.companyDetails);
  const { isUserLoggedIn } = useSelector((state) => state.userDetails);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [unreadNotification, setUnreadNotification] = useState([]);

  const userName = Storage?.decryptData(localStorage.getItem("UserName"));
  const handleLogout = () => {
    dispatch(userLogout());
  };

  const { themeMode, setThemeMode } = useContext(ThemeContext);

  const isOn = false; // light mode only - dark disabled

  const toggleSwitch = () => {
    setThemeMode("light");
    document.body.classList.remove("dark-theme");
    localStorage.setItem("theme", "light");
  };

  // Helper function to check if user is authenticated
  const isAuthenticated = () => {
    return isUserLoggedIn && checkLogin();
  };

  const getUnreadNotification = useCallback(async () => {
    // Check authentication before making API call
    if (!isAuthenticated()) {
      // Header - User not authenticated, skipping notification fetch
      return;
    }

    await asyncGetCustomerUnReadNotification()
      .then((result) => {
        setUnreadNotification(result?.data?.result);
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      });
  }, [isUserLoggedIn, navigate]);

  useEffect(() => {
    getUnreadNotification();
  }, [getUnreadNotification]);

  return {
    companyDetails,
    handleLogout,
    headerSymbol,
    symbolValue,
    isLoading,
    toggleSwitch,
    isOn,
    userName,
    unreadNotification
  };
};

export default useHeader;
