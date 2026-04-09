import { IconRegistry } from "#components";
import React from "react";
import "./forgotPassword.scss";
import { ButtonLoader, TermsModal } from "#components";
import { NavLink } from "react-router-dom";
import useForgotPassword from "./forgotPassword";
import { LuMails } from "react-icons/lu";

const ForgotPassword = () => {
  const {
    handleSubmit,
    formData,
    formErrors,
    handleChange,
    companyDetails,
    showTermsModal,
    handleCloseTermsModal,
    handleShowTermsModal,
    loading,
    handleCheckboxChange,
    isChecked,
  } = useForgotPassword();

  return (
    <div className="h-100vh modern-forgot-page">
      <div className="forgot-container">
        {/* Left Section - Welcome Message */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1 className="welcome-title">Forgot Password?</h1>
            <p className="welcome-description">
              Enter your email address and we'll send your current password
            </p>
            
            {/* Copyright and TradingView attribution */}
            <div className="copyright-section-left">
              <p className="tradingview-text">
                Charts powered by{" "}
                <a href="https://in.tradingview.com/" target="_blank" rel="noopener noreferrer" className="tradingview-link">
                  TradingView
                </a>
              </p>
              <p className="copyright-text">
                Copyright © 2021-{new Date().getFullYear()} QUICK ALGO+. All rights reserved.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - Forgot Password Form */}
        <div className="form-section">
          <div className="form-container">
            <h2 className="forgot-title">Get Your Password</h2>
            <p className="forgot-subtitle">
              Enter your email address and we'll send your current password
            </p>
            
            <form onSubmit={handleSubmit} className="forgot-form">
              <div className="form-group">
                <label htmlFor="EmailId" className="form-label">Email Address</label>
                <div className="input-group">
                  <span className="input-icon">
                    <LuMails />
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your email address"
                    name="EmailId"
                    id="EmailId"
                    value={formData?.EmailId}
                    onChange={handleChange}
                  />
                </div>
                {formErrors?.EmailId && (
                  <div className="error-message">
                    {formErrors?.EmailId}
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
                className="reset-button"
                disabled={loading}
              >
                {loading ? (
                  <ButtonLoader isloading={true} />
                ) : (
                  "Send Current Password"
                )}
              </button>
            </form>

            <div className="form-footer">
              <p className="back-to-login">
                Remember your password?{" "}
                <NavLink to="/" className="login-link">
                  Back to Login
                </NavLink>
              </p>
            </div>
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
    </div>
  );
};

export default ForgotPassword;
