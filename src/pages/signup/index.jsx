import { IconRegistry } from "#components";
import React from "react";
import { checkLogin } from "#helpers";
import "./signup.scss";
import { ButtonLoader, TermsModal, CookieConsent } from "#components";
import { useSelector } from "react-redux";
import { Navigate, NavLink } from "react-router-dom";
import UserSignUp from "./signup";

const Signup = () => {
  const {
    formData,
    formErrors,
    isPasswordVisible,
    handleChange,
    setIsPasswordVisible,
    handleSubmit,
    loading,
    showTermsModal,
    handleCloseTermsModal,
    handleShowTermsModal,
    companyDetails,
    handleCheckboxChange,
    isChecked,
  } = UserSignUp();

  const { isUserLoggedIn } = useSelector((state) => state.userDetails);

  if (isUserLoggedIn && checkLogin()) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="h-100vh modern-signup-page">
      <div className="signup-container">
        {/* Left Section - Welcome Message */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1 className="welcome-title">Join QuickAlgo+</h1>
            <p className="welcome-description">
              Start your trading journey with confidence. QuickAlgo+ provides
              you with the tools, knowledge, and emotional discipline needed to
              succeed in the markets. Join thousands of traders who have already
              transformed their trading experience.
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

        {/* Right Section - Sign Up Form */}
        <div className="form-section">
          <div className="form-container">
            <form onSubmit={handleSubmit} className="signup-form">
              <div className="form-group">
                <label htmlFor="FullName" className="form-label">
                  Full Name
                </label>
                <div className="input-group">
                  <span className="input-icon">
                    <IconRegistry name="user" />
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Full Name"
                    name="FullName"
                    id="FullName"
                    value={formData?.FullName}
                    onChange={handleChange}
                  />
                </div>
                {formErrors?.FullName && (
                  <div className="error-message">{formErrors?.FullName}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="Mobile" className="form-label">
                  Mobile Number
                </label>
                <div className="input-group">
                  <span className="input-icon">
                    <IconRegistry name="phone" />
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Mobile Number"
                    name="Mobile"
                    id="Mobile"
                    value={formData?.Mobile}
                    onChange={handleChange}
                  />
                </div>
                {formErrors?.Mobile && (
                  <div className="error-message">{formErrors?.Mobile}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="EmailId" className="form-label">
                  Email ID
                </label>
                <div className="input-group">
                  <span className="input-icon">
                    <IconRegistry name="mail" />
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Email ID"
                    name="EmailId"
                    id="EmailId"
                    value={formData?.EmailId}
                    onChange={handleChange}
                  />
                </div>
                {formErrors?.EmailId && (
                  <div className="error-message">{formErrors?.EmailId}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="EncryptedPassword" className="form-label">
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
                    name="EncryptedPassword"
                    id="EncryptedPassword"
                    value={formData?.EncryptedPassword}
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
                {formErrors?.EncryptedPassword && (
                  <div className="error-message">
                    {formErrors?.EncryptedPassword}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={isChecked}
                    onChange={handleCheckboxChange}
                    className="checkbox-input"
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-text">
                    I have read and accept the{" "}
                    <a
                      href="https://github.com/QuickAlgoPlus/quickalgoplus_agreements/blob/main/TermsOfService.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="term_condition"
                    >
                      Terms of Service
                    </a>
                  </span>
                </label>
                {formErrors?.terms_checkbox && (
                  <div className="error-message">
                    {formErrors?.terms_checkbox}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="signup-button"
                disabled={loading}
              >
                {loading ? <ButtonLoader isloading={true} /> : "Create Account"}
              </button>

              <p className="login-text">
                Already have an account?{" "}
                <NavLink to="/" className="login-link">
                  Sign In
                </NavLink>
              </p>
            </form>
          </div>
        </div>
      </div>

      {showTermsModal && (
        <TermsModal
          showTermsModal={showTermsModal}
          handleCloseTermsModal={handleCloseTermsModal}
          termsAndConditions={companyDetails?.termsAndConditions}
        />
      )}

      {/* Cookie Consent */}
      <CookieConsent />
    </div>
  );
};

export default Signup;
