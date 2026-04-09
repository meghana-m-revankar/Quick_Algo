import React, { useState } from "react";
import { Row, Col, Tab, Nav, Breadcrumb, Button, Tabs } from "react-bootstrap";
import SupportTicket from "./supportTicket";
import useFaq from "./faq";
import "./faq.scss";

const Faq = () => {
  const {
    helpCategories,
    helpStructure,
    loading,
    categoriesLoading,
    fetchHelpStructureForCategory,
  } = useFaq();
  const [activeCategory, setActiveCategory] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState("layer-0");
  const [currentPath, setCurrentPath] = useState([]);

  // Set default active category when helpCategories are loaded
  React.useEffect(() => {
    if (helpCategories && helpCategories.length > 0) {
      setActiveCategory(helpCategories[0]?.id?.toString() || "");
    }
  }, [helpCategories]);

  // Update helpStructure when activeCategory changes
  React.useEffect(() => {
    if (activeCategory) {
      fetchHelpStructureForCategory(parseInt(activeCategory));
    }
  }, [activeCategory, fetchHelpStructureForCategory]);

  const handleCardClick = (cardTitle) => {
    setSelectedCard(cardTitle);
    setCurrentPath([]);
  };

  // Get current layer data based on navigation path
  const getCurrentLayerData = (categoryKey, cardTitle, path = []) => {
    const category = helpCategories.find(
      (cat) => cat.id.toString() === categoryKey
    );
    if (!category) return null;

    const cardData = helpStructure[selectedCard];
    if (!cardData || !cardData.layers || !Array.isArray(cardData.layers)) {
      return null;
    }

    const currentLayerIndex = path.length;
    if (currentLayerIndex >= cardData.layers.length) {
      return null;
    }

    const layerData = cardData.layers[currentLayerIndex];
    return layerData;
  };

  // Handle option selection with nested navigation
  const handleOptionSelect = (option) => {
    if (currentPath.includes(option)) {
      return;
    }

    const newPath = [...currentPath, option];
    setCurrentPath(newPath);

    const cardData = helpStructure[selectedCard];
    if (cardData && cardData.layers) {
      const currentLayerIndex = newPath.length;
      if (currentLayerIndex < cardData.layers.length) {
        setActiveDetailTab(`layer-${currentLayerIndex}`);
      } else {
        setActiveDetailTab(`final`);
      }
    }
  };

  // Handle option deselection (remove from path)
  const handleOptionDeselect = (option) => {
    const optionIndex = currentPath.indexOf(option);
    if (optionIndex !== -1) {
      const newPath = currentPath.slice(0, optionIndex);
      setCurrentPath(newPath);

      if (newPath.length === 0) {
        setActiveDetailTab("layer-0");
      } else {
        setActiveDetailTab(`layer-${newPath.length}`);
      }
    }
  };

  // Navigate back in the path
  const handleBackNavigation = () => {
    if (currentPath.length > 0) {
      const newPath = currentPath.slice(0, -1);
      setCurrentPath(newPath);
      if (newPath.length === 0) {
        setActiveDetailTab("layer-0");
      } else {
        setActiveDetailTab(`layer-${newPath.length}`);
      }
    }
  };

  // Handle breadcrumb navigation to specific layer
  const handleBreadcrumbNavigation = (targetIndex) => {
    if (targetIndex === -1) {
      setSelectedCard(null);
      setCurrentPath([]);
      setActiveDetailTab("layer-0");
    } else if (targetIndex === 0) {
      setCurrentPath([]);
      setActiveDetailTab("layer-0");
    } else {
      const newPath = currentPath.slice(0, targetIndex);
      setCurrentPath(newPath);
      setActiveDetailTab(`layer-${newPath.length}`);
    }
  };

  // Drill-down detail view with nested layers
  const renderDetailView = (categoryKey) => {
    const category = helpCategories.find(
      (cat) => cat.id.toString() === categoryKey
    );
    if (!category) return null;

    if (!selectedCard) {
      return (
        <div className="faq-detail-view">
          <div className="placeholder-message">
            <h4>Select a help topic</h4>
            <p>Please select a help topic from the list to view details.</p>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="faq-detail-view">
          <div className="placeholder-message">
            <h4>Loading...</h4>
            <p>Please wait while we load the content.</p>
          </div>
        </div>
      );
    }

    const cardData = helpStructure[selectedCard];
    if (!cardData) {
      return (
        <div className="faq-detail-view">
          <div className="placeholder-message">
            <h4>No content available</h4>
            <p>This help item doesn't have any content yet.</p>
          </div>
        </div>
      );
    }

    if (
      cardData.layers &&
      Array.isArray(cardData.layers) &&
      cardData.layers.length > 0
    ) {
      return (
        <div className="faq-detail-view">
          <Breadcrumb className="faq-breadcrumb">
            <Breadcrumb.Item href="#" onClick={(e) => e.preventDefault()}>
              Help Center
            </Breadcrumb.Item>
            <Breadcrumb.Item
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleBreadcrumbNavigation(-1);
              }}
            >
              {category.name}
            </Breadcrumb.Item>
            <Breadcrumb.Item
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleBreadcrumbNavigation(0);
              }}
            >
              {selectedCard}
            </Breadcrumb.Item>
            {currentPath.map((option, index) => (
              <Breadcrumb.Item
                key={`path-${index}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleBreadcrumbNavigation(index + 1);
                }}
              >
                {option}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>

          <div className="detail-header-actions">
            <div className="action-buttons">
              {currentPath.length > 0 && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleBackNavigation}
                  className="back-button"
                >
                  ← Back
                </Button>
              )}
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  handleBreadcrumbNavigation(-1);
                }}
              >
                ✕ Close
              </Button>
            </div>
          </div>

          {(() => {
            const currentLayerData = getCurrentLayerData(
              categoryKey,
              selectedCard,
              currentPath
            );

            const isAtFinalLayer = currentPath.length >= cardData.layers.length;

            if (!currentLayerData && !isAtFinalLayer) {
              return (
                <div className="faq-layer-selection">
                  <div className="placeholder-message">
                    <h4>No options available</h4>
                    <p>This level doesn't have any selectable options.</p>
                  </div>
                </div>
              );
            }

            if (isAtFinalLayer) {
              const lastSelectedOption = currentPath[currentPath.length - 1];
              const lastLayerData = cardData.layers[cardData.layers.length - 1];

              if (
                lastLayerData &&
                lastLayerData.optionDescriptions &&
                lastLayerData.optionDescriptions[lastSelectedOption]
              ) {
                return (
                  <div className="faq-layer-selection">
                    <div className="option-description">
                      <div>
                        <h5>{lastSelectedOption}</h5>
                        <div
                          dangerouslySetInnerHTML={{
                            __html:
                              lastLayerData.optionDescriptions[
                                lastSelectedOption
                              ],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="faq-layer-selection">
                    <div className="placeholder-message">
                      <h4>No description available</h4>
                      <p>
                        This option doesn't have a detailed description yet.
                      </p>
                    </div>
                  </div>
                );
              }
            }

            return (
              <>
                {!currentLayerData.optionDescriptions ||
                !currentLayerData.optionDescriptions[
                  currentPath[currentPath.length - 1]
                ] ? (
                  <div className="options-grid">
                    {currentLayerData.options.map((option, i) => {
                      const isInPath = currentPath.includes(option);

                      return (
                        <div
                          key={`option-${i}`}
                          className={`option-card ${
                            isInPath ? "is-selected" : ""
                          }`}
                          onClick={() => {
                            if (isInPath) {
                              handleOptionDeselect(option);
                            } else {
                              handleOptionSelect(option);
                            }
                          }}
                        >
                          {option}
                          {isInPath && <span className="option-status"></span>}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {currentPath.length > 0 &&
                  currentLayerData.optionDescriptions &&
                  currentLayerData.optionDescriptions[
                    currentPath[currentPath.length - 1]
                  ] && (
                    <div className="option-description">
                      <div>
                        <h5>{currentPath[currentPath.length - 1]}</h5>
                        <div
                          dangerouslySetInnerHTML={{
                            __html:
                              currentLayerData.optionDescriptions[
                                currentPath[currentPath.length - 1]
                              ],
                          }}
                        />
                      </div>
                    </div>
                  )}
              </>
            );
          })()}
        </div>
      );
    }

    if (cardData.description) {
      return (
        <div className="faq-detail-view">
          <Breadcrumb className="faq-breadcrumb">
            <Breadcrumb.Item href="#" onClick={(e) => e.preventDefault()}>
              Help Center
            </Breadcrumb.Item>
            <Breadcrumb.Item
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleBreadcrumbNavigation(-1);
              }}
            >
              {category.name}
            </Breadcrumb.Item>
            <Breadcrumb.Item
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleBreadcrumbNavigation(0);
              }}
            >
              {selectedCard}
            </Breadcrumb.Item>
          </Breadcrumb>

          <div className="detail-header-actions">
            <div className="action-buttons">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setSelectedCard(null);
                  setCurrentPath([]);
                }}
              >
                ← Back to {category.name}
              </Button>
            </div>
          </div>

          <div className="detail-content">
            <div className="option-description">
              <div>
                <h5>{selectedCard}</h5>
                <div
                  dangerouslySetInnerHTML={{
                    __html: cardData.description,
                  }}
                />
                {cardData.video_link && (
                  <div className="video-link">
                    <a
                      href={cardData.video_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Watch Video Tutorial
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="faq-detail-view">
        <div className="placeholder-message">
          <h4>No content available</h4>
          <p>This help item doesn't have any content yet.</p>
        </div>
      </div>
    );
  };

  const renderCardGrid = (categoryKey) => {
    const category = helpCategories.find(
      (cat) => cat.id.toString() === categoryKey
    );
    if (!category) return null;

    if (loading && categoryKey === activeCategory) {
      return (
        <div className="help-grid">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading help content...</p>
          </div>
        </div>
      );
    }

    if (!helpStructure || Object.keys(helpStructure).length === 0) {
      return (
        <div className="help-grid">
          <div className="empty-state">
            <h3>No help content available</h3>
            <p>This category doesn't have any help content yet.</p>
          </div>
        </div>
      );
    }

    const cardTitles = Object.keys(helpStructure);

    return (
      <div className="help-grid">
        {cardTitles.map((title) => (
          <div
            key={title}
            className="help-card"
            onClick={() => handleCardClick(title)}
          >
            <div className="card-header">
              <div className="help-icon">
                <i className="fas fa-file-text"></i>
              </div>
              <div className="help-info">
                <h3 className="help-title">{title}</h3>
                <div className="help-badge">
                  <i className="fas fa-book"></i>
                  <span>Help Guide</span>
                </div>
              </div>
            </div>

            <div className="card-body">
              <div className="help-details">
                {helpStructure[title]?.description && (
                  <div className="detail-item">
                    <i className="fas fa-search"></i>
                    <span className="detail-label">Description</span>
                    <span className="detail-value">
                      {helpStructure[title].description.substring(0, 100)}...
                    </span>
                  </div>
                )}
                <div className="detail-item">
                  <i className="fas fa-check-circle"></i>
                  <span className="detail-label">Status</span>
                  <span className="detail-value status-available">
                    Available
                  </span>
                </div>
              </div>
            </div>

            <div className="card-footer">
              <button className="btn btn-primary btn-view">
                <i className="fas fa-arrow-right"></i>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="content faq_page">
      <div className="card-box card-height">
        <div className="page-header">
          <div className="header-left">
            <div className="header-icon">
              <i className="fas fa-question-circle"></i>
            </div>
            <div className="header-text">
              <h1 className="page-title">Help Center</h1>
              <p className="page-subtitle">
                Find answers to your questions and get support
              </p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <i className="fas fa-book"></i>
              <span className="stat-number">
                {helpCategories?.length || 0}
              </span>
              <span className="stat-label">Categories</span>
            </div>
            <div className="stat-item">
              <i className="fas fa-file-text"></i>
              <span className="stat-number">
                {helpStructure ? Object.keys(helpStructure).length : 0}
              </span>
              <span className="stat-label">Articles</span>
            </div>
          </div>
        </div>

        <div className="box-body tab_content">
          <Tabs
            defaultActiveKey="help-center"
            id="faq-tabs"
            className="faq-tabs"
          >
            <Tab
              eventKey="help-center"
              title={
                <div className="tab-title">
                  <i className="fas fa-question-circle"></i>
                  <span>Help Center</span>
                  <span className="tab-count">
                    ({helpCategories?.length || 0})
                  </span>
                </div>
              }
            >
              <div className="help-center-wrapper">
                <Tab.Container
                  id="left-tabs-example"
                  activeKey={activeCategory || "loading"}
                  onSelect={(k) => {
                    const key =
                      k ||
                      helpCategories[0]?.id?.toString() ||
                      "loading";
                    setActiveCategory(key);
                    setSelectedCard(null);
                    setCurrentPath([]);
                  }}
                >
                  <Row>
                    <Col xs={12} sm={12} md={12} lg={9} xl={9}>
                      <div className="tab-content-container">
                        <Tab.Content>
                          {helpCategories &&
                          helpCategories.length > 0 ? (
                            helpCategories.map((category) => (
                              <Tab.Pane
                                key={category.id}
                                eventKey={category.id.toString()}
                              >
                                <div className="common-tab-content">
                                  {selectedCard
                                    ? renderDetailView(
                                        category.id.toString()
                                      )
                                    : renderCardGrid(
                                        category.id.toString()
                                      )}
                                </div>
                              </Tab.Pane>
                            ))
                          ) : (
                            <Tab.Pane eventKey="loading">
                              <div className="common-tab-content">
                                <div className="loading-state">
                                  {categoriesLoading ? (
                                    <>
                                      <div className="loading-spinner"></div>
                                      <p>Loading Help Categories...</p>
                                    </>
                                  ) : (
                                    <div className="empty-state">
                                      <h3>No Help Categories Available</h3>
                                      <p>Unable to load help content. Please check your connection and try again.</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Tab.Pane>
                          )}
                        </Tab.Content>
                      </div>
                    </Col>
                    <Col xs={12} sm={12} md={12} lg={3} xl={3}>
                      <div className="right-nav-container">
                        <Nav variant="pills">
                          {helpCategories &&
                          helpCategories.length > 0 ? (
                            helpCategories.map((category) => (
                              <Nav.Item key={category.id}>
                                <Nav.Link
                                  eventKey={category.id.toString()}
                                  className="category-nav-link"
                                >
                                  <div className="category-nav-content">
                                    {category.image && (
                                      <img
                                        src={category.image}
                                        alt={category.name}
                                        className="category-nav-image"
                                      />
                                    )}
                                    <span className="category-nav-title">
                                      {category.name}
                                      <p>{category.tag}</p>
                                    </span>
                                  </div>
                                </Nav.Link>
                              </Nav.Item>
                            ))
                          ) : (
                            <Nav.Item>
                              <Nav.Link eventKey="loading" disabled>
                                <div className="category-nav-content">
                                  <span className="category-nav-title">
                                    {categoriesLoading ? 'Loading...' : 'No data available'}
                                  </span>
                                </div>
                              </Nav.Link>
                            </Nav.Item>
                          )}
                        </Nav>
                      </div>
                    </Col>
                  </Row>
                </Tab.Container>
              </div>
            </Tab>

            <Tab
              eventKey="support-tickets"
              title={
                <div className="tab-title">
                  <i className="fas fa-comments"></i>
                  <span>Support Tickets</span>
                  <span className="tab-count">(1)</span>
                </div>
              }
            >
              <SupportTicket />
            </Tab>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default Faq;
