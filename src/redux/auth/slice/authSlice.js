import { createSlice } from "@reduxjs/toolkit";
import Storage from "#services/storage";
import Cookies from "js-cookie";
import AuthService from "#services/authService";

const initialState = {
  loading: false,
  userDetail: null,
  isUserLoggedIn: false,
  token: null,
  error: null,
  success: false,
};

const initialAuthState = initialState;

const authSlice = createSlice({
  name: "userAuth",
  initialState: initialAuthState,
  reducers: {
    userLoginSuccess: (state, action) => {
      const { data, customerId } = action.payload;
      state.loading = false;
      state.isUserLoggedIn = true;
      state.token = data?.tokenID;
      state.userDetail = data;
      state.error = null;

  

      
      // Store ASP.NET data (existing functionality)
      localStorage.setItem("customerID", Storage.encryptData(customerId));
      localStorage.setItem("UserName", Storage.encryptData(data?.userName));
      localStorage.setItem("tokenID", Storage.encryptData(data?.tokenID));
      localStorage.setItem("loginTime", Storage.encryptData(new Date().toISOString()));
      
      // Initialize Node.js auth service
      AuthService.init();
      
      // Note: ReactChart token creation is handled in otp.js after OTP verification
      // to avoid duplicate API calls and rate limiting issues
    },
    userLogout: (state) => {
      // Get customer ID before clearing
      const customerId = Storage.decryptData(localStorage.getItem("customerID"));
      
      // Clear ASP.NET data (existing functionality)
      localStorage.removeItem("customerID");
      // localStorage.removeItem("customerId");
      localStorage.removeItem("userName");
      localStorage.removeItem("tokenID");
      localStorage.removeItem("loginTime");
      localStorage.removeItem("riskHomeModal");
      
      // Clear broker setup data on logout
      Storage.clearBrokerSetupData();
      
      // Invalidate Node.js token on backend and clear local data
      if (customerId) {
        AuthService.invalidateNodeToken(customerId);
        AuthService.invalidateReactChartToken(customerId);
      } else {
        AuthService.clearNodeTokens();
        AuthService.clearReactChartTokens();
      }
      AuthService.destroy();
      
      // Reset state
      state.loading = false;
      state.isUserLoggedIn = false;
      state.token = null;
      state.userDetail = null;
      state.error = null;
      
      // Clear cookies
      Cookies.remove("authToken");
    },
  },
});

export const { userLoginSuccess, userLogout } = authSlice.actions;
export default authSlice.reducer;
