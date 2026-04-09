import {
  BrokerFooter,
  Header,
  RiskHomeModal,
} from "#components";
import { ChartPopupManager } from "./../components/chartPopup";
import { checkLogin } from "#helpers";
import { userLogout } from "#redux/auth/slice/authSlice.js";
import { GlobalServices } from "#services/global";
import { SignalRProvider } from "#services/signalR";
import useBrokerNavigation from "#hooks/useBrokerNavigation";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const Main = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  // Initialize broker navigation hook for localStorage cleanup
  useBrokerNavigation();

  const footerRoutes = ["setup", "broker"];

  // Scroll to top on route change
  const onTop = () => {
    window.scrollTo(0, 0);
  };

  const isFooterView = useMemo(() => {
    onTop();
    return footerRoutes.some((keyword) => location.pathname.includes(keyword));
  }, [location.pathname]);

  const { isUserLoggedIn } = useSelector((state) => state.userDetails);

  useEffect(() => {
    if (
      !isUserLoggedIn ||
      !localStorage.getItem("customerID") ||
      !localStorage.getItem("tokenID")
    ) {
      dispatch(userLogout());
    }
  }, []);

  // Clear page-specific caches on route change
  useEffect(() => {
    // Clear chart caches when navigating away from chart page
    if (location.pathname !== "/chart") {
      // Clear chart-related localStorage items
      if (localStorage.getItem("_symbol")) {
        localStorage.removeItem("_symbol");
      }
    }
  }, [location.pathname]);

  return checkLogin() ? (
    <SignalRProvider>
      <GlobalServices>
        <div className="main_content">
          <Header />
          <div className="container-full">
            <Outlet />
          </div>
          {isFooterView && <BrokerFooter />}
        </div>
        <RiskHomeModal />
        <ChartPopupManager />
      </GlobalServices>
    </SignalRProvider>
  ) : (
    <Navigate to="/" replace />
  );
};

export default Main;
