import { IconRegistry } from "#components";
import React, { useEffect, useState, useRef } from "react";
import useHeader from "./header";
import "./header.scss";
import { Dropdown } from "react-bootstrap";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

const Header = () => {
  const {
    companyDetails,
    handleLogout,
    toggleSwitch,
    isOn,
    userName,
    unreadNotification,
  } = useHeader();
  const navigate = useNavigate();

  const navRef = useRef();
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [readNotifications, setReadNotifications] = useState(new Set());

  const showNavbar = () => {
    navRef.current.classList.toggle("open");
  };

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle chart icon click
  const handleChartClick = () => {
    if (location.pathname === "/chart") {
      // If already on chart page, go back to dashboard
      navigate("/dashboard");
    } else {
      // Navigate to chart page
      navigate("/chart");
    }
  };

  // Handle strategy description navigation
  const handleStrategyClick = (e, itemName) => {
    e.preventDefault();
    if (itemName === "Strategy Description") {
      // Always use strategy ID 7 as default
      window.location.href = "/strategy/7";
    }
  };

  useEffect(() => {
    if (navRef.current?.classList.contains("open")) {
      navRef.current.classList.remove("open");
    }
  }, [location]);

  // Handle dropdown hover with delay
  const handleDropdownEnter = (categoryName) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setActiveDropdown(categoryName);
  };

  const handleDropdownLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 300); // 300ms delay before closing
  };

  // Function to calculate dropdown position
  const getDropdownPosition = (categoryName) => {
    const dropdownElement = document.querySelector(
      `[data-category="${categoryName}"]`,
    );
    if (!dropdownElement) return "left";

    const rect = dropdownElement.getBoundingClientRect();
    const screenWidth = window.innerWidth;

    // If dropdown would go off right side, position it to the right
    if (rect.left + 300 > screenWidth) {
      return "right";
    }

    // If dropdown would go off left side, position it to the left
    if (rect.left < 0) {
      return "left";
    }

    return "left";
  };

  // Clear timeout when component unmounts
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Navigation categories with icons and pages
  const navigationCategories = [
    {
      name: "Dashboard",
      icon: <IconRegistry name="dashboard" />,
      path: "/dashboard",
      single: true,
    },
       {
      name: "Option Chain",
      icon: <IconRegistry name="add" />,
      path: "/option-chain",
      single: true,
    },
     {
       name: "Orders",
     icon: <IconRegistry name="assignment" />,
      path: "/order/active",
      single: true,
     }, 
    {
      name: "Broker",
      icon: <IconRegistry name="account-balance" />,
      path: "/broker",
      single: true,
    },
       {
      name: "Algo-Setup",
      icon: <IconRegistry name="add" />,
      path: "/algo",
      single: true,
    },
  /*   {
      name: "Learning",
      icon: <IconRegistry name="school" />,
      items: [
       {
          name: "Learning Center",
          path: "/learning-center",
          icon: <IconRegistry name="school" />,
        }, 
         {
           name: "Create Strategy",
           path: "/create-strategy",
          icon: <IconRegistry name="add" />,
         },

        {
          name: "Strategy Description",
          path: "/strategy",
          icon: <IconRegistry name="psychology" />,
        },
         {
           name: "API Docs",
           path: "/api-docs",
           icon: <IconRegistry name="api" />,
         },
      ],
    }, */
/*     {
      name: "Strategy-Algo",
      icon: <IconRegistry name="add" />,
      path: "/strategy-list",
      single: true,
    }, */
  /*   {
      name: "Back Test",
      icon: <IconRegistry name="auto-graph" />,
      path: "/backtest",
      single: true,
    },
    {
      name: "Broker",
      icon: <IconRegistry name="account-balance" />,
      path: "/broker",
      single: true,
    }, */
    // {
    //   name: "Orders",
    //   icon: <IconRegistry name="assignment" />,
    //   path: "/order/active",
    //   single: true,
    // },
    // {
    //   name: "Logs",
    //   icon: <IconRegistry name="history" />,
    //   path: "/logs/active",
    //   single: true,
    // },
/*     {
      name: "News",
      icon: <IconRegistry name="article" />,
      path: "/news",
      single: true,
    }, */
/*     {
      name: "FAQ",
      icon: <IconRegistry name="help" />,
      path: "/faq",
      single: true,
    }, */
  
  ];

  // Button New Data
  const [plansOpen, setPlansOpen] = useState(false);
  const handlePlansToggle = () => {
    const isPlansOpen = location.pathname.includes("/plans");

    if (isPlansOpen) {
      navigate(-1); // CLOSE → go back
    } else {
      navigate("/plans"); // OPEN
    }
  };

  return (
    <div className="header-deshboard-main">
      <div className="header-container">
        {/* Logo Section */}
        <div className="logo-section">
          <NavLink to="/dashboard" className="logo">
            <img src={companyDetails?.companyLogo} alt="logo" />
          </NavLink>
        </div>

        {/* Main Navigation */}
        <nav className="main-navigation">
          <ul className="nav-list">
            {navigationCategories.map((category, index) => (
              <li key={index} className="nav-item-wrapper">
                {category.single ? (
                  <NavLink
                    to={category.path}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? "active" : ""}`
                    }
                  >
                    {category.name}
                  </NavLink>
                ) : (
                  <div
                    className={`nav-dropdown ${
                      activeDropdown === category.name ? "active" : ""
                    }`}
                    onMouseEnter={() => handleDropdownEnter(category.name)}
                    onMouseLeave={handleDropdownLeave}
                    data-category={category.name}
                  >
                    <button className="nav-item dropdown-trigger">
                      {category.name}
                      <IconRegistry
                        name="chevron-down"
                        className="dropdown-arrow"
                      />
                    </button>

                    {activeDropdown === category.name && (
                      <div
                        className={`dropdown-menu-custom dropdown-${getDropdownPosition(
                          category.name,
                        )}`}
                        onMouseEnter={() => handleDropdownEnter(category.name)}
                        onMouseLeave={handleDropdownLeave}
                      >
                        <div className="dropdown-header">
                          <span className="dropdown-title">
                            {category.name}
                          </span>
                        </div>
                        <div className="dropdown-items">
                          {category.items.map((item, itemIndex) =>
                            item.name === "Strategy Description" ? (
                              <button
                                key={itemIndex}
                                className="dropdown-item"
                                onClick={(e) => {
                                  handleStrategyClick(e, item.name);
                                  setActiveDropdown(null);
                                }}
                              >
                                <span className="item-icon">{item.icon}</span>
                                <span className="item-name">{item.name}</span>
                              </button>
                            ) : (
                              <NavLink
                                key={itemIndex}
                                to={item.path}
                                className="dropdown-item"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <span className="item-icon">{item.icon}</span>
                                <span className="item-name">{item.name}</span>
                              </NavLink>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Side Actions */}
        <div className="header-actions">
          {/* Mobile Chart Icon  */}
          {isMobile && (
            <div className="action-item mobile-chart-icon">
           {/*    <button
                className="action-button chart-button"
                onClick={handleChartClick}
                title={
                  location.pathname === "/chart"
                    ? "Close Charts"
                    : "Open Charts"
                }
              >
                {location.pathname === "/chart" ? (
                  <IconRegistry name="times" />
                ) : (
                  <IconRegistry name="chart" />
                )}
              </button> */}
            </div>
          )}

          {/* Plans */}
          {/* <div className="action-item">
            <NavLink
              to="/plans"
              className="action-button plans-button"
              title="Plans"
            >
              <IconRegistry name="dollar-sign" />
            </NavLink>
          </div> */}

          {/* Notification */}
          {/* <div className="action-item">
            <Dropdown>
              <Dropdown.Toggle className="action-button notification-button">
                {unreadNotification?.length > 0 ? (
                  <>
                    <div className="notification-icon-wrapper">
                      <IconRegistry
                        name="settings"
                        className="notification-gear-icon"
                      />
                      <span className="notification-pulse"></span>
                    </div>
                  </>
                ) : (
                  <IconRegistry name="notifications" />
                )}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {unreadNotification?.length > 0 ? (
                  <div className="notification-list">
                    {unreadNotification?.map((v, k) => {
                      const isRead = readNotifications.has(v?.id || k);
                      return (
                        <Dropdown.Item
                          key={v?.id || k}
                          className={`notification-item ${
                            isRead ? "read" : "unread"
                          }`}
                          onClick={() => {
                            // Mark notification as read
                            const notificationId = v?.id || k;
                            setReadNotifications((prev) =>
                              new Set(prev).add(notificationId)
                            );
                          }}
                        >
                          <p>{v?.notificationSubject}</p>
                          <span>{v?.activityDescription}</span>
                        </Dropdown.Item>
                      );
                    })}
                  </div>
                ) : (
                  <Dropdown.Item>No notifications</Dropdown.Item>
                )}
                <Dropdown.Divider />
                <Dropdown.Item>
                  <NavLink to="/notifications">View All</NavLink>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>*/}

          {/* User Profile */}
          <div className="action-item">
            <Dropdown>
              <Dropdown.Toggle className="action-button user-button text-success">
                <span className="user-name">{userName}</span>
                <IconRegistry name="user" className="text-success" />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {/* <div className="user-menu-header">
                  <div className="dark-mode-toggle">
                    <span>{isOn ? "☀️ Light Mode" : "🌙 Dark Mode"}</span>
                    <div
                      className={`toggle-switch ${isOn ? "on" : "off"}`}
                      onClick={toggleSwitch}
                    >
                      <div className="toggle-knob"></div>
                    </div>
                  </div>
                </div> */}
                {/* <Dropdown.Divider /> */}
                <Dropdown.Item>
                  <NavLink to="/profile">Profile</NavLink>
                </Dropdown.Item>
               {/*  <Dropdown.Item>
                  <NavLink to="/payment-history">Payment History</NavLink>
                </Dropdown.Item> */}
               {/*  <Dropdown.Item>
                  <NavLink to="/kyc-list">KYC List</NavLink>
                </Dropdown.Item> */}
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-toggle" onClick={showNavbar}>
            <IconRegistry name="bars" />
          </button>

          {/* Mobile Navigation */}
          <div className="mobile-navigation" ref={navRef}>
            <div className="mobile-nav-header">
              <button className="close-menu" onClick={showNavbar}>
                <IconRegistry name="times" />
              </button>
            </div>
            <ul className="mobile-nav-list">
              {navigationCategories.map((category, index) => (
                <li key={index}>
                  {category.single ? (
                    <NavLink
                      to={category.path}
                      className="mobile-nav-item"
                      onClick={showNavbar}
                    >
                      {category.name}
                    </NavLink>
                  ) : (
                    <div className="mobile-nav-dropdown">
                      <button
                        className="mobile-nav-item mobile-dropdown-trigger"
                        onClick={() => {
                          const dropdown = document.querySelector(
                            `.mobile-dropdown-${index}`,
                          );
                          dropdown.classList.toggle("open");
                        }}
                      >
                        {category.name}
                        <IconRegistry
                          name="chevron-down"
                          className="mobile-dropdown-arrow"
                        />
                      </button>
                      <ul
                        className={`mobile-dropdown-menu mobile-dropdown-${index}`}
                      >
                        {category.items.map((item, itemIndex) =>
                          item.name === "Strategy Description" ? (
                            <li key={itemIndex}>
                              <button
                                className="mobile-dropdown-item"
                                onClick={(e) => {
                                  handleStrategyClick(e, item.name);
                                  showNavbar();
                                }}
                              >
                                <span className="mobile-item-icon">
                                  {item.icon}
                                </span>
                                {item.name}
                              </button>
                            </li>
                          ) : (
                            <li key={itemIndex}>
                              <NavLink
                                to={item.path}
                                className="mobile-dropdown-item"
                                onClick={showNavbar}
                              >
                                <span className="mobile-item-icon">
                                  {item.icon}
                                </span>
                                {item.name}
                              </NavLink>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Header);
