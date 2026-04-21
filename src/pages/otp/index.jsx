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
   <div className="container-fluid min-vh-100 d-flex align-items-center">
  <div className="row w-100">

    {/* LEFT SIDE */}
    <div className="col-md-6 d-none d-md-flex flex-column justify-content-center p-5">
      <h2 className="fw-bold mb-3">Verify OTP</h2>

      <p className="text-muted">
        {loginMode === "mobile" ? (
          <>
            Your One-Time Password (OTP) is <strong>{'{####}'}</strong>.
            <br /><br />
            Enter this code to securely access your dashboard.
            <br /><br />
            <span className="text-danger">
              Do not share this OTP with anyone.
            </span>
          </>
        ) : null}
      </p>

      <div className="mt-4 small text-muted">
        <p className="mb-1">
          Copyright © 2021-{new Date().getFullYear()} QUICK ALGO+. All rights reserved.
        </p>
      </div>
    </div>

    {/* RIGHT SIDE */}
    <div className="col-md-6 d-flex align-items-center justify-content-center">
      <div className="card  w-100 mx-auto otp-card">
        <div className="card-body p-4">

          <h4 className="text-center mb-2">Enter OTP</h4>
          <p className="text-center text-muted small mb-4">
            OTP sent to your registered email and mobile
          </p>

          <form onSubmit={handleSubmit}>

            {/* OTP Input */}
            <div className="mb-3">
              <label className="form-label">OTP Code</label>
              <div className="input-group">
                <span className="input-group-text">
                  <IconRegistry name="calculator" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter OTP"
                  name="OTP"
                  value={formData?.OTP}
                  onChange={handleChange}
                />
              </div>

              {formErrors?.OTP && (
                <div className="text-danger small">
                  {formErrors?.OTP}
                </div>
              )}
            </div>

            {/* Resend */}
            <div className="text-end mb-3">
              <button
                type="button"
  className="btn btn-primary btn-sm"
  onClick={handleResendOtp}
  disabled={isRunning || resendLoading}
>
  {resendLoading && (
    <>
      <span className="spinner-border spinner-border-sm me-2" role="status" />
      Sending OTP...
    </>
  )}

  {!resendLoading && isRunning && `Resend in ${timeLeft}s`}

  {!resendLoading && !isRunning && "Resend OTP"}
              </button>
            </div>

            {/* Terms */}
            <p className="small text-muted mb-3">
              By entering OTP, I agree to{" "}
              <strong>{companyDetails?.companyName}</strong>{" "}
              <a
                href="https://github.com/QuickAlgoPlus/quickalgoplus_agreements/blob/main/TermsOfService.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms & Conditions
              </a>
            </p>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? <ButtonLoader isloading /> : "Proceed to Dashboard"}
            </button>

          </form>
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

export default Otp;
