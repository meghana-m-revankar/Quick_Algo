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
   <div className="container-fluid min-vh-100 d-flex align-items-center">
  <div className="row w-100">

    {/* LEFT SIDE */}
    <div className="col-md-6 d-none d-md-flex flex-column justify-content-center p-5">
      <h2 className="fw-bold mb-3">Join QuickAlgo+</h2>
      <p className="text-muted d-none">
        Start your trading journey with confidence. QuickAlgo+ provides
        you with the tools, knowledge, and emotional discipline needed to
        succeed in the markets.
      </p>

      <div className="mt-4 small text-muted">
        <p className="mb-1">
          Copyright © 2021-{new Date().getFullYear()} QUICK ALGO+. All rights reserved.
        </p>
      </div>
    </div>

    {/* RIGHT SIDE */}
    <div className="col-md-6 d-flex align-items-center justify-content-center">
      <div className="card shadow-sm w-100">
        <div className="card-body p-4">

          <h4 className="mb-4 text-center">Create Account</h4>

          <form onSubmit={handleSubmit}>

            {/* Full Name */}
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <div className="input-group">
                <span className="input-group-text">
                  <IconRegistry name="user" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Full Name"
                  name="FullName"
                  value={formData?.FullName}
                  onChange={handleChange}
                />
              </div>
              {formErrors?.FullName && (
                <div className="text-danger small">{formErrors?.FullName}</div>
              )}
            </div>

            {/* Mobile */}
            <div className="mb-3">
              <label className="form-label">Mobile Number</label>
              <div className="input-group">
                <span className="input-group-text">
                  <IconRegistry name="phone" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Mobile Number"
                  name="Mobile"
                  value={formData?.Mobile}
                  onChange={handleChange}
                />
              </div>
              {formErrors?.Mobile && (
                <div className="text-danger small">{formErrors?.Mobile}</div>
              )}
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label">Email ID</label>
              <div className="input-group">
                <span className="input-group-text">
                  <IconRegistry name="mail" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Email"
                  name="EmailId"
                  value={formData?.EmailId}
                  onChange={handleChange}
                />
              </div>
              {formErrors?.EmailId && (
                <div className="text-danger small">{formErrors?.EmailId}</div>
              )}
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="form-label">Password</label>
              <div className="input-group">
                <span className="input-group-text">
                  <IconRegistry name="lock" />
                </span>
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  className="form-control"
                  placeholder="Enter password"
                  name="EncryptedPassword"
                  value={formData?.EncryptedPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <IconRegistry name={isPasswordVisible ? "eye" : "eye-low-vision"} />
                </button>
              </div>
              {formErrors?.EncryptedPassword && (
                <div className="text-danger small">
                  {formErrors?.EncryptedPassword}
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                checked={isChecked}
                onChange={handleCheckboxChange}
                id="terms"
              />
              <label className="form-check-label small">
                I accept the{" "}
                <a
                  href="https://github.com/QuickAlgoPlus/quickalgoplus_agreements/blob/main/TermsOfService.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </a>
              </label>

              {formErrors?.terms_checkbox && (
                <div className="text-danger small">
                  {formErrors?.terms_checkbox}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? <ButtonLoader isloading /> : "Create Account"}
            </button>

            {/* Login */}
            <p className="text-center mt-3 small">
              Already have an account?{" "}
              <NavLink to="/">Sign In</NavLink>
            </p>

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

  <CookieConsent />
</div>
  );
};

export default Signup;
