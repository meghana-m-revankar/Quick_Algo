import { IconRegistry } from "#components";
import React from "react";
import useProfile from "./profile";
import "./profile.scss";
import { FaRegUser } from "react-icons/fa";
import { RiBuildingLine } from "react-icons/ri";
import { MdSecurity, MdComputer } from "react-icons/md";
import { BsGlobe } from "react-icons/bs";
import { UAParser } from "ua-parser-js";
import { useMemo } from "react";

const Profile = () => {
  const { browser, os } = useMemo(() => UAParser(), []);

  const {
    userDetail,
    companyDetails,
    handleLogout,
    loginTime,
    clearWebsiteCache,
  } = useProfile();

  return (
    <section className="content profile_page">
      <div className="profile-container">
        <div className="profile-content">
          {/* Active Sessions Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2 className="section-title">
                <MdSecurity />
                Active Session
              </h2>
              <p className="section-subtitle">
                Manage your active sessions and devices
              </p>
            </div>

            <div className="profile-card">
              <div className="sessions-container">
                <div className="session-card">
                  <div className="session-info">
                    <div className="device-icon">
                      <MdComputer />
                    </div>
                    <div className="session-details">
                      <div className="device-name">
                        {os.name} {os.version}
                      </div>
                      <div className="browser-info">
                        <BsGlobe className="browser-icon" />
                        {browser.name} | Last Login: {loginTime}
                      </div>
                    </div>
                  </div>
                  <div className="session-actions">
                    <span className="current-session-badge">Current</span>

                    <button
                      className="logout-btn"
                      onClick={() => handleLogout()}
                    >
                      Log out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2 className="section-title">
                <IconRegistry name="user" />
                Personal Information
              </h2>
            </div>

            <div className="profile-card">
              <div className="profile-avatar">
                <div className="avatar-placeholder">
                  <FaRegUser size={25} color="white" />
                </div>
                <div className="info-item">
                  {/* <label>Account Status</label> */}
                  <span className="status-badge status-active">Active</span>
                </div>
              </div>

              <div className="profile-info">
                <div className="info-grid">
                  <div className="info-item">
                    <label>Full Name</label>
                    <p>{userDetail?.fullName}</p>
                  </div>
                  <div className="info-item">
                    <label>Email Address</label>
                    <p>{userDetail?.emailid}</p>
                  </div>
                  <div className="info-item">
                    <label>Phone Number</label>
                    <p>{userDetail?.mobileNo}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Details Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2 className="section-title">
                <RiBuildingLine />
                Company Information
              </h2>
            </div>

            <div className="profile-card">
              <div className="company-info">
                <div className="company-logo">
                  <div className="logo-placeholder">
                    <img src={companyDetails?.companyLogo} alt="company-logo" />
                  </div>
                </div>

                <div className="info-grid">
                  <div className="info-item">
                    <label>Company Name</label>
                    <p>{companyDetails?.companyName}</p>
                  </div>

                  <div className="info-item">
                    <label>CIN</label>
                    <p>{companyDetails?.cin}</p>
                  </div>
                  <div className="info-item">
                    <label>GSTIN</label>
                    <p>{companyDetails?.gstn}</p>
                  </div>
                  <div className="info-item">
                    <label>Company Address</label>
                    <p>{companyDetails?.addressStreet}</p>
                  </div>
                  <div className="info-item">
                    <label>ISO Certication No.</label>
                    <p>{companyDetails?.isoCertificateNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          {/* <div className="profile-section">
            <div className="section-header">
              <h2 className="section-title">
                <i className="fas fa-shield-alt"></i>
                Security Settings
              </h2>
            </div>

            <div className="profile-card">
              <div className="security-settings">
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <div className="setting-action">
                    <span className="status-badge status-danger">Disabled</span>
                    <button className="btn btn-outline">Enable</button>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Login Notifications</h4>
                    <p>Get notified when someone logs into your account</p>
                  </div>
                  <div className="setting-action">
                    <span className="status-badge status-active">Enabled</span>
                    <button className="btn btn-outline">Disable</button>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Password</h4>
                    <p>Last changed 30 days ago</p>
                  </div>
                  <div className="setting-action">
                    <button className="btn btn-outline">Change Password</button>
                  </div>
                </div>
              </div>
            </div>
          </div> */}

          {/* Cache Management Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2 className="section-title">
                <i className="fas fa-broom"></i>
                Cache Management
              </h2>
              <p className="section-subtitle">
                Clear website cache to resolve issues
              </p>
            </div>

            <div className="profile-card">
              <div className="cache-settings">
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Clear Website Cache</h4>
                    <p>Clear browser cache, localStorage, and sessionStorage</p>
                  </div>
                  <div className="setting-action">
                    <button
                      className="btn btn-warning"
                      onClick={clearWebsiteCache}
                    >
                      <i className="fas fa-trash"></i>
                      Clear Cache
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;
