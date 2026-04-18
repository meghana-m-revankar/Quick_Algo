import { IconRegistry } from "#components";
import React from "react";
import { checkLogin } from "#helpers";
import "./login.scss";
import UserLogin from "./login";
import { ButtonLoader, CookieConsent } from "#components";
import { useSelector } from "react-redux";
import { Navigate, NavLink } from "react-router-dom";

const Login = () => {
  const {
    formData,
    formErrors,
    isPasswordVisible,
    handleChange,
    setIsPasswordVisible,
    handleSubmit,
    loading,
    loginMode,
    setLoginMode,
  } = UserLogin();

  const { isUserLoggedIn } = useSelector((state) => state.userDetails);

  if (isUserLoggedIn && checkLogin()) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="h-100vh modern-login-page">
      <div className="login-container">
        {/* Left Section - Welcome Message */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1 className="welcome-title">Welcome Back</h1>
            <p className="welcome-description">
              Trade smart, control your emotions, and make decisions with a calm
              mind—With QuickAlgo+, you not only understand the market but also
              take every step toward successful trading. QuickAlgo+ software is
              fully tested, reliable, and designed to manage emotions, making
              errors highly unlikely.
            </p>

            {/* Copyright and TradingView attribution */}
            <div className="copyright-section-left">
              <p className="tradingview-text">
                Charts powered by{" "}
                <a
                  href="https://in.tradingview.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tradingview-link"
                >
                  TradingView
                </a>
              </p>
              <p className="copyright-text">
                Copyright © 2021-{new Date().getFullYear()} QUICK ALGO+. All
                rights reserved.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - Sign In Form */}
        <div className="form-section">
          <div className="form-container">
            <h2 className="signin-title">Sign in</h2>

            {/* Login Mode Toggle */}
            <div className="login-mode-toggle d-none">
              <button
                type="button"
                className={`toggle-btn ${
                  loginMode === "username" ? "active" : ""
                }`}
                onClick={() => setLoginMode("username")}
              >
                Username
              </button>
              <button
                type="button"
                className={`toggle-btn ${
                  loginMode === "mobile" ? "active" : ""
                }`}
                onClick={() => setLoginMode("mobile")}
              >
                Mobile OTP
              </button>
            </div>

            <form onSubmit={handleSubmit} className="signin-form">
              {loginMode === "username" ? (
                <>
                  <div className="form-group">
                    <label htmlFor="Username" className="form-label">
                      Username
                    </label>
                    <div className="input-group">
                      <span className="input-icon">
                        <IconRegistry name="user" />
                      </span>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter Username"
                        name="Username"
                        id="Username"
                        value={formData?.Username}
                        onChange={handleChange}
                      />
                    </div>
                    {formErrors?.Username && (
                      <div className="error-message">
                        {formErrors?.Username}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="Password" className="form-label">
                      Password
                    </label>
                    <div className="input-group">
                      <span className="input-icon">
                        <IconRegistry name="lock" />
                      </span>
                      <input
                        type={isPasswordVisible ? "text" : "password"}
                        className="form-input"
                        placeholder="Enter password"
                        name="Password"
                        id="Password"
                        value={formData?.Password}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      >
                        {!isPasswordVisible ? (
                          <IconRegistry name="eye-low-vision" />
                        ) : (
                          <IconRegistry name="eye" />
                        )}
                      </button>
                    </div>
                    {formErrors?.Password && (
                      <div className="error-message">
                        {formErrors?.Password}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="form-group d-none">
                  <label htmlFor="MobileNo" className="form-label">
                    Mobile Number
                  </label>
                  <div className="input-group">
                    <span className="input-icon">
                      <IconRegistry name="user" />
                    </span>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Enter 10-digit mobile number"
                      name="MobileNo"
                      id="MobileNo"
                      value={formData?.MobileNo}
                      onChange={handleChange}
                      maxLength="10"
                    />
                  </div>
                  {formErrors?.MobileNo && (
                    <div className="error-message">{formErrors?.MobileNo}</div>
                  )}
                </div>
              )}

              <div className="form-options">
                <label className="checkbox-container">
                  <input type="checkbox" className="checkbox-input" />
                  <span className="checkmark"></span>
                  Remember Me
                </label>
                {/* <NavLink to="/forgot-password" className="forgot-password">
                  Lost your password?
                </NavLink> */}
              </div>

              <button
                type="submit"
                className="signin-button"
                disabled={loading}
              >
                {loading ? (
                  <ButtonLoader isloading={true} />
                ) : loginMode === "username" ? (
                  "SEND OTP"
                ) : (
                  "Send OTP"
                )}
              </button>
            </form>

            <div className="form-footer">
              <p className="terms-text">
                By clicking on "
                <span style={{ color: "#2C6DEE" }}>SEND OTP</span>" you agree to{" "}
                <a
                  href="https://github.com/QuickAlgoPlus/quickalgoplus_agreements/blob/main/TermsOfService.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="terms-link"
                >
                  Terms of Service
                </a>
              </p>

              <p className="register-text">
                Don't have an account?{" "}
                <NavLink to="/signup" className="register-link">
                  Register Now
                </NavLink>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Consent */}
      <CookieConsent />
    </div>
  );
};

export default Login;
