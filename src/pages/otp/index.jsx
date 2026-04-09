import { IconRegistry } from "#components";
import React from "react";
import UserOtp from "./otp";
import "./otp.scss";
import { ButtonLoader, TermsModal } from "#components";

const Otp = () => {
  const {
    customerID,
    handleSubmit,
    formData,
    formErrors,
    handleChange,
    companyDetails,
    showTermsModal,
    handleCloseTermsModal,
    handleShowTermsModal,
    loading,
    timeLeft,
    isRunning,
    startTimer,
    loginMode,
    handleResendOtp,
    resendLoading,
  } = UserOtp();

  return (
    <div className="h-100vh modern-otp-page">
      <div className="otp-container">
        {/* Left Section - Welcome Message */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1 className="welcome-title">Verify OTP</h1>
            <p className="welcome-description">
              {loginMode === "mobile" ? (
                <>
                  Your One-Time Password (OTP) is <strong>{'{####}'}</strong>.
                  <br /><br />
                  Please enter this code to complete your login and securely access your QuickAlgo+ trading dashboard.
                  <br /><br />
                  ⚠️ Do not share this OTP with anyone for your account's safety.
                </>
              ) : (
                <>
                  We've sent a verification code to your registered email and Client
                  ID. Enter the OTP below to complete your login and access your
                  QuickAlgo+ trading dashboard securely.
                </>
              )}
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

        {/* Right Section - OTP Form */}
        <div className="form-section">
          <div className="form-container">
            <h2 className="otp-title">Enter OTP</h2>
            <p className="otp-subtitle">
              OTP has been sent to your registered email address and mobile.
            </p>

            <form onSubmit={handleSubmit} className="otp-form">
              <div className="form-group">
                <label htmlFor="otp" className="form-label">
                  OTP Code
                </label>
                <div className="input-group">
                  <span className="input-icon">
                    <IconRegistry name="calculator" />
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter OTP"
                    name="OTP"
                    id="otp"
                    value={formData?.OTP}
                    onChange={handleChange}
                  />
                </div>
                {formErrors?.OTP && (
                  <div className="error-message">{formErrors?.OTP}</div>
                )}
              </div>

              <div className="resend-section">
                <button
                  type="button"
                  className="resend-button"
                  onClick={handleResendOtp}
                  disabled={isRunning || resendLoading}
                >
                  {resendLoading ? (
                    "Sending OTP..."
                  ) : isRunning ? (
                    `Resend OTP in ${timeLeft}s`
                  ) : (
                    "Resend OTP"
                  )}
                </button>
              </div>

              <div className="terms-section">
                <p className="terms-text">
                  By entering OTP, I agree to{" "}
                  <span className="company-name">
                    {companyDetails?.companyName}
                  </span>{" "}
                  <a
                    href="https://github.com/QuickAlgoPlus/quickalgoplus_agreements/blob/main/TermsOfService.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="term_condition"
                  >
                    TERMS AND CONDITIONS
                  </a>
                </p>
              </div>

              <button
                type="submit"
                className="proceed-button"
                disabled={loading}
              >
                {loading ? (
                  <ButtonLoader isloading={true} />
                ) : (
                  "Proceed to Dashboard"
                )}
              </button>
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
    </div>
  );
};

export default Otp;
