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
    <div className="container-fluid min-vh-100 d-flex align-items-center">
  <div className="row w-100">

    {/* LEFT SIDE */}
    <div className="col-md-6 d-none d-md-flex flex-column justify-content-center  p-5">
      <h2 className="fw-bold mb-3">Welcome Back</h2>

      <div className="mt-4 small text-muted">
        <p className="mb-1">
          Copyright © 2021-{new Date().getFullYear()} QUICK ALGO+. All rights reserved.
        </p>
      </div>
    </div>

    {/* RIGHT SIDE */}
    <div className="col-md-6 d-flex align-items-center justify-content-center">
      <div className="card  w-100 mx-auto login-card">
        <div className="card-body p-4">

          <h4 className="text-center mb-4">Sign In</h4>

          {/* Toggle (hidden like your original) */}
          <div className="btn-group w-100 mb-3 d-none">
            <button
              type="button"
              className={`btn btn-outline-primary ${loginMode === "username" ? "active" : ""}`}
              onClick={() => setLoginMode("username")}
            >
              Username
            </button>
            <button
              type="button"
              className={`btn btn-outline-primary ${loginMode === "mobile" ? "active" : ""}`}
              onClick={() => setLoginMode("mobile")}
            >
              Mobile OTP
            </button>
          </div>

          <form onSubmit={handleSubmit}>

            {loginMode === "username" ? (
              <>
                {/* Username */}
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <IconRegistry name="user" />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Username"
                      name="Username"
                      value={formData?.Username}
                      onChange={handleChange}
                    />
                  </div>
                  {formErrors?.Username && (
                    <div className="text-danger small">
                      {formErrors?.Username}
                    </div>
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
                      name="Password"
                      value={formData?.Password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                      <IconRegistry
                        name={isPasswordVisible ? "eye" : "eye-low-vision"}
                      />
                    </button>
                  </div>
                  {formErrors?.Password && (
                    <div className="text-danger small">
                      {formErrors?.Password}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="mb-3 d-none">
                <label className="form-label">Mobile Number</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <IconRegistry name="user" />
                  </span>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Enter 10-digit mobile number"
                    name="MobileNo"
                    value={formData?.MobileNo}
                    onChange={handleChange}
                    maxLength="10"
                  />
                </div>
                {formErrors?.MobileNo && (
                  <div className="text-danger small">
                    {formErrors?.MobileNo}
                  </div>
                )}
              </div>
            )}

            {/* Remember */}
            <div className="form-check mb-3">
              <input className="form-check-input" type="checkbox" id="remember" />
              <label className="form-check-label" htmlFor="remember">
                Remember Me
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? (
                <ButtonLoader isloading />
              ) : loginMode === "username" ? (
                "SEND OTP"
              ) : (
                "Send OTP"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-3 small">
            <p className="text-muted mb-2">
              By clicking <strong>SEND OTP</strong> you agree to{" "}
              <a
                href="https://github.com/QuickAlgoPlus/quickalgoplus_agreements/blob/main/TermsOfService.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>
            </p>

            <p>
              Don't have an account?{" "}
              <NavLink to="/signup">Register Now</NavLink>
            </p>
          </div>

        </div>
      </div>
    </div>

  </div>

  <CookieConsent />
</div>
  );
};

export default Login;
